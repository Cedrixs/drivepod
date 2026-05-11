import { vi } from 'vitest';

// Mock IndexedDB
Object.defineProperty(window, 'indexedDB', {
  value: {
    open: vi.fn(),
  },
  writable: true,
});

// Mock crypto
Object.defineProperty(window, 'crypto', {
  value: {
    getRandomValues: (arr: Uint8Array) => {
      for (let i = 0; i < arr.length; i++) arr[i] = Math.floor(Math.random() * 256);
      return arr;
    },
    subtle: {
      digest: vi.fn().mockResolvedValue(new ArrayBuffer(32)),
      generateKey: vi.fn().mockResolvedValue({ type: 'secret' }),
      exportKey: vi.fn().mockResolvedValue(new ArrayBuffer(32)),
      importKey: vi.fn().mockResolvedValue({ type: 'secret' }),
      encrypt: vi.fn().mockResolvedValue(new ArrayBuffer(32)),
      decrypt: vi.fn().mockResolvedValue(new TextEncoder().encode('test-token').buffer),
    },
    randomUUID: () => 'test-uuid-' + Math.random().toString(36).slice(2),
  },
  writable: true,
});

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; },
  };
})();
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Mock sessionStorage
const sessionStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; },
  };
})();
Object.defineProperty(window, 'sessionStorage', { value: sessionStorageMock });

// Mock caches
Object.defineProperty(window, 'caches', {
  value: {
    open: vi.fn().mockResolvedValue({
      put: vi.fn(),
      match: vi.fn().mockResolvedValue(null),
      keys: vi.fn().mockResolvedValue([]),
      delete: vi.fn(),
    }),
    delete: vi.fn().mockResolvedValue(true),
    keys: vi.fn().mockResolvedValue([]),
  },
  writable: true,
});

// Mock navigator.mediaSession
Object.defineProperty(navigator, 'mediaSession', {
  value: {
    metadata: null,
    playbackState: 'none',
    setActionHandler: vi.fn(),
    setPositionState: vi.fn(),
  },
  writable: true,
});

// Mock navigator.onLine
Object.defineProperty(navigator, 'onLine', { value: true, writable: true });
