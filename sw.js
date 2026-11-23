// Guarda o aplicativo no celular para abrir rápido, mesmo com internet fraca.
const VERSAO = "verdao-v3";
const ARQUIVOS = ["./", "index.html", "app.js", "store.js", "seed.js", "escudos.js", "config.js", "manifest.webmanifest", "icones/icone-192.png", "icones/icone-512.png", "fontes/archivo-black.woff", "fontes/montserrat.woff"];
self.addEventListener("install", e => { e.waitUntil(caches.open(VERSAO).then(c => c.addAll(ARQUIVOS)).then(() => self.skipWaiting())); });
self.addEventListener("activate", e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== VERSAO).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener("fetch", e => {
  const u = new URL(e.request.url);
  if (e.request.method !== "GET") return;
  if (u.origin === location.origin) {
    // Arquivos do próprio aplicativo: tenta a versão nova primeiro, usa a guardada se estiver sem internet.
    e.respondWith(fetch(e.request).then(r => { const c = r.clone(); caches.open(VERSAO).then(x => x.put(e.request, c)); return r; }).catch(() => caches.match(e.request)));
  } else if (u.host.includes("fonts.g")) {
    e.respondWith(caches.match(e.request).then(m => m || fetch(e.request).then(r => { const c = r.clone(); caches.open(VERSAO).then(x => x.put(e.request, c)); return r; })));
  }
});
