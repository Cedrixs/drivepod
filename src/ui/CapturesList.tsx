import { useState, useEffect } from 'react';
import { XIcon } from './icons';
import { readNotesFile, type CapturedPassage } from '../state/captures';
import { formatTime, formatDateTime, stripMp3 } from '../lib/format';
import { FullscreenPanel, PanelHeader, CenteredSpinner, EmptyState, ErrorBox } from './primitives';

interface Props {
  audioFolderId: string;
  onClose: () => void;
}

export function CapturesList({ audioFolderId, onClose }: Props): React.JSX.Element {
  const [captures, setCaptures] = useState<CapturedPassage[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    readNotesFile(audioFolderId)
      .then((notes) => { if (!cancelled) setCaptures(notes?.captures.slice().reverse() ?? []); })
      .catch(() => { if (!cancelled) { setCaptures([]); setError('Impossible de charger les passages capturés.'); } });
    return () => { cancelled = true; };
  }, [audioFolderId]);

  return (
    <FullscreenPanel>
      <PanelHeader title="Passages capturés" onClose={onClose} closeIcon={<XIcon size={20} />} />

      <div className="flex-1 overflow-y-auto">
        {error && <ErrorBox>{error}</ErrorBox>}
        {captures === null ? (
          <CenteredSpinner />
        ) : captures.length === 0 && !error ? (
          <EmptyState title="Aucun passage capturé" hint="Appuyez sur le signet dans le lecteur pour capturer" />
        ) : (
          captures.map((c) => (
            <div key={c.id} style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-1)' }}>
              <p className="truncate" style={{ fontFamily: 'var(--font-sans)', fontSize: 14, fontWeight: 500, color: 'var(--text-1)', margin: 0 }}>
                {stripMp3(c.fileName)}
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '4px 0 8px', fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-3)' }}>
                {c.sourceFolder && (
                  <span style={{ color: 'var(--accent)', background: 'var(--accent-soft)', borderRadius: 4, padding: '2px 6px' }}>
                    {c.sourceFolder}
                  </span>
                )}
                <span>à {formatTime(c.audioPosition)}</span>
                <span style={{ color: 'var(--text-4)' }}>{formatDateTime(c.capturedAt)}</span>
              </div>
              {c.passage && (
                <p style={{ fontFamily: 'var(--font-sans)', fontSize: 13, lineHeight: 1.55, color: 'var(--text-2)', margin: 0 }}>
                  …{c.passage}…
                </p>
              )}
            </div>
          ))
        )}
      </div>
    </FullscreenPanel>
  );
}
