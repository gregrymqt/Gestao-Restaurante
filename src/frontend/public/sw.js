// Service Worker — Restaurante Inteligente PWA
// Política estrita: nunca interceptar ou cachear /api/, /ml/, /swagger ou streams SSE.

const CACHE_NAME = 'ri-shell-v2';
const APP_SHELL_ASSETS = [
  '/',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/apple-touch-icon.png',
  '/favicon.ico',
];

function shouldBypassRequest(request, url) {
  if (request.method !== 'GET') return true;
  if (url.origin !== self.location.origin) return true;

  const accept = request.headers.get('accept') || '';
  if (accept.includes('text/event-stream')) return true;

  const path = url.pathname;
  if (
    path.startsWith('/api/') ||
    path.startsWith('/ml/') ||
    path.startsWith('/swagger') ||
    path === '/sw.js' ||
    path === '/manifest.webmanifest'
  ) {
    return true;
  }

  return false;
}

function isStaticAsset(pathname) {
  return (
    pathname.startsWith('/_expo/static/') ||
    pathname.startsWith('/assets/') ||
    pathname.startsWith('/icons/') ||
    pathname === '/favicon.ico' ||
    pathname === '/favicon.png'
  );
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) =>
        Promise.allSettled(
          APP_SHELL_ASSETS.map((asset) =>
            cache.add(new Request(asset, { cache: 'reload' }))
          )
        )
      )
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== CACHE_NAME)
            .map((staleKey) => caches.delete(staleKey))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  if (shouldBypassRequest(event.request, url)) {
    return;
  }

  // Navegação SPA: Network-First para sempre obter o bundle mais recente; fallback para shell em cache.
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response.ok && response.type === 'basic') {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put('/', copy));
          }
          return response;
        })
        .catch(() => caches.match('/'))
    );
    return;
  }

  // Assets estáticos versionados: Cache-First com revalidação silenciosa.
  if (isStaticAsset(url.pathname)) {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        if (cached) return cached;
        return fetch(event.request).then((response) => {
          if (response.ok && response.type === 'basic') {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
          }
          return response;
        });
      })
    );
  }
});
