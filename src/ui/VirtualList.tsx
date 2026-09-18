import { useState, useEffect, useMemo, useRef, useCallback, type ReactNode } from 'react';
import { computeLayout, computeRange } from '../lib/virtual';

interface Props<T> {
  items: T[];
  itemKey: (item: T) => string;
  // Hauteur supposée d'une ligne avant mesure
  estimateHeight: number;
  // Lignes rendues en plus de part et d'autre de la fenêtre visible
  overscan?: number;
  renderItem: (item: T, index: number) => ReactNode;
}

// Liste virtualisée sur le défilement de la fenêtre : seules les lignes
// visibles (plus une marge) existent dans le DOM. Les hauteurs réelles sont
// mesurées par ResizeObserver, ce qui absorbe les titres sur deux lignes et
// les résumés dépliés.
export function VirtualList<T>({ items, itemKey, estimateHeight, overscan = 6, renderItem }: Props<T>): React.JSX.Element {
  const containerRef = useRef<HTMLDivElement>(null);
  const sizesRef = useRef(new Map<string, number>());
  // Incrémenté à chaque mesure : force le recalcul des positions
  const [sizeVersion, setSizeVersion] = useState(0);
  const [viewport, setViewport] = useState(() => ({
    scrollTop: 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 800,
  }));

  const keys = useMemo(() => items.map(itemKey), [items, itemKey]);

  useEffect(() => {
    let frame = 0;
    const measure = (): void => {
      frame = 0;
      const el = containerRef.current;
      if (!el) return;
      const top = el.getBoundingClientRect().top;
      setViewport((v) => {
        const next = { scrollTop: -top, height: window.innerHeight };
        return (v.scrollTop === next.scrollTop && v.height === next.height) ? v : next;
      });
    };
    const schedule = (): void => { if (!frame) frame = requestAnimationFrame(measure); };
    measure();
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    return () => {
      if (frame) cancelAnimationFrame(frame);
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
    };
  }, []);

  const observer = useMemo(() => {
    if (typeof ResizeObserver === 'undefined') return null;
    return new ResizeObserver((entries) => {
      let changed = false;
      for (const entry of entries) {
        const key = (entry.target as HTMLElement).dataset.vkey;
        if (!key) continue;
        const height = Math.round(entry.contentRect.height);
        if (height > 0 && sizesRef.current.get(key) !== height) {
          sizesRef.current.set(key, height);
          changed = true;
        }
      }
      if (changed) setSizeVersion((n) => n + 1);
    });
  }, []);

  useEffect(() => () => observer?.disconnect(), [observer]);

  const observe = useCallback((el: HTMLElement | null, prev: HTMLElement | null): void => {
    if (prev) observer?.unobserve(prev);
    if (el) observer?.observe(el);
  }, [observer]);

  const layout = useMemo(
    () => computeLayout(keys.length, (i) => sizesRef.current.get(keys[i]) ?? estimateHeight),
    // sizeVersion n'est pas lu mais déclenche le recalcul après chaque mesure
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [keys, estimateHeight, sizeVersion],
  );
  const range = computeRange(layout, viewport.scrollTop, viewport.height, overscan);

  return (
    <div ref={containerRef} style={{ position: 'relative', height: layout.total }}>
      {items.slice(range.start, range.end).map((item, i) => {
        const index = range.start + i;
        return (
          <Row key={keys[index]} vkey={keys[index]} top={layout.offsets[index]} observe={observe}>
            {renderItem(item, index)}
          </Row>
        );
      })}
    </div>
  );
}

function Row({ vkey, top, observe, children }: {
  vkey: string;
  top: number;
  observe: (el: HTMLElement | null, prev: HTMLElement | null) => void;
  children: ReactNode;
}): React.JSX.Element {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    observe(el, null);
    return () => observe(null, el);
  }, [observe]);

  return (
    <div ref={ref} data-vkey={vkey} style={{ position: 'absolute', top, left: 0, right: 0 }}>
      {children}
    </div>
  );
}
