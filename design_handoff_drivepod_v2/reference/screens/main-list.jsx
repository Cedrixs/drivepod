// DrivePod — Main file list (primary screen)

const SAMPLE_FILES = [
  { n: 1,  title: "L'art de prendre des notes — système Zettelkasten", date: '15 mai', dur: '47:12', prog: 0.62, ts: '29:14', off: true,  cur: true,  unread: false },
  { n: 2,  title: 'Pourquoi le sommeil profond conditionne la mémoire', date: '14 mai', dur: '38:45', prog: 0.18, ts: '07:01', off: true,  cur: false, unread: false },
  { n: 3,  title: "Notes sur 'Thinking, Fast and Slow' — chapitre 4-6", date: '14 mai', dur: '1:12:08', prog: 0,   ts: null,    off: false, cur: false, unread: true  },
  { n: 4,  title: 'Lettre de Sénèque à Lucilius — VII sur la foule',   date: '13 mai', dur: '12:34', prog: 0.94, ts: '11:47', off: true,  cur: false, unread: false },
  { n: 5,  title: 'Architecture monolithique vs microservices — analyse', date: '12 mai', dur: '52:20', prog: 0.34, ts: '17:48', off: false, cur: false, unread: false },
  { n: 6,  title: 'La théorie des affordances de Gibson',               date: '11 mai', dur: '24:05', prog: 0,   ts: null,    off: false, cur: false, unread: true  },
  { n: 7,  title: 'Méditations matinales — pratique de l\'attention',  date: '10 mai', dur: '18:50', prog: 1.0, ts: '18:50',  off: true,  cur: false, unread: false },
];

const Tab = ({ label, count, active, restTime }) => (
  <div style={{
    display: 'flex', flexDirection: 'column', gap: 2,
    padding: '12px 4px 14px', cursor: 'pointer', position: 'relative',
    color: active ? 'var(--text-1)' : 'var(--text-3)',
    flexShrink: 0,
  }}>
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
      <span style={{ font: active ? '600 16px/1 var(--font-sans)' : '500 16px/1 var(--font-sans)', letterSpacing: '-0.01em' }}>{label}</span>
      <span style={{ font: '500 12px/1 var(--font-mono)', color: active ? 'var(--text-2)' : 'var(--text-3)' }}>{count}</span>
    </div>
    {active && restTime && (
      <span style={{ font: '400 11px/1 var(--font-mono)', color: 'var(--accent)', marginTop: 4, letterSpacing: '0.02em' }}>
        {restTime} restantes
      </span>
    )}
    {active && (
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 2, background: 'var(--accent)', borderRadius: 1 }} />
    )}
  </div>
);

const FileRow = ({ f }) => (
  <div style={{
    display: 'grid',
    gridTemplateColumns: '28px 1fr auto',
    gap: 12,
    padding: '14px 20px',
    background: f.cur ? 'var(--accent-soft)' : 'transparent',
    position: 'relative',
    borderBottom: '1px solid var(--border-1)',
    alignItems: 'start',
  }}>
    {/* Active indicator on the left edge */}
    {f.cur && <div style={{ position: 'absolute', left: 0, top: 8, bottom: 8, width: 3, background: 'var(--accent)', borderRadius: '0 2px 2px 0' }} />}

    {/* Number */}
    <div style={{ paddingTop: 3 }}>
      <span className="dp-num" style={{ color: f.cur ? 'var(--accent)' : f.unread ? 'var(--text-1)' : 'var(--text-3)' }}>
        {String(f.n).padStart(2, '0')}
      </span>
    </div>

    {/* Title + meta */}
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 0 }}>
      <div style={{
        font: '500 15px/1.35 var(--font-sans)',
        color: f.cur ? 'var(--text-1)' : f.unread ? 'var(--text-1)' : 'var(--text-2)',
        letterSpacing: '-0.005em',
        display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
        textWrap: 'pretty',
      }}>{f.title}</div>

      {/* Progress bar (if started) */}
      {f.prog > 0 && f.prog < 1 && (
        <div className="dp-progress" style={{ width: '100%' }}>
          <div style={{ width: `${f.prog * 100}%`, height: '100%', background: f.cur ? 'var(--accent)' : 'var(--text-3)', borderRadius: 1 }} />
        </div>
      )}

      {/* Meta row: date · duration / timestamp · offline */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, font: '400 11px/1 var(--font-mono)', color: 'var(--text-3)' }}>
        <span>{f.date}</span>
        <span style={{ opacity: .5 }}>·</span>
        {f.ts ? (
          <span style={{ color: f.cur ? 'var(--accent)' : 'var(--text-2)' }}>
            <span style={{ fontWeight: 500 }}>{f.ts}</span><span style={{ opacity: .6 }}> / {f.dur}</span>
          </span>
        ) : (
          <span>{f.dur}</span>
        )}
        {f.prog === 1 && <span style={{ color: 'var(--success)' }}>· terminé</span>}
        {f.off && (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, color: 'var(--success)', marginLeft: 'auto', paddingLeft: 6 }}>
            <svg width="11" height="11" viewBox="0 0 12 12" fill="currentColor"><circle cx="6" cy="6" r="6" opacity=".15"/><path d="M3.5 6.2 5.3 8l3.2-4" stroke="currentColor" strokeWidth="1.4" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>
            <span style={{ fontFamily: 'var(--font-sans)', fontWeight: 500, fontSize: 10, letterSpacing: '0.02em' }}>OFF</span>
          </span>
        )}
      </div>
    </div>

    {/* Kebab */}
    <button className="dp-icon-btn dp-icon-btn-sm" style={{ marginTop: -4 }}>
      <Icon name="dotsV" size={18} />
    </button>
  </div>
);

