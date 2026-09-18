import { getStreamUrl } from '../drive/api';
import { getOfflineAudioUrl } from '../offline/cache';
import { saveStateWithSync } from '../state/driveState';
import { logListeningTime, logFileCompleted } from '../state/listeningStats';
import { setupMediaSession, updateMediaSessionState, clearMediaSession } from './mediaSession';
import { stripMp3 } from '../lib/format';
import type { DriveFile } from '../drive/types';

export interface QueuedFile {
  file: DriveFile;
  sourceFolder: string;
}

export type PlayerEvent =
  | { type: 'timeupdate'; position: number; duration: number }
  | { type: 'play' }
  | { type: 'pause' }
  | { type: 'ended' }
  | { type: 'error'; message: string }
  | { type: 'buffering'; value: boolean }
  | { type: 'loaded'; duration: number }
  | { type: 'archive'; file: DriveFile; sourceFolder: string }
  | { type: 'trackchange'; file: DriveFile; index: number; sourceFolder: string }
  | { type: 'queueupdate'; customQueue: QueuedFile[] };

type EventListener = (event: PlayerEvent) => void;

export const ARCHIVE_THRESHOLD = 0.95;
const SAVE_INTERVAL_MS = 5_000;
const METADATA_TIMEOUT_MS = 5_000;
const NETWORK_RETRY_DELAY_MS = 3_000;
// Reprise après une pause plus longue que ceci : on recule de autoRewindSeconds
const REWIND_THRESHOLD_MS = 30_000;
// Borne le temps d'écoute crédité entre deux sauvegardes (onglet gelé, veille)
const MAX_ELAPSED_MS = 60_000;

class AudioPlayer {
  private audio: HTMLAudioElement;
  private listeners: EventListener[] = [];
  private saveTimer: ReturnType<typeof setInterval> | null = null;
  private archiveTriggered = new Set<string>();
  private currentFile: DriveFile | null = null;
  private currentSource = '';
  // Dossier de la file de lecture, distinct de currentSource : un élément de
  // la file personnalisée peut venir d'un autre dossier sans dérouter la suite
  private queueSource = '';
  private queue: DriveFile[] = [];
  private currentIndex = -1;
  private customQueue: QueuedFile[] = [];
  private objectUrl: string | null = null;
  private loadToken = 0;
  private advancing = false;

  private speed = 1;
  private skipSeconds = 30;
  private autoRewindSeconds = 5;
  private pausedAt: number | null = null;
  private lastSaveAt: number | null = null;

  private audioCtx: AudioContext | null = null;
  private sourceNode: MediaElementAudioSourceNode | null = null;
  private compressor: DynamicsCompressorNode | null = null;
  private voiceBoostEnabled = false;

  constructor() {
    this.audio = new Audio();
    this.audio.preload = 'auto';
    this.bindAudioEvents();
    this.bindVisibilityEvents();
  }

  // ── Web Audio (boost voix) ────────────────────────────────────────────────

  // Créé uniquement quand le boost est demandé : sans lui, l'audio ne passe
  // pas par un AudioContext (qui peut rester suspendu par la politique autoplay)
  private ensureAudioContext(): void {
    if (this.audioCtx) return;
    this.audioCtx = new AudioContext();
    this.sourceNode = this.audioCtx.createMediaElementSource(this.audio);

    this.compressor = this.audioCtx.createDynamicsCompressor();
    // Réglé pour l'intelligibilité de la voix
    this.compressor.threshold.value = -24;
    this.compressor.knee.value = 10;
    this.compressor.ratio.value = 4;
    this.compressor.attack.value = 0.003;
    this.compressor.release.value = 0.25;

    this.wireAudioGraph();
    void this.resumeAudioContext();
  }

  private wireAudioGraph(): void {
    if (!this.audioCtx || !this.sourceNode || !this.compressor) return;
    this.sourceNode.disconnect();
    this.compressor.disconnect();
    if (this.voiceBoostEnabled) {
      this.sourceNode.connect(this.compressor).connect(this.audioCtx.destination);
    } else {
      this.sourceNode.connect(this.audioCtx.destination);
    }
  }

  private async resumeAudioContext(): Promise<void> {
    if (this.audioCtx?.state === 'suspended') {
      try { await this.audioCtx.resume(); } catch { /* reprise au prochain geste */ }
    }
  }

  setVoiceBoost(enabled: boolean): void {
    this.voiceBoostEnabled = enabled;
    if (enabled) this.ensureAudioContext();
    this.wireAudioGraph();
  }

  // ── Événements ────────────────────────────────────────────────────────────

  private emit(event: PlayerEvent): void {
    for (const l of this.listeners) l(event);
  }

