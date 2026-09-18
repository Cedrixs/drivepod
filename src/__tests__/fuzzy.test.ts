import { describe, it, expect } from 'vitest';
import { fuzzySearch } from '../lib/fuzzy';
import type { DriveFile, Source } from '../drive/types';

function file(id: string, name: string): DriveFile {
  return { id, name, mimeType: 'audio/mpeg', parents: [], createdTime: '', modifiedTime: '' };
}

const sources: Source[] = [
  { folder: { id: 'a', name: 'Articles', parents: [] }, files: [file('1', 'Économie circulaire.mp3'), file('2', 'Histoire de Rome.mp3')] },
  { folder: { id: 'b', name: 'Books', parents: [] }, files: [file('3', 'Roman noir.mp3')] },
];

describe('fuzzySearch', () => {
  it('returns nothing for a blank query', () => {
    expect(fuzzySearch('   ', sources)).toEqual([]);
  });

  it('matches subsequences across folders and ranks prefix matches first', () => {
    const results = fuzzySearch('ro', sources);
    expect(results.map((r) => r.file.id)).toEqual(['3', '2']);
    expect(results[0].source.folder.name).toBe('Books');
    expect(results[1].fileIndex).toBe(1);
  });

  it('reports match positions on the title without extension', () => {
    const [result] = fuzzySearch('rome', sources);
    expect(result.file.id).toBe('2');
    const title = 'Histoire de Rome';
    expect(result.matchPositions.map((i) => title[i].toLowerCase()).join('')).toBe('rome');
    expect(Math.max(...result.matchPositions)).toBeLessThan(title.length);
  });

  it('caps the number of results', () => {
    const many: Source = {
      folder: { id: 'm', name: 'Many', parents: [] },
      files: Array.from({ length: 50 }, (_, i) => file(`m${i}`, `x${i}.mp3`)),
    };
    expect(fuzzySearch('x', [many], 5)).toHaveLength(5);
  });
});
