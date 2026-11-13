/* Pulse — service worker: o site abre sem internet depois da primeira visita.
   Arquivos do próprio site: rede primeiro (sempre a versão nova) e, sem internet, o que ficou no cache.
   Google (login, Drive) nunca passa pelo cache. Mude CACHE para limpar tudo. */
const CACHE = 'pulse-v1';
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(['./', 'index.html'])).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  const r = e.request;
  if (r.method !== 'GET' || new URL(r.url).origin !== location.origin) return;
  e.respondWith(caches.open(CACHE).then(async c => {
    const hit = await c.match(r, { ignoreSearch: true });
    return fetch(r).then(res => { if (res.ok) c.put(r, res.clone()); return res; }).catch(() => hit || (r.mode === 'navigate' ? c.match('index.html') : Response.error()));
  }));
});
