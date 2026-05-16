import { useState, useMemo, useRef, useEffect } from 'react';
import { XIcon, PlayIcon } from './icons';
import type { Source } from '../hooks/useApp';
import type { DriveFile } from '../drive/types';

interface FuzzyResult {
  file: DriveFile;
  source: Source;
  fileIndex: number;
  score: number;
  matchPositions: number[];
}

function fuzzySearch(query: string, sources: Source[]): FuzzyResult[] {
  const q = query.toLowerCase().trim();
  if (!q) return [];

  const results: FuzzyResult[] = [];

  for (const source of sources) {
    for (let fi = 0; fi < source.files.length; fi++) {
      const file = source.files[fi];
      const title = file.name.replace(/\.mp3$/i, '');
      const t = title.toLowerCase();

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

  return results.sort((a, b) => b.score - a.score).slice(0, 30);
}

function HighlightedTitle({ title, positions }: { title: string; positions: number[] }): React.JSX.Element {
  const posSet = new Set(positions);
  return (
    <span>
      {Array.from(title).map((char, i) =>
        posSet.has(i)
          ? <span key={i} style={{ color: 'var(--accent)', fontWeight: 600 }}>{char}</span>
          : <span key={i}>{char}</span>,
      )}
    </span>
  );
}

function abbrev(name: string): string {
  return name.slice(0, 3).toUpperCase() + '.';
}

interface Props {
  sources: Source[];
  onPlay: (file: DriveFile, source: Source, fileIndex: number) => void;
  onClose: () => void;
}

export function SearchBar({ sources, onPlay, onClose }: Props): React.JSX.Element {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const results = useMemo(() => fuzzySearch(query, sources), [query, sources]);
  const totalFiles = sources.reduce((n, s) => n + s.files.length, 0);

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col lg:inset-y-0 lg:left-1/2 lg:right-auto lg:w-[640px] lg:-translate-x-1/2"
      style={{ background: 'var(--bg)', paddingTop: 'env(safe-area-inset-top)', paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      {/* Search input row */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '8px 12px',
        background: 'var(--surface-1)',
        borderBottom: '1px solid var(--border-1)',
      }}>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={`Rechercher dans ${totalFiles} fichiers…`}
          style={{
            flex: 1, height: 38, padding: '0 14px',
            borderRadius: 'var(--r-lg)',
            background: 'var(--surface-2)', border: '1px solid var(--border-1)',
            fontFamily: 'var(--font-sans)', fontSize: 14, color: 'var(--text-1)',
            outline: 'none',
          }}
        />
        <button
          onClick={onClose}
          style={{
            width: 44, height: 44, flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'var(--text-3)', borderRadius: 10,
          }}
        >
          <XIcon size={20} />
        </button>
      </div>

      {/* Results */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {!query.trim() ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '64px 0' }}>
            <p style={{ fontFamily: 'var(--font-sans)', fontSize: 14, color: 'var(--text-3)' }}>
              Tapez pour rechercher dans tous les dossiers
            </p>
          </div>
        ) : results.length === 0 ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '64px 0' }}>
            <p style={{ fontFamily: 'var(--font-sans)', fontSize: 14, color: 'var(--text-3)' }}>
              Aucun résultat pour « {query} »
            </p>
          </div>
        ) : (
          <>
            <div style={{ padding: '8px 16px 4px', fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 500, color: 'var(--text-4)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              {results.length} résultat{results.length > 1 ? 's' : ''}
            </div>
            {results.map((r, i) => (
              <button
                key={`${r.file.id}-${i}`}
                onClick={() => { onPlay(r.file, r.source, r.fileIndex); onClose(); }}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: 12,
                  padding: '12px 16px',
                  borderBottom: '1px solid var(--border-1)',
                  background: 'none', border: 'none',
                  cursor: 'pointer', textAlign: 'left',
                }}
              >
                {/* Source abbrev */}
                <span style={{
                  fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 500,
                  color: 'var(--accent)', background: 'var(--accent-soft)',
                  padding: '3px 6px', borderRadius: 4, flexShrink: 0,
                  letterSpacing: '0.04em',
                }}>
                  {abbrev(r.source.folder.name)}
                </span>

                {/* Title */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{
                    fontFamily: 'var(--font-sans)', fontSize: 14, fontWeight: 500,
                    color: 'var(--text-1)', lineHeight: 1.3,
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>
                    <HighlightedTitle
                      title={r.file.name.replace(/\.mp3$/i, '')}
                      positions={r.matchPositions}
                    />
                  </p>
                </div>

                {/* Play indicator */}
                <PlayIcon size={14} style={{ color: 'var(--text-4)', flexShrink: 0 }} />
              </button>
            ))}
          </>
        )}
      </div>
    </div>
  );
}
