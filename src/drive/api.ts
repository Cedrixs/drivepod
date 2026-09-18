import { authedFetch, driveRequest, escapeQueryValue, isDriveApiError, DRIVE_BASE, DRIVE_UPLOAD_BASE } from './client';
import { normalizeFolderName } from '../state/archiveRules';
import type { DriveFile, DriveFolder } from './types';

export const FOLDER_MIME = 'application/vnd.google-apps.folder';
export const AUDIO_MIME = 'audio/mpeg';

const FILE_FIELDS = 'id,name,mimeType,parents,createdTime,modifiedTime,size';

interface FileListResponse {
  files: DriveFile[];
  nextPageToken?: string;
}

// ── Navigation ───────────────────────────────────────────────────────────────

export async function getRootFolderId(): Promise<string> {
  const root = await driveRequest<{ id?: string }>('/files/root?fields=id');
  if (!root.id) throw new Error('API_NOT_ENABLED');
  return root.id;
}

export async function listChildren(folderId: string, mimeType?: string): Promise<DriveFile[]> {
  const results: DriveFile[] = [];
  let pageToken: string | undefined;

  const q = [
    `'${folderId}' in parents`,
    mimeType ? `mimeType='${mimeType}'` : null,
    'trashed=false',
  ].filter(Boolean).join(' and ');

  do {
    const params = new URLSearchParams({
      q,
      fields: `nextPageToken,files(${FILE_FIELDS})`,
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
  const files = await listChildren(folderId, FOLDER_MIME);
  return files.map((f) => ({ id: f.id, name: f.name, parents: f.parents }));
}

export async function findFileByName(name: string, parentId: string, mimeType?: string): Promise<string | null> {
  const q = [
    `name='${escapeQueryValue(name)}'`,
    `'${parentId}' in parents`,
    mimeType ? `mimeType='${mimeType}'` : null,
    'trashed=false',
  ].filter(Boolean).join(' and ');
  const params = new URLSearchParams({ q, fields: 'files(id)', pageSize: '1' });
  const data = await driveRequest<{ files: { id: string }[] }>(`/files?${params.toString()}`);
  return data.files[0]?.id ?? null;
}

// Cherche un dossier sans le créer (pour les dossiers gérés par le pipeline,
// comme PDF/Textes IA, qu'on ne veut pas créer par accident depuis l'app)
export function findFolder(name: string, parentId: string): Promise<string | null> {
  return findFileByName(name, parentId, FOLDER_MIME);
}

export async function findOrCreateFolder(name: string, parentId: string): Promise<string> {
  const existing = await findFolder(name, parentId);
  if (existing) return existing;

  const created = await driveRequest<{ id: string }>('/files', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, mimeType: FOLDER_MIME, parents: [parentId] }),
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
    if (isDriveApiError(err, 404)) return;
    throw err;
  }
}

// ── Contenu ──────────────────────────────────────────────────────────────────

// Les requêtes vers /drivepod/stream/:id sont interceptées par le Service
// Worker, qui injecte le header Authorization avant de relayer vers Drive.
export function getStreamUrl(fileId: string): string {
  return `/drivepod/stream/${fileId}`;
}

export function downloadFileResponse(fileId: string): Promise<Response> {
  return authedFetch(`${DRIVE_BASE}/files/${fileId}?alt=media`);
}

export async function downloadFileText(fileId: string): Promise<string> {
  const resp = await downloadFileResponse(fileId);
  return resp.text();
}

export async function readTextFileByName(parentId: string, name: string): Promise<string | null> {
  const id = await findFileByName(name, parentId);
  return id ? downloadFileText(id) : null;
}

export async function readJsonFileByName<T>(parentId: string, name: string): Promise<T | null> {
  const text = await readTextFileByName(parentId, name);
  if (text === null) return null;
  try {
    return JSON.parse(text) as T;
  } catch {
    return null;
  }
}

// PATCH si le fichier existe, POST multipart sinon. Un échec de PATCH remonte
// en erreur au lieu de retomber sur un POST qui créerait un doublon.
export async function upsertJsonFile(fileName: string, parentFolderId: string, json: string): Promise<void> {
  const existingId = await findFileByName(fileName, parentFolderId);
  const blob = new Blob([json], { type: 'application/json' });

  if (existingId) {
    await authedFetch(`${DRIVE_UPLOAD_BASE}/files/${existingId}?uploadType=media`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: blob,
      retries: 3,
    });
    return;
  }

  const meta = JSON.stringify({ name: fileName, parents: [parentFolderId] });
  const form = new FormData();
  form.append('metadata', new Blob([meta], { type: 'application/json' }));
  form.append('file', blob);
  await authedFetch(`${DRIVE_UPLOAD_BASE}/files?uploadType=multipart`, {
    method: 'POST',
    body: form,
    retries: 3,
  });
}

// ── Synthèses hebdo (PDF/Textes IA) ──────────────────────────────────────────

let textesIaFolderId: string | null = null;

// Les synthèses écrites vivent dans PDF/Textes IA (déposées par la routine
// Cowork, jamais supprimées par le pipeline), pas dans Audio/.
export async function listSynthesisFiles(): Promise<DriveFile[]> {
  if (!textesIaFolderId) {
    const rootId = await getRootFolderId();
    const pdfId = await findFolder('PDF', rootId);
    if (!pdfId) return [];
    const iaId = await findFolder('Textes IA', pdfId);
    if (!iaId) return [];
    textesIaFolderId = iaId;
  }

  const q = `'${textesIaFolderId}' in parents and trashed=false and name contains 'Synth'`;
  const params = new URLSearchParams({
    q,
    fields: `files(${FILE_FIELDS})`,
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
    return await downloadFileText(fileId);
  } catch {
    return null;
  }
}

// ── Markdown associé à un MP3 (même nom, extension .md, même dossier) ────────

const markdownCache = new Map<string, Promise<string | null>>();

export function fetchMarkdownContent(parentFolderId: string, mp3FileName: string): Promise<string | null> {
  const mdName = mp3FileName.replace(/\.mp3$/i, '.md');
  const cacheKey = `${parentFolderId}/${mdName}`;

  let pending = markdownCache.get(cacheKey);
  if (!pending) {
    pending = readTextFileByName(parentFolderId, mdName).catch(() => null);
    markdownCache.set(cacheKey, pending);
  }
  return pending;
}
