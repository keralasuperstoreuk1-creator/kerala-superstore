// Kerala Superstore – lightweight service worker
// Required so Android Chrome / Edge / Samsung Internet show the native
// "Install app / Add to Home screen" prompt. Network-first, with an offline
// fallback to the cached home page.
const CACHE = 'kss-shell-v1';
const SHELL = ['/', '/manifest.json', '/branding/kerala-superstore-round-logo.png'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(SHELL)).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  // Never cache API calls or admin pages – always live data
  if (url.origin !== self.location.origin || url.pathname.startsWith('/api/') || url.pathname.startsWith('/admin')) {
    return;
  }

  // Page navigations: network first, offline fallback to cached home
  if (req.mode === 'navigate') {
    event.respondWith(fetch(req).catch(() => caches.match('/')));
  }
});
