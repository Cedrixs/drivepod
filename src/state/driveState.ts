import { readDriveStateFile, writeDriveStateFile, type StateFileContent } from '../drive/api';
import {
  getAllPlaybackStates,
  savePlaybackState,
  getPlaybackState,
  deletePlaybackState,
} from './db';
import type { PlaybackState } from '../drive/types';

let writeDebounceTimer: ReturnType<typeof setTimeout> | null = null;
let audioFolderIdCache: string | null = null;

export function setAudioFolderId(id: string): void {
  audioFolderIdCache = id;
}

export async function initStateSync(audioFolderId: string): Promise<void> {
  audioFolderIdCache = audioFolderId;
  try {
    const remoteState = await readDriveStateFile(audioFolderId);
    if (!remoteState) return;

    const localStates = await getAllPlaybackStates();
    const localMap = new Map(localStates.map((s) => [s.fileId, s]));

    for (const [fileId, remote] of Object.entries(remoteState.files)) {
      const local = localMap.get(fileId);
      if (!local || remote.lastUpdated > local.lastUpdated) {
        await savePlaybackState({
          fileId,
          position: remote.position,
          duration: remote.duration,
          lastUpdated: remote.lastUpdated,
          sourceFolder: remote.sourceFolder,
          fileName: remote.fileName,
        });
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
  writeDebounceTimer = setTimeout(() => {
    void flushStateToDrive();
  }, 30_000);
}

export async function flushStateToDrive(): Promise<void> {
  if (!audioFolderIdCache) return;
  if (writeDebounceTimer) {
    clearTimeout(writeDebounceTimer);
    writeDebounceTimer = null;
  }

  try {
    const localStates = await getAllPlaybackStates();
    const filesMap: StateFileContent['files'] = {};
    for (const s of localStates) {
      filesMap[s.fileId] = {
        position: s.position,
        duration: s.duration,
        lastUpdated: s.lastUpdated,
        sourceFolder: s.sourceFolder,
        fileName: s.fileName,
      };
    }
    await writeDriveStateFile(audioFolderIdCache, {
      version: 1,
      files: filesMap,
      lastUpdated: Date.now(),
    });
  } catch (err) {
    console.warn('Remote state flush failed', err);
  }
}

export async function removeFromStateAndSync(fileId: string): Promise<void> {
  await deletePlaybackState(fileId);
  scheduleRemoteWrite();
}

export async function getLocalPlaybackState(fileId: string): Promise<PlaybackState | undefined> {
  return getPlaybackState(fileId);
}
