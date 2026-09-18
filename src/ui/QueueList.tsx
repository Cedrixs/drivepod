import { PlayIcon, XIcon } from './icons';
import { abbrev, stripMp3, plural } from '../lib/format';
import { EmptyState, IconButton } from './primitives';
import type { QueuedFile } from '../hooks/usePlayer';

interface Props {
  queue: QueuedFile[];
  onRemove: (index: number) => void;
  onClear: () => void;
  onPlayNow: (item: QueuedFile, index: number) => void;
}

export function QueueList({ queue, onRemove, onClear, onPlayNow }: Props): React.JSX.Element {
  if (queue.length === 0) {
    return (
      <EmptyState
        title="File d'attente vide"
        hint="Menu ⋮ d'un fichier puis « Ajouter à la file »"
      />
    );
  }

  return (
    <div>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '10px 16px',
        borderBottom: '1px solid var(--border-1)',
      }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 500, color: 'var(--text-3)', fontVariantNumeric: 'tabular-nums' }}>
          {queue.length} {plural(queue.length, 'fichier')} en attente
        </span>
        <button
          type="button"
          onClick={onClear}
          style={{ fontFamily: 'var(--font-sans)', fontSize: 13, fontWeight: 500, color: 'var(--danger)', background: 'none', border: 'none', cursor: 'pointer' }}
        >
          Vider
        </button>
      </div>

      {queue.map((item, i) => (
        <div
          key={`${item.file.id}-${i}`}
          style={{
            display: 'grid', gridTemplateColumns: '36px 1fr auto',
            alignItems: 'center', gap: 10,
            padding: '12px 16px',
            borderBottom: '1px solid var(--border-1)',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 500, color: 'var(--text-4)', fontVariantNumeric: 'tabular-nums' }}>
              {String(i + 1).padStart(2, '0')}
            </span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, fontWeight: 500, color: 'var(--accent)', letterSpacing: '0.04em' }}>
              {abbrev(item.sourceFolder)}
            </span>
          </div>

          <div style={{ minWidth: 0 }}>
            <p style={{
              fontFamily: 'var(--font-sans)', fontSize: 14, fontWeight: 500,
              color: 'var(--text-1)', lineHeight: 1.3,
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {stripMp3(item.file.name)}
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <IconButton label="Jouer maintenant" size={36} onClick={() => onPlayNow(item, i)}>
              <PlayIcon size={15} />
            </IconButton>
            <IconButton label="Retirer de la file" size={36} onClick={() => onRemove(i)} style={{ color: 'var(--text-4)' }}>
              <XIcon size={15} />
            </IconButton>
          </div>
        </div>
      ))}
    </div>
  );
}
