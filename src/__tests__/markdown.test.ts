import { describe, it, expect } from 'vitest';
import { stripMarkdown, extractSummary, extractPassage } from '../lib/markdown';

const MD = `# Titre de l'article

Première phrase **importante** du texte. Deuxième phrase avec un [lien](https://x.y) dedans.
Troisième phrase, un peu plus longue que les autres. Quatrième phrase ici. Cinquième phrase finale.

- item un
- item deux

1. étape
2. autre étape`;

describe('stripMarkdown', () => {
  it('removes headings, emphasis, links and list markers', () => {
    const text = stripMarkdown(MD);
    expect(text).not.toContain('#');
    expect(text).not.toContain('**');
    expect(text).not.toContain('](');
    expect(text).toContain('importante');
    expect(text).toContain('lien dedans');
    expect(text).toContain('item un');
    expect(text).toMatch(/étape autre étape/);
  });
});

describe('extractSummary', () => {
  it('keeps the first sentences only', () => {
    const summary = extractSummary(MD, 2);
    expect(summary).toBe('Première phrase importante du texte. Deuxième phrase avec un lien dedans.');
  });

  it('defaults to four sentences', () => {
    const summary = extractSummary(MD);
    expect(summary).toContain('Quatrième phrase ici.');
    expect(summary).not.toContain('Cinquième');
  });
});

describe('extractPassage', () => {
  const words = Array.from({ length: 400 }, (_, i) => `mot${i}`).join(' ');

  it('centers the window on the listening position', () => {
    const passage = extractPassage(words, 50, 100, 10);
    expect(passage.split(' ')).toHaveLength(20);
    expect(passage.startsWith('mot190 ')).toBe(true);
  });

  it('clamps at the beginning and the end', () => {
    expect(extractPassage(words, 0, 100, 10).startsWith('mot0 ')).toBe(true);
    expect(extractPassage(words, 100, 100, 10).endsWith(' mot399')).toBe(true);
  });

  it('returns an empty string for empty content', () => {
    expect(extractPassage('', 10, 100)).toBe('');
  });
});
