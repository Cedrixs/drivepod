import { memo } from 'react';
import { PlayIcon, PauseIcon, MoonIcon } from './icons';
import { formatTime, abbrev, stripMp3 } from '../lib/format';
import type { DriveFile } from '../drive/types';

interface Props {
  file: DriveFile;
  sourceFolder: string;
  isPlaying: boolean;
  position: number;
  duration: number;
  sleepActive?: boolean;
  onPlayPause: () => void;
  onExpand: () => void;
}

export const PlayerBar = memo(function PlayerBar({
  file, sourceFolder, isPlaying, position, duration, sleepActive = false, onPlayPause, onExpand,
}: Props): React.JSX.Element {
  const progress = duration > 0 ? (position / duration) * 100 : 0;

  return (
    <div
      className="fixed z-40 select-none left-2 right-2 lg:left-1/2 lg:right-auto lg:w-[624px] lg:-translate-x-1/2"
      style={{ bottom: 'calc(8px + env(safe-area-inset-bottom))' }}
    >
      <div
        role="button"
        tabIndex={0}
        aria-label="Ouvrir le lecteur"
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
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onExpand(); } }}
      >
        {/* Cote de bibliothèque : source + timestamp */}
        <div className="flex flex-col items-start flex-shrink-0" style={{ gap: 2, paddingRight: 4 }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, fontWeight: 500, lineHeight: 1, color: 'var(--accent)', letterSpacing: '0.06em' }}>
            {sourceFolder ? abbrev(sourceFolder) : '···'}
          </span>
          <span className="tnum" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 500, lineHeight: 1, color: 'var(--text-3)' }}>
            {formatTime(position)}
            {sleepActive && <MoonIcon size={10} style={{ color: 'var(--accent)' }} aria-label="Minuteur de veille actif" />}
          </span>
        </div>

        <div className="self-stretch" style={{ width: 1, background: 'var(--border-1)' }} />

        <div className="flex-1 min-w-0 flex flex-col" style={{ gap: 5 }}>
          <p style={{ fontFamily: 'var(--font-sans)', fontSize: 13, fontWeight: 500, lineHeight: 1.2, color: 'var(--text-1)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', margin: 0 }}>
            {stripMp3(file.name)}
          </p>
          <div style={{ height: 2, background: 'var(--surface-3)', borderRadius: 1, overflow: 'hidden' }}>
            <div style={{ width: `${progress}%`, height: '100%', background: 'var(--accent)', borderRadius: 1, transition: 'width 1s linear' }} />
          </div>
        </div>

        <button
          type="button"
          aria-label={isPlaying ? 'Pause' : 'Lecture'}
          onClick={(e) => { e.stopPropagation(); onPlayPause(); }}
          className="flex items-center justify-center flex-shrink-0 active:scale-95 transition-transform"
          style={{ width: 40, height: 40, borderRadius: 20, background: 'var(--accent)', color: 'var(--accent-text)', border: 'none', cursor: 'pointer' }}
        >
          {isPlaying
            ? <PauseIcon size={18} />
            : <PlayIcon size={18} style={{ marginLeft: 2 }} />
          }
        </button>
      </div>
    </div>
  );
});
