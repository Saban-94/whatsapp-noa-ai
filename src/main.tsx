import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Register ServiceWorker with automatic update on load to avoid stale PWA cache
if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((registration) => {
        console.log('[ServiceWorker] Registered with scope:', registration.scope);
        registration.update().catch((err) => {
          console.warn('[ServiceWorker] Update check error:', err);
        });
      })
      .catch((err) => {
        console.warn('[ServiceWorker] Registration error:', err);
      });
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

