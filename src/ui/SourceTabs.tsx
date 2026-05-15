import type { Source } from '../hooks/useApp';

interface Props {
  sources: Source[];
  activeIndex: number;
  onSelect: (index: number) => void;
}

export function SourceTabs({ sources, activeIndex, onSelect }: Props): React.JSX.Element {
  if (sources.length === 0) {
    return (
      <div className="px-4 py-2 text-navy-100/50 text-sm">
        Aucune source — ajoutez des MP3 dans Audio/ ou ses sous-dossiers sur Drive
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
            i === activeIndex
              ? 'text-accent border-b-2 border-accent'
              : 'text-white/60 hover:text-white'
          }`}
        >
          {src.folder.name}
          <span className="ml-2 text-xs text-white/30">{src.files.length}</span>
        </button>
      ))}
    </div>
  );
}
