import type { SVGProps } from 'react';

type IconProps = SVGProps<SVGSVGElement> & { size?: number };

function Icon({ size = 24, strokeWidth = 1.75, ...props }: IconProps): React.JSX.Element {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" {...props} />;
}

export function PlayIcon(p: IconProps): React.JSX.Element {
  return <Icon {...p}><path d="M7 5v14l12-7z" fill="currentColor" stroke="none"/></Icon>;
}
export function PauseIcon(p: IconProps): React.JSX.Element {
  return <Icon {...p}><rect x="6.5" y="5" width="3.5" height="14" rx="0.6" fill="currentColor" stroke="none"/><rect x="14" y="5" width="3.5" height="14" rx="0.6" fill="currentColor" stroke="none"/></Icon>;
}
export function SkipBackIcon(p: IconProps): React.JSX.Element {
  return <Icon {...p}><polygon points="19 20 9 12 19 4 19 20" /><line x1="5" y1="19" x2="5" y2="5" /></Icon>;
}
export function SkipForwardIcon(p: IconProps): React.JSX.Element {
  return <Icon {...p}><polygon points="5 4 15 12 5 20 5 4" /><line x1="19" y1="5" x2="19" y2="19" /></Icon>;
}
export function DownloadIcon(p: IconProps): React.JSX.Element {
  return <Icon {...p}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></Icon>;
}
export function ArchiveIcon(p: IconProps): React.JSX.Element {
  return <Icon {...p}><polyline points="21 8 21 21 3 21 3 8" /><rect x="1" y="3" width="22" height="5" /><line x1="10" y1="12" x2="14" y2="12" /></Icon>;
}
export function SettingsIcon(p: IconProps): React.JSX.Element {
  return <Icon {...p}><circle cx="12" cy="12" r="2.6"/><path d="M19.4 14.4a1.6 1.6 0 0 0 .32 1.76l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.6 1.6 0 0 0-1.76-.32 1.6 1.6 0 0 0-.97 1.46V20a2 2 0 1 1-4 0v-.1a1.6 1.6 0 0 0-1.05-1.46 1.6 1.6 0 0 0-1.76.32l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.6 1.6 0 0 0 .32-1.76 1.6 1.6 0 0 0-1.46-.97H4a2 2 0 1 1 0-4h.1a1.6 1.6 0 0 0 1.46-1.05 1.6 1.6 0 0 0-.32-1.76l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.6 1.6 0 0 0 1.76.32H10a1.6 1.6 0 0 0 .97-1.46V4a2 2 0 1 1 4 0v.1a1.6 1.6 0 0 0 .97 1.46 1.6 1.6 0 0 0 1.76-.32l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.6 1.6 0 0 0-.32 1.76V10a1.6 1.6 0 0 0 1.46.97H20a2 2 0 1 1 0 4h-.1a1.6 1.6 0 0 0-1.46.97z"/></Icon>;
}
export function RefreshIcon(p: IconProps): React.JSX.Element {
  return <Icon {...p}><polyline points="23 4 23 10 17 10" /><polyline points="1 20 1 14 7 14" /><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" /></Icon>;
}
export function WifiOffIcon(p: IconProps): React.JSX.Element {
  return <Icon {...p}><line x1="1" y1="1" x2="23" y2="23" /><path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55" /><path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39" /><path d="M10.71 5.05A16 16 0 0 1 22.56 9" /><path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88" /><path d="M8.53 16.11a6 6 0 0 1 6.95 0" /><line x1="12" y1="20" x2="12.01" y2="20" /></Icon>;
}
export function ChevronUpIcon(p: IconProps): React.JSX.Element {
  return <Icon {...p}><polyline points="18 15 12 9 6 15" /></Icon>;
}
export function ChevronDownIcon(p: IconProps): React.JSX.Element {
  return <Icon {...p}><polyline points="6 9 12 15 18 9" /></Icon>;
}
export function XIcon(p: IconProps): React.JSX.Element {
  return <Icon {...p}><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></Icon>;
}
export function CheckIcon(p: IconProps): React.JSX.Element {
  return <Icon {...p}><polyline points="20 6 9 17 4 12" /></Icon>;
}
export function LogOutIcon(p: IconProps): React.JSX.Element {
  return <Icon {...p}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></Icon>;
}
export function BarChartIcon(p: IconProps): React.JSX.Element {
  return <Icon {...p}><line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" /></Icon>;
}
export function BookmarkIcon(p: IconProps): React.JSX.Element {
  return <Icon {...p}><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" /></Icon>;
}
export function SearchIcon(p: IconProps): React.JSX.Element {
  return <Icon {...p}><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></Icon>;
}
export function ListPlusIcon(p: IconProps): React.JSX.Element {
  return <Icon {...p}><line x1="3" y1="6" x2="15" y2="6" /><line x1="3" y1="12" x2="15" y2="12" /><line x1="3" y1="18" x2="9" y2="18" /><line x1="18" y1="14" x2="18" y2="22" /><line x1="14" y1="18" x2="22" y2="18" /></Icon>;
}
export function DotsVIcon(p: IconProps): React.JSX.Element {
  return <Icon {...p}><circle cx="12" cy="5" r="1.4" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1.4" fill="currentColor" stroke="none"/><circle cx="12" cy="19" r="1.4" fill="currentColor" stroke="none"/></Icon>;
}
export function SunIcon(p: IconProps): React.JSX.Element {
  return <Icon {...p}><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/></Icon>;
}
export function MoonIcon(p: IconProps): React.JSX.Element {
  return <Icon {...p}><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></Icon>;
}
export function GripVerticalIcon(p: IconProps): React.JSX.Element {
  return <Icon {...p}><circle cx="9" cy="6" r="1" fill="currentColor" stroke="none"/><circle cx="9" cy="12" r="1" fill="currentColor" stroke="none"/><circle cx="9" cy="18" r="1" fill="currentColor" stroke="none"/><circle cx="15" cy="6" r="1" fill="currentColor" stroke="none"/><circle cx="15" cy="12" r="1" fill="currentColor" stroke="none"/><circle cx="15" cy="18" r="1" fill="currentColor" stroke="none"/></Icon>;
}
