import { useState, useEffect, useCallback } from 'react';
import { player } from '../player/player';
import { getSettings } from '../state/db';
import type { DriveFile } from '../drive/types';
import type { PlayerEvent } from '../player/player';

export interface PlayerHookState {
  currentFile: DriveFile | null;
  isPlaying: boolean;
  position: number;
  duration: number;
  speed: number;
  buffering: boolean;
  error: string | null;
  currentIndex: number;
  queue: DriveFile[];
}

const initialState: PlayerHookState = {
  currentFile: null,
  isPlaying: false,
  position: 0,
  duration: 0,
  speed: 1,
  buffering: false,
  error: null,
  currentIndex: -1,
  queue: [],
};

export function usePlayer(onArchive?: (fileId: string, fileName: string, sourceFolder: string) => void): {
  state: PlayerHookState;
  play: () => Promise<void>;
  pause: () => void;
  seekTo: (t: number) => void;
  skipForward: (s: number) => void;
  skipBackward: (s: number) => void;
  playNext: () => Promise<void>;
  playPrevious: () => Promise<void>;
  setSpeed: (s: number) => void;
  loadAndPlay: (file: DriveFile, source: string, startPos?: number) => Promise<void>;
  setQueue: (files: DriveFile[], source: string, startIndex?: number) => void;
  setSkipSeconds: (s: number) => void;
  setAutoRewind: (s: number) => void;
} {
  const [state, setState] = useState<PlayerHookState>(initialState);

  useEffect(() => {
    void getSettings().then((s) => player.setAutoRewind(s.autoRewindSeconds));
  }, []);

  useEffect(() => {
    const off = player.on((event: PlayerEvent) => {
      switch (event.type) {
        case 'timeupdate':
          setState((s) => ({ ...s, position: event.position, duration: event.duration }));
          break;
        case 'play':
          setState((s) => ({ ...s, isPlaying: true, error: null }));
          break;
        case 'pause':
          setState((s) => ({ ...s, isPlaying: false }));
          break;
        case 'loaded':
          setState((s) => ({ ...s, duration: event.duration }));
          break;
        case 'buffering':
          setState((s) => ({ ...s, buffering: event.value }));
          break;
        case 'error':
          setState((s) => ({ ...s, error: event.message, buffering: false }));
          break;
        case 'trackchange':
          setState((s) => ({
            ...s,
            currentFile: event.file,
            currentIndex: event.index,
            queue: player.getQueue(),
            position: 0,
            error: null,
          }));
          break;
        case 'archive':
          onArchive?.(event.fileId, event.fileName, event.sourceFolder);
          break;
      }
    });
    return off;
  }, [onArchive]);

  const loadAndPlay = useCallback(async (file: DriveFile, source: string, startPos = 0) => {
    await player.loadAndPlay(file, source, startPos);
  }, []);

  const setQueue = useCallback((files: DriveFile[], source: string, startIndex = 0) => {
    player.setQueue(files, source, startIndex);
    setState((s) => ({ ...s, queue: [...files], currentIndex: startIndex }));
  }, []);

  return {
    state,
    play: () => player.play(),
    pause: () => player.pause(),
    seekTo: (t) => player.seekTo(t),
    skipForward: (s) => player.skip(s),
    skipBackward: (s) => player.skip(-s),
    playNext: () => player.playNext(),
    playPrevious: () => player.playPrevious(),
    setSpeed: (s) => { player.setSpeed(s); setState((prev) => ({ ...prev, speed: s })); },
    loadAndPlay,
    setQueue,
    setSkipSeconds: (s: number) => { player.skipSeconds = s; },
    setAutoRewind: (s: number) => { player.setAutoRewind(s); },
  };
}
