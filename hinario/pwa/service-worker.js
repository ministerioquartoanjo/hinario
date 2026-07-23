const CACHE_NAME = 'hinario-mqa-cache-v1.0.4'; // Incrementado para limpar erro de fetch
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
    const KEEP_CACHES = [CACHE_NAME, 'mp3-cache', 'json-cache', 'version-cache'];
    event.waitUntil(
        caches.keys().then(keys => {
            return Promise.all(
                keys.filter(key => !KEEP_CACHES.includes(key))
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
        // Apenas para requisições GET
        if (event.request.method !== 'GET') {
            event.respondWith(fetch(event.request));
            return;
        }

        event.respondWith(
            caches.match(event.request)
                .then(response => {
                    if (response) return response;
                    return fetch(event.request).then(fetchResponse => {
                        // Apenas cachear respostas válidas e bem-sucedidas
                        if (fetchResponse && (fetchResponse.ok || fetchResponse.status === 206)) {
                            const clonedResponse = fetchResponse.clone();
                            caches.open('mp3-cache').then(cache => {
                                cache.put(event.request, clonedResponse);
                            });
                        }
                        return fetchResponse;
                    });
                })
        );
    }
});
