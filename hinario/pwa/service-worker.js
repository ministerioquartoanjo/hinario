const CACHE_NAME = 'my-cache-v1';
const urlsToCache = [
    '/hinario/pwa/',
    '/hinario/pwa/index.html',
    '/hinario/pwa/styles.css',
    '/hinario/pwa/script.js',
    '/hinario/pwa/hinos.js',
    '/hinario/pwa/service-worker.js',
];

const EXPIRACAO_MS = 24 * 60 * 60 * 1000; // 1 dia

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(async (cache) => {
                console.log('Abrindo cache e salvando arquivos...');
                await cache.addAll(urlsToCache);
                await cache.put('timestamp', new Response(Date.now().toString()));
            })
            .catch(error => {
                console.error("Erro durante o cache:", error);
            })
    );
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        (async () => {
            const keys = await caches.keys();
            await Promise.all(
                keys.map((key) => {
                    if (key !== CACHE_NAME) {
                        return caches.delete(key);
                    }
                })
            );
        })()
    );
});

self.addEventListener('fetch', (event) => {
    event.respondWith(
        (async () => {
            const cache = await caches.open(CACHE_NAME);
            const timestampResponse = await cache.match('timestamp');

            if (timestampResponse) {
                const timestamp = Number(await timestampResponse.text());
                const agora = Date.now();

                if ((agora - timestamp) > EXPIRACAO_MS) {
                    console.log('[SW] Cache expirado. Limpando...');
                    await caches.delete(CACHE_NAME);
                    const newCache = await caches.open(CACHE_NAME);
                    await newCache.addAll(urlsToCache);
                    await newCache.put('timestamp', new Response(Date.now().toString()));
                }
            }

            const respostaCache = await cache.match(event.request);
            return respostaCache || fetch(event.request);
        })()
    );
});
