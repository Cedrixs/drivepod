import { describe, it, expect } from 'vitest';
import {
  isoWeekKey, parseWeekKey, isBulkArchiveExcluded, selectFilesToBulkArchive,
  archiveGroupLabel, sortSynthesesDesc, normalizeFolderName,
} from '../state/archiveRules';
import type { DriveFile } from '../drive/types';
import type { Source } from '../hooks/useApp';

function makeFile(id: string, createdTime: string, name = `${id}.mp3`): DriveFile {
  return { id, name, mimeType: 'audio/mpeg', parents: [], createdTime, modifiedTime: createdTime };
}

function makeSource(name: string, files: DriveFile[]): Source {
  return { folder: { id: `folder-${name}`, name, parents: [] }, files };
}

describe('isoWeekKey', () => {
  it('computes ISO week numbers (Thursday rule)', () => {
    expect(isoWeekKey(new Date(2026, 0, 1))).toBe('2026-S01');   // jeudi
    expect(isoWeekKey(new Date(2026, 6, 6))).toBe('2026-S28');   // lundi
    expect(isoWeekKey(new Date(2026, 6, 10))).toBe('2026-S28');  // vendredi
  });

  it('assigns year-boundary days to the correct ISO year', () => {
    expect(isoWeekKey(new Date(2024, 11, 30))).toBe('2025-S01'); // lun. 30 déc. 2024 → S1 2025
    expect(isoWeekKey(new Date(2023, 0, 1))).toBe('2022-S52');   // dim. 1er janv. 2023 → S52 2022
  });
});

describe('parseWeekKey', () => {
  it('extracts the week key from a synthesis filename', () => {
    expect(parseWeekKey('Synthèse semaine 2026-S28 - TTS.md')).toBe('2026-S28');
  });

  it('returns null when no key is present', () => {
    expect(parseWeekKey('article-original - TTS.md')).toBeNull();
  });
});

describe('isBulkArchiveExcluded', () => {
  it('excludes Synthèses, Révision and Books (accents/case insensitive)', () => {
    expect(isBulkArchiveExcluded('Synthèses')).toBe(true);
    expect(isBulkArchiveExcluded('synthese')).toBe(true);
    expect(isBulkArchiveExcluded('Révision')).toBe(true);
    expect(isBulkArchiveExcluded('REVISIONS')).toBe(true);
    expect(isBulkArchiveExcluded('Books')).toBe(true);
  });

  it('keeps regular sources eligible', () => {
    expect(isBulkArchiveExcluded('Articles')).toBe(false);
    expect(isBulkArchiveExcluded('Audio')).toBe(false);
  });
});

describe('normalizeFolderName', () => {
  it('strips accents and lowercases', () => {
    expect(normalizeFolderName('Révision')).toBe('revision');
    expect(normalizeFolderName('  Synthèses ')).toBe('syntheses');
  });
});

describe('selectFilesToBulkArchive', () => {
  const cutoff = '2026-07-06T00:00:00.000Z';
  const sources: Source[] = [
    makeSource('Articles', [
      makeFile('old-1', '2026-07-01T10:00:00.000Z'),
      makeFile('new-1', '2026-07-08T10:00:00.000Z'),
    ]),
    makeSource('Audio', [makeFile('old-2', '2026-06-20T10:00:00.000Z')]),
    makeSource('Books', [makeFile('book-old', '2026-01-01T10:00:00.000Z')]),
    makeSource('Synthèses', [makeFile('synth-old', '2026-06-01T10:00:00.000Z')]),
    makeSource('Révision', [makeFile('rev-old', '2026-06-01T10:00:00.000Z')]),
  ];

  it('selects only pre-cutoff files from non-excluded folders', () => {
    const result = selectFilesToBulkArchive(sources, cutoff);
    expect(result.map((c) => c.file.id).sort()).toEqual(['old-1', 'old-2']);
  });

  it('includes never-listened files (no progress filter)', () => {
    const result = selectFilesToBulkArchive(sources, cutoff);
    expect(result.find((c) => c.file.id === 'old-2')?.sourceFolder).toBe('Audio');
  });

  it('returns nothing for an invalid cutoff', () => {
    expect(selectFilesToBulkArchive(sources, 'not-a-date')).toEqual([]);
  });
});

describe('archiveGroupLabel', () => {
  it('formats weekly folders', () => {
    expect(archiveGroupLabel('2026-S28')).toBe('Semaine 28 · 2026');
  });

  it('formats legacy monthly folders', () => {
    expect(archiveGroupLabel('2026-05')).toBe('Mai 2026');
  });

  it('falls back to the raw name', () => {
    expect(archiveGroupLabel('Divers')).toBe('Divers');
  });
});

describe('sortSynthesesDesc', () => {
  it('orders by week key, newest first', () => {
    const files = [
      makeFile('a', '2026-06-28T00:00:00.000Z', 'Synthèse semaine 2026-S26 - TTS.md'),
      makeFile('b', '2026-07-12T00:00:00.000Z', 'Synthèse semaine 2026-S28 - TTS.md'),
      makeFile('c', '2026-07-05T00:00:00.000Z', 'Synthèse semaine 2026-S27 - TTS.md'),
    ];
    expect(sortSynthesesDesc(files).map((f) => f.id)).toEqual(['b', 'c', 'a']);
  });
});
