import { useState, useMemo, useRef, useEffect } from 'react';
import { XIcon, PlayIcon } from './icons';
import { abbrev, stripMp3, plural } from '../lib/format';
import { fuzzySearch } from '../lib/fuzzy';
import { FullscreenPanel, IconButton, EmptyState } from './primitives';
import type { Source, DriveFile } from '../drive/types';

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
    <FullscreenPanel>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '8px 12px',
        background: 'var(--surface-1)',
        borderBottom: '1px solid var(--border-1)',
      }}>
        <input
          ref={inputRef}
          type="search"
          aria-label="Rechercher un fichier"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Escape') onClose();
            if (e.key === 'Enter' && results[0]) { const r = results[0]; onPlay(r.file, r.source, r.fileIndex); onClose(); }
          }}
          placeholder={`Rechercher dans ${totalFiles} ${plural(totalFiles, 'fichier')}…`}
          style={{
            flex: 1, height: 38, padding: '0 14px',
            borderRadius: 'var(--r-lg)',
            background: 'var(--surface-2)', border: '1px solid var(--border-1)',
            fontFamily: 'var(--font-sans)', fontSize: 14, color: 'var(--text-1)',
            outline: 'none',
          }}
        />
        <IconButton label="Fermer la recherche" onClick={onClose}>
          <XIcon size={20} />
        </IconButton>
      </div>

      <div style={{ flex: 1, overflowY: 'auto' }}>
        {!query.trim() ? (
          <EmptyState title="Tapez pour rechercher dans tous les dossiers" />
        ) : results.length === 0 ? (
          <EmptyState title={`Aucun résultat pour « ${query} »`} />
        ) : (
          <>
            <div style={{ padding: '8px 16px 4px', fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 500, color: 'var(--text-4)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              {results.length} {plural(results.length, 'résultat')}
            </div>
            {results.map((r) => (
              <button
                type="button"
                key={r.file.id}
                onClick={() => { onPlay(r.file, r.source, r.fileIndex); onClose(); }}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: 12,
                  padding: '12px 16px',
                  borderBottom: '1px solid var(--border-1)',
                  background: 'none', border: 'none',
                  cursor: 'pointer', textAlign: 'left',
                }}
              >
                <span style={{
                  fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 500,
                  color: 'var(--accent)', background: 'var(--accent-soft)',
                  padding: '3px 6px', borderRadius: 4, flexShrink: 0,
                  letterSpacing: '0.04em',
                }}>
                  {abbrev(r.source.folder.name)}
                </span>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{
                    fontFamily: 'var(--font-sans)', fontSize: 14, fontWeight: 500,
                    color: 'var(--text-1)', lineHeight: 1.3,
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>
                    <HighlightedTitle title={stripMp3(r.file.name)} positions={r.matchPositions} />
                  </p>
                </div>

                <PlayIcon size={14} style={{ color: 'var(--text-4)', flexShrink: 0 }} />
              </button>
            ))}
          </>
        )}
      </div>
    </FullscreenPanel>
  );
}
