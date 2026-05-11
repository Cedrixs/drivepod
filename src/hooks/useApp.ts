import { useState, useEffect, useCallback, useRef } from 'react';
import { isAuthenticated, handleOAuthCallback, getAccessToken } from '../auth/auth';
import { listChildren, listSubfolders, findOrCreateFolder } from '../drive/api';
import { initStateSync, setAudioFolderId } from '../state/driveState';
import { flushOfflineQueue, getPendingQueueCount } from '../offline/queue';
import { queueArchive } from '../offline/queue';
import { findOrCreateFolder as createFolder, moveFile } from '../drive/api';
import { removeFromStateAndSync } from '../state/driveState';
import { getSettings } from '../state/db';
import { autoDownloadOldest } from '../offline/cache';
import type { DriveFile, DriveFolder } from '../drive/types';

export interface Source {
  folder: DriveFolder;
  files: DriveFile[];
}

export interface AppState {
  authed: boolean;
  loading: boolean;
  audioFolderId: string | null;
  sources: Source[];
  activeSourceIndex: number;
  pendingQueueCount: number;
  online: boolean;
  error: string | null;
}

const AUDIO_FOLDER_NAME = 'Audio';

export function useApp(online: boolean): {
  state: AppState;
  refresh: () => Promise<void>;
  archiveFile: (fileId: string, fileName: string, sourceFolder: string, sourceFolderId: string) => Promise<void>;
  setActiveSource: (index: number) => void;
  refreshQueueCount: () => Promise<void>;
} {
  const [state, setState] = useState<AppState>({
    authed: false,
    loading: true,
    audioFolderId: null,
    sources: [],
    activeSourceIndex: 0,
    pendingQueueCount: 0,
    online,
    error: null,
  });

  const audioFolderIdRef = useRef<string | null>(null);

  const loadSources = useCallback(async (audioFolderId: string): Promise<void> => {
    const subfolders = await listSubfolders(audioFolderId);
    const nonArchive = subfolders.filter((f) => f.name !== 'Archive');

    const sources: Source[] = await Promise.all(
      nonArchive.map(async (folder) => {
        const files = await listChildren(folder.id, 'audio/mpeg');
        return { folder, files };
      }),
    );

    setState((s) => ({ ...s, sources, loading: false }));
  }, []);

  const init = useCallback(async (): Promise<void> => {
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const callbackHandled = await handleOAuthCallback();
      const authed = callbackHandled || await isAuthenticated();

      if (!authed) {
        setState((s) => ({ ...s, authed: false, loading: false }));
        return;
      }

      setState((s) => ({ ...s, authed: true }));

      const rootResp = await fetch('https://www.googleapis.com/drive/v3/files/root?fields=id', {
        headers: { Authorization: `Bearer ${await getAccessToken()}` },
      });
      const rootData = await rootResp.json() as { id: string };
      const audioFolderId = await findOrCreateFolder(AUDIO_FOLDER_NAME, rootData.id);

      audioFolderIdRef.current = audioFolderId;
      setAudioFolderId(audioFolderId);
      await initStateSync(audioFolderId);

      setState((s) => ({ ...s, audioFolderId }));
      await loadSources(audioFolderId);

      const pendingQueueCount = await getPendingQueueCount();
      setState((s) => ({ ...s, pendingQueueCount }));

      if (online && pendingQueueCount > 0) {
        await flushOfflineQueue();
        const newCount = await getPendingQueueCount();
        setState((s) => ({ ...s, pendingQueueCount: newCount }));
      }

      const settings = await getSettings();
      if (settings.autoDownload) {
        const rawSources = await loadSourcesRaw(audioFolderId);
        for (const src of rawSources) {
          await autoDownloadOldest(src.files, src.folder.name, settings.autoDownloadCount);
        }
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg === 'NOT_AUTHENTICATED' || msg === 'REFRESH_FAILED') {
        setState((s) => ({ ...s, authed: false, loading: false }));
      } else {
        setState((s) => ({ ...s, error: msg, loading: false }));
      }
    }
  }, [online, loadSources]);

  async function loadSourcesRaw(audioFolderId: string): Promise<Source[]> {
    const subfolders = await listSubfolders(audioFolderId);
    const nonArchive = subfolders.filter((f) => f.name !== 'Archive');
    return Promise.all(
      nonArchive.map(async (folder) => {
        const files = await listChildren(folder.id, 'audio/mpeg');
        return { folder, files };
      }),
    );
  }

  useEffect(() => { void init(); }, [init]);

  useEffect(() => {
    if (!online || !state.authed) return;
    void (async () => {
      const count = await getPendingQueueCount();
      if (count > 0) {
        setState((s) => ({ ...s, pendingQueueCount: count }));
        await flushOfflineQueue();
        const newCount = await getPendingQueueCount();
        setState((s) => ({ ...s, pendingQueueCount: newCount }));
      }
    })();
  }, [online, state.authed]);

  useEffect(() => {
    const handler = (): void => { void refresh(); };
    window.addEventListener('focus', handler);
    return () => window.removeEventListener('focus', handler);
  });

  const refresh = useCallback(async (): Promise<void> => {
    if (!audioFolderIdRef.current) return;
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      await loadSources(audioFolderIdRef.current);
    } catch (err) {
      setState((s) => ({ ...s, error: String(err), loading: false }));
    }
  }, [loadSources]);

  const archiveFile = useCallback(async (
    fileId: string,
    fileName: string,
    sourceFolder: string,
    sourceFolderId: string,
  ): Promise<void> => {
    const audioFolderId = audioFolderIdRef.current;
    if (!audioFolderId) return;

    setState((s) => ({
      ...s,
      sources: s.sources.map((src) => ({
        ...src,
        files: src.files.filter((f) => f.id !== fileId),
      })),
    }));

    if (!online) {
      await queueArchive({ type: 'archive', fileId, fileName, sourceFolder, sourceFolderId, audioFolderId });
      const count = await getPendingQueueCount();
      setState((s) => ({ ...s, pendingQueueCount: count }));
      return;
    }

    try {
      const now = new Date();
      const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      const archiveFolderId = await createFolder('Archive', audioFolderId);
      const monthFolderId = await createFolder(monthKey, archiveFolderId);
      const destFolderId = await createFolder(sourceFolder, monthFolderId);
      await moveFile(fileId, sourceFolderId, destFolderId);
      await removeFromStateAndSync(fileId);
    } catch (err) {
      console.error('Archive failed', err);
      await refresh();
    }
  }, [online, refresh]);

  const setActiveSource = useCallback((index: number): void => {
    setState((s) => ({ ...s, activeSourceIndex: index }));
  }, []);

  const refreshQueueCount = useCallback(async (): Promise<void> => {
    const count = await getPendingQueueCount();
    setState((s) => ({ ...s, pendingQueueCount: count }));
  }, []);

  return { state, refresh, archiveFile, setActiveSource, refreshQueueCount };
}
