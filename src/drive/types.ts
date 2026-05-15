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

export interface TokenSet {
  accessToken: string;
  refreshToken: string;
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

export interface DriveStateFile {
  version: number;
  files: Record<string, PlaybackState>;
  lastUpdated: number;
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
}

export interface AppSettings {
  defaultSpeed: number;
  skipForwardSeconds: number;
  skipBackwardSeconds: number;
  autoDownload: boolean;
  autoDownloadCount: number;
  autoRewindSeconds: number;
}

export const DEFAULT_SETTINGS: AppSettings = {
  defaultSpeed: 1,
  skipForwardSeconds: 30,
  skipBackwardSeconds: 30,
  autoDownload: false,
  autoDownloadCount: 5,
  autoRewindSeconds: 5,
};
