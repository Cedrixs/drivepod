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
    try {
      const tokenCache = await caches.open('dp-sw-tokens');
      const tokenResp = await tokenCache.match('/sw-token');
      if (!tokenResp) return new Response('Unauthorized: no cached token', { status: 401 });

      const { token } = (await tokenResp.json()) as { token: string };
      const headers: Record<string, string> = { Authorization: `Bearer ${token}` };

      const range = request.headers.get('Range');
      if (range) headers['Range'] = range;

      return await fetch(
        `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
        { headers },
      );
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
