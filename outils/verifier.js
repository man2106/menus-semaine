// Vérifie donnees/promos.json et donnees/recettes.json avant publication. Sort avec une erreur si quelque chose cloche.
// Utilisation : node outils/verifier.js
const fs = require("fs"), path = require("path");
const racine = path.join(__dirname, "..");
const html = fs.readFileSync(path.join(racine, "index.html"), "utf8") + "\n" + fs.readFileSync(path.join(racine, "js/app.js"), "utf8"); // le code de l'application est dans js/app.js
const err = []; const ok = (c, m) => { if (!c) err.push(m); };
const ENS = Object.keys(eval("(" + html.match(/const ENS = (\{[^}]+\})/)[1] + ")"));
const idsApp = new Set([...html.matchAll(/^ \{id:"([a-z0-9]+)",nom:/gm)].map(m => m[1]));
const jour = /^\d{4}-\d\d-\d\d$/;
let P, R;
try { P = JSON.parse(fs.readFileSync(path.join(racine, "donnees/promos.json"), "utf8")); } catch (e) { err.push("promos.json illisible : " + e.message); }
try { R = JSON.parse(fs.readFileSync(path.join(racine, "donnees/recettes.json"), "utf8")); } catch (e) { err.push("recettes.json illisible : " + e.message); }
if (P) {
  ok(typeof P.releve === "string" && P.releve, "promos.json : champ « releve » manquant (ex. « 16 novembre 2026 »)");
  ok(jour.test(P.date || ""), "promos.json : champ « date » au format AAAA-MM-JJ");
  ok(Array.isArray(P.promos) && P.promos.length, "promos.json : liste « promos » vide");
  (P.promos || []).forEach((x, i) => {
    const q = "promo n°" + (i + 1) + " (" + (x && x.produit) + ")";
    ok(ENS.includes(x.mag), q + " : enseigne inconnue « " + x.mag + " » (codes : " + ENS.join(", ") + ")");
    ok(typeof x.produit === "string" && x.produit, q + " : produit manquant");
    ok(+x.prix > 0, q + " : prix manquant");
    ok(x.avant === null || +x.avant > +x.prix, q + " : « avant » doit être null ou plus élevé que le prix");
    ok(jour.test(x.du || "") && jour.test(x.au || "") && x.du <= x.au, q + " : dates du/au invalides");
    ok(typeof x.ing === "string" && x.ing, q + " : ingrédient « ing » manquant");
  });
}
if (R) {
  ok(Array.isArray(R.recettes), "recettes.json : liste « recettes » manquante");
  const vus = new Set();
  (R.recettes || []).forEach((r, i) => {
    const q = "recette n°" + (i + 1) + " (" + (r && r.id) + ")";
    ok(/^[a-z][a-z0-9]{2,30}$/.test(r.id || ""), q + " : id en minuscules sans espace ni accent");
    ok(!idsApp.has(r.id) && !vus.has(r.id), q + " : id déjà utilisé"); vus.add(r.id);
    ok(typeof r.nom === "string" && r.nom.length <= 60, q + " : nom manquant ou trop long");
    ok(+r.t >= 5 && +r.t <= 30, q + " : temps entre 5 et 30 minutes");
    ok(["eco", "moyen", "plaisir"].includes(r.b), q + " : budget b = eco, moyen ou plaisir");
    ok(["veau", "boeuf", "porc", "volaille", "poisson", "oeufs", "vege"].includes(r.p), q + " : protéine p invalide");
    ok(["legumes", "lentilles", "galette", "pates", "riz", "pdt", "pain", "tarte", "semoule"].includes(r.f), q + " : féculent f invalide");
    ok(["belge", "francaise", "italienne", "grecque", "espagnole", "asiatique", "indienne", "orientale", "mexicaine", "americaine"].includes(r.c), q + " : cuisine c invalide");
    ok(Array.isArray(r.ing) && r.ing.length >= 2 && r.ing.length <= 15, q + " : 2 à 15 ingrédients");
    (r.ing || []).forEach(g => ok(Array.isArray(g) && typeof g[0] === "string" && +g[1] > 0 && typeof g[2] === "string" && ["fl", "bou", "cre", "bl", "epi", "boi", "sur"].includes(g[3]), q + " : ingrédient mal formé " + JSON.stringify(g)));
    ok(Array.isArray(r.etapes) && r.etapes.length >= 3 && r.etapes.length <= 8, q + " : 3 à 8 étapes");
    ok((r.source && /^https:\/\//.test(r.source.url || "")) || (typeof r.propose_par === "string" && r.propose_par), q + " : source.url (https) ou propose_par manquant");
    ok(jour.test(r.ajoute || ""), q + " : date « ajoute » manquante");
  });
}
let X;
try { X = JSON.parse(fs.readFileSync(path.join(racine, "donnees/prix.json"), "utf8")); } catch (e) { err.push("prix.json illisible : " + e.message); }
if (X) {
  ok(Array.isArray(X.releves), "prix.json : liste « releves » manquante");
  (X.releves || []).forEach((r, i) => { const q = "relevé n°" + (i + 1) + " (" + (r && r.produit) + ")";
    ok(typeof r.ing === "string" && r.ing, q + " : ingrédient « ing » manquant (nom exact de l'inventaire)");
    ok(ENS.includes(r.mag), q + " : enseigne inconnue « " + r.mag + " »");
    ok(+r.prix > 0 && +r.prixUnitaire > 0, q + " : prix et prixUnitaire positifs");
    ok(["kg", "L", "u"].includes(r.unite), q + " : unite = kg, L ou u");
    ok(jour.test(r.date || ""), q + " : date AAAA-MM-JJ");
    ok(!/\d{4}\s?\d{2}\*{2,}|\*{4}\s?\d{4}/.test(JSON.stringify(r)), q + " : aucune donnée de paiement ne doit être enregistrée");
  });
}
if (err.length) { console.error("PROBLÈMES (" + err.length + ") :\n- " + err.join("\n- ")); process.exit(1); }
console.log("Tout est correct : " + (P ? P.promos.length : 0) + " promos, " + (R ? R.recettes.length : 0) + " recettes ajoutées, " + (X ? X.releves.length : 0) + " prix relevés sur tickets.");
