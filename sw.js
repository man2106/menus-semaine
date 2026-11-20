// Mise en cache : les fichiers du site d'abord depuis le réseau (copie locale si hors ligne),
// les données (donnees/*.json) idem, les photos, icônes et polices : copie locale tout de suite, mise à jour en arrière-plan.
const CACHE = "menus-v66";
const FICHIERS = ["./", "index.html", "js/demarrage.js?v=66", "js/donnees.js?v=66", "js/menus.js?v=66", "js/courses.js?v=66", "js/promos.js?v=66", "js/vues.js?v=66", "js/fenetres.js?v=66", "js/pdf.js?v=66", "js/famille.js?v=66", "js/photoplat.js?v=66", "js/app.js?v=66", "js/partage.js?v=66", "vendor/jspdf-4.2.1.umd.min.js?v=66", "vendor/supabase-js-2.45.4.js?v=66", "manifest.webmanifest", "icons/icon-180.png", "icons/icon-192.png", "icons/icon-512.png", "fonts/bricolage-grotesque-latin.woff2", "fonts/inter-latin.woff2", "donnees/promos.json", "donnees/recettes-base.json", "donnees/recettes.json", "donnees/prix.json", "donnees/produits.json"];
// Chaque fichier est mis en cache seul : un fichier qui échoue ne bloque pas les autres, et l'échec est écrit dans la console.
self.addEventListener("install", e => { self.skipWaiting(); e.waitUntil(caches.open(CACHE).then(c => Promise.all(FICHIERS.map(f => c.add(f).catch(err => console.warn("[sw] fichier non mis en cache : " + f, err)))))); });
self.addEventListener("activate", e => e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())));
const garder = (req, res) => { if (res && res.ok && res.type === "basic") { const copie = res.clone(); caches.open(CACHE).then(c => c.put(req, copie)).catch(err => console.warn("[sw] mise en cache impossible : " + req.url, err)); } return res; };
self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.hostname.endsWith("supabase.co")) return; // les données partagées ne passent jamais par le cache
  if (url.origin !== location.origin) return; // le reste du web (cartes, adresses…) n'est pas touché
  const chemin = url.pathname;
  if (chemin.includes("/donnees/")) {
    // Données : réseau d'abord (toujours à jour en ligne), copie locale hors ligne. L'adresse peut porter un ?v=… qui change à chaque fois : la copie est gardée sans cette partie.
    const cle = new Request(url.origin + chemin);
    e.respondWith(fetch(new Request(url.href, { cache: "no-cache" })).then(res => garder(cle, res))
      .catch(() => caches.match(cle).then(r => r || Response.error())));
    return;
  }
  if (/\/(photos|icons|fonts)\//.test(chemin)) {
    // Photos, icônes, polices : on sert la copie locale et on la rafraîchit en arrière-plan (la première fois, on la garde au passage).
    e.respondWith(caches.match(req).then(r => {
      const reseau = fetch(req).then(res => garder(req, res));
      if (r) { e.waitUntil(reseau.catch(() => {})); return r; }
      return reseau.catch(() => Response.error());
    }));
    return;
  }
  e.respondWith(fetch(req.mode !== "navigate" ? new Request(req, { cache: "no-cache" }) : req).then(res => garder(req, res))
    .catch(() => caches.match(req).then(r => r || (req.mode === "navigate" ? caches.match("index.html") : Response.error()))));
});
