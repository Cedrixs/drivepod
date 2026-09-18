import { useState, useEffect, useRef, useCallback } from 'react';
import { XIcon, LogOutIcon, RefreshIcon, BookmarkIcon } from './icons';
import { getSettings, saveSettings } from '../state/db';
import { signOut } from '../auth/auth';
import { clearAudioCache, getCacheStats } from '../offline/cache';
import { initStateSync } from '../state/driveState';
import { formatBytes, plural } from '../lib/format';
import { FullscreenPanel, PanelHeader, CenteredSpinner } from './primitives';
import { PLAYBACK_SPEEDS, SKIP_OPTIONS, AUTO_REWIND_OPTIONS, type AppSettings } from '../drive/types';

interface Props {
  onClose: () => void;
  audioFolderId: string | null;
  onResync: () => void;
  onSettingsChange?: (patch: Partial<AppSettings>) => void;
  onShowCaptures?: () => void;
}

function SectionLabel({ children }: { children: React.ReactNode }): React.JSX.Element {
  return (
    <p style={{
      fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 500,
      color: 'var(--text-4)', letterSpacing: '0.1em', textTransform: 'uppercase',
      marginBottom: 12,
    }}>
      {children}
    </p>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }): React.JSX.Element {
  return (
    <p style={{ fontFamily: 'var(--font-sans)', fontSize: 13, color: 'var(--text-3)', marginBottom: 10 }}>
      {children}
    </p>
  );
}

function PillGroup<T extends number | string>({
  options, value, onChange, fmt, label,
}: {
  options: readonly T[];
  value: T;
  onChange: (v: T) => void;
  fmt?: (v: T) => string;
  label: string;
}): React.JSX.Element {
  return (
    <div role="radiogroup" aria-label={label} style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
      {options.map((o) => (
        <button
          type="button"
          role="radio"
          aria-checked={value === o}
          key={String(o)}
          onClick={() => onChange(o)}
          style={{
            height: 32, padding: '0 14px', borderRadius: 'var(--r-pill)',
            background: value === o ? 'var(--accent)' : 'var(--surface-2)',
            color: value === o ? 'var(--accent-text)' : 'var(--text-3)',
            border: 'none', cursor: 'pointer',
            fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 500,
          }}
        >
          {fmt ? fmt(o) : String(o)}
        </button>
      ))}
    </div>
  );
}

function Toggle({ value, onChange, label }: { value: boolean; onChange: (v: boolean) => void; label: string }): React.JSX.Element {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={value}
      aria-label={label}
      onClick={() => onChange(!value)}
      style={{
        width: 44, height: 24, borderRadius: 12, flexShrink: 0,
        background: value ? 'var(--accent)' : 'var(--surface-3)',
        border: 'none', cursor: 'pointer', position: 'relative',
        transition: 'background 140ms',
      }}
    >
      <span style={{
        position: 'absolute', top: 2,
        left: value ? 22 : 2,
        width: 20, height: 20, borderRadius: 10,
        background: value ? 'var(--accent-text)' : 'var(--text-2)',
        transition: 'left 140ms',
      }} />
    </button>
  );
}

function Row({ label, sub, right }: { label: string; sub?: string; right: React.ReactNode }): React.JSX.Element {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
      <div>
        <p style={{ fontFamily: 'var(--font-sans)', fontSize: 14, fontWeight: 500, color: 'var(--text-1)' }}>{label}</p>
        {sub && <p style={{ fontFamily: 'var(--font-sans)', fontSize: 12, color: 'var(--text-4)', marginTop: 2 }}>{sub}</p>}
      </div>
      {right}
    </div>
  );
}

function TextButton({ onClick, disabled, icon, children, danger = false, busy = false }: {
  onClick: () => void; disabled?: boolean; icon: React.ReactNode; children: React.ReactNode; danger?: boolean; busy?: boolean;
}): React.JSX.Element {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-busy={busy}
      style={{
        display: 'flex', alignItems: 'center', gap: 8, padding: 0,
        background: 'none', border: 'none', cursor: disabled ? 'default' : 'pointer',
        color: danger ? 'var(--danger)' : 'var(--text-3)', opacity: disabled ? 0.4 : 1,
        fontFamily: 'var(--font-sans)', fontSize: 14, fontWeight: danger ? 500 : 400,
      }}
    >
      {icon}
      <span>{children}</span>
    </button>
  );
}

