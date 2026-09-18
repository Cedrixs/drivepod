import { useState, useEffect, useCallback, useMemo, useRef, memo } from 'react';
import { CheckIcon, DotsVIcon, SortIcon, ChevronDownIcon } from './icons';
import { downloadForOffline, isFileCached } from '../offline/cache';
import { fetchMarkdownContent } from '../drive/api';
import { extractSummary } from '../lib/markdown';
import { formatTime, formatDate, formatMinutes, stripMp3 } from '../lib/format';
import { getAllPlaybackStates } from '../state/db';
import { ARCHIVE_THRESHOLD } from '../player/player';
import { EmptyState, PILL_STYLE } from './primitives';
import type { DriveFile, PlaybackState } from '../drive/types';

// ── Tri & filtres ────────────────────────────────────────────────────────────

type SortKey = 'date-asc' | 'date-desc' | 'duration' | 'progress';
type FilterKey = 'all' | 'not-started' | 'in-progress' | 'almost-done';

const SORT_LABELS: Record<SortKey, string> = {
  'date-asc':  'Date ↑',
  'date-desc': 'Date ↓',
  duration:    'Durée',
  progress:    'Avancement',
};

const SORT_ORDER: SortKey[] = ['date-asc', 'date-desc', 'duration', 'progress'];

const FILTER_CHIPS: { key: FilterKey; label: string }[] = [
  { key: 'in-progress',  label: 'À reprendre' },
  { key: 'not-started',  label: 'Non commencés' },
  { key: 'almost-done',  label: 'Presque finis' },
];

type StateMap = Map<string, PlaybackState>;

function getProgress(state: PlaybackState | undefined): number {
  if (!state || !state.duration) return 0;
  return state.position / state.duration;
}

function applySort(files: DriveFile[], sort: SortKey, states: StateMap): DriveFile[] {
  const sorted = [...files];
  switch (sort) {
    case 'date-asc':  return sorted.sort((a, b) => a.createdTime.localeCompare(b.createdTime));
    case 'date-desc': return sorted.sort((a, b) => b.createdTime.localeCompare(a.createdTime));
    case 'duration':  return sorted.sort((a, b) => (states.get(b.id)?.duration ?? -1) - (states.get(a.id)?.duration ?? -1));
    case 'progress':  return sorted.sort((a, b) => getProgress(states.get(b.id)) - getProgress(states.get(a.id)));
  }
}

function applyFilter(files: DriveFile[], filter: FilterKey, states: StateMap): DriveFile[] {
  if (filter === 'all') return files;
  return files.filter((f) => {
    const p = getProgress(states.get(f.id));
    switch (filter) {
      case 'not-started':  return p === 0;
      case 'in-progress':  return p > 0 && p < ARCHIVE_THRESHOLD;
      case 'almost-done':  return p >= 0.8 && p < ARCHIVE_THRESHOLD;
    }
  });
}

// ── MenuItem ─────────────────────────────────────────────────────────────────

