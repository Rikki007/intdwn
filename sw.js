/**
 * INTDWN - Service Worker
 * Enables offline functionality for PWA
 */

const CACHE_NAME = 'intdwn-v1';
const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/main.js',
    '/styles.css',
    '/manifest.json',
    '/assets/icons/logo.png',
    '/locales/en.json',
    '/locales/ru.json',
    '/tests/bigFive.json',
    '/tests/anxiety.json',
    '/tests/emotional_intelligence.json',
    '/tests/locus_of_control.json',
    '/tests/procrastination.json',
    '/tests/stress_resistance.json',
    '/data/facts.json',
    '/data/rules.json',
    '/data/interpretations.json',
    '/core/constants.js',
    '/core/storage.js',
    '/core/i18n.js',
    '/core/utils.js',
    '/core/router.js'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('Caching static assets');
                return cache.addAll(STATIC_ASSETS);
            })
            .then(() => self.skipWaiting())
    );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys()
            .then((cacheNames) => {
                return Promise.all(
                    cacheNames
                        .filter((name) => name !== CACHE_NAME)
                        .map((name) => caches.delete(name))
                );
            })
            .then(() => self.clients.claim())
    );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
    // Skip non-GET requests
    if (event.request.method !== 'GET') {
        return;
    }

    // Skip cross-origin requests
    if (!event.request.url.startsWith(self.location.origin)) {
        return;
    }

    event.respondWith(
        caches.match(event.request)
            .then((cachedResponse) => {
                if (cachedResponse) {
                    // Return cached response
                    return cachedResponse;
                }

                // Fetch from network
                return fetch(event.request)
                    .then((response) => {
                        // Don't cache if not a valid response
                        if (!response || response.status !== 200 || response.type !== 'basic') {
                            return response;
                        }

                        // Clone the response
                        const responseToCache = response.clone();

                        // Add to cache
                        caches.open(CACHE_NAME)
                            .then((cache) => {
                                cache.put(event.request, responseToCache);
                            });

                        return response;
                    })
                    .catch(() => {
                        // Return offline fallback for navigation requests
                        if (event.request.mode === 'navigate') {
                            return caches.match('/index.html');
                        }
                        return null;
                    });
            })
    );
});

// Background sync for offline data
self.addEventListener('sync', (event) => {
    if (event.tag === 'sync-data') {
        event.waitUntil(syncData());
    }
});

async function syncData() {
    // Placeholder for background sync logic
    console.log('Background sync triggered');
}
