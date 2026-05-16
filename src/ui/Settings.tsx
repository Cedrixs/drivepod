import { useState, useEffect } from 'react';
import { XIcon, LogOutIcon, RefreshIcon, BookmarkIcon } from './icons';
import { getSettings, saveSettings } from '../state/db';
import { signOut } from '../auth/auth';
import { clearAudioCache, getCacheStats } from '../offline/cache';
import { initStateSync } from '../state/driveState';
import type { AppSettings } from '../drive/types';
import { DEFAULT_SETTINGS } from '../drive/types';

interface Props {
  onClose: () => void;
  audioFolderId: string | null;
  onResync: () => void;
  onSettingsChange?: (key: string, value: number | boolean) => void;
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

function PillGroup<T extends number | string>({
  options, value, onChange, fmt,
}: {
  options: readonly T[];
  value: T;
  onChange: (v: T) => void;
  fmt?: (v: T) => string;
}): React.JSX.Element {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
      {options.map((o) => (
        <button
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

function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }): React.JSX.Element {
  return (
    <button
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

export function Settings({ onClose, audioFolderId, onResync, onSettingsChange, onShowCaptures }: Props): React.JSX.Element {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [cacheStats, setCacheStats] = useState({ count: 0, totalSize: 0 });
  const [clearing, setClearing] = useState(false);
  const [resyncing, setResyncing] = useState(false);

  useEffect(() => {
    void getSettings().then(setSettings);
    void getCacheStats().then(setCacheStats);
  }, []);

  const updateSetting = async <K extends keyof AppSettings>(key: K, value: AppSettings[K]): Promise<void> => {
    const updated = { ...settings, [key]: value };
    setSettings(updated);
    await saveSettings(updated);
    onSettingsChange?.(key as string, value as number | boolean);
  };

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

  const formatBytes = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto lg:inset-y-0 lg:left-1/2 lg:right-auto lg:w-[640px] lg:-translate-x-1/2"
      style={{ background: 'var(--bg)', paddingTop: 'env(safe-area-inset-top)', paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '8px 8px 8px 20px', minHeight: 52,
        borderBottom: '1px solid var(--border-1)',
        background: 'var(--surface-1)',
      }}>
        <h2 style={{ fontFamily: 'var(--font-sans)', fontSize: 18, fontWeight: 600, color: 'var(--text-1)', letterSpacing: '-0.01em' }}>
          Réglages
        </h2>
        <button
          onClick={onClose}
          style={{ width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)', borderRadius: 10 }}
        >
          <XIcon size={20} />
        </button>
      </div>

      <div style={{ padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: 32 }}>

        {/* Lecture */}
        <section>
          <SectionLabel>Lecture</SectionLabel>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div>
              <p style={{ fontFamily: 'var(--font-sans)', fontSize: 13, color: 'var(--text-3)', marginBottom: 10 }}>Vitesse par défaut</p>
              <PillGroup
                options={[0.75, 1, 1.25, 1.5, 1.75, 2] as const}
                value={settings.defaultSpeed}
                onChange={(v) => void updateSetting('defaultSpeed', v)}
                fmt={(v) => `${v}x`}
              />
            </div>
            <div>
              <p style={{ fontFamily: 'var(--font-sans)', fontSize: 13, color: 'var(--text-3)', marginBottom: 10 }}>Saut (avant / arrière)</p>
              <PillGroup
                options={[15, 30] as const}
                value={settings.skipForwardSeconds}
                onChange={(v) => { void updateSetting('skipForwardSeconds', v); void updateSetting('skipBackwardSeconds', v); }}
                fmt={(v) => `${v}s`}
              />
            </div>
            <div>
              <p style={{ fontFamily: 'var(--font-sans)', fontSize: 13, color: 'var(--text-3)', marginBottom: 10 }}>
                Recul à la reprise{' '}
                <span style={{ color: 'var(--text-4)' }}>après pause &gt; 30 s</span>
              </p>
              <PillGroup
                options={[0, 5, 10, 15, 20] as const}
                value={settings.autoRewindSeconds}
                onChange={(v) => void updateSetting('autoRewindSeconds', v)}
                fmt={(v) => v === 0 ? 'Off' : `${v}s`}
              />
            </div>
          </div>
        </section>

        {/* Audio */}
        <section>
          <SectionLabel>Audio</SectionLabel>
          <Row
            label="Boost voix"
            sub="Compresseur — meilleure intelligibilité dans le bruit"
            right={<Toggle value={settings.voiceBoost} onChange={(v) => void updateSetting('voiceBoost', v)} />}
          />
        </section>

        {/* Hors-ligne */}
        <section>
          <SectionLabel>Hors-ligne</SectionLabel>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <Row
              label="Téléchargement auto"
              sub="5 fichiers les plus anciens"
              right={<Toggle value={settings.autoDownload} onChange={(v) => void updateSetting('autoDownload', v)} />}
            />
            <div style={{ background: 'var(--surface-1)', border: '1px solid var(--border-1)', borderRadius: 'var(--r-lg)', padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <p style={{ fontFamily: 'var(--font-sans)', fontSize: 13, color: 'var(--text-3)' }}>
                Cache : {cacheStats.count} fichier{cacheStats.count > 1 ? 's' : ''} ({formatBytes(cacheStats.totalSize)})
              </p>
              <button
                onClick={() => void handleClearCache()}
                disabled={clearing || cacheStats.count === 0}
                style={{ fontFamily: 'var(--font-sans)', fontSize: 13, fontWeight: 500, color: 'var(--danger)', background: 'none', border: 'none', cursor: 'pointer', opacity: (clearing || cacheStats.count === 0) ? 0.4 : 1 }}
              >
                {clearing ? 'Suppression…' : 'Vider'}
              </button>
            </div>
          </div>
        </section>

        {/* Sync */}
        <section>
          <SectionLabel>Synchronisation</SectionLabel>
          <button
            onClick={() => void handleResync()}
            disabled={resyncing || !audioFolderId}
            style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)', opacity: (resyncing || !audioFolderId) ? 0.4 : 1 }}
          >
            <RefreshIcon size={16} className={resyncing ? 'animate-spin' : ''} />
            <span style={{ fontFamily: 'var(--font-sans)', fontSize: 14 }}>{resyncing ? 'Synchronisation…' : 'Resynchroniser depuis Drive'}</span>
          </button>
        </section>

        {/* Captures */}
        {onShowCaptures && (
          <section>
            <button
              onClick={onShowCaptures}
              style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)' }}
            >
              <BookmarkIcon size={16} />
              <span style={{ fontFamily: 'var(--font-sans)', fontSize: 14 }}>Passages capturés</span>
            </button>
          </section>
        )}

        {/* Déconnexion */}
        <section style={{ paddingTop: 8, borderTop: '1px solid var(--border-1)' }}>
          <button
            onClick={() => void signOut()}
            style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--danger)' }}
          >
            <LogOutIcon size={16} />
            <span style={{ fontFamily: 'var(--font-sans)', fontSize: 14, fontWeight: 500 }}>Se déconnecter</span>
          </button>
        </section>
      </div>
    </div>
  );
}
