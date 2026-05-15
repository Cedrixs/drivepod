// DrivePod — shared icon set + small primitives
// All icons: 24×24 viewBox, currentColor, stroke 1.75 — calm, studious feel.

const Icon = ({ name, size = 22, stroke = 1.75, style = {} }) => {
  const p = paths[name];
  if (!p) return null;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth={stroke}
      strokeLinecap="round" strokeLinejoin="round"
      style={{ display: 'block', flexShrink: 0, ...style }}
      dangerouslySetInnerHTML={{ __html: p }} />
  );
};

const paths = {
  search:    '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
  settings:  '<circle cx="12" cy="12" r="2.6"/><path d="M19.4 14.4a1.6 1.6 0 0 0 .32 1.76l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.6 1.6 0 0 0-1.76-.32 1.6 1.6 0 0 0-.97 1.46V20a2 2 0 1 1-4 0v-.1a1.6 1.6 0 0 0-1.05-1.46 1.6 1.6 0 0 0-1.76.32l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.6 1.6 0 0 0 .32-1.76 1.6 1.6 0 0 0-1.46-.97H4a2 2 0 1 1 0-4h.1a1.6 1.6 0 0 0 1.46-1.05 1.6 1.6 0 0 0-.32-1.76l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.6 1.6 0 0 0 1.76.32H10a1.6 1.6 0 0 0 .97-1.46V4a2 2 0 1 1 4 0v.1a1.6 1.6 0 0 0 .97 1.46 1.6 1.6 0 0 0 1.76-.32l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.6 1.6 0 0 0-.32 1.76V10a1.6 1.6 0 0 0 1.46.97H20a2 2 0 1 1 0 4h-.1a1.6 1.6 0 0 0-1.46.97z"/>',
  play:      '<path d="M7 5v14l12-7z" fill="currentColor" stroke="none"/>',
  pause:     '<rect x="6.5" y="5" width="3.5" height="14" rx="0.6" fill="currentColor" stroke="none"/><rect x="14" y="5" width="3.5" height="14" rx="0.6" fill="currentColor" stroke="none"/>',
  prev:      '<path d="M6 5v14M19 5 9 12l10 7z" fill="currentColor" stroke="currentColor" strokeLinejoin="round"/>',
  next:      '<path d="M18 5v14M5 5l10 7L5 19z" fill="currentColor" stroke="currentColor" strokeLinejoin="round"/>',
  skipBack:  '<path d="M3 12a9 9 0 1 0 3-6.7"/><path d="M3 4v5h5"/><text x="12" y="15" text-anchor="middle" font-family="IBM Plex Mono" font-size="7" font-weight="600" fill="currentColor" stroke="none">15</text>',
  skipFwd:   '<path d="M21 12a9 9 0 1 1-3-6.7"/><path d="M21 4v5h-5"/><text x="12" y="15" text-anchor="middle" font-family="IBM Plex Mono" font-size="7" font-weight="600" fill="currentColor" stroke="none">15</text>',
  close:     '<path d="M6 6l12 12M18 6 6 18"/>',
  chevDown:  '<path d="m6 9 6 6 6-6"/>',
  chevUp:    '<path d="m6 15 6-6 6 6"/>',
  chevRight: '<path d="m9 6 6 6-6 6"/>',
  chevLeft:  '<path d="m15 6-6 6 6 6"/>',
  check:     '<path d="M4 12.5 9 17 20 6"/>',
  download:  '<path d="M12 4v12M6 12l6 6 6-6M5 20h14"/>',
  downloaded:'<path d="M12 3v10M7 9l5 5 5-5"/><rect x="4" y="16" width="16" height="4" rx="1.5"/><path d="M9 18.2 11 20l4-4" stroke="white" stroke-width="1.6"/>',
  dots:      '<circle cx="5" cy="12" r="1.4" fill="currentColor"/><circle cx="12" cy="12" r="1.4" fill="currentColor"/><circle cx="19" cy="12" r="1.4" fill="currentColor"/>',
  dotsV:     '<circle cx="12" cy="5" r="1.4" fill="currentColor"/><circle cx="12" cy="12" r="1.4" fill="currentColor"/><circle cx="12" cy="19" r="1.4" fill="currentColor"/>',
  queue:     '<path d="M4 6h13M4 12h13M4 18h9"/><path d="M19 15v6M22 18h-6"/>',
  bookmark:  '<path d="M6 4h12v17l-6-4-6 4z"/>',
  bookmarkPlus: '<path d="M6 4h12v17l-6-4-6 4z"/><path d="M12 8v6M9 11h6" stroke-width="1.4"/>',
  bolt:      '<path d="M13 2 3 14h8l-1 8 10-12h-8z" fill="currentColor" stroke="none"/>',
  boltO:     '<path d="M13 2 3 14h8l-1 8 10-12h-8z"/>',
  archive:   '<rect x="3" y="4" width="18" height="4" rx="1"/><path d="M5 8v11a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V8M10 12h4"/>',
  doc:       '<path d="M7 3h7l5 5v12a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z"/><path d="M14 3v5h5"/><path d="M9 13h6M9 16h6M9 19h4"/>',
  google:    '<path d="M21.35 11.1H12v3.8h5.35c-.4 2-2.05 3.5-5.35 3.5a5.9 5.9 0 1 1 0-11.8c1.5 0 2.85.55 3.9 1.5L18.6 5.5A9.4 9.4 0 0 0 12 3a9 9 0 1 0 0 18c5.2 0 8.65-3.65 8.65-8.8 0-.7-.1-1.4-.3-2.1z" fill="currentColor" stroke="none"/>',
  speed:     '<path d="M12 3a9 9 0 1 0 9 9"/><path d="m12 12 5-3"/><circle cx="12" cy="12" r="1" fill="currentColor" stroke="none"/>',
  wifi:      '<path d="M2 8.5a15 15 0 0 1 20 0M5 12a10 10 0 0 1 14 0M8.5 15.5a5 5 0 0 1 7 0"/><circle cx="12" cy="19" r="1" fill="currentColor" stroke="none"/>',
  wifiOff:   '<path d="M2 8.5a15 15 0 0 1 6.5-3.8M22 8.5a15 15 0 0 0-7-4"/><path d="M5 12a10 10 0 0 1 4-2.7M19 12a10 10 0 0 0-3-2.2"/><circle cx="12" cy="19" r="1" fill="currentColor" stroke="none"/><path d="M2 2l20 20"/>',
  flame:     '<path d="M12 3s4 4 4 8a4 4 0 0 1-8 0c0-1.5.5-2.5 1-3-.5 1 .5 2 1 1 .5-1-.5-2-.5-3.5C9.5 3.5 12 3 12 3z" fill="currentColor" stroke="none"/><path d="M12 21a6 6 0 0 0 6-6c0-2-1-3.5-2-4.5.5 1.5-.5 3-1.5 3-1 0-1-1.5-1-2.5-1 1.5-3.5 2-3.5 5a2 2 0 0 0 2 2c-1 1-2 1-2 3z" fill="currentColor" stroke="none" opacity=".55"/>',
  sort:      '<path d="M7 4v16M3 8l4-4 4 4M17 20V4M13 16l4 4 4-4"/>',
  filter:    '<path d="M4 5h16l-6 8v6l-4-2v-4z"/>',
  rotate:    '<path d="M3 12a9 9 0 0 1 15.5-6.2L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-15.5 6.2L3 16"/><path d="M3 21v-5h5"/>',
  logout:    '<path d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3"/><path d="m10 17-5-5 5-5M5 12h11"/>',
  user:      '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
  back:      '<path d="M19 12H5M12 19l-7-7 7-7"/>',
  add:       '<path d="M12 5v14M5 12h14"/>',
  trash:     '<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-13M9 7V4h6v3"/>',
  bell:      '<path d="M6 8a6 6 0 0 1 12 0c0 7 3 7 3 9H3c0-2 3-2 3-9z"/><path d="M10 21a2 2 0 0 0 4 0"/>',
  drag:      '<circle cx="9" cy="6" r="1.3" fill="currentColor"/><circle cx="15" cy="6" r="1.3" fill="currentColor"/><circle cx="9" cy="12" r="1.3" fill="currentColor"/><circle cx="15" cy="12" r="1.3" fill="currentColor"/><circle cx="9" cy="18" r="1.3" fill="currentColor"/><circle cx="15" cy="18" r="1.3" fill="currentColor"/>',
  expand:    '<path d="M4 9V4h5M15 4h5v5M20 15v5h-5M9 20H4v-5"/>',
  collapse:  '<path d="M9 4v5H4M15 9V4h5M4 15h5v5M15 20v-5h5"/>',
  info:      '<circle cx="12" cy="12" r="9"/><path d="M12 8v.01M12 11v5"/>',
  ai:        '<path d="M12 3 14 8l5 2-5 2-2 5-2-5-5-2 5-2z" fill="currentColor" stroke="none" opacity=".9"/><circle cx="19" cy="5" r="1.2" fill="currentColor" stroke="none"/><circle cx="5" cy="19" r="0.8" fill="currentColor" stroke="none"/>',
  cloud:     '<path d="M7 18a4 4 0 0 1-.5-7.95A6 6 0 0 1 18 9.5c2 .2 3 1.8 3 3.5a4 4 0 0 1-4 4z"/>',
  trending:  '<path d="M3 17 9 11l4 4 8-8M14 5h7v7"/>',
  clock:     '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/>',
};

