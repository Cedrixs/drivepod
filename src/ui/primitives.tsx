import type { CSSProperties, ReactNode, ButtonHTMLAttributes } from 'react';

// Briques d'interface partagées : auparavant chaque écran réécrivait son
// spinner, son état vide, son encart d'erreur et ses boutons d'icône.

export function Spinner({ size = 24 }: { size?: number }): React.JSX.Element {
  return (
    <div
      role="status"
      aria-label="Chargement"
      className="rounded-full animate-spin"
      style={{ width: size, height: size, border: '2px solid var(--surface-3)', borderTopColor: 'var(--accent)' }}
    />
  );
}

export function CenteredSpinner({ size = 24, padding = 64 }: { size?: number; padding?: number }): React.JSX.Element {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: `${padding}px 0` }}>
      <Spinner size={size} />
    </div>
  );
}

interface EmptyStateProps {
  title: string;
  hint?: string;
  action?: { label: string; onClick: () => void };
  padding?: number;
}

export function EmptyState({ title, hint, action, padding = 64 }: EmptyStateProps): React.JSX.Element {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: `${padding}px 24px`, gap: 8, textAlign: 'center' }}>
      <p style={{ fontFamily: 'var(--font-sans)', fontSize: 14, color: 'var(--text-3)', margin: 0 }}>{title}</p>
      {hint && <p style={{ fontFamily: 'var(--font-sans)', fontSize: 12, color: 'var(--text-4)', margin: 0 }}>{hint}</p>}
      {action && (
        <button
          onClick={action.onClick}
          className="hover:underline"
          style={{ marginTop: 8, fontFamily: 'var(--font-sans)', fontSize: 13, color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer' }}
        >
          {action.label}
        </button>
      )}
    </div>
  );
}

export function ErrorBox({ children }: { children: ReactNode }): React.JSX.Element {
  return (
    <div
      role="alert"
      className="mx-4 mt-4 p-3 rounded-xl text-sm"
      style={{
        background: 'oklch(from var(--danger) l c h / 0.12)',
        border: '1px solid oklch(from var(--danger) l c h / 0.4)',
        color: 'var(--danger)',
        fontFamily: 'var(--font-sans)',
      }}
    >
      {children}
    </div>
  );
}

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
  size?: number;
  active?: boolean;
}

// Bouton d'icône : zone tactile 44px, libellé accessible, couleur héritée par l'icône
export function IconButton({ label, size = 44, active = false, style, className = '', children, ...rest }: IconButtonProps): React.JSX.Element {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={`flex items-center justify-center transition-colors hover:text-text-1 ${className}`}
      style={{
        width: size, height: size, borderRadius: 10, flexShrink: 0,
        background: 'none', border: 'none', cursor: 'pointer',
        color: active ? 'var(--accent)' : 'var(--text-3)',
        ...style,
      }}
      {...rest}
    >
      {children}
    </button>
  );
}

interface PanelProps {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}

// Écran plein (player, réglages, recherche) : couvre l'app, centré à 640px sur desktop
export function FullscreenPanel({ children, className = '', style }: PanelProps): React.JSX.Element {
  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col lg:inset-y-0 lg:left-1/2 lg:right-auto lg:w-[640px] lg:-translate-x-1/2 ${className}`}
      style={{
        background: 'var(--bg)',
        paddingTop: 'env(safe-area-inset-top)',
        paddingBottom: 'env(safe-area-inset-bottom)',
        ...style,
      }}
    >
      {children}
    </div>
  );
}

interface PanelHeaderProps {
  title: ReactNode;
  onClose: () => void;
  closeLabel?: string;
  closeIcon: ReactNode;
  right?: ReactNode;
}

export function PanelHeader({ title, onClose, closeLabel = 'Fermer', closeIcon, right }: PanelHeaderProps): React.JSX.Element {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '8px 8px 8px 20px', minHeight: 52,
      borderBottom: '1px solid var(--border-1)',
      background: 'var(--surface-1)',
    }}>
      <h2 style={{ fontFamily: 'var(--font-sans)', fontSize: 18, fontWeight: 600, color: 'var(--text-1)', letterSpacing: '-0.01em', margin: 0 }}>
        {title}
      </h2>
      <div style={{ display: 'flex', alignItems: 'center' }}>
        {right}
        <IconButton label={closeLabel} onClick={onClose}>{closeIcon}</IconButton>
      </div>
    </div>
  );
}

export const PILL_STYLE = (active: boolean): CSSProperties => ({
  height: 30, padding: '0 10px', flexShrink: 0,
  borderRadius: 'var(--r-pill)',
  background: active ? 'var(--accent-soft)' : 'var(--surface-2)',
  border: `1px solid ${active ? 'var(--accent)' : 'var(--border-1)'}`,
  color: active ? 'var(--accent)' : 'var(--text-3)',
  cursor: 'pointer',
  fontFamily: 'var(--font-sans)', fontSize: 12, fontWeight: 500, whiteSpace: 'nowrap',
});
