// DrivePod — Splash & Login screens

const SplashScreen = ({ theme = 'dark' }) => (
  <Phone theme={theme}>
    <StatusBar />
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 28, paddingBottom: 80, height: 'calc(100% - 30px)' }}>
      <Logo size={88} />
      <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 4 }}>
        <div style={{ font: '600 26px/1.1 var(--font-sans)', letterSpacing: '-0.02em', color: 'var(--text-1)' }}>DrivePod</div>
        <div style={{ font: '400 13px/1.3 var(--font-mono)', color: 'var(--text-3)', letterSpacing: '0.04em' }}>VOIX · LECTURE · DRIVE</div>
      </div>
      {/* Subtle progress bar */}
      <div style={{ width: 100, marginTop: 24, position: 'relative', height: 2, background: 'var(--surface-2)', borderRadius: 1, overflow: 'hidden' }}>
        <div style={{
          position: 'absolute', height: '100%', width: 40, background: 'var(--accent)',
          borderRadius: 1, animation: 'dp-splash-slide 1.4s var(--ease) infinite',
        }} />
      </div>
    </div>
    <HomeInd />
    <style>{`
      @keyframes dp-splash-slide {
        0%   { left: -40px; }
        100% { left: 100px; }
      }
    `}</style>
  </Phone>
);

const LoginScreen = ({ theme = 'dark' }) => (
  <Phone theme={theme}>
    <StatusBar />
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '40px 28px 32px', height: 'calc(100% - 30px)' }}>
      {/* Top: logo + name */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, marginTop: 32 }}>
        <Logo size={72} />
        <div style={{ font: '600 22px/1.1 var(--font-sans)', letterSpacing: '-0.01em' }}>DrivePod</div>
      </div>

      {/* Middle: explainer */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 16, textAlign: 'center', maxWidth: 280, margin: '0 auto' }}>
        <div style={{ font: '500 19px/1.35 var(--font-sans)', color: 'var(--text-1)', letterSpacing: '-0.01em' }}>
          Vos lectures, à la voix.
        </div>
        <div style={{ font: '400 14px/1.55 var(--font-sans)', color: 'var(--text-2)' }}>
          DrivePod lit les fichiers audio<br/>
          stockés dans votre dossier<br/>
          <span style={{ font: '500 13px/1.55 var(--font-mono)', color: 'var(--text-1)', background: 'var(--surface-2)', padding: '2px 6px', borderRadius: 4 }}>Drive / Audio</span>
        </div>
      </div>

      {/* Bottom: Google sign-in + legal */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <button className="dp-btn dp-btn-primary" style={{ width: '100%', height: 52 }}>
          <Icon name="google" size={20} />
          <span>Se connecter avec Google</span>
        </button>
        <div style={{ font: '400 11px/1.5 var(--font-sans)', color: 'var(--text-3)', textAlign: 'center', padding: '0 16px' }}>
          DrivePod accède en lecture seule<br/>au dossier <span style={{ fontFamily: 'var(--font-mono)' }}>Audio/</span> de votre Drive.
        </div>
      </div>
    </div>
    <HomeInd />
  </Phone>
);

Object.assign(window, { SplashScreen, LoginScreen });
