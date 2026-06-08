// ============================================================
//  Mini Motor — Snake | Service Worker
//  Estratégia: Cache First para assets, Network First para o HTML
// ============================================================

const CACHE_NAME     = 'minimotor-snake-v2';
const OFFLINE_URL    = './snake__2_.html';

const PRECACHE_ASSETS = [
  './snake__2_.html',
  './manifest.json',
  './icon.png',
  './icon2.png',
  './screenshot1.png',
  './screenshot2.png',
  './screenshot3.png',
  './screenshot4.png',
  './fundo.wav',
  './fundosuave.wav',
  './fundosuave2.wav',
  './gameovercasonaosupereorecorde.wav',
  './mordendomaca.wav',
  './mortecobrabatidaparede.wav',
  './mortecobramordendoelamesma.wav',
  './premiacaocasosupererecorde.wav'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS);
    }).then(() => {
      return self.skipWaiting();
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    }).then(() => {
      return self.clients.claim();
    })
  );
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  if (event.request.method !== 'GET') return;
  if (url.origin !== self.location.origin) return;

  const isHTMLRequest =
    event.request.headers.get('accept') &&
    event.request.headers.get('accept').includes('text/html');

  if (isHTMLRequest) {
    event.respondWith(
      fetch(event.request)
        .then((networkResponse) => {
          const clone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          return networkResponse;
        })
        .catch(() => {
          return caches.match(event.request).then((cached) => {
            return cached || caches.match(OFFLINE_URL);
          });
        })
    );
  } else {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        if (cached) {
          const fetchPromise = fetch(event.request).then((networkResponse) => {
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, networkResponse.clone());
            });
            return networkResponse;
          }).catch(() => {});
          event.waitUntil(fetchPromise);
          return cached;
        }

        return fetch(event.request).then((networkResponse) => {
          const clone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          return networkResponse;
        }).catch(() => {
          return new Response('', { status: 408, statusText: 'Offline — recurso não disponível' });
        });
      })
    );
  }
});
