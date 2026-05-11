import {
  enqueueOfflineAction,
  dequeueOfflineAction,
  getOfflineQueue,
  getOfflineQueueCount,
} from '../state/db';
import { findOrCreateFolder, moveFile } from '../drive/api';
import { removeFromStateAndSync } from '../state/driveState';
import type { OfflineAction } from '../drive/types';

export async function queueArchive(action: Omit<OfflineAction, 'id' | 'createdAt'>): Promise<void> {
  const fullAction: OfflineAction = {
    ...action,
    id: crypto.randomUUID(),
    createdAt: Date.now(),
  };
  await enqueueOfflineAction(fullAction);
}

export async function getPendingQueueCount(): Promise<number> {
  return getOfflineQueueCount();
}

export async function flushOfflineQueue(
  onProgress?: (done: number, total: number) => void,
): Promise<void> {
  const queue = await getOfflineQueue();
  const total = queue.length;

  for (let i = 0; i < queue.length; i++) {
    const action = queue[i];
    try {
      await executeAction(action);
      await dequeueOfflineAction(action.id);
      onProgress?.(i + 1, total);
    } catch (err) {
      console.warn(`Failed to execute queued action ${action.id}`, err);
    }
  }
}

async function executeAction(action: OfflineAction): Promise<void> {
  if (action.type === 'archive') {
    const now = new Date();
    const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const archiveFolderId = await findOrCreateFolder('Archive', action.audioFolderId);
    const monthFolderId = await findOrCreateFolder(monthKey, archiveFolderId);
    const sourceFolderId = await findOrCreateFolder(action.sourceFolder, monthFolderId);
    await moveFile(action.fileId, action.sourceFolderId, sourceFolderId);
    await removeFromStateAndSync(action.fileId);
  }
}

export { getOfflineQueue };
