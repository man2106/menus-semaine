// Lit une recette publique à partir de son lien (données « schema.org » que publient les sites de recettes).
// Gratuit, sans clé. Ne garde rien : la page est lue, les ingrédients et étapes sont renvoyés, puis tout est oublié.
const AUTORISE = ["https://man2106.github.io"];
const PRIVE = /^(localhost|127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|169\.254\.|0\.|\[?::1\]?|\[?fc|\[?fd)/i;
const MAX_OCTETS = 2000000, DELAI_MS = 8000, REDIRECTIONS = 3;

function cors(req, res){
  const o = req.headers.origin || "";
  if (AUTORISE.includes(o)) res.setHeader("Access-Control-Allow-Origin", o);
  res.setHeader("Vary", "Origin");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

async function lire(url){
  let u = new URL(url);
  for (let i = 0; i <= REDIRECTIONS; i++){
    if (!/^https?:$/.test(u.protocol) || PRIVE.test(u.hostname)) throw new Error("lien non autorisé");
    const ctrl = new AbortController(), t = setTimeout(() => ctrl.abort(), DELAI_MS);
    try {
      const r = await fetch(u, { redirect: "manual", signal: ctrl.signal,
        headers: { "User-Agent": "MenusFamille/1.0 (lecture de recette, usage personnel)", "Accept": "text/html" } });
      if (r.status >= 300 && r.status < 400 && r.headers.get("location")) { u = new URL(r.headers.get("location"), u); continue; }
      if (!r.ok) throw new Error("page inaccessible (" + r.status + ")");
      const txt = await r.text();
      return txt.slice(0, MAX_OCTETS);
    } finally { clearTimeout(t); }
  }
  throw new Error("trop de redirections");
}

function blocsJsonLd(html){
  const blocs = [], re = /<script[^>]+application\/ld\+json[^>]*>([\s\S]*?)<\/script>/gi; let m;
  while ((m = re.exec(html))) { try { blocs.push(JSON.parse(m[1].trim())); } catch (e) {} }
  return blocs;
}
function estRecette(o){ const t = o && o["@type"]; return t === "Recipe" || (Array.isArray(t) && t.includes("Recipe")); }
function trouveRecette(x){
  if (!x) return null;
  if (Array.isArray(x)) { for (const y of x) { const r = trouveRecette(y); if (r) return r; } return null; }
  if (estRecette(x)) return x;
  if (x["@graph"]) return trouveRecette(x["@graph"]);
  return null;
}
function texte(v){ return String(v == null ? "" : v).replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/\s+/g, " ").trim(); }
function etapes(v){
  const out = [];
  const ajoute = x => {
    if (!x) return;
    if (typeof x === "string") out.push(texte(x));
    else if (Array.isArray(x)) x.forEach(ajoute);
    else if (x.itemListElement) ajoute(x.itemListElement);
    else if (x.text) out.push(texte(x.text));
    else if (x.name) out.push(texte(x.name));
  };
  ajoute(v);
  return out.filter(Boolean).slice(0, 30);
}
function minutes(iso){
  const m = /^P(?:(\d+)D)?T?(?:(\d+)H)?(?:(\d+)M)?$/.exec(String(iso || ""));
  if (!m) return null;
  return (+m[1] || 0) * 1440 + (+m[2] || 0) * 60 + (+m[3] || 0) || null;
}

export default async function handler(req, res){
  cors(req, res);
  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "GET") return res.status(405).json({ erreur: "Méthode non autorisée" });
  const lien = String((req.query && req.query.url) || "");
  if (!lien || lien.length > 2000) return res.status(400).json({ erreur: "Lien manquant ou trop long" });
  try {
    const html = await lire(lien);
    const recette = blocsJsonLd(html).map(trouveRecette).find(Boolean);
    if (!recette) return res.status(422).json({ erreur: "Pas de recette structurée sur cette page : collez le texte à la main." });
    const ingredients = (Array.isArray(recette.recipeIngredient) ? recette.recipeIngredient : [])
      .map(texte).filter(Boolean).slice(0, 30);
    const portions = parseInt(Array.isArray(recette.recipeYield) ? recette.recipeYield[0] : recette.recipeYield, 10) || null;
    const temps = minutes(recette.totalTime) || minutes(recette.cookTime) || minutes(recette.prepTime);
    res.setHeader("Cache-Control", "no-store");
    return res.status(200).json({
      titre: texte(recette.name).slice(0, 60),
      portions, tempsMinutes: temps,
      ingredients, etapes: etapes(recette.recipeInstructions),
      source: lien.slice(0, 300)
    });
  } catch (e) {
    return res.status(502).json({ erreur: "Lecture impossible : " + (e.message || "erreur") });
  }
}
