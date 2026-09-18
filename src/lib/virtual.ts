// Calculs purs de la liste virtualisée : positions cumulées des lignes et
// fenêtre d'indices à rendre pour une position de défilement donnée.

export interface VirtualLayout {
  // offsets[i] = position du haut de la ligne i ; offsets[count] = hauteur totale
  offsets: number[];
  total: number;
}

export function computeLayout(count: number, sizeAt: (index: number) => number): VirtualLayout {
  const offsets = new Array<number>(count + 1);
  let acc = 0;
  for (let i = 0; i < count; i++) {
    offsets[i] = acc;
    acc += sizeAt(i);
  }
  offsets[count] = acc;
  return { offsets, total: acc };
}

// Premier index dont le bas dépasse `y` (recherche binaire sur les offsets)
function firstIndexBelow(offsets: number[], y: number): number {
  const count = offsets.length - 1;
  let lo = 0;
  let hi = count - 1;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (offsets[mid + 1] <= y) lo = mid + 1;
    else hi = mid;
  }
  return lo;
}

export interface VirtualRange {
  start: number;
  // exclusif
  end: number;
}

export function computeRange(
  layout: VirtualLayout,
  scrollTop: number,
  viewportHeight: number,
  overscan: number,
): VirtualRange {
  const count = layout.offsets.length - 1;
  if (count === 0) return { start: 0, end: 0 };
  if (viewportHeight <= 0) return { start: 0, end: Math.min(count, overscan) };

  const top = Math.max(0, scrollTop);
  const bottom = Math.max(0, scrollTop + viewportHeight);
  if (top >= layout.total) return { start: Math.max(0, count - overscan), end: count };

  const start = firstIndexBelow(layout.offsets, top);
  // Dernière ligne dont le haut est strictement au-dessus du bas de la fenêtre
  let end = firstIndexBelow(layout.offsets, bottom);
  if (layout.offsets[end] < bottom) end += 1;
  end = Math.min(count, end);

  return {
    start: Math.max(0, start - overscan),
    end: Math.min(count, end + overscan),
  };
}
