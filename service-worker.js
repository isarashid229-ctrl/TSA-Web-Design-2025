// Texas Resource Hub - Service Worker
// Implements offline-first caching strategy for mutual aid PWA

const CACHE_NAME = 'tx-resource-hub-v1.0.0';
const STATIC_CACHE = 'tx-resource-hub-static-v1.0.0';
const DYNAMIC_CACHE = 'tx-resource-hub-dynamic-v1.0.0';

// Shell files to precache (app shell)
const STATIC_FILES = [
  './',
  './index.html',
  './resources.html',
  './highlights.html',
  './submit.html',
  './reference.html',
  './offline.html',
  './css/styles.css',
  './js/app.js',
  './js/directory.js',
  './js/form.js',
  './js/pdf-pack.js',
  './js/pwa-install.js',
  './manifest.webmanifest'
];

// API/data endpoints for runtime caching
const API_ENDPOINTS = [
  './data/resources.json'
];

// Install event - precache shell files
self.addEventListener('install', event => {
  console.log('[SW] Installing service worker...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then(cache => {
        console.log('[SW] Precaching shell files...');
        return cache.addAll(STATIC_FILES);
      })
      .then(() => {
        console.log('[SW] Shell files precached successfully');
        return self.skipWaiting();
      })
      .catch(error => {
        console.error('[SW] Failed to precache shell files:', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  console.log('[SW] Activating service worker...');
  
  event.waitUntil(
    caches.keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
              console.log('[SW] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('[SW] Service worker activated');
        return self.clients.claim();
      })
  );
});

// Fetch event - implement caching strategies
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }
  
  // Skip chrome-extension and other non-http requests
  if (!url.protocol.startsWith('http')) {
    return;
  }
  
  // Handle different types of requests
  if (isStaticFile(request.url)) {
    // Static files: Cache First strategy
    event.respondWith(cacheFirst(request));
  } else if (isAPIRequest(request.url)) {
    // API/Data: Stale While Revalidate strategy
    event.respondWith(staleWhileRevalidate(request));
  } else if (isNavigationRequest(request)) {
    // Navigation: Network First with offline fallback
    event.respondWith(networkFirstWithFallback(request));
  } else {
    // Other requests: Network First
    event.respondWith(networkFirst(request));
  }
});

// Cache First strategy for static assets
async function cacheFirst(request) {
  try {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(STATIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.error('[SW] Cache first failed:', error);
    return new Response('Network error', { status: 503 });
  }
}

// Stale While Revalidate for API/data
async function staleWhileRevalidate(request) {
  const cache = await caches.open(DYNAMIC_CACHE);
  const cachedResponse = await cache.match(request);
  
  const fetchPromise = fetch(request).then(networkResponse => {
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  }).catch(error => {
    console.error('[SW] Network request failed:', error);
    return null;
  });
  
  // Return cached version immediately, update in background
  return cachedResponse || await fetchPromise;
}

// Network First with offline fallback for navigation
async function networkFirstWithFallback(request) {
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.log('[SW] Network failed, trying cache...');
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Return offline page for navigation requests
    if (isNavigationRequest(request)) {
      return caches.match('./offline.html');
    }
    
    return new Response('Offline', { status: 503 });
  }
}

// Network First for other requests
async function networkFirst(request) {
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    const cachedResponse = await caches.match(request);
    return cachedResponse || new Response('Offline', { status: 503 });
  }
}

// Helper functions
function isStaticFile(url) {
  return url.includes('.css') || 
         url.includes('.js') || 
         url.includes('.png') || 
         url.includes('.jpg') || 
         url.includes('.jpeg') || 
         url.includes('.gif') || 
         url.includes('.svg') || 
         url.includes('.webp') ||
         url.includes('.woff') ||
         url.includes('.woff2') ||
         url.includes('.ttf') ||
         url.includes('.eot');
}

function isAPIRequest(url) {
  return url.includes('./data/') || 
         url.includes('.json') ||
         url.includes('./api/');
}

function isNavigationRequest(request) {
  return request.mode === 'navigate' || 
         (request.method === 'GET' && request.headers.get('accept').includes('text/html'));
}

// Background sync for offline form submissions
self.addEventListener('sync', event => {
  if (event.tag === 'background-sync') {
    console.log('[SW] Background sync triggered');
    event.waitUntil(doBackgroundSync());
  }
});

async function doBackgroundSync() {
  // Handle offline form submissions when back online
  try {
    const cache = await caches.open(DYNAMIC_CACHE);
    const requests = await cache.keys();
    
    for (const request of requests) {
      if (request.url.includes('./submit') && request.method === 'POST') {
        try {
          await fetch(request);
          await cache.delete(request);
          console.log('[SW] Offline submission synced successfully');
        } catch (error) {
          console.error('[SW] Failed to sync offline submission:', error);
        }
      }
    }
  } catch (error) {
    console.error('[SW] Background sync failed:', error);
  }
}

// Push notifications for resource updates
self.addEventListener('push', event => {
  if (event.data) {
    const data = event.data.json();
    const options = {
      body: data.body,
      icon: './manifest.webmanifest',
      badge: './manifest.webmanifest',
      tag: 'resource-update',
      data: data.url,
      actions: [
        {
          action: 'view',
          title: 'View Resource',
          icon: './manifest.webmanifest'
        },
        {
          action: 'close',
          title: 'Close',
          icon: './manifest.webmanifest'
        }
      ]
    };
    
    event.waitUntil(
      self.registration.showNotification(data.title, options)
    );
  }
});

// Handle notification clicks
self.addEventListener('notificationclick', event => {
  event.notification.close();
  
  if (event.action === 'view' && event.notification.data) {
    event.waitUntil(
      clients.openWindow(event.notification.data)
    );
  }
});

// Message handling for communication with main thread
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({ version: CACHE_NAME });
  }
});

console.log('[SW] Service worker script loaded');