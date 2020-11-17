const assets = [
  '/',
  '/index.html',
  '/bin/bundle.min.js',
  '/src/style.css',
  '/ext/alata-latin-400.woff2',
  '/ext/alata-latin-400.woff',
  '/ext/fa.min.js',
  '/ext/notyf.min.js',
  '/jj2008-06-14.mk4_archive.torrent'
];

self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open('assets')
      .then(function(cache) {
        return cache.addAll(assets);
      })
  );
});

self.addEventListener('fetch', function(event) {
  event.respondWith(
    caches.match(event.request)
      .then(function(response) {
        if (response) {
          return response;
        }
        return fetch(event.request);
      }
    )
  );
});