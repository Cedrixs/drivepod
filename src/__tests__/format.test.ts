import { describe, it, expect } from 'vitest';
import { formatTime, formatMinutes, formatBytes, abbrev, stripMp3, plural } from '../lib/format';

describe('formatTime', () => {
  it('formats minutes and seconds', () => {
    expect(formatTime(0)).toBe('0:00');
    expect(formatTime(60)).toBe('1:00');
    expect(formatTime(90)).toBe('1:30');
    expect(formatTime(599.9)).toBe('9:59');
  });

  it('adds hours when needed', () => {
    expect(formatTime(3661)).toBe('1:01:01');
  });

  it('handles invalid values', () => {
    expect(formatTime(-1)).toBe('0:00');
    expect(formatTime(NaN)).toBe('0:00');
    expect(formatTime(Infinity)).toBe('0:00');
  });
});

describe('formatMinutes', () => {
  it('returns null under one minute', () => {
    expect(formatMinutes(0.4)).toBeNull();
  });

  it('formats minutes and hours', () => {
    expect(formatMinutes(42)).toBe('42 min');
    expect(formatMinutes(60)).toBe('1h');
    expect(formatMinutes(125)).toBe('2h 5m');
  });
});

describe('formatBytes', () => {
  it('picks the right unit', () => {
    expect(formatBytes(512)).toBe('512 B');
    expect(formatBytes(2048)).toBe('2.0 KB');
    expect(formatBytes(5 * 1024 * 1024)).toBe('5.0 MB');
  });
});

describe('text helpers', () => {
  it('abbreviates folder names', () => {
    expect(abbrev('Articles')).toBe('ART.');
    expect(abbrev('Books')).toBe('BOO.');
  });

  it('strips the mp3 extension only', () => {
    expect(stripMp3('Chapitre 1.mp3')).toBe('Chapitre 1');
    expect(stripMp3('Chapitre 1.MP3')).toBe('Chapitre 1');
    expect(stripMp3('notes.md')).toBe('notes.md');
  });

  it('pluralizes', () => {
    expect(plural(1, 'fichier')).toBe('fichier');
    expect(plural(2, 'fichier')).toBe('fichiers');
    expect(plural(3, 'cheval', 'chevaux')).toBe('chevaux');
  });
});
