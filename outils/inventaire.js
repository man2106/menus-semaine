// Affiche ce que contient déjà l'application : recettes, ingrédients (avec prix de référence) et enseignes.
// Utilisation : node outils/inventaire.js
const fs = require("fs"), path = require("path");
const racine = path.join(__dirname, "..");
const html = fs.readFileSync(path.join(racine, "index.html"), "utf8") + "\n" + fs.readFileSync(path.join(racine, "js/app.js"), "utf8"); // le code de l'application est dans js/app.js
const extra = JSON.parse(fs.readFileSync(path.join(racine, "donnees/recettes.json"), "utf8"));
const recettes = [...html.matchAll(/^ \{id:"([a-z0-9]+)",nom:"([^"]+)",acc:"[^"]*",t:(\d+)(?:,b:"(\w+)")?(?:,p:"(\w+)")?(?:,f:"(\w+)")?(?:,c:"(\w+)")?/gm)]
  .map(m => ({ id: m[1], nom: m[2] }));
extra.recettes.forEach(r => recettes.push({ id: r.id, nom: r.nom }));
const prixBloc = html.slice(html.indexOf("const PRIX = {"), html.indexOf("};", html.indexOf("const PRIX = {")));
const prix = {}; [...prixBloc.matchAll(/"([^"]+)":\[([\d.]+), ?"(\w+)"\]/g)].forEach(m => { prix[m[1]] = [ +m[2], m[3] ]; });
Object.assign(prix, extra.prix || {});
const ens = html.match(/const ENS = (\{[^}]+\})/)[1];
console.log("=== " + recettes.length + " recettes (id : nom) ===");
recettes.forEach(r => console.log(r.id + " : " + r.nom));
console.log("\n=== " + Object.keys(prix).length + " ingrédients connus (nom : prix de référence) ===");
Object.entries(prix).sort().forEach(([k, v]) => console.log(k + " : " + v[0] + " €/" + v[1]));
console.log("\n=== Enseignes (code : nom) ===\n" + ens);
