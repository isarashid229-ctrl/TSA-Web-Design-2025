
self.addEventListener('install', e=>{
  e.waitUntil(caches.open('txhub-v1').then(c=>c.addAll(['./','./index.html','./css/styles.css','./js/directory.js','./docs/sos-checklist.html','./img/pwa-192.png','./offline.html'])));
  self.skipWaiting();
});
self.addEventListener('activate', e=>{ e.waitUntil(self.clients.claim()); });
self.addEventListener('fetch', e=>{
  if(e.request.method!=='GET') return;
  e.respondWith(caches.match(e.request).then(cached=>{
    const online = fetch(e.request).then(r=>{ const copy=r.clone(); caches.open('txhub-v1').then(c=>c.put(e.request,copy)); return r; }).catch(()=> cached || caches.match('./offline.html'));
    return cached || online;
  }));
});
