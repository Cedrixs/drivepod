import { XIcon, GripVerticalIcon, PlayIcon } from './icons';
import type { QueuedFile } from '../hooks/usePlayer';

interface Props {
  queue: QueuedFile[];
  currentFileId: string | null;
  onRemove: (index: number) => void;
  onClear: () => void;
  onPlayNow: (item: QueuedFile, index: number) => void;
}

export function QueueList({ queue, currentFileId: _currentFileId, onRemove, onClear, onPlayNow }: Props): React.JSX.Element {
  if (queue.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-white/40">
        <p className="text-sm">File d'attente vide</p>
        <p className="text-xs mt-2">Appuyez sur + dans la liste pour ajouter des fichiers</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between px-4 py-2 border-b border-white/10">
        <span className="text-xs text-white/40 uppercase tracking-wider">
          {queue.length} fichier{queue.length > 1 ? 's' : ''} en attente
        </span>
        <button
          onClick={onClear}
          className="text-xs text-red-400/70 hover:text-red-400 transition-colors"
        >
          Vider
        </button>
      </div>

      {queue.map((item, i) => {
        const title = item.file.name.replace(/\.mp3$/i, '');
        return (
          <div
            key={`${item.file.id}-${i}`}
            className="flex items-center gap-3 px-4 py-3 border-b border-white/5 hover:bg-white/5 transition-colors"
          >
            <GripVerticalIcon size={16} className="text-white/20 flex-shrink-0" />

            <div className="w-6 h-6 flex items-center justify-center flex-shrink-0">
              <span className="text-white/30 text-xs">{i + 1}</span>
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{title}</p>
              <p className="text-xs text-white/40 mt-0.5">{item.sourceFolder}</p>
            </div>

            <div className="flex items-center gap-1 flex-shrink-0">
              <button
                onClick={() => onPlayNow(item, i)}
                className="p-2 text-white/40 hover:text-accent transition-colors"
                title="Jouer maintenant"
              >
                <PlayIcon size={14} />
              </button>
              <button
                onClick={() => onRemove(i)}
                className="p-2 text-white/40 hover:text-white transition-colors"
                title="Retirer de la file"
              >
                <XIcon size={14} />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
