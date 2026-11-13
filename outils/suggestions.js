// Propositions de recettes faites par la famille dans l'application (onglet Envies).
// Utilisation (clé fournie par la tâche planifiée) :
//   CLE_ROBOT=... node outils/suggestions.js lister            -> écrit suggestions-a-traiter/ (fiches .json et photos .jpg)
//   CLE_ROBOT=... node outils/suggestions.js marquer <chemin> ajoutee <id-recette>
//   CLE_ROBOT=... node outils/suggestions.js marquer <chemin> refusee "<explication courte>"
const fs = require("fs"), path = require("path");
// Derrière un proxy (sessions planifiées), Node doit utiliser HTTPS_PROXY : on se relance avec l'option prévue pour cela.
if ((process.env.HTTPS_PROXY || process.env.https_proxy) && !process.env.NODE_USE_ENV_PROXY) {
  const r = require("child_process").spawnSync(process.execPath, ["--no-warnings", ...process.argv.slice(1)], { stdio: "inherit", env: { ...process.env, NODE_USE_ENV_PROXY: "1" } });
  process.exit(r.status === null ? 1 : r.status);
}
const URL_SB = "https://ixxtgncailsbvlbumuqs.supabase.co", CLE_PUBLIQUE = "sb_publishable_LgqTWMGHMkRCpfc-BBBsgg_l5Lx6mMg";
const cle = process.env.CLE_ROBOT; if (!cle) { console.error("Variable CLE_ROBOT manquante"); process.exit(1); }
async function rpc(nom, args) {
  const r = await fetch(`${URL_SB}/rest/v1/rpc/${nom}`, { method: "POST", headers: { apikey: CLE_PUBLIQUE, Authorization: "Bearer " + CLE_PUBLIQUE, "Content-Type": "application/json" }, body: JSON.stringify(args) });
  const t = await r.text(); if (!r.ok) throw new Error(`${nom} : ${r.status} ${t.slice(0, 300)}`); return t ? JSON.parse(t) : null;
}
(async () => {
  const [cmd, chemin, statut, info] = process.argv.slice(2);
  if (cmd === "lister") {
    const l = await rpc("robot_suggestions", { cle }); const dir = path.join(process.cwd(), "suggestions-a-traiter"); fs.mkdirSync(dir, { recursive: true });
    (l || []).forEach((x, i) => { const d = { ...x.donnees }; const base = path.join(dir, String(i + 1).padStart(2, "0"));
      if (d.photo) { fs.writeFileSync(base + ".jpg", Buffer.from(d.photo.split(",")[1], "base64")); d.photo = path.basename(base + ".jpg"); }
      fs.writeFileSync(base + ".json", JSON.stringify({ chemin: x.chemin, ...d }, null, 1)); });
    console.log((l || []).length + " proposition(s) en attente, fiches dans " + dir + " (ce dossier ne doit pas être publié)");
  } else if (cmd === "marquer") {
    if (!chemin || !["ajoutee", "refusee", "attente"].includes(statut)) throw new Error("Usage : marquer <chemin> ajoutee|refusee <recette|explication>");
    await rpc("robot_marquer", { cle, chemin, statut, recette: statut === "ajoutee" ? info : null, note: statut === "refusee" ? info : null });
    console.log("OK : " + chemin + " -> " + statut);
  } else console.log("Commandes : lister, marquer");
})().catch(e => { console.error("ERREUR " + e.message); process.exit(1); });
