const CACHE_NAME = 'hinario-v5';
const ASSETS = [
    './',
    './index.html',
    './styles.css',
    './script.js',
    './data/hymns-index.json',
    './icon.png',
    'https://code.jquery.com/jquery-3.6.0.min.js',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.3/css/all.min.css'
];

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(ASSETS))
            .then(() => self.skipWaiting())
    );
});

self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(keys => {
            return Promise.all(
                keys.filter(key => key !== CACHE_NAME)
                    .map(key => caches.delete(key))
            );
        }).then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', event => {
    const url = new URL(event.request.url);

    // Lista de arquivos que devem ser sempre atualizados (Network First)
    const shouldNetworkFirst = [
        '/',
        '/index.html',
        '/script.js',
        '/styles.css',
        '/data/hymns-index.json'
    ].some(path => url.pathname.endsWith(path)) || url.pathname.includes('/data/hinos/');

    if (shouldNetworkFirst) {
        event.respondWith(
            fetch(event.request)
                .then(response => {
                    const clonedResponse = response.clone();
                    caches.open(CACHE_NAME).then(cache => cache.put(event.request, clonedResponse));
                    return response;
                })
                .catch(() => caches.match(event.request))
        );
    } else {
        // Cache First para o resto (MP3, Ícones, Bibliotecas Externas)
        event.respondWith(
            caches.match(event.request)
                .then(response => response || fetch(event.request))
        );
    }
});
