import { getAccessToken } from '../auth/auth';
import type { DriveFile, DriveFolder } from './types';

const BASE = 'https://www.googleapis.com/drive/v3';
const UPLOAD_BASE = 'https://www.googleapis.com/upload/drive/v3';

interface RequestOptions {
  method?: string;
  body?: BodyInit;
  headers?: Record<string, string>;
  retries?: number;
}

async function driveRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, headers = {}, retries = 4 } = options;
  const token = await getAccessToken();

  for (let attempt = 0; attempt <= retries; attempt++) {
    const resp = await fetch(`${BASE}${path}`, {
      method,
      headers: { Authorization: `Bearer ${token}`, ...headers },
      body,
    });

    if (resp.ok) return resp.json() as Promise<T>;

    if (resp.status === 429 || resp.status >= 500) {
      if (attempt < retries) {
        const backoff = Math.min(1000 * Math.pow(2, attempt) + Math.random() * 500, 30_000);
        await new Promise((r) => setTimeout(r, backoff));
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

export async function findOrCreateFolder(name: string, parentId: string): Promise<string> {
  const token = await getAccessToken();
  const q = `name='${name}' and '${parentId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`;
  const params = new URLSearchParams({ q, fields: 'files(id)', pageSize: '1' });

  const resp = await fetch(`${BASE}/files?${params.toString()}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!resp.ok) throw new Error(`findOrCreateFolder list failed: ${resp.status}`);
  const data = await resp.json() as { files: { id: string }[] };

  if (data.files.length > 0) return data.files[0].id;

  const createResp = await fetch(`${BASE}/files`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name,
      mimeType: 'application/vnd.google-apps.folder',
      parents: [parentId],
    }),
  });
  if (!createResp.ok) throw new Error(`createFolder failed: ${createResp.status}`);
  const created = await createResp.json() as { id: string };
  return created.id;
}

export async function moveFile(fileId: string, fromParentId: string, toParentId: string): Promise<void> {
  const token = await getAccessToken();
  const params = new URLSearchParams({
    addParents: toParentId,
    removeParents: fromParentId,
    fields: 'id,parents',
  });

  for (let attempt = 0; attempt < 4; attempt++) {
    const resp = await fetch(`${BASE}/files/${fileId}?${params.toString()}`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });

    if (resp.ok) return;
    if (resp.status === 404) return; // already moved, treat as success

    if (resp.status === 429 || resp.status >= 500) {
      const backoff = Math.min(1000 * Math.pow(2, attempt) + Math.random() * 500, 30_000);
      await new Promise((r) => setTimeout(r, backoff));
      continue;
    }

    throw new Error(`moveFile failed: ${resp.status}`);
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

export async function downloadFileToCache(fileId: string, fileName: string): Promise<void> {
  const token = await getAccessToken();
  const url = `${BASE}/files/${fileId}?alt=media`;
  const resp = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (!resp.ok) throw new Error(`Download failed: ${resp.status}`);

  const cache = await caches.open('drivepod-audio');
  const cacheUrl = `offline-audio://${fileId}/${encodeURIComponent(fileName)}`;
  await cache.put(cacheUrl, new Response(await resp.blob(), {
    headers: { 'Content-Type': 'audio/mpeg', 'X-File-Id': fileId },
  }));
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
}

export async function isFileCached(fileId: string, fileName: string): Promise<boolean> {
  const cache = await caches.open('drivepod-audio');
  const cacheUrl = `offline-audio://${fileId}/${encodeURIComponent(fileName)}`;
  const cached = await cache.match(cacheUrl);
  return !!cached;
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
  const token = await getAccessToken();
  const q = `name='${NOTES_FILE_NAME}' and '${audioFolderId}' in parents and trashed=false`;
  const params = new URLSearchParams({ q, fields: 'files(id)', pageSize: '1' });
  const listResp = await fetch(`${BASE}/files?${params.toString()}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const blob = new Blob([JSON.stringify(content)], { type: 'application/json' });
  if (listResp.ok) {
    const listData = await listResp.json() as { files: { id: string }[] };
    if (listData.files.length > 0) {
      const patchResp = await fetch(`${UPLOAD_BASE}/files/${listData.files[0].id}?uploadType=media`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: blob,
      });
      if (patchResp.ok) return;
    }
  }
  const meta = JSON.stringify({ name: NOTES_FILE_NAME, parents: [audioFolderId] });
  const form = new FormData();
  form.append('metadata', new Blob([meta], { type: 'application/json' }));
  form.append('file', blob);
  await fetch(`${UPLOAD_BASE}/files?uploadType=multipart`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
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
  const token = await getAccessToken();
  const q = `name='${STATE_FILE_NAME}' and '${audioFolderId}' in parents and trashed=false`;
  const params = new URLSearchParams({ q, fields: 'files(id)', pageSize: '1' });

  const listResp = await fetch(`${BASE}/files?${params.toString()}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  const json = JSON.stringify(content);
  const blob = new Blob([json], { type: 'application/json' });

  if (listResp.ok) {
    const listData = await listResp.json() as { files: { id: string }[] };
    if (listData.files.length > 0) {
      const fileId = listData.files[0].id;
      const patchResp = await fetch(`${UPLOAD_BASE}/files/${fileId}?uploadType=media`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: blob,
      });
      if (patchResp.ok) return;
    }
  }

  const meta = JSON.stringify({ name: STATE_FILE_NAME, parents: [audioFolderId] });
  const form = new FormData();
  form.append('metadata', new Blob([meta], { type: 'application/json' }));
  form.append('file', blob);

  await fetch(`${UPLOAD_BASE}/files?uploadType=multipart`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  });
}
