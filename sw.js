// Mise en cache simple : le réseau d'abord, la copie locale si l'appareil est hors ligne.
const CACHE = "menus-v13";
self.addEventListener("install", e => { self.skipWaiting(); e.waitUntil(caches.open(CACHE).then(c => c.addAll(["./", "index.html", "js/partage.js", "manifest.webmanifest", "icons/icon-192.png"]).catch(() => {}))); });
self.addEventListener("activate", e => e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())));
self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.hostname.endsWith("supabase.co")) return; // les données partagées ne passent jamais par le cache
  e.respondWith(fetch(req).then(res => {
    if (res.ok && (url.origin === location.origin || url.hostname.includes("cdn"))) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
    return res;
  }).catch(() => caches.match(req).then(r => r || (req.mode === "navigate" ? caches.match("index.html") : undefined))));
});
