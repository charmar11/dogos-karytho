const CACHE_NAME = 'dogos-karytho-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/src/main.jsx',
  '/src/App.jsx',
];

// Install event - cache resources
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', event => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') return;

  // Skip cross-origin requests
  if (!event.request.url.startsWith(self.location.origin)) return;

  event.respondWith(
    caches.match(event.request)
      .then(cachedResponse => {
        // Return cached version or fetch from network
        return cachedResponse || fetch(event.request);
      })
      .catch(() => {
        // If both cache and network fail, return a generic response
        return new Response('Offline - Content not available', {
          headers: { 'Content-Type': 'text/plain' }
        });
      })
  );
});

// Background sync for sales when back online
self.addEventListener('sync', event => {
  if (event.tag === 'sales-sync') {
    event.waitUntil(syncSales());
  }
});

async function syncSales() {
  // Here you would implement logic to sync pending sales
  console.log('Syncing offline sales...');
}
