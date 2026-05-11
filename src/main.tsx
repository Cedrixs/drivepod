import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import './index.css';
import App from './App';

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

const root = document.getElementById('root');
if (!root) throw new Error('No root element');

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
