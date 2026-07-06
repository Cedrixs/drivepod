import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import './index.css';
import App from './App';
import { getAccessToken, invalidateAccessToken } from './auth/auth';

// Auto-reload the page when a new service worker version is activated.
// Without this, the old JS bundle stays in memory even after a new SW installs.
registerSW({
  onNeedRefresh() {
    window.location.reload();
  },
  onOfflineReady() {
    // app is ready for offline use
  },
});

// Le SW n'a pas accès au refresh token (IndexedDB chiffré) : quand son token
// en cache expire pendant le streaming, il demande à la page de le renouveler.
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.addEventListener('message', (event: MessageEvent) => {
    if ((event.data as { type?: string } | null)?.type === 'DP_TOKEN_EXPIRED') {
      void invalidateAccessToken()
        .then(() => getAccessToken())
        .catch(() => { /* pas connecté ou hors-ligne */ });
    }
  });
}

const root = document.getElementById('root');
if (!root) throw new Error('No root element');

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
