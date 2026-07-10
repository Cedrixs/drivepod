import { getAccessToken, invalidateAccessToken } from '../auth/auth';
import { getDB } from '../state/db';
import { normalizeFolderName } from '../state/archiveRules';
import type { DriveFile, DriveFolder } from './types';

const BASE = 'https://www.googleapis.com/drive/v3';
const UPLOAD_BASE = 'https://www.googleapis.com/upload/drive/v3';

interface RequestOptions {
  method?: string;
  body?: BodyInit;
  headers?: Record<string, string>;
  retries?: number;
}

function backoffDelay(attempt: number): Promise<void> {
  const ms = Math.min(1000 * Math.pow(2, attempt) + Math.random() * 500, 30_000);
  return new Promise((r) => setTimeout(r, ms));
}

async function driveRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, headers = {}, retries = 4 } = options;
  let authRetried = false;

  for (let attempt = 0; attempt <= retries; attempt++) {
    // Token relu à chaque tentative : un backoff long peut dépasser son expiration
    const token = await getAccessToken();

    let resp: Response;
    try {
      resp = await fetch(`${BASE}${path}`, {
        method,
        headers: { Authorization: `Bearer ${token}`, ...headers },
        body,
      });
    } catch (err) {
      // Coupure réseau (tunnel, métro) : retry avec backoff plutôt qu'échec sec
      if (attempt < retries) {
        await backoffDelay(attempt);
        continue;
      }
      throw err instanceof Error ? err : new Error(String(err));
    }

    if (resp.ok) return resp.json() as Promise<T>;

    if (resp.status === 401 && !authRetried) {
      authRetried = true;
      await invalidateAccessToken();
      continue;
    }

    if (resp.status === 429 || resp.status >= 500) {
      if (attempt < retries) {
        await backoffDelay(attempt);
        continue;
      }
    }

    if (resp.status === 404) throw Object.assign(new Error('NOT_FOUND'), { status: 404 });
    if (resp.status === 401) throw Object.assign(new Error('UNAUTHORIZED'), { status: 401 });

    const text = await resp.text().catch(() => '');
    throw new Error(`Drive API ${resp.status}: ${text}`);
  }

  throw new Error('Max retries exceeded');
}

async function uploadRequest(
  url: string,
  init: { method: string; headers?: Record<string, string>; body?: BodyInit },
  retries = 3,
): Promise<Response> {
  let authRetried = false;

  for (let attempt = 0; attempt <= retries; attempt++) {
    const token = await getAccessToken();

    let resp: Response;
    try {
      resp = await fetch(url, {
        ...init,
        headers: { Authorization: `Bearer ${token}`, ...init.headers },
      });
    } catch (err) {
      if (attempt < retries) {
        await backoffDelay(attempt);
        continue;
      }
      throw err instanceof Error ? err : new Error(String(err));
    }

    if (resp.ok) return resp;

    if (resp.status === 401 && !authRetried) {
      authRetried = true;
      await invalidateAccessToken();
      continue;
    }

    if ((resp.status === 429 || resp.status >= 500) && attempt < retries) {
      await backoffDelay(attempt);
      continue;
    }

    throw new Error(`Upload failed: ${resp.status}`);
  }

  throw new Error('Max retries exceeded');
}

interface FileListResponse {
  files: DriveFile[];
  nextPageToken?: string;
}

export async function listChildren(
  folderId: string,
  mimeType?: string,
): Promise<DriveFile[]> {
  const results: DriveFile[] = [];
  let pageToken: string | undefined;

  do {
    const q = mimeType
      ? `'${folderId}' in parents and mimeType='${mimeType}' and trashed=false`
      : `'${folderId}' in parents and trashed=false`;

    const params = new URLSearchParams({
      q,
      fields: 'nextPageToken,files(id,name,mimeType,parents,createdTime,modifiedTime,size)',
      orderBy: 'createdTime asc',
      pageSize: '1000',
    });
    if (pageToken) params.set('pageToken', pageToken);

    const resp = await driveRequest<FileListResponse>(`/files?${params.toString()}`);
    results.push(...(resp.files ?? []));
    pageToken = resp.nextPageToken;
  } while (pageToken);

  return results;
}

export async function listSubfolders(folderId: string): Promise<DriveFolder[]> {
  const files = await listChildren(folderId, 'application/vnd.google-apps.folder');
  return files.map((f) => ({ id: f.id, name: f.name, parents: f.parents }));
}

