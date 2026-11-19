// Retire de donnees/promos.json les promos dont la date de fin est passée. Le fichier est réécrit sur place (indentation d'1 espace).
// Utilisation : node outils/nettoyer-promos.js
const fs = require("fs"), path = require("path");
const fichier = path.join(__dirname, "..", "donnees", "promos.json");
const d = new Date(), aujourdhui = d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
let P;
try { P = JSON.parse(fs.readFileSync(fichier, "utf8")); } catch (e) { console.error("promos.json illisible : " + e.message); process.exit(1); }
if (!Array.isArray(P.promos)) { console.error("promos.json : liste « promos » manquante"); process.exit(1); }
const avant = P.promos.length;
P.promos = P.promos.filter(x => !(x && typeof x.au === "string" && x.au < aujourdhui));
fs.writeFileSync(fichier, JSON.stringify(P, null, 1) + "\n");
console.log((avant - P.promos.length) + " promo(s) expirée(s) retirée(s), " + P.promos.length + " gardée(s) (au " + aujourdhui + ").");
