// Affiche ce que contient déjà l'application : recettes, ingrédients (avec prix de référence) et enseignes.
// Utilisation : node outils/inventaire.js
const fs = require("fs"), path = require("path");
const racine = path.join(__dirname, "..");
const code = fs.readdirSync(path.join(racine, "js")).filter(f => f.endsWith(".js")).sort().map(f => fs.readFileSync(path.join(racine, "js", f), "utf8")).join("\n"); // le code de l'application est dans js/*.js
const base = JSON.parse(fs.readFileSync(path.join(racine, "donnees/recettes-base.json"), "utf8")); // recettes de base et prix de référence
const extra = JSON.parse(fs.readFileSync(path.join(racine, "donnees/recettes.json"), "utf8"));
const recettes = base.recettes.map(r => ({ id: r.id, nom: r.nom }));
extra.recettes.forEach(r => recettes.push({ id: r.id, nom: r.nom }));
const prix = Object.assign({}, base.prix, extra.prix || {});
const ens = code.match(/const ENS = (\{[^}]+\})/)[1];
console.log("=== " + recettes.length + " recettes (id : nom) ===");
recettes.forEach(r => console.log(r.id + " : " + r.nom));
console.log("\n=== " + Object.keys(prix).length + " ingrédients connus (nom : prix de référence) ===");
Object.entries(prix).sort().forEach(([k, v]) => console.log(k + " : " + v[0] + " €/" + v[1]));
console.log("\n=== Enseignes (code : nom) ===\n" + ens);
