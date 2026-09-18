import { findOrCreateFolder, moveFile } from './api';
import { removeFromStateAndSync } from '../state/driveState';

export const ARCHIVE_FOLDER_NAME = 'Archive';

export interface ArchiveTarget {
  fileId: string;
  sourceFolder: string;
  sourceFolderId: string;
  weekKey: string;
}

export interface ArchiveResolver {
  destination: (weekKey: string, sourceFolder: string) => Promise<string>;
}

// Résout (et crée si besoin) Audio/Archive/<semaine>/<source>/ en mémorisant
// chaque niveau : un archivage groupé n'interroge Drive qu'une fois par dossier.
// Une résolution échouée est oubliée pour qu'un appel suivant puisse réessayer.
export function createArchiveResolver(audioFolderId: string): ArchiveResolver {
  const pending = new Map<string, Promise<string>>();

  const memo = (key: string, resolve: () => Promise<string>): Promise<string> => {
    let p = pending.get(key);
    if (!p) {
      p = resolve().catch((err: unknown) => { pending.delete(key); throw err; });
      pending.set(key, p);
    }
    return p;
  };

  return {
    destination: (weekKey, sourceFolder) => memo(`${weekKey}/${sourceFolder}`, async () => {
      const archiveId = await memo('', () => findOrCreateFolder(ARCHIVE_FOLDER_NAME, audioFolderId));
      const weekId = await memo(weekKey, () => findOrCreateFolder(weekKey, archiveId));
      return findOrCreateFolder(sourceFolder, weekId);
    }),
  };
}

// Déplace un fichier vers son dossier d'archive et oublie sa position
// d'écoute. Retourne l'id du dossier de destination (pour annuler).
export async function archiveOne(resolver: ArchiveResolver, target: ArchiveTarget): Promise<string> {
  const destId = await resolver.destination(target.weekKey, target.sourceFolder);
  await moveFile(target.fileId, target.sourceFolderId, destId);
  await removeFromStateAndSync(target.fileId);
  return destId;
}

// Annulation : retour dans le dossier d'origine
export function unarchiveOne(fileId: string, archiveFolderId: string, sourceFolderId: string): Promise<void> {
  return moveFile(fileId, archiveFolderId, sourceFolderId);
}
