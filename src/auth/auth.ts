import { getDB } from '../state/db';

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID ?? '295398590056-07is9k0cbqt85hjv004doc4klocmchff.apps.googleusercontent.com';
const CLIENT_SECRET = import.meta.env.VITE_GOOGLE_CLIENT_SECRET ?? '';
const REDIRECT_URI = `${window.location.origin}/drivepod/`;
const TOKEN_ENDPOINT = 'https://oauth2.googleapis.com/token';
const REVOKE_ENDPOINT = 'https://oauth2.googleapis.com/revoke';
const SCOPE = 'https://www.googleapis.com/auth/drive';
const ENC_KEY_STORAGE = 'dp_enc_key';

// localStorage keys for PKCE — sessionStorage is unreliable on Android during OAuth redirects
const PKCE_VERIFIER_KEY = 'dp_pkce_verifier';
const PKCE_STATE_KEY = 'dp_oauth_state';
const PKCE_EXPIRY_KEY = 'dp_pkce_expiry';
const PKCE_TTL_MS = 10 * 60 * 1000; // 10 minutes

function base64urlEncode(data: Uint8Array): string {
  return btoa(String.fromCharCode(...data))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

async function generatePKCE(): Promise<{ verifier: string; challenge: string }> {
  const raw = crypto.getRandomValues(new Uint8Array(32));
  const verifier = base64urlEncode(raw);
  const encoded = new TextEncoder().encode(verifier);
  const digest = await crypto.subtle.digest('SHA-256', encoded);
  const challenge = base64urlEncode(new Uint8Array(digest));
  return { verifier, challenge };
}

function savePKCE(verifier: string, state: string): void {
  localStorage.setItem(PKCE_VERIFIER_KEY, verifier);
  localStorage.setItem(PKCE_STATE_KEY, state);
  localStorage.setItem(PKCE_EXPIRY_KEY, String(Date.now() + PKCE_TTL_MS));
}

function loadPKCE(): { verifier: string; state: string } | null {
  const verifier = localStorage.getItem(PKCE_VERIFIER_KEY);
  const state = localStorage.getItem(PKCE_STATE_KEY);
  const expiry = parseInt(localStorage.getItem(PKCE_EXPIRY_KEY) ?? '0', 10);
  if (!verifier || !state || Date.now() > expiry) {
    clearPKCE();
    return null;
  }
  return { verifier, state };
}

function clearPKCE(): void {
  localStorage.removeItem(PKCE_VERIFIER_KEY);
  localStorage.removeItem(PKCE_STATE_KEY);
  localStorage.removeItem(PKCE_EXPIRY_KEY);
}

async function getOrCreateEncKey(): Promise<CryptoKey> {
  const stored = localStorage.getItem(ENC_KEY_STORAGE);
  if (stored) {
    const raw = Uint8Array.from(atob(stored), (c) => c.charCodeAt(0));
    return crypto.subtle.importKey('raw', raw, 'AES-GCM', false, ['encrypt', 'decrypt']);
  }
  const key = await crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, true, ['encrypt', 'decrypt']);
  const exported = await crypto.subtle.exportKey('raw', key);
  localStorage.setItem(ENC_KEY_STORAGE, btoa(String.fromCharCode(...new Uint8Array(exported))));
  return key;
}

async function encryptToken(token: string): Promise<string> {
  const key = await getOrCreateEncKey();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const enc = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    new TextEncoder().encode(token),
  );
  const combined = new Uint8Array(12 + enc.byteLength);
  combined.set(iv, 0);
  combined.set(new Uint8Array(enc), 12);
  return btoa(String.fromCharCode(...combined));
}

async function decryptToken(cipher: string): Promise<string> {
  const key = await getOrCreateEncKey();
  const combined = Uint8Array.from(atob(cipher), (c) => c.charCodeAt(0));
  const iv = combined.slice(0, 12);
  const data = combined.slice(12);
  const dec = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, data);
  return new TextDecoder().decode(dec);
}

export async function startLogin(): Promise<void> {
  const { verifier, challenge } = await generatePKCE();
  const state = base64urlEncode(crypto.getRandomValues(new Uint8Array(16)));
  savePKCE(verifier, state);

  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    redirect_uri: REDIRECT_URI,
    response_type: 'code',
    scope: SCOPE,
    code_challenge: challenge,
    code_challenge_method: 'S256',
    access_type: 'offline',
    prompt: 'consent',
    state,
  });
  window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

export type OAuthCallbackResult =
  | { ok: true }
  | { ok: false; error: 'no_code' | 'state_mismatch' | 'verifier_missing' | 'exchange_failed'; detail?: string };

