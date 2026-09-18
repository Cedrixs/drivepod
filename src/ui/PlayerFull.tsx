import { useCallback, useEffect, useState } from 'react';
import {
  PlayIcon, PauseIcon, SkipBackIcon, SkipForwardIcon,
  ChevronDownIcon, ArchiveIcon, BookmarkIcon, CheckIcon, MoonIcon,
} from './icons';
import { fetchMarkdownContent } from '../drive/api';
import { extractSummary } from '../lib/markdown';
import { formatTime, abbrev, stripMp3 } from '../lib/format';
import { PLAYBACK_SPEEDS } from '../drive/types';
import { FullscreenPanel, IconButton } from './primitives';
import type { PlayerHookState, PlayerActions, SleepChoice, SleepTimer } from '../hooks/usePlayer';

interface Props {
  playerState: PlayerHookState;
  actions: PlayerActions;
  onArchive: () => void;
  onCapture: () => Promise<boolean>;
  onClose: () => void;
  sourceFolderId?: string;
}

type CaptureStatus = 'idle' | 'saving' | 'done' | 'failed';

const SLEEP_CHOICES: { value: SleepChoice; label: string }[] = [
  { value: null, label: 'Off' },
  { value: 15, label: '15 min' },
  { value: 30, label: '30 min' },
  { value: 45, label: '45 min' },
  { value: 60, label: '1 h' },
  { value: 'track', label: 'Fin de piste' },
];

// Recalcule le temps restant chaque seconde tant qu'un minuteur court
function useSleepRemaining(timer: SleepTimer | null): number | null {
  const [, tick] = useState(0);
  useEffect(() => {
    if (timer?.kind !== 'duration') return;
    const id = setInterval(() => tick((n) => n + 1), 1_000);
    return () => clearInterval(id);
  }, [timer]);
  if (timer?.kind !== 'duration') return null;
  return Math.max(0, Math.round((timer.endsAt - Date.now()) / 1000));
}

