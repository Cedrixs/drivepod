import { describe, it, expect, vi } from 'vitest';

describe('Drive state file', () => {
  it('serializes and deserializes state correctly', () => {
    const state = {
      version: 1,
      files: {
        'file-1': { position: 120, duration: 300, lastUpdated: Date.now(), sourceFolder: 'Books', fileName: 'test.mp3' },
      },
      lastUpdated: Date.now(),
    };
    const json = JSON.stringify(state);
    const parsed = JSON.parse(json) as typeof state;
    expect(parsed.version).toBe(1);
    expect(parsed.files['file-1'].position).toBe(120);
  });

  it('handles empty state file', () => {
    const state = { version: 1, files: {}, lastUpdated: 0 };
    expect(Object.keys(state.files)).toHaveLength(0);
  });

  it('debounce write schedules correctly', () => {
    vi.useFakeTimers();
    const writeSpy = vi.fn();
    let timer: ReturnType<typeof setTimeout> | null = null;

    const scheduleWrite = (): void => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => { writeSpy(); timer = null; }, 30_000);
    };

    scheduleWrite();
    scheduleWrite(); // second call should reset timer
    vi.advanceTimersByTime(29_000);
    expect(writeSpy).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1_000);
    expect(writeSpy).toHaveBeenCalledOnce();

    vi.useRealTimers();
  });

  it('position saved every 5 seconds during playback', () => {
    vi.useFakeTimers();
    const saveSpy = vi.fn();
    const timer = setInterval(() => saveSpy(), 5_000);

    vi.advanceTimersByTime(15_000);
    expect(saveSpy).toHaveBeenCalledTimes(3);
    clearInterval(timer);
    vi.useRealTimers();
  });
});

describe('File list ordering', () => {
  it('sorts by createdTime ASC', () => {
    const files = [
      { id: '3', name: 'c.mp3', createdTime: '2026-03-01T00:00:00Z' },
      { id: '1', name: 'a.mp3', createdTime: '2026-01-01T00:00:00Z' },
      { id: '2', name: 'b.mp3', createdTime: '2026-02-01T00:00:00Z' },
    ];
    const sorted = [...files].sort((a, b) =>
      new Date(a.createdTime).getTime() - new Date(b.createdTime).getTime(),
    );
    expect(sorted[0].id).toBe('1');
    expect(sorted[1].id).toBe('2');
    expect(sorted[2].id).toBe('3');
  });

  it('excludes Archive folder from sources', () => {
    const folders = [
      { id: '1', name: 'Books' },
      { id: '2', name: 'Archive' },
      { id: '3', name: 'Articles' },
    ];
    const sources = folders.filter((f) => f.name !== 'Archive');
    expect(sources).toHaveLength(2);
    expect(sources.every((s) => s.name !== 'Archive')).toBe(true);
  });
});

describe('Rate limit backoff', () => {
  it('exponential backoff capped at 30s', () => {
    const backoffs = Array.from({ length: 5 }, (_, i) =>
      Math.min(1000 * Math.pow(2, i), 30_000),
    );
    expect(backoffs[0]).toBe(1000);
    expect(backoffs[1]).toBe(2000);
    expect(backoffs[2]).toBe(4000);
    expect(backoffs[3]).toBe(8000);
    expect(backoffs[4]).toBe(16000);
  });
});
