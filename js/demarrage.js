// Démarrage de l'application.
// Les scripts de l'application ont besoin des recettes dès leur première ligne (menu enregistré, premier affichage) :
// on charge donc d'abord donnees/recettes-base.json (window.BASE_RECETTES), puis les scripts, dans l'ordre de
// l'attribut data-scripts de la balise <script> de index.html (scripts classiques, variables globales partagées).
(function(){
  const moi = document.currentScript, V = new URL(moi.src).searchParams.get("v") || "";
  window.APP_V = V;
  const url = f => f + (V ? "?v=" + V : "");
  const liste = (moi.dataset.scripts || "").split(/\s+/).filter(Boolean);
  // Les scripts se téléchargent déjà pendant que le JSON arrive
  liste.forEach(f => { const l = document.createElement("link"); l.rel = "preload"; l.as = "script"; l.href = url(f); document.head.appendChild(l); });
  const charger = f => new Promise((ok, ko) => { const s = document.createElement("script"); s.src = url(f); s.async = false;
    s.onload = ok; s.onerror = () => ko(new Error("script introuvable : " + f)); document.head.appendChild(s); });
  fetch(url("donnees/recettes-base.json")).then(r => { if (!r.ok) throw new Error("recettes de base introuvables (" + r.status + ")"); return r.json(); })
    .then(j => { window.BASE_RECETTES = j; return Promise.all(liste.map(charger)); })   // async=false : exécution dans l'ordre de la liste
    .catch(e => {
      console.error(e);
      const m = document.createElement("p"); m.setAttribute("role", "alert"); m.style.cssText = "margin:24px;font:16px/1.4 sans-serif";
      m.textContent = "L'application n'a pas pu démarrer. Vérifiez la connexion Internet et rechargez la page."; document.body.prepend(m);
    })
    .finally(() => { window.__appPret = true; window.dispatchEvent(new Event("app-pret")); });
})();
