import { getAccessToken, invalidateAccessToken } from '../auth/auth';

export const DRIVE_BASE = 'https://www.googleapis.com/drive/v3';
export const DRIVE_UPLOAD_BASE = 'https://www.googleapis.com/upload/drive/v3';

export class DriveApiError extends Error {
  readonly status: number;

  constructor(status: number, detail: string) {
    super(`Drive API ${status}${detail ? `: ${detail}` : ''}`);
    this.name = 'DriveApiError';
    this.status = status;
  }
}

export function isDriveApiError(err: unknown, status?: number): err is DriveApiError {
  return err instanceof DriveApiError && (status === undefined || err.status === status);
}

export interface FetchOptions {
  method?: string;
  body?: BodyInit;
  headers?: Record<string, string>;
  retries?: number;
}

function backoffDelay(attempt: number): Promise<void> {
  const ms = Math.min(1000 * Math.pow(2, attempt) + Math.random() * 500, 30_000);
  return new Promise((r) => setTimeout(r, ms));
}

// Fetch authentifié vers Google avec la même résilience partout :
// - coupure réseau (tunnel, métro) : retry avec backoff exponentiel
// - 401 : le token est invalidé puis renouvelé une fois
// - 429 / 5xx : retry avec backoff
// Le token est relu à chaque tentative, un backoff long pouvant dépasser son expiration.
export async function authedFetch(url: string, options: FetchOptions = {}): Promise<Response> {
  const { method = 'GET', body, headers = {}, retries = 4 } = options;
  let authRetried = false;

  for (let attempt = 0; attempt <= retries; attempt++) {
    const token = await getAccessToken();

    let resp: Response;
    try {
      resp = await fetch(url, {
        method,
        headers: { Authorization: `Bearer ${token}`, ...headers },
        body,
      });
    } catch (err) {
      // Hors-ligne déclaré par le navigateur : inutile d'attendre les backoffs
      if (attempt < retries && navigator.onLine) {
        await backoffDelay(attempt);
        continue;
      }
      throw err instanceof Error ? err : new Error(String(err));
    }

    if (resp.ok) return resp;

    if (resp.status === 401 && !authRetried) {
      authRetried = true;
      await invalidateAccessToken();
      continue;
    }

    if ((resp.status === 429 || resp.status >= 500) && attempt < retries) {
      await backoffDelay(attempt);
      continue;
    }

    const detail = await resp.text().catch(() => '');
    throw new DriveApiError(resp.status, detail);
  }

  throw new Error('Max retries exceeded');
}

export async function driveRequest<T>(path: string, options: FetchOptions = {}): Promise<T> {
  const resp = await authedFetch(`${DRIVE_BASE}${path}`, options);
  return resp.json() as Promise<T>;
}

// Échappe une valeur insérée dans une requête `q=` Drive ("L'économie" -> "L\'économie")
export function escapeQueryValue(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}
