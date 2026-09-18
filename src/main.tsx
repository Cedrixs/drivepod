import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import './index.css';
import App from './App';
import { getAccessToken, invalidateAccessToken } from './auth/auth';
import { player } from './player/player';
import { toast } from './lib/toast';

// Délai avant d'appliquer une mise à jour après une pause : le temps qu'un
// enchaînement automatique (fin de piste puis suivante) démarre, s'il y en a un
const UPDATE_AFTER_PAUSE_MS = 1_500;

// Mise à jour de l'app sans jamais couper une écoute : le nouveau Service
// Worker attend (mode "prompt"), on l'active dès que rien ne joue. La page se
// recharge alors toute seule (événement "controlling" de workbox-window).
const updateSW = registerSW({
  onNeedRefresh() {
    let done = false;
    let timer: ReturnType<typeof setTimeout> | null = null;

    const apply = (): void => {
      if (done || player.isPlaying()) return;
      done = true;
      off();
      document.removeEventListener('visibilitychange', onVisibility);
      void updateSW(true);
    };
    const scheduleApply = (): void => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(apply, UPDATE_AFTER_PAUSE_MS);
    };
    const onVisibility = (): void => {
      if (document.visibilityState === 'hidden') scheduleApply();
    };
    const off = player.on((event) => {
      if (event.type === 'pause' || event.type === 'ended') scheduleApply();
    });
    document.addEventListener('visibilitychange', onVisibility);

    apply();
    if (!done) toast.info('Mise à jour prête, elle s\'appliquera à la prochaine pause');
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
