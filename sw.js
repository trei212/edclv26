const CACHE = 'edc2026-v1';
const PRECACHE = [
  '/', '/index.html', '/manifest.json',
  'assets/webp/edc-logo.webp', 'assets/webp/edc-logo-neon.webp',
  'assets/webp/icon-512.webp', 'assets/webp/icon-192.webp',
  'assets/webp/kinetic-field-backdrop.webp','assets/webp/kinetic-field-emblem.webp','assets/webp/kinetic-field-wordmark.webp',
  'assets/webp/neon-garden-backdrop.webp','assets/webp/neon-garden-emblem.webp','assets/webp/neon-garden-wordmark.webp',
  'assets/webp/circuit-grounds-backdrop.webp','assets/webp/circuit-grounds-emblem.webp','assets/webp/circuit-grounds-wordmark.webp',
  'assets/webp/stereo-bloom-backdrop.webp','assets/webp/stereo-bloom-emblem.webp','assets/webp/stereo-bloom-wordmark.webp',
  'assets/webp/cosmic-meadow-backdrop.webp','assets/webp/cosmic-meadow-emblem.webp','assets/webp/cosmic-meadow-wordmark.webp',
  'assets/webp/bass-pod-backdrop.webp','assets/webp/bass-pod-emblem.webp','assets/webp/bass-pod-wordmark.webp',
  'assets/webp/wasteland-backdrop.webp','assets/webp/wasteland-emblem.webp','assets/webp/wasteland-wordmark.webp',
  'assets/webp/quantum-valley-backdrop.webp','assets/webp/quantum-valley-emblem.webp','assets/webp/quantum-valley-wordmark.webp',
  'assets/webp/bionic-jungle-backdrop.webp','assets/webp/bionic-jungle-emblem.webp','assets/webp/bionic-jungle-wordmark.webp',
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(PRECACHE.map(u => new Request(u, {cache:'reload'})))).catch(()=>{}));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))));
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  if(e.request.method !== 'GET') return;
  e.respondWith(
    caches.match(e.request).then(cached => {
      if(cached) return cached;
      return fetch(e.request).then(resp => {
        if(resp && resp.status === 200 && resp.type === 'basic') {
          const clone = resp.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
        }
        return resp;
      }).catch(() => caches.match('/index.html'));
    })
  );
});
