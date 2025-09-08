// Enhanced Service Worker for PWA functionality
const CACHE_NAME = 'innkt-pwa-v1.0.0';
const STATIC_CACHE = 'innkt-static-v1.0.0';
const DYNAMIC_CACHE = 'innkt-dynamic-v1.0.0';
const API_CACHE = 'innkt-api-v1.0.0';
const IMAGE_CACHE = 'innkt-images-v1.0.0';

// Cache strategies
const CACHE_STRATEGIES = {
  STATIC: 'cache-first',
  DYNAMIC: 'network-first',
  API: 'network-first',
  IMAGES: 'cache-first'
};

// Files to cache on install
const STATIC_FILES = [
  '/',
  '/static/js/bundle.js',
  '/static/css/main.css',
  '/manifest.json',
  '/favicon.ico',
  '/offline.html'
];

// API endpoints to cache
const API_ENDPOINTS = [
  '/api/auth/me',
  '/api/posts',
  '/api/users',
  '/api/groups',
  '/api/notifications'
];

// Image patterns to cache
const IMAGE_PATTERNS = [
  /\.(?:png|jpg|jpeg|svg|gif|webp)$/,
  /\/api\/uploads\//,
  /\/avatars\//,
  /\/covers\//
];

// Install event - cache static files
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...');
  
  event.waitUntil(
    Promise.all([
      // Cache static files
      caches.open(STATIC_CACHE).then((cache) => {
        console.log('Service Worker: Caching static files');
        return cache.addAll(STATIC_FILES);
      }),
      
      // Cache API endpoints
      caches.open(API_CACHE).then((cache) => {
        console.log('Service Worker: Caching API endpoints');
        return cache.addAll(API_ENDPOINTS.map(url => new Request(url, { method: 'GET' })));
      })
    ]).then(() => {
      console.log('Service Worker: Installation complete');
      return self.skipWaiting();
    })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating...');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== STATIC_CACHE && 
              cacheName !== DYNAMIC_CACHE && 
              cacheName !== API_CACHE && 
              cacheName !== IMAGE_CACHE) {
            console.log('Service Worker: Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('Service Worker: Activation complete');
      return self.clients.claim();
    })
  );
});

// Fetch event - implement caching strategies
self.addEventListener('fetch', (event) => {
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
  
  // Determine cache strategy based on request type
  const strategy = getCacheStrategy(request);
  
  switch (strategy) {
    case CACHE_STRATEGIES.STATIC:
      event.respondWith(cacheFirst(request, STATIC_CACHE));
      break;
    case CACHE_STRATEGIES.DYNAMIC:
      event.respondWith(networkFirst(request, DYNAMIC_CACHE));
      break;
    case CACHE_STRATEGIES.API:
      event.respondWith(networkFirst(request, API_CACHE));
      break;
    case CACHE_STRATEGIES.IMAGES:
      event.respondWith(cacheFirst(request, IMAGE_CACHE));
      break;
    default:
      event.respondWith(networkFirst(request, DYNAMIC_CACHE));
  }
});

// Cache-first strategy
async function cacheFirst(request, cacheName) {
  try {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.error('Cache-first strategy failed:', error);
    return getOfflineResponse(request);
  }
}

// Network-first strategy
async function networkFirst(request, cacheName) {
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.log('Network failed, trying cache:', error);
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    return getOfflineResponse(request);
  }
}

// Get cache strategy for request
function getCacheStrategy(request) {
  const url = new URL(request.url);
  
  // Static files
  if (url.pathname.startsWith('/static/') || 
      url.pathname.endsWith('.js') || 
      url.pathname.endsWith('.css') ||
      url.pathname.endsWith('.html')) {
    return CACHE_STRATEGIES.STATIC;
  }
  
  // API requests
  if (url.pathname.startsWith('/api/')) {
    return CACHE_STRATEGIES.API;
  }
  
  // Images
  if (IMAGE_PATTERNS.some(pattern => pattern.test(url.pathname))) {
    return CACHE_STRATEGIES.IMAGES;
  }
  
  // Default to dynamic
  return CACHE_STRATEGIES.DYNAMIC;
}

// Get offline response
function getOfflineResponse(request) {
  const url = new URL(request.url);
  
  // Return offline page for navigation requests
  if (request.mode === 'navigate') {
    return caches.match('/offline.html');
  }
  
  // Return cached API response or empty response
  if (url.pathname.startsWith('/api/')) {
    return new Response(
      JSON.stringify({ 
        error: 'Offline', 
        message: 'This content is not available offline' 
      }),
      { 
        status: 503, 
        statusText: 'Service Unavailable',
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
  
  // Return generic offline response
  return new Response('Offline', { 
    status: 503, 
    statusText: 'Service Unavailable' 
  });
}

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  console.log('Service Worker: Background sync triggered:', event.tag);
  
  switch (event.tag) {
    case 'post-sync':
      event.waitUntil(syncPosts());
      break;
    case 'message-sync':
      event.waitUntil(syncMessages());
      break;
    case 'notification-sync':
      event.waitUntil(syncNotifications());
      break;
    default:
      console.log('Service Worker: Unknown sync tag:', event.tag);
  }
});

// Sync posts when online
async function syncPosts() {
  try {
    const posts = await getStoredPosts();
    for (const post of posts) {
      await syncPost(post);
    }
    console.log('Service Worker: Posts synced successfully');
  } catch (error) {
    console.error('Service Worker: Failed to sync posts:', error);
  }
}

// Sync messages when online
async function syncMessages() {
  try {
    const messages = await getStoredMessages();
    for (const message of messages) {
      await syncMessage(message);
    }
    console.log('Service Worker: Messages synced successfully');
  } catch (error) {
    console.error('Service Worker: Failed to sync messages:', error);
  }
}

// Sync notifications when online
async function syncNotifications() {
  try {
    const notifications = await getStoredNotifications();
    for (const notification of notifications) {
      await syncNotification(notification);
    }
    console.log('Service Worker: Notifications synced successfully');
  } catch (error) {
    console.error('Service Worker: Failed to sync notifications:', error);
  }
}

// Store data in IndexedDB
async function storeInIndexedDB(storeName, data) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('innkt-offline', 1);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const db = request.result;
      const transaction = db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const addRequest = store.add(data);
      
      addRequest.onsuccess = () => resolve(addRequest.result);
      addRequest.onerror = () => reject(addRequest.error);
    };
    
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(storeName)) {
        db.createObjectStore(storeName, { keyPath: 'id', autoIncrement: true });
      }
    };
  });
}

