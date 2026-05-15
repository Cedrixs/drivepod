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
}

export function SourceTabs({ sources, activeIndex, onSelect, queueCount = 0, queueActive = false, onQueueSelect, statsActive = false, onStatsSelect }: Props): React.JSX.Element {
  if (sources.length === 0 && queueCount === 0) {
    return (
      <div className="flex overflow-x-auto scrollbar-none border-b border-white/10 bg-navy-800">
        <div className="px-4 py-2 text-navy-100/50 text-sm flex-1">
          Aucune source — ajoutez des MP3 dans Audio/ ou ses sous-dossiers sur Drive
        </div>
        <button
          onClick={onStatsSelect}
          className={`px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors flex-shrink-0 ${
            statsActive ? 'text-accent border-b-2 border-accent' : 'text-white/60 hover:text-white'
          }`}
        >
          Stats
        </button>
      </div>
    );
  }

  return (
    <div className="flex overflow-x-auto scrollbar-none border-b border-white/10 bg-navy-800">
      {sources.map((src, i) => (
        <button
          key={src.folder.id}
          onClick={() => onSelect(i)}
          className={`px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors flex-shrink-0 ${
            !queueActive && !statsActive && i === activeIndex
              ? 'text-accent border-b-2 border-accent'
              : 'text-white/60 hover:text-white'
          }`}
        >
          {src.folder.name}
          <span className="ml-2 text-xs text-white/30">{src.files.length}</span>
        </button>
      ))}
      {queueCount > 0 && (
        <button
          onClick={onQueueSelect}
          className={`px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors flex-shrink-0 ${
            queueActive
              ? 'text-accent border-b-2 border-accent'
              : 'text-white/60 hover:text-white'
          }`}
        >
          File
          <span className="ml-2 text-xs bg-accent/80 text-white rounded-full px-1.5 py-0.5">{queueCount}</span>
        </button>
      )}
      <button
        onClick={onStatsSelect}
        className={`px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors flex-shrink-0 ${
          statsActive ? 'text-accent border-b-2 border-accent' : 'text-white/60 hover:text-white'
        }`}
      >
        Stats
      </button>
    </div>
  );
}
