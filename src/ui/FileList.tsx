import { useState, useEffect, useCallback, useMemo } from 'react';
import { DownloadIcon, ArchiveIcon, PlayIcon, CheckIcon } from './icons';
import { downloadForOffline, checkCached } from '../offline/cache';
import { getAllPlaybackStates } from '../state/db';
import type { DriveFile, PlaybackState } from '../drive/types';

// ── Sort & filter types ──────────────────────────────────────────────────────

type SortKey = 'date-asc' | 'date-desc' | 'duration' | 'progress';
type FilterKey = 'all' | 'not-started' | 'in-progress' | 'almost-done';

const SORT_LABELS: Record<SortKey, string> = {
  'date-asc': 'Date ↑',
  'date-desc': 'Date ↓',
  duration: 'Durée',
  progress: 'Progression',
};

const FILTER_LABELS: Record<FilterKey, string> = {
  all: 'Tous',
  'not-started': 'Non commencés',
  'in-progress': 'À reprendre',
  'almost-done': 'Presque finis',
};

function getProgress(state: PlaybackState | undefined): number {
  if (!state || !state.duration) return 0;
  return state.position / state.duration;
}

function applySort(files: DriveFile[], sort: SortKey, states: Map<string, PlaybackState>): DriveFile[] {
  const sorted = [...files];
  switch (sort) {
    case 'date-asc':
      return sorted.sort((a, b) => a.createdTime.localeCompare(b.createdTime));
    case 'date-desc':
      return sorted.sort((a, b) => b.createdTime.localeCompare(a.createdTime));
    case 'duration':
      return sorted.sort((a, b) => {
        const da = states.get(a.id)?.duration ?? -1;
        const db = states.get(b.id)?.duration ?? -1;
        return db - da; // longest first; unknowns (-1) go last
      });
    case 'progress':
      return sorted.sort((a, b) => getProgress(states.get(b.id)) - getProgress(states.get(a.id)));
  }
}

function applyFilter(files: DriveFile[], filter: FilterKey, states: Map<string, PlaybackState>): DriveFile[] {
  if (filter === 'all') return files;
  return files.filter((f) => {
    const p = getProgress(states.get(f.id));
    switch (filter) {
      case 'not-started': return p === 0;
      case 'in-progress': return p > 0 && p < 0.95;
      case 'almost-done': return p >= 0.8 && p < 0.95;
    }
  });
}

// ── FileItem ─────────────────────────────────────────────────────────────────

interface FileItemProps {
  file: DriveFile;
  isActive: boolean;
  sourceFolder: string;
  sourceFolderId: string;
  onPlay: (file: DriveFile, index: number) => void;
  onArchive: (file: DriveFile) => void;
  fileIndex: number;
  isOnline: boolean;
  playState: PlaybackState | undefined;
}

function formatDuration(seconds: number): string {
  if (!isFinite(seconds) || seconds <= 0) return '--:--';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${m}:${String(s).padStart(2, '0')}`;
}

function formatDate(isoString: string): string {
  return new Date(isoString).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function FileItem({
  file,
  isActive,
  onPlay,
  onArchive,
  fileIndex,
  isOnline,
  playState,
}: FileItemProps): React.JSX.Element {
  const [cached, setCached] = useState(false);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    void checkCached(file.id, file.name).then(setCached);
  }, [file.id, file.name]);

  const handleDownload = useCallback(async (e: React.MouseEvent): Promise<void> => {
    e.stopPropagation();
    setDownloading(true);
    try {
      await downloadForOffline(file);
      setCached(true);
    } catch (err) {
      console.error('Download failed', err);
    } finally {
      setDownloading(false);
    }
  }, [file]);

  const handleArchive = useCallback((e: React.MouseEvent): void => {
    e.stopPropagation();
    onArchive(file);
  }, [file, onArchive]);

  const progress = playState && playState.duration > 0
    ? Math.min(100, (playState.position / playState.duration) * 100)
    : 0;

  const title = file.name.replace(/\.mp3$/i, '');

  return (
    <div
      onClick={() => onPlay(file, fileIndex)}
      className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors border-b border-white/5 ${
        isActive ? 'bg-accent/10 border-l-2 border-l-accent' : 'hover:bg-white/5'
      }`}
    >
      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
        {isActive
          ? <PlayIcon size={16} className="text-accent ml-0.5" />
          : <span className="text-white/40 text-sm">{fileIndex + 1}</span>
        }
      </div>

      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium truncate ${isActive ? 'text-accent' : 'text-white'}`}>
          {title}
        </p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-xs text-white/40">{formatDate(file.createdTime)}</span>
          {playState && playState.duration > 0 && (
            <span className="text-xs text-white/40">
              {formatDuration(playState.position)} / {formatDuration(playState.duration)}
            </span>
          )}
          {cached && <CheckIcon size={12} className="text-green-400" />}
        </div>
        {progress > 0 && (
          <div className="mt-1.5 h-0.5 bg-white/10 rounded-full">
            <div
              className="h-full bg-accent rounded-full transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}
      </div>

      <div className="flex items-center gap-1 flex-shrink-0">
        {isOnline && !cached && (
          <button
            onClick={(e) => void handleDownload(e)}
            disabled={downloading}
            className="p-2 text-white/40 hover:text-white transition-colors"
            title="Télécharger hors-ligne"
          >
            <DownloadIcon size={16} className={downloading ? 'animate-bounce' : ''} />
          </button>
        )}
        <button
          onClick={handleArchive}
          className="p-2 text-white/40 hover:text-accent transition-colors"
          title="Archiver"
        >
          <ArchiveIcon size={16} />
        </button>
      </div>
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
  isOnline: boolean;
  onRefresh: () => void;
}

export function FileList({
  files,
  sourceFolder,
  sourceFolderId,
  currentFileId,
  onPlay,
  onArchive,
  isOnline,
  onRefresh,
}: FileListProps): React.JSX.Element {
  const [sort, setSort] = useState<SortKey>('date-asc');
  const [filter, setFilter] = useState<FilterKey>('all');
  const [stateMap, setStateMap] = useState<Map<string, PlaybackState>>(new Map());

  useEffect(() => {
    void getAllPlaybackStates().then((states) =>
      setStateMap(new Map(states.map((s) => [s.fileId, s]))),
    );
  }, [files]);

  const processed = useMemo(() => {
    const filtered = applyFilter(files, filter, stateMap);
    return applySort(filtered, sort, stateMap);
  }, [files, sort, filter, stateMap]);

  const Chip = ({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }): React.JSX.Element => (
    <button
      onClick={onClick}
      className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors flex-shrink-0 ${
        active ? 'bg-accent text-white' : 'bg-white/10 text-white/50 hover:bg-white/20'
      }`}
    >
      {label}
    </button>
  );

  if (files.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-white/40">
        <p className="text-sm">Aucun fichier dans {sourceFolder}</p>
        <button onClick={onRefresh} className="mt-4 text-accent text-sm hover:underline">
          Actualiser
        </button>
      </div>
    );
  }

  return (
    <div>
      {/* Sort & filter bar */}
      <div className="bg-navy-800 border-b border-white/10 px-4 py-2 space-y-2">
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
        <div className="flex flex-col items-center justify-center py-12 text-white/40">
          <p className="text-sm">Aucun fichier pour ce filtre</p>
          <button onClick={() => setFilter('all')} className="mt-3 text-accent text-sm hover:underline">
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
            fileIndex={i}
            isOnline={isOnline}
            playState={stateMap.get(file.id)}
          />
        ))
      )}
    </div>
  );
}
