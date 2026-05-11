import { getStreamUrl, getAuthenticatedStreamHeaders } from '../drive/api';
import { getOfflineAudioUrl } from '../offline/cache';
import { saveStateWithSync, flushStateToDrive } from '../state/driveState';
import { setupMediaSession, updateMediaSessionState, clearMediaSession } from './mediaSession';
import type { DriveFile } from '../drive/types';

export interface PlayerState {
  currentFile: DriveFile | null;
  sourceFolder: string;
  queue: DriveFile[];
  currentIndex: number;
  isPlaying: boolean;
  position: number;
  duration: number;
  speed: number;
  skipSeconds: number;
  buffering: boolean;
  error: string | null;
}

export type PlayerEvent =
  | { type: 'timeupdate'; position: number; duration: number }
  | { type: 'play' }
  | { type: 'pause' }
  | { type: 'ended' }
  | { type: 'error'; message: string }
  | { type: 'buffering'; value: boolean }
  | { type: 'loaded'; duration: number }
  | { type: 'archive'; fileId: string; fileName: string; sourceFolder: string }
  | { type: 'trackchange'; file: DriveFile; index: number };

type EventListener = (event: PlayerEvent) => void;

const ARCHIVE_THRESHOLD = 0.95;
const SAVE_INTERVAL_MS = 5_000;

class AudioPlayer {
  private audio: HTMLAudioElement;
  private listeners: EventListener[] = [];
  private saveTimer: ReturnType<typeof setInterval> | null = null;
  private archiveTriggered = new Set<string>();
  private currentFile: DriveFile | null = null;
  private currentSource = '';
  private queue: DriveFile[] = [];
  private currentIndex = -1;
  skipSeconds = 30;
  private isLoadingNext = false;

  constructor() {
    this.audio = new Audio();
    this.audio.preload = 'auto';
    this.bindAudioEvents();
    this.bindVisibilityEvents();
  }

  private emit(event: PlayerEvent): void {
    for (const l of this.listeners) l(event);
  }

  on(listener: EventListener): () => void {
    this.listeners.push(listener);
    return () => { this.listeners = this.listeners.filter((l) => l !== listener); };
  }

  private bindAudioEvents(): void {
    this.audio.addEventListener('timeupdate', () => {
      const pos = this.audio.currentTime;
      const dur = this.audio.duration || 0;
      this.emit({ type: 'timeupdate', position: pos, duration: dur });
      this.checkArchiveThreshold(pos, dur);
    });

    this.audio.addEventListener('play', () => {
      this.emit({ type: 'play' });
      this.startSaveTimer();
      if (this.currentFile) {
        updateMediaSessionState('playing', this.audio.currentTime, this.audio.duration || 0, this.audio.playbackRate);
      }
    });

    this.audio.addEventListener('pause', () => {
      this.emit({ type: 'pause' });
      if (this.currentFile) {
        updateMediaSessionState('paused', this.audio.currentTime, this.audio.duration || 0, this.audio.playbackRate);
      }
    });

    this.audio.addEventListener('ended', () => {
      this.emit({ type: 'ended' });
      void this.playNext();
    });

    this.audio.addEventListener('loadedmetadata', () => {
      this.emit({ type: 'loaded', duration: this.audio.duration });
      updateMediaSessionState(
        this.audio.paused ? 'paused' : 'playing',
        this.audio.currentTime,
        this.audio.duration,
        this.audio.playbackRate,
      );
    });

    this.audio.addEventListener('waiting', () => this.emit({ type: 'buffering', value: true }));
    this.audio.addEventListener('canplay', () => this.emit({ type: 'buffering', value: false }));
    this.audio.addEventListener('playing', () => this.emit({ type: 'buffering', value: false }));

    this.audio.addEventListener('error', () => {
      const code = this.audio.error?.code ?? 0;
      const msg = this.audio.error?.message || `Erreur lecture (code ${code})`;
      console.error('[player] media error', code, msg, this.audio.src.slice(0, 100));
      if (code === MediaError.MEDIA_ERR_NETWORK) {
        this.handleNetworkError();
      } else {
        this.emit({ type: 'error', message: msg });
      }
    });
  }

