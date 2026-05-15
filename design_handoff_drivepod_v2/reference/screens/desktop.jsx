// DrivePod — Desktop responsive views (≥1024px, 3-column layout)

const DesktopSidebar = ({ active = 'today' }) => {
  const tabs = [
    { id: 'today',    label: "Aujourd'hui", icon: 'clock',    count: 7,  active: true },
    { id: 'books',    label: 'Books',       icon: 'doc',      count: 12 },
    { id: 'articles', label: 'Articles',    icon: 'doc',      count: 38 },
    { id: 'papers',   label: 'Papers',      icon: 'doc',      count: 9 },
    { id: 'notes',    label: 'Notes',       icon: 'doc',      count: 24 },
  ];
  return (
    <aside style={{
      width: 248, height: '100%', flexShrink: 0,
      background: 'var(--surface-1)',
      borderRight: '1px solid var(--border-1)',
      display: 'flex', flexDirection: 'column',
      padding: '20px 14px 16px',
    }}>
      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0 6px 18px' }}>
        <div className="dp-logo" style={{ width: 32, height: 32, borderRadius: 8, fontSize: 9 }}>LOGO</div>
        <span style={{ font: '600 17px/1 var(--font-sans)', letterSpacing: '-0.02em' }}>DrivePod</span>
      </div>

      {/* Search + queue */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2, padding: '0 0 14px', borderBottom: '1px solid var(--border-1)' }}>
        <button style={{
          height: 36, padding: '0 10px', borderRadius: 8,
          display: 'flex', alignItems: 'center', gap: 10,
          color: 'var(--text-2)', font: '500 14px/1 var(--font-sans)',
        }}>
          <Icon name="search" size={16} />
          <span style={{ flex: 1, textAlign: 'left' }}>Rechercher</span>
          <span style={{ font: '500 11px/1 var(--font-mono)', color: 'var(--text-3)', background: 'var(--surface-2)', padding: '3px 5px', borderRadius: 3 }}>⌘K</span>
        </button>
        <button style={{
          height: 36, padding: '0 10px', borderRadius: 8,
          display: 'flex', alignItems: 'center', gap: 10,
          color: 'var(--text-2)', font: '500 14px/1 var(--font-sans)',
        }}>
          <Icon name="queue" size={16} />
          <span style={{ flex: 1, textAlign: 'left' }}>File d'écoute</span>
          <span style={{ font: '500 11px/1 var(--font-mono)', color: 'var(--text-3)' }}>4</span>
        </button>
      </div>

      {/* Folder tabs */}
      <div style={{ padding: '14px 0 0', display: 'flex', flexDirection: 'column', gap: 2 }}>
        <div style={{ padding: '0 10px 6px', font: '500 11px/1 var(--font-mono)', color: 'var(--text-3)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Dossiers</div>
        {tabs.map((t) => (
          <button key={t.id} style={{
            height: 36, padding: '0 10px', borderRadius: 8,
            display: 'flex', alignItems: 'center', gap: 10,
            background: t.active ? 'var(--accent-soft)' : 'transparent',
            color: t.active ? 'var(--accent)' : 'var(--text-2)',
            font: t.active ? '600 14px/1 var(--font-sans)' : '500 14px/1 var(--font-sans)',
            position: 'relative',
          }}>
            {t.active && <div style={{ position: 'absolute', left: -14, top: 6, bottom: 6, width: 3, background: 'var(--accent)', borderRadius: '0 2px 2px 0' }} />}
            <Icon name={t.icon} size={15} stroke={1.6} />
            <span style={{ flex: 1, textAlign: 'left' }}>{t.label}</span>
            <span style={{ font: '500 12px/1 var(--font-mono)', color: t.active ? 'var(--accent)' : 'var(--text-3)' }}>{t.count}</span>
          </button>
        ))}
      </div>

      {/* Today rest time */}
      <div style={{ marginTop: 8, padding: '10px 12px', background: 'var(--surface-2)', borderRadius: 8, font: '500 11px/1.3 var(--font-mono)', color: 'var(--text-2)' }}>
        <div style={{ color: 'var(--text-3)', marginBottom: 4, letterSpacing: '0.04em' }}>RESTANT AUJOURD'HUI</div>
        <div style={{ color: 'var(--accent)', font: '600 18px/1 var(--font-sans)', letterSpacing: '-0.01em' }}>4h 23</div>
      </div>

      <div style={{ flex: 1 }} />

      {/* Bottom: dashboard + settings */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2, paddingTop: 12, borderTop: '1px solid var(--border-1)' }}>
        <button style={{ height: 36, padding: '0 10px', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 10, color: 'var(--text-2)', font: '500 14px/1 var(--font-sans)' }}>
          <Icon name="trending" size={16} />
          <span style={{ flex: 1, textAlign: 'left' }}>Tableau de bord</span>
        </button>
        <button style={{ height: 36, padding: '0 10px', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 10, color: 'var(--text-2)', font: '500 14px/1 var(--font-sans)' }}>
          <Icon name="settings" size={16} />
          <span style={{ flex: 1, textAlign: 'left' }}>Paramètres</span>
        </button>
        {/* Account */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 6px 0', marginTop: 6 }}>
          <div style={{ width: 28, height: 28, borderRadius: 14, background: 'var(--accent-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)' }}>
            <Icon name="user" size={15} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ font: '500 12px/1.2 var(--font-sans)', color: 'var(--text-1)' }}>Florian L.</div>
            <div style={{ font: '400 11px/1.2 var(--font-mono)', color: 'var(--text-3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>florian@gmail.com</div>
          </div>
        </div>
      </div>
    </aside>
  );
};

const DesktopFileRow = ({ f, dense = true }) => (
  <div style={{
    display: 'grid', gridTemplateColumns: '32px 1fr 80px 130px 60px 40px',
    gap: 16, padding: '12px 20px', alignItems: 'center',
    background: f.cur ? 'var(--accent-soft)' : (f.sel ? 'var(--surface-2)' : 'transparent'),
    borderBottom: '1px solid var(--border-1)',
    position: 'relative',
    cursor: 'pointer',
  }}>
    {f.cur && <div style={{ position: 'absolute', left: 0, top: 4, bottom: 4, width: 3, background: 'var(--accent)' }} />}
    <span className="dp-num" style={{ color: f.cur ? 'var(--accent)' : 'var(--text-3)' }}>
      {f.cur ? '▶' : String(f.n).padStart(2, '0')}
    </span>
    <div style={{ minWidth: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
      <div style={{ font: '500 14px/1.3 var(--font-sans)', color: f.cur || f.unread ? 'var(--text-1)' : 'var(--text-2)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
        {f.title}
      </div>
      {f.prog > 0 && f.prog < 1 && (
        <div className="dp-progress" style={{ width: 180 }}>
          <div style={{ width: `${f.prog * 100}%`, height: '100%', background: f.cur ? 'var(--accent)' : 'var(--text-3)' }} />
        </div>
      )}
    </div>
    <span style={{ font: '400 12px/1 var(--font-mono)', color: 'var(--text-3)' }}>{f.date}</span>
    <span style={{ font: '500 12px/1 var(--font-mono)', color: f.cur ? 'var(--accent)' : 'var(--text-2)', fontVariantNumeric: 'tabular-nums' }}>
      {f.ts ? <>{f.ts}<span style={{ color: 'var(--text-3)', fontWeight: 400 }}> / {f.dur}</span></> : f.dur}
    </span>
    {f.off ? (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: 'var(--success)' }}>
        <svg width="13" height="13" viewBox="0 0 12 12" fill="currentColor"><circle cx="6" cy="6" r="6" opacity=".15"/><path d="M3.5 6.2 5.3 8l3.2-4" stroke="currentColor" strokeWidth="1.4" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>
      </span>
    ) : <span />}
    <button className="dp-icon-btn dp-icon-btn-sm" style={{ opacity: 0 /* shown on hover */ }}>
      <Icon name="dotsV" size={16} />
    </button>
  </div>
);

const DesktopPlayerPanel = () => (
  <aside style={{
    width: 380, height: '100%', flexShrink: 0,
    background: 'var(--surface-1)',
    borderLeft: '1px solid var(--border-1)',
    display: 'flex', flexDirection: 'column',
    padding: '24px 20px 18px',
  }}>
    {/* Source */}
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
      <span style={{ font: '500 11px/1 var(--font-mono)', color: 'var(--text-3)', letterSpacing: '0.06em' }}>EN LECTURE · ARTICLES</span>
      <button className="dp-icon-btn dp-icon-btn-sm"><Icon name="dotsV" size={16} /></button>
    </div>

    {/* Artwork */}
    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 18 }}>
      <Artwork size={200} />
    </div>

    {/* Title */}
    <div style={{ font: '600 18px/1.3 var(--font-sans)', color: 'var(--text-1)', letterSpacing: '-0.015em', textAlign: 'center', textWrap: 'pretty', marginBottom: 12 }}>
      L'art de prendre des notes —<br/>système Zettelkasten
    </div>

    {/* AI Summary */}
    <div style={{ background: 'var(--surface-2)', borderRadius: 10, padding: '12px 14px', marginBottom: 18 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--accent)' }}>
          <Icon name="ai" size={13} />
          <span style={{ font: '600 10px/1 var(--font-sans)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Résumé</span>
        </div>
        <Icon name="chevUp" size={14} style={{ color: 'var(--text-3)' }} />
      </div>
      <div style={{ font: '400 12px/1.55 var(--font-sans)', color: 'var(--text-2)' }}>
        Luhmann a structuré sa pensée autour de fiches reliées par références
        croisées. Chaque note doit être atomique et reliée à au moins une autre.
        La densité du réseau fait la valeur du système.
      </div>
    </div>

    {/* Seek */}
    <div style={{ marginBottom: 14 }}>
      <div style={{ position: 'relative', height: 4, background: 'var(--surface-2)', borderRadius: 2 }}>
        <div style={{ position: 'absolute', left: 0, top: 0, height: '100%', width: '62%', background: 'var(--accent)', borderRadius: 2 }} />
        <div style={{ position: 'absolute', left: '62%', top: '50%', transform: 'translate(-50%,-50%)', width: 12, height: 12, borderRadius: 6, background: 'var(--accent)' }} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', font: '500 11px/1 var(--font-mono)', color: 'var(--text-2)', marginTop: 6 }}>
        <span>29:14</span>
        <span style={{ color: 'var(--text-3)' }}>−17:58</span>
      </div>
    </div>

    {/* Controls */}
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
      <button className="dp-icon-btn" style={{ color: 'var(--text-2)' }}><Icon name="prev" size={20} /></button>
      <button className="dp-icon-btn"><Icon name="skipBack" size={22} /></button>
      <button style={{
        width: 56, height: 56, borderRadius: 28,
        background: 'var(--accent)', color: 'var(--accent-text)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: '0 4px 16px oklch(from var(--accent) l c h / .35)',
      }}>
        <Icon name="pause" size={22} />
      </button>
      <button className="dp-icon-btn"><Icon name="skipFwd" size={22} /></button>
      <button className="dp-icon-btn" style={{ color: 'var(--text-2)' }}><Icon name="next" size={20} /></button>
    </div>

    {/* Secondary controls row */}
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 14 }}>
      <button className="dp-chip" style={{ height: 34, justifyContent: 'center' }}>
        <Icon name="speed" size={13} />
        <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>1.25×</span>
      </button>
      <button className="dp-chip dp-chip-active" style={{ height: 34, justifyContent: 'center' }}>
        <Icon name="bolt" size={13} />
        <span>Boost voix</span>
      </button>
      <button className="dp-chip" style={{ height: 34, justifyContent: 'center' }}>
        <Icon name="bookmarkPlus" size={13} />
        <span>Capture</span>
      </button>
      <button className="dp-chip" style={{ height: 34, justifyContent: 'center' }}>
        <Icon name="queue" size={13} />
        <span>File</span>
      </button>
    </div>

    {/* Keyboard hints */}
    <div style={{ marginTop: 'auto', padding: '12px 0 0', borderTop: '1px solid var(--border-1)', display: 'flex', flexWrap: 'wrap', gap: '6px 14px', font: '400 11px/1.4 var(--font-mono)', color: 'var(--text-3)' }}>
      <span><kbd style={kbdS}>Espace</kbd> play/pause</span>
      <span><kbd style={kbdS}>←</kbd><kbd style={kbdS}>→</kbd> ±15s</span>
      <span><kbd style={kbdS}>↑</kbd><kbd style={kbdS}>↓</kbd> vitesse</span>
      <span><kbd style={kbdS}>B</kbd> capture</span>
    </div>
  </aside>
);

const kbdS = {
  display: 'inline-block', padding: '2px 5px', marginRight: 3,
  background: 'var(--surface-2)', border: '1px solid var(--border-1)',
  borderRadius: 4, fontSize: 10, color: 'var(--text-2)', verticalAlign: 'baseline',
};

const DESKTOP_FILES = [
  { n: 1,  title: "L'art de prendre des notes — système Zettelkasten", date: '15 mai', dur: '47:12', prog: 0.62, ts: '29:14', off: true,  cur: true },
  { n: 2,  title: 'Pourquoi le sommeil profond conditionne la mémoire', date: '14 mai', dur: '38:45', prog: 0.18, ts: '07:01', off: true,  unread: false },
  { n: 3,  title: "Notes sur 'Thinking, Fast and Slow' — chapitre 4-6", date: '14 mai', dur: '1:12:08', prog: 0,   ts: null,    unread: true  },
  { n: 4,  title: "Lettre de Sénèque à Lucilius — VII sur la foule",    date: '13 mai', dur: '12:34', prog: 0.94, ts: '11:47', off: true   },
  { n: 5,  title: 'Architecture monolithique vs microservices — analyse', date: '12 mai', dur: '52:20', prog: 0.34, ts: '17:48' },
  { n: 6,  title: 'La théorie des affordances de Gibson',                 date: '11 mai', dur: '24:05', prog: 0,   ts: null,    unread: true },
  { n: 7,  title: 'Méditations matinales — pratique de l\'attention',     date: '10 mai', dur: '18:50', prog: 1.0, ts: '18:50', off: true  },
  { n: 8,  title: "Frontières du langage et limites du pensable — extraits", date: '9 mai', dur: '34:22', prog: 0,  ts: null,  unread: true },
  { n: 9,  title: 'Mémoire et performance — études récentes',              date: '8 mai', dur: '21:10', prog: 0.5, ts: '10:35' },
  { n: 10, title: 'Méthode de lecture active — 4 niveaux',                  date: '7 mai', dur: '29:48', prog: 0.12, ts: '03:35' },
];

const DesktopListScreen = ({ theme = 'dark' }) => (
  <Desktop theme={theme}>
    <DesktopSidebar />

    {/* Main column */}
    <main style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden' }}>
      {/* Top bar */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '20px 28px 16px', borderBottom: '1px solid var(--border-1)',
      }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
          <h1 style={{ margin: 0, font: '600 24px/1.1 var(--font-sans)', letterSpacing: '-0.02em', color: 'var(--text-1)' }}>Aujourd'hui</h1>
          <span style={{ font: '500 13px/1 var(--font-mono)', color: 'var(--text-3)' }}>7 fichiers · 4h 23 restantes</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button className="dp-chip">
            <Icon name="sort" size={13} />
            <span>Tri : Date</span>
            <Icon name="chevDown" size={12} style={{ marginLeft: 2, opacity: .6 }} />
          </button>
          <div style={{ width: 1, height: 22, background: 'var(--border-1)' }} />
          <button className="dp-chip dp-chip-active">À reprendre</button>
          <button className="dp-chip">Non commencés</button>
          <button className="dp-chip">Presque finis</button>
        </div>
      </div>

      {/* Column headers */}
      <div style={{
        display: 'grid', gridTemplateColumns: '32px 1fr 80px 130px 60px 40px',
        gap: 16, padding: '10px 20px',
        font: '500 11px/1 var(--font-mono)', color: 'var(--text-3)', letterSpacing: '0.04em',
        borderBottom: '1px solid var(--border-1)',
      }}>
        <span>#</span><span>TITRE</span><span>DATE</span><span>PROGRESSION</span><span style={{ textAlign: 'center' }}>OFF</span><span />
      </div>

      {/* List */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {DESKTOP_FILES.map((f) => <DesktopFileRow key={f.n} f={f} />)}
      </div>
    </main>

    <DesktopPlayerPanel />
  </Desktop>
);

const DesktopDashboardScreen = ({ theme = 'dark' }) => {
  const days = Array.from({ length: 14 }, (_, i) => 20 + ((Math.sin(i * 1.3) + 1) * 35));
  const max = Math.max(...days);
  const segments = [
    { label: 'Articles', value: 38, color: 'var(--accent)' },
    { label: 'Books',    value: 28, color: 'oklch(from var(--accent) calc(l - 0.10) c calc(h + 30))' },
    { label: 'Papers',   value: 22, color: 'oklch(from var(--accent) calc(l - 0.20) c calc(h + 60))' },
    { label: 'Notes',    value: 12, color: 'var(--surface-3)' },
  ];
  const total = segments.reduce((s, x) => s + x.value, 0);
  let acc = 0;
  const arcs = segments.map((s) => {
    const start = (acc / total) * Math.PI * 2; acc += s.value;
    const end = (acc / total) * Math.PI * 2;
    return { ...s, start, end };
  });
  const polar = (r, a) => [100 + r * Math.cos(a - Math.PI/2), 100 + r * Math.sin(a - Math.PI/2)];
  const arc = (a) => {
    const [x1,y1] = polar(80, a.start), [x2,y2] = polar(80, a.end);
    const [x3,y3] = polar(56, a.end),   [x4,y4] = polar(56, a.start);
    const large = a.end - a.start > Math.PI ? 1 : 0;
    return `M ${x1} ${y1} A 80 80 0 ${large} 1 ${x2} ${y2} L ${x3} ${y3} A 56 56 0 ${large} 0 ${x4} ${y4} Z`;
  };

  return (
    <Desktop theme={theme}>
      <DesktopSidebar />
      <main style={{ flex: 1, padding: '36px 48px', overflowY: 'auto', minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 28 }}>
          <h1 style={{ margin: 0, font: '600 28px/1.1 var(--font-sans)', letterSpacing: '-0.02em' }}>Tableau de bord</h1>
          <span style={{ font: '500 13px/1 var(--font-mono)', color: 'var(--text-3)' }}>Semaine du 12 mai</span>
        </div>

        {/* Big metric + bars */}
        <div className="dp-card" style={{ padding: 24, marginBottom: 18 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 24, marginBottom: 18 }}>
            <div>
              <div style={{ font: '500 11px/1 var(--font-mono)', color: 'var(--text-3)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 6 }}>
                Aujourd'hui
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                <span style={{ font: '600 48px/1 var(--font-sans)', letterSpacing: '-0.03em', fontVariantNumeric: 'tabular-nums' }}>1h 23</span>
                <span style={{ font: '500 13px/1 var(--font-mono)', color: 'var(--text-3)' }}>écoutées</span>
              </div>
            </div>
            <div style={{ flex: 1 }} />
            <div>
              <div style={{ font: '500 11px/1 var(--font-mono)', color: 'var(--text-3)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 6 }}>Cette semaine</div>
              <div style={{ font: '600 26px/1 var(--font-sans)', fontVariantNumeric: 'tabular-nums' }}>6h 47</div>
            </div>
            <div>
              <div style={{ font: '500 11px/1 var(--font-mono)', color: 'var(--text-3)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 6 }}>Série</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--accent)' }}>
                <Icon name="flame" size={20} />
                <span style={{ font: '600 26px/1 var(--font-sans)', fontVariantNumeric: 'tabular-nums' }}>12</span>
                <span style={{ font: '500 13px/1 var(--font-mono)', color: 'var(--text-3)' }}>j</span>
              </div>
            </div>
            <div>
              <div style={{ font: '500 11px/1 var(--font-mono)', color: 'var(--text-3)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 6 }}>Terminés (mois)</div>
              <div style={{ font: '600 26px/1 var(--font-sans)', fontVariantNumeric: 'tabular-nums' }}>18</div>
            </div>
          </div>

          {/* 14-day bars */}
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 100 }}>
            {days.map((d, i) => (
              <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                <div style={{ width: '100%', height: `${(d / max) * 100}%`, background: i === days.length - 1 ? 'var(--accent)' : 'var(--surface-3)', borderRadius: 3, minHeight: 4 }} />
                <span style={{ font: '400 10px/1 var(--font-mono)', color: 'var(--text-3)' }}>{i + 2}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Two-column: donut + activity */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
          <div className="dp-card" style={{ padding: 24 }}>
            <div style={{ font: '500 11px/1 var(--font-mono)', color: 'var(--text-3)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 18 }}>
              Répartition par source · ce mois
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 28 }}>
              <svg width="200" height="200" viewBox="0 0 200 200" style={{ flexShrink: 0 }}>
                {arcs.map((a, i) => <path key={i} d={arc(a)} fill={a.color} />)}
                <text x="100" y="96" textAnchor="middle" style={{ font: '600 30px/1 var(--font-sans)', fill: 'var(--text-1)' }}>11h</text>
                <text x="100" y="118" textAnchor="middle" style={{ font: '500 11px var(--font-mono)', fill: 'var(--text-3)', letterSpacing: '0.06em' }}>11H 24 TOTAL</text>
              </svg>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
                {segments.map((s, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 10, height: 10, borderRadius: 2, background: s.color }} />
                    <span style={{ flex: 1, font: '500 14px/1 var(--font-sans)' }}>{s.label}</span>
                    <span style={{ font: '500 13px/1 var(--font-mono)', color: 'var(--text-3)' }}>{s.value}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Recent activity */}
          <div className="dp-card" style={{ padding: 24 }}>
            <div style={{ font: '500 11px/1 var(--font-mono)', color: 'var(--text-3)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 14 }}>
              Captures récentes
            </div>
            {[
              { title: "Système Zettelkasten — Luhmann", ts: '29:14', when: 'il y a 4 min' },
              { title: 'Notes sur Thinking, Fast and Slow', ts: '14:02', when: 'hier · 18:32' },
              { title: 'Sénèque à Lucilius — VII',          ts: '08:51', when: 'il y a 2 j' },
              { title: 'Méditations matinales',             ts: '12:00', when: 'il y a 4 j' },
            ].map((c, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderTop: i ? '1px solid var(--border-1)' : 'none' }}>
                <Icon name="bookmark" size={15} style={{ color: 'var(--accent)' }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ font: '500 14px/1.3 var(--font-sans)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.title}</div>
                  <div style={{ font: '400 11px/1.3 var(--font-mono)', color: 'var(--text-3)' }}>{c.when}</div>
                </div>
                <span style={{ font: '500 12px/1 var(--font-mono)', color: 'var(--accent)' }}>{c.ts}</span>
              </div>
            ))}
          </div>
        </div>
      </main>
    </Desktop>
  );
};

Object.assign(window, { DesktopListScreen, DesktopDashboardScreen, DesktopSidebar });