function MenuItem({ label, onClick, danger = false, disabled = false }: {
  label: string; onClick: () => void; danger?: boolean; disabled?: boolean;
}): React.JSX.Element {
  return (
    <button
      type="button"
      role="menuitem"
      onClick={onClick}
      disabled={disabled}
      className="w-full text-left hover:bg-surface-3 transition-colors"
      style={{
        display: 'block', padding: '11px 16px',
        fontFamily: 'var(--font-sans)', fontSize: 14, fontWeight: 500, lineHeight: 1.3,
        color: danger ? 'var(--danger)' : 'var(--text-1)',
        background: 'transparent', border: 'none', cursor: disabled ? 'default' : 'pointer',
        opacity: disabled ? 0.5 : 1,
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

const FileItem = memo(function FileItem({
  file, isActive, onPlay, onArchive, onAddToQueue, fileIndex, isOnline, playState, sourceFolder, sourceFolderId,
}: FileItemProps): React.JSX.Element {
  const [cached, setCached] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [summary, setSummary] = useState<string | null>(null);
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    void isFileCached(file.id, file.name).then((v) => { if (!cancelled) setCached(v); });
    return () => { cancelled = true; };
  }, [file.id, file.name]);

  useEffect(() => {
    if (!menuOpen) return;
    const onPointer = (e: PointerEvent): void => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    const onKey = (e: KeyboardEvent): void => { if (e.key === 'Escape') setMenuOpen(false); };
    document.addEventListener('pointerdown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [menuOpen]);

  const handleDownload = useCallback(async (): Promise<void> => {
    setDownloading(true);
    try { await downloadForOffline(file, sourceFolder, sourceFolderId); setCached(true); }
    catch (err) { console.error('Download failed', err); }
    finally { setDownloading(false); }
  }, [file, sourceFolder, sourceFolderId]);

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

  const progress  = getProgress(playState);
  const isDone    = progress >= ARCHIVE_THRESHOLD;
  const isUnread  = progress === 0;
  const numColor  = isActive ? 'var(--accent)' : isUnread ? 'var(--text-1)' : 'var(--text-3)';
  const titleColor= isActive || isUnread ? 'var(--text-1)' : 'var(--text-2)';
  const title     = stripMp3(file.name);
  const numStr    = String(fileIndex + 1).padStart(2, '0');

  return (
    <div style={{ position: 'relative' }}>
      {isActive && (
        <div style={{ position: 'absolute', left: 0, top: 8, bottom: 8, width: 3, background: 'var(--accent)', borderRadius: '0 2px 2px 0', zIndex: 1 }} />
      )}

      <div
        role="button"
        tabIndex={0}
        aria-current={isActive ? 'true' : undefined}
        onClick={() => onPlay(file, fileIndex)}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onPlay(file, fileIndex); } }}
        style={{
          display: 'grid', gridTemplateColumns: '28px 1fr auto', gap: 12,
          padding: '14px 20px', alignItems: 'start',
          background: isActive ? 'var(--accent-soft)' : 'transparent',
          borderBottom: '1px solid var(--border-1)',
          cursor: 'pointer',
        }}
      >
        <div style={{ paddingTop: 3 }}>
          <span style={{
            fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 500,
            lineHeight: 1, fontVariantNumeric: 'tabular-nums',
            letterSpacing: '0.04em', color: numColor,
          }}>
            {numStr}
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 0 }}>
          <div style={{
            fontFamily: 'var(--font-sans)', fontSize: 15, fontWeight: 500,
            lineHeight: 1.35, letterSpacing: '-0.005em', color: titleColor,
            display: '-webkit-box', WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical' as const, overflow: 'hidden',
          }}>
            {title}
          </div>

          {progress > 0 && !isDone && (
            <div style={{ height: 2, background: 'var(--surface-3)', borderRadius: 1, overflow: 'hidden' }}>
              <div style={{ width: `${progress * 100}%`, height: '100%', borderRadius: 1, background: isActive ? 'var(--accent)' : 'var(--text-3)', transition: 'width 300ms linear' }} />
            </div>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontFamily: 'var(--font-mono)', fontSize: 11, lineHeight: 1, color: 'var(--text-3)', fontVariantNumeric: 'tabular-nums' }}>
            <span>{formatDate(file.createdTime)}</span>
            {playState && playState.duration > 0 && (
              <>
                <span style={{ opacity: 0.5 }}>·</span>
                <span style={{ color: isActive ? 'var(--accent)' : 'var(--text-2)' }}>
                  <span style={{ fontWeight: 500 }}>{formatTime(playState.position)}</span>
                  <span style={{ opacity: 0.6 }}> / {formatTime(playState.duration)}</span>
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
              <span title="Disponible hors-ligne" style={{ display: 'inline-flex', alignItems: 'center', gap: 3, color: 'var(--success)', marginLeft: 'auto' }}>
                <CheckIcon size={11} style={{ color: 'var(--success)', flexShrink: 0 }} />
                <span style={{ fontFamily: 'var(--font-sans)', fontWeight: 500, fontSize: 10, letterSpacing: '0.02em' }}>OFF</span>
              </span>
            )}
          </div>
        </div>

        <div ref={menuRef} style={{ position: 'relative', marginTop: -4 }} onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}>
          <button
            type="button"
            aria-label={`Actions pour ${title}`}
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((m) => !m)}
            className="hover:bg-surface-2 transition-colors"
            style={{ width: 36, height: 36, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-3)', background: 'transparent', border: 'none', cursor: 'pointer' }}
          >
            <DotsVIcon size={18} />
          </button>

          {menuOpen && (
            <div role="menu" style={{
              position: 'absolute', right: 0, top: 40, zIndex: 50, minWidth: 190,
              background: 'var(--surface-2)', border: '1px solid var(--border-1)',
              borderRadius: 10, overflow: 'hidden', boxShadow: 'var(--shadow-2)',
            }}>
              <MenuItem
                label={summaryLoading ? 'Chargement…' : summaryOpen ? 'Masquer le résumé' : 'Voir le résumé'}
                disabled={summaryLoading}
                onClick={() => { setMenuOpen(false); void toggleSummary(); }}
              />
              {onAddToQueue && (
                <MenuItem label="Ajouter à la file" onClick={() => { setMenuOpen(false); onAddToQueue(file); }} />
              )}
              {isOnline && !cached && (
                <MenuItem
                  label={downloading ? 'Téléchargement…' : 'Télécharger'}
                  disabled={downloading}
                  onClick={() => { setMenuOpen(false); void handleDownload(); }}
                />
              )}
              <MenuItem label="Archiver" onClick={() => { setMenuOpen(false); onArchive(file); }} danger />
            </div>
          )}
        </div>
      </div>

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
});

