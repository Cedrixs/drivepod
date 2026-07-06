import { precacheAndRoute, cleanupOutdatedCaches, createHandlerBoundToURL } from 'workbox-precaching';
import { registerRoute, NavigationRoute } from 'workbox-routing';
import { NetworkFirst, NetworkOnly } from 'workbox-strategies';
import { ExpirationPlugin } from 'workbox-expiration';

declare const self: ServiceWorkerGlobalScope & {
  __WB_MANIFEST: Array<{ url: string; revision: string | null }>;
};

precacheAndRoute(self.__WB_MANIFEST);
cleanupOutdatedCaches();

// SPA navigation fallback
const navHandler = createHandlerBoundToURL('/drivepod/index.html');
registerRoute(new NavigationRoute(navHandler, { denylist: [/^\/api/, /\?code=/] }));

// Audio auth proxy: intercept /drivepod/stream/:fileId, add Bearer token, proxy to Drive
registerRoute(
  ({ url }: { url: URL }) => url.pathname.startsWith('/drivepod/stream/'),
  async ({ request, url }: { request: Request; url: URL }): Promise<Response> => {
    const fileId = url.pathname.replace('/drivepod/stream/', '');

    const fetchWithCachedToken = async (): Promise<Response | null> => {
      const tokenCache = await caches.open('dp-sw-tokens');
      const tokenResp = await tokenCache.match('/sw-token');
      if (!tokenResp) return null;

      const { token } = (await tokenResp.json()) as { token: string };
      const headers: Record<string, string> = { Authorization: `Bearer ${token}` };

      const range = request.headers.get('Range');
      if (range) headers['Range'] = range;

      return fetch(
        `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
        { headers },
      );
    };

    try {
      let resp = await fetchWithCachedToken();
      if (!resp) return new Response('Unauthorized: no cached token', { status: 401 });

      // Token en cache expiré (écoute > 1 h) : la page détient le refresh token,
      // on lui demande de renouveler puis on retente une fois
      if (resp.status === 401) {
        const clients = await self.clients.matchAll();
        for (const client of clients) client.postMessage({ type: 'DP_TOKEN_EXPIRED' });
        await new Promise((r) => setTimeout(r, 2_500));
        resp = (await fetchWithCachedToken()) ?? resp;
      }

      return resp;
    } catch (err) {
      return new Response(String(err), { status: 500 });
    }
  },
);

// OAuth endpoints — never cache
registerRoute(/^https:\/\/accounts\.google\.com\/.*/i, new NetworkOnly());
registerRoute(/^https:\/\/oauth2\.googleapis\.com\/.*/i, new NetworkOnly());

// Drive API (list/metadata calls) — cache with NetworkFirst
registerRoute(
  /^https:\/\/www\.googleapis\.com\/drive\/.*/i,
  new NetworkFirst({
    cacheName: 'drive-api-cache',
    networkTimeoutSeconds: 10,
    plugins: [new ExpirationPlugin({ maxEntries: 50, maxAgeSeconds: 300 })],
  }),
);