  on(listener: EventListener): () => void {
    this.listeners.push(listener);
    return () => { this.listeners = this.listeners.filter((l) => l !== listener); };
  }

  private syncMediaSession(): void {
    if (!this.currentFile) return;
    updateMediaSessionState(
      this.audio.paused ? 'paused' : 'playing',
      this.audio.currentTime,
      this.audio.duration || 0,
      this.audio.playbackRate,
    );
  }

  private bindAudioEvents(): void {
    this.audio.addEventListener('timeupdate', () => {
      const pos = this.audio.currentTime;
      const dur = this.audio.duration || 0;
      this.emit({ type: 'timeupdate', position: pos, duration: dur });
      this.checkArchiveThreshold(pos, dur);
    });

    this.audio.addEventListener('play', () => {
      this.lastSaveAt = Date.now();
      this.emit({ type: 'play' });
      this.startSaveTimer();
      this.syncMediaSession();
    });

    this.audio.addEventListener('pause', () => {
      this.emit({ type: 'pause' });
      this.syncMediaSession();
    });

    this.audio.addEventListener('ended', () => {
      this.emit({ type: 'ended' });
      void this.playNext();
    });

    this.audio.addEventListener('loadedmetadata', () => {
      this.emit({ type: 'loaded', duration: this.audio.duration });
      this.syncMediaSession();
    });

    // Position et vitesse de l'écran de verrouillage : à jour après un seek
    // ou un changement de vitesse, pas seulement au play/pause
    this.audio.addEventListener('seeked', () => this.syncMediaSession());
    this.audio.addEventListener('ratechange', () => this.syncMediaSession());

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
    const token = this.loadToken;
    setTimeout(async () => {
      // Un autre fichier a été chargé entre-temps : on ne relance pas l'ancien
      if (!file || token !== this.loadToken || !navigator.onLine) return;
      try {
        this.setSource(getStreamUrl(file.id));
        this.audio.currentTime = savedPosition;
        await this.audio.play();
      } catch { /* retry silencieux */ }
    }, NETWORK_RETRY_DELAY_MS);
  }

  private checkArchiveThreshold(pos: number, dur: number): void {
    if (!this.currentFile || !dur || dur < 10) return;
    if (pos / dur < ARCHIVE_THRESHOLD || this.archiveTriggered.has(this.currentFile.id)) return;
    this.archiveTriggered.add(this.currentFile.id);
    void logFileCompleted();
    this.emit({ type: 'archive', file: this.currentFile, sourceFolder: this.currentSource });
  }

  // ── Sauvegarde de position ────────────────────────────────────────────────

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

    const now = Date.now();
    if (this.lastSaveAt !== null && !this.audio.paused) {
      const elapsed = Math.min(now - this.lastSaveAt, MAX_ELAPSED_MS);
      void logListeningTime(this.currentSource, elapsed / 1000);
    }
    this.lastSaveAt = now;

