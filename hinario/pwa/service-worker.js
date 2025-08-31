const CACHE_NAME = 'hinario-v4';
const urlsToCache = [
    './',
    './index.html',
    './styles.css',
    './script.js',
    './hinos.js',
    './service-worker.js',
    './manifest.json',
    './icons/icon-192x192.png',
    './icons/icon-512x512.png',
    './js/jquery.js',
    './js/jquery.autocomplete.js',
    './js/jquery.autocomplete.css',
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
                    console.log('[SW] Cache expirado. Atualizando em background...');
                    try {
                        await cache.addAll(urlsToCache);
                        await cache.put('timestamp', new Response(Date.now().toString()));
                    } catch (e) {
                        console.warn('[SW] Falha ao atualizar cache. Mantendo cache antigo.', e);
                    }
                }
            }

            // Navegações: tentar rede primeiro (para verificar atualização) e fallback para cache
            if (event.request.mode === 'navigate') {
                try {
                    const networkResponse = await fetch(event.request, { cache: 'no-store' });
                    // Atualiza cache com a última versão do HTML
                    try { await cache.put(event.request, networkResponse.clone()); } catch {}
                    return networkResponse;
                } catch (e) {
                    const cachedIndex = await cache.match('./index.html');
                    if (cachedIndex) return cachedIndex;
                    return new Response('Offline', { status: 503, statusText: 'Offline' });
                }
            }

            // Assets: cache-first, RESPECT querystring so versioned files update correctly
            const respostaCache = await cache.match(event.request, { ignoreSearch: false });
            if (respostaCache) return respostaCache;
            const respostaRede = await fetch(event.request).catch(() => undefined);
            if (respostaRede) {
                try { await cache.put(event.request, respostaRede.clone()); } catch {}
                return respostaRede;
            }
            return new Response('Offline', { status: 503, statusText: 'Offline' });
        })()
    );
});