// Get stored data from IndexedDB
async function getStoredData(storeName) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('innkt-offline', 1);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const db = request.result;
      const transaction = db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const getAllRequest = store.getAll();
      
      getAllRequest.onsuccess = () => resolve(getAllRequest.result);
      getAllRequest.onerror = () => reject(getAllRequest.error);
    };
  });
}

// Push notification handling
self.addEventListener('push', (event) => {
  console.log('Service Worker: Push notification received');
  
  let notificationData = {
    title: 'Innkt',
    body: 'You have a new notification',
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    tag: 'innkt-notification',
    data: {}
  };
  
  if (event.data) {
    try {
      const data = event.data.json();
      notificationData = { ...notificationData, ...data };
    } catch (error) {
      console.error('Service Worker: Failed to parse push data:', error);
    }
  }
  
  event.waitUntil(
    self.registration.showNotification(notificationData.title, notificationData)
  );
});

// Notification click handling
self.addEventListener('notificationclick', (event) => {
  console.log('Service Worker: Notification clicked');
  
  event.notification.close();
  
  const urlToOpen = event.notification.data?.url || '/';
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Check if app is already open
      for (const client of clientList) {
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      
      // Open new window
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});

// Message handling from main thread
self.addEventListener('message', (event) => {
  console.log('Service Worker: Message received:', event.data);
  
  switch (event.data.type) {
    case 'SKIP_WAITING':
      self.skipWaiting();
      break;
    case 'CACHE_URLS':
      cacheUrls(event.data.urls);
      break;
    case 'CLEAR_CACHE':
      clearCache(event.data.cacheName);
      break;
    case 'GET_CACHE_SIZE':
      getCacheSize().then(size => {
        event.ports[0].postMessage({ type: 'CACHE_SIZE', size });
      });
      break;
    default:
      console.log('Service Worker: Unknown message type:', event.data.type);
  }
});

// Cache specific URLs
async function cacheUrls(urls) {
  try {
    const cache = await caches.open(DYNAMIC_CACHE);
    await cache.addAll(urls);
    console.log('Service Worker: URLs cached successfully');
  } catch (error) {
    console.error('Service Worker: Failed to cache URLs:', error);
  }
}

// Clear specific cache
async function clearCache(cacheName) {
  try {
    await caches.delete(cacheName);
    console.log('Service Worker: Cache cleared:', cacheName);
  } catch (error) {
    console.error('Service Worker: Failed to clear cache:', error);
  }
}

// Get cache size
async function getCacheSize() {
  try {
    const cacheNames = await caches.keys();
    let totalSize = 0;
    
    for (const cacheName of cacheNames) {
      const cache = await caches.open(cacheName);
      const keys = await cache.keys();
      
      for (const key of keys) {
        const response = await cache.match(key);
        if (response) {
          const blob = await response.blob();
          totalSize += blob.size;
        }
      }
    }
    
    return totalSize;
  } catch (error) {
    console.error('Service Worker: Failed to get cache size:', error);
    return 0;
  }
}

// Periodic background sync (if supported)
self.addEventListener('periodicsync', (event) => {
  console.log('Service Worker: Periodic sync triggered:', event.tag);
  
  switch (event.tag) {
    case 'content-sync':
      event.waitUntil(syncContent());
      break;
    case 'notification-sync':
      event.waitUntil(syncNotifications());
      break;
    default:
      console.log('Service Worker: Unknown periodic sync tag:', event.tag);
  }
});

// Sync content periodically
async function syncContent() {
  try {
    // Sync latest posts, users, groups, etc.
    const endpoints = [
      '/api/posts/latest',
      '/api/users/trending',
      '/api/groups/popular',
      '/api/notifications/unread'
    ];
    
    for (const endpoint of endpoints) {
      try {
        const response = await fetch(endpoint);
        if (response.ok) {
          const cache = await caches.open(API_CACHE);
          cache.put(endpoint, response.clone());
        }
      } catch (error) {
        console.error('Service Worker: Failed to sync endpoint:', endpoint, error);
      }
    }
    
    console.log('Service Worker: Content synced successfully');
  } catch (error) {
    console.error('Service Worker: Failed to sync content:', error);
  }
}

// Handle app updates
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Initialize IndexedDB
self.addEventListener('install', (event) => {
  event.waitUntil(
    new Promise((resolve, reject) => {
      const request = indexedDB.open('innkt-offline', 1);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
      
      request.onupgradeneeded = () => {
        const db = request.result;
        
        // Create object stores
        if (!db.objectStoreNames.contains('posts')) {
          db.createObjectStore('posts', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('messages')) {
          db.createObjectStore('messages', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('notifications')) {
          db.createObjectStore('notifications', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('users')) {
          db.createObjectStore('users', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('groups')) {
          db.createObjectStore('groups', { keyPath: 'id' });
        }
      };
    })
  );
});

console.log('Service Worker: Loaded successfully');