// Cherche un dossier sans le créer (pour les dossiers gérés par le pipeline,
// comme PDF/Textes IA, qu'on ne veut pas créer par accident depuis l'app)
export async function findFolder(name: string, parentId: string): Promise<string | null> {
  const q = `name='${name}' and '${parentId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`;
  const params = new URLSearchParams({ q, fields: 'files(id)', pageSize: '1' });
  const data = await driveRequest<{ files: { id: string }[] }>(`/files?${params.toString()}`);
  return data.files[0]?.id ?? null;
}

export async function findOrCreateFolder(name: string, parentId: string): Promise<string> {
  const q = `name='${name}' and '${parentId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`;
  const params = new URLSearchParams({ q, fields: 'files(id)', pageSize: '1' });

  const data = await driveRequest<{ files: { id: string }[] }>(`/files?${params.toString()}`);
  if (data.files.length > 0) return data.files[0].id;

  const created = await driveRequest<{ id: string }>('/files', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name,
      mimeType: 'application/vnd.google-apps.folder',
      parents: [parentId],
    }),
  });
  return created.id;
}

export async function moveFile(fileId: string, fromParentId: string, toParentId: string): Promise<void> {
  const params = new URLSearchParams({
    addParents: toParentId,
    removeParents: fromParentId,
    fields: 'id,parents',
  });

  try {
    await driveRequest(`/files/${fileId}?${params.toString()}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
  } catch (err) {
    // Déjà déplacé depuis un autre appareil : succès
    if ((err as { status?: number }).status === 404) return;
    throw err;
  }
}

export function getStreamUrl(fileId: string): Promise<string> {
  // Requests to /drivepod/stream/:id are intercepted by the service worker,
  // which injects the Authorization header before forwarding to Drive API.
  return Promise.resolve(`/drivepod/stream/${fileId}`);
}

export async function getAuthenticatedStreamHeaders(): Promise<Record<string, string>> {
  const token = await getAccessToken();
  return { Authorization: `Bearer ${token}` };
}

export interface CachedFileMeta {
  fileId: string;
  name: string;
  sourceFolder: string;
  sourceFolderId: string;
  size: number;
  cachedAt: number;
  createdTime?: string;
}

export async function downloadFileToCache(
  fileId: string,
  fileName: string,
  meta?: { sourceFolder?: string; sourceFolderId?: string; createdTime?: string },
): Promise<void> {
  const resp = await uploadRequest(`${BASE}/files/${fileId}?alt=media`, { method: 'GET' });
  const blob = await resp.blob();

  const cache = await caches.open('drivepod-audio');
  const cacheUrl = `offline-audio://${fileId}/${encodeURIComponent(fileName)}`;
  const cachedAt = Date.now();
  await cache.put(cacheUrl, new Response(blob, {
    headers: { 'Content-Type': 'audio/mpeg', 'X-File-Id': fileId, 'X-Cached-At': String(cachedAt) },
  }));

  // Métadonnées en IndexedDB : permettent de lister les fichiers téléchargés
  // quand l'app démarre hors-ligne (Drive injoignable)
  try {
    const db = await getDB();
    await db.put('fileCache', {
      fileId,
      name: fileName,
      sourceFolder: meta?.sourceFolder ?? '',
      sourceFolderId: meta?.sourceFolderId ?? '',
      size: blob.size,
      cachedAt,
      createdTime: meta?.createdTime ?? '',
    } satisfies CachedFileMeta);
  } catch { /* non-critical */ }
}

export async function getCachedAudioUrl(fileId: string, fileName: string): Promise<string | null> {
  const cache = await caches.open('drivepod-audio');
  const cacheUrl = `offline-audio://${fileId}/${encodeURIComponent(fileName)}`;
  const cached = await cache.match(cacheUrl);
  if (!cached) return null;
  const blob = await cached.blob();
  return URL.createObjectURL(blob);
}

export async function removeCachedAudio(fileId: string, fileName: string): Promise<void> {
  const cache = await caches.open('drivepod-audio');
  const cacheUrl = `offline-audio://${fileId}/${encodeURIComponent(fileName)}`;
  await cache.delete(cacheUrl);
  try {
    const db = await getDB();
    await db.delete('fileCache', fileId);
  } catch { /* non-critical */ }
}

// Fichiers téléchargés connus localement — utilisable sans réseau.
// Complète avec les entrées du Cache API antérieures au suivi des métadonnées.
export async function listCachedFilesMeta(): Promise<CachedFileMeta[]> {
  const metas = new Map<string, CachedFileMeta>();

  try {
    const db = await getDB();
    const rows = await db.getAll('fileCache') as CachedFileMeta[];
    for (const row of rows) metas.set(row.fileId, row);
  } catch { /* ignore */ }

  try {
    const cache = await caches.open('drivepod-audio');
    const keys = await cache.keys();
    for (const key of keys) {
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

export async function isFileCached(fileId: string, fileName: string): Promise<boolean> {
  const cache = await caches.open('drivepod-audio');
  const cacheUrl = `offline-audio://${fileId}/${encodeURIComponent(fileName)}`;
  const cached = await cache.match(cacheUrl);
  return !!cached;
}

// ── Synthèses hebdo (PDF/Textes IA) ──────────────────────────────────────────

let textesIaFolderId: string | null = null;

// Les synthèses écrites vivent dans PDF/Textes IA (déposées par la routine
// Cowork, jamais supprimées par le pipeline) — pas dans Audio/.
export async function listSynthesisFiles(): Promise<DriveFile[]> {
  if (!textesIaFolderId) {
    const root = await driveRequest<{ id: string }>('/files/root?fields=id');
    const pdfId = await findFolder('PDF', root.id);
    if (!pdfId) return [];
    const iaId = await findFolder('Textes IA', pdfId);
    if (!iaId) return [];
    textesIaFolderId = iaId;
  }

  const q = `'${textesIaFolderId}' in parents and trashed=false and name contains 'Synth'`;
  const params = new URLSearchParams({
    q,
    fields: 'files(id,name,mimeType,parents,createdTime,modifiedTime,size)',
    orderBy: 'createdTime desc',
    pageSize: '100',
  });
  const resp = await driveRequest<FileListResponse>(`/files?${params.toString()}`);
  return (resp.files ?? []).filter(
    (f) => normalizeFolderName(f.name).startsWith('synth') && f.name.toLowerCase().endsWith('.md'),
  );
}

export async function fetchFileText(fileId: string): Promise<string | null> {
  try {
    const resp = await uploadRequest(`${BASE}/files/${fileId}?alt=media`, { method: 'GET' });
    return await resp.text();
  } catch {
    return null;
  }
}

// ── Markdown summary ─────────────────────────────────────────────────────────

const markdownCache = new Map<string, string | null>();

export function extractSummary(markdown: string, maxSentences = 4): string {
  const text = markdown
    .replace(/#{1,6}\s+[^\n]*/g, '')
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/\*(.+?)\*/g, '$1')
    .replace(/\[(.+?)\]\(.+?\)/g, '$1')
    .replace(/`(.+?)`/g, '$1')
    .replace(/^[-*+]\s+/gm, '')
    .replace(/^\d+\.\s+/gm, '')
    .replace(/\n+/g, ' ')
    .trim();
  const sentences = text.split(/(?<=[.!?])\s+/).filter((s) => s.trim().length > 10);
  return sentences.slice(0, maxSentences).join(' ').trim();
}

export async function fetchMarkdownContent(parentFolderId: string, mp3FileName: string): Promise<string | null> {
  const mdName = mp3FileName.replace(/\.mp3$/i, '.md');
  const cacheKey = `${parentFolderId}/${mdName}`;
  if (markdownCache.has(cacheKey)) return markdownCache.get(cacheKey) ?? null;

  const token = await getAccessToken();
  const q = `name='${mdName}' and '${parentFolderId}' in parents and trashed=false`;
  const params = new URLSearchParams({ q, fields: 'files(id)', pageSize: '1' });

  const listResp = await fetch(`${BASE}/files?${params.toString()}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!listResp.ok) { markdownCache.set(cacheKey, null); return null; }

  const listData = await listResp.json() as { files: { id: string }[] };
  if (!listData.files.length) { markdownCache.set(cacheKey, null); return null; }

  const contentResp = await fetch(`${BASE}/files/${listData.files[0].id}?alt=media`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!contentResp.ok) { markdownCache.set(cacheKey, null); return null; }

  const text = await contentResp.text();
  markdownCache.set(cacheKey, text);
  return text;
}

// ── Captures (notes) ──────────────────────────────────────────────────────────

export interface CapturedPassage {
  id: string;
  fileId: string;
  fileName: string;
  sourceFolder: string;
  audioPosition: number;
  audioDuration: number;
  capturedAt: number;
  passage: string;
}

export interface NotesFileContent {
  version: number;
  captures: CapturedPassage[];
  lastUpdated: number;
}

const NOTES_FILE_NAME = '_drivepod_notes.json';

export function extractPassage(markdown: string, position: number, duration: number): string {
  const text = markdown
    .replace(/#{1,6}\s+[^\n]*/g, '')
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/\*(.+?)\*/g, '$1')
    .replace(/\[(.+?)\]\(.+?\)/g, '$1')
    .replace(/`(.+?)`/g, '$1')
    .replace(/^[-*+]\s+/gm, '')
    .replace(/^\d+\.\s+/gm, '')
    .replace(/\n+/g, ' ')
    .trim();
  const words = text.split(/\s+/).filter((w) => w.length > 0);
  if (!words.length) return '';
  const ratio = duration > 0 ? Math.min(1, position / duration) : 0;
  const center = Math.floor(ratio * words.length);
  const window = 50;
  return words.slice(Math.max(0, center - window), Math.min(words.length, center + window)).join(' ');
}

export async function readNotesFile(audioFolderId: string): Promise<NotesFileContent | null> {
  const token = await getAccessToken();
  const q = `name='${NOTES_FILE_NAME}' and '${audioFolderId}' in parents and trashed=false`;
  const params = new URLSearchParams({ q, fields: 'files(id)', pageSize: '1' });
  const listResp = await fetch(`${BASE}/files?${params.toString()}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!listResp.ok) return null;
  const listData = await listResp.json() as { files: { id: string }[] };
  if (!listData.files.length) return null;
  const contentResp = await fetch(`${BASE}/files/${listData.files[0].id}?alt=media`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!contentResp.ok) return null;
  try { return await contentResp.json() as NotesFileContent; } catch { return null; }
}

async function writeNotesFile(audioFolderId: string, content: NotesFileContent): Promise<void> {
  await upsertJsonFile(NOTES_FILE_NAME, audioFolderId, JSON.stringify(content));
}

// PATCH si le fichier existe, POST multipart sinon. Un échec de PATCH remonte
// en erreur au lieu de retomber sur un POST qui créerait un doublon.
async function upsertJsonFile(fileName: string, parentFolderId: string, json: string): Promise<void> {
  const q = `name='${fileName}' and '${parentFolderId}' in parents and trashed=false`;
  const params = new URLSearchParams({ q, fields: 'files(id)', pageSize: '1' });
  const listData = await driveRequest<{ files: { id: string }[] }>(`/files?${params.toString()}`);

  const blob = new Blob([json], { type: 'application/json' });

  if (listData.files.length > 0) {
    await uploadRequest(`${UPLOAD_BASE}/files/${listData.files[0].id}?uploadType=media`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: blob,
    });
    return;
  }

  const meta = JSON.stringify({ name: fileName, parents: [parentFolderId] });
  const form = new FormData();
  form.append('metadata', new Blob([meta], { type: 'application/json' }));
  form.append('file', blob);
  await uploadRequest(`${UPLOAD_BASE}/files?uploadType=multipart`, {
    method: 'POST',
    body: form,
  });
}

export async function appendCapture(audioFolderId: string, capture: CapturedPassage): Promise<void> {
  const existing = await readNotesFile(audioFolderId);
  const content: NotesFileContent = existing ?? { version: 1, captures: [], lastUpdated: 0 };
  content.captures.push(capture);
  content.lastUpdated = Date.now();
  await writeNotesFile(audioFolderId, content);
}

export interface StateFileContent {
  version: number;
  files: Record<string, {
    position: number;
    duration: number;
    lastUpdated: number;
    sourceFolder: string;
    fileName: string;
  }>;
  lastUpdated: number;
}

const STATE_FILE_NAME = '_drivepod_state.json';

export async function readDriveStateFile(audioFolderId: string): Promise<StateFileContent | null> {
  const token = await getAccessToken();
  const q = `name='${STATE_FILE_NAME}' and '${audioFolderId}' in parents and trashed=false`;
  const params = new URLSearchParams({ q, fields: 'files(id)', pageSize: '1' });

  const listResp = await fetch(`${BASE}/files?${params.toString()}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!listResp.ok) return null;
  const listData = await listResp.json() as { files: { id: string }[] };
  if (!listData.files.length) return null;

  const fileId = listData.files[0].id;
  const contentResp = await fetch(`${BASE}/files/${fileId}?alt=media`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!contentResp.ok) return null;

  try {
    return await contentResp.json() as StateFileContent;
  } catch {
    return null;
  }
}

export async function writeDriveStateFile(
  audioFolderId: string,
  content: StateFileContent,
): Promise<void> {
  await upsertJsonFile(STATE_FILE_NAME, audioFolderId, JSON.stringify(content));
}