export function Settings({ onClose, audioFolderId, onResync, onSettingsChange, onShowCaptures }: Props): React.JSX.Element {
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const settingsRef = useRef<AppSettings | null>(null);
  const [cacheStats, setCacheStats] = useState({ count: 0, totalSize: 0 });
  const [clearing, setClearing] = useState(false);
  const [resyncing, setResyncing] = useState(false);

  useEffect(() => {
    void getSettings().then((s) => { settingsRef.current = s; setSettings(s); });
    void getCacheStats().then(setCacheStats);
  }, []);

  // Patch atomique : deux modifications rapprochées (saut avant + arrière)
  // partent du dernier état connu, pas d'une closure périmée
  const update = useCallback((patch: Partial<AppSettings>): void => {
    if (!settingsRef.current) return;
    const next = { ...settingsRef.current, ...patch };
    settingsRef.current = next;
    setSettings(next);
    void saveSettings(next);
    onSettingsChange?.(patch);
  }, [onSettingsChange]);

  const handleClearCache = async (): Promise<void> => {
    setClearing(true);
    try {
      await clearAudioCache();
      setCacheStats({ count: 0, totalSize: 0 });
    } finally {
      setClearing(false);
    }
  };

  const handleResync = async (): Promise<void> => {
    if (!audioFolderId) return;
    setResyncing(true);
    try {
      await initStateSync(audioFolderId);
      onResync();
    } finally {
      setResyncing(false);
    }
  };

  return (
    <FullscreenPanel className="overflow-y-auto">
      <PanelHeader title="Réglages" onClose={onClose} closeIcon={<XIcon size={20} />} />

      {settings === null ? (
        <CenteredSpinner />
      ) : (
        <div style={{ padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: 32 }}>

          <section>
            <SectionLabel>Lecture</SectionLabel>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div>
                <FieldLabel>Vitesse par défaut</FieldLabel>
                <PillGroup
                  label="Vitesse par défaut"
                  options={PLAYBACK_SPEEDS}
                  value={settings.defaultSpeed}
                  onChange={(v) => update({ defaultSpeed: v })}
                  fmt={(v) => `${v}x`}
                />
              </div>
              <div>
                <FieldLabel>Saut (avant / arrière)</FieldLabel>
                <PillGroup
                  label="Durée des sauts"
                  options={SKIP_OPTIONS}
                  value={settings.skipForwardSeconds}
                  onChange={(v) => update({ skipForwardSeconds: v, skipBackwardSeconds: v })}
                  fmt={(v) => `${v}s`}
                />
              </div>
              <div>
                <FieldLabel>
                  Recul à la reprise{' '}
                  <span style={{ color: 'var(--text-4)' }}>après pause &gt; 30 s</span>
                </FieldLabel>
                <PillGroup
                  label="Recul à la reprise"
                  options={AUTO_REWIND_OPTIONS}
                  value={settings.autoRewindSeconds}
                  onChange={(v) => update({ autoRewindSeconds: v })}
                  fmt={(v) => v === 0 ? 'Off' : `${v}s`}
                />
              </div>
            </div>
          </section>

          <section>
            <SectionLabel>Audio</SectionLabel>
            <Row
              label="Boost voix"
              sub="Compresseur : meilleure intelligibilité dans le bruit"
              right={<Toggle label="Boost voix" value={settings.voiceBoost} onChange={(v) => update({ voiceBoost: v })} />}
            />
          </section>

          <section>
            <SectionLabel>Hors-ligne</SectionLabel>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <Row
                label="Téléchargement auto"
                sub={`${settings.autoDownloadCount} fichiers les plus anciens par dossier`}
                right={<Toggle label="Téléchargement automatique" value={settings.autoDownload} onChange={(v) => update({ autoDownload: v })} />}
              />
              <div style={{ background: 'var(--surface-1)', border: '1px solid var(--border-1)', borderRadius: 'var(--r-lg)', padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <p style={{ fontFamily: 'var(--font-sans)', fontSize: 13, color: 'var(--text-3)' }}>
                  Cache : {cacheStats.count} {plural(cacheStats.count, 'fichier')} ({formatBytes(cacheStats.totalSize)})
                </p>
                <button
                  type="button"
                  onClick={() => void handleClearCache()}
                  disabled={clearing || cacheStats.count === 0}
                  style={{ fontFamily: 'var(--font-sans)', fontSize: 13, fontWeight: 500, color: 'var(--danger)', background: 'none', border: 'none', cursor: 'pointer', opacity: (clearing || cacheStats.count === 0) ? 0.4 : 1 }}
                >
                  {clearing ? 'Suppression…' : 'Vider'}
                </button>
              </div>
            </div>
          </section>

          <section>
            <SectionLabel>Synchronisation</SectionLabel>
            <TextButton
              onClick={() => void handleResync()}
              disabled={resyncing || !audioFolderId}
              busy={resyncing}
              icon={<RefreshIcon size={16} className={resyncing ? 'animate-spin' : ''} />}
            >
              {resyncing ? 'Synchronisation…' : 'Resynchroniser depuis Drive'}
            </TextButton>
          </section>

          {onShowCaptures && (
            <section>
              <TextButton onClick={onShowCaptures} icon={<BookmarkIcon size={16} />}>
                Passages capturés
              </TextButton>
            </section>
          )}

          <section style={{ paddingTop: 8, borderTop: '1px solid var(--border-1)' }}>
            <TextButton onClick={() => void signOut()} icon={<LogOutIcon size={16} />} danger>
              Se déconnecter
            </TextButton>
          </section>
        </div>
      )}
    </FullscreenPanel>
  );
}
