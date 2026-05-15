// DrivePod — Variante v2 sans artwork
// L'artwork est remplacé par : (1) une carte "passage en cours" (phrase
// lue, surlignée façon karaoké TTS) (2) des méta-données de lecture plus
// visibles. Plus cohérent avec un lecteur de texte-vers-voix.

// Phrase actuellement lue — surlignage karaoké (mot par mot).
const CurrentPassage = ({ size = 'lg' }) => {
  const before = "Luhmann a structuré sa pensée autour de fiches reliées par références croisées plutôt qu'en arborescence.";
  const current = 'Chaque note doit être';
  const word = 'atomique';
  const after = ", écrite avec ses propres mots, et reliée à au moins une autre note existante.";
  const isLg = size === 'lg';
  return (
    <div style={{
      width: '100%',
      background: 'var(--surface-1)',
      border: '1px solid var(--border-1)',
      borderRadius: 14,
      padding: isLg ? '18px 18px 16px' : '14px 14px 12px',
      display: 'flex', flexDirection: 'column', gap: 10,
      position: 'relative',
    }}>
      {/* Label */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-3)' }}>
          <Icon name="doc" size={12} stroke={1.6} />
          <span style={{ font: '500 10px/1 var(--font-mono)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            Passage en cours · § 4
          </span>
        </div>
        <span style={{ font: '500 10px/1 var(--font-mono)', color: 'var(--text-3)' }}>p. 12 / 22</span>
      </div>

      {/* Karaoke text */}
      <div style={{
        font: `400 ${isLg ? 15 : 13}px/${isLg ? 1.55 : 1.5} var(--font-sans)`,
        color: 'var(--text-3)',
        textWrap: 'pretty',
      }}>
        <span>{before} </span>
        <span style={{ color: 'var(--text-1)' }}>{current} </span>
        <span style={{
          color: 'var(--accent-text)',
          background: 'var(--accent)',
          padding: '1px 3px',
          borderRadius: 3,
          fontWeight: 500,
          boxShadow: '0 0 0 1px var(--accent)',
        }}>{word}</span>
        <span>{after}</span>
      </div>
    </div>
  );
};

// Stat tile — calm reading metric.
const ReadStat = ({ label, value, unit, mono = true }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'center', flex: 1 }}>
    <span style={{
      font: mono
        ? '500 18px/1 var(--font-mono)'
        : '600 18px/1 var(--font-sans)',
      color: 'var(--text-1)',
      fontVariantNumeric: 'tabular-nums',
      letterSpacing: mono ? '0' : '-0.01em',
    }}>{value}{unit && <span style={{ font: '500 11px/1 var(--font-mono)', color: 'var(--text-3)', marginLeft: 2 }}>{unit}</span>}</span>
    <span style={{ font: '500 9px/1 var(--font-mono)', color: 'var(--text-3)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>{label}</span>
  </div>
);

const PlayerScreenV2 = ({ theme = 'dark', showCaptured = false }) => (
  <Phone theme={theme}>
    <StatusBar />

    {/* Top bar */}
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 12px' }}>
      <button className="dp-icon-btn"><Icon name="chevDown" /></button>
      <div style={{ font: '500 11px/1 var(--font-mono)', color: 'var(--text-3)', letterSpacing: '0.06em' }}>EN LECTURE</div>
      <button className="dp-icon-btn"><Icon name="dotsV" /></button>
    </div>

    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '12px 24px 0', minHeight: 0 }}>
      {/* Source pill */}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 18 }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          padding: '5px 11px 5px 8px', borderRadius: 999,
          background: 'var(--accent-soft)', color: 'var(--accent)',
        }}>
          <Icon name="doc" size={12} stroke={1.6} />
          <span style={{ font: '500 11px/1 var(--font-mono)', letterSpacing: '0.04em' }}>ARTICLES · IL Y A 3 JOURS</span>
        </div>
      </div>

      {/* Big title — replaces artwork */}
      <div style={{ textAlign: 'center', marginBottom: 16 }}>
        <div style={{
          font: '600 26px/1.20 var(--font-sans)',
          color: 'var(--text-1)',
          letterSpacing: '-0.025em',
          textWrap: 'balance',
          padding: '0 4px',
        }}>
          L'art de prendre des notes —<br/>système Zettelkasten
        </div>
      </div>

      {/* Reading stats row */}
      <div style={{
        display: 'flex', alignItems: 'stretch',
        padding: '14px 8px',
        background: 'oklch(from var(--surface-1) calc(l - 0.01) c h / 0.6)',
        borderRadius: 12,
        marginBottom: 14,
      }}>
        <ReadStat label="Mots" value="3.4" unit="k" />
        <div style={{ width: 1, background: 'var(--border-1)' }} />
        <ReadStat label="Pages" value="22" />
        <div style={{ width: 1, background: 'var(--border-1)' }} />
        <ReadStat label="Densité" value="9.4" unit="/10" />
        <div style={{ width: 1, background: 'var(--border-1)' }} />
        <ReadStat label="Captures" value="3" />
      </div>

      {/* Current passage (replaces artwork) */}
      <CurrentPassage />

      {/* AI summary (compact) */}
      <div style={{
        marginTop: 12,
        background: 'transparent',
        border: '1px dashed var(--border-1)',
        borderRadius: 10,
        padding: '10px 12px',
        display: 'flex', alignItems: 'center', gap: 10,
        cursor: 'pointer',
      }}>
        <Icon name="ai" size={14} style={{ color: 'var(--accent)' }} />
        <span style={{ flex: 1, font: '500 12px/1.3 var(--font-sans)', color: 'var(--text-2)' }}>
          Résumé · 3 idées principales
        </span>
        <Icon name="chevDown" size={14} style={{ color: 'var(--text-3)' }} />
      </div>

      <div style={{ flex: 1, minHeight: 8 }} />

      {/* Seek bar */}
      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div style={{ position: 'relative', height: 4, background: 'var(--surface-2)', borderRadius: 2 }}>
          <div style={{ position: 'absolute', left: 0, top: 0, height: '100%', width: '62%', background: 'var(--accent)', borderRadius: 2 }} />
          <div style={{ position: 'absolute', left: '62%', top: '50%', transform: 'translate(-50%,-50%)', width: 14, height: 14, borderRadius: 7, background: 'var(--accent)', boxShadow: '0 0 0 4px oklch(from var(--accent) l c h / .20)' }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', font: '500 11px/1 var(--font-mono)', color: 'var(--text-2)', fontVariantNumeric: 'tabular-nums' }}>
          <span>29:14</span>
          <span style={{ color: 'var(--text-3)' }}>−17:58</span>
        </div>
      </div>

      {/* Primary controls */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', marginTop: 18, padding: '0 4px' }}>
        <button className="dp-icon-btn" style={{ color: 'var(--text-2)' }}><Icon name="prev" size={24} /></button>
        <button className="dp-icon-btn" style={{ width: 52, height: 52 }}><Icon name="skipBack" size={26} /></button>
        <button style={{
          width: 72, height: 72, borderRadius: 36,
          background: 'var(--accent)', color: 'var(--accent-text)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 4px 20px oklch(from var(--accent) l c h / .35)',
        }}>
          <Icon name="pause" size={28} />
        </button>
        <button className="dp-icon-btn" style={{ width: 52, height: 52 }}><Icon name="skipFwd" size={26} /></button>
        <button className="dp-icon-btn" style={{ color: 'var(--text-2)' }}><Icon name="next" size={24} /></button>
      </div>

      {/* Secondary controls */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', marginTop: 16, marginBottom: 14 }}>
        <button className="dp-chip" style={{ height: 36, padding: '0 12px' }}>
          <Icon name="speed" size={14} />
          <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>1.25×</span>
        </button>
        <button className="dp-chip dp-chip-active" style={{ height: 36, padding: '0 12px' }}>
          <Icon name="bolt" size={14} />
          <span>Boost</span>
        </button>
        <button className="dp-chip" style={{ height: 36, padding: '0 12px' }}>
          <Icon name="bookmarkPlus" size={14} />
          <span>Capture</span>
        </button>
        <button className="dp-chip" style={{ height: 36, padding: '0 12px' }}>
          <Icon name="queue" size={14} />
          <span>File</span>
        </button>
      </div>
    </div>

    {showCaptured && (
      <div style={{
        position: 'absolute', bottom: 110, left: '50%', transform: 'translateX(-50%)',
        background: 'oklch(from var(--surface-2) calc(l + 0.04) c h / 0.95)',
        backdropFilter: 'blur(20px) saturate(180%)',
        padding: '10px 14px', borderRadius: 24,
        display: 'flex', alignItems: 'center', gap: 8,
        boxShadow: 'var(--shadow-2)',
        border: '1px solid var(--border-1)',
        animation: 'dp-pop .25s var(--ease)',
      }}>
        <div style={{ width: 22, height: 22, borderRadius: 11, background: 'var(--success)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--bg)' }}>
          <Icon name="check" size={13} stroke={2.4} />
        </div>
        <span style={{ font: '500 13px/1.2 var(--font-sans)', color: 'var(--text-1)' }}>Passage sauvegardé · 29:14</span>
      </div>
    )}

    <HomeInd />
  </Phone>
);

// ── Mini-player v2 — no doc icon, just title + glyph mark ──
const MiniPlayerV2 = () => (
  <div style={{
    position: 'absolute', left: 8, right: 8, bottom: 8,
    background: 'oklch(from var(--surface-1) l c h / 0.92)',
    backdropFilter: 'blur(20px) saturate(160%)',
    borderRadius: 14,
    border: '1px solid var(--border-1)',
    boxShadow: 'var(--shadow-2)',
    padding: '10px 12px 10px 14px',
    display: 'flex', alignItems: 'center', gap: 12,
  }}>
    {/* Source mark instead of artwork */}
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 2, flexShrink: 0, paddingRight: 4 }}>
      <span style={{ font: '500 9px/1 var(--font-mono)', color: 'var(--accent)', letterSpacing: '0.06em' }}>ART.</span>
      <span style={{ font: '500 11px/1 var(--font-mono)', color: 'var(--text-3)', fontVariantNumeric: 'tabular-nums' }}>29:14</span>
    </div>
    <div style={{ width: 1, alignSelf: 'stretch', background: 'var(--border-1)' }} />
    <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 5 }}>
      <div style={{ font: '500 13px/1.2 var(--font-sans)', color: 'var(--text-1)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
        L'art de prendre des notes — Zettelkasten
      </div>
      <div className="dp-progress"><div style={{ width: '62%', height: '100%', background: 'var(--accent)' }} /></div>
    </div>
    <button style={{ width: 40, height: 40, borderRadius: 20, background: 'var(--accent)', color: 'var(--accent-text)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Icon name="pause" size={20} />
    </button>
  </div>
);

// ── Main list v2 — file rows lose any doc-icon hint, mini-player v2 ──
const MainListScreenV2 = ({ theme = 'dark' }) => (
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

    {/* Sort + filter */}
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 16px 10px' }}>
      <button className="dp-chip" style={{ paddingRight: 8 }}>
        <Icon name="sort" size={13} />
        <span>Date</span>
        <Icon name="chevDown" size={12} style={{ marginLeft: 2, opacity: .6 }} />
      </button>
      <div style={{ width: 1, height: 18, background: 'var(--border-1)' }} />
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

    <MiniPlayerV2 />
    <HomeInd />
  </Phone>
);

// ── Desktop player panel v2 — no artwork ──
const DesktopPlayerPanelV2 = () => (
  <aside style={{
    width: 380, height: '100%', flexShrink: 0,
    background: 'var(--surface-1)',
    borderLeft: '1px solid var(--border-1)',
    display: 'flex', flexDirection: 'column',
    padding: '24px 22px 18px',
  }}>
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
      <span style={{ font: '500 11px/1 var(--font-mono)', color: 'var(--text-3)', letterSpacing: '0.06em' }}>EN LECTURE</span>
      <button className="dp-icon-btn dp-icon-btn-sm"><Icon name="dotsV" size={16} /></button>
    </div>

    {/* Source pill */}
    <div style={{ marginBottom: 14 }}>
      <span style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        padding: '5px 10px 5px 8px', borderRadius: 999,
        background: 'var(--accent-soft)', color: 'var(--accent)',
      }}>
        <Icon name="doc" size={11} stroke={1.6} />
        <span style={{ font: '500 10px/1 var(--font-mono)', letterSpacing: '0.04em' }}>ARTICLES · 3 JOURS</span>
      </span>
    </div>

    {/* Big title — fills the artwork void */}
    <div style={{
      font: '600 24px/1.20 var(--font-sans)',
      color: 'var(--text-1)',
      letterSpacing: '-0.025em',
      textWrap: 'balance',
      marginBottom: 16,
    }}>
      L'art de prendre des notes — système Zettelkasten
    </div>

    {/* Reading stats */}
    <div style={{ display: 'flex', alignItems: 'stretch', padding: '12px 6px', background: 'oklch(from var(--surface-2) l c h / 0.5)', borderRadius: 10, marginBottom: 14 }}>
      <ReadStat label="Mots" value="3.4" unit="k" />
      <div style={{ width: 1, background: 'var(--border-1)' }} />
      <ReadStat label="Pages" value="22" />
      <div style={{ width: 1, background: 'var(--border-1)' }} />
      <ReadStat label="Captures" value="3" />
    </div>

    {/* Current passage */}
    <CurrentPassage size="sm" />

    <div style={{ flex: 1, minHeight: 10 }} />

    {/* Seek */}
    <div style={{ marginBottom: 14 }}>
      <div style={{ position: 'relative', height: 4, background: 'var(--surface-2)', borderRadius: 2 }}>
        <div style={{ position: 'absolute', left: 0, top: 0, height: '100%', width: '62%', background: 'var(--accent)', borderRadius: 2 }} />
        <div style={{ position: 'absolute', left: '62%', top: '50%', transform: 'translate(-50%,-50%)', width: 12, height: 12, borderRadius: 6, background: 'var(--accent)' }} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', font: '500 11px/1 var(--font-mono)', color: 'var(--text-2)', marginTop: 6 }}>
        <span>29:14</span><span style={{ color: 'var(--text-3)' }}>−17:58</span>
      </div>
    </div>

    {/* Controls */}
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
      <button className="dp-icon-btn" style={{ color: 'var(--text-2)' }}><Icon name="prev" size={20} /></button>
      <button className="dp-icon-btn"><Icon name="skipBack" size={22} /></button>
      <button style={{ width: 56, height: 56, borderRadius: 28, background: 'var(--accent)', color: 'var(--accent-text)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 16px oklch(from var(--accent) l c h / .35)' }}>
        <Icon name="pause" size={22} />
      </button>
      <button className="dp-icon-btn"><Icon name="skipFwd" size={22} /></button>
      <button className="dp-icon-btn" style={{ color: 'var(--text-2)' }}><Icon name="next" size={20} /></button>
    </div>

    {/* Secondary */}
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
      <button className="dp-chip" style={{ height: 34, justifyContent: 'center' }}><Icon name="speed" size={13} /><span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>1.25×</span></button>
      <button className="dp-chip dp-chip-active" style={{ height: 34, justifyContent: 'center' }}><Icon name="bolt" size={13} /><span>Boost</span></button>
      <button className="dp-chip" style={{ height: 34, justifyContent: 'center' }}><Icon name="bookmarkPlus" size={13} /><span>Capture</span></button>
      <button className="dp-chip" style={{ height: 34, justifyContent: 'center' }}><Icon name="queue" size={13} /><span>File</span></button>
    </div>

    <div style={{ marginTop: 'auto', padding: '12px 0 0', borderTop: '1px solid var(--border-1)', display: 'flex', flexWrap: 'wrap', gap: '6px 14px', font: '400 11px/1.4 var(--font-mono)', color: 'var(--text-3)' }}>
      <span><kbd style={kbdS}>Espace</kbd> play</span>
      <span><kbd style={kbdS}>←</kbd><kbd style={kbdS}>→</kbd> ±15s</span>
      <span><kbd style={kbdS}>B</kbd> capture</span>
    </div>
  </aside>
);

const DesktopListScreenV2 = ({ theme = 'dark' }) => (
  <Desktop theme={theme}>
    <DesktopSidebar />
    <main style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 28px 16px', borderBottom: '1px solid var(--border-1)' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
          <h1 style={{ margin: 0, font: '600 24px/1.1 var(--font-sans)', letterSpacing: '-0.02em' }}>Aujourd'hui</h1>
          <span style={{ font: '500 13px/1 var(--font-mono)', color: 'var(--text-3)' }}>7 fichiers · 4h 23 restantes</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button className="dp-chip"><Icon name="sort" size={13} /><span>Tri : Date</span><Icon name="chevDown" size={12} style={{ marginLeft: 2, opacity: .6 }} /></button>
          <div style={{ width: 1, height: 22, background: 'var(--border-1)' }} />
          <button className="dp-chip dp-chip-active">À reprendre</button>
          <button className="dp-chip">Non commencés</button>
          <button className="dp-chip">Presque finis</button>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '32px 1fr 80px 130px 60px 40px', gap: 16, padding: '10px 20px', font: '500 11px/1 var(--font-mono)', color: 'var(--text-3)', letterSpacing: '0.04em', borderBottom: '1px solid var(--border-1)' }}>
        <span>#</span><span>TITRE</span><span>DATE</span><span>PROGRESSION</span><span style={{ textAlign: 'center' }}>OFF</span><span />
      </div>
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {DESKTOP_FILES.map((f) => <DesktopFileRow key={f.n} f={f} />)}
      </div>
    </main>
    <DesktopPlayerPanelV2 />
  </Desktop>
);

Object.assign(window, { PlayerScreenV2, MiniPlayerV2, MainListScreenV2, DesktopListScreenV2, CurrentPassage });
