import type { DriveFile, Source } from '../drive/types';

// Clé de semaine ISO 8601 (lundi–dimanche, règle du jeudi), ex : "2026-S28".
// Sert de nom aux dossiers Drive Archive/<clé>/ : le tri lexicographique
// correspond au tri chronologique.
export function isoWeekKey(d: Date): string {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const day = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - day);
  const yearStart = Date.UTC(date.getUTCFullYear(), 0, 1);
  const week = Math.ceil(((date.getTime() - yearStart) / 86_400_000 + 1) / 7);
  return `${date.getUTCFullYear()}-S${String(week).padStart(2, '0')}`;
}

// Extrait "2026-S28" d'un nom comme "Synthèse semaine 2026-S28 - TTS.md"
export function parseWeekKey(name: string): string | null {
  const match = name.match(/(\d{4}-S\d{2})/);
  return match ? match[1] : null;
}

export function normalizeFolderName(name: string): string {
  const COMBINING_MARKS = new RegExp('[\\u0300-\\u036f]', 'g');
  return name.normalize('NFD').replace(COMBINING_MARKS, '').toLowerCase().trim();
}

// Dossiers jamais concernés par l'archivage groupé « avant la synthèse » :
// les synthèses/révisions sont les outils de mémorisation eux-mêmes, et les
// livres ne sont pas couverts par la synthèse hebdo.
const BULK_ARCHIVE_EXCLUDED_PREFIXES = ['synthese', 'revision', 'book'];

export function isBulkArchiveExcluded(folderName: string): boolean {
  const normalized = normalizeFolderName(folderName);
  return BULK_ARCHIVE_EXCLUDED_PREFIXES.some((p) => normalized.startsWith(p));
}

export interface BulkCandidate {
  file: DriveFile;
  sourceFolder: string;
  sourceFolderId: string;
}

// Fichiers à archiver en masse : tout MP3 créé avant la date de la synthèse,
// dans tous les onglets sauf ceux exclus : écoutés ou non.
export function selectFilesToBulkArchive(sources: Source[], cutoffTime: string): BulkCandidate[] {
  const cutoff = new Date(cutoffTime).getTime();
  if (!isFinite(cutoff)) return [];

  const candidates: BulkCandidate[] = [];
  for (const source of sources) {
    if (isBulkArchiveExcluded(source.folder.name)) continue;
    for (const file of source.files) {
      const created = new Date(file.createdTime).getTime();
      if (isFinite(created) && created < cutoff) {
        candidates.push({
          file,
          sourceFolder: source.folder.name,
          sourceFolderId: source.folder.id,
        });
      }
    }
  }
  return candidates;
}

// Libellé d'affichage d'un dossier d'archive : "2026-S28" → "Semaine 28 · 2026",
// ancien format mensuel "2026-05" → "Mai 2026", sinon le nom brut.
const MONTH_NAMES = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
];

export function archiveGroupLabel(folderName: string): string {
  const week = folderName.match(/^(\d{4})-S(\d{2})$/);
  if (week) return `Semaine ${parseInt(week[2], 10)} · ${week[1]}`;
  const month = folderName.match(/^(\d{4})-(\d{2})$/);
  if (month) {
    const m = parseInt(month[2], 10);
    if (m >= 1 && m <= 12) return `${MONTH_NAMES[m - 1]} ${month[1]}`;
  }
  return folderName;
}

// Tri des synthèses de la plus récente à la plus ancienne (clé de semaine
// prioritaire, date de création en repli)
export function sortSynthesesDesc(files: DriveFile[]): DriveFile[] {
  return [...files].sort((a, b) => {
    const ka = parseWeekKey(a.name);
    const kb = parseWeekKey(b.name);
    if (ka && kb && ka !== kb) return kb.localeCompare(ka);
    return b.createdTime.localeCompare(a.createdTime);
  });
}
