const CACHE_NAME = 'noa-ai-pwa-v4';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon.svg'
];

// Install Event - Pre-cache essential static assets & skip waiting immediately
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[ServiceWorker] Pre-caching static assets');
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn('[ServiceWorker] Pre-cache warning:', err);
      });
    })
  );
});

// Activate Event - Clean up old caches & claim clients immediately
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[ServiceWorker] Removing old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Event - Universal Network-First Strategy for ALL API calls & dynamic assets
self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);

  // Skip non-GET requests or browser extension URLs
  if (request.method !== 'GET' || !url.protocol.startsWith('http')) {
    return;
  }

  // Network-First Strategy for ALL GET requests (API, JS, CSS, HTML, images)
  event.respondWith(
    fetch(request)
      .then((networkResponse) => {
        // Cache valid HTTP 200 responses for offline fallback
        if (networkResponse && networkResponse.status === 200) {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseClone);
          });
        }
        return networkResponse;
      })
      .catch((error) => {
        console.warn('[ServiceWorker] Network request failed, serving from cache:', url.pathname, error);
        return caches.match(request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }

          // If JSON API request failed offline
          if (url.pathname.startsWith('/api/')) {
            return new Response(
              JSON.stringify({
                success: false,
                offline: true,
                error: 'חיבור האינטרנט אינו זמין. המערכת פועלת במצב אופליין.',
              }),
              { headers: { 'Content-Type': 'application/json' } }
            );
          }

          // If navigation mode failed offline, serve index.html from cache
          if (request.mode === 'navigate') {
            return caches.match('/index.html') || caches.match('/');
          }

          return new Response('Offline', { status: 503, statusText: 'Service Unavailable' });
        });
      })
  );
});

// Background Sync Listener - Handles queued offline actions
self.addEventListener('sync', (event) => {
  console.log('[ServiceWorker] Background Sync Triggered:', event.tag);
  if (event.tag === 'noa-sync-queue' || event.tag === 'outbound-message-sync') {
    event.waitUntil(
      self.clients.matchAll().then((clients) => {
        clients.forEach((client) => {
          client.postMessage({ type: 'BACKGROUND_SYNC_TRIGGERED', tag: event.tag });
        });
      })
    );
  }
});

// Push Event - Background Web Push Notifications
self.addEventListener('push', (event) => {
  let data = { title: 'נועה AI - הודעה חדשה 💬', body: 'התקבלה עדכון חדש במערכת SabanOS', icon: '/icon.svg', badge: '/icon.svg' };
  
  if (event.data) {
    try {
      data = { ...data, ...event.data.json() };
    } catch (e) {
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body,
    icon: data.icon || '/icon.svg',
    badge: data.badge || '/icon.svg',
    dir: 'rtl',
    lang: 'he',
    vibrate: [100, 50, 100, 50, 150],
    data: data.url || '/',
    actions: [
      { action: 'open', title: 'פתח אפליקציה' },
      { action: 'close', title: 'סגור' }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Notification Click Event - Focus or Open Window
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'close') return;

  const urlToOpen = event.notification.data || '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (let client of windowClients) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(urlToOpen);
      }
    })
  );
});

// Message Event - Inter-process communication with client UI
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

