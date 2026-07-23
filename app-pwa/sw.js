// Service Worker para Hinario PWA
// Força atualização quando há nova versão

const CACHE_PREFIX = 'hinario-v';
const LYRICS_CACHE_VERSION = '1.0.1';
const AUDIO_CACHE_VERSION = '1.0.1';
const CONTENT_VERSION_CACHE = 'content-version-cache';
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

    event.waitUntil((async () => {
        const contentVersionCache = await caches.open(CONTENT_VERSION_CACHE);
        const storedLyricsResponse = await contentVersionCache.match('lyrics-version');
        const storedAudioResponse = await contentVersionCache.match('audio-version');
        const storedLyricsVersion = storedLyricsResponse ? await storedLyricsResponse.text() : null;
        const storedAudioVersion = storedAudioResponse ? await storedAudioResponse.text() : null;
        const lyricsChanged = storedLyricsVersion !== LYRICS_CACHE_VERSION;
        const audioChanged = storedAudioVersion !== AUDIO_CACHE_VERSION;
        const cacheNames = await caches.keys();
        const cachesToDelete = cacheNames.filter((cacheName) =>
            (cacheName.startsWith(CACHE_PREFIX) && cacheName !== currentCache) ||
            (lyricsChanged && cacheName === 'json-cache') ||
            (audioChanged && cacheName === 'mp3-cache')
        );

        await Promise.all(cachesToDelete.map((cacheName) => {
            console.log('[SW] Deleting cache:', cacheName);
            return caches.delete(cacheName);
        }));

        if (lyricsChanged) {
            await contentVersionCache.put('lyrics-version', new Response(LYRICS_CACHE_VERSION));
        }

        if (audioChanged) {
            await contentVersionCache.put('audio-version', new Response(AUDIO_CACHE_VERSION));
        }

        await self.clients.claim();

        const clients = await self.clients.matchAll();
        clients.forEach((client) => {
            client.postMessage({
                type: 'SW_ACTIVATED',
                cacheName: currentCache
            });
        });
    })());
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
