
const CACHE_NAME = 'ez-zel-v3-offline-first';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache))
  );
  self.skipWaiting();
});

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

self.addEventListener('fetch', event => {
  const request = event.request;
  
  // Skip cross-origin requests and API calls
  if (!request.url.startsWith(self.location.origin) || request.url.includes('/api/')) {
      return;
  }

  // Stale-While-Revalidate strategy for assets (JS, CSS, Images, Fonts)
  if (request.destination === 'script' || request.destination === 'style' || request.destination === 'image' || request.destination === 'font') {
      event.respondWith(
          caches.open(CACHE_NAME).then(cache => {
              return cache.match(request).then(cachedResponse => {
                  const fetchedResponse = fetch(request).then(networkResponse => {
                      cache.put(request, networkResponse.clone());
                      return networkResponse;
                  }).catch(() => {
                      // Ignore network errors for assets if we have cache
                  });
                  return cachedResponse || fetchedResponse;
              });
          })
      );
      return;
  }

  // Network-First, fallback to Cache for HTML/Navigation
  if (request.mode === 'navigate') {
      event.respondWith(
          fetch(request).then(response => {
              return caches.open(CACHE_NAME).then(cache => {
                  cache.put(request, response.clone());
                  return response;
              });
          }).catch(() => {
              return caches.match('/index.html');
          })
      );
      return;
  }

  // Default fallback
  event.respondWith(
    caches.match(request).then(response => {
      return response || fetch(request);
    })
  );
});