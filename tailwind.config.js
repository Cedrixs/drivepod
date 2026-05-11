/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        navy: {
          900: '#0f0f23',
          800: '#1a1a2e',
          700: '#16213e',
          600: '#0f3460',
        },
        accent: {
          DEFAULT: '#e94560',
          light: '#ff6b6b',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
