import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import type {
  PlaybackState, OfflineAction, AppSettings, StoredTokens, CachedFileMeta, ListeningDay,
} from '../drive/types';
import { DEFAULT_SETTINGS } from '../drive/types';

interface DrivePodDB extends DBSchema {
  tokens: { key: string; value: StoredTokens };
  playback: { key: string; value: PlaybackState; indexes: { 'by-source': string } };
  offlineQueue: { key: string; value: OfflineAction; indexes: { 'by-created': number } };
  settings: { key: string; value: AppSettings };
  fileCache: { key: string; value: CachedFileMeta; indexes: { 'by-source': string; 'by-cached': number } };
  listeningLog: { key: string; value: ListeningDay };
}

export type DrivePodDatabase = IDBPDatabase<DrivePodDB>;

const DB_NAME = 'drivepod';
const DB_VERSION = 3;

let dbPromise: Promise<DrivePodDatabase> | null = null;

export function getDB(): Promise<DrivePodDatabase> {
  if (!dbPromise) {
    dbPromise = openDB<DrivePodDB>(DB_NAME, DB_VERSION, {
      upgrade(db, oldVersion) {
        if (oldVersion < 1) {
          db.createObjectStore('tokens');
          const playbackStore = db.createObjectStore('playback', { keyPath: 'fileId' });
          playbackStore.createIndex('by-source', 'sourceFolder');
          const queueStore = db.createObjectStore('offlineQueue', { keyPath: 'id' });
          queueStore.createIndex('by-created', 'createdAt');
          db.createObjectStore('settings');
        }
        if (oldVersion < 2 && !db.objectStoreNames.contains('fileCache')) {
          const fileCacheStore = db.createObjectStore('fileCache', { keyPath: 'fileId' });
          fileCacheStore.createIndex('by-source', 'sourceFolder');
          fileCacheStore.createIndex('by-cached', 'cachedAt');
        }
        if (oldVersion < 3 && !db.objectStoreNames.contains('listeningLog')) {
          db.createObjectStore('listeningLog');
        }
      },
      blocked() {
        console.warn('DB upgrade blocked by older tab');
      },
    });
  }
  return dbPromise;
}

// ── Settings ─────────────────────────────────────────────────────────────────

const SETTINGS_KEY = 'main';

// Fusion avec les défauts : un réglage ajouté après la première sauvegarde
// de l'utilisateur prend sa valeur par défaut au lieu d'être undefined.
export async function getSettings(): Promise<AppSettings> {
  const db = await getDB();
  const stored = await db.get('settings', SETTINGS_KEY);
  return { ...DEFAULT_SETTINGS, ...stored };
}

export async function saveSettings(settings: AppSettings): Promise<void> {
  const db = await getDB();
  await db.put('settings', settings, SETTINGS_KEY);
}

// ── Playback ─────────────────────────────────────────────────────────────────

export async function getPlaybackState(fileId: string): Promise<PlaybackState | undefined> {
  const db = await getDB();
  return db.get('playback', fileId);
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
  return db.getAll('playback');
}

// ── Offline queue ────────────────────────────────────────────────────────────

export async function getOfflineQueue(): Promise<OfflineAction[]> {
  const db = await getDB();
  return db.getAllFromIndex('offlineQueue', 'by-created');
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
