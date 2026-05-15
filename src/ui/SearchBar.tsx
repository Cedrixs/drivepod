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
          ? <span key={i} className="text-accent font-bold">{char}</span>
          : <span key={i}>{char}</span>,
      )}
    </span>
  );
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
      className="fixed inset-0 bg-navy-900 z-50 flex flex-col"
      style={{ paddingTop: 'env(safe-area-inset-top)', paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      {/* Search input row */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-white/10 bg-navy-800">
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={`Rechercher dans ${totalFiles} fichiers…`}
          className="flex-1 bg-white/10 rounded-xl px-4 py-2 text-sm text-white placeholder-white/30 outline-none focus:ring-1 focus:ring-accent"
        />
        <button onClick={onClose} className="p-2 text-white/60 hover:text-white transition-colors flex-shrink-0">
          <XIcon size={20} />
        </button>
      </div>

      {/* Results */}
      <div className="flex-1 overflow-y-auto">
        {!query.trim() ? (
          <div className="flex flex-col items-center justify-center py-16 text-white/30">
            <p className="text-sm">Tapez pour rechercher dans tous les dossiers</p>
          </div>
        ) : results.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-white/30">
            <p className="text-sm">Aucun résultat pour « {query} »</p>
          </div>
        ) : (
          <>
            <p className="px-4 py-2 text-xs text-white/30">
              {results.length} résultat{results.length > 1 ? 's' : ''}
            </p>
            {results.map((r, i) => (
              <button
                key={`${r.file.id}-${i}`}
                onClick={() => { onPlay(r.file, r.source, r.fileIndex); onClose(); }}
                className="w-full flex items-center gap-3 px-4 py-3 border-b border-white/5 hover:bg-white/5 transition-colors text-left"
              >
                <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0">
                  <PlayIcon size={12} className="text-white/50 ml-0.5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white truncate">
                    <HighlightedTitle
                      title={r.file.name.replace(/\.mp3$/i, '')}
                      positions={r.matchPositions}
                    />
                  </p>
                  <span className="text-xs text-white/30 bg-white/5 rounded px-1.5 py-0.5 mt-0.5 inline-block">
                    {r.source.folder.name}
                  </span>
                </div>
              </button>
            ))}
          </>
        )}
      </div>
    </div>
  );
}
