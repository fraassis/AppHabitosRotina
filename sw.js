const CACHE_NAME = 'habit-tracker-pwa-v1';
const APP_SHELL = [
  './',
  './index.html',
  './manifest.json',
  'https://cdn.tailwindcss.com',
  'https://cdn.jsdelivr.net/npm/chart.js',
  'https://unpkg.com/lucide@latest'
];

// Instala o Service Worker e salva a estrutura visual no celular
self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(APP_SHELL))
  );
});

// Limpa versões antigas de cache se você atualizar o código
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.map(key => {
          if (key !== CACHE_NAME) return caches.delete(key);
        })
      )
    )
  );
  self.clients.claim();
});

// Intercepta requisições
self.addEventListener('fetch', event => {
  const url = event.request.url;

  // REGRA CRÍTICA: Chamadas para o Google Apps Script vão sempre direto para a rede
  if (url.includes('script.google.com') || url.includes('script.googleusercontent.com') || event.request.method !== 'GET') {
    return;
  }

  // Estratégia Stale-While-Revalidate para abrir o app instantaneamente mesmo offline
  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      const networkFetch = fetch(event.request)
        .then(networkResponse => {
          if (networkResponse && networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(event.request, responseClone));
          }
          return networkResponse;
        })
        .catch(() => cachedResponse);

      return cachedResponse || networkFetch;
    })
  );
});
