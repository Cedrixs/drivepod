// DrivePod — Dashboard & Settings

const Metric = ({ label, value, unit, icon, accent }) => (
  <div className="dp-card" style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 8, minWidth: 0 }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-3)' }}>
      {icon && <Icon name={icon} size={13} />}
      <span style={{ font: '500 11px/1 var(--font-sans)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</span>
    </div>
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
      <span style={{ font: '600 28px/1 var(--font-sans)', color: accent ? 'var(--accent)' : 'var(--text-1)', letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums' }}>{value}</span>
      {unit && <span style={{ font: '500 12px/1 var(--font-mono)', color: 'var(--text-3)' }}>{unit}</span>}
    </div>
  </div>
);

const DashboardScreen = ({ theme = 'dark' }) => {
  // 7-day mini chart data
  const days = [42, 28, 67, 51, 73, 38, 54];
  const max = Math.max(...days);
  // Donut: 4 segments
  const segments = [
    { label: 'Articles', value: 38, color: 'var(--accent)' },
    { label: 'Books',    value: 28, color: 'oklch(from var(--accent) calc(l - 0.10) c calc(h + 30))' },
    { label: 'Papers',   value: 22, color: 'oklch(from var(--accent) calc(l - 0.20) c calc(h + 60))' },
    { label: 'Notes',    value: 12, color: 'var(--surface-3)' },
  ];
  const total = segments.reduce((s, x) => s + x.value, 0);
  let acc = 0;
  const arcs = segments.map((s) => {
    const start = (acc / total) * Math.PI * 2;
    acc += s.value;
    const end = (acc / total) * Math.PI * 2;
    return { ...s, start, end };
  });
  const polar = (r, a) => [50 + r * Math.cos(a - Math.PI / 2), 50 + r * Math.sin(a - Math.PI / 2)];
  const arc = (a) => {
    const [x1, y1] = polar(40, a.start);
    const [x2, y2] = polar(40, a.end);
    const [x3, y3] = polar(28, a.end);
    const [x4, y4] = polar(28, a.start);
    const large = a.end - a.start > Math.PI ? 1 : 0;
    return `M ${x1} ${y1} A 40 40 0 ${large} 1 ${x2} ${y2} L ${x3} ${y3} A 28 28 0 ${large} 0 ${x4} ${y4} Z`;
  };

  return (
    <Phone theme={theme}>
      <StatusBar />
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 16px 8px' }}>
        <button className="dp-icon-btn"><Icon name="chevLeft" /></button>
        <span style={{ font: '600 16px/1 var(--font-sans)' }}>Tableau de bord</span>
        <button className="dp-icon-btn"><Icon name="settings" /></button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px 80px' }}>
        {/* Big metric */}
        <div className="dp-card" style={{ padding: 20, marginBottom: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-3)' }}>
            <Icon name="clock" size={13} />
            <span style={{ font: '500 11px/1 var(--font-sans)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Aujourd'hui</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginTop: 2 }}>
            <span style={{ font: '600 44px/1 var(--font-sans)', color: 'var(--text-1)', letterSpacing: '-0.03em', fontVariantNumeric: 'tabular-nums' }}>1h 23</span>
            <span style={{ font: '500 13px/1 var(--font-mono)', color: 'var(--text-3)' }}>minutes écoutées</span>
          </div>
          {/* 7-day bars */}
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 56, marginTop: 12 }}>
            {days.map((d, i) => (
              <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                <div style={{
                  width: '100%', height: `${(d / max) * 100}%`,
                  background: i === days.length - 1 ? 'var(--accent)' : 'var(--surface-3)',
                  borderRadius: 3, minHeight: 4,
                }} />
                <span style={{ font: '400 9px/1 var(--font-mono)', color: 'var(--text-3)' }}>
                  {['L', 'M', 'M', 'J', 'V', 'S', 'D'][i]}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Metric grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
          <Metric label="Cette semaine" value="6h 47" unit="" icon="trending" />
          <Metric label="Série" value="12" unit="jours" icon="flame" accent />
          <Metric label="Terminés" value="18" unit="ce mois" icon="check" />
          <Metric label="File" value="4" unit="à venir" icon="queue" />
        </div>

        {/* Source distribution donut */}
        <div className="dp-card" style={{ padding: 18 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-3)', marginBottom: 14 }}>
            <Icon name="filter" size={13} />
            <span style={{ font: '500 11px/1 var(--font-sans)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Répartition par source</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
            <svg width="100" height="100" viewBox="0 0 100 100" style={{ flexShrink: 0 }}>
              {arcs.map((a, i) => <path key={i} d={arc(a)} fill={a.color} />)}
              <text x="50" y="48" textAnchor="middle" style={{ font: '600 16px/1 var(--font-sans)', fill: 'var(--text-1)' }}>11h</text>
              <text x="50" y="62" textAnchor="middle" style={{ font: '500 9px var(--font-mono)', fill: 'var(--text-3)', letterSpacing: '0.06em' }}>CE MOIS</text>
            </svg>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {segments.map((s, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 8, height: 8, borderRadius: 2, background: s.color }} />
                  <span style={{ flex: 1, font: '500 13px/1 var(--font-sans)', color: 'var(--text-1)' }}>{s.label}</span>
                  <span style={{ font: '500 12px/1 var(--font-mono)', color: 'var(--text-3)' }}>{s.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <HomeInd />
    </Phone>
  );
};

// ─── Settings ────────────────────────────────────────────────
const SettingsRow = ({ icon, title, value, control, last }) => (
  <div style={{
    display: 'flex', alignItems: 'center', gap: 12,
    padding: '14px 16px', minHeight: 56,
    borderBottom: last ? 'none' : '1px solid var(--border-1)',
  }}>
    {icon && <div style={{ width: 28, height: 28, borderRadius: 7, background: 'var(--surface-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-2)' }}><Icon name={icon} size={15} /></div>}
    <div style={{ flex: 1, font: '500 15px/1.3 var(--font-sans)', color: 'var(--text-1)' }}>{title}</div>
    {value && <span style={{ font: '500 13px/1 var(--font-mono)', color: 'var(--text-3)' }}>{value}</span>}
    {control}
    {control == null && <Icon name="chevRight" size={16} style={{ color: 'var(--text-3)' }} />}
  </div>
);

const Toggle = ({ on = true }) => (
  <div style={{
    width: 36, height: 22, borderRadius: 11, padding: 2,
    background: on ? 'var(--accent)' : 'var(--surface-3)',
    display: 'flex', alignItems: 'center',
    justifyContent: on ? 'flex-end' : 'flex-start',
    transition: 'background var(--d-fast) var(--ease)',
  }}>
    <div style={{ width: 18, height: 18, borderRadius: 9, background: on ? 'var(--accent-text)' : 'var(--text-1)', boxShadow: '0 1px 2px rgba(0,0,0,.3)' }} />
  </div>
);

const SettingsSection = ({ title, children }) => (
  <div style={{ marginBottom: 18 }}>
    <div style={{ padding: '0 20px 6px', font: '500 11px/1 var(--font-mono)', color: 'var(--text-3)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>{title}</div>
    <div style={{ background: 'var(--surface-1)', borderTop: '1px solid var(--border-1)', borderBottom: '1px solid var(--border-1)' }}>{children}</div>
  </div>
);

const SettingsScreen = ({ theme = 'dark' }) => (
  <Phone theme={theme}>
    <StatusBar />

    {/* Header */}
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 12px 12px' }}>
      <button className="dp-icon-btn"><Icon name="chevLeft" /></button>
      <span style={{ font: '600 16px/1 var(--font-sans)' }}>Paramètres</span>
      <div style={{ width: 44 }} />
    </div>

    <div style={{ flex: 1, overflowY: 'auto', paddingBottom: 32 }}>
      <SettingsSection title="Lecture">
        <SettingsRow icon="speed" title="Vitesse par défaut" value="1.25×" />
        <SettingsRow icon="skipFwd" title="Saut avant / arrière" value="15 s" />
        <SettingsRow icon="rotate" title="Auto-rewind" value="3 s" />
        <SettingsRow icon="boltO" title="Boost de voix" control={<Toggle on={true} />} last />
      </SettingsSection>

      <SettingsSection title="Hors-ligne">
        <SettingsRow icon="download" title="Téléchargement auto" control={<Toggle on={true} />} />
        <SettingsRow icon="archive" title="Limite (fichiers récents)" value="20" />
        <SettingsRow icon="cloud" title="Cache" value="412 MB" />
        <div style={{ padding: '10px 16px 14px' }}>
          <button className="dp-btn dp-btn-secondary" style={{ width: '100%', height: 40, color: 'var(--danger)' }}>
            Vider le cache
          </button>
        </div>
      </SettingsSection>

      <SettingsSection title="Synchronisation">
        <SettingsRow icon="rotate" title="Resynchroniser maintenant" value="il y a 2 min" />
        <SettingsRow icon="wifi" title="Sync sur Wi-Fi uniquement" control={<Toggle on={false} />} last />
      </SettingsSection>

      <SettingsSection title="Compte">
        <div style={{ padding: '16px 16px 14px', display: 'flex', alignItems: 'center', gap: 12, borderBottom: '1px solid var(--border-1)' }}>
          <div style={{ width: 40, height: 40, borderRadius: 20, background: 'var(--accent-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)' }}>
            <Icon name="user" size={20} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ font: '500 14px/1.2 var(--font-sans)', color: 'var(--text-1)' }}>Florian L.</div>
            <div style={{ font: '400 12px/1.2 var(--font-mono)', color: 'var(--text-3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>florian@gmail.com</div>
          </div>
        </div>
        <SettingsRow icon="logout" title="Se déconnecter" control={<div />} last />
      </SettingsSection>

      <SettingsSection title="À propos">
        <SettingsRow icon="info" title="Version" value="1.4.0" />
        <SettingsRow icon="doc" title="Documentation" last />
      </SettingsSection>

      <div style={{ padding: '8px 20px', font: '400 11px/1.5 var(--font-mono)', color: 'var(--text-4)', textAlign: 'center' }}>
        DrivePod · build 240515
      </div>
    </div>

    <HomeInd />
  </Phone>
);

Object.assign(window, { DashboardScreen, SettingsScreen, Toggle });
