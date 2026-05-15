import { useState, useEffect } from 'react';
import { XIcon, LogOutIcon, RefreshIcon } from './icons';
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
}

export function Settings({ onClose, audioFolderId, onResync, onSettingsChange }: Props): React.JSX.Element {
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
    if (typeof value === 'number' || typeof value === 'boolean') {
      onSettingsChange?.(key, value);
    }
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
      className="fixed inset-0 bg-navy-900 z-50 overflow-y-auto"
      style={{ paddingTop: 'env(safe-area-inset-top)', paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
        <h2 className="text-lg font-semibold text-white">Réglages</h2>
        <button onClick={onClose} className="p-2 text-white/60 hover:text-white">
          <XIcon size={20} />
        </button>
      </div>

      <div className="px-4 py-6 space-y-6">
        {/* Playback */}
        <section>
          <h3 className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-3">Lecture</h3>
          <div className="space-y-4">
            <div>
              <label className="text-sm text-white/80 block mb-2">Vitesse par défaut</label>
              <div className="flex gap-2 flex-wrap">
                {([0.75, 1, 1.25, 1.5, 1.75, 2] as const).map((s) => (
                  <button
                    key={s}
                    onClick={() => void updateSetting('defaultSpeed', s)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      settings.defaultSpeed === s
                        ? 'bg-accent text-white'
                        : 'bg-white/10 text-white/60 hover:bg-white/20'
                    }`}
                  >
                    {s}x
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-sm text-white/80 block mb-2">Saut (avant/arrière)</label>
              <div className="flex gap-2">
                {([15, 30] as const).map((s) => (
                  <button
                    key={s}
                    onClick={() => { void updateSetting('skipForwardSeconds', s); void updateSetting('skipBackwardSeconds', s); }}
                    className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      settings.skipForwardSeconds === s
                        ? 'bg-accent text-white'
                        : 'bg-white/10 text-white/60 hover:bg-white/20'
                    }`}
                  >
                    {s}s
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-sm text-white/80 block mb-2">
                Recul à la reprise
                <span className="ml-2 text-xs text-white/40">après pause &gt; 30 s</span>
              </label>
              <div className="flex gap-2 flex-wrap">
                {([0, 5, 10, 15, 20] as const).map((s) => (
                  <button
                    key={s}
                    onClick={() => void updateSetting('autoRewindSeconds', s)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      settings.autoRewindSeconds === s
                        ? 'bg-accent text-white'
                        : 'bg-white/10 text-white/60 hover:bg-white/20'
                    }`}
                  >
                    {s === 0 ? 'Off' : `${s}s`}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Offline */}
        <section>
          <h3 className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-3">Hors-ligne</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-sm text-white/80">Téléchargement auto (5 plus anciens)</label>
              <button
                onClick={() => void updateSetting('autoDownload', !settings.autoDownload)}
                className={`w-12 h-6 rounded-full transition-colors ${
                  settings.autoDownload ? 'bg-accent' : 'bg-white/20'
                } relative`}
              >
                <span
                  className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${
                    settings.autoDownload ? 'left-6' : 'left-0.5'
                  }`}
                />
              </button>
            </div>

            <div className="bg-white/5 rounded-xl p-4">
              <p className="text-sm text-white/60 mb-3">
                Cache : {cacheStats.count} fichier{cacheStats.count > 1 ? 's' : ''} ({formatBytes(cacheStats.totalSize)})
              </p>
              <button
                onClick={() => void handleClearCache()}
                disabled={clearing || cacheStats.count === 0}
                className="text-sm text-red-400 hover:text-red-300 transition-colors disabled:opacity-50"
              >
                {clearing ? 'Suppression...' : 'Vider le cache hors-ligne'}
              </button>
            </div>
          </div>
        </section>

        {/* Sync */}
        <section>
          <h3 className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-3">Synchronisation</h3>
          <button
            onClick={() => void handleResync()}
            disabled={resyncing || !audioFolderId}
            className="flex items-center gap-2 text-sm text-white/60 hover:text-white transition-colors disabled:opacity-50"
          >
            <RefreshIcon size={16} className={resyncing ? 'animate-spin' : ''} />
            {resyncing ? 'Synchronisation...' : 'Resynchroniser depuis Drive'}
          </button>
        </section>

        {/* Account */}
        <section className="pt-4 border-t border-white/10">
          <button
            onClick={() => void signOut()}
            className="flex items-center gap-2 text-sm text-red-400 hover:text-red-300 transition-colors"
          >
            <LogOutIcon size={16} />
            Se déconnecter
          </button>
        </section>
      </div>
    </div>
  );
}
