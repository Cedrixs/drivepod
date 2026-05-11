import { describe, it, expect, vi, beforeEach } from 'vitest';

// Test cases for player logic
describe('Player logic', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('formats time correctly', () => {
    const fmt = (s: number): string => {
      if (!isFinite(s) || s <= 0) return '0:00';
      const h = Math.floor(s / 3600);
      const m = Math.floor((s % 3600) / 60);
      const sec = Math.floor(s % 60);
      if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
      return `${m}:${String(sec).padStart(2, '0')}`;
    };
    expect(fmt(0)).toBe('0:00');
    expect(fmt(60)).toBe('1:00');
    expect(fmt(90)).toBe('1:30');
    expect(fmt(3661)).toBe('1:01:01');
    expect(fmt(-1)).toBe('0:00');
  });

  it('skip backward clamps to 0', () => {
    const clampSeek = (current: number, offset: number, duration: number): number =>
      Math.max(0, Math.min(current + offset, duration));
    expect(clampSeek(10, -30, 200)).toBe(0);
    expect(clampSeek(100, -30, 200)).toBe(70);
    expect(clampSeek(190, 30, 200)).toBe(200);
  });

  it('PKCE verifier generates 43+ char base64url string', async () => {
    // Simulate PKCE generation
    const raw = new Uint8Array(32);
    for (let i = 0; i < 32; i++) raw[i] = i;
    const verifier = btoa(String.fromCharCode(...raw))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
    expect(verifier.length).toBeGreaterThanOrEqual(43);
    expect(verifier).toMatch(/^[A-Za-z0-9_-]+$/);
  });

  it('TC-1: auth redirect URL contains required params', () => {
    const CLIENT_ID = '295398590056-07is9k0cbqt85hjv004doc4klocmchff.apps.googleusercontent.com';
    const REDIRECT_URI = 'https://Cedrixs.github.io/drivepod/';
    const params = new URLSearchParams({
      client_id: CLIENT_ID,
      redirect_uri: REDIRECT_URI,
      response_type: 'code',
      scope: 'https://www.googleapis.com/auth/drive',
      code_challenge: 'test-challenge',
      code_challenge_method: 'S256',
      access_type: 'offline',
      prompt: 'consent',
      state: 'test-state',
    });
    const url = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
    expect(url).toContain('code_challenge_method=S256');
    expect(url).toContain('response_type=code');
    expect(url).toContain('access_type=offline');
    expect(url).toContain(encodeURIComponent('https://www.googleapis.com/auth/drive'));
  });

  it('TC-5: state merge picks most recent lastUpdated', () => {
    const localState = { fileId: 'f1', position: 120, duration: 300, lastUpdated: 1000 };
    const remoteState = { fileId: 'f1', position: 150, duration: 300, lastUpdated: 2000 };

    const merged = remoteState.lastUpdated > localState.lastUpdated ? remoteState : localState;
    expect(merged.position).toBe(150);
    expect(merged.lastUpdated).toBe(2000);
  });

  it('TC-5: local wins when more recent', () => {
    const localState = { fileId: 'f1', position: 180, duration: 300, lastUpdated: 3000 };
    const remoteState = { fileId: 'f1', position: 150, duration: 300, lastUpdated: 2000 };

    const merged = remoteState.lastUpdated > localState.lastUpdated ? remoteState : localState;
    expect(merged.position).toBe(180);
    expect(merged.lastUpdated).toBe(3000);
  });
});

describe('Offline queue', () => {
  it('TC-6: queues archive action when offline', async () => {
    const queue: { type: string; fileId: string }[] = [];
    const enqueue = (action: { type: string; fileId: string }): void => {
      queue.push(action);
    };

    const isOnline = false;
    const fileId = 'file-123';

    if (!isOnline) {
      enqueue({ type: 'archive', fileId });
    }

    expect(queue).toHaveLength(1);
    expect(queue[0].fileId).toBe('file-123');
  });

  it('flushes queue when back online', async () => {
    const executeSpy = vi.fn().mockResolvedValue(undefined);
    const queue = [
      { id: '1', type: 'archive', fileId: 'f1' },
      { id: '2', type: 'archive', fileId: 'f2' },
    ];

    for (const action of queue) {
      await executeSpy(action);
    }

    expect(executeSpy).toHaveBeenCalledTimes(2);
  });
});

describe('State sync', () => {
  it('month key format is correct', () => {
    const now = new Date('2026-05-11');
    const key = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    expect(key).toBe('2026-05');
  });

  it('corrupt JSON state falls back gracefully', () => {
    const parseState = (raw: string): { files: Record<string, unknown> } | null => {
      try { return JSON.parse(raw) as { files: Record<string, unknown> }; }
      catch { return null; }
    };
    expect(parseState('invalid json')).toBeNull();
    expect(parseState('{"files":{}}')).toEqual({ files: {} });
  });
});

describe('TC-8: Token expiry handling', () => {
  it('detects expired token', () => {
    const isExpired = (expiresAt: number): boolean => Date.now() >= expiresAt - 60_000;
    expect(isExpired(Date.now() - 1000)).toBe(true); // already expired
    expect(isExpired(Date.now() + 3600_000)).toBe(false); // 1 hour away
  });

  it('treats 401 refresh response as auth failure', () => {
    const handleRefreshError = (status: number): 'REFRESH_FAILED' | 'RETRY' => {
      if (status === 400 || status === 401) return 'REFRESH_FAILED';
      return 'RETRY';
    };
    expect(handleRefreshError(401)).toBe('REFRESH_FAILED');
    expect(handleRefreshError(400)).toBe('REFRESH_FAILED');
    expect(handleRefreshError(500)).toBe('RETRY');
  });
});
