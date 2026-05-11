import { useCallback } from 'react';
import {
  PlayIcon, PauseIcon, SkipBackIcon, SkipForwardIcon,
  ChevronDownIcon, ArchiveIcon,
} from './icons';
import type { PlayerHookState } from '../hooks/usePlayer';

interface Props {
  playerState: PlayerHookState;
  onPlayPause: () => void;
  onNext: () => Promise<void>;
  onPrevious: () => Promise<void>;
  onSeek: (t: number) => void;
  onSkipForward: (s: number) => void;
  onSkipBackward: (s: number) => void;
  onSetSpeed: (s: number) => void;
  onArchive: () => void;
  onClose: () => void;
  skipSeconds: number;
}

const SPEEDS = [0.75, 1, 1.25, 1.5, 1.75, 2] as const;

function formatTime(seconds: number): string {
  if (!isFinite(seconds) || seconds <= 0) return '0:00';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export function PlayerFull({
  playerState,
  onPlayPause,
  onNext,
  onPrevious,
  onSeek,
  onSkipForward,
  onSkipBackward,
  onSetSpeed,
  onArchive,
  onClose,
  skipSeconds,
}: Props): React.JSX.Element | null {
  const { currentFile, isPlaying, position, duration, speed, buffering } = playerState;

  const handleSeek = useCallback((e: React.ChangeEvent<HTMLInputElement>): void => {
    onSeek(parseFloat(e.target.value));
  }, [onSeek]);

  if (!currentFile) return null;

  const title = currentFile.name.replace(/\.mp3$/i, '');
  const progress = duration > 0 ? (position / duration) * 100 : 0;

  return (
    <div
      className="fixed inset-0 bg-navy-900 flex flex-col z-50 select-none"
      style={{
        paddingTop: 'env(safe-area-inset-top)',
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3">
        <button onClick={onClose} className="p-2 text-white/60 hover:text-white transition-colors">
          <ChevronDownIcon size={24} />
        </button>
        <p className="text-sm font-medium text-white/60 uppercase tracking-wider">En lecture</p>
        <button onClick={onArchive} className="p-2 text-white/60 hover:text-accent transition-colors">
          <ArchiveIcon size={20} />
        </button>
      </div>

      {/* Artwork placeholder */}
      <div className="flex-1 flex items-center justify-center px-8">
        <div className="w-full max-w-xs aspect-square rounded-2xl bg-gradient-to-br from-accent/30 to-navy-700 flex items-center justify-center shadow-2xl">
          <svg viewBox="0 0 64 64" className="w-20 h-20 text-white/20 fill-current">
            <circle cx="32" cy="32" r="28" />
            <polygon points="26,20 46,32 26,44" fill="white" opacity="0.6" />
          </svg>
        </div>
      </div>

      {/* Track info */}
      <div className="px-8 py-4">
        <h2 className="text-xl font-bold text-white truncate text-center">{title}</h2>
      </div>

      {/* Seek bar */}
      <div className="px-8 pb-2">
        <input
          type="range"
          min={0}
          max={duration || 1}
          step={1}
          value={position}
          onChange={handleSeek}
          className="w-full h-1 accent-accent cursor-pointer"
          style={{ WebkitAppearance: 'none', appearance: 'none' }}
        />
        <div className="flex justify-between mt-1">
          <span className="text-xs text-white/40">{formatTime(position)}</span>
          <span className="text-xs text-white/40">{formatTime(duration)}</span>
        </div>
      </div>

      {/* Controls */}
      <div className="px-8 pb-4 flex items-center justify-between">
        <button
          onClick={() => void onPrevious()}
          className="p-3 text-white/60 hover:text-white transition-colors"
        >
          <SkipBackIcon size={28} />
        </button>

        <button
          onClick={() => onSkipBackward(skipSeconds)}
          className="flex flex-col items-center text-white/60 hover:text-white transition-colors"
        >
          <SkipBackIcon size={22} />
          <span className="text-xs mt-0.5">{skipSeconds}s</span>
        </button>

        <button
          onClick={onPlayPause}
          disabled={buffering}
          className="w-16 h-16 rounded-full bg-accent flex items-center justify-center text-white shadow-lg active:scale-95 transition-transform"
        >
          {isPlaying ? <PauseIcon size={28} /> : <PlayIcon size={28} className="ml-1" />}
        </button>

        <button
          onClick={() => onSkipForward(skipSeconds)}
          className="flex flex-col items-center text-white/60 hover:text-white transition-colors"
        >
          <SkipForwardIcon size={22} />
          <span className="text-xs mt-0.5">{skipSeconds}s</span>
        </button>

        <button
          onClick={() => void onNext()}
          className="p-3 text-white/60 hover:text-white transition-colors"
        >
          <SkipForwardIcon size={28} />
        </button>
      </div>

      {/* Speed selector */}
      <div className="px-8 pb-6 flex items-center justify-center gap-2">
        {SPEEDS.map((s) => (
          <button
            key={s}
            onClick={() => onSetSpeed(s)}
            className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
              speed === s
                ? 'bg-accent text-white'
                : 'bg-white/10 text-white/60 hover:bg-white/20'
            }`}
          >
            {s}x
          </button>
        ))}
      </div>

      {/* Progress bar */}
      <div className="px-8 pb-2">
        <div className="h-1 bg-white/10 rounded-full">
          <div
            className="h-full bg-accent/50 rounded-full transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
}
