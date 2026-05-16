import { PlayIcon, PauseIcon } from './icons';
import type { PlayerHookState } from '../hooks/usePlayer';

interface Props {
  playerState: PlayerHookState;
  sourceFolder?: string;
  onPlayPause: () => void;
  onExpand: () => void;
}

function fmtTime(secs: number): string {
  if (!isFinite(secs) || secs < 0) return '0:00';
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = Math.floor(secs % 60);
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${m}:${String(s).padStart(2, '0')}`;
}

function abbrev(name: string): string {
  return name.slice(0, 3).toUpperCase() + '.';
}

export function PlayerBar({ playerState, sourceFolder, onPlayPause, onExpand }: Props): React.JSX.Element | null {
  const { currentFile, isPlaying, position, duration } = playerState;
  if (!currentFile) return null;

  const title = currentFile.name.replace(/\.mp3$/i, '');
  const progress = duration > 0 ? (position / duration) * 100 : 0;

  return (
    <div
      className="fixed z-40 select-none left-2 right-2 lg:left-1/2 lg:right-auto lg:w-[624px] lg:-translate-x-1/2"
      style={{ bottom: 'calc(8px + env(safe-area-inset-bottom))' }}
    >
      <div
        className="flex items-center border border-border-1 cursor-pointer"
        style={{
          gap: 12,
          padding: '10px 12px 10px 14px',
          borderRadius: 14,
          background: 'oklch(from var(--surface-1) l c h / 0.92)',
          backdropFilter: 'blur(20px) saturate(160%)',
          boxShadow: 'var(--shadow-2)',
        }}
        onClick={onExpand}
      >
        {/* Côte de bibliothèque — source abbrev + timestamp */}
        <div className="flex flex-col items-start flex-shrink-0" style={{ gap: 2, paddingRight: 4 }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, fontWeight: 500, lineHeight: 1, color: 'var(--accent)', letterSpacing: '0.06em' }}>
            {sourceFolder ? abbrev(sourceFolder) : '···'}
          </span>
          <span className="tnum" style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 500, lineHeight: 1, color: 'var(--text-3)' }}>
            {fmtTime(position)}
          </span>
        </div>

        {/* Séparateur */}
        <div className="self-stretch" style={{ width: 1, background: 'var(--border-1)' }} />

        {/* Titre + barre de progression */}
        <div className="flex-1 min-w-0 flex flex-col" style={{ gap: 5 }}>
          <p style={{ fontFamily: 'var(--font-sans)', fontSize: 13, fontWeight: 500, lineHeight: 1.2, color: 'var(--text-1)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', margin: 0 }}>
            {title}
          </p>
          <div style={{ height: 2, background: 'var(--surface-3)', borderRadius: 1, overflow: 'hidden' }}>
            <div style={{ width: `${progress}%`, height: '100%', background: 'var(--accent)', borderRadius: 1, transition: 'width 1s linear' }} />
          </div>
        </div>

        {/* Bouton play/pause 40×40 */}
        <button
          onClick={(e) => { e.stopPropagation(); onPlayPause(); }}
          className="flex items-center justify-center flex-shrink-0 active:scale-95 transition-transform"
          style={{ width: 40, height: 40, borderRadius: 20, background: 'var(--accent)', color: 'var(--accent-text)', border: 'none' }}
        >
          {isPlaying
            ? <PauseIcon size={18} />
            : <PlayIcon size={18} style={{ marginLeft: 2 }} />
          }
        </button>
      </div>
    </div>
  );
}
