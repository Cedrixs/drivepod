import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { CheckIcon, DotsVIcon } from './icons';
import { downloadForOffline, checkCached } from '../offline/cache';
import { fetchMarkdownContent, extractSummary } from '../drive/api';
import { getAllPlaybackStates } from '../state/db';
import type { DriveFile, PlaybackState } from '../drive/types';

// ── Sort & filter types ──────────────────────────────────────────────────────

type SortKey = 'date-asc' | 'date-desc' | 'duration' | 'progress';
type FilterKey = 'all' | 'not-started' | 'in-progress' | 'almost-done';

const SORT_LABELS: Record<SortKey, string> = {
  'date-asc':  'Date ↑',
  'date-desc': 'Date ↓',
  duration:    'Durée',
  progress:    'Progression',
};

const FILTER_LABELS: Record<FilterKey, string> = {
  all:          'Tous',
  'not-started':'Non commencés',
  'in-progress':'À reprendre',
  'almost-done':'Presque finis',
};

function getProgress(state: PlaybackState | undefined): number {
  if (!state || !state.duration) return 0;
  return state.position / state.duration;
}

function applySort(files: DriveFile[], sort: SortKey, states: Map<string, PlaybackState>): DriveFile[] {
  const sorted = [...files];
  switch (sort) {
    case 'date-asc':  return sorted.sort((a, b) => a.createdTime.localeCompare(b.createdTime));
    case 'date-desc': return sorted.sort((a, b) => b.createdTime.localeCompare(a.createdTime));
    case 'duration':  return sorted.sort((a, b) => (states.get(b.id)?.duration ?? -1) - (states.get(a.id)?.duration ?? -1));
    case 'progress':  return sorted.sort((a, b) => getProgress(states.get(b.id)) - getProgress(states.get(a.id)));
  }
}

