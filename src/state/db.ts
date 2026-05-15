import { openDB, type IDBPDatabase } from 'idb';
import type { PlaybackState, OfflineAction, AppSettings } from '../drive/types';
import { DEFAULT_SETTINGS } from '../drive/types';

export interface DBSchema {
  tokens: {
    key: string;
    value: {
      accessToken: string;
      encryptedRefreshToken: string | null;
      expiresAt: number;
    };
  };
  playback: {
    key: string;
    value: PlaybackState;
    indexes: { 'by-source': string };
  };
  offlineQueue: {
    key: string;
    value: OfflineAction;
    indexes: { 'by-created': number };
  };
  settings: {
    key: string;
    value: AppSettings | string | number | boolean;
  };
  fileCache: {
    key: string;
    value: {
      fileId: string;
      name: string;
      sourceFolder: string;
      sourceFolderId: string;
      size: number;
      cachedAt: number;
    };
    indexes: { 'by-source': string; 'by-cached': number };
  };
}

let dbPromise: Promise<IDBPDatabase> | null = null;

export function getDB(): Promise<IDBPDatabase> {
  if (!dbPromise) {
    dbPromise = openDB('drivepod', 3, {
      upgrade(db, oldVersion) {
        if (oldVersion < 1) {
          db.createObjectStore('tokens');

          const playbackStore = db.createObjectStore('playback', { keyPath: 'fileId' });
          playbackStore.createIndex('by-source', 'sourceFolder');

          const queueStore = db.createObjectStore('offlineQueue', { keyPath: 'id' });
          queueStore.createIndex('by-created', 'createdAt');

          db.createObjectStore('settings');
        }
        if (oldVersion < 2) {
          if (!db.objectStoreNames.contains('fileCache')) {
            const fileCacheStore = db.createObjectStore('fileCache', { keyPath: 'fileId' });
            fileCacheStore.createIndex('by-source', 'sourceFolder');
            fileCacheStore.createIndex('by-cached', 'cachedAt');
          }
        }
        if (oldVersion < 3) {
          if (!db.objectStoreNames.contains('listeningLog')) {
            db.createObjectStore('listeningLog');
          }
        }
      },
      blocked() {
        console.warn('DB upgrade blocked by older tab');
      },
    });
  }
  return dbPromise;
}

export async function getSettings(): Promise<AppSettings> {
  const db = await getDB();
  const stored = await db.get('settings', 'main') as AppSettings | undefined;
  return stored ?? DEFAULT_SETTINGS;
}

export async function saveSettings(settings: AppSettings): Promise<void> {
  const db = await getDB();
  await db.put('settings', settings, 'main');
}

export async function getPlaybackState(fileId: string): Promise<PlaybackState | undefined> {
  const db = await getDB();
  return db.get('playback', fileId) as Promise<PlaybackState | undefined>;
}

export async function savePlaybackState(state: PlaybackState): Promise<void> {
  const db = await getDB();
  await db.put('playback', state);
}

export async function deletePlaybackState(fileId: string): Promise<void> {
  const db = await getDB();
  await db.delete('playback', fileId);
}

export async function getAllPlaybackStates(): Promise<PlaybackState[]> {
  const db = await getDB();
  return db.getAll('playback') as Promise<PlaybackState[]>;
}

export async function getOfflineQueue(): Promise<OfflineAction[]> {
  const db = await getDB();
  return db.getAllFromIndex('offlineQueue', 'by-created') as Promise<OfflineAction[]>;
}

export async function enqueueOfflineAction(action: OfflineAction): Promise<void> {
  const db = await getDB();
  await db.put('offlineQueue', action);
}

export async function dequeueOfflineAction(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('offlineQueue', id);
}

export async function getOfflineQueueCount(): Promise<number> {
  const db = await getDB();
  return db.count('offlineQueue');
}
