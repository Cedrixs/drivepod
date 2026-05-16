import { GripVerticalIcon, PlayIcon, XIcon } from './icons';
import type { QueuedFile } from '../hooks/usePlayer';

interface Props {
  queue: QueuedFile[];
  currentFileId: string | null;
  onRemove: (index: number) => void;
  onClear: () => void;
  onPlayNow: (item: QueuedFile, index: number) => void;
}

function abbrev(name: string): string {
  return name.slice(0, 3).toUpperCase() + '.';
}

export function QueueList({ queue, currentFileId: _currentFileId, onRemove, onClear, onPlayNow }: Props): React.JSX.Element {
  if (queue.length === 0) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '64px 0', gap: 8 }}>
        <p style={{ fontFamily: 'var(--font-sans)', fontSize: 14, color: 'var(--text-3)' }}>File d'attente vide</p>
        <p style={{ fontFamily: 'var(--font-sans)', fontSize: 12, color: 'var(--text-4)' }}>Appuyez sur + dans la liste pour ajouter des fichiers</p>
      </div>
    );
  }

  return (
    <div>
      {/* Header bar */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '10px 16px',
        borderBottom: '1px solid var(--border-1)',
      }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 500, color: 'var(--text-3)', fontVariantNumeric: 'tabular-nums' }}>
          {queue.length} fichier{queue.length > 1 ? 's' : ''} en attente
        </span>
        <button
          onClick={onClear}
          style={{ fontFamily: 'var(--font-sans)', fontSize: 13, fontWeight: 500, color: 'var(--danger)', background: 'none', border: 'none', cursor: 'pointer' }}
        >
          Vider
        </button>
      </div>

      {queue.map((item, i) => {
        const title = item.file.name.replace(/\.mp3$/i, '');
        return (
          <div
            key={`${item.file.id}-${i}`}
            style={{
              display: 'grid', gridTemplateColumns: '20px 36px 1fr auto',
              alignItems: 'center', gap: 10,
              padding: '12px 16px',
              borderBottom: '1px solid var(--border-1)',
            }}
          >
            {/* Drag handle */}
            <GripVerticalIcon size={16} style={{ color: 'var(--text-4)' }} />

            {/* Number + source abbrev */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 500, color: 'var(--text-4)', fontVariantNumeric: 'tabular-nums' }}>
                {String(i + 1).padStart(2, '0')}
              </span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, fontWeight: 500, color: 'var(--accent)', letterSpacing: '0.04em' }}>
                {abbrev(item.sourceFolder)}
              </span>
            </div>

            {/* Title */}
            <div style={{ minWidth: 0 }}>
              <p style={{
                fontFamily: 'var(--font-sans)', fontSize: 14, fontWeight: 500,
                color: 'var(--text-1)', lineHeight: 1.3,
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>
                {title}
              </p>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <button
                onClick={() => onPlayNow(item, i)}
                style={{ width: 36, height: 36, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)' }}
                title="Jouer maintenant"
              >
                <PlayIcon size={15} />
              </button>
              <button
                onClick={() => onRemove(i)}
                style={{ width: 36, height: 36, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-4)' }}
                title="Retirer de la file"
              >
                <XIcon size={15} />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
