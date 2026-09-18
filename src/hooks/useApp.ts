import { useState, useEffect, useCallback, useRef } from 'react';
import { isAuthenticated, handleOAuthCallback, type OAuthCallbackResult } from '../auth/auth';
import { listChildren, listSubfolders, findOrCreateFolder, getRootFolderId, AUDIO_MIME } from '../drive/api';
import { isDriveApiError } from '../drive/client';
import { createArchiveResolver, archiveOne, ARCHIVE_FOLDER_NAME } from '../drive/archive';
import { initStateSync, setAudioFolderId } from '../state/driveState';
import { flushOfflineQueue, getPendingQueueCount, queueArchive } from '../offline/queue';
import { getSettings } from '../state/db';
import { autoDownloadOldest, listCachedFilesMeta } from '../offline/cache';
import { isoWeekKey, type BulkCandidate } from '../state/archiveRules';
import type { DriveFile, DriveFolder, Source } from '../drive/types';

export type { Source };

export interface AppState {
  authed: boolean;
  // Premier chargement : rien à afficher encore (spinner plein écran)
  loading: boolean;
  // Rafraîchissement en arrière-plan : la liste reste visible
  refreshing: boolean;
  audioFolderId: string | null;
  sources: Source[];
  activeSourceIndex: number;
  pendingQueueCount: number;
  error: string | null;
}

export interface ArchiveResult {
  ok: number;
  fail: number;
}

export interface AppActions {
  refresh: () => Promise<void>;
  archiveFile: (file: DriveFile, source: Pick<DriveFolder, 'id' | 'name'>) => Promise<void>;
  archiveMany: (items: BulkCandidate[], destWeekKey: string) => Promise<ArchiveResult>;
  setActiveSource: (index: number) => void;
  refreshQueueCount: () => Promise<void>;
}

const AUDIO_FOLDER_NAME = 'Audio';
const OFFLINE_FALLBACK_FOLDER = 'Téléchargés';
// Deux retours de focus rapprochés ne déclenchent qu'un seul rechargement
const FOCUS_REFRESH_MIN_INTERVAL_MS = 15_000;

const initialState: AppState = {
  authed: false,
  loading: true,
  refreshing: false,
  audioFolderId: null,
  sources: [],
  activeSourceIndex: 0,
  pendingQueueCount: 0,
  error: null,
};

// Reconstruit des sources depuis les fichiers téléchargés (IndexedDB + Cache
// API) pour que l'app reste utilisable quand Drive est injoignable.
async function loadCachedSources(): Promise<Source[]> {
  const metas = await listCachedFilesMeta();
  if (metas.length === 0) return [];

  const byFolder = new Map<string, { folderId: string; files: DriveFile[] }>();
  for (const meta of metas) {
    const folderName = meta.sourceFolder || OFFLINE_FALLBACK_FOLDER;
    let group = byFolder.get(folderName);
    if (!group) {
      group = { folderId: meta.sourceFolderId, files: [] };
      byFolder.set(folderName, group);
    }
    group.files.push({
      id: meta.fileId,
      name: meta.name,
      mimeType: AUDIO_MIME,
      parents: meta.sourceFolderId ? [meta.sourceFolderId] : [],
      createdTime: meta.createdTime ?? '',
      modifiedTime: '',
      size: meta.size ? String(meta.size) : undefined,
    });
  }

  return [...byFolder.entries()].map(([name, group]) => ({
    folder: { id: group.folderId, name, parents: [] },
    files: group.files.sort((a, b) => a.createdTime.localeCompare(b.createdTime)),
  }));
}

// Onglets = sous-dossiers de Audio/ (hors Archive) + les MP3 à la racine
async function fetchSources(audioFolderId: string): Promise<Source[]> {
  const [subfolders, rootFiles] = await Promise.all([
    listSubfolders(audioFolderId),
    listChildren(audioFolderId, AUDIO_MIME),
  ]);

  const subSources = await Promise.all(
    subfolders
      .filter((f) => f.name !== ARCHIVE_FOLDER_NAME)
      .map(async (folder) => ({ folder, files: await listChildren(folder.id, AUDIO_MIME) })),
  );

  const sources: Source[] = [];
  if (rootFiles.length > 0) {
    sources.push({ folder: { id: audioFolderId, name: AUDIO_FOLDER_NAME, parents: [] }, files: rootFiles });
  }
  return [...sources, ...subSources];
}

