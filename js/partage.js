// =====================================================================
// Menus de la semaine : connexion à Supabase
// Fournit window.claude.use("db" | "user" | "downloads") à l'application,
// avec la même interface que la version Claude, pour que le reste du code
// ne change pas.
// =====================================================================
(function(){
  const SB_URL = "https://ixxtgncailsbvlbumuqs.supabase.co";
  const SB_KEY = "sb_publishable_LgqTWMGHMkRCpfc-BBBsgg_l5Lx6mMg"; // clé publique, faite pour être visible
  window.APP_URL_PUBLIC = "https://man2106.github.io/menus-semaine/";

  const sb = (window.supabase && window.supabase.createClient)
    ? window.supabase.createClient(SB_URL, SB_KEY, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false, storageKey: "menus-semaine-auth" } })
    : null;
  window.__sb = sb;

  let ACCES = null;        // { role, nom }
  let UID = null;
  let resolveReady; const ready = new Promise(r => { resolveReady = r; });
  window.__acces = () => ACCES;

  // ---------- Base de documents ----------
  const CACHE = new Map();
  const docListeners = new Map();   // path -> Set(cb)
  const colListeners = new Set();   // {prefix, cb}
  const clone = v => v === undefined ? undefined : JSON.parse(JSON.stringify(v));
  const lastSeg = p => p.split("/").pop();

  function snap(path, pending){
    return { id: lastSeg(path), exists: CACHE.has(path), data: () => clone(CACHE.get(path)),
             metadata: { hasPendingWrites: !!pending, fromCache: false } };
  }
  // « docs » donne TOUS les documents de la rubrique à cet instant (comme Firestore), pas seulement ceux qui viennent de changer :
  // le code qui nettoie son cache avec cette liste ne doit pas croire que les autres documents ont disparu.
  const dansRubrique = (prefix, p) => p.startsWith(prefix + "/") && p.split("/").length === prefix.split("/").length + 1;
  function qsnap(changes, prefix){
    return { docChanges: () => changes.map(c => ({ type: c.type, doc: { id: lastSeg(c.path), data: () => clone(c.data) } })),
             get docs(){ return [...CACHE.keys()].filter(p => dansRubrique(prefix, p)).map(p => ({ id: lastSeg(p), data: () => clone(CACHE.get(p)) })); } };
  }
  function emit(path, type, pending){
    const set = docListeners.get(path); if (set) set.forEach(cb => { try { cb(snap(path, pending)); } catch(e){ console.error(e); } });
    colListeners.forEach(l => { if (dansRubrique(l.prefix, path)) {
      try { l.cb(qsnap([{ type, path, data: CACHE.get(path) }], l.prefix)); } catch(e){ console.error(e); } } });
  }
  // Écritures en cours, par document. Tant qu'une écriture de CET appareil n'est pas terminée, les copies reçues du serveur
  // (écho d'une écriture précédente, rechargement) n'écrasent pas ce qui est affiché : sinon un choix récent revenait en arrière
  // et le choix suivant était construit sur l'ancienne version (c'est ainsi que des réponses se perdaient).
  const PEND = new Map();      // path -> nombre d'écritures en cours
  const CHAINE = new Map();    // path -> promesse de la dernière écriture (les écritures d'un même document partent dans l'ordre)
  const SAUTE = new Set();     // documents dont une copie du serveur a été ignorée pendant une écriture : à relire ensuite
  const enCours = path => (PEND.get(path) || 0) > 0;
  const canon = v => JSON.stringify(v, (k, x) => (x && typeof x === "object" && !Array.isArray(x)) ? Object.fromEntries(Object.keys(x).sort().map(c => [c, x[c]])) : x);  // même texte quel que soit l'ordre des clés (jsonb les réordonne)
  const fini = path => { if (!enCours(path) && SAUTE.delete(path)) rafraichir(path); };
  const pend = (path, n) => { const v = (PEND.get(path) || 0) + n; if (v > 0) PEND.set(path, v); else PEND.delete(path); };
  async function rafraichir(path){      // relit un seul document après nos écritures, pour récupérer ce qu'un autre appareil aurait écrit entre-temps
    try { const { data, error } = await sb.from("docs").select("path,data").eq("path", path).limit(1); if (error || enCours(path)) return;
      const r = data && data[0]; const had = CACHE.has(path);
      if (r) { if (canon(CACHE.get(path)) !== canon(r.data)) { CACHE.set(path, r.data); emit(path, had ? "modified" : "added", false); } }
      else if (had) { CACHE.delete(path); emit(path, "removed", false); }
    } catch(e){}
  }
  async function loadAll(){
    const { data, error } = await sb.from("docs").select("path,data");
    if (error) throw error;
    const seen = new Set();
    data.forEach(r => { seen.add(r.path); if (enCours(r.path)) { SAUTE.add(r.path); return; } const had = CACHE.has(r.path), same = had && canon(CACHE.get(r.path)) === canon(r.data);
      CACHE.set(r.path, r.data); if (!same) emit(r.path, had ? "modified" : "added", false); });
    [...CACHE.keys()].forEach(p => { if (!seen.has(p) && !enCours(p)) { CACHE.delete(p); emit(p, "removed", false); } });
  }
  let channel = null, firstSub = true;
  async function startDb(){
    await loadAll();
    channel = sb.channel("docs-temps-reel")
      .on("postgres_changes", { event: "*", schema: "public", table: "docs" }, p => {
        const path = (p.new && p.new.path) || (p.old && p.old.path); if (!path) return;
        if (enCours(path)) { SAUTE.add(path); return; }   // une écriture de cet appareil est en cours : on relira ce document à la fin
        if (p.eventType === "DELETE") { if (CACHE.has(path)) { CACHE.delete(path); emit(path, "removed", false); } return; }
        const had = CACHE.has(path); CACHE.set(path, p.new.data); emit(path, had ? "modified" : "added", false);
      })
      .subscribe(st => { if (st === "SUBSCRIBED") { if (!firstSub) loadAll().catch(()=>{}); firstSub = false; } });
    // à la reprise de l'appli (téléphone sorti de veille), on se remet à jour
    document.addEventListener("visibilitychange", () => { if (document.visibilityState === "visible") { loadAll().catch(()=>{}); visite(); } });
    visite();
  }
  function refused(error){ const e = new Error(error && error.message || "refusé");
    e.code = (error && (error.code === "42501" || /row-level security/i.test(error.message||""))) ? "invalid_argument" : "unavailable"; return e; }
  function docRef(path){
    return {
      id: lastSeg(path),
      async get(){ return snap(path, false); },
      onSnapshot(cb, err){
        if (!docListeners.has(path)) docListeners.set(path, new Set());
        docListeners.get(path).add(cb); setTimeout(() => cb(snap(path, false)), 0);
        return () => docListeners.get(path).delete(cb);
      },
      // Écriture : affichée tout de suite, envoyée dans l'ordre des appels. Si le serveur refuse, l'ancien contenu est rétabli et l'erreur remonte.
      async set(data){
        const prev = CACHE.get(path); CACHE.set(path, clone(data)); emit(path, prev === undefined ? "added" : "modified", true);
        pend(path, 1);
        const avant = CHAINE.get(path) || Promise.resolve();
        const cette = avant.catch(() => {}).then(() => sb.from("docs").upsert({ path, data, updated_at: new Date().toISOString() }));
        CHAINE.set(path, cette);
        let res; try { res = await cette; } catch(e){ res = { error: e }; }
        pend(path, -1); if (CHAINE.get(path) === cette) CHAINE.delete(path);
        if (res.error) {
          // Refusé : on retire la copie qui n'a pas pu partir. Un document NOUVEAU n'est pas annoncé comme « supprimé » (l'application garde sa copie locale,
          // par exemple une recette qui n'a pas pu être partagée) ; un document existant revient à son contenu précédent.
          if (!enCours(path)) { if (prev === undefined) CACHE.delete(path); else { CACHE.set(path, prev); emit(path, "modified", false); } }
          fini(path); throw refused(res.error); }
        fini(path);
      },
      // Création seule (jamais de remplacement) : sert aux votes, qui ne se modifient plus une fois envoyés.
      // Rien n'est affiché avant la réponse du serveur ; si le document existe déjà (envoyé depuis un autre appareil), on le reprend et l'erreur « existe » remonte.
      async create(data){
        pend(path, 1); let res;
        try { res = await sb.from("docs").insert({ path, data, updated_at: new Date().toISOString() }); } catch(e){ res = { error: e }; }
        pend(path, -1); fini(path);
        if (res.error) {
          if (res.error.code === "23505" || /duplicate key/i.test(res.error.message || "")) { await rafraichir(path); const e = new Error("existe"); e.code = "exists"; throw e; }
          throw refused(res.error); }
        const had = CACHE.has(path); CACHE.set(path, clone(data)); emit(path, had ? "modified" : "added", false);
      },
      async update(fields){ return this.set({ ...(CACHE.get(path) || {}), ...fields }); },
      async delete(){
        const prev = CACHE.get(path); pend(path, 1); CACHE.delete(path); emit(path, "removed", true);
        let res; try { res = await sb.from("docs").delete().eq("path", path); } catch(e){ res = { error: e }; }
        pend(path, -1); fini(path);
        if (res.error) { if (prev !== undefined) CACHE.set(path, prev); emit(path, "added", false); throw refused(res.error); }
      }
    };
  }
  const DB = {
    doc: path => docRef(path),
    collection: prefix => ({
      doc: id => docRef(prefix + "/" + id),
      onSnapshot(cb){
        const l = { prefix, cb }; colListeners.add(l);
        setTimeout(() => { const all = [...CACHE.keys()].filter(p => dansRubrique(prefix, p)).map(p => ({ type: "added", path: p, data: CACHE.get(p) })); cb(qsnap(all, prefix)); }, 0);
        return () => colListeners.delete(l);
      }
    })
  };

  // Dernière connexion : enregistrée à l'ouverture, au plus toutes les 5 minutes
  let derniereVisite = 0;
  function visite(){ if (Date.now() - derniereVisite < 300000) return; derniereVisite = Date.now(); sb.rpc("signaler_visite").then(()=>{}, ()=>{}); }
  function quandTxt(iso){ if (!iso) return "jamais vu depuis la mise à jour"; const d = new Date(iso), m = Math.round((Date.now() - d) / 60000);
    const heure = d.toLocaleTimeString("fr-BE", { hour: "2-digit", minute: "2-digit" });
    const jour = d.toLocaleDateString("fr-BE", { weekday: "long", day: "numeric", month: "long" });
    if (m < 5) return "en ligne en ce moment"; if (m < 60) return "vu il y a " + m + " min";
    const auj = new Date(); auj.setHours(0,0,0,0); const hier = new Date(auj); hier.setDate(hier.getDate() - 1);
    if (d >= auj) return "vu aujourd'hui à " + heure; if (d >= hier) return "vu hier à " + heure; return "vu " + jour + " à " + heure; }
  window.__quandTxt = quandTxt;

  // ---------- Identité ----------
  const PROFILS = new Map();
  const USER = {
    id: async () => UID,
    me: async () => ({ id: UID, name: ACCES && ACCES.nom || "" }),
    isOwner: () => !!(ACCES && ACCES.role === "proprio"),
    canEdit: () => !!ACCES,
    can: () => !!ACCES,
    async profiles(ids){
      const out = {}; const need = ids.filter(id => id && !PROFILS.has(id));
      if (need.length) { const { data } = await sb.from("acces").select("uid,nom").in("uid", need); (data||[]).forEach(r => PROFILS.set(r.uid, r.nom || "")); }
      ids.forEach(id => { if (id) out[id] = { id, name: PROFILS.get(id) || "", isMe: id === UID }; });
      return out;
    }
  };

  // ---------- Partage de fichiers (PDF) ----------
  const DOWNLOADS = {
    async save({ filename, data }){
      const blob = data instanceof Blob ? data : new Blob([data], { type: "application/octet-stream" });
      try {
        const file = new File([blob], filename, { type: blob.type || "application/pdf" });
        if (navigator.canShare && navigator.canShare({ files: [file] })) { await navigator.share({ files: [file], title: filename }); return { status: "shared" }; }
      } catch (e) { if (e && e.name === "AbortError") { const x = new Error("annulé"); x.code = "declined"; throw x; } }
      const url = URL.createObjectURL(blob), a = document.createElement("a");
      a.href = url; a.download = filename; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 5000);
      return { status: "saved" };
    }
  };

  window.claude = {
    async use(name){
      if (name === "downloads") return DOWNLOADS;
      const ok = await ready; if (!ok) return null;
      if (name === "db") return DB; if (name === "user") return USER; return null;
    }
  };

  // ---------- Écran d'accueil : code famille ----------
  const $ = id => document.getElementById(id);
  function showGate(msg){
    const g = $("gate"); if (!g) { resolveReady(false); return; }
    const code = new URLSearchParams(location.search).get("code") || "";
    if (code) $("g-code").value = code;
    $("g-msg").textContent = msg || ""; g.hidden = false;
    setTimeout(() => { try { (code ? $("g-nom") : $("g-code")).focus(); } catch(e){} }, 50);
  }
  async function enter(){
    const code = $("g-code").value.trim(), nom = $("g-nom").value.trim();
    if (!code) { $("g-msg").textContent = "Entrez le code reçu dans l'invitation."; return; }
    if (!nom) { $("g-msg").textContent = "Indiquez votre prénom : il apparaît dans le journal des modifications."; return; }
    $("g-go").disabled = true; $("g-msg").textContent = "Connexion…";
    try {
      const { data: role, error } = await sb.rpc("rejoindre", { code, nom }); if (error) throw error;
      if (!role) { $("g-msg").textContent = "Ce code n'est pas le bon. Vérifiez-le dans votre invitation."; $("g-go").disabled = false; return; }
      const r = await sb.rpc("mon_acces"); ACCES = r.data;
      history.replaceState(null, "", location.pathname + location.hash);
      localStorage.setItem("menus-identite-" + UID, "1");
      await startDb(); $("gate").hidden = true; resolveReady(true); renderAcces();
    } catch (e) {
      $("g-msg").textContent = /essais/i.test(e.message||"") ? "Trop d'essais de code : réessayez dans un quart d'heure." : "Connexion impossible pour le moment. Vérifiez votre connexion Internet et réessayez.";
    }
    $("g-go").disabled = false;
  }
  // Au premier passage sur cet appareil, chacun dit qui il est : il ne notera ensuite que pour lui.
  async function choisirIdentite(){
    if (!ACCES || !sb) return;
    const cle = "menus-identite-" + UID;
    if (localStorage.getItem(cle) && ACCES.nom) return;
    const esc = t => String(t == null ? "" : t).replace(/[&<>"']/g, c => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" }[c]));
    // Les prénoms de la famille (liste des membres de l'app), sinon ceux des accès connus
    let noms = (typeof state !== "undefined" && state && Array.isArray(state.family)) ? state.family.filter(Boolean) : [];
    if (!noms.length) { const { data } = await sb.from("acces").select("nom").order("joined_at"); noms = [...new Set((data || []).map(r => r.nom).filter(Boolean))]; }
    const box = document.createElement("div"); box.className = "gate"; box.setAttribute("role", "dialog"); box.setAttribute("aria-modal", "true");
    box.innerHTML = `<div class="gatecard"><h1>Qui êtes-vous ?</h1>
      <p>Chacun ne note que pour lui-même. Touchez votre prénom, ou tapez-le si vous n'êtes pas dans la liste.</p>
      <div class="mlist" id="idchoix">${noms.map(n => `<button class="btn" type="button" data-id="${esc(n)}"${n === ACCES.nom ? ' aria-pressed="true"' : ""}>${esc(n)}</button>`).join("")}</div>
      <label class="wfield">Mon prénom<input id="idautre" type="text" maxlength="30" autocomplete="given-name" placeholder="Ex. : Anne"></label>
      <button class="btn primary" id="idok" type="button">Confirmer</button>
      <p class="note" id="idmsg" role="status"></p></div>`;
    document.body.appendChild(box);
    let choisi = ACCES.nom || "";
    box.addEventListener("click", e => {
      const b = e.target.closest("[data-id]"); if (!b) return;
      choisi = b.dataset.id; box.querySelectorAll("[data-id]").forEach(x => x.classList.toggle("primary", x === b));
    });
    await new Promise(resolve => {
      box.querySelector("#idok").addEventListener("click", async () => {
        const n = box.querySelector("#idautre").value.trim() || choisi;
        if (!n) { box.querySelector("#idmsg").textContent = "Choisissez ou tapez votre prénom."; return; }
        if (n !== ACCES.nom) {
          const { error } = await sb.rpc("definir_nom", { nom: n });
          if (error) { box.querySelector("#idmsg").textContent = "Impossible d'enregistrer ce prénom. Réessayez."; return; }
          ACCES.nom = n; PROFILS.set(UID, n);
        }
        localStorage.setItem(cle, "1"); box.remove(); renderAcces(); resolve();
      });
    });
  }

  async function boot(){
    if (!sb) { resolveReady(false); return; }
    try {
      let { data: { session } } = await sb.auth.getSession();
      if (!session) { const r = await sb.auth.signInAnonymously(); if (r.error) throw r.error; session = r.data.session; }
      UID = session.user.id;
      const { data, error } = await sb.rpc("mon_acces"); if (error) throw error;
      if (data) { ACCES = data; await startDb(); resolveReady(true); renderAcces(); choisirIdentite().catch(() => {}); }
      else showGate();
    } catch (e) {
      console.error(e);
      const m = ((e && (e.message || e.msg)) || "") + " " + ((e && e.code) || "");
      let txt = "Le partage n'est pas joignable pour le moment. Réessayez, ou continuez sans partage.";
      if (/anonymous/i.test(m)) txt = "Réglage à faire dans Supabase : activez « Allow anonymous sign-ins » (Authentication, Sign In / Providers).";
      else if (/PGRST202|mon_acces|function|schema cache/i.test(m)) txt = "Réglage à faire dans Supabase : la base n'est pas encore installée (script SQL à exécuter dans SQL Editor).";
      showGate(txt + " [" + m.trim().slice(0, 120) + "]");
    }
  }

  // ---------- Réglages : accès de la famille ----------
  async function renderAcces(){
    const box = $("accesbox"); if (!box || !ACCES) return;
    const esc = s => String(s == null ? "" : s).replace(/[&<>"']/g, c => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" }[c]));
    let html = `<h2>Accès de la famille</h2>
      <p>Vous êtes connecté sur cet appareil en tant que <b>${esc(ACCES.nom || "?")}</b>${ACCES.role === "proprio" ? " (propriétaire)" : ""}.</p>
      <div class="addrow"><input id="acc-nom" type="text" maxlength="30" value="${esc(ACCES.nom || "")}" aria-label="Mon prénom"><button class="btn" id="acc-nom-ok" type="button">Changer mon prénom</button></div>`;
    if (ACCES.role === "proprio") {
      const [{ data: code }, r1] = await Promise.all([sb.rpc("code_famille"), sb.from("acces").select("uid,nom,role,joined_at,vu_le").order("joined_at")]);
      let devs = r1.data, avecVu = !r1.error;
      if (r1.error) devs = (await sb.from("acces").select("uid,nom,role,joined_at").order("joined_at")).data;
      if (avecVu && devs) devs.sort((a, b) => (b.vu_le || "").localeCompare(a.vu_le || ""));
      window.INVITE_URL = window.APP_URL_PUBLIC + "?code=" + encodeURIComponent(code || "");
      html += `<h3 class="shopray">Lien d'invitation</h3>
        <p class="note">Toute personne qui ouvre ce lien et indique son prénom peut voir et modifier les menus. Ne le partagez qu'avec la famille.</p>
        <div class="invite"><code id="acc-link">${esc(window.INVITE_URL)}</code><button class="btn primary" id="acc-copy" type="button">Copier le lien</button></div>
        <p class="note">Code famille : <b>${esc(code)}</b></p>
        <div class="addrow"><input id="acc-code" type="text" maxlength="40" placeholder="Nouveau code (10 caractères minimum, ex. : cerise-tulipe-4827)" aria-label="Nouveau code famille"><button class="btn" id="acc-code-ok" type="button">Changer le code</button></div>
        <h3 class="shopray">Sauvegarde</h3>
        <p class="note">Téléchargez de temps en temps une copie de toutes les données de la famille : menus, recettes, avis, sondage et goûts. ${(()=>{ let d=null; try{ d=localStorage.getItem("menus-semaine-sauvegarde"); }catch(e){} return d?"Dernière sauvegarde depuis cet appareil : "+new Date(d).toLocaleDateString("fr-BE")+".":"Aucune sauvegarde depuis cet appareil."; })()}</p>
        <div class="actions"><button class="btn" id="acc-backup" type="button">Télécharger une sauvegarde</button></div>
        <h3 class="shopray">Appareils connectés (${(devs||[]).length})</h3>${avecVu ? "" : `<p class="note">Pour voir les dernières connexions, exécutez le script « mise-a-jour-connexions.sql » dans Supabase.</p>`}
        <div class="sorder">${(devs||[]).map(d => `<div class="sitem"><span class="srank">${esc((d.nom||"?").slice(0,1).toUpperCase())}</span><span class="sinfo"><b>${esc(d.nom||"Sans prénom")}${d.uid===UID?" (cet appareil)":""}</b><small>${avecVu ? esc(quandTxt(d.uid===UID ? new Date().toISOString() : d.vu_le)) + " · " : ""}${d.role==="proprio"?"Propriétaire":"Membre"} depuis le ${new Date(d.joined_at).toLocaleDateString("fr-BE")}</small></span>
          <span class="sbtns">${d.role==="proprio"?"":`<button class="sbtn wide" data-retirer="${d.uid}">Retirer</button>`}</span></div>`).join("")}</div>`;
    }
    box.innerHTML = html; box.hidden = false;
    if (typeof renderWeekbar === "function") { try { renderWeekbar(); } catch(e){} }
  }
  document.addEventListener("click", async e => {
    const t = e.target.closest("button"); if (!t) return;
    const toastFn = window.toast || (m => alert(m));
    if (t.id === "g-go") { /* géré par l'envoi du formulaire */ }
    if (t.id === "g-local") { $("gate").hidden = true; resolveReady(false); }
    if (t.id === "acc-nom-ok") { const n = $("acc-nom").value.trim(); if (!n) return; await sb.rpc("definir_nom", { nom: n }); ACCES.nom = n; PROFILS.set(UID, n); toastFn("Prénom enregistré"); renderAcces(); }
    if (t.id === "acc-copy") { try { await navigator.clipboard.writeText(window.INVITE_URL); toastFn("Lien d'invitation copié"); } catch(err){ toastFn(window.INVITE_URL); } }
    if (t.id === "acc-code-ok") { const c = $("acc-code").value.trim(); const { error } = await sb.rpc("changer_code_famille", { nouveau: c });
      if (error) toastFn(/court/.test(error.message)||c.length<10 ? "Code trop court : 10 caractères minimum" : "Le code n'a pas pu être changé"); else { toastFn("Nouveau code enregistré : envoyez le nouveau lien"); renderAcces(); } }
    if (t.id === "acc-backup") {
      const docs = {}; [...CACHE.keys()].sort().forEach(k => { docs[k] = CACHE.get(k); });
      const jour = new Date().toISOString().slice(0, 10);
      const data = new Blob([JSON.stringify({ application: "menus-semaine", version: 1, date: new Date().toISOString(), documents: docs }, null, 1)], { type: "application/json" });
      try { await DOWNLOADS.save({ filename: `sauvegarde-menus-${jour}.json`, data }); try { localStorage.setItem("menus-semaine-sauvegarde", new Date().toISOString()); } catch (e) {} toastFn(`Sauvegarde prête : ${Object.keys(docs).length} documents`); renderAcces(); }
      catch (e) { toastFn("Sauvegarde annulée"); }
      return; }
    if (t.dataset.retirer) { const { error } = await sb.rpc("retirer_acces", { cible: t.dataset.retirer }); toastFn(error ? "Impossible de retirer cet appareil" : "Accès retiré"); renderAcces(); }
  });
  document.addEventListener("submit", e => { if (e.target && e.target.id === "gateform") { e.preventDefault(); enter(); } });
  document.addEventListener("keydown", e => { if (e.key === "Enter" && !$("gate").hidden && (e.target.id === "g-code" || e.target.id === "g-nom")) { e.preventDefault(); enter(); } });

  // Géolocalisation (disponible sur un vrai site)
  document.addEventListener("click", e => {
    if (!e.target.closest || !e.target.closest("#geoloc")) return;
    const toastFn = window.toast || (m => alert(m));
    if (!navigator.geolocation) { toastFn("La position n'est pas disponible sur cet appareil"); return; }
    toastFn("Recherche de votre position…");
    navigator.geolocation.getCurrentPosition(p => {
      if (typeof setHome === "function") setHome({ nom: "Ma position", precision: "exacte", lat: Math.round(p.coords.latitude*1e4)/1e4, lon: Math.round(p.coords.longitude*1e4)/1e4 });
    }, err => toastFn(err.code === 1 ? "Position refusée : autorisez-la dans les réglages du navigateur" : "Position introuvable pour le moment"), { enableHighAccuracy: false, timeout: 15000, maximumAge: 600000 });
  });

  // Application installable : mise en cache pour l'ouverture hors ligne
  if ("serviceWorker" in navigator) window.addEventListener("load", () => navigator.serviceWorker.register("sw.js").catch(()=>{}));

  // Démarrage une fois les scripts de l'application chargés (js/demarrage.js envoie « app-pret »)
  if (window.__appPret) boot(); else window.addEventListener("app-pret", boot, { once: true });
})();
