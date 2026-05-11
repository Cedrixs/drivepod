import { useState, useEffect, useCallback } from 'react';
import { DownloadIcon, ArchiveIcon, PlayIcon, CheckIcon } from './icons';
import { downloadForOffline, checkCached } from '../offline/cache';
import type { DriveFile } from '../drive/types';
import type { PlaybackState } from '../drive/types';
import { getPlaybackState } from '../state/db';

interface FileItemProps {
  file: DriveFile;
  isActive: boolean;
  sourceFolder: string;
  sourceFolderId: string;
  onPlay: (file: DriveFile, index: number) => void;
  onArchive: (file: DriveFile) => void;
  fileIndex: number;
  isOnline: boolean;
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
}: FileItemProps): React.JSX.Element {
  const [cached, setCached] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [playState, setPlayState] = useState<PlaybackState | null>(null);

  useEffect(() => {
    void checkCached(file.id, file.name).then(setCached);
    void getPlaybackState(file.id).then((s) => setPlayState(s ?? null));
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
      {files.map((file, i) => (
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
        />
      ))}
    </div>
  );
}
