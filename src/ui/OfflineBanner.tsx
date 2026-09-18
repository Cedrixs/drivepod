import { WifiOffIcon } from './icons';
import { plural } from '../lib/format';

interface Props {
  pendingCount: number;
}

export function OfflineBanner({ pendingCount }: Props): React.JSX.Element {
  return (
    <div
      role="status"
      className="text-sm px-4 py-2 flex items-center gap-2"
      style={{ background: 'var(--warning)', color: 'var(--accent-text)', fontFamily: 'var(--font-sans)', fontWeight: 500 }}
    >
      <WifiOffIcon size={16} />
      <span>
        Mode hors-ligne
        {pendingCount > 0 && ` · ${pendingCount} ${plural(pendingCount, 'action')} en attente`}
      </span>
    </div>
  );
}
