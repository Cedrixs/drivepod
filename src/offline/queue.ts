import {
  enqueueOfflineAction,
  dequeueOfflineAction,
  getOfflineQueue,
  getOfflineQueueCount,
} from '../state/db';
import { createArchiveResolver, archiveOne } from '../drive/archive';
import { isoWeekKey } from '../state/archiveRules';
import type { OfflineAction } from '../drive/types';

export async function queueArchive(action: Omit<OfflineAction, 'id' | 'createdAt'>): Promise<void> {
  await enqueueOfflineAction({
    ...action,
    id: crypto.randomUUID(),
    createdAt: Date.now(),
  });
}

export function getPendingQueueCount(): Promise<number> {
  return getOfflineQueueCount();
}

// Rejoue les actions enregistrées hors-ligne, dans l'ordre. Une action qui
// échoue reste en file pour la prochaine tentative.
export async function flushOfflineQueue(
  onProgress?: (done: number, total: number) => void,
): Promise<void> {
  const queue = await getOfflineQueue();
  const resolvers = new Map<string, ReturnType<typeof createArchiveResolver>>();

  for (let i = 0; i < queue.length; i++) {
    const action = queue[i];
    try {
      let resolver = resolvers.get(action.audioFolderId);
      if (!resolver) {
        resolver = createArchiveResolver(action.audioFolderId);
        resolvers.set(action.audioFolderId, resolver);
      }
      await archiveOne(resolver, {
        fileId: action.fileId,
        sourceFolder: action.sourceFolder,
        sourceFolderId: action.sourceFolderId,
        weekKey: action.destWeekKey ?? isoWeekKey(new Date()),
      });
      await dequeueOfflineAction(action.id);
      onProgress?.(i + 1, queue.length);
    } catch (err) {
      console.warn(`Failed to execute queued action ${action.id}`, err);
    }
  }
}

export { getOfflineQueue };
