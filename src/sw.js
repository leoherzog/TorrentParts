const CACHE_NAME = 'torrent-parts-v2';
const ASSETS = [
  '/',
  '/index.html',
  '/src/parse.js',
  '/src/style.css',
  '/ext/alata-v9-latin-regular.woff2',
  '/ext/fa.min.js',
  '/ext/jj2008-06-14.mk4_archive.torrent',
  '/favicon.ico',
  '/manifest.webmanifest',
];

self.addEventListener('install', (e) => {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS)));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    Promise.all([
      self.clients.claim(),
      caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))),
    ])
  );
});

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;

  const url = new URL(e.request.url);

  // Only cache same-origin requests
  if (url.origin !== self.location.origin) return;

  // Cache-first for local assets
  e.respondWith(caches.match(e.request).then((cached) => cached || fetch(e.request)));
});
