// Guarda a app no telemóvel para abrir mesmo sem rede. Muda a versão para forçar atualização.
const C = 'contas-v4';
const FILES = ['./', './index.html', './config.js', './icon-192.png', './icon-512.png'];
const LIBS = /^https:\/\/(www\.gstatic\.com\/firebasejs\/|fonts\.googleapis\.com\/|fonts\.gstatic\.com\/)/;
self.addEventListener('install', e => { e.waitUntil(caches.open(C).then(c => c.addAll(FILES)).catch(() => {})); self.skipWaiting(); });
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(k => Promise.all(k.filter(x => x !== C).map(x => caches.delete(x)))));
  self.clients.claim();
});
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const u = new URL(e.request.url);
  // bibliotecas (Firebase, letras): primeiro a cópia guardada, para a app abrir sem rede
  if (LIBS.test(e.request.url)) {
    e.respondWith(caches.match(e.request).then(r => r || fetch(e.request).then(res => {
      const cp = res.clone(); caches.open(C).then(c => c.put(e.request, cp)); return res;
    })));
    return;
  }
  if (u.origin !== location.origin || u.pathname.startsWith('/.netlify/')) return;
  // ficheiros da app: primeiro a rede (para receber atualizações), sem rede usa a cópia
  e.respondWith(
    fetch(e.request.url, { cache: 'no-cache' }).then(r => { const cp = r.clone(); caches.open(C).then(c => c.put(e.request, cp)); return r; })
      .catch(() => caches.match(e.request, { ignoreSearch: true }).then(r => r || caches.match('./index.html')))
  );
});
