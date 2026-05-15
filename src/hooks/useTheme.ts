import { useState, useEffect } from 'react';

export type Theme = 'dark' | 'light';

const KEY = 'dp-theme';

function resolveTheme(): Theme {
  const saved = localStorage.getItem(KEY);
  if (saved === 'light' || saved === 'dark') return saved;
  return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
}

export function useTheme(): { theme: Theme; toggleTheme: () => void } {
  const [theme, setTheme] = useState<Theme>(resolveTheme);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // Follow system preference if user hasn't overridden manually
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: light)');
    const handler = (e: MediaQueryListEvent): void => {
      if (!localStorage.getItem(KEY)) {
        const next: Theme = e.matches ? 'light' : 'dark';
        setTheme(next);
        document.documentElement.setAttribute('data-theme', next);
      }
    };
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  const toggleTheme = (): void => {
    setTheme((t) => {
      const next: Theme = t === 'dark' ? 'light' : 'dark';
      localStorage.setItem(KEY, next);
      return next;
    });
  };

  return { theme, toggleTheme };
}
