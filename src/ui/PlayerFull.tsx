import { useCallback, useEffect, useState } from 'react';
import {
  PlayIcon, PauseIcon, SkipBackIcon, SkipForwardIcon,
  ChevronDownIcon, ArchiveIcon, BookmarkIcon,
} from './icons';
import { fetchMarkdownContent, extractSummary } from '../drive/api';
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
  onCapture: () => void;
  onClose: () => void;
  skipSeconds: number;
  sourceFolderId?: string;
  sourceFolder?: string;
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

function abbrev(name: string): string {
  return name.slice(0, 3).toUpperCase() + '.';
}

const BTN: React.CSSProperties = {
  width: 44, height: 44, borderRadius: 10,
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)',
};

export function PlayerFull({
  playerState, onPlayPause, onNext, onPrevious,
  onSeek, onSkipForward, onSkipBackward, onSetSpeed,
  onArchive, onCapture, onClose, skipSeconds, sourceFolderId, sourceFolder,
}: Props): React.JSX.Element | null {
  const { currentFile, isPlaying, position, duration, speed, buffering } = playerState;
  const [summary, setSummary] = useState<string | null>(null);
  const [captured, setCaptured] = useState(false);

  useEffect(() => {
    setSummary(null);
    if (!currentFile || !sourceFolderId) return;
    void fetchMarkdownContent(sourceFolderId, currentFile.name).then((md) => {
      setSummary(md ? extractSummary(md) : null);
    });
  }, [currentFile?.id, sourceFolderId]);

  const handleSeek = useCallback((e: React.ChangeEvent<HTMLInputElement>): void => {
    onSeek(parseFloat(e.target.value));
  }, [onSeek]);

  const handleCapture = useCallback((): void => {
    onCapture();
    setCaptured(true);
    setTimeout(() => setCaptured(false), 2000);
  }, [onCapture]);

  if (!currentFile) return null;

  const title = currentFile.name.replace(/\.mp3$/i, '');
  const remaining = Math.max(0, duration - position);

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col select-none lg:inset-y-0 lg:left-1/2 lg:right-auto lg:w-[640px] lg:-translate-x-1/2"
      style={{
        background: 'var(--bg)',
        paddingTop: 'env(safe-area-inset-top)',
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 8px 4px 12px', minHeight: 52 }}>
        <button onClick={onClose} style={BTN}>
          <ChevronDownIcon size={22} />
        </button>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 500, letterSpacing: '0.1em', color: 'var(--text-3)', textTransform: 'uppercase' }}>
          En lecture
        </span>
        <div style={{ display: 'flex' }}>
          <button onClick={handleCapture} style={{ ...BTN, color: captured ? 'var(--accent)' : 'var(--text-3)' }}>
            <BookmarkIcon size={20} />
          </button>
          <button onClick={onArchive} style={BTN}>
            <ArchiveIcon size={20} />
          </button>
        </div>
      </div>

      {/* Spine + title */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '0 32px', gap: 20, minHeight: 0 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 52, fontWeight: 500, lineHeight: 1, color: 'var(--accent)', letterSpacing: '-0.02em' }}>
            {sourceFolder ? abbrev(sourceFolder) : '···'}
          </span>
          <div style={{ height: 1, background: 'var(--border-1)' }} />
        </div>

        <div>
          <h2 style={{
            fontFamily: 'var(--font-sans)', fontSize: 22, fontWeight: 600,
            lineHeight: 1.25, letterSpacing: '-0.02em', color: 'var(--text-1)',
            display: '-webkit-box', WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical' as const, overflow: 'hidden', margin: 0,
          }}>
            {title}
          </h2>
          {summary && (
            <p style={{
              fontFamily: 'var(--font-sans)', fontSize: 13, lineHeight: 1.55,
              color: 'var(--text-3)',
              display: '-webkit-box', WebkitLineClamp: 3,
              WebkitBoxOrient: 'vertical' as const, overflow: 'hidden',
              margin: '10px 0 0',
            }}>
              {summary}
            </p>
          )}
        </div>
      </div>

      {/* Seek + controls + speed */}
      <div style={{ padding: '0 24px 20px' }}>
        {/* Seek bar */}
        <div style={{ marginBottom: 20 }}>
          <input
            type="range"
            min={0}
            max={duration || 1}
            step={1}
            value={position}
            onChange={handleSeek}
            style={{ width: '100%', accentColor: 'var(--accent)', cursor: 'pointer', height: 3 }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-3)', fontVariantNumeric: 'tabular-nums' }}>
              {formatTime(position)}
            </span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-3)', fontVariantNumeric: 'tabular-nums' }}>
              -{formatTime(remaining)}
            </span>
          </div>
        </div>

        {/* Controls */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <button onClick={() => void onPrevious()} style={BTN}>
            <SkipBackIcon size={24} />
          </button>

          <button
            onClick={() => onSkipBackward(skipSeconds)}
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, background: 'none', border: 'none', cursor: 'pointer' }}
          >
            <SkipBackIcon size={20} style={{ color: 'var(--text-3)' }} />
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-3)', fontVariantNumeric: 'tabular-nums' }}>{skipSeconds}s</span>
          </button>

          <button
            onClick={onPlayPause}
            disabled={buffering}
            style={{
              width: 64, height: 64, borderRadius: 32,
              background: 'var(--accent)', color: 'var(--accent-text)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: 'none', cursor: 'pointer', flexShrink: 0,
            }}
          >
            {isPlaying
              ? <PauseIcon size={28} />
              : <PlayIcon size={28} style={{ marginLeft: 3 }} />
            }
          </button>

          <button
            onClick={() => onSkipForward(skipSeconds)}
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, background: 'none', border: 'none', cursor: 'pointer' }}
          >
            <SkipForwardIcon size={20} style={{ color: 'var(--text-3)' }} />
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-3)', fontVariantNumeric: 'tabular-nums' }}>{skipSeconds}s</span>
          </button>

          <button onClick={() => void onNext()} style={BTN}>
            <SkipForwardIcon size={24} />
          </button>
        </div>

        {/* Speed pills */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
          {SPEEDS.map((s) => (
            <button
              key={s}
              onClick={() => onSetSpeed(s)}
              style={{
                height: 28, padding: '0 10px', borderRadius: 'var(--r-pill)',
                background: speed === s ? 'var(--accent)' : 'var(--surface-2)',
                color: speed === s ? 'var(--accent-text)' : 'var(--text-3)',
                border: 'none', cursor: 'pointer',
                fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 500,
              }}
            >
              {s}x
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
