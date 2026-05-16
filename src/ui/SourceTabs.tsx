import type { Source } from '../hooks/useApp';

interface Props {
  sources: Source[];
  activeIndex: number;
  onSelect: (index: number) => void;
  queueCount?: number;
  queueActive?: boolean;
  onQueueSelect?: () => void;
  statsActive?: boolean;
  onStatsSelect?: () => void;
  activeRestTime?: string;
}

function Tab({
  label, count, subLabel, active, onClick,
}: {
  label: string;
  count?: number | string;
  subLabel?: string;
  active: boolean;
  onClick?: () => void;
}): React.JSX.Element {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '12px 4px 14px',
        display: 'flex', flexDirection: 'column', gap: 3,
        position: 'relative', flexShrink: 0,
        background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left',
      }}
    >
      <span style={{
        fontFamily: 'var(--font-sans)', fontSize: 16,
        fontWeight: active ? 600 : 500, lineHeight: 1.2,
        letterSpacing: '-0.01em',
        color: active ? 'var(--text-1)' : 'var(--text-3)',
        whiteSpace: 'nowrap',
      }}>
        {label}
      </span>
      {count !== undefined && (
        <span style={{
          fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 500,
          lineHeight: 1, fontVariantNumeric: 'tabular-nums',
          color: active ? 'var(--text-2)' : 'var(--text-3)',
        }}>
          {count}
        </span>
      )}
      {active && subLabel && (
        <span style={{
          fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 400,
          lineHeight: 1, color: 'var(--accent)', letterSpacing: '0.02em',
          whiteSpace: 'nowrap',
        }}>
          {subLabel} restantes
        </span>
      )}
      {active && (
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          height: 2, background: 'var(--accent)', borderRadius: '1px 1px 0 0',
        }} />
      )}
    </button>
  );
}

export function SourceTabs({
  sources, activeIndex, onSelect,
  queueCount = 0, queueActive = false, onQueueSelect,
  statsActive = false, onStatsSelect,
  activeRestTime,
}: Props): React.JSX.Element {
  return (
    <div
      style={{
        display: 'flex', gap: 24, padding: '0 16px',
        borderBottom: '1px solid var(--border-1)',
        background: 'var(--surface-1)',
        overflowX: 'auto',
      }}
    >
      {sources.length === 0 && queueCount === 0 ? (
        <div style={{
          flex: 1, padding: '12px 0',
          fontFamily: 'var(--font-sans)', fontSize: 13,
          color: 'var(--text-4)',
        }}>
          Créez des sous-dossiers dans Audio/ sur Drive
        </div>
      ) : (
        sources.map((src, i) => {
          const active = !queueActive && !statsActive && i === activeIndex;
          return (
            <Tab
              key={src.folder.id}
              label={src.folder.name}
              count={src.files.length}
              subLabel={active ? activeRestTime : undefined}
              active={active}
              onClick={() => onSelect(i)}
            />
          );
        })
      )}

      {queueCount > 0 && (
        <Tab
          label="File"
          count={queueCount}
          active={queueActive}
          onClick={onQueueSelect}
        />
      )}

      <Tab
        label="Stats"
        active={statsActive}
        onClick={onStatsSelect}
      />
    </div>
  );
}
