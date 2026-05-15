// DrivePod — Player fullscreen, Search overlay, Queue

const Artwork = ({ size = 240 }) => (
  <div className="dp-artwork" style={{ width: size, height: size }}>
    <Icon name="doc" size={size * 0.28} stroke={1.2} />
    {/* Top label */}
    <div style={{ position: 'absolute', top: 16, left: 16, font: '500 10px/1 var(--font-mono)', color: 'var(--text-3)', letterSpacing: '0.06em' }}>
      PDF · 142 PAGES
    </div>
    {/* Bottom-right page indicator like a real document */}
    <div style={{ position: 'absolute', bottom: 16, right: 16, font: '500 10px/1 var(--font-mono)', color: 'var(--text-3)' }}>
      EN-FR
    </div>
  </div>
);

const PlayerScreen = ({ theme = 'dark', showSummary = true, showCaptured = false }) => (
  <Phone theme={theme}>
    <StatusBar />

    {/* Top bar: close + kebab */}
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 12px' }}>
      <button className="dp-icon-btn"><Icon name="chevDown" /></button>
      <div style={{ font: '500 11px/1 var(--font-mono)', color: 'var(--text-3)', letterSpacing: '0.06em' }}>EN LECTURE</div>
      <button className="dp-icon-btn"><Icon name="dotsV" /></button>
    </div>

    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '8px 24px 0', minHeight: 0 }}>
      {/* Source / date */}
      <div style={{ font: '500 12px/1.2 var(--font-mono)', color: 'var(--text-3)', letterSpacing: '0.02em', marginBottom: 18 }}>
        Articles · il y a 3 jours
      </div>

      {/* Artwork */}
      <Artwork size={210} />

      {/* Title */}
      <div style={{ textAlign: 'center', font: '600 19px/1.30 var(--font-sans)', color: 'var(--text-1)', letterSpacing: '-0.015em', marginTop: 24, padding: '0 8px', textWrap: 'pretty' }}>
        L'art de prendre des notes —<br/>système Zettelkasten
      </div>

      {/* AI summary block */}
      {showSummary && (
        <div style={{
          marginTop: 16, width: '100%', background: 'var(--surface-1)', border: '1px solid var(--border-1)',
          borderRadius: 12, padding: '12px 14px 14px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--accent)' }}>
              <Icon name="ai" size={14} />
              <span style={{ font: '600 11px/1 var(--font-sans)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>Résumé</span>
            </div>
            <Icon name="chevUp" size={16} style={{ color: 'var(--text-3)' }} />
          </div>
          <div style={{ font: '400 13px/1.55 var(--font-sans)', color: 'var(--text-2)', textWrap: 'pretty' }}>
            Luhmann a structuré sa pensée autour de fiches reliées par références
            croisées plutôt qu'en arborescence. Chaque note doit être atomique,
            écrite avec ses propres mots, et reliée à au moins une autre note
            existante. La densité du réseau, pas le nombre de fiches, fait la valeur
            du système.
          </div>
        </div>
      )}

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
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', marginTop: 18, marginBottom: 16 }}>
        <button className="dp-chip" style={{ height: 36, padding: '0 12px' }}>
          <Icon name="speed" size={14} />
          <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>1.25×</span>
        </button>
        <button className="dp-chip dp-chip-active" style={{ height: 36, padding: '0 12px' }} title="Boost voix activé">
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

    {/* Capture confirmation toast */}
    {showCaptured && (
      <div style={{
        position: 'absolute', bottom: 110, left: '50%', transform: 'translateX(-50%)',
        background: 'oklch(from var(--surface-2) calc(l + 0.04) c h / 0.95)',
        backdropFilter: 'blur(20px) saturate(180%)',
        WebkitBackdropFilter: 'blur(20px) saturate(180%)',
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
    <style>{`@keyframes dp-pop{0%{opacity:0;transform:translateX(-50%) translateY(6px) scale(.96)}100%{opacity:1;transform:translateX(-50%) translateY(0) scale(1)}}`}</style>
  </Phone>
);

const SearchScreen = ({ theme = 'dark' }) => {
  const results = [
    { src: 'Articles', title: 'Système Zettelkasten — Luhmann', m: ['note', 'fiche', 'réseau'] },
    { src: 'Books',    title: 'How to Take Smart Notes — Ahrens', m: ['note', 'réflexion'] },
    { src: 'Papers',   title: 'Note-taking and academic performance', m: [] },
    { src: 'Notes',    title: 'Mes notes — méthode Zettel v3',       m: [] },
  ];
  return (
    <Phone theme={theme}>
      <StatusBar />
      {/* Search header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 12px 12px' }}>
        <div style={{
          flex: 1, height: 44, borderRadius: 22, background: 'var(--surface-2)',
          display: 'flex', alignItems: 'center', padding: '0 14px', gap: 10,
        }}>
          <Icon name="search" size={18} style={{ color: 'var(--text-3)' }} />
          <input
            placeholder="Rechercher dans tous les dossiers…"
            defaultValue="note"
            style={{
              flex: 1, background: 'transparent', border: 0, outline: 0,
              font: '400 15px/1 var(--font-sans)', color: 'var(--text-1)',
              caretColor: 'var(--accent)',
            }}
          />
          <div style={{ width: 18, height: 18, borderRadius: 9, background: 'var(--surface-3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-3)' }}>
            <Icon name="close" size={12} />
          </div>
        </div>
        <button style={{ font: '500 14px/1 var(--font-sans)', color: 'var(--text-2)', padding: '0 4px' }}>Annuler</button>
      </div>

      {/* Results meta */}
      <div style={{ padding: '0 20px 8px', font: '500 11px/1 var(--font-mono)', color: 'var(--text-3)', letterSpacing: '0.04em' }}>
        4 RÉSULTATS · 4 DOSSIERS
      </div>

      <div style={{ flex: 1, overflowY: 'auto' }}>
        {results.map((r, i) => (
          <div key={i} style={{
            padding: '14px 20px', borderBottom: '1px solid var(--border-1)',
            display: 'flex', flexDirection: 'column', gap: 6,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{
                font: '500 10px/1 var(--font-mono)', color: 'var(--accent)',
                background: 'var(--accent-soft)', padding: '3px 6px', borderRadius: 4,
                letterSpacing: '0.04em',
              }}>{r.src.toUpperCase()}</span>
              <Icon name="chevRight" size={12} style={{ color: 'var(--text-3)' }} />
            </div>
            <div style={{ font: '500 15px/1.35 var(--font-sans)', color: 'var(--text-1)', textWrap: 'pretty' }}>
              {r.title.split(/(note)/gi).map((p, j) =>
                p.toLowerCase() === 'note' ? <mark key={j} style={{ background: 'var(--accent-soft)', color: 'var(--accent)', padding: '0 2px', borderRadius: 2 }}>{p}</mark> : p
              )}
            </div>
            {r.m.length > 0 && (
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {r.m.map((m, j) => (
                  <span key={j} style={{ font: '400 11px/1.5 var(--font-mono)', color: 'var(--text-3)', background: 'var(--surface-2)', padding: '2px 6px', borderRadius: 4 }}>
                    {m}
                  </span>
                ))}
                <span style={{ font: '400 11px/1.5 var(--font-mono)', color: 'var(--text-3)' }}>… 6 occurrences</span>
              </div>
            )}
          </div>
        ))}
        <div style={{ padding: '20px', textAlign: 'center', font: '500 11px/1.4 var(--font-mono)', color: 'var(--text-4)' }}>
          Recherche floue dans titres et contenus
        </div>
      </div>

      <HomeInd />
    </Phone>
  );
};

const QUEUE_ITEMS = [
  { title: 'Pourquoi le sommeil profond conditionne la mémoire', src: 'Articles', dur: '38:45', cur: true },
  { title: "Notes sur 'Thinking, Fast and Slow' — chapitre 4-6",  src: 'Books',    dur: '1:12:08' },
  { title: 'Lettre de Sénèque à Lucilius — VII sur la foule',      src: 'Books',    dur: '12:34' },
  { title: 'Architecture monolithique vs microservices',           src: 'Papers',   dur: '52:20' },
];

const QueueScreen = ({ theme = 'dark' }) => (
  <Phone theme={theme}>
    <StatusBar />
    {/* Header */}
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 12px 12px' }}>
      <button className="dp-icon-btn"><Icon name="chevDown" /></button>
      <span style={{ font: '600 16px/1 var(--font-sans)' }}>File d'écoute</span>
      <button className="dp-icon-btn"><Icon name="dotsV" /></button>
    </div>

    <div style={{ padding: '4px 20px 12px', display: 'flex', alignItems: 'baseline', gap: 8 }}>
      <span style={{ font: '500 11px/1 var(--font-mono)', color: 'var(--text-3)', letterSpacing: '0.04em' }}>4 FICHIERS</span>
      <span style={{ color: 'var(--text-4)' }}>·</span>
      <span style={{ font: '500 11px/1 var(--font-mono)', color: 'var(--text-3)' }}>2h 55 au total</span>
    </div>

    <div style={{ flex: 1, overflowY: 'auto' }}>
      {QUEUE_ITEMS.map((it, i) => (
        <div key={i} style={{
          display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px 12px 8px',
          borderBottom: '1px solid var(--border-1)',
          background: it.cur ? 'var(--accent-soft)' : 'transparent',
          position: 'relative',
        }}>
          {it.cur && <div style={{ position: 'absolute', left: 0, top: 8, bottom: 8, width: 3, background: 'var(--accent)' }} />}
          <button className="dp-icon-btn dp-icon-btn-sm" style={{ color: 'var(--text-3)', cursor: 'grab' }}>
            <Icon name="drag" size={18} />
          </button>
          <span className="dp-num" style={{ color: it.cur ? 'var(--accent)' : 'var(--text-3)', minWidth: 16 }}>
            {it.cur ? '▶' : String(i + 1).padStart(2, '0')}
          </span>
          <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 3 }}>
            <div style={{ font: '500 14px/1.3 var(--font-sans)', color: 'var(--text-1)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
              {it.title}
            </div>
            <div style={{ display: 'flex', gap: 6, font: '400 11px/1 var(--font-mono)', color: 'var(--text-3)' }}>
              <span>{it.src}</span>
              <span style={{ opacity: .5 }}>·</span>
              <span>{it.dur}</span>
            </div>
          </div>
          <button className="dp-icon-btn dp-icon-btn-sm"><Icon name="close" size={16} /></button>
        </div>
      ))}
      {/* Swipe-to-remove hint shown on item 2 */}
      <div style={{ padding: 20, textAlign: 'center', font: '400 11px/1.5 var(--font-mono)', color: 'var(--text-4)' }}>
        ← glissez pour retirer · ⠿ glissez pour réordonner
      </div>
    </div>

    <HomeInd />
  </Phone>
);

Object.assign(window, { PlayerScreen, SearchScreen, QueueScreen, Artwork });
