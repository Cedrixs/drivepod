import { useState, useEffect, useCallback } from 'react';
import { findFolder, findOrCreateFolder, listSubfolders, listChildren, moveFile, AUDIO_MIME } from '../drive/api';
import { ARCHIVE_FOLDER_NAME } from '../drive/archive';
import { archiveGroupLabel } from '../state/archiveRules';
import { formatDate, stripMp3 } from '../lib/format';
import { PlayIcon, ChevronDownIcon, ChevronUpIcon } from './icons';
import { CenteredSpinner, EmptyState, ErrorBox, IconButton } from './primitives';
import type { DriveFile, DriveFolder } from '../drive/types';

interface ArchivedFile {
  file: DriveFile;
  sourceName: string;
  sourceFolderId: string;
}

interface Props {
  audioFolderId: string;
  online: boolean;
  onPlay: (file: DriveFile, queue: DriveFile[], index: number) => void;
  onUnarchived: () => void;
}

export function ArchiveList({ audioFolderId, online, onPlay, onUnarchived }: Props): React.JSX.Element {
  const [groups, setGroups] = useState<DriveFolder[] | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [filesByGroup, setFilesByGroup] = useState<Map<string, ArchivedFile[]>>(new Map());
  const [loadingGroup, setLoadingGroup] = useState<string | null>(null);
  const [unarchiving, setUnarchiving] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!online) { setGroups([]); setError('Archive indisponible hors-ligne.'); return; }
    let cancelled = false;
    void (async () => {
      try {
        const archiveId = await findFolder(ARCHIVE_FOLDER_NAME, audioFolderId);
        if (cancelled) return;
        if (!archiveId) { setGroups([]); return; }
        const subfolders = await listSubfolders(archiveId);
        if (cancelled) return;
        // Tri anté-chronologique : les clés 2026-S28 / 2026-07 se trient
        // lexicographiquement dans l'ordre du temps
        setGroups([...subfolders].sort((a, b) => b.name.localeCompare(a.name)));
      } catch {
        if (!cancelled) { setGroups([]); setError("Impossible de charger l'archive."); }
      }
    })();
    return () => { cancelled = true; };
  }, [audioFolderId, online]);

  const toggleGroup = useCallback(async (group: DriveFolder): Promise<void> => {
    if (expanded === group.id) { setExpanded(null); return; }
    setExpanded(group.id);
    if (filesByGroup.has(group.id)) return;

    setLoadingGroup(group.id);
    try {
      const [sources, rootFiles] = await Promise.all([
        listSubfolders(group.id),
        listChildren(group.id, AUDIO_MIME),
      ]);
      const perSource = await Promise.all(
        sources.map(async (source) => {
          const files = await listChildren(source.id, AUDIO_MIME);
          return files.map((f): ArchivedFile => ({ file: f, sourceName: source.name, sourceFolderId: source.id }));
        }),
      );
      const entries: ArchivedFile[] = [
        ...rootFiles.map((f): ArchivedFile => ({ file: f, sourceName: '', sourceFolderId: group.id })),
        ...perSource.flat(),
      ].sort((a, b) => a.file.createdTime.localeCompare(b.file.createdTime));
      setFilesByGroup((m) => new Map(m).set(group.id, entries));
    } catch {
      setError('Erreur de chargement du groupe.');
    } finally {
      setLoadingGroup(null);
    }
  }, [expanded, filesByGroup]);

  const handleUnarchive = useCallback(async (group: DriveFolder, entry: ArchivedFile): Promise<void> => {
    setUnarchiving(entry.file.id);
    try {
      const destId = entry.sourceName
        ? await findOrCreateFolder(entry.sourceName, audioFolderId)
        : audioFolderId;
      await moveFile(entry.file.id, entry.sourceFolderId, destId);
      setFilesByGroup((m) => {
        const next = new Map(m);
        next.set(group.id, (next.get(group.id) ?? []).filter((e) => e.file.id !== entry.file.id));
        return next;
      });
      onUnarchived();
    } catch (err) {
      console.error('Unarchive failed', err);
      setError(`Désarchivage impossible pour ${stripMp3(entry.file.name)}`);
    } finally {
      setUnarchiving(null);
    }
  }, [audioFolderId, onUnarchived]);

  if (groups === null) return <CenteredSpinner />;

  return (
    <div className="pb-4">
      {error && <ErrorBox>{error}</ErrorBox>}

      {groups.length === 0 && !error && (
        <EmptyState title="Aucun audio archivé pour le moment" />
      )}

      {groups.map((group) => {
        const isOpen = expanded === group.id;
        const entries = filesByGroup.get(group.id);
        return (
          <div key={group.id} className="border-b border-border-1">
            <button
              type="button"
              aria-expanded={isOpen}
              onClick={() => void toggleGroup(group)}
              className="w-full flex items-center justify-between px-4 hover:bg-surface-2 transition-colors"
              style={{ minHeight: 52, background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}
            >
              <span style={{ fontFamily: 'var(--font-sans)', fontSize: 15, fontWeight: 600, color: 'var(--text-1)' }}>
                {archiveGroupLabel(group.name)}
              </span>
              <span style={{ color: 'var(--text-3)', display: 'flex', alignItems: 'center', gap: 8 }}>
                {entries && (
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>{entries.length}</span>
                )}
                {isOpen ? <ChevronUpIcon size={16} /> : <ChevronDownIcon size={16} />}
              </span>
            </button>

            {isOpen && (
              loadingGroup === group.id ? (
                <CenteredSpinner size={20} padding={24} />
              ) : (entries ?? []).length === 0 ? (
                <EmptyState title="Groupe vide" padding={16} />
              ) : (
                (entries ?? []).map((entry, i, all) => {
                  const busy = unarchiving === entry.file.id;
                  return (
                    <div key={entry.file.id} className="flex items-center gap-3 px-4 py-2.5 hover:bg-surface-2 transition-colors" style={{ opacity: busy ? 0.5 : 1 }}>
                      <IconButton
                        label="Écouter"
                        size={36}
                        onClick={() => onPlay(entry.file, all.map((e) => e.file), i)}
                        style={{ borderRadius: 18, background: 'var(--surface-3)', color: 'var(--text-1)' }}
                      >
                        <PlayIcon size={14} />
                      </IconButton>
                      <div className="flex-1 min-w-0">
                        <p className="truncate" style={{ fontFamily: 'var(--font-sans)', fontSize: 14, fontWeight: 500, color: 'var(--text-1)', margin: 0 }}>
                          {stripMp3(entry.file.name)}
                        </p>
                        <p style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-3)', margin: 0 }}>
                          {entry.sourceName ? `${entry.sourceName} · ` : ''}{formatDate(entry.file.createdTime)}
                        </p>
                      </div>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => void handleUnarchive(group, entry)}
                        style={{
                          fontFamily: 'var(--font-sans)', fontSize: 12, color: 'var(--text-3)',
                          background: 'none', border: 'none', cursor: busy ? 'default' : 'pointer', flexShrink: 0, padding: '6px 4px',
                        }}
                        title="Remettre dans son dossier d'origine"
                      >
                        {busy ? 'Déplacement…' : 'Désarchiver'}
                      </button>
                    </div>
                  );
                })
              )
            )}
          </div>
        );
      })}
    </div>
  );
}
