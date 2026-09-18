import { describe, it, expect, vi, beforeEach } from 'vitest';

const getAccessToken = vi.fn<() => Promise<string>>();
const invalidateAccessToken = vi.fn<() => Promise<void>>();

vi.mock('../auth/auth', () => ({
  getAccessToken: () => getAccessToken(),
  invalidateAccessToken: () => invalidateAccessToken(),
}));

const { authedFetch, DriveApiError, escapeQueryValue } = await import('../drive/client');

function response(status: number, body = ''): Response {
  return new Response(body, { status });
}

describe('authedFetch', () => {
  const fetchMock = vi.fn<typeof fetch>();

  beforeEach(() => {
    vi.useFakeTimers();
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
    getAccessToken.mockReset().mockResolvedValue('tok');
    invalidateAccessToken.mockReset().mockResolvedValue(undefined);
  });

  it('sends the bearer token', async () => {
    fetchMock.mockResolvedValueOnce(response(200, '{}'));
    const resp = await authedFetch('https://x/y');
    expect(resp.ok).toBe(true);
    const init = fetchMock.mock.calls[0][1] as RequestInit;
    expect((init.headers as Record<string, string>).Authorization).toBe('Bearer tok');
  });

  it('invalidates and retries once on 401', async () => {
    fetchMock.mockResolvedValueOnce(response(401)).mockResolvedValueOnce(response(200));
    await authedFetch('https://x/y');
    expect(invalidateAccessToken).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('retries on network errors with backoff', async () => {
    fetchMock.mockRejectedValueOnce(new TypeError('Failed to fetch')).mockResolvedValueOnce(response(200));
    const pending = authedFetch('https://x/y');
    await vi.advanceTimersByTimeAsync(2_000);
    await expect(pending).resolves.toBeInstanceOf(Response);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('throws a typed error with the status for non retryable failures', async () => {
    fetchMock.mockResolvedValueOnce(response(404, 'nope'));
    const err = await authedFetch('https://x/y').catch((e: unknown) => e);
    expect(err).toBeInstanceOf(DriveApiError);
    expect((err as InstanceType<typeof DriveApiError>).status).toBe(404);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});

describe('escapeQueryValue', () => {
  it('escapes quotes and backslashes for Drive q= filters', () => {
    expect(escapeQueryValue("L'économie")).toBe("L\\'économie");
    expect(escapeQueryValue('a\\b')).toBe('a\\\\b');
  });
});
