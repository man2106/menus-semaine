// Photos de tickets de caisse envoyées depuis l'application (onglet Courses).
//   CLE_ROBOT=... node outils/tickets.js lister                      -> tickets-a-traiter/ (photo .jpg + fiche .json)
//   CLE_ROBOT=... node outils/tickets.js resultat <chemin> analyse '{"total":87.45,"magasin":"Delhaize Ghlin","date":"2026-11-14","articles":32,"reconnus":18}'
//   CLE_ROBOT=... node outils/tickets.js resultat <chemin> illisible '{"note":"Photo floue : merci d'en reprendre une"}'
// La photo est retirée de la base une fois le ticket lu.
const fs = require("fs"), path = require("path");
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
  const [cmd, chemin, statut, json] = process.argv.slice(2);
  if (cmd === "lister") {
    const l = await rpc("robot_tickets", { cle }); const dir = path.join(process.cwd(), "tickets-a-traiter"); fs.mkdirSync(dir, { recursive: true });
    (l || []).forEach((x, i) => { const d = { ...x.donnees }; const base = path.join(dir, String(i + 1).padStart(2, "0"));
      if (d.photo) { fs.writeFileSync(base + ".jpg", Buffer.from(d.photo.split(",")[1], "base64")); d.photo = path.basename(base + ".jpg"); }
      fs.writeFileSync(base + ".json", JSON.stringify({ chemin: x.chemin, ...d }, null, 1)); });
    console.log((l || []).length + " ticket(s) en attente, fiches dans " + dir + " (ce dossier ne doit pas être publié)");
  } else if (cmd === "resultat") {
    if (!chemin || !["analyse", "illisible", "attente"].includes(statut)) throw new Error("Usage : resultat <chemin> analyse|illisible '<json>'");
    const res = json ? JSON.parse(json) : {};
    await rpc("robot_ticket_resultat", { cle, chemin, statut, resultat: res, garder_photo: statut === "attente" });
    console.log("OK : " + chemin + " -> " + statut);
  } else console.log("Commandes : lister, resultat");
})().catch(e => { console.error("ERREUR " + e.message); process.exit(1); });
