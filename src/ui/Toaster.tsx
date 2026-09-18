import { useSyncExternalStore } from 'react';
import { subscribeToasts, getToasts, dismissToast, type Toast, type ToastKind } from '../lib/toast';
import { CheckIcon, XIcon } from './icons';

interface Props {
  // Hauteur à laisser libre en bas (mini-player visible ou non)
  bottomOffset: number;
}

const KIND_COLOR: Record<ToastKind, string> = {
  info: 'var(--text-2)',
  success: 'var(--success)',
  error: 'var(--danger)',
};

function KindIcon({ kind }: { kind: ToastKind }): React.JSX.Element | null {
  if (kind === 'success') return <CheckIcon size={16} style={{ color: KIND_COLOR.success, flexShrink: 0 }} />;
  return null;
}

function ToastItem({ item }: { item: Toast }): React.JSX.Element {
  return (
    <div
      role={item.kind === 'error' ? 'alert' : 'status'}
      className="flex items-center border border-border-1"
      style={{
        gap: 10,
        padding: '10px 12px 10px 14px',
        borderRadius: 12,
        borderLeft: `3px solid ${KIND_COLOR[item.kind]}`,
        background: 'oklch(from var(--surface-2) l c h / 0.96)',
        backdropFilter: 'blur(16px) saturate(160%)',
        boxShadow: 'var(--shadow-2)',
        pointerEvents: 'auto',
      }}
    >
      <KindIcon kind={item.kind} />
      <p style={{ flex: 1, minWidth: 0, margin: 0, fontFamily: 'var(--font-sans)', fontSize: 13, lineHeight: 1.35, color: 'var(--text-1)' }}>
        {item.message}
      </p>
      {item.action && (
        <button
          type="button"
          onClick={() => { item.action?.onClick(); dismissToast(item.id); }}
          style={{
            flexShrink: 0, padding: '6px 10px', borderRadius: 'var(--r-pill)',
            background: 'var(--accent-soft)', color: 'var(--accent)', border: 'none', cursor: 'pointer',
            fontFamily: 'var(--font-sans)', fontSize: 12, fontWeight: 600,
          }}
        >
          {item.action.label}
        </button>
      )}
      <button
        type="button"
        aria-label="Fermer"
        onClick={() => dismissToast(item.id)}
        style={{ flexShrink: 0, width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-4)', borderRadius: 8 }}
      >
        <XIcon size={14} />
      </button>
    </div>
  );
}

export function Toaster({ bottomOffset }: Props): React.JSX.Element | null {
  const toasts = useSyncExternalStore(subscribeToasts, getToasts, getToasts);
  if (toasts.length === 0) return null;

  return (
    <div
      aria-live="polite"
      className="fixed z-[60] left-2 right-2 flex flex-col lg:left-1/2 lg:right-auto lg:w-[624px] lg:-translate-x-1/2"
      style={{ gap: 8, bottom: `calc(${bottomOffset}px + env(safe-area-inset-bottom))`, pointerEvents: 'none' }}
    >
      {toasts.map((t) => <ToastItem key={t.id} item={t} />)}
    </div>
  );
}