export async function handleOAuthCallback(): Promise<OAuthCallbackResult> {
  const url = new URL(window.location.href);
  const code = url.searchParams.get('code');
  const returnedState = url.searchParams.get('state');
  const errorParam = url.searchParams.get('error');

  // Clean URL regardless of outcome so the code isn't processed twice
  if (url.searchParams.has('code') || url.searchParams.has('error')) {
    window.history.replaceState({}, '', window.location.pathname);
  }

  if (errorParam) {
    clearPKCE();
    return { ok: false, error: 'no_code', detail: errorParam };
  }

  if (!code) return { ok: false, error: 'no_code' };

  const pkce = loadPKCE();
  if (!pkce) {
    return { ok: false, error: 'verifier_missing' };
  }

  if (returnedState !== pkce.state) {
    clearPKCE();
    return { ok: false, error: 'state_mismatch' };
  }

  clearPKCE();

  const tokenParams: Record<string, string> = {
    code,
    client_id: CLIENT_ID,
    code_verifier: pkce.verifier,
    grant_type: 'authorization_code',
    redirect_uri: REDIRECT_URI,
  };
  if (CLIENT_SECRET) tokenParams['client_secret'] = CLIENT_SECRET;
  const body = new URLSearchParams(tokenParams);

  let resp: Response;
  try {
    resp = await fetch(TOKEN_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
    });
  } catch (err) {
    return { ok: false, error: 'exchange_failed', detail: String(err) };
  }

  if (!resp.ok) {
    const detail = await resp.text().catch(() => `HTTP ${resp.status}`);
    console.error('Token exchange failed', resp.status, detail);
    return { ok: false, error: 'exchange_failed', detail: `${resp.status}: ${detail}` };
  }

  const data = await resp.json() as {
    access_token: string;
    refresh_token?: string;
    expires_in: number;
  };

  const db = await getDB();
  const encRefresh = data.refresh_token ? await encryptToken(data.refresh_token) : null;
  await db.put('tokens', {
    accessToken: data.access_token,
    encryptedRefreshToken: encRefresh,
    expiresAt: Date.now() + data.expires_in * 1000,
  }, 'main');

  return { ok: true };
}

export async function getAccessToken(): Promise<string> {
  const db = await getDB();
  const stored = await db.get('tokens', 'main') as {
    accessToken: string;
    encryptedRefreshToken: string | null;
    expiresAt: number;
  } | undefined;

  if (!stored) throw new Error('NOT_AUTHENTICATED');

  if (Date.now() < stored.expiresAt - 60_000) {
    return stored.accessToken;
  }

  if (!stored.encryptedRefreshToken) throw new Error('NO_REFRESH_TOKEN');

  const refreshToken = await decryptToken(stored.encryptedRefreshToken);
  const body = new URLSearchParams({
    client_id: CLIENT_ID,
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
  });

  const resp = await fetch(TOKEN_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });

  if (!resp.ok) {
    if (resp.status === 400 || resp.status === 401) {
      await signOut();
      throw new Error('REFRESH_FAILED');
    }
    throw new Error(`Token refresh HTTP ${resp.status}`);
  }

  const data = await resp.json() as { access_token: string; expires_in: number };
  await db.put('tokens', {
    ...stored,
    accessToken: data.access_token,
    expiresAt: Date.now() + data.expires_in * 1000,
  }, 'main');

  return data.access_token;
}

export async function isAuthenticated(): Promise<boolean> {
  try {
    const db = await getDB();
    const stored = await db.get('tokens', 'main');
    return !!stored;
  } catch {
    return false;
  }
}

export async function signOut(): Promise<void> {
  try {
    const db = await getDB();
    const stored = await db.get('tokens', 'main') as {
      accessToken: string;
      encryptedRefreshToken: string | null;
    } | undefined;

    if (stored?.encryptedRefreshToken) {
      try {
        const refreshToken = await decryptToken(stored.encryptedRefreshToken);
        await fetch(`${REVOKE_ENDPOINT}?token=${encodeURIComponent(refreshToken)}`, { method: 'POST' });
      } catch {
        // best effort
      }
    }

    await db.clear('tokens');
    await db.clear('playback');
    await db.clear('offlineQueue');
  } catch {
    // ignore
  }

  localStorage.removeItem(ENC_KEY_STORAGE);
  clearPKCE();

  if ('serviceWorker' in navigator) {
    const registrations = await navigator.serviceWorker.getRegistrations();
    for (const reg of registrations) {
      await reg.unregister();
    }
  }

  const cacheNames = await caches.keys();
  await Promise.all(cacheNames.map((name) => caches.delete(name)));

  window.location.reload();
}
