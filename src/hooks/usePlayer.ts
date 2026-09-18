import { useState, useEffect, useMemo, useRef } from 'react';
import { player } from '../player/player';
import { getSettings } from '../state/db';
import { getLocalPlaybackState } from '../state/driveState';
import { toast } from '../lib/toast';
import type { DriveFile } from '../drive/types';
import type { PlayerEvent, QueuedFile, SleepTimer } from '../player/player';

export interface PlayerHookState {
  currentFile: DriveFile | null;
  sourceFolder: string;
  isPlaying: boolean;
  position: number;
  duration: number;
  speed: number;
  skipSeconds: number;
  buffering: boolean;
  error: string | null;
  currentIndex: number;
  queue: DriveFile[];
  customQueue: QueuedFile[];
  sleepTimer: SleepTimer | null;
  // Réglage choisi par l'utilisateur (pour surligner la bonne pastille)
  sleepChoice: SleepChoice;
}

export type { QueuedFile, SleepTimer };

// Réglage du minuteur : minutes, fin de la piste en cours, ou aucun
export type SleepChoice = number | 'track' | null;

export interface PlayerActions {
  play: () => Promise<void>;
  pause: () => void;
  togglePlay: () => void;
  seekTo: (t: number) => void;
  skipForward: () => void;
  skipBackward: () => void;
  playNext: () => Promise<void>;
  playPrevious: () => Promise<void>;
  setSpeed: (s: number) => void;
  setSkipSeconds: (s: number) => void;
  setAutoRewind: (s: number) => void;
  setVoiceBoost: (enabled: boolean) => void;
  setSleepTimer: (choice: SleepChoice) => void;
  // Démarre un fichier avec les réglages courants et sa position sauvegardée.
  // `queue` remplace la file de lecture du dossier ; omise, on garde l'actuelle.
  startPlayback: (file: DriveFile, sourceFolder: string, queue?: { files: DriveFile[]; index: number }) => Promise<void>;
  addToCustomQueue: (file: DriveFile, sourceFolder: string) => void;
  removeFromCustomQueue: (index: number) => void;
  clearCustomQueue: () => void;
}

const initialState: PlayerHookState = {
  currentFile: null,
  sourceFolder: '',
  isPlaying: false,
  position: 0,
  duration: 0,
  speed: 1,
  skipSeconds: 30,
  buffering: false,
  error: null,
  currentIndex: -1,
  queue: [],
  customQueue: [],
  sleepTimer: null,
  sleepChoice: null,
};

export type ArchiveHandler = (file: DriveFile, sourceFolder: string) => void;

export function usePlayer(onArchive?: ArchiveHandler): { state: PlayerHookState; actions: PlayerActions } {
  const [state, setState] = useState<PlayerHookState>(initialState);
  const onArchiveRef = useRef(onArchive);
  onArchiveRef.current = onArchive;

  useEffect(() => {
    void getSettings().then((s) => {
      player.setAutoRewind(s.autoRewindSeconds);
      player.setVoiceBoost(s.voiceBoost);
      player.setSkipSeconds(s.skipForwardSeconds);
      setState((prev) => ({ ...prev, skipSeconds: s.skipForwardSeconds }));
    });
  }, []);

  useEffect(() => {
    return player.on((event: PlayerEvent) => {
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
          toast.error(`Lecture impossible : ${event.message}`);
          break;
        case 'sleeptimer':
          setState((s) => ({ ...s, sleepTimer: event.timer, sleepChoice: event.timer ? s.sleepChoice : null }));
          if (event.fired) toast.info('Minuteur de veille : lecture arrêtée');
          break;
        case 'trackchange':
          setState((s) => ({
            ...s,
            currentFile: event.file,
            sourceFolder: event.sourceFolder,
            currentIndex: event.index,
            queue: player.getQueue(),
            position: 0,
            error: null,
          }));
          break;
        case 'archive':
          onArchiveRef.current?.(event.file, event.sourceFolder);
          break;
        case 'queueupdate':
          setState((s) => ({ ...s, customQueue: event.customQueue }));
          break;
      }
    });
  }, []);

  // Toutes les actions délèguent au singleton : identité stable, les
  // composants mémoïsés ne se re-rendent pas à chaque timeupdate
  const actions = useMemo<PlayerActions>(() => {
    const setSpeed = (s: number): void => {
      player.setSpeed(s);
      setState((prev) => ({ ...prev, speed: s }));
    };
    const setSkipSeconds = (s: number): void => {
      player.setSkipSeconds(s);
      setState((prev) => ({ ...prev, skipSeconds: s }));
    };

    return {
      play: () => player.play(),
      pause: () => player.pause(),
      togglePlay: () => { if (player.isPlaying()) player.pause(); else void player.play(); },
      seekTo: (t) => player.seekTo(t),
      skipForward: () => player.skipForward(),
      skipBackward: () => player.skipBackward(),
      playNext: () => player.playNext(),
      playPrevious: () => player.playPrevious(),
      setSpeed,
      setSkipSeconds,
      setAutoRewind: (s) => player.setAutoRewind(s),
      setVoiceBoost: (enabled) => player.setVoiceBoost(enabled),
      setSleepTimer: (choice) => {
        setState((s) => ({ ...s, sleepChoice: choice }));
        if (choice === null) player.setSleepTimer(null);
        else if (choice === 'track') player.setSleepTimer({ kind: 'track' });
        else player.setSleepTimer({ kind: 'duration', endsAt: Date.now() + choice * 60_000 });
      },
      startPlayback: async (file, sourceFolder, queue) => {
        const settings = await getSettings();
        if (queue) {
          player.setQueue(queue.files, sourceFolder, queue.index);
          setState((s) => ({ ...s, queue: [...queue.files], currentIndex: queue.index }));
        }
        setSpeed(settings.defaultSpeed);
        setSkipSeconds(settings.skipForwardSeconds);
        const saved = await getLocalPlaybackState(file.id);
        await player.loadAndPlay(file, sourceFolder, saved?.position ?? 0);
      },
      addToCustomQueue: (file, sourceFolder) => player.addToCustomQueue(file, sourceFolder),
      removeFromCustomQueue: (index) => player.removeFromCustomQueue(index),
      clearCustomQueue: () => player.clearCustomQueue(),
    };
  }, []);

  return { state, actions };
}