function describeAuthError(result: OAuthCallbackResult): string | null {
  if (result.ok) return null;
  switch (result.error) {
    case 'verifier_missing':
      return 'Connexion interrompue (données PKCE perdues). Réessayez.';
    case 'state_mismatch':
      return 'Erreur de sécurité OAuth (state mismatch). Réessayez.';
    case 'exchange_failed':
      return `Échange de token échoué: ${result.detail ?? ''}. Vérifiez que l'URI de redirection est enregistrée dans Google Cloud Console.`;
    default:
      return null;
  }
}

function isNetworkError(msg: string): boolean {
  return msg === 'REFRESH_TRANSIENT' || msg.includes('Failed to fetch') || msg.includes('NetworkError');
}

function withoutFiles(sources: Source[], ids: ReadonlySet<string>): Source[] {
  return sources.map((src) => ({ ...src, files: src.files.filter((f) => !ids.has(f.id)) }));
}

export function useApp(online: boolean): { state: AppState; actions: AppActions } {
  const [state, setState] = useState<AppState>(initialState);
  const audioFolderIdRef = useRef<string | null>(null);
  const refreshInFlight = useRef(false);
  const lastFocusRefreshAt = useRef(0);

  const refreshQueueCount = useCallback(async (): Promise<void> => {
    const count = await getPendingQueueCount();
    setState((s) => ({ ...s, pendingQueueCount: count }));
  }, []);

  const flushQueueIfNeeded = useCallback(async (): Promise<void> => {
    const count = await getPendingQueueCount();
    if (count === 0) return;
    setState((s) => ({ ...s, pendingQueueCount: count }));
    await flushOfflineQueue();
    await refreshQueueCount();
  }, [refreshQueueCount]);

  const refresh = useCallback(async (): Promise<void> => {
    const audioFolderId = audioFolderIdRef.current;
    if (!audioFolderId || !navigator.onLine || refreshInFlight.current) return;
    refreshInFlight.current = true;
    setState((s) => ({ ...s, refreshing: true, error: null }));
    try {
      const sources = await fetchSources(audioFolderId);
      setState((s) => ({ ...s, sources, refreshing: false }));
    } catch (err) {
      setState((s) => ({ ...s, error: String(err), refreshing: false }));
    } finally {
      refreshInFlight.current = false;
    }
  }, []);

  const init = useCallback(async (): Promise<void> => {
    // Réinitialisation (retour online) : la liste déjà affichée reste en place
    setState((s) => ({ ...s, loading: s.sources.length === 0, refreshing: s.sources.length > 0, error: null }));

    // Démarrage hors-ligne : pas d'appel réseau, on sert les fichiers en cache
    if (!online) {
      if (audioFolderIdRef.current) {
        setState((s) => ({ ...s, loading: false, refreshing: false }));
        return;
      }
      const authed = await isAuthenticated();
      const cached = authed ? await loadCachedSources().catch(() => [] as Source[]) : [];
      setState((s) => ({ ...s, authed, loading: false, refreshing: false, sources: cached }));
      return;
    }

    try {
      const callbackResult = await handleOAuthCallback();
      const authed = callbackResult.ok || await isAuthenticated();

      if (!authed) {
        setState((s) => ({ ...s, authed: false, loading: false, refreshing: false, error: describeAuthError(callbackResult) }));
        return;
      }
      setState((s) => ({ ...s, authed: true }));

      const rootId = await getRootFolderId();
      const audioFolderId = await findOrCreateFolder(AUDIO_FOLDER_NAME, rootId);
      audioFolderIdRef.current = audioFolderId;
      setAudioFolderId(audioFolderId);
      await initStateSync(audioFolderId);

      const sources = await fetchSources(audioFolderId);
      setState((s) => ({ ...s, audioFolderId, sources, loading: false, refreshing: false }));

      await flushQueueIfNeeded();

      const settings = await getSettings();
      if (settings.autoDownload) {
        for (const src of sources) {
          await autoDownloadOldest(src.files, src.folder.name, settings.autoDownloadCount, src.folder.id);
        }
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg === 'NOT_AUTHENTICATED' || msg === 'REFRESH_FAILED') {
        setState((s) => ({ ...s, authed: false, loading: false, refreshing: false }));
      } else if (isNetworkError(msg)) {
        // Google injoignable mais session intacte : mode dégradé sur le cache
        const cached = await loadCachedSources().catch(() => [] as Source[]);
        setState((s) => ({
          ...s,
          loading: false,
          refreshing: false,
          sources: s.sources.length > 0 ? s.sources : cached,
          error: 'Google Drive injoignable pour le moment. Fichiers téléchargés disponibles hors-ligne.',
        }));
      } else if (msg === 'API_NOT_ENABLED' || isDriveApiError(err, 403)) {
        setState((s) => ({
          ...s,
          loading: false,
          refreshing: false,
          error: "Google Drive API non activée. Allez dans Google Cloud Console > APIs & Services > Library > activez « Google Drive API ».",
        }));
      } else {
        setState((s) => ({ ...s, error: msg, loading: false, refreshing: false }));
      }
    }
  }, [online, flushQueueIfNeeded]);

  useEffect(() => { void init(); }, [init]);

  // Actions enregistrées hors-ligne : rejouées au retour du réseau
  useEffect(() => {
    if (online && state.authed) void flushQueueIfNeeded();
  }, [online, state.authed, flushQueueIfNeeded]);

  // Retour sur l'app (focus fenêtre ou onglet redevenu visible) : liste à jour
  useEffect(() => {
    const handler = (): void => {
      if (document.visibilityState !== 'visible') return;
      const now = Date.now();
      if (now - lastFocusRefreshAt.current < FOCUS_REFRESH_MIN_INTERVAL_MS) return;
      lastFocusRefreshAt.current = now;
      void refresh();
    };
    window.addEventListener('focus', handler);
    document.addEventListener('visibilitychange', handler);
    return () => {
      window.removeEventListener('focus', handler);
      document.removeEventListener('visibilitychange', handler);
    };
  }, [refresh]);

  const archiveFile = useCallback(async (
    file: DriveFile,
    source: Pick<DriveFolder, 'id' | 'name'>,
  ): Promise<void> => {
    const audioFolderId = audioFolderIdRef.current;
    if (!audioFolderId) return;

    // Sans dossier d'origine connu, Drive ajouterait un parent sans retirer
    // l'ancien : le fichier apparaîtrait à la fois dans la source et l'archive
    const sourceFolderId = source.id || file.parents[0] || '';
    if (!sourceFolderId) {
      console.warn('Archive skipped: unknown source folder for', file.name);
      return;
    }

    setState((s) => ({ ...s, sources: withoutFiles(s.sources, new Set([file.id])) }));
    const destWeekKey = isoWeekKey(new Date());

    if (!online) {
      await queueArchive({
        type: 'archive', fileId: file.id, fileName: file.name,
        sourceFolder: source.name, sourceFolderId, audioFolderId, destWeekKey,
      });
      await refreshQueueCount();
      return;
    }

    try {
      await archiveOne(createArchiveResolver(audioFolderId), {
        fileId: file.id, sourceFolder: source.name, sourceFolderId, weekKey: destWeekKey,
      });
    } catch (err) {
      console.error('Archive failed', err);
      await refresh();
    }
  }, [online, refresh, refreshQueueCount]);

  // Archivage groupé « articles couverts par la synthèse » : tous les fichiers
  // partent dans Archive/<semaine de la synthèse>/<source>/
  const archiveMany = useCallback(async (
    items: BulkCandidate[],
    destWeekKey: string,
  ): Promise<ArchiveResult> => {
    const audioFolderId = audioFolderIdRef.current;
    if (!audioFolderId || items.length === 0) return { ok: 0, fail: 0 };

    setState((s) => ({ ...s, sources: withoutFiles(s.sources, new Set(items.map((i) => i.file.id))) }));

    if (!online) {
      for (const item of items) {
        await queueArchive({
          type: 'archive',
          fileId: item.file.id,
          fileName: item.file.name,
          sourceFolder: item.sourceFolder,
          sourceFolderId: item.sourceFolderId,
          audioFolderId,
          destWeekKey,
        });
      }
      await refreshQueueCount();
      return { ok: items.length, fail: 0 };
    }

    const resolver = createArchiveResolver(audioFolderId);
    let ok = 0;
    let fail = 0;
    for (const item of items) {
      try {
        await archiveOne(resolver, {
          fileId: item.file.id,
          sourceFolder: item.sourceFolder,
          sourceFolderId: item.sourceFolderId,
          weekKey: destWeekKey,
        });
        ok++;
      } catch (err) {
        console.error('Bulk archive failed for', item.file.name, err);
        fail++;
      }
    }

    if (fail > 0) await refresh();
    return { ok, fail };
  }, [online, refresh, refreshQueueCount]);

  const setActiveSource = useCallback((index: number): void => {
    setState((s) => ({ ...s, activeSourceIndex: index }));
  }, []);

  return {
    state,
    actions: { refresh, archiveFile, archiveMany, setActiveSource, refreshQueueCount },
  };
}