export function PlayerFull({
  playerState, actions, onArchive, onCapture, onClose, sourceFolderId,
}: Props): React.JSX.Element | null {
  const { currentFile, sourceFolder, isPlaying, position, duration, speed, skipSeconds, buffering, error, sleepTimer, sleepChoice } = playerState;
  const [summary, setSummary] = useState<string | null>(null);
  const [captureStatus, setCaptureStatus] = useState<CaptureStatus>('idle');
  const [sleepOpen, setSleepOpen] = useState(false);
  // Position affichée pendant que l'utilisateur fait glisser la barre : les
  // timeupdate ne reprennent la main qu'au relâchement (pas de curseur qui saute)
  const [scrubPosition, setScrubPosition] = useState<number | null>(null);
  const sleepRemaining = useSleepRemaining(sleepTimer);

  const currentFileName = currentFile?.name ?? null;
  useEffect(() => {
    setSummary(null);
    if (!currentFileName || !sourceFolderId) return;
    let cancelled = false;
    void fetchMarkdownContent(sourceFolderId, currentFileName).then((md) => {
      if (!cancelled) setSummary(md ? extractSummary(md) : null);
    });
    return () => { cancelled = true; };
  }, [currentFileName, sourceFolderId]);

  useEffect(() => {
    if (captureStatus !== 'done' && captureStatus !== 'failed') return;
    const timer = setTimeout(() => setCaptureStatus('idle'), 2000);
    return () => clearTimeout(timer);
  }, [captureStatus]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const handleCapture = useCallback(async (): Promise<void> => {
    if (captureStatus === 'saving') return;
    setCaptureStatus('saving');
    const ok = await onCapture();
    setCaptureStatus(ok ? 'done' : 'failed');
  }, [onCapture, captureStatus]);

  const commitScrub = useCallback((): void => {
    if (scrubPosition === null) return;
    actions.seekTo(scrubPosition);
    setScrubPosition(null);
  }, [scrubPosition, actions]);

  if (!currentFile) return null;

  const shownPosition = scrubPosition ?? position;
  const remaining = Math.max(0, duration - shownPosition);
  const captureColor = captureStatus === 'done' ? 'var(--success)'
    : captureStatus === 'failed' ? 'var(--danger)'
      : captureStatus === 'saving' ? 'var(--accent)' : 'var(--text-3)';

  const headerLabel = sleepTimer?.kind === 'track'
    ? 'Arrêt en fin de piste'
    : sleepRemaining !== null
      ? `Veille dans ${formatTime(sleepRemaining)}`
      : buffering ? 'Chargement' : 'En lecture';
  return (
    <FullscreenPanel className="select-none">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 8px 4px 12px', minHeight: 52 }}>
        <IconButton label="Réduire le lecteur" onClick={onClose}>
          <ChevronDownIcon size={22} />
        </IconButton>
        <span
          aria-live="polite"
          style={{ fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 500, letterSpacing: '0.1em', color: sleepTimer ? 'var(--accent)' : 'var(--text-3)', textTransform: 'uppercase', fontVariantNumeric: 'tabular-nums' }}
        >
          {headerLabel}
        </span>
        <div style={{ display: 'flex' }}>
          <IconButton
            label={sleepOpen ? 'Fermer le minuteur de veille' : 'Minuteur de veille'}
            onClick={() => setSleepOpen((o) => !o)}
            active={!!sleepTimer || sleepOpen}
            aria-expanded={sleepOpen}
          >
            <MoonIcon size={20} />
          </IconButton>
          <IconButton
            label={captureStatus === 'done' ? 'Passage capturé' : 'Capturer ce passage'}
            onClick={() => void handleCapture()}
            disabled={captureStatus === 'saving'}
            style={{ color: captureColor }}
          >
            {captureStatus === 'done' ? <CheckIcon size={20} /> : <BookmarkIcon size={20} />}
          </IconButton>
          <IconButton label="Archiver et passer au suivant" onClick={onArchive}>
            <ArchiveIcon size={20} />
          </IconButton>
        </div>
      </div>

      {/* Minuteur de veille (repliable) */}
      {sleepOpen && (
        <div role="group" aria-label="Minuteur de veille" style={{ padding: '4px 24px 12px', display: 'flex', flexWrap: 'wrap', gap: 6, justifyContent: 'center' }}>
          {SLEEP_CHOICES.map((choice) => {
            const active = choice.value === sleepChoice;
            return (
              <button
                type="button"
                key={String(choice.value)}
                aria-pressed={active}
                onClick={() => { actions.setSleepTimer(choice.value); if (choice.value !== null) setSleepOpen(false); }}
                style={{
                  height: 28, padding: '0 10px', borderRadius: 'var(--r-pill)',
                  background: active ? 'var(--accent)' : 'var(--surface-2)',
                  color: active ? 'var(--accent-text)' : 'var(--text-3)',
                  border: 'none', cursor: 'pointer',
                  fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 500, whiteSpace: 'nowrap',
                }}
              >
                {choice.label}
              </button>
            );
          })}
        </div>
      )}

      {/* Cote + titre */}
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
            {stripMp3(currentFile.name)}
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
          {error && (
            <p role="alert" style={{ fontFamily: 'var(--font-sans)', fontSize: 12, color: 'var(--danger)', margin: '10px 0 0' }}>
              {error}
            </p>
          )}
        </div>
      </div>

      {/* Seek + contrôles + vitesse */}
      <div style={{ padding: '0 24px 20px' }}>
        <div style={{ marginBottom: 20 }}>
          <input
            type="range"
            aria-label="Position de lecture"
            min={0}
            max={duration || 1}
            step={1}
            value={shownPosition}
            onPointerDown={() => setScrubPosition(position)}
            onChange={(e) => {
              const value = parseFloat(e.target.value);
              if (scrubPosition !== null) setScrubPosition(value);
              else actions.seekTo(value);
            }}
            onPointerUp={commitScrub}
            onPointerCancel={commitScrub}
            style={{ width: '100%', accentColor: 'var(--accent)', cursor: 'pointer', height: 3 }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-3)', fontVariantNumeric: 'tabular-nums' }}>
              {formatTime(shownPosition)}
            </span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-3)', fontVariantNumeric: 'tabular-nums' }}>
              -{formatTime(remaining)}
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <IconButton label="Piste précédente" onClick={() => void actions.playPrevious()}>
            <SkipBackIcon size={24} />
          </IconButton>

          <SkipButton label={`Reculer de ${skipSeconds} secondes`} seconds={skipSeconds} onClick={actions.skipBackward}>
            <SkipBackIcon size={20} />
          </SkipButton>

          <button
            type="button"
            aria-label={isPlaying ? 'Pause' : 'Lecture'}
            onClick={actions.togglePlay}
            style={{
              width: 64, height: 64, borderRadius: 32,
              background: 'var(--accent)', color: 'var(--accent-text)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: 'none', cursor: 'pointer', flexShrink: 0,
              opacity: buffering ? 0.7 : 1, transition: 'opacity 140ms',
            }}
          >
            {isPlaying
              ? <PauseIcon size={28} />
              : <PlayIcon size={28} style={{ marginLeft: 3 }} />
            }
          </button>

          <SkipButton label={`Avancer de ${skipSeconds} secondes`} seconds={skipSeconds} onClick={actions.skipForward}>
            <SkipForwardIcon size={20} />
          </SkipButton>

          <IconButton label="Piste suivante" onClick={() => void actions.playNext()}>
            <SkipForwardIcon size={24} />
          </IconButton>
        </div>

        <div role="group" aria-label="Vitesse de lecture" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
          {PLAYBACK_SPEEDS.map((s) => (
            <button
              type="button"
              key={s}
              aria-pressed={speed === s}
              onClick={() => actions.setSpeed(s)}
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
    </FullscreenPanel>
  );
}

function SkipButton({ label, seconds, onClick, children }: {
  label: string; seconds: number; onClick: () => void; children: React.ReactNode;
}): React.JSX.Element {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)', padding: 8 }}
    >
      {children}
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, fontVariantNumeric: 'tabular-nums' }}>{seconds}s</span>
    </button>
  );
}
