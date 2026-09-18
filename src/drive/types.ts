export interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  parents: string[];
  createdTime: string;
  modifiedTime: string;
  size?: string;
  md5Checksum?: string;
}

export interface DriveFolder {
  id: string;
  name: string;
  parents: string[];
}

// Un onglet de l'app : un dossier de Audio/ et ses MP3
export interface Source {
  folder: DriveFolder;
  files: DriveFile[];
}

// Credentials OAuth persistés en IndexedDB (refresh token chiffré AES-GCM)
export interface StoredTokens {
  accessToken: string;
  encryptedRefreshToken: string | null;
  expiresAt: number;
}

export interface PlaybackState {
  fileId: string;
  position: number;
  duration: number;
  lastUpdated: number;
  sourceFolder: string;
  fileName: string;
}

export interface OfflineAction {
  id: string;
  type: 'archive';
  fileId: string;
  fileName: string;
  sourceFolder: string;
  sourceFolderId: string;
  audioFolderId: string;
  createdAt: number;
  // Dossier hebdo de destination (ex "2026-S28") ; absent sur les actions
  // enregistrées avant cette version : semaine courante au moment du flush
  destWeekKey?: string;
}

// Métadonnées d'un MP3 téléchargé pour l'écoute hors-ligne
export interface CachedFileMeta {
  fileId: string;
  name: string;
  sourceFolder: string;
  sourceFolderId: string;
  size: number;
  cachedAt: number;
  createdTime?: string;
}

export interface ListeningDay {
  date: string;
  totalMinutes: number;
  bySource: Record<string, number>;
  filesCompleted: number;
}

export interface AppSettings {
  defaultSpeed: number;
  skipForwardSeconds: number;
  skipBackwardSeconds: number;
  autoDownload: boolean;
  autoDownloadCount: number;
  autoRewindSeconds: number;
  voiceBoost: boolean;
}

export const DEFAULT_SETTINGS: AppSettings = {
  defaultSpeed: 1,
  skipForwardSeconds: 30,
  skipBackwardSeconds: 30,
  autoDownload: false,
  autoDownloadCount: 5,
  autoRewindSeconds: 5,
  voiceBoost: false,
};

export const PLAYBACK_SPEEDS = [0.75, 1, 1.25, 1.5, 1.75, 2] as const;
export const SKIP_OPTIONS = [15, 30] as const;
export const AUTO_REWIND_OPTIONS = [0, 5, 10, 15, 20] as const;
