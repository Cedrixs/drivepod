import { clientsClaim } from 'workbox-core';
import { precacheAndRoute, cleanupOutdatedCaches, createHandlerBoundToURL } from 'workbox-precaching';
import { registerRoute, NavigationRoute } from 'workbox-routing';
import { NetworkFirst, NetworkOnly } from 'workbox-strategies';
import { ExpirationPlugin } from 'workbox-expiration';

declare const self: ServiceWorkerGlobalScope & {
  __WB_MANIFEST: Array<{ url: string; revision: string | null }>;
};

const SW_TOKEN_CACHE = 'dp-sw-tokens';
const SW_TOKEN_KEY = '/sw-token';
const STREAM_PREFIX = '/drivepod/stream/';
const TOKEN_REFRESH_WAIT_MS = 2_500;

precacheAndRoute(self.__WB_MANIFEST);
cleanupOutdatedCaches();

// Activation contrôlée par la page (mode "prompt" de vite-plugin-pwa) : elle
// envoie SKIP_WAITING quand aucune lecture n'est en cours, puis on prend la
// main sur les onglets ouverts pour que la page se recharge sur la nouvelle version.
self.addEventListener('message', (event) => {
  if ((event.data as { type?: string } | null)?.type === 'SKIP_WAITING') void self.skipWaiting();
});
clientsClaim();

// SPA navigation fallback
const navHandler = createHandlerBoundToURL('/drivepod/index.html');
registerRoute(new NavigationRoute(navHandler, { denylist: [/^\/api/, /\?code=/] }));

async function readCachedToken(): Promise<string | null> {
  const tokenCache = await caches.open(SW_TOKEN_CACHE);
  const tokenResp = await tokenCache.match(SW_TOKEN_KEY);
  if (!tokenResp) return null;
  const { token } = (await tokenResp.json()) as { token: string };
  return token;
}

// Proxy audio : /drivepod/stream/:fileId reçoit le header Bearer puis part vers Drive
registerRoute(
  ({ url }: { url: URL }) => url.pathname.startsWith(STREAM_PREFIX),
  async ({ request, url }: { request: Request; url: URL }): Promise<Response> => {
    const fileId = url.pathname.slice(STREAM_PREFIX.length);

    const fetchWithCachedToken = async (): Promise<Response | null> => {
      const token = await readCachedToken();
      if (!token) return null;

      const headers: Record<string, string> = { Authorization: `Bearer ${token}` };
      const range = request.headers.get('Range');
      if (range) headers['Range'] = range;

      return fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, { headers });
    };

    try {
      let resp = await fetchWithCachedToken();
      if (!resp) return new Response('Unauthorized: no cached token', { status: 401 });

      // Token en cache expiré (écoute > 1 h) : la page détient le refresh token,
      // on lui demande de renouveler puis on retente une fois
      if (resp.status === 401) {
        const clients = await self.clients.matchAll();
        for (const client of clients) client.postMessage({ type: 'DP_TOKEN_EXPIRED' });
        await new Promise((r) => setTimeout(r, TOKEN_REFRESH_WAIT_MS));
        resp = (await fetchWithCachedToken()) ?? resp;
      }

      return resp;
    } catch (err) {
      return new Response(String(err), { status: 500 });
    }
  },
);

// OAuth endpoints : jamais mis en cache
registerRoute(/^https:\/\/accounts\.google\.com\/.*/i, new NetworkOnly());
registerRoute(/^https:\/\/oauth2\.googleapis\.com\/.*/i, new NetworkOnly());

// Listes et métadonnées Drive : NetworkFirst avec cache court. Les contenus
// (alt=media : MP3 téléchargés, fichiers d'état, markdown) sont exclus : ils
// rempliraient ce cache de blobs audio et serviraient des états périmés.
registerRoute(
  ({ url }: { url: URL }) =>
    url.hostname === 'www.googleapis.com'
    && url.pathname.startsWith('/drive/')
    && url.searchParams.get('alt') !== 'media',
  new NetworkFirst({
    cacheName: 'drive-api-cache',
    networkTimeoutSeconds: 10,
    plugins: [new ExpirationPlugin({ maxEntries: 50, maxAgeSeconds: 300 })],
  }),
);
