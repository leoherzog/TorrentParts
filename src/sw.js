const cache_name = 'torrent-parts-v1';
const assets = ['/', '/index.html', '/src/parse.js', '/src/style.css', '/ext/alata-v9-latin-regular.woff2', '/ext/alata-v9-latin-regular.ttf', '/ext/fa.min.js', '/ext/jj2008-06-14.mk4_archive.torrent', '/favicon.ico', '/manifest.webmanifest'];

self.addEventListener('install', function (event) {
  self.skipWaiting(); // Force activate new SW immediately
  event.waitUntil(
    caches
      .open(cache_name)
      .then(function (cache) {
        return cache.addAll(assets);
      })
      .catch(function (error) {
        console.error('Service worker install failed:', error);
      })
  );
});

self.addEventListener('activate', function (event) {
  event.waitUntil(
    Promise.all([
      // Take control of all clients immediately
      self.clients.claim(),
      // Clean up old caches
      caches.keys().then(function (cacheNames) {
        return Promise.all(
          cacheNames.map(function (cacheName) {
            if (cacheName !== cache_name) {
              console.log('Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }),
    ])
  );
});

self.addEventListener('fetch', function (event) {
  // Only cache GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  // Network-first strategy for external requests
  const requestUrl = new URL(event.request.url);
  if (requestUrl.origin !== self.location.origin) {
    event.respondWith(
      fetch(event.request)
        .then(function (response) {
          return response;
        })
        .catch(function () {
          console.log('Network request failed, trying cache:', event.request.url);
          return caches.match(event.request);
        })
    );
    return;
  }

  // Cache-first strategy for app assets
  event.respondWith(
    caches
      .match(event.request)
      .then(function (response) {
        if (response) {
          return response;
        }
        return fetch(event.request).then(function (response) {
          // Cache successful responses for future use
          if (response && response.status === 200) {
            const responseClone = response.clone();
            caches.open(cache_name).then(function (cache) {
              cache.put(event.request, responseClone);
            });
          }
          return response;
        });
      })
      .catch(function (error) {
        console.error('Service worker fetch failed:', error);
        // Could return offline fallback page here if needed
      })
  );
});
