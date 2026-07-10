import { useState, useEffect, useCallback, useMemo } from 'react';
import { listSynthesisFiles, fetchFileText } from '../drive/api';
import {
  parseWeekKey, isoWeekKey, sortSynthesesDesc, selectFilesToBulkArchive,
  type BulkCandidate,
} from '../state/archiveRules';
import { ArchiveIcon, ChevronDownIcon, ChevronUpIcon } from './icons';
import type { Source } from '../hooks/useApp';
import type { DriveFile } from '../drive/types';

interface Props {
  sources: Source[];
  online: boolean;
  onArchiveMany: (items: BulkCandidate[], destWeekKey: string) => Promise<{ ok: number; fail: number }>;
}

// Rendu markdown minimal (titres, gras, paragraphes) — les synthèses sont de
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
    void (async () => {
      const text = await fetchFileText(current.id);
      if (!cancelled && text !== null) {
        setTexts((m) => new Map(m).set(current.id, text));
      }
    })();
    return () => { cancelled = true; };
  }, [current, texts]);

  const candidates = useMemo(() => {
    if (!current) return [];
    return selectFilesToBulkArchive(sources, current.createdTime);
  }, [current, sources]);

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
        ? `${ok} archivé(s), ${fail} échec(s) — actualisez pour vérifier.`
        : `${ok} audio archivé(s) dans ${weekKey}.`);
    } finally {
      setArchiving(false);
    }
  }, [current, candidates, onArchiveMany]);

  if (syntheses === null) {
    return (
      <div className="mx-4 mt-4 p-4 rounded-xl bg-surface-2 border border-border-1 flex justify-center">
        <div className="w-5 h-5 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!current) {
    return (
      <div className="mx-4 mt-4 p-4 rounded-xl bg-surface-2 border border-border-1"
        style={{ fontFamily: 'var(--font-sans)', fontSize: 13, color: 'var(--text-3)' }}>
        {error ?? (online
          ? 'Aucune synthèse écrite trouvée dans PDF/Textes IA.'
          : 'Synthèses écrites indisponibles hors-ligne.')}
      </div>
    );
  }

  const text = texts.get(current.id);

  return (
    <div className="mx-4 mt-4 rounded-xl bg-surface-2 border border-border-1 overflow-hidden">
      {/* Header : navigation entre semaines */}
      <div className="flex items-center justify-between px-4" style={{ minHeight: 48 }}>
        <button
          onClick={() => setIndex((i) => Math.min(i + 1, (syntheses.length - 1)))}
          disabled={index >= syntheses.length - 1}
          className="w-9 h-9 flex items-center justify-center"
          style={{ color: index >= syntheses.length - 1 ? 'var(--text-4)' : 'var(--text-1)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 18 }}
          title="Semaine précédente"
        >
          ‹
        </button>
        <button
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
        <button
          onClick={() => setIndex((i) => Math.max(i - 1, 0))}
          disabled={index <= 0}
          className="w-9 h-9 flex items-center justify-center"
          style={{ color: index <= 0 ? 'var(--text-4)' : 'var(--text-1)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 18 }}
          title="Semaine suivante"
        >
          ›
        </button>
      </div>

      {/* Texte de la synthèse */}
      {expanded && (
        <div className="px-4 pb-3" style={{ maxHeight: '45vh', overflowY: 'auto' }}>
          {text === undefined ? (
            <div className="flex justify-center py-6">
              <div className="w-5 h-5 border-2 border-accent border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            renderMarkdownLite(text)
          )}
        </div>
      )}

      {/* Archivage groupé */}
      <div className="px-4 py-3 border-t border-border-1">
        {resultMsg ? (
          <p style={{ fontFamily: 'var(--font-sans)', fontSize: 13, color: 'var(--text-2)', margin: 0 }}>
            {resultMsg}
          </p>
        ) : confirmOpen ? (
          <div>
            <p style={{ fontFamily: 'var(--font-sans)', fontSize: 13, color: 'var(--text-2)', margin: '0 0 8px' }}>
              Archiver {candidates.length} audio antérieur(s) à cette synthèse ?
            </p>
            <ul style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-3)', margin: '0 0 10px', paddingLeft: 16 }}>
              {candidatesByFolder.map(([folder, count]) => (
                <li key={folder}>{folder} : {count}</li>
              ))}
            </ul>
            <div className="flex gap-2">
              <button
                onClick={() => void handleArchive()}
                className="px-3 py-2 rounded-lg"
                style={{ fontFamily: 'var(--font-sans)', fontSize: 13, fontWeight: 600, background: 'var(--accent)', color: 'var(--surface-1)', border: 'none', cursor: 'pointer' }}
              >
                Confirmer l'archivage
              </button>
              <button
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
            onClick={() => setConfirmOpen(true)}
            disabled={archiving || candidates.length === 0}
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
    </div>
  );
}
