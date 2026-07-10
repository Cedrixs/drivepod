import { useState, useEffect, useCallback } from 'react';
import { findFolder, findOrCreateFolder, listSubfolders, listChildren, moveFile } from '../drive/api';
import { archiveGroupLabel } from '../state/archiveRules';
import { PlayIcon, ChevronDownIcon, ChevronUpIcon } from './icons';
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

function formatDate(isoString: string): string {
  return new Date(isoString).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}

export function ArchiveList({ audioFolderId, online, onPlay, onUnarchived }: Props): React.JSX.Element {
  const [groups, setGroups] = useState<DriveFolder[] | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [filesByGroup, setFilesByGroup] = useState<Map<string, ArchivedFile[]>>(new Map());
  const [loadingGroup, setLoadingGroup] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!online) { setGroups([]); setError('Archive indisponible hors-ligne.'); return; }
    let cancelled = false;
    void (async () => {
      try {
        const archiveId = await findFolder('Archive', audioFolderId);
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
        listChildren(group.id, 'audio/mpeg'),
      ]);
      const entries: ArchivedFile[] = rootFiles.map((f) => ({
        file: f, sourceName: '', sourceFolderId: group.id,
      }));
      for (const source of sources) {
        const files = await listChildren(source.id, 'audio/mpeg');
        entries.push(...files.map((f) => ({
          file: f, sourceName: source.name, sourceFolderId: source.id,
        })));
      }
      entries.sort((a, b) => a.file.createdTime.localeCompare(b.file.createdTime));
      setFilesByGroup((m) => new Map(m).set(group.id, entries));
    } catch {
      setError('Erreur de chargement du groupe.');
    } finally {
      setLoadingGroup(null);
    }
  }, [expanded, filesByGroup]);

  const handleUnarchive = useCallback(async (group: DriveFolder, entry: ArchivedFile): Promise<void> => {
    try {
      const destName = entry.sourceName || 'Audio';
      const destId = destName === 'Audio'
        ? audioFolderId
        : await findOrCreateFolder(destName, audioFolderId);
      await moveFile(entry.file.id, entry.sourceFolderId, destId);
      setFilesByGroup((m) => {
        const next = new Map(m);
        next.set(group.id, (next.get(group.id) ?? []).filter((e) => e.file.id !== entry.file.id));
        return next;
      });
      onUnarchived();
    } catch (err) {
      console.error('Unarchive failed', err);
      setError(`Désarchivage impossible pour ${entry.file.name}`);
    }
  }, [audioFolderId, onUnarchived]);

  if (groups === null) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="pb-4">
      {error && (
        <div className="mx-4 mt-4 p-3 bg-red-500/20 border border-red-500/40 rounded-xl text-red-300 text-sm">
          {error}
        </div>
      )}

      {groups.length === 0 && !error && (
        <div className="flex flex-col items-center justify-center py-16" style={{ color: 'var(--text-3)' }}>
          <p style={{ fontSize: 14 }}>Aucun audio archivé pour le moment</p>
        </div>
      )}

      {groups.map((group) => {
        const isOpen = expanded === group.id;
        const entries = filesByGroup.get(group.id);
        return (
          <div key={group.id} className="border-b border-border-1">
            <button
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
                <div className="flex justify-center py-6">
                  <div className="w-5 h-5 border-2 border-accent border-t-transparent rounded-full animate-spin" />
                </div>
              ) : (
                (entries ?? []).map((entry, i, all) => (
                  <div key={entry.file.id} className="flex items-center gap-3 px-4 py-2.5 hover:bg-surface-2 transition-colors">
                    <button
                      onClick={() => onPlay(entry.file, all.map((e) => e.file), i)}
                      className="w-9 h-9 flex items-center justify-center rounded-full flex-shrink-0"
                      style={{ background: 'var(--surface-3)', color: 'var(--text-1)', border: 'none', cursor: 'pointer' }}
                      title="Écouter"
                    >
                      <PlayIcon size={14} />
                    </button>
                    <div className="flex-1 min-w-0">
                      <p className="truncate" style={{ fontFamily: 'var(--font-sans)', fontSize: 14, fontWeight: 500, color: 'var(--text-1)', margin: 0 }}>
                        {entry.file.name.replace(/\.mp3$/i, '')}
                      </p>
                      <p style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-3)', margin: 0 }}>
                        {entry.sourceName ? `${entry.sourceName} · ` : ''}{formatDate(entry.file.createdTime)}
                      </p>
                    </div>
                    <button
                      onClick={() => void handleUnarchive(group, entry)}
                      style={{
                        fontFamily: 'var(--font-sans)', fontSize: 12, color: 'var(--text-3)',
                        background: 'none', border: 'none', cursor: 'pointer', flexShrink: 0, padding: '6px 4px',
                      }}
                      title="Remettre dans son dossier d'origine"
                    >
                      Désarchiver
                    </button>
                  </div>
                ))
              )
            )}
          </div>
        );
      })}
    </div>
  );
}
