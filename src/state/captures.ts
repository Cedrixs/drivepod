import { readJsonFileByName, upsertJsonFile } from '../drive/api';

// Passages capturés (signet dans le player), stockés dans Audio/_drivepod_notes.json
const NOTES_FILE_NAME = '_drivepod_notes.json';

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

export function readNotesFile(audioFolderId: string): Promise<NotesFileContent | null> {
  return readJsonFileByName<NotesFileContent>(audioFolderId, NOTES_FILE_NAME);
}

export async function appendCapture(audioFolderId: string, capture: CapturedPassage): Promise<void> {
  const existing = await readNotesFile(audioFolderId);
  const content: NotesFileContent = existing ?? { version: 1, captures: [], lastUpdated: 0 };
  content.captures.push(capture);
  content.lastUpdated = Date.now();
  await upsertJsonFile(NOTES_FILE_NAME, audioFolderId, JSON.stringify(content));
}