  private bindVisibilityEvents(): void {
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') void this.savePosition();
    });
    window.addEventListener('beforeunload', () => void this.savePosition());
    window.addEventListener('pagehide', () => void this.savePosition());
  }

  private handleNetworkError(): void {
    const savedPosition = this.audio.currentTime;
    const file = this.currentFile;
    setTimeout(async () => {
      if (!file || !navigator.onLine) return;
      try {
        const freshUrl = await getStreamUrl(file.id);
        this.audio.src = freshUrl;
        this.audio.load();
        this.audio.currentTime = savedPosition;
        await this.audio.play();
      } catch { /* retry silently */ }
    }, 3_000);
  }

  private checkArchiveThreshold(pos: number, dur: number): void {
    if (!this.currentFile || !dur || dur < 10) return;
    const ratio = pos / dur;
    if (ratio >= ARCHIVE_THRESHOLD && !this.archiveTriggered.has(this.currentFile.id)) {
      this.archiveTriggered.add(this.currentFile.id);
      this.emit({
        type: 'archive',
        fileId: this.currentFile.id,
        fileName: this.currentFile.name,
        sourceFolder: this.currentSource,
      });
    }
  }

  private startSaveTimer(): void {
    if (this.saveTimer) return;
    this.saveTimer = setInterval(() => void this.savePosition(), SAVE_INTERVAL_MS);
  }

  private stopSaveTimer(): void {
    if (this.saveTimer) {
      clearInterval(this.saveTimer);
      this.saveTimer = null;
    }
  }

  private async savePosition(): Promise<void> {
    if (!this.currentFile) return;
    const pos = this.audio.currentTime;
    const dur = this.audio.duration || 0;
    if (!dur) return;
    await saveStateWithSync({
      fileId: this.currentFile.id,
      position: pos,
      duration: dur,
      lastUpdated: Date.now(),
      sourceFolder: this.currentSource,
      fileName: this.currentFile.name,
    });
  }

  setQueue(files: DriveFile[], sourceFolder: string, startIndex = 0): void {
    this.queue = [...files];
    this.currentSource = sourceFolder;
    this.currentIndex = startIndex;
  }

  setSkipSeconds(seconds: number): void {
    this.skipSeconds = seconds;
  }

  async loadAndPlay(file: DriveFile, sourceFolder: string, startPosition = 0): Promise<void> {
    this.stopSaveTimer();
    await this.savePosition();

    this.currentFile = file;
    this.currentSource = sourceFolder;
    this.archiveTriggered.delete(file.id);

    const offlineUrl = await getOfflineAudioUrl(file.id, file.name);
    const url = offlineUrl ?? await getStreamUrl(file.id);

    this.audio.src = url;
    this.audio.load();

    if (startPosition > 0) {
      await new Promise<void>((resolve) => {
        const onLoaded = (): void => {
          this.audio.currentTime = startPosition;
          resolve();
          this.audio.removeEventListener('loadedmetadata', onLoaded);
        };
        this.audio.addEventListener('loadedmetadata', onLoaded);
        setTimeout(() => { resolve(); }, 5_000);
      });
    }

    setupMediaSession(file.name.replace(/\.mp3$/i, ''), sourceFolder, {
      onPlay: () => void this.play(),
      onPause: () => this.pause(),
      onPrevious: () => void this.playPrevious(),
      onNext: () => void this.playNext(),
      onSeekTo: (t) => this.seekTo(t),
      onSeekBackward: (offset) => this.skip(-offset),
      onSeekForward: (offset) => this.skip(offset),
    });

    try {
      await this.audio.play();
    } catch (err) {
      if ((err as DOMException).name !== 'AbortError') {
        this.emit({ type: 'error', message: String(err) });
      }
    }

    this.emit({ type: 'trackchange', file, index: this.currentIndex });
  }

  async play(): Promise<void> {
    try { await this.audio.play(); } catch { /* user gesture required */ }
  }

  pause(): void {
    this.audio.pause();
    this.stopSaveTimer();
    void this.savePosition();
  }

  seekTo(time: number): void {
    if (!isFinite(time)) return;
    this.audio.currentTime = Math.max(0, Math.min(time, this.audio.duration || 0));
  }

  skip(offsetSeconds: number): void {
    this.seekTo(this.audio.currentTime + offsetSeconds);
  }

  setSpeed(speed: number): void {
    this.audio.playbackRate = speed;
  }

  async playNext(): Promise<void> {
    if (this.isLoadingNext) return;
    if (this.currentIndex < this.queue.length - 1) {
      this.isLoadingNext = true;
      this.currentIndex++;
      const next = this.queue[this.currentIndex];
      this.isLoadingNext = false;
      await this.loadAndPlay(next, this.currentSource);
    } else {
      clearMediaSession();
      this.stopSaveTimer();
    }
  }

  async playPrevious(): Promise<void> {
    if (this.audio.currentTime > 5) {
      this.seekTo(0);
      return;
    }
    if (this.currentIndex > 0) {
      this.currentIndex--;
      const prev = this.queue[this.currentIndex];
      await this.loadAndPlay(prev, this.currentSource);
    }
  }

  getCurrentState(): { position: number; duration: number; isPlaying: boolean } {
    return {
      position: this.audio.currentTime,
      duration: this.audio.duration || 0,
      isPlaying: !this.audio.paused,
    };
  }

  getCurrentFile(): DriveFile | null {
    return this.currentFile;
  }

  getCurrentIndex(): number {
    return this.currentIndex;
  }

  getQueue(): DriveFile[] {
    return this.queue;
  }

  async stop(): Promise<void> {
    this.stopSaveTimer();
    await this.savePosition();
    await flushStateToDrive();
    this.audio.pause();
    this.audio.src = '';
    this.currentFile = null;
    clearMediaSession();
  }
}

export const player = new AudioPlayer();