const MiniPlayer = ({ playing = true }) => (
  <div style={{
    position: 'absolute', left: 8, right: 8, bottom: 8,
    background: 'oklch(from var(--surface-1) l c h / 0.92)',
    backdropFilter: 'blur(20px) saturate(160%)',
    WebkitBackdropFilter: 'blur(20px) saturate(160%)',
    borderRadius: 14,
    border: '1px solid var(--border-1)',
    boxShadow: 'var(--shadow-2)',
    padding: '10px 12px',
    display: 'flex', alignItems: 'center', gap: 12,
  }}>
    {/* Tiny artwork */}
    <div style={{ width: 40, height: 40, borderRadius: 8, background:
      'repeating-linear-gradient(135deg, oklch(from var(--surface-2) calc(l + 0.04) c h) 0 4px, var(--surface-2) 4px 8px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-3)', flexShrink: 0,
    }}>
      <Icon name="doc" size={18} />
    </div>
    {/* Title + progress */}
    <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 5 }}>
      <div style={{ font: '500 13px/1.2 var(--font-sans)', color: 'var(--text-1)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
        L'art de prendre des notes — Zettelkasten
      </div>
      <div className="dp-progress"><div style={{ width: '62%', height: '100%', background: 'var(--accent)' }} /></div>
    </div>
    <button className="dp-icon-btn" style={{ background: 'var(--accent)', color: 'var(--accent-text)', width: 40, height: 40, borderRadius: 20 }}>
      <Icon name={playing ? 'pause' : 'play'} size={20} />
    </button>
  </div>
);

const MainListScreen = ({ theme = 'dark', offline = false }) => (
  <Phone theme={theme}>
    <StatusBar />

    {/* Header */}
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 16px 12px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div className="dp-logo" style={{ width: 32, height: 32, borderRadius: 8, fontSize: 9 }}>LOGO</div>
        <span style={{ font: '600 18px/1 var(--font-sans)', letterSpacing: '-0.02em' }}>DrivePod</span>
      </div>
      <div style={{ display: 'flex', gap: 4 }}>
        <button className="dp-icon-btn"><Icon name="search" /></button>
        <button className="dp-icon-btn" style={{ position: 'relative' }}>
          <Icon name="settings" />
          <span style={{ position: 'absolute', top: 8, right: 8, width: 8, height: 8, borderRadius: 4, background: 'var(--accent)', border: '2px solid var(--bg)' }} />
        </button>
      </div>
    </div>

    {/* Offline bandeau (conditional) */}
    {offline && (
      <div style={{ margin: '0 16px 8px', padding: '8px 12px', background: 'var(--surface-2)', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-2)' }}>
        <Icon name="wifiOff" size={16} />
        <span style={{ font: '500 12px/1.2 var(--font-sans)' }}>Hors-ligne — lecture des fichiers téléchargés</span>
      </div>
    )}

    {/* Tabs */}
    <div className="dp-rail" style={{ borderBottom: '1px solid var(--border-1)', padding: '0 16px' }}>
      <div style={{ display: 'flex', gap: 24, width: 'max-content' }}>
        <Tab label="Aujourd'hui" count="7" active restTime="4h 23" />
        <Tab label="Books" count="12" />
        <Tab label="Articles" count="38" />
        <Tab label="Papers" count="9" />
        <Tab label="Notes" count="24" />
      </div>
    </div>

    {/* Sort + filter row */}
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 16px 10px', overflow: 'hidden' }}>
      <button className="dp-chip" style={{ paddingRight: 8 }}>
        <Icon name="sort" size={13} />
        <span>Date</span>
        <Icon name="chevDown" size={12} style={{ marginLeft: 2, opacity: .6 }} />
      </button>
      <div style={{ width: 1, height: 18, background: 'var(--border-1)', margin: '0 4px' }} />
      <div className="dp-rail" style={{ display: 'flex', gap: 6 }}>
        <button className="dp-chip dp-chip-active">À reprendre</button>
        <button className="dp-chip">Non commencés</button>
        <button className="dp-chip">Presque finis</button>
      </div>
    </div>

    {/* List */}
    <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>
      {SAMPLE_FILES.map((f) => <FileRow key={f.n} f={f} />)}
      <div style={{ height: 80 }} />
    </div>

    <MiniPlayer />
    <HomeInd />
  </Phone>
);

Object.assign(window, { MainListScreen, MiniPlayer, FileRow });
