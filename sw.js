// Service worker do WealthFlow CFP
// Estratégia: cache-first com atualização em segundo plano.
// O "app shell" (HTML, manifesto, ícones) é pré-cacheado na instalação.
// CDNs (Tailwind, Chart.js) são cacheados na primeira vez que carregam online.

const CACHE = 'wealthflow-v7';

const APP_SHELL = [
  './',
  'index.html',
  'manifest.webmanifest',
  'icons/icon-192.png',
  'icons/icon-512.png',
  'icons/icon-180.png'
];

// Instala e pré-cacheia o app shell
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE).then(cache => cache.addAll(APP_SHELL)).then(() => self.skipWaiting())
  );
});

// Remove caches antigos ao ativar
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Responde do cache primeiro; busca na rede em paralelo e atualiza o cache
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then(cacheado => {
      const naRede = fetch(event.request).then(resp => {
        // só cacheia respostas válidas (mesma origem ou CDN)
        if (resp && (resp.status === 200 || resp.type === 'opaque')) {
          const copia = resp.clone();
          caches.open(CACHE).then(cache => cache.put(event.request, copia));
        }
        return resp;
      }).catch(() => cacheado); // offline: usa o cache

      return cacheado || naRede;
    })
  );
});
