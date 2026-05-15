import { useState, useEffect } from 'react';
import { XIcon } from './icons';
import { readNotesFile } from '../drive/api';
import type { CapturedPassage } from '../drive/api';

function formatTime(seconds: number): string {
  if (!isFinite(seconds) || seconds < 0) return '0:00';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${m}:${String(s).padStart(2, '0')}`;
}

function formatDate(ts: number): string {
  return new Date(ts).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

interface Props {
  audioFolderId: string;
  onClose: () => void;
}

export function CapturesList({ audioFolderId, onClose }: Props): React.JSX.Element {
  const [captures, setCaptures] = useState<CapturedPassage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void readNotesFile(audioFolderId).then((notes) => {
      setCaptures(notes?.captures.slice().reverse() ?? []);
      setLoading(false);
    });
  }, [audioFolderId]);

  return (
    <div
      className="fixed inset-0 bg-navy-900 z-50 flex flex-col"
      style={{ paddingTop: 'env(safe-area-inset-top)', paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-navy-800">
        <h2 className="text-base font-semibold text-white">Passages capturés</h2>
        <button onClick={onClose} className="p-2 text-white/60 hover:text-white">
          <XIcon size={20} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
          </div>
        ) : captures.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-white/40">
            <p className="text-sm">Aucun passage capturé</p>
            <p className="text-xs mt-2">Appuyez sur le signet dans le lecteur pour capturer</p>
          </div>
        ) : (
          captures.map((c) => (
            <div key={c.id} className="px-4 py-4 border-b border-white/5">
              <p className="text-sm font-medium text-white truncate">
                {c.fileName.replace(/\.mp3$/i, '')}
              </p>
              <div className="flex items-center gap-2 mt-0.5 mb-2">
                <span className="text-xs text-white/30 bg-white/5 rounded px-1.5 py-0.5">{c.sourceFolder}</span>
                <span className="text-xs text-white/30">à {formatTime(c.audioPosition)}</span>
                <span className="text-xs text-white/20">{formatDate(c.capturedAt)}</span>
              </div>
              {c.passage && (
                <p className="text-xs text-white/50 leading-relaxed">
                  …{c.passage}…
                </p>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
