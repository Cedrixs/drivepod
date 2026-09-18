import { describe, it, expect } from 'vitest';
import { computeLayout, computeRange } from '../lib/virtual';

describe('computeLayout', () => {
  it('accumulates variable heights', () => {
    const sizes = [10, 20, 30];
    const layout = computeLayout(3, (i) => sizes[i]);
    expect(layout.offsets).toEqual([0, 10, 30, 60]);
    expect(layout.total).toBe(60);
  });

  it('handles an empty list', () => {
    expect(computeLayout(0, () => 10)).toEqual({ offsets: [0], total: 0 });
  });
});

describe('computeRange', () => {
  const layout = computeLayout(100, () => 50);

  it('returns the visible window plus overscan', () => {
    // visible : 500..1000 -> lignes 10..19 (la ligne 20 commence pile au bord)
    expect(computeRange(layout, 500, 500, 2)).toEqual({ start: 8, end: 22 });
    // 525..1025 -> lignes 10..20
    expect(computeRange(layout, 525, 500, 2)).toEqual({ start: 8, end: 23 });
  });

  it('clamps at the top and the bottom', () => {
    // La liste commence 300px sous le haut de la fenêtre : 200px visibles -> lignes 0..3
    expect(computeRange(layout, -300, 500, 2)).toEqual({ start: 0, end: 6 });
    expect(computeRange(layout, 4_900, 500, 2)).toEqual({ start: 96, end: 100 });
    expect(computeRange(layout, 10_000, 500, 2)).toEqual({ start: 98, end: 100 });
  });

  it('works with variable heights', () => {
    const sizes = [100, 300, 50, 50, 400];
    const varied = computeLayout(5, (i) => sizes[i]);
    // 350..600 couvre la fin de la ligne 1 (100..400), 2 (400..450), 3 (450..500) et 4 (500..)
    expect(computeRange(varied, 350, 250, 0)).toEqual({ start: 1, end: 5 });
  });

  it('handles empty lists', () => {
    expect(computeRange(computeLayout(0, () => 1), 0, 500, 3)).toEqual({ start: 0, end: 0 });
  });
});
