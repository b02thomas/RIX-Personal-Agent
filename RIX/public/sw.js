// Enhanced Service Worker für RIX PWA with mobile optimizations
const CACHE_NAME = 'rix-v1.2';
const STATIC_CACHE = 'rix-static-v1.2';
const DYNAMIC_CACHE = 'rix-dynamic-v1.2';
const IMAGE_CACHE = 'rix-images-v1.2';
const MOBILE_CACHE = 'rix-mobile-v1.2';

// URLs für Caching - Optimiert für mobile PWA Performance
const STATIC_URLS = [
  '/',
  '/dashboard',
  '/dashboard/voice',
  '/dashboard/calendar',
  '/dashboard/intelligence',
  '/dashboard/news',
  '/dashboard/settings',
  '/dashboard/tasks',
  '/dashboard/projects',
  '/dashboard/routines',
  '/auth/signin',
  '/auth/signup',
  '/manifest.json'
];

// Mobile-specific critical resources
const MOBILE_CRITICAL_URLS = [
  '/_next/static/css/',
  '/_next/static/chunks/',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png'
];

// Enhanced Cache Strategien für optimale mobile Performance
const cacheStrategies = {
  // Network First mit mobile timeout optimization
  networkFirst: async (request, cacheName = DYNAMIC_CACHE, timeout = 3000) => {
    try {
      // Mobile-optimized timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);
      
      const response = await fetch(request, { 
        signal: controller.signal,
        // Mobile network optimization
        cache: 'default',
        mode: 'cors',
        credentials: 'same-origin'
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        const cache = await caches.open(cacheName);
        cache.put(request, response.clone());
      }
      return response;
    } catch (error) {
      const cache = await caches.open(cacheName);
      const cachedResponse = await cache.match(request);
      if (cachedResponse) {
        return cachedResponse;
      }
      throw error;
    }
  },

  // Cache First für Statische Assets
  cacheFirst: async (request, cacheName = STATIC_CACHE) => {
    const cache = await caches.open(cacheName);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    try {
      const response = await fetch(request);
      if (response.ok) {
        cache.put(request, response.clone());
      }
      return response;
    } catch (error) {
      throw error;
    }
  },

  // Stale While Revalidate für Assets die sich ändern können
  staleWhileRevalidate: async (request, cacheName = STATIC_CACHE) => {
    const cache = await caches.open(cacheName);
    const cachedResponse = await cache.match(request);
    
    const fetchPromise = fetch(request).then((response) => {
      if (response.ok) {
        cache.put(request, response.clone());
      }
      return response;
    }).catch(() => {});
    
    return cachedResponse || fetchPromise;
  }
};

// Enhanced Install Event with mobile optimization
self.addEventListener('install', (event) => {
  console.log('RIX Service Worker: Install with mobile optimizations');
  
  event.waitUntil(
    Promise.all([
      // Cache static resources
      caches.open(STATIC_CACHE).then((cache) => {
        return cache.addAll(STATIC_URLS);
      }),
      // Pre-cache mobile critical resources
      caches.open(MOBILE_CACHE).then((cache) => {
        // This will be populated dynamically as mobile resources are requested
        return Promise.resolve();
      })
    ])
  );
  
  self.skipWaiting();
});

// Enhanced Activate Event with cache cleanup
self.addEventListener('activate', (event) => {
  console.log('RIX Service Worker: Activate with enhanced cleanup');
  
  event.waitUntil(
    Promise.all([
      // Clean up old caches
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (![
              STATIC_CACHE, 
              DYNAMIC_CACHE, 
              IMAGE_CACHE, 
              MOBILE_CACHE
            ].includes(cacheName)) {
              console.log('Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }),
      // Initialize mobile-specific optimizations
      initializeMobileOptimizations()
    ])
  );
  
  self.clients.claim();
});

// Mobile-specific initialization
async function initializeMobileOptimizations() {
  // Set up mobile-specific cache strategies
  // This could include prefetching critical mobile resources
  console.log('Mobile optimizations initialized');
}

// Fetch Event - Überarbeitet für bessere Mobile Performance
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  // Skip chrome-extension and DevTools requests
  if (event.request.url.startsWith('chrome-extension://') || 
      event.request.url.startsWith('chrome-devtools://') ||
      event.request.url.includes('_next/webpack-hmr')) {
    return;
  }

  const url = new URL(event.request.url);
  
  // Handle different request types with appropriate strategies
  if (url.pathname.startsWith('/api/n8n/webhook/')) {
    // N8N Webhooks - Always network only
    return;
  } else if (url.pathname.startsWith('/api/')) {
    // API requests - Network first with short cache
    event.respondWith(
      cacheStrategies.networkFirst(event.request, DYNAMIC_CACHE)
        .catch(() => {
          // Return fallback offline response for API failures
          return new Response(JSON.stringify({ 
            error: 'Offline', 
            message: 'API nicht verfügbar. Versuchen Sie es später erneut.' 
          }), {
            headers: { 'Content-Type': 'application/json' },
            status: 503
          });
        })
    );
  } else if (event.request.destination === 'document') {
    // HTML documents - Network first for freshness
    event.respondWith(
      cacheStrategies.networkFirst(event.request, DYNAMIC_CACHE)
        .catch(() => {
          // Return cached version or offline page
          return caches.match('/') || 
                 new Response('<!DOCTYPE html><html><head><title>RIX - Offline</title></head><body><h1>RIX ist offline</h1><p>Bitte überprüfen Sie Ihre Internetverbindung.</p></body></html>', {
                   headers: { 'Content-Type': 'text/html' }
                 });
        })
    );
  } else if (event.request.destination === 'image' || 
             url.pathname.startsWith('/icons/') ||
             url.pathname.match(/\.(png|jpg|jpeg|svg|gif|webp|ico)$/)) {
    // Images - Cache first for better performance
    event.respondWith(
      cacheStrategies.cacheFirst(event.request, IMAGE_CACHE)
        .catch(() => {
          // Return placeholder image if not cached
          return new Response('<svg width="200" height="200" xmlns="http://www.w3.org/2000/svg"><rect width="200" height="200" fill="#f3f4f6"/><text x="100" y="100" text-anchor="middle" fill="#6b7280">Bild nicht verfügbar</text></svg>', {
            headers: { 'Content-Type': 'image/svg+xml' }
          });
        })
    );
  } else if (event.request.destination === 'script' || 
             event.request.destination === 'style' ||
             url.pathname.includes('/_next/static/')) {
    // Static assets - Stale while revalidate for balance
    event.respondWith(
      cacheStrategies.staleWhileRevalidate(event.request, STATIC_CACHE)
    );
  } else {
    // Other requests - Try cache first, then network
    event.respondWith(
      caches.match(event.request).then((response) => {
        return response || fetch(event.request).catch(() => {
          // Return basic offline response
          return new Response('Resource nicht verfügbar offline', { status: 503 });
        });
      })
    );
  }
});

// Push Notification Handler (für zukünftige Features)
self.addEventListener('push', (event) => {
  console.log('RIX Service Worker: Push Event');
  
  const options = {
    body: event.data ? event.data.text() : 'Neue Nachricht von RIX',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'Öffnen',
        icon: '/icons/icon-72x72.png'
      },
      {
        action: 'close',
        title: 'Schließen',
        icon: '/icons/icon-72x72.png'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification('RIX', options)
  );
});

// Notification Click Handler
self.addEventListener('notificationclick', (event) => {
  console.log('RIX Service Worker: Notification Click');
  
  event.notification.close();

  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/dashboard/voice')
    );
  }
});

// Background Sync (für zukünftige Features)
self.addEventListener('sync', (event) => {
  console.log('RIX Service Worker: Background Sync', event.tag);
  
  if (event.tag === 'background-sync') {
    event.waitUntil(doBackgroundSync());
  }
});

async function doBackgroundSync() {
  try {
    // Hier können Offline-Aktionen synchronisiert werden
    console.log('RIX Service Worker: Background sync completed');
  } catch (error) {
    console.error('RIX Service Worker: Background sync failed', error);
  }
}

// Message Handler für Kommunikation mit der App
self.addEventListener('message', (event) => {
  console.log('RIX Service Worker: Message received', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({ version: '1.0.0' });
  }
}); 