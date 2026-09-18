import { downloadFileResponse } from '../drive/api';
import { getDB } from '../state/db';
import type { CachedFileMeta, DriveFile } from '../drive/types';

const AUDIO_CACHE = 'drivepod-audio';

function cacheKey(fileId: string, fileName: string): string {
  return `offline-audio://${fileId}/${encodeURIComponent(fileName)}`;
}

interface DownloadMeta {
  sourceFolder?: string;
  sourceFolderId?: string;
  createdTime?: string;
}

export async function downloadFileToCache(fileId: string, fileName: string, meta: DownloadMeta = {}): Promise<void> {
  const resp = await downloadFileResponse(fileId);
  const blob = await resp.blob();
  const cachedAt = Date.now();

  const cache = await caches.open(AUDIO_CACHE);
  await cache.put(cacheKey(fileId, fileName), new Response(blob, {
    headers: {
      'Content-Type': 'audio/mpeg',
      'X-File-Id': fileId,
      'X-Cached-At': String(cachedAt),
      'X-File-Size': String(blob.size),
    },
  }));

  // Métadonnées en IndexedDB : permettent de lister les fichiers téléchargés
  // quand l'app démarre hors-ligne (Drive injoignable)
  try {
    const db = await getDB();
    await db.put('fileCache', {
      fileId,
      name: fileName,
      sourceFolder: meta.sourceFolder ?? '',
      sourceFolderId: meta.sourceFolderId ?? '',
      size: blob.size,
      cachedAt,
      createdTime: meta.createdTime ?? '',
    });
  } catch { /* non-critical */ }
}

export function downloadForOffline(file: DriveFile, sourceFolder = '', sourceFolderId = ''): Promise<void> {
  return downloadFileToCache(file.id, file.name, { sourceFolder, sourceFolderId, createdTime: file.createdTime });
}

// URL blob: à révoquer par l'appelant quand il n'en a plus besoin
export async function getOfflineAudioUrl(fileId: string, fileName: string): Promise<string | null> {
  const cache = await caches.open(AUDIO_CACHE);
  const cached = await cache.match(cacheKey(fileId, fileName));
  if (!cached) return null;
  const blob = await cached.blob();
  return URL.createObjectURL(blob);
}

export async function isFileCached(fileId: string, fileName: string): Promise<boolean> {
  const cache = await caches.open(AUDIO_CACHE);
  return !!(await cache.match(cacheKey(fileId, fileName)));
}

export async function removeCachedAudio(fileId: string, fileName: string): Promise<void> {
  const cache = await caches.open(AUDIO_CACHE);
  await cache.delete(cacheKey(fileId, fileName));
  try {
    const db = await getDB();
    await db.delete('fileCache', fileId);
  } catch { /* non-critical */ }
}

// Fichiers téléchargés connus localement, utilisable sans réseau.
// Complète avec les entrées du Cache API antérieures au suivi des métadonnées.
export async function listCachedFilesMeta(): Promise<CachedFileMeta[]> {
  const metas = new Map<string, CachedFileMeta>();

  try {
    const db = await getDB();
    for (const row of await db.getAll('fileCache')) metas.set(row.fileId, row);
  } catch { /* ignore */ }

  try {
    const cache = await caches.open(AUDIO_CACHE);
    for (const key of await cache.keys()) {
      const match = key.url.match(/^offline-audio:\/\/([^/]+)\/(.+)$/);
      if (!match || metas.has(match[1])) continue;
      metas.set(match[1], {
        fileId: match[1],
        name: decodeURIComponent(match[2]),
        sourceFolder: '',
        sourceFolderId: '',
        size: 0,
        cachedAt: 0,
      });
    }
  } catch { /* ignore */ }

  return [...metas.values()];
}

// Taille lue depuis les headers (pas de rechargement des blobs en mémoire) ;
// les entrées antérieures au header X-File-Size retombent sur le blob.
export async function getCacheStats(): Promise<{ count: number; totalSize: number }> {
  const cache = await caches.open(AUDIO_CACHE);
  const keys = await cache.keys();
  let totalSize = 0;
  for (const key of keys) {
    const resp = await cache.match(key);
    if (!resp) continue;
    const header = parseInt(resp.headers.get('X-File-Size') ?? '', 10);
    totalSize += isFinite(header) ? header : (await resp.blob()).size;
  }
  return { count: keys.length, totalSize };
}

export async function clearAudioCache(): Promise<void> {
  await caches.delete(AUDIO_CACHE);
  try {
    const db = await getDB();
    await db.clear('fileCache');
  } catch { /* non-critical */ }
}

export async function autoDownloadOldest(
  files: DriveFile[],
  sourceFolder: string,
  count = 5,
  sourceFolderId = '',
): Promise<void> {
  let downloaded = 0;
  for (const file of files) {
    if (downloaded >= count) break;
    if (await isFileCached(file.id, file.name)) continue;
    try {
      await downloadForOffline(file, sourceFolder, sourceFolderId);
      downloaded++;
    } catch {
      // on passe au suivant
    }
  }
}
