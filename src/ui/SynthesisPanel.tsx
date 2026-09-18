import { useState, useEffect, useCallback, useMemo } from 'react';
import { listSynthesisFiles, fetchFileText } from '../drive/api';
import {
  parseWeekKey, isoWeekKey, sortSynthesesDesc, selectFilesToBulkArchive,
  type BulkCandidate,
} from '../state/archiveRules';
import { plural } from '../lib/format';
import { ArchiveIcon, ChevronDownIcon, ChevronUpIcon } from './icons';
import { Spinner, IconButton } from './primitives';
import type { ArchiveResult } from '../hooks/useApp';
import type { Source, DriveFile } from '../drive/types';

interface Props {
  sources: Source[];
  online: boolean;
  onArchiveMany: (items: BulkCandidate[], destWeekKey: string) => Promise<ArchiveResult>;
}

// Rendu markdown minimal (titres, gras, paragraphes) : les synthèses sont de
// la prose TTS, pas besoin d'un parseur complet
function renderMarkdownLite(md: string): React.JSX.Element[] {
  const blocks = md.split(/\n{2,}/);
  return blocks.map((block, i) => {
    const trimmed = block.trim();
    if (!trimmed) return <span key={i} />;

    const heading = trimmed.match(/^(#{1,6})\s+(.*)$/s);
    if (heading) {
      return (
        <h3 key={i} style={{
          fontFamily: 'var(--font-sans)', fontSize: 15, fontWeight: 600,
          color: 'var(--text-1)', margin: '16px 0 4px',
        }}>
          {heading[2].replace(/\*\*/g, '')}
        </h3>
      );
    }

    const parts = trimmed.split(/\*\*(.+?)\*\*/g);
    return (
      <p key={i} style={{
        fontFamily: 'var(--font-sans)', fontSize: 14, lineHeight: 1.65,
        color: 'var(--text-2)', margin: '8px 0',
      }}>
        {parts.map((part, j) =>
          j % 2 === 1
            ? <strong key={j} style={{ color: 'var(--text-1)', fontWeight: 600 }}>{part}</strong>
            : part.replace(/\n/g, ' '),
        )}
      </p>
    );
  });
}

function synthesisLabel(file: DriveFile): string {
  const week = parseWeekKey(file.name);
  if (week) {
    const m = week.match(/^(\d{4})-S(\d{2})$/);
    if (m) return `Semaine ${parseInt(m[2], 10)} · ${m[1]}`;
  }
  return new Date(file.createdTime).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
}

const CARD_TEXT: React.CSSProperties = { fontFamily: 'var(--font-sans)', fontSize: 13, color: 'var(--text-2)', margin: 0 };

export function SynthesisPanel({ sources, online, onArchiveMany }: Props): React.JSX.Element | null {
  const [syntheses, setSyntheses] = useState<DriveFile[] | null>(null);
  const [index, setIndex] = useState(0);
  const [texts, setTexts] = useState<Map<string, string>>(new Map());
  const [expanded, setExpanded] = useState(true);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [archiving, setArchiving] = useState(false);
  const [resultMsg, setResultMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!online) { setSyntheses([]); return; }
    let cancelled = false;
    void (async () => {
      try {
        const files = sortSynthesesDesc(await listSynthesisFiles());
        if (!cancelled) setSyntheses(files);
      } catch {
        if (!cancelled) { setSyntheses([]); setError('Impossible de charger les synthèses.'); }
      }
    })();
    return () => { cancelled = true; };
  }, [online]);

  const current = syntheses?.[index] ?? null;

  useEffect(() => {
    if (!current || texts.has(current.id)) return;
    let cancelled = false;
    void fetchFileText(current.id).then((text) => {
      if (!cancelled && text !== null) setTexts((m) => new Map(m).set(current.id, text));
    });
    return () => { cancelled = true; };
  }, [current, texts]);

  // Changer de semaine remet la zone d'action à zéro (message de résultat, confirmation)
  const goTo = useCallback((next: number): void => {
    setIndex(next);
    setResultMsg(null);
    setConfirmOpen(false);
  }, []);

  const candidates = useMemo(
    () => (current ? selectFilesToBulkArchive(sources, current.createdTime) : []),
    [current, sources],
  );

  const candidatesByFolder = useMemo(() => {
    const counts = new Map<string, number>();
    for (const c of candidates) counts.set(c.sourceFolder, (counts.get(c.sourceFolder) ?? 0) + 1);
    return [...counts.entries()];
  }, [candidates]);

  const handleArchive = useCallback(async (): Promise<void> => {
    if (!current || candidates.length === 0) return;
    setArchiving(true);
    setConfirmOpen(false);
    try {
      const weekKey = parseWeekKey(current.name) ?? isoWeekKey(new Date(current.createdTime));
      const { ok, fail } = await onArchiveMany(candidates, weekKey);
      setResultMsg(fail > 0
        ? `${ok} ${plural(ok, 'archivé')}, ${fail} ${plural(fail, 'échec')} : actualisez pour vérifier.`
        : `${ok} audio ${plural(ok, 'archivé')} dans ${weekKey}.`);
    } finally {
      setArchiving(false);
    }
  }, [current, candidates, onArchiveMany]);

  if (syntheses === null) {
    return (
      <div className="mx-4 mt-4 p-4 rounded-xl bg-surface-2 border border-border-1 flex justify-center">
        <Spinner size={20} />
      </div>
    );
  }

  if (!current) {
    return (
      <div className="mx-4 mt-4 p-4 rounded-xl bg-surface-2 border border-border-1" style={{ ...CARD_TEXT, color: 'var(--text-3)' }}>
        {error ?? (online
          ? 'Aucune synthèse écrite trouvée dans PDF/Textes IA.'
          : 'Synthèses écrites indisponibles hors-ligne.')}
      </div>
    );
  }

  const text = texts.get(current.id);
  const isOldest = index >= syntheses.length - 1;
  const isNewest = index <= 0;

  return (
    <section aria-label="Synthèse hebdomadaire" className="mx-4 mt-4 rounded-xl bg-surface-2 border border-border-1 overflow-hidden">
      <div className="flex items-center justify-between px-2" style={{ minHeight: 48 }}>
        <IconButton label="Semaine précédente" size={36} onClick={() => goTo(Math.min(index + 1, syntheses.length - 1))} disabled={isOldest} style={{ color: isOldest ? 'var(--text-4)' : 'var(--text-1)', fontSize: 18 }}>
          ‹
        </IconButton>
        <button
          type="button"
          aria-expanded={expanded}
          onClick={() => setExpanded((e) => !e)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
        >
          <span style={{ fontFamily: 'var(--font-sans)', fontSize: 14, fontWeight: 600, color: 'var(--text-1)' }}>
            {synthesisLabel(current)}
          </span>
          <span style={{ color: 'var(--text-3)' }}>
            {expanded ? <ChevronUpIcon size={14} /> : <ChevronDownIcon size={14} />}
          </span>
        </button>
        <IconButton label="Semaine suivante" size={36} onClick={() => goTo(Math.max(index - 1, 0))} disabled={isNewest} style={{ color: isNewest ? 'var(--text-4)' : 'var(--text-1)', fontSize: 18 }}>
          ›
        </IconButton>
      </div>

      {expanded && (
        <div className="px-4 pb-3" style={{ maxHeight: '45vh', overflowY: 'auto' }}>
          {text === undefined ? (
            <div className="flex justify-center py-6"><Spinner size={20} /></div>
          ) : (
            renderMarkdownLite(text)
          )}
        </div>
      )}

      <div className="px-4 py-3 border-t border-border-1">
        {resultMsg ? (
          <p role="status" style={CARD_TEXT}>{resultMsg}</p>
        ) : confirmOpen ? (
          <div>
            <p style={{ ...CARD_TEXT, marginBottom: 8 }}>
              Archiver {candidates.length} audio {plural(candidates.length, 'antérieur')} à cette synthèse ?
            </p>
            <ul style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-3)', margin: '0 0 10px', paddingLeft: 16 }}>
              {candidatesByFolder.map(([folder, count]) => (
                <li key={folder}>{folder} : {count}</li>
              ))}
            </ul>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => void handleArchive()}
                className="px-3 py-2 rounded-lg"
                style={{ fontFamily: 'var(--font-sans)', fontSize: 13, fontWeight: 600, background: 'var(--accent)', color: 'var(--accent-text)', border: 'none', cursor: 'pointer' }}
              >
                Confirmer l'archivage
              </button>
              <button
                type="button"
                onClick={() => setConfirmOpen(false)}
                className="px-3 py-2 rounded-lg"
                style={{ fontFamily: 'var(--font-sans)', fontSize: 13, background: 'var(--surface-3)', color: 'var(--text-1)', border: 'none', cursor: 'pointer' }}
              >
                Annuler
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setConfirmOpen(true)}
            disabled={archiving || candidates.length === 0}
            aria-busy={archiving}
            className="flex items-center gap-2"
            style={{
              fontFamily: 'var(--font-sans)', fontSize: 13, fontWeight: 500,
              color: candidates.length === 0 ? 'var(--text-4)' : 'var(--accent)',
              background: 'none', border: 'none', cursor: candidates.length === 0 ? 'default' : 'pointer',
              padding: 0,
            }}
          >
            <ArchiveIcon size={16} />
            {archiving
              ? 'Archivage en cours…'
              : candidates.length === 0
                ? 'Aucun audio antérieur à archiver'
                : `Archiver les ${candidates.length} audio couverts par cette synthèse`}
          </button>
        )}
      </div>
    </section>
  );
}
