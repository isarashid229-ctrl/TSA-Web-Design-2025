
self.addEventListener('install', (e)=>{ self.skipWaiting(); });
self.addEventListener('activate', (e)=>{ e.waitUntil(self.clients.claim()); });
self.addEventListener('fetch', (event)=>{
  const req = event.request;
  if (req.mode === 'navigate'){
    event.respondWith(fetch(req).catch(()=>caches.match('/index.html')));
  }
});
