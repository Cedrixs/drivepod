import { PlayIcon, PauseIcon, SkipForwardIcon } from './icons';
import type { PlayerHookState } from '../hooks/usePlayer';

interface Props {
  playerState: PlayerHookState;
  onPlayPause: () => void;
  onNext: () => void;
  onExpand: () => void;
  skipSeconds: number;
}

export function PlayerBar({ playerState, onPlayPause, onNext, onExpand, skipSeconds }: Props): React.JSX.Element | null {
  const { currentFile, isPlaying, position, duration, buffering } = playerState;
  if (!currentFile) return null;

  const title = currentFile.name.replace(/\.mp3$/i, '');
  const progress = duration > 0 ? (position / duration) * 100 : 0;

  return (
    <div
      className="bg-navy-700 border-t border-white/10 px-4 py-3 flex items-center gap-3 cursor-pointer select-none"
      style={{ paddingBottom: 'calc(0.75rem + env(safe-area-inset-bottom))' }}
      onClick={onExpand}
    >
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-white truncate">{title}</p>
        <div className="mt-1.5 h-1 bg-white/10 rounded-full">
          <div
            className="h-full bg-accent rounded-full transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="flex items-center gap-2 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
        <button
          onClick={onPlayPause}
          className="w-10 h-10 rounded-full bg-accent flex items-center justify-center text-white active:scale-95 transition-transform"
          disabled={buffering}
        >
          {isPlaying ? <PauseIcon size={18} /> : <PlayIcon size={18} className="ml-0.5" />}
        </button>
        <button
          onClick={() => void onNext()}
          className="w-8 h-8 text-white/60 hover:text-white transition-colors flex items-center justify-center"
          title={`+${skipSeconds}s`}
        >
          <SkipForwardIcon size={20} />
        </button>
      </div>
    </div>
  );
}
