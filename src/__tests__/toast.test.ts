import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { toast, getToasts, subscribeToasts, clearAllToasts } from '../lib/toast';

describe('toast store', () => {
  beforeEach(() => { vi.useFakeTimers(); clearAllToasts(); });
  afterEach(() => { vi.useRealTimers(); });

  it('publishes to subscribers and auto-dismisses', () => {
    const listener = vi.fn();
    const off = subscribeToasts(listener);
    const id = toast.success('ok');
    expect(getToasts().map((t) => t.id)).toEqual([id]);
    expect(listener).toHaveBeenCalledTimes(1);

    vi.advanceTimersByTime(4_000);
    expect(getToasts()).toHaveLength(0);
    off();
  });

  it('keeps errors longer than infos', () => {
    toast.info('i');
    toast.error('e');
    vi.advanceTimersByTime(4_000);
    expect(getToasts().map((t) => t.kind)).toEqual(['error']);
    vi.advanceTimersByTime(2_000);
    expect(getToasts()).toHaveLength(0);
  });

  it('evicts the oldest beyond three visible', () => {
    const ids = [toast.info('1'), toast.info('2'), toast.info('3'), toast.info('4')];
    expect(getToasts().map((t) => t.id)).toEqual(ids.slice(1));
  });

  it('dismisses on demand and ignores unknown ids', () => {
    const id = toast.error('x');
    toast.dismiss(999);
    expect(getToasts()).toHaveLength(1);
    toast.dismiss(id);
    expect(getToasts()).toHaveLength(0);
  });
});
