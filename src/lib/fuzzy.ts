import { stripMp3 } from './format';
import type { Source, DriveFile } from '../drive/types';

export interface FuzzyResult {
  file: DriveFile;
  source: Source;
  fileIndex: number;
  score: number;
  matchPositions: number[];
}

const MAX_RESULTS = 30;

// Recherche par sous-séquence : chaque caractère de la requête doit apparaître
// dans l'ordre dans le titre. Bonus pour les caractères consécutifs et un
// titre qui commence par la requête.
export function fuzzySearch(query: string, sources: Source[], maxResults = MAX_RESULTS): FuzzyResult[] {
  const q = query.toLowerCase().trim();
  if (!q) return [];

  const results: FuzzyResult[] = [];

  for (const source of sources) {
    for (let fi = 0; fi < source.files.length; fi++) {
      const file = source.files[fi];
      const t = stripMp3(file.name).toLowerCase();

      let qi = 0, score = 0, consecutive = 0;
      const matchPos: number[] = [];

      for (let ti = 0; ti < t.length && qi < q.length; ti++) {
        if (t[ti] === q[qi]) {
          score += 1 + consecutive * 2;
          consecutive++;
          matchPos.push(ti);
          qi++;
        } else {
          consecutive = 0;
        }
      }

      if (qi === q.length) {
        if (matchPos[0] === 0) score += 10;
        results.push({ file, source, fileIndex: fi, score, matchPositions: matchPos });
      }
    }
  }

  return results.sort((a, b) => b.score - a.score).slice(0, maxResults);
}
