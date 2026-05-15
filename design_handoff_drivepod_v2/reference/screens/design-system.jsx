// DrivePod — Design System reference page

const SwatchRow = ({ name, varName, vals }) => (
  <div style={{ display: 'flex', gap: 4 }}>
    {vals.map((v, i) => (
      <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
        <div style={{
          height: 56, borderRadius: 8, background: `var(--${v.var})`,
          border: '1px solid var(--border-1)',
        }} />
        <div style={{ font: '500 10px/1.3 var(--font-mono)', color: 'var(--text-2)' }}>{v.var}</div>
        <div style={{ font: '400 9px/1.3 var(--font-mono)', color: 'var(--text-3)' }}>{v.note}</div>
      </div>
    ))}
  </div>
);

const ColorBlock = ({ title, vars }) => (
  <div style={{ marginBottom: 18 }}>
    <div style={{ font: '500 11px/1 var(--font-mono)', color: 'var(--text-3)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 10 }}>{title}</div>
    <SwatchRow vals={vars} />
  </div>
);

const TypeSpec = ({ size, weight, lh, name, sample, mono }) => (
  <div style={{ display: 'grid', gridTemplateColumns: '180px 1fr', gap: 24, padding: '14px 0', borderBottom: '1px solid var(--border-1)', alignItems: 'baseline' }}>
    <div style={{ font: '400 11px/1.4 var(--font-mono)', color: 'var(--text-3)' }}>
      <div style={{ color: 'var(--text-1)', fontWeight: 500 }}>{name}</div>
      <div>{mono ? 'Plex Mono' : 'Plex Sans'} {weight}</div>
      <div>{size}/{lh}</div>
    </div>
    <div style={{
      font: `${weight} ${size}px/${lh} ${mono ? 'var(--font-mono)' : 'var(--font-sans)'}`,
      color: 'var(--text-1)',
      letterSpacing: size >= 24 ? '-0.02em' : '-0.005em',
    }}>{sample}</div>
  </div>
);

const ButtonState = ({ label, children }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-start' }}>
    <span style={{ font: '500 10px/1 var(--font-mono)', color: 'var(--text-3)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>{label}</span>
    {children}
  </div>
);

const DesignSystemPage = ({ theme = 'dark' }) => (
  <div className={`dp dp-${theme}`} style={{ width: 1440, minHeight: 1800, background: 'var(--bg)', padding: '48px 56px', color: 'var(--text-1)' }}>
    {/* Header */}
    <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 48, paddingBottom: 24, borderBottom: '1px solid var(--border-1)' }}>
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 12 }}>
          <div className="dp-logo" style={{ width: 56, height: 56, borderRadius: 14, fontSize: 11 }}>LOGO</div>
          <div>
            <div style={{ font: '600 36px/1 var(--font-sans)', letterSpacing: '-0.03em' }}>DrivePod</div>
            <div style={{ font: '500 12px/1 var(--font-mono)', color: 'var(--text-3)', marginTop: 6, letterSpacing: '0.06em' }}>DESIGN SYSTEM · v1.0</div>
          </div>
        </div>
      </div>
      <div style={{ font: '400 13px/1.5 var(--font-sans)', color: 'var(--text-2)', maxWidth: 380, textAlign: 'right' }}>
        Outil de lecture studieuse — palette warm-neutral,<br/>
        IBM Plex Sans + Mono, accent ambre unique.
      </div>
    </div>

    {/* Colors */}
    <section style={{ marginBottom: 56 }}>
      <h2 style={H2}>Couleurs</h2>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 36 }}>
        <div>
          <ColorBlock title="Surfaces" vars={[
            { var: 'bg', note: 'fond app' },
            { var: 'surface-1', note: 'cartes' },
            { var: 'surface-2', note: 'hover' },
            { var: 'surface-3', note: 'chips' },
          ]} />
          <ColorBlock title="Texte" vars={[
            { var: 'text-1', note: 'primaire' },
            { var: 'text-2', note: 'secondaire' },
            { var: 'text-3', note: 'tertiaire' },
            { var: 'text-4', note: 'disabled' },
          ]} />
        </div>
        <div>
          <ColorBlock title="Accent (unique) — ambre" vars={[
            { var: 'accent', note: 'CTA / progression' },
            { var: 'accent-soft', note: 'background' },
            { var: 'accent-press', note: 'pressed' },
            { var: 'accent-text', note: 'sur ambre' },
          ]} />
          <ColorBlock title="États" vars={[
            { var: 'success', note: 'téléchargé' },
            { var: 'warning', note: 'attention' },
            { var: 'danger', note: 'erreur' },
            { var: 'focus', note: 'focus ring' },
          ]} />
        </div>
      </div>
      <div style={{ marginTop: 18, padding: 16, background: 'var(--surface-1)', borderRadius: 10, border: '1px solid var(--border-1)' }}>
        <div style={{ font: '500 11px/1 var(--font-mono)', color: 'var(--text-3)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 8 }}>Note d'usage</div>
        <div style={{ font: '400 13px/1.6 var(--font-sans)', color: 'var(--text-2)' }}>
          Toutes les couleurs sont définies en <code style={codeS}>oklch()</code> pour cohérence perceptuelle.
          La palette dark utilise des fonds warm-neutral (teinte ≈60°) — pas de pure black, plus confortable en session
          longue. Une seule couleur d'accent (ambre, h≈75°) — rappel d'une lampe de lecture. Saturations ≤ 0.10
          pour éviter l'effet "consumer music".
        </div>
      </div>
    </section>

    {/* Typography */}
    <section style={{ marginBottom: 56 }}>
      <h2 style={H2}>Typographie</h2>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 36 }}>
        <div>
          <div style={{ font: '500 11px/1 var(--font-mono)', color: 'var(--text-3)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 14 }}>IBM Plex Sans · UI</div>
          <TypeSpec size={32} weight={600} lh={1.15} name="Display" sample="L'écoute studieuse" />
          <TypeSpec size={22} weight={600} lh={1.25} name="Titre écran" sample="Tableau de bord" />
          <TypeSpec size={19} weight={500} lh={1.30} name="Titre fichier" sample="L'art de prendre des notes" />
          <TypeSpec size={16} weight={400} lh={1.45} name="Body" sample="Lecture confortable, hiérarchie claire et calme." />
          <TypeSpec size={14} weight={500} lh={1.30} name="Label" sample="À reprendre · Non commencés" />
          <TypeSpec size={13} weight={400} lh={1.30} name="Meta" sample="il y a 3 jours · 47:12" />
        </div>
        <div>
          <div style={{ font: '500 11px/1 var(--font-mono)', color: 'var(--text-3)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 14 }}>IBM Plex Mono · timestamps & meta</div>
          <TypeSpec mono size={22} weight={500} lh={1.2} name="Mono large" sample="29:14 / 47:12" />
          <TypeSpec mono size={13} weight={500} lh={1.3} name="Mono medium" sample="VOIX · LECTURE" />
          <TypeSpec mono size={11} weight={500} lh={1.25} name="Mono micro" sample="EN LECTURE · ARTICLES" />

          <div style={{ marginTop: 24, padding: 16, background: 'var(--surface-1)', borderRadius: 10, border: '1px solid var(--border-1)' }}>
            <div style={{ font: '500 11px/1 var(--font-mono)', color: 'var(--text-3)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 8 }}>Règles</div>
            <ul style={{ margin: 0, paddingLeft: 18, font: '400 13px/1.6 var(--font-sans)', color: 'var(--text-2)' }}>
              <li>Mono pour <em>tous</em> les timestamps, durées, métadonnées techniques, étiquettes en CAPS</li>
              <li>Sans pour titres, corps de texte, libellés d'interface</li>
              <li><code style={codeS}>tabular-nums</code> systématique sur les chiffres alignés</li>
              <li>letter-spacing -0.02em sur ≥24px ; -0.005em sur 14-19px ; 0 sur ≤13px</li>
              <li>Taille minimale corps mobile : 14px ; cible tactile : ≥44×44</li>
            </ul>
          </div>
        </div>
      </div>
    </section>

    {/* Spacing & radii */}
    <section style={{ marginBottom: 56 }}>
      <h2 style={H2}>Espacement & rayons</h2>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 36 }}>
        <div>
          <div style={{ font: '500 11px/1 var(--font-mono)', color: 'var(--text-3)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 14 }}>Échelle 4px</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[
              ['s-1', 4], ['s-2', 8], ['s-3', 12], ['s-4', 16],
              ['s-5', 20], ['s-6', 24], ['s-7', 32], ['s-8', 40], ['s-9', 56],
            ].map(([n, v]) => (
              <div key={n} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 60, font: '500 11px/1 var(--font-mono)', color: 'var(--text-2)' }}>{n}</div>
                <div style={{ width: v, height: 12, background: 'var(--accent)', borderRadius: 2 }} />
                <div style={{ font: '400 11px/1 var(--font-mono)', color: 'var(--text-3)' }}>{v}px</div>
              </div>
            ))}
          </div>
        </div>
        <div>
          <div style={{ font: '500 11px/1 var(--font-mono)', color: 'var(--text-3)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 14 }}>Rayons</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
            {[
              ['r-xs', 4, 'inputs textuels'], ['r-sm', 6, 'icon buttons'],
              ['r-md', 10, 'boutons primaires'], ['r-lg', 14, 'cartes'],
              ['r-xl', 20, 'modals / artwork'], ['r-pill', 9999, 'chips'],
            ].map(([n, v, note]) => (
              <div key={n} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                <div style={{ width: '100%', height: 60, background: 'var(--surface-2)', borderRadius: typeof v === 'number' ? v : 9999, border: '1px solid var(--border-1)' }} />
                <div style={{ font: '500 11px/1 var(--font-mono)', color: 'var(--text-2)' }}>{n}</div>
                <div style={{ font: '400 10px/1.3 var(--font-mono)', color: 'var(--text-3)', textAlign: 'center' }}>{v === 9999 ? 'pill' : `${v}px`} · {note}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>

    {/* Components */}
    <section style={{ marginBottom: 56 }}>
      <h2 style={H2}>Composants</h2>

      {/* Buttons */}
      <div style={{ marginBottom: 28 }}>
        <h3 style={H3}>Boutons</h3>
        <div style={{ display: 'flex', gap: 36, flexWrap: 'wrap', alignItems: 'flex-start' }}>
          <ButtonState label="Primaire · idle">
            <button className="dp-btn dp-btn-primary">Continuer</button>
          </ButtonState>
          <ButtonState label="Primaire · hover">
            <button className="dp-btn dp-btn-primary" style={{ background: 'var(--accent-press)' }}>Continuer</button>
          </ButtonState>
          <ButtonState label="Primaire · pressed">
            <button className="dp-btn dp-btn-primary" style={{ background: 'var(--accent-press)', transform: 'scale(.98)' }}>Continuer</button>
          </ButtonState>
          <ButtonState label="Primaire · focus">
            <button className="dp-btn dp-btn-primary" style={{ outline: '2px solid var(--focus)', outlineOffset: 2 }}>Continuer</button>
          </ButtonState>
          <ButtonState label="Primaire · disabled">
            <button className="dp-btn dp-btn-primary" style={{ opacity: .35, pointerEvents: 'none' }}>Continuer</button>
          </ButtonState>
          <ButtonState label="Primaire · loading">
            <button className="dp-btn dp-btn-primary"><span style={{ width: 14, height: 14, border: '2px solid var(--accent-text)', borderRightColor: 'transparent', borderRadius: 7, animation: 'dp-spin 0.8s linear infinite' }} /></button>
          </ButtonState>
          <ButtonState label="Secondaire">
            <button className="dp-btn dp-btn-secondary">Annuler</button>
          </ButtonState>
          <ButtonState label="Ghost">
            <button className="dp-btn dp-btn-ghost">Plus tard</button>
          </ButtonState>
        </div>
      </div>

      {/* Chips */}
      <div style={{ marginBottom: 28 }}>
        <h3 style={H3}>Chips</h3>
        <div style={{ display: 'flex', gap: 36, flexWrap: 'wrap', alignItems: 'flex-start' }}>
          <ButtonState label="Idle"><button className="dp-chip">Non commencés</button></ButtonState>
          <ButtonState label="Hover"><button className="dp-chip" style={{ background: 'var(--surface-3)', color: 'var(--text-1)' }}>Non commencés</button></ButtonState>
          <ButtonState label="Sélectionné"><button className="dp-chip dp-chip-active">À reprendre</button></ButtonState>
          <ButtonState label="Avec icône"><button className="dp-chip"><Icon name="sort" size={13} /><span>Date</span><Icon name="chevDown" size={12} style={{ opacity: .6 }} /></button></ButtonState>
        </div>
      </div>

      {/* Icon buttons */}
      <div style={{ marginBottom: 28 }}>
        <h3 style={H3}>Boutons d'icône</h3>
        <div style={{ display: 'flex', gap: 36, flexWrap: 'wrap', alignItems: 'flex-start' }}>
          <ButtonState label="44×44 · idle"><button className="dp-icon-btn"><Icon name="search" /></button></ButtonState>
          <ButtonState label="44×44 · hover"><button className="dp-icon-btn" style={{ background: 'var(--surface-2)', color: 'var(--text-1)' }}><Icon name="search" /></button></ButtonState>
          <ButtonState label="44×44 · avec badge">
            <button className="dp-icon-btn" style={{ position: 'relative' }}>
              <Icon name="settings" />
              <span style={{ position: 'absolute', top: 8, right: 8, width: 8, height: 8, borderRadius: 4, background: 'var(--accent)', border: '2px solid var(--bg)' }} />
            </button>
          </ButtonState>
          <ButtonState label="Play (player)">
            <button style={{
              width: 64, height: 64, borderRadius: 32, background: 'var(--accent)', color: 'var(--accent-text)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 16px oklch(from var(--accent) l c h / .35)',
            }}>
              <Icon name="play" size={26} />
            </button>
          </ButtonState>
        </div>
      </div>

      {/* File card preview */}
      <div style={{ marginBottom: 28 }}>
        <h3 style={H3}>Carte de fichier (row)</h3>
        <div style={{ background: 'var(--surface-1)', borderRadius: 12, border: '1px solid var(--border-1)', overflow: 'hidden', maxWidth: 560 }}>
          <FileRow f={{ n: 1, title: "L'art de prendre des notes — Zettelkasten", date: '15 mai', dur: '47:12', prog: 0.62, ts: '29:14', off: true, cur: true }} />
          <FileRow f={{ n: 2, title: 'Pourquoi le sommeil profond conditionne la mémoire', date: '14 mai', dur: '38:45', prog: 0.18, ts: '07:01', off: true, unread: false }} />
          <FileRow f={{ n: 3, title: 'Notes sur Thinking, Fast and Slow', date: '14 mai', dur: '1:12:08', prog: 0, ts: null, unread: true }} />
        </div>
      </div>

      {/* Seek bar + sliders */}
      <div style={{ marginBottom: 28 }}>
        <h3 style={H3}>Seek bar & progress</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 36, maxWidth: 900 }}>
          <div>
            <div style={{ font: '500 11px/1 var(--font-mono)', color: 'var(--text-3)', letterSpacing: '0.04em', marginBottom: 10 }}>Seek bar (player, 4px)</div>
            <div style={{ position: 'relative', height: 4, background: 'var(--surface-2)', borderRadius: 2 }}>
              <div style={{ position: 'absolute', left: 0, top: 0, height: '100%', width: '62%', background: 'var(--accent)', borderRadius: 2 }} />
              <div style={{ position: 'absolute', left: '62%', top: '50%', transform: 'translate(-50%,-50%)', width: 14, height: 14, borderRadius: 7, background: 'var(--accent)', boxShadow: '0 0 0 4px oklch(from var(--accent) l c h / .20)' }} />
            </div>
          </div>
          <div>
            <div style={{ font: '500 11px/1 var(--font-mono)', color: 'var(--text-3)', letterSpacing: '0.04em', marginBottom: 10 }}>Progress (liste, 2px)</div>
            <div className="dp-progress"><div style={{ width: '34%', height: '100%', background: 'var(--accent)' }} /></div>
          </div>
        </div>
      </div>

      {/* Toggle */}
      <div style={{ marginBottom: 28 }}>
        <h3 style={H3}>Toggle</h3>
        <div style={{ display: 'flex', gap: 36 }}>
          <ButtonState label="On"><Toggle on={true} /></ButtonState>
          <ButtonState label="Off"><Toggle on={false} /></ButtonState>
        </div>
      </div>

      {/* Mini-player */}
      <div style={{ marginBottom: 28 }}>
        <h3 style={H3}>Mini-player (sticky)</h3>
        <div style={{ width: 360, position: 'relative' }}>
          <div style={{
            background: 'oklch(from var(--surface-1) l c h / 0.92)',
            backdropFilter: 'blur(20px) saturate(160%)',
            borderRadius: 14, border: '1px solid var(--border-1)',
            boxShadow: 'var(--shadow-2)', padding: '10px 12px',
            display: 'flex', alignItems: 'center', gap: 12,
          }}>
            <div style={{ width: 40, height: 40, borderRadius: 8, background: 'repeating-linear-gradient(135deg, oklch(from var(--surface-2) calc(l + 0.04) c h) 0 4px, var(--surface-2) 4px 8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-3)' }}>
              <Icon name="doc" size={18} />
            </div>
            <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 5 }}>
              <div style={{ font: '500 13px/1.2 var(--font-sans)' }}>Zettelkasten — Luhmann</div>
              <div className="dp-progress"><div style={{ width: '62%', height: '100%', background: 'var(--accent)' }} /></div>
            </div>
            <button style={{ width: 40, height: 40, borderRadius: 20, background: 'var(--accent)', color: 'var(--accent-text)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="pause" size={20} />
            </button>
          </div>
        </div>
      </div>
    </section>

    {/* Micro-interactions */}
    <section style={{ marginBottom: 56 }}>
      <h2 style={H2}>Micro-interactions</h2>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
        {[
          { t: 'Capture passage', d: 'Tap bookmark+ → toast glissé du bas (220ms, ease-out), scale 0.96→1.00, opacity 0→1. Vibration courte (10ms) sur mobile. Toast persiste 1.8s.' },
          { t: 'Mini → plein écran', d: 'Tap mini-player → expansion sheet (320ms cubic-bezier(.2,.7,.3,1)) ; le mini-player fade-out à 60% du chemin pour laisser place au player.' },
          { t: 'Sticky mini-player', d: 'Scroll vers le bas : mini-player remonte (translateY 100%→0, 240ms). Hide-on-scroll-down + show-on-scroll-up sur mobile pour libérer la liste.' },
          { t: 'Loader', d: 'Barre 40px qui glisse left→right indéfiniment (1.4s, ease-out). Pas de spinner circulaire — barre cohérente avec les progress bars de la liste.' },
          { t: 'Tap states (mobile)', d: 'scale(0.98) sur active 80ms. Pas de hover persistant tactile (filtré via @media hover:hover).' },
          { t: 'Reduce motion', d: 'Toutes les transitions désactivées via prefers-reduced-motion. Le toast capture reste, sans animation d\'entrée.' },
        ].map((m, i) => (
          <div key={i} style={{ padding: 16, background: 'var(--surface-1)', borderRadius: 10, border: '1px solid var(--border-1)' }}>
            <div style={{ font: '600 14px/1.3 var(--font-sans)', marginBottom: 6 }}>{m.t}</div>
            <div style={{ font: '400 13px/1.55 var(--font-sans)', color: 'var(--text-2)' }}>{m.d}</div>
          </div>
        ))}
      </div>
    </section>

    {/* Accessibility */}
    <section>
      <h2 style={H2}>Accessibilité</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
        {[
          { v: 'AA', n: 'Contrastes texte ≥ 4.5:1 (vérifié text-1/bg et text-2/bg)' },
          { v: '44+', n: 'Cibles tactiles mobile ≥ 44×44 px' },
          { v: '2px', n: 'Focus visible 2px (couleur accent, offset 2px)' },
          { v: 'RM', n: 'prefers-reduced-motion : transitions/animations désactivées' },
        ].map((a, i) => (
          <div key={i} style={{ padding: 18, background: 'var(--surface-1)', borderRadius: 10, border: '1px solid var(--border-1)' }}>
            <div style={{ font: '600 28px/1 var(--font-sans)', color: 'var(--accent)', letterSpacing: '-0.02em' }}>{a.v}</div>
            <div style={{ font: '400 12px/1.5 var(--font-sans)', color: 'var(--text-2)', marginTop: 8 }}>{a.n}</div>
          </div>
        ))}
      </div>
    </section>

    <style>{`@keyframes dp-spin { to { transform: rotate(360deg); } }`}</style>
  </div>
);

const H2 = {
  margin: '0 0 24px',
  font: '600 24px/1.1 var(--font-sans)',
  letterSpacing: '-0.02em',
  color: 'var(--text-1)',
};
const H3 = {
  margin: '0 0 16px',
  font: '500 16px/1 var(--font-sans)',
  color: 'var(--text-1)',
  letterSpacing: '-0.01em',
};
const codeS = {
  fontFamily: 'var(--font-mono)',
  background: 'var(--surface-2)',
  padding: '1px 5px',
  borderRadius: 3,
  fontSize: '0.9em',
};

Object.assign(window, { DesignSystemPage });
