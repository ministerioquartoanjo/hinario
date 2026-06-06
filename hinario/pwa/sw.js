// Service Worker para Hinario PWA
// Força atualização quando há nova versão

const CACHE_PREFIX = 'hinario-v';
let currentCache = CACHE_PREFIX + 'unknown';

// BUILD_TIMESTAMP injetado pelo Vite: {{BUILD_TIMESTAMP}}
const BUILD_VERSION = '{{BUILD_TIMESTAMP}}' || Date.now();

// Pegar versão do cache name
self.addEventListener('install', (event) => {
    currentCache = CACHE_PREFIX + BUILD_VERSION;
    
    console.log('[SW] Installing version:', BUILD_VERSION);
    
    event.waitUntil(
        caches.open(currentCache).then((cache) => {
            return cache.addAll([
                '/',
                '/index.html',
                '/styles.css',
                '/version-config.js'
            ]);
        }).then(() => {
            self.skipWaiting();
        })
    );
});

self.addEventListener('activate', (event) => {
    console.log('[SW] Activating');
    
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    // Deletar caches antigos que não são o atual
                    if (cacheName.startsWith(CACHE_PREFIX) && cacheName !== currentCache) {
                        console.log('[SW] Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => {
            self.clients.claim();
            
            // Notificar todos os clients sobre a nova versão
            return self.clients.matchAll().then((clients) => {
                clients.forEach((client) => {
                    client.postMessage({
                        type: 'SW_ACTIVATED',
                        cacheName: currentCache
                    });
                });
            });
        })
    );
});

self.addEventListener('fetch', (event) => {
    // Estratégia: Network first, fallback to cache
    event.respondWith(
        fetch(event.request).catch(() => {
            return caches.match(event.request);
        })
    );
});

// Verificar atualizações periódicamente
setInterval(() => {
    console.log('[SW] Checking for updates...');
    self.registration.update();
}, 5 * 60 * 1000); // A cada 5 minutos
