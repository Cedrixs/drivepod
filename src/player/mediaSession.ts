export interface MediaSessionHandlers {
  onPlay: () => void;
  onPause: () => void;
  onPrevious: () => void;
  onNext: () => void;
  onSeekTo: (time: number) => void;
  onSeekBackward: (offset: number) => void;
  onSeekForward: (offset: number) => void;
}

export function setupMediaSession(
  title: string,
  source: string,
  handlers: MediaSessionHandlers,
): void {
  if (!('mediaSession' in navigator)) return;

  navigator.mediaSession.metadata = new MediaMetadata({
    title,
    artist: source,
    album: 'Drivepod',
    artwork: [
      { src: '/drivepod/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/drivepod/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
  });

  navigator.mediaSession.setActionHandler('play', handlers.onPlay);
  navigator.mediaSession.setActionHandler('pause', handlers.onPause);
  navigator.mediaSession.setActionHandler('previoustrack', handlers.onPrevious);
  navigator.mediaSession.setActionHandler('nexttrack', handlers.onNext);
  navigator.mediaSession.setActionHandler('seekto', (details) => {
    if (details.seekTime !== undefined) handlers.onSeekTo(details.seekTime);
  });
  navigator.mediaSession.setActionHandler('seekbackward', (details) => {
    handlers.onSeekBackward(details.seekOffset ?? 30);
  });
  navigator.mediaSession.setActionHandler('seekforward', (details) => {
    handlers.onSeekForward(details.seekOffset ?? 30);
  });
}

export function updateMediaSessionState(
  state: 'playing' | 'paused' | 'none',
  position?: number,
  duration?: number,
  playbackRate?: number,
): void {
  if (!('mediaSession' in navigator)) return;
  navigator.mediaSession.playbackState = state;
  if (position !== undefined && duration !== undefined) {
    try {
      navigator.mediaSession.setPositionState({
        duration,
        position: Math.min(position, duration),
        playbackRate: playbackRate ?? 1,
      });
    } catch {
      // not all browsers support setPositionState
    }
  }
}

export function clearMediaSession(): void {
  if (!('mediaSession' in navigator)) return;
  navigator.mediaSession.metadata = null;
  navigator.mediaSession.playbackState = 'none';
  const handlers: MediaSessionAction[] = [
    'play', 'pause', 'previoustrack', 'nexttrack', 'seekto', 'seekbackward', 'seekforward',
  ];
  for (const action of handlers) {
    try { navigator.mediaSession.setActionHandler(action, null); } catch { /* ignore */ }
  }
}