    await saveStateWithSync({
      fileId: this.currentFile.id,
      position: pos,
      duration: dur,
      lastUpdated: now,
      sourceFolder: this.currentSource,
      fileName: this.currentFile.name,
    });
  }

  // ── Chargement ────────────────────────────────────────────────────────────

  // Change la source en réappliquant la vitesse : le navigateur remet
  // playbackRate à defaultPlaybackRate à chaque load()
  private setSource(url: string): void {
    if (this.objectUrl) {
      URL.revokeObjectURL(this.objectUrl);
      this.objectUrl = null;
    }
    if (url.startsWith('blob:')) this.objectUrl = url;
    this.audio.src = url;
    this.audio.load();
    this.audio.defaultPlaybackRate = this.speed;
    this.audio.playbackRate = this.speed;
  }

  private waitForMetadata(): Promise<void> {
    if (this.audio.readyState >= HTMLMediaElement.HAVE_METADATA) return Promise.resolve();
    return new Promise<void>((resolve) => {
      const done = (): void => {
        clearTimeout(timer);
        this.audio.removeEventListener('loadedmetadata', done);
        resolve();
      };
      const timer = setTimeout(done, METADATA_TIMEOUT_MS);
      this.audio.addEventListener('loadedmetadata', done);
    });
  }

  setQueue(files: DriveFile[], sourceFolder: string, startIndex = 0): void {
    this.queue = [...files];
    this.queueSource = sourceFolder;
    this.currentSource = sourceFolder;
    this.currentIndex = startIndex;
  }

  setSkipSeconds(seconds: number): void {
    this.skipSeconds = seconds;
  }

  setAutoRewind(seconds: number): void {
    this.autoRewindSeconds = seconds;
  }

  async loadAndPlay(file: DriveFile, sourceFolder: string, startPosition = 0): Promise<void> {
    const token = ++this.loadToken;
    this.pausedAt = null;
    this.stopSaveTimer();
    await this.savePosition();
    this.lastSaveAt = null;

    this.currentFile = file;
    this.currentSource = sourceFolder;
    this.archiveTriggered.delete(file.id);

    const offlineUrl = await getOfflineAudioUrl(file.id, file.name);
    if (token !== this.loadToken) {
      if (offlineUrl) URL.revokeObjectURL(offlineUrl);
      return;
    }
    this.setSource(offlineUrl ?? getStreamUrl(file.id));

    if (startPosition > 0) {
      await this.waitForMetadata();
      if (token !== this.loadToken) return;
      this.audio.currentTime = startPosition;
    }

    setupMediaSession(stripMp3(file.name), sourceFolder, {
      onPlay: () => void this.play(),
      onPause: () => this.pause(),
      onPrevious: () => void this.playPrevious(),
      onNext: () => void this.playNext(),
      onSeekTo: (t) => this.seekTo(t),
      onSeekBackward: (offset) => this.skip(-offset),
      onSeekForward: (offset) => this.skip(offset),
    }, this.skipSeconds);

    this.emit({ type: 'trackchange', file, index: this.currentIndex, sourceFolder });

    await this.resumeAudioContext();
    try {
      await this.audio.play();
    } catch (err) {
      if ((err as DOMException).name !== 'AbortError') {
        this.emit({ type: 'error', message: String(err) });
      }
    }
  }

  // ── Contrôles ─────────────────────────────────────────────────────────────

  async play(): Promise<void> {
    await this.resumeAudioContext();
    if (this.pausedAt !== null && this.autoRewindSeconds > 0) {
      if (Date.now() - this.pausedAt >= REWIND_THRESHOLD_MS) this.skip(-this.autoRewindSeconds);
    }
    this.pausedAt = null;
    try { await this.audio.play(); } catch { /* geste utilisateur requis */ }
  }

  pause(): void {
    this.pausedAt = Date.now();
    this.audio.pause();
    this.stopSaveTimer();
    void this.savePosition();
  }

  isPlaying(): boolean {
    return !!this.currentFile && !this.audio.paused;
  }

  seekTo(time: number): void {
    if (!isFinite(time)) return;
    this.audio.currentTime = Math.max(0, Math.min(time, this.audio.duration || 0));
  }

  skip(offsetSeconds: number): void {
    this.seekTo(this.audio.currentTime + offsetSeconds);
  }

  skipForward(): void {
    this.skip(this.skipSeconds);
  }

  skipBackward(): void {
    this.skip(-this.skipSeconds);
  }

  setSpeed(speed: number): void {
    this.speed = speed;
    this.audio.defaultPlaybackRate = speed;
    this.audio.playbackRate = speed;
  }

  // ── File d'attente personnalisée ──────────────────────────────────────────

  addToCustomQueue(file: DriveFile, sourceFolder: string): void {
    this.customQueue.push({ file, sourceFolder });
    this.emit({ type: 'queueupdate', customQueue: [...this.customQueue] });
  }

  removeFromCustomQueue(index: number): void {
    this.customQueue.splice(index, 1);
    this.emit({ type: 'queueupdate', customQueue: [...this.customQueue] });
  }

  clearCustomQueue(): void {
    this.customQueue = [];
    this.emit({ type: 'queueupdate', customQueue: [] });
  }

  // La file personnalisée est prioritaire sur l'ordre du dossier
  async playNext(): Promise<void> {
    if (this.advancing) return;
    this.advancing = true;
    try {
      const queued = this.customQueue.shift();
      if (queued) {
        this.emit({ type: 'queueupdate', customQueue: [...this.customQueue] });
        await this.loadAndPlay(queued.file, queued.sourceFolder);
        return;
      }
      if (this.currentIndex < this.queue.length - 1) {
        this.currentIndex++;
        await this.loadAndPlay(this.queue[this.currentIndex], this.queueSource);
      } else {
        clearMediaSession();
        this.stopSaveTimer();
      }
    } finally {
      this.advancing = false;
    }
  }

  async playPrevious(): Promise<void> {
    if (this.audio.currentTime > 5 || this.currentIndex <= 0) {
      this.seekTo(0);
      return;
    }
    this.currentIndex--;
    await this.loadAndPlay(this.queue[this.currentIndex], this.queueSource);
  }

  getQueue(): DriveFile[] {
    return this.queue;
  }
}

export const player = new AudioPlayer();
