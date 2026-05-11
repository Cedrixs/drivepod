import { downloadFileToCache, getCachedAudioUrl as _getCachedAudioUrl, isFileCached, removeCachedAudio } from '../drive/api';
import type { DriveFile } from '../drive/types';

export async function downloadForOffline(file: DriveFile): Promise<void> {
  await downloadFileToCache(file.id, file.name);
}

export async function getOfflineAudioUrl(fileId: string, fileName: string): Promise<string | null> {
  return _getCachedAudioUrl(fileId, fileName);
}

export async function checkCached(fileId: string, fileName: string): Promise<boolean> {
  return isFileCached(fileId, fileName);
}

export async function evictLRU(audioFolderId: string, maxBytes = 500 * 1024 * 1024): Promise<void> {
  const cache = await caches.open('drivepod-audio');
  const keys = await cache.keys();

  let totalSize = 0;
  const entries: { key: Request; size: number; cachedAt: number }[] = [];

  for (const key of keys) {
    const resp = await cache.match(key);
    if (!resp) continue;
    const blob = await resp.blob();
    const cachedAt = parseInt(resp.headers.get('X-Cached-At') ?? '0', 10);
    entries.push({ key, size: blob.size, cachedAt });
    totalSize += blob.size;
  }

  if (totalSize <= maxBytes) return;

  entries.sort((a, b) => a.cachedAt - b.cachedAt);

  for (const entry of entries) {
    if (totalSize <= maxBytes) break;
    await cache.delete(entry.key);
    totalSize -= entry.size;
  }

  void audioFolderId;
}

export async function getCacheStats(): Promise<{ count: number; totalSize: number }> {
  const cache = await caches.open('drivepod-audio');
  const keys = await cache.keys();
  let totalSize = 0;
  for (const key of keys) {
    const resp = await cache.match(key);
    if (resp) {
      const blob = await resp.blob();
      totalSize += blob.size;
    }
  }
  return { count: keys.length, totalSize };
}

export async function clearAudioCache(): Promise<void> {
  await caches.delete('drivepod-audio');
}

export async function autoDownloadOldest(
  files: DriveFile[],
  sourceFolder: string,
  count = 5,
): Promise<void> {
  let downloaded = 0;
  for (const file of files) {
    if (downloaded >= count) break;
    const cached = await isFileCached(file.id, file.name);
    if (!cached) {
      try {
        await downloadFileToCache(file.id, file.name);
        downloaded++;
      } catch {
        // continue
      }
    }
  }
  void sourceFolder;
}

export { removeCachedAudio };