// Logo placeholder — 88×88 rounded square with LOGO mono text
const Logo = ({ size = 88, label = 'LOGO' }) => (
  <div className="dp-logo" style={{ width: size, height: size, borderRadius: size * 0.20 }}>
    {label}
  </div>
);

// PWA status bar (clock left, signal/battery right)
const StatusBar = ({ dark = false }) => (
  <div className="dp-status">
    <span>9:41</span>
    <div className="dp-status-right">
      <svg width="17" height="11" viewBox="0 0 17 11" fill="currentColor"><rect y="6" width="3" height="5" rx="0.5"/><rect x="4.5" y="4" width="3" height="7" rx="0.5"/><rect x="9" y="2" width="3" height="9" rx="0.5"/><rect x="13.5" y="0" width="3" height="11" rx="0.5"/></svg>
      <svg width="15" height="11" viewBox="0 0 15 11" fill="none" stroke="currentColor" strokeWidth="1.2"><path d="M7.5 3a6 6 0 0 1 4 1.5l1-1A8 8 0 0 0 7.5 1 8 8 0 0 0 2 3.5l1 1A6 6 0 0 1 7.5 3z" fill="currentColor"/><path d="M7.5 6a3 3 0 0 1 2 .8L10.5 6A4.5 4.5 0 0 0 7.5 5 4.5 4.5 0 0 0 4.5 6l1 .8A3 3 0 0 1 7.5 6z" fill="currentColor"/><circle cx="7.5" cy="9" r="1" fill="currentColor"/></svg>
      <svg width="24" height="12" viewBox="0 0 24 12" fill="none" stroke="currentColor" strokeWidth="1"><rect x="0.5" y="0.5" width="21" height="11" rx="2.5"/><rect x="2" y="2" width="16" height="8" rx="1.2" fill="currentColor"/><rect x="22" y="4" width="1.5" height="4" rx="0.4" fill="currentColor"/></svg>
    </div>
  </div>
);

// Home indicator (PWA bottom hint)
const HomeInd = () => <div className="dp-home-ind"></div>;

// Phone frame wrapper
const Phone = ({ children, theme = 'dark', style = {} }) => (
  <div className={`dp dp-${theme}`} style={{ width: 375, height: 812, position: 'relative', background: 'var(--bg)', overflow: 'hidden', ...style }}>
    {children}
  </div>
);

// Desktop frame
const Desktop = ({ children, theme = 'dark', width = 1440, height = 900 }) => (
  <div className={`dp dp-${theme}`} style={{ width, height, background: 'var(--bg)', overflow: 'hidden', position: 'relative', display: 'flex' }}>
    {children}
  </div>
);

Object.assign(window, { Icon, Logo, StatusBar, HomeInd, Phone, Desktop });
