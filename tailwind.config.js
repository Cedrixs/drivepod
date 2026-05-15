/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        /* ── Design tokens (CSS vars) ── */
        bg:          'var(--bg)',
        'surface-1': 'var(--surface-1)',
        'surface-2': 'var(--surface-2)',
        'surface-3': 'var(--surface-3)',
        'text-1':    'var(--text-1)',
        'text-2':    'var(--text-2)',
        'text-3':    'var(--text-3)',
        'text-4':    'var(--text-4)',
        'border-1':  'var(--border-1)',
        'border-2':  'var(--border-2)',
        accent: {
          DEFAULT: 'var(--accent)',
          soft:    'var(--accent-soft)',
          press:   'var(--accent-press)',
          text:    'var(--accent-text)',
        },
        success: 'var(--success)',
        danger:  'var(--danger)',
        /* ── Legacy aliases (removed progressively during refonte) ── */
        navy: {
          900: 'var(--bg)',
          800: 'var(--surface-1)',
          700: 'var(--surface-2)',
          600: 'var(--surface-3)',
        },
      },
      fontFamily: {
        sans: ['IBM Plex Sans', '-apple-system', 'system-ui', 'sans-serif'],
        mono: ['IBM Plex Mono', 'ui-monospace', 'monospace'],
      },
      borderRadius: {
        xs:   'var(--r-xs)',
        sm:   'var(--r-sm)',
        md:   'var(--r-md)',
        lg:   'var(--r-lg)',
        xl:   'var(--r-xl)',
        pill: 'var(--r-pill)',
      },
      boxShadow: {
        'dp-1': 'var(--shadow-1)',
        'dp-2': 'var(--shadow-2)',
      },
      transitionDuration: {
        fast: '140ms',
        med:  '220ms',
        slow: '360ms',
      },
      transitionTimingFunction: {
        dp: 'cubic-bezier(.2,.7,.3,1)',
      },
    },
  },
  plugins: [],
};
