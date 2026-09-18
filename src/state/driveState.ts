import { readJsonFileByName, upsertJsonFile } from '../drive/api';
import {
  getAllPlaybackStates,
  savePlaybackState,
  getPlaybackState,
  deletePlaybackState,
} from './db';
import type { PlaybackState } from '../drive/types';

// Fichier de synchronisation multi-device, à la racine de Audio/
const STATE_FILE_NAME = '_drivepod_state.json';
const REMOTE_WRITE_DEBOUNCE_MS = 30_000;

export interface StateFileContent {
  version: number;
  files: Record<string, Omit<PlaybackState, 'fileId'>>;
  lastUpdated: number;
}

let writeDebounceTimer: ReturnType<typeof setTimeout> | null = null;
let audioFolderIdCache: string | null = null;

export function setAudioFolderId(id: string): void {
  audioFolderIdCache = id;
}

export function readDriveStateFile(audioFolderId: string): Promise<StateFileContent | null> {
  return readJsonFileByName<StateFileContent>(audioFolderId, STATE_FILE_NAME);
}

export function writeDriveStateFile(audioFolderId: string, content: StateFileContent): Promise<void> {
  return upsertJsonFile(STATE_FILE_NAME, audioFolderId, JSON.stringify(content));
}

// Merge au démarrage : pour chaque fichier, la position la plus récente
// (timestamp) entre le local et Drive l'emporte.
export async function initStateSync(audioFolderId: string): Promise<void> {
  audioFolderIdCache = audioFolderId;
  try {
    const remoteState = await readDriveStateFile(audioFolderId);
    if (!remoteState?.files) return;

    const localStates = await getAllPlaybackStates();
    const localMap = new Map(localStates.map((s) => [s.fileId, s]));

    for (const [fileId, remote] of Object.entries(remoteState.files)) {
      const local = localMap.get(fileId);
      if (!local || remote.lastUpdated > local.lastUpdated) {
        await savePlaybackState({ fileId, ...remote });
      }
    }
  } catch (err) {
    console.warn('State sync init failed, using local state', err);
  }
}

export async function saveStateWithSync(state: PlaybackState): Promise<void> {
  await savePlaybackState(state);
  scheduleRemoteWrite();
}

function scheduleRemoteWrite(): void {
  if (writeDebounceTimer) clearTimeout(writeDebounceTimer);
  writeDebounceTimer = setTimeout(() => { void flushStateToDrive(); }, REMOTE_WRITE_DEBOUNCE_MS);
}

export async function flushStateToDrive(): Promise<void> {
  if (!audioFolderIdCache) return;
  if (writeDebounceTimer) {
    clearTimeout(writeDebounceTimer);
    writeDebounceTimer = null;
  }

  try {
    const localStates = await getAllPlaybackStates();
    const files: StateFileContent['files'] = {};
    for (const { fileId, ...rest } of localStates) files[fileId] = rest;
    await writeDriveStateFile(audioFolderIdCache, { version: 1, files, lastUpdated: Date.now() });
  } catch (err) {
    console.warn('Remote state flush failed', err);
  }
}

export async function removeFromStateAndSync(fileId: string): Promise<void> {
  await deletePlaybackState(fileId);
  scheduleRemoteWrite();
}

export function getLocalPlaybackState(fileId: string): Promise<PlaybackState | undefined> {
  return getPlaybackState(fileId);
}
