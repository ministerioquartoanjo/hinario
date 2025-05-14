const CACHE_NAME = 'my-cache-v1';
const urlsToCache = [
    '/hinario/pwa/',
    '/hinario/pwa/index.html',
    '/hinario/pwa/styles.css',
    '/hinario/pwa/script.js',
    '/hinario/pwa/hinos.js',
    '/hinario/pwa/service-worker.js',

];

self.addEventListener('install', function(event) {
    event.waitUntil(
      caches.open(CACHE_NAME)
        .then(function(cache) {
          console.log('Opened cache');
          return cache.addAll(urlsToCache)
          .catch(function(error){ // Add catch clause to handle errors.
            console.error("Error during caching", error); // Log detailed error information.
            // Consider more complex logic like selectively caching only valid URLs.
          });
        })
    );
  });

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});

self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request)
            .then((response) => {
                return response || fetch(event.request);
            })
    );
});