// ── FileList ─────────────────────────────────────────────────────────────────

export interface LivePlayback {
  fileId: string;
  position: number;
  duration: number;
}

interface FileListProps {
  files: DriveFile[];
  sourceFolder: string;
  sourceFolderId: string;
  currentFileId: string | null;
  // Position du fichier en cours : la ligne active avance sans relire la base
  livePlayback?: LivePlayback | null;
  onPlay: (file: DriveFile, index: number) => void;
  onArchive: (file: DriveFile) => void;
  onAddToQueue?: (file: DriveFile) => void;
  isOnline: boolean;
  onRefresh: () => void;
  onRestTimeChange?: (time: string | null) => void;
}

export const FileList = memo(function FileList({
  files, sourceFolder, sourceFolderId, currentFileId, livePlayback,
  onPlay, onArchive, onAddToQueue, isOnline, onRefresh, onRestTimeChange,
}: FileListProps): React.JSX.Element {
  const [sort, setSort] = useState<SortKey>('date-asc');
  const [filter, setFilter] = useState<FilterKey>('all');
  const [storedStates, setStoredStates] = useState<StateMap>(new Map());

  // Relu quand la liste change ou qu'on change de piste (la position de la
  // piste précédente vient d'être sauvegardée)
  useEffect(() => {
    let cancelled = false;
    void getAllPlaybackStates().then((states) => {
      if (!cancelled) setStoredStates(new Map(states.map((s) => [s.fileId, s])));
    });
    return () => { cancelled = true; };
  }, [files, currentFileId]);

  const stateMap = useMemo((): StateMap => {
    if (!livePlayback || livePlayback.duration <= 0) return storedStates;
    const live = livePlayback;
    const file = files.find((f) => f.id === live.fileId);
    if (!file) return storedStates;
    const prev = storedStates.get(live.fileId);
    const next = new Map(storedStates);
    next.set(live.fileId, {
      fileId: live.fileId,
      sourceFolder: prev?.sourceFolder ?? sourceFolder,
      fileName: prev?.fileName ?? file.name,
      lastUpdated: prev?.lastUpdated ?? 0,
      position: live.position,
      duration: live.duration,
    });
    return next;
  }, [storedStates, livePlayback, files, sourceFolder]);

  const processed = useMemo(
    () => applySort(applyFilter(files, filter, stateMap), sort, stateMap),
    [files, sort, filter, stateMap],
  );

  const restTime = useMemo((): string | null => {
    let totalSeconds = 0;
    for (const f of files) {
      const s = stateMap.get(f.id);
      if (s && s.duration > 0) totalSeconds += Math.max(0, s.duration - s.position);
    }
    return formatMinutes(totalSeconds / 60);
  }, [files, stateMap]);

  useEffect(() => {
    onRestTimeChange?.(restTime);
  }, [restTime, onRestTimeChange]);

  if (files.length === 0) {
    return (
      <EmptyState
        title={`Aucun fichier dans ${sourceFolder}`}
        action={{ label: 'Actualiser', onClick: onRefresh }}
      />
    );
  }

  return (
    <div>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '10px 16px',
        borderBottom: '1px solid var(--border-1)',
        background: 'var(--surface-1)',
        overflowX: 'auto',
      }}>
        <button
          type="button"
          aria-label={`Tri : ${SORT_LABELS[sort]}`}
          onClick={() => setSort(SORT_ORDER[(SORT_ORDER.indexOf(sort) + 1) % SORT_ORDER.length])}
          style={{ ...PILL_STYLE(false), display: 'flex', alignItems: 'center', gap: 5, color: 'var(--text-2)' }}
        >
          <SortIcon size={13} />
          <span>{SORT_LABELS[sort]}</span>
          <ChevronDownIcon size={13} />
        </button>

        <div style={{ width: 1, height: 18, background: 'var(--border-1)', flexShrink: 0 }} />

        {FILTER_CHIPS.map(({ key, label }) => {
          const active = filter === key;
          return (
            <button
              type="button"
              key={key}
              aria-pressed={active}
              onClick={() => setFilter(active ? 'all' : key)}
              style={PILL_STYLE(active)}
            >
              {label}
            </button>
          );
        })}
      </div>

      {processed.length === 0 ? (
        <EmptyState
          title="Aucun fichier pour ce filtre"
          action={{ label: 'Voir tous', onClick: () => setFilter('all') }}
          padding={48}
        />
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
});
