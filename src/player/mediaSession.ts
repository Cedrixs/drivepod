export interface MediaSessionHandlers {
  onPlay: () => void;
  onPause: () => void;
  onPrevious: () => void;
  onNext: () => void;
  onSeekTo: (time: number) => void;
  onSeekBackward: (offset: number) => void;
  onSeekForward: (offset: number) => void;
}

const ACTIONS: MediaSessionAction[] = [
  'play', 'pause', 'previoustrack', 'nexttrack', 'seekto', 'seekbackward', 'seekforward',
];

function hasMediaSession(): boolean {
  return typeof navigator !== 'undefined' && 'mediaSession' in navigator;
}

export function setupMediaSession(
  title: string,
  source: string,
  handlers: MediaSessionHandlers,
  defaultSkipSeconds = 30,
): void {
  if (!hasMediaSession()) return;

  navigator.mediaSession.metadata = new MediaMetadata({
    title,
    artist: source,
    album: 'Drivepod',
    artwork: [
      { src: '/drivepod/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/drivepod/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
  });

  const bind = (action: MediaSessionAction, handler: MediaSessionActionHandler): void => {
    try { navigator.mediaSession.setActionHandler(action, handler); } catch { /* action non supportée */ }
  };

  bind('play', handlers.onPlay);
  bind('pause', handlers.onPause);
  bind('previoustrack', handlers.onPrevious);
  bind('nexttrack', handlers.onNext);
  bind('seekto', (details) => {
    if (details.seekTime !== undefined) handlers.onSeekTo(details.seekTime);
  });
  bind('seekbackward', (details) => handlers.onSeekBackward(details.seekOffset ?? defaultSkipSeconds));
  bind('seekforward', (details) => handlers.onSeekForward(details.seekOffset ?? defaultSkipSeconds));
}

export function updateMediaSessionState(
  state: 'playing' | 'paused' | 'none',
  position?: number,
  duration?: number,
  playbackRate?: number,
): void {
  if (!hasMediaSession()) return;
  navigator.mediaSession.playbackState = state;
  if (position === undefined || duration === undefined || !isFinite(duration) || duration <= 0) return;
  try {
    navigator.mediaSession.setPositionState({
      duration,
      position: Math.max(0, Math.min(position, duration)),
      playbackRate: playbackRate ?? 1,
    });
  } catch {
    // setPositionState absent ou valeurs refusées par le navigateur
  }
}

export function clearMediaSession(): void {
  if (!hasMediaSession()) return;
  navigator.mediaSession.metadata = null;
  navigator.mediaSession.playbackState = 'none';
  for (const action of ACTIONS) {
    try { navigator.mediaSession.setActionHandler(action, null); } catch { /* ignore */ }
  }
}