function applyFilter(files: DriveFile[], filter: FilterKey, states: Map<string, PlaybackState>): DriveFile[] {
  if (filter === 'all') return files;
  return files.filter((f) => {
    const p = getProgress(states.get(f.id));
    switch (filter) {
      case 'not-started':  return p === 0;
      case 'in-progress':  return p > 0 && p < 0.95;
      case 'almost-done':  return p >= 0.8 && p < 0.95;
    }
  });
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function fmtTime(secs: number): string {
  if (!isFinite(secs) || secs <= 0) return '0:00';
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = Math.floor(secs % 60);
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${m}:${String(s).padStart(2, '0')}`;
}

function formatDate(isoString: string): string {
  return new Date(isoString).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}

// ── MenuItem ─────────────────────────────────────────────────────────────────

function MenuItem({ label, onClick, danger = false }: { label: string; onClick: () => void; danger?: boolean }): React.JSX.Element {
  return (
    <button
      onClick={onClick}
      className="w-full text-left hover:bg-surface-3 transition-colors"
      style={{
        display: 'block', padding: '11px 16px',
        fontFamily: 'var(--font-sans)', fontSize: 14, fontWeight: 500, lineHeight: 1.3,
        color: danger ? 'var(--danger)' : 'var(--text-1)',
        background: 'transparent', border: 'none', cursor: 'pointer',
      }}
    >
      {label}
    </button>
  );
}

// ── FileItem ─────────────────────────────────────────────────────────────────

interface FileItemProps {
  file: DriveFile;
  isActive: boolean;
  sourceFolder: string;
  sourceFolderId: string;
  onPlay: (file: DriveFile, index: number) => void;
  onArchive: (file: DriveFile) => void;
  onAddToQueue?: (file: DriveFile) => void;
  fileIndex: number;
  isOnline: boolean;
  playState: PlaybackState | undefined;
}

function FileItem({ file, isActive, onPlay, onArchive, onAddToQueue, fileIndex, isOnline, playState, sourceFolderId }: FileItemProps): React.JSX.Element {
  const [cached, setCached] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [summary, setSummary] = useState<string | null>(null);
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    void checkCached(file.id, file.name).then(setCached);
  }, [file.id, file.name]);

  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e: MouseEvent): void => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [menuOpen]);

  const handleDownload = useCallback(async (): Promise<void> => {
    setDownloading(true);
    try { await downloadForOffline(file); setCached(true); }
    catch (err) { console.error('Download failed', err); }
    finally { setDownloading(false); }
  }, [file]);

  const toggleSummary = useCallback(async (): Promise<void> => {
    if (summaryOpen) { setSummaryOpen(false); return; }
    if (summary !== null) { setSummaryOpen(true); return; }
    setSummaryLoading(true);
    try {
      const md = await fetchMarkdownContent(sourceFolderId, file.name);
      const text = md ? extractSummary(md) : '';
      setSummary(text || null);
      if (text) setSummaryOpen(true);
    } finally { setSummaryLoading(false); }
  }, [summaryOpen, summary, sourceFolderId, file.name]);

  const progress  = playState && playState.duration > 0 ? playState.position / playState.duration : 0;
  const isDone    = progress >= 0.95;
  const isUnread  = !playState || progress === 0;
  const numColor  = isActive ? 'var(--accent)' : isUnread ? 'var(--text-1)' : 'var(--text-3)';
  const titleColor= isActive || isUnread ? 'var(--text-1)' : 'var(--text-2)';
  const title     = file.name.replace(/\.mp3$/i, '');
  const numStr    = String(fileIndex + 1).padStart(2, '0');

  return (
    <div style={{ position: 'relative' }}>
      {/* Currently-playing left bar */}
      {isActive && (
        <div style={{ position: 'absolute', left: 0, top: 8, bottom: 8, width: 3, background: 'var(--accent)', borderRadius: '0 2px 2px 0', zIndex: 1 }} />
      )}

      {/* Row grid */}
      <div
        onClick={() => onPlay(file, fileIndex)}
        style={{
          display: 'grid', gridTemplateColumns: '28px 1fr auto', gap: 12,
          padding: '14px 20px', alignItems: 'start',
          background: isActive ? 'var(--accent-soft)' : 'transparent',
          borderBottom: '1px solid var(--border-1)',
          cursor: 'pointer',
        }}
      >
        {/* Col 1 — Number */}
        <div style={{ paddingTop: 3 }}>
          <span style={{
            fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 500,
            lineHeight: 1, fontVariantNumeric: 'tabular-nums',
            letterSpacing: '0.04em', color: numColor,
          }}>
            {numStr}
          </span>
        </div>

        {/* Col 2 — Title + progress + meta */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 0 }}>
          <div style={{
            fontFamily: 'var(--font-sans)', fontSize: 15, fontWeight: 500,
            lineHeight: 1.35, letterSpacing: '-0.005em', color: titleColor,
            display: '-webkit-box', WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical' as const, overflow: 'hidden',
          }}>
            {title}
          </div>

          {/* Progress bar — only if started and not done */}
          {progress > 0 && !isDone && (
            <div style={{ height: 2, background: 'var(--surface-3)', borderRadius: 1, overflow: 'hidden' }}>
              <div style={{ width: `${progress * 100}%`, height: '100%', borderRadius: 1, background: isActive ? 'var(--accent)' : 'var(--text-3)' }} />
            </div>
          )}

          {/* Meta row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontFamily: 'var(--font-mono)', fontSize: 11, lineHeight: 1, color: 'var(--text-3)', fontVariantNumeric: 'tabular-nums' }}>
            <span>{formatDate(file.createdTime)}</span>
            {playState && playState.duration > 0 && (
              <>
                <span style={{ opacity: 0.5 }}>·</span>
                <span style={{ color: isActive ? 'var(--accent)' : 'var(--text-2)' }}>
                  <span style={{ fontWeight: 500 }}>{fmtTime(playState.position)}</span>
                  <span style={{ opacity: 0.6 }}> / {fmtTime(playState.duration)}</span>
                </span>
              </>
            )}
            {isDone && (
              <>
                <span style={{ opacity: 0.5 }}>·</span>
                <span style={{ color: 'var(--success)' }}>terminé</span>
              </>
            )}
            {cached && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, color: 'var(--success)', marginLeft: 'auto' }}>
                <CheckIcon size={11} style={{ color: 'var(--success)', flexShrink: 0 }} />
                <span style={{ fontFamily: 'var(--font-sans)', fontWeight: 500, fontSize: 10, letterSpacing: '0.02em' }}>OFF</span>
              </span>
            )}
          </div>
        </div>

        {/* Col 3 — Kebab */}
        <div ref={menuRef} style={{ position: 'relative', marginTop: -4 }} onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => setMenuOpen((m) => !m)}
            className="hover:bg-surface-2 transition-colors"
            style={{ width: 36, height: 36, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-3)', background: 'transparent', border: 'none', cursor: 'pointer' }}
          >
            <DotsVIcon size={18} />
          </button>

          {menuOpen && (
            <div style={{
              position: 'absolute', right: 0, top: 40, zIndex: 50, minWidth: 190,
              background: 'var(--surface-2)', border: '1px solid var(--border-1)',
              borderRadius: 10, overflow: 'hidden', boxShadow: 'var(--shadow-2)',
            }}>
              <MenuItem label={summaryLoading ? 'Chargement…' : summaryOpen ? 'Masquer le résumé' : 'Voir le résumé'} onClick={() => void (async () => { setMenuOpen(false); await toggleSummary(); })()} />
              {onAddToQueue && (
                <MenuItem label="Ajouter à la file" onClick={() => { setMenuOpen(false); onAddToQueue(file); }} />
              )}
              {isOnline && !cached && (
                <MenuItem label={downloading ? 'Téléchargement…' : 'Télécharger'} onClick={() => { setMenuOpen(false); void handleDownload(); }} />
              )}
              <MenuItem label="Archiver" onClick={() => { setMenuOpen(false); onArchive(file); }} danger />
            </div>
          )}
        </div>
      </div>

      {/* Summary drawer */}
      {summaryOpen && summary && (
        <div
          style={{
            padding: '0 20px 14px 60px',
            background: isActive ? 'var(--accent-soft)' : 'var(--surface-1)',
            borderBottom: '1px solid var(--border-1)',
          }}
        >
          <p style={{ fontFamily: 'var(--font-sans)', fontSize: 13, lineHeight: 1.55, color: 'var(--text-3)', margin: 0 }}>
            {summary}
          </p>
        </div>
      )}
    </div>
  );
}

// ── FileList ─────────────────────────────────────────────────────────────────

interface FileListProps {
  files: DriveFile[];
  sourceFolder: string;
  sourceFolderId: string;
  currentFileId: string | null;
  onPlay: (file: DriveFile, index: number) => void;
  onArchive: (file: DriveFile) => void;
  onAddToQueue?: (file: DriveFile) => void;
  isOnline: boolean;
  onRefresh: () => void;
}

export function FileList({ files, sourceFolder, sourceFolderId, currentFileId, onPlay, onArchive, onAddToQueue, isOnline, onRefresh }: FileListProps): React.JSX.Element {
  const [sort, setSort] = useState<SortKey>('date-asc');
  const [filter, setFilter] = useState<FilterKey>('all');
  const [stateMap, setStateMap] = useState<Map<string, PlaybackState>>(new Map());

  useEffect(() => {
    void getAllPlaybackStates().then((states) =>
      setStateMap(new Map(states.map((s) => [s.fileId, s]))),
    );
  }, [files]);

  const processed = useMemo(() => applySort(applyFilter(files, filter, stateMap), sort, stateMap), [files, sort, filter, stateMap]);

  const remainingSeconds = useMemo(() => {
    let total = 0;
    for (const f of files) {
      const s = stateMap.get(f.id);
      if (s && s.duration > 0) total += s.duration - s.position;
    }
    return total;
  }, [files, stateMap]);

  const remainingLabel = useMemo((): string | null => {
    const m = Math.round(remainingSeconds / 60);
    if (m < 1) return null;
    if (m < 60) return `${m} min restantes dans ${sourceFolder}`;
    const h = Math.floor(m / 60);
    const r = m % 60;
    return `${r > 0 ? `${h}h ${r}m` : `${h}h`} restantes dans ${sourceFolder}`;
  }, [remainingSeconds, sourceFolder]);

  const Chip = ({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }): React.JSX.Element => (
    <button
      onClick={onClick}
      className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors flex-shrink-0 ${
        active ? 'bg-accent text-accent-text' : 'bg-surface-2 text-text-3 hover:bg-surface-3'
      }`}
    >
      {label}
    </button>
  );

  if (files.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16" style={{ color: 'var(--text-3)' }}>
        <p style={{ fontSize: 14 }}>Aucun fichier dans {sourceFolder}</p>
        <button onClick={onRefresh} className="mt-4 text-sm hover:underline" style={{ color: 'var(--accent)' }}>
          Actualiser
        </button>
      </div>
    );
  }

  return (
    <div>
      {/* Sort & filter bar */}
      <div className="border-b border-border-1 px-4 py-2 space-y-2" style={{ background: 'var(--surface-1)' }}>
        {remainingLabel && (
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--accent)', letterSpacing: '0.02em' }}>{remainingLabel}</p>
        )}
        <div className="flex gap-2 overflow-x-auto scrollbar-none">
          {(Object.keys(SORT_LABELS) as SortKey[]).map((key) => (
            <Chip key={key} label={SORT_LABELS[key]} active={sort === key} onClick={() => setSort(key)} />
          ))}
        </div>
        <div className="flex gap-2 overflow-x-auto scrollbar-none">
          {(Object.keys(FILTER_LABELS) as FilterKey[]).map((key) => (
            <Chip key={key} label={FILTER_LABELS[key]} active={filter === key} onClick={() => setFilter(key)} />
          ))}
        </div>
      </div>

      {processed.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12" style={{ color: 'var(--text-3)' }}>
          <p style={{ fontSize: 14 }}>Aucun fichier pour ce filtre</p>
          <button onClick={() => setFilter('all')} className="mt-3 text-sm hover:underline" style={{ color: 'var(--accent)' }}>
            Voir tous
          </button>
        </div>
      ) : (
        processed.map((file, i) => (
          <FileItem
            key={file.id}
            file={file}
            isActive={file.id === currentFileId}
            sourceFolder={sourceFolder}
            sourceFolderId={sourceFolderId}
            onPlay={onPlay}
            onArchive={onArchive}
            onAddToQueue={onAddToQueue}
            fileIndex={i}
            isOnline={isOnline}
            playState={stateMap.get(file.id)}
          />
        ))
      )}
    </div>
  );
}
