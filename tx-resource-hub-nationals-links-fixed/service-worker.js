// Simple offline-first service worker for GitHub Pages subpaths
const CACHE = 'txhub-v2';
const ASSETS = [
  './',
  './index.html',
  './offline.html',
  './css/styles.css',
  './js/directory.js',
  './docs/sos-checklist.html',
  './img/pwa-192.png',
  './manifest.webmanifest'
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.map(k => k === CACHE ? null : caches.delete(k))))
  );
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    caches.match(e.request).then((cached) => {
      const online = fetch(e.request).then((r) => {
        const copy = r.clone();
        caches.open(CACHE).then((c) => c.put(e.request, copy));
        return r;
      }).catch(() => cached || caches.match('./offline.html'));
      return cached || online;
    })
  );
});
