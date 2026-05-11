import { WifiOffIcon } from './icons';

interface Props {
  pendingCount: number;
}

export function OfflineBanner({ pendingCount }: Props): React.JSX.Element {
  return (
    <div className="bg-yellow-600 text-white text-sm px-4 py-2 flex items-center gap-2">
      <WifiOffIcon size={16} />
      <span>
        Mode hors-ligne
        {pendingCount > 0 && ` — ${pendingCount} action${pendingCount > 1 ? 's' : ''} en attente`}
      </span>
    </div>
  );
}
