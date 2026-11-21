// ======================= Goûts, avis, recettes de famille =======================
function getSteps(id){ return (BYID[id]&&BYID[id].perso) ? (ETAPES_PERSO[id]||[]) : (ETAPES[id]||[]); }
function presentAt(d){ return d===null||d===undefined ? state.family : state.family.filter(n=>!(state.absents[n]||[]).includes(d)); }
function dislikesFor(r,d){ return presentAt(d).filter(n=>(state.avis[r.id]||{})[n]===-1 || (state.exclus[n]||[]).some(x=>r.ing.some(([ing])=>ing===x))); }
function likeScore(r){ return state.family.filter(n=>(state.avis[r.id]||{})[n]===1).length; }
function avisSummary(r){ const a=state.avis[r.id]||{}; const up=state.family.filter(n=>a[n]===1).length, dn=state.family.filter(n=>a[n]===-1).length;
  return up||dn ? `${up} aime${up>1?"nt":""} · ${dn} pas pour ${dn>1?"eux":"lui"}` : "pas encore d'avis"; }
const ALL_ING = () => [...new Set(RECETTES.flatMap(r=>r.ing.map(([n])=>n)))].sort((a,b)=>a.localeCompare(b,"fr"));
let delArm=null;

// --- partage des goûts ---
let unsubGouts=null, lastGouts=null, goutsWriting=false, goutsDirty=false;
const goutsPayload=()=>({avis:state.avis,exclus:state.exclus,exterieurHabituel:state.outDefault,repartition:state.mix});
function subscribeGouts(){ if(!DB) return; if(unsubGouts) unsubGouts();
  unsubGouts=DB.doc("famille/gouts").onSnapshot(snap=>{
    if(snap.exists&&!snap.metadata.hasPendingWrites){ const g=snap.data();
      state.avis=(g.avis&&typeof g.avis==="object")?JSON.parse(JSON.stringify(g.avis)):{}; if(cleanDays(g.exterieurHabituel)) state.outDefault=cleanDays(g.exterieurHabituel); if(cleanMix(g.repartition)) state.mix=cleanMix(g.repartition); state.exclus=(g.exclus&&typeof g.exclus==="object")?JSON.parse(JSON.stringify(g.exclus)):{};
      lastGouts=JSON.stringify(goutsPayload()); saveLocal(); render(); if(modalCtx) renderModal(); if(sheetCtx&&sheetCtx.type==="gouts") renderSheet(); }
    else if(!snap.exists&&!snap.metadata.fromCache){ lastGouts=""; goutsSync(); }
  },()=>{}); }
async function goutsSync(){ if(!DB||CAN_WRITE===false||lastGouts===null) return;
  const s=JSON.stringify(goutsPayload()); if(s===lastGouts) return;
  if(goutsWriting){goutsDirty=true;return;} goutsWriting=true; lastGouts=s;
  try{ await DB.doc("famille/gouts").set(goutsPayload()); }catch(e){}
  goutsWriting=false; if(goutsDirty){goutsDirty=false; goutsSync();} }

// --- partage des recettes de famille ---
let unsubRec=null, pendingWeek=null;
function subscribeRecettes(){ if(!DB) return; if(unsubRec) unsubRec();
  unsubRec=DB.collection("recettes").onSnapshot(q=>{
    let changed=false;
    q.docChanges().forEach(ch=>{ const x={...ch.doc.data(),id:ch.doc.id};
      if(ch.type==="removed"){ state.perso=state.perso.filter(p=>p.id!==x.id);
        if(!state.week.includes(x.id)){ const i=RECETTES.findIndex(r=>r.id===x.id); if(i>=0) RECETTES.splice(i,1); delete BYID[x.id]; } changed=true; }
      else { const r=registerRecipe(x); if(r){ state.perso=[...state.perso.filter(p=>p.id!==r.id),r]; changed=true; } } });
    if(changed){ saveLocal();
      if(pendingWeek&&pendingWeek.iso===curIso()&&pendingWeek.d.menu.every(id=>BYID[id])){ const d=pendingWeek.d; pendingWeek=null;
        applyWeekData({menu:d.menu,cooks:d.cuisiniers,checked:d.coches,statut:d.statut,journal:d.journal,absents:d.absents,invites:d.invites,approbations:d.approbations,exterieur:d.exterieur,extras:d.ajouts,quantites:d.quantites,lieux:d.lieux,tickets:d.tickets}); lastShared=JSON.stringify(sharedPayload()); }
      render(); if(modalCtx&&BYID[modalCtx.id]) renderModal(); }
  },()=>{}); }
async function saveRecipeShared(r){ if(!DB||CAN_WRITE===false) return; try{ await DB.collection("recettes").doc(r.id).set({...r}); }catch(e){ toast("La recette est gardée sur cet appareil, le partage a échoué"); } }
async function deleteRecipeShared(id){ if(!DB||CAN_WRITE===false) return; try{ await DB.collection("recettes").doc(id).delete(); }catch(e){} }

// ======================= Fenêtres plein écran =======================
let sheetCtx=null, wakeLock=null;
function openSheet(ctx){ sheetCtx=ctx; $("sheet").hidden=false; document.body.style.overflow="hidden"; renderSheet(); $("sbody").scrollTop=0; if(ctx.wake) keepAwake(true); try{$("sclose").focus();}catch(e){} }
function closeSheet(){ const c=sheetCtx; if(c&&c.type==="wizard"&&!state.onboarded){ state.onboarded=true; saveLocal(); }
  sheetCtx=null; $("sheet").hidden=true; if(!modalCtx) document.body.style.overflow=""; keepAwake(false); if(c&&c.after) c.after(); }
function renderSheet(){ const c=sheetCtx; if(!c) return; $("sheet").dataset.type=c.type;
  ({gallery:renderGallery,shop:renderShop,cook:renderCook,wizard:renderWizard,recipe:renderRecipeForm,gouts:renderGouts,export:renderExport,retour:renderRetourSheet,bilan:renderBilan,historique:renderHistorique})[c.type](); }
async function keepAwake(on){ try{ if(on&&navigator.wakeLock&&!wakeLock){ wakeLock=await navigator.wakeLock.request("screen"); wakeLock.addEventListener&&wakeLock.addEventListener("release",()=>{wakeLock=null;}); }
  else if(!on&&wakeLock){ const w=wakeLock; wakeLock=null; await w.release(); } }catch(e){ wakeLock=null; } }
document.addEventListener("visibilitychange",()=>{ if(document.visibilityState==="visible"&&sheetCtx&&sheetCtx.wake&&!wakeLock) keepAwake(true); });
$("sclose").onclick=closeSheet;
window.addEventListener("keydown",e=>{ if(e.key==="Escape"&&sheetCtx){ e.stopPropagation(); closeSheet(); } },true);

// --- Galerie de plats ---
function renderGallery(){ const c=sheetCtx, d=c.d;
  $("seyebrow").textContent=d===null?"Recettes":`${JOURS[d]} ${fmtShort(dayOffset(d))}`; $("stitle").textContent="Choisir le plat"; $("sextra").innerHTML="";
  const F=[["tous","Tous"],["eco","Économiques"],["moyen","Budget moyen"],["plaisir","Plaisir"],["rapides","20 min max"],["promo","En promo"],["aimes","Aimés"],["vege","Sans viande"],["famille","De la famille"]];
  $("sbody").innerHTML=`<input class="gsearch" id="gq" type="search" placeholder="Rechercher un plat" value="${esc(c.q||"")}" aria-label="Rechercher un plat" autocomplete="off">
    <div class="gfilters">${F.map(([k,l])=>`<button class="chip${(c.filter||"tous")===k?" on":""}" data-gf="${k}">${l}</button>`).join("")}</div>
    <div class="gfilters"><button class="chip${!c.cuis?" on":""}" data-gc="tous">Toutes les cuisines</button>${Object.entries(CUISINES).map(([k,l])=>`<button class="chip${c.cuis===k?" on":""}" data-gc="${k}">${l}</button>`).join("")}</div><div class="ggrid" id="ggrid"></div>`;
  $("sfoot").innerHTML=`<button class="btn edit-only" data-newrec="1">Ajouter une recette de famille</button>`;
  renderGalleryGrid(); }
function renderGalleryGrid(){ const c=sheetCtx, d=c.d, q=(c.q||"").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g,""), f=c.filter||"tous";
  let list=RECETTES.filter(r=>!q||r.nom.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g,"").includes(q));
  if(c.cuis) list=list.filter(r=>r.c===c.cuis); if(["eco","moyen","plaisir"].includes(f)) list=list.filter(r=>budgetOf(r)===f); if(f==="vege") list=list.filter(r=>r.p==="vege"||r.p==="oeufs"); if(f==="rapides") list=list.filter(r=>r.t<=20); if(f==="promo") list=list.filter(r=>promoCount(r)); if(f==="aimes") list=list.filter(r=>likeScore(r)>0); if(f==="famille") list=list.filter(r=>r.perso);
  list.sort((a,b)=>(dislikesFor(a,d).length-dislikesFor(b,d).length)||(likeScore(b)-likeScore(a))||(promoCount(b)-promoCount(a))||a.t-b.t);
  $("ggrid").innerHTML=list.length?list.map(r=>{const w=dislikesFor(r,d), cur=d!==null&&state.week[d]===r.id, other=state.week.map((id,i)=>id===r.id&&i!==d?JOURS[i].slice(0,3):null).filter(Boolean);
    return `<button class="gcard${cur?" cur":""}" data-pickrec="${r.id}"><img src="${photoSrc(r.id)}" alt="" loading="lazy" decoding="async"><span class="gname">${esc(r.nom)}</span>
      <span class="gmeta"><span class="bdg b-${budgetOf(r)}">${BUDGETS[budgetOf(r)].court}</span> ${r.t} min${r.c?" · "+CUISINES[r.c]:""}${promoCount(r)?' · <span class="promo">promo</span>':""}${likeScore(r)?` · aimé par ${likeScore(r)}`:""}</span>
      ${cur?'<span class="gtag">Plat actuel</span>':other.length?`<span class="gtag soft">Déjà ${other.join(", ")}</span>`:""}
      ${w.length?`<span class="gwarn">${esc(w.join(", "))} n'aime${w.length>1?"nt":""} pas</span>`:""}</button>`}).join("")
    : `<p class="note">Aucun plat ne correspond. Essayez un autre filtre.</p>`; }
$("sbody").addEventListener("input",e=>{ if(e.target.id==="gq"&&sheetCtx&&sheetCtx.type==="gallery"){ sheetCtx.q=e.target.value; renderGalleryGrid(); } });

// --- Mode magasin ---
function renderShop(){ const c=sheetCtx, t=c.t, items=coursesTrips()[t], plan=planTrip(t,items), stores=[plan.primary,plan.secondary].filter(Boolean);
  if(c.stop>=stores.length) c.stop=0; const mag=stores[c.stop];
  const sitems=items.filter(i=>plan.assign[i.k]===mag).sort((a,b)=>ORDRE.indexOf(a.ray)-ORDRE.indexOf(b.ray)||a.n.localeCompare(b.n,"fr"));
  const done=sitems.filter(i=>state.checked[i.ck]).length;
  $("seyebrow").textContent=`Courses de la semaine · ${fmtD(tripDate(t))}`; $("stitle").textContent=MAGNOM[mag];
  $("sextra").innerHTML=`<span class="scount">${done}/${sitems.length}</span>`;
  $("sbody").innerHTML=(stores.length>1?`<div class="gfilters">${stores.map((m,i)=>`<button class="chip${i===c.stop?" on":""}" data-stop="${i}">Arrêt ${i+1} · ${MAGNOM[m]}</button>`).join("")}</div>`:"")+
    (sitems.length?ORDRE.map(ray=>{const its=sitems.filter(i=>i.ray===ray); if(!its.length) return "";
      return `<h3 class="shopray">${RAYONS[ray]}</h3>`+its.map(i=>{const ck=!!state.checked[i.ck], pr=promosFor(i.n).find(p=>p.mag===ensOf(mag)&&validOn(p,tripDate(t)));
        return `<div class="shoprow"><button class="shopitem${ck?" done":""}" data-shopk="${esc(i.ck)}" aria-pressed="${ck}"><span class="sbox" aria-hidden="true">${ck?"✓":""}</span><span class="sname">${esc(i.n)}${pr?`<small>Promo ${eur(pr.prix)}</small>`:""}</span></button><button type="button" class="sqty sqtybtn${ck?" done":""}" data-qedit="${esc(i.k)}" aria-label="Changer la quantité de ${esc(i.n)}">${esc(qtyOf(i))||"Qté"}<i class="qtpen" aria-hidden="true">✎</i></button></div>`}).join("")}).join("")
     :`<p class="note">Rien à acheter ici.</p>`)+
    (done===sitems.length&&sitems.length?`<div class="shopdone">Tout est dans le caddie.</div>`:"");
  $("sfoot").innerHTML=`<div class="track big"><i style="width:${sitems.length?done/sitems.length*100:0}%"></i></div><button class="btn primary" data-shopend="1">${done===sitems.length?"Terminer":"Fermer"}</button>`; }

// --- Mode cuisine ---
let TIMERS=[], timerTick=null, audioCtx=null;
function parseMinutes(txt){ const out=[]; const re=/(\d+)\s*(?:à|-)?\s*(\d+)?\s*minutes?/gi; let m; while((m=re.exec(txt))) out.push(+(m[2]||m[1])); return out.filter(n=>n>0&&n<=240); }
function renderCook(){ const c=sheetCtx, r=BYID[c.id], steps=getSteps(c.id), n=steps.length||1, i=Math.min(c.step,n-1);
  $("seyebrow").textContent=steps.length?`Étape ${i+1} sur ${n}`:"Préparation"; $("stitle").textContent=r.nom;
  $("sextra").innerHTML="";
  const txt=steps[i]||"Pas d'étapes enregistrées pour cette recette.", mins=parseMinutes(txt);
  $("sbody").innerHTML=`<div class="cprog">${steps.map((_,k)=>`<i class="${k<i?"past":k===i?"now":""}"></i>`).join("")}</div>
    <p class="cstep">${esc(txt)}</p>
    ${mins.length?`<div class="actions">${[...new Set(mins)].map(m=>`<button class="btn primary big" data-timer="${m}">Minuteur ${m} min</button>`).join("")}</div>`:""}
    <div id="timers" class="timers"></div>
    <details class="cing"><summary>Ingrédients pour ${headcount(c.d)} personne${headcount(c.d)>1?"s":""}</summary><ul class="ing">${r.ing.map(([nn,q,u])=>`<li><span>${esc(nn)}</span><span>${fmt(scale(q,c.d),u)}</span></li>`).join("")}</ul></details>`;
  $("sfoot").innerHTML=`<button class="btn big" data-cstep="-1"${i===0?" disabled":""}>Précédent</button>${i<n-1?`<button class="btn primary big" data-cstep="1">Suivant</button>`:`<button class="btn primary big" data-cookend="1">Terminé, bon appétit !</button>`}`;
  renderTimers(); }
function renderTimers(){ const box=$("timers"); if(!box) return; const now=Date.now();
  box.innerHTML=TIMERS.map((t,k)=>{const left=Math.max(0,Math.round((t.end-now)/1000)), mm=Math.floor(left/60), ss=String(left%60).padStart(2,"0");
    return `<div class="timer${left===0?" ring":""}"><span>${esc(t.label)}</span><b>${mm}:${ss}</b><button class="chip" data-tstop="${k}">${left===0?"OK":"Arrêter"}</button></div>`}).join(""); }
function startTimer(min,label){ try{ audioCtx=audioCtx||new (window.AudioContext||window.webkitAudioContext)(); }catch(e){}
  TIMERS.push({end:Date.now()+min*60000,label,rang:false}); if(!timerTick) timerTick=setInterval(tickTimers,1000); renderTimers(); toast(`Minuteur de ${min} min lancé`); }
function beep(){ try{ if(!audioCtx) return; const o=audioCtx.createOscillator(), g=audioCtx.createGain(); o.frequency.value=880; o.connect(g); g.connect(audioCtx.destination);
  g.gain.setValueAtTime(0.0001,audioCtx.currentTime); g.gain.exponentialRampToValueAtTime(0.3,audioCtx.currentTime+0.02); g.gain.exponentialRampToValueAtTime(0.0001,audioCtx.currentTime+0.9); o.start(); o.stop(audioCtx.currentTime+1); }catch(e){} }
function tickTimers(){ const now=Date.now(); TIMERS.forEach(t=>{ if(!t.rang&&now>=t.end){ t.rang=true; beep(); setTimeout(beep,1100); try{navigator.vibrate&&navigator.vibrate([300,150,300]);}catch(e){} toast("Minuteur terminé : "+t.label); } });
  if(!TIMERS.length){ clearInterval(timerTick); timerTick=null; } renderTimers(); }

// --- Guide de démarrage ---
function renderWizard(){ const c=sheetCtx, st=c.step;
  $("seyebrow").textContent=`Étape ${st+1} sur 3`; $("sextra").innerHTML="";
  if(st===0){ $("stitle").textContent="Qui mange à la maison ?";
    $("sbody").innerHTML=`<p class="wlead">Ajoutez chaque membre de la famille. L'adresse e-mail (facultative) sert à lui envoyer les menus et la liste des courses.</p>
      <div class="mlist">${state.family.map((n,i)=>`<div class="wmember"><b>${esc(n)}</b><span>${esc(state.emails[n]||"")}</span><button class="mdel" data-wdel="${i}" aria-label="Retirer ${esc(n)}">×</button></div>`).join("")||`<p class="note">Personne pour l'instant.</p>`}</div>
      <form class="addrow addmember owner-only" id="wform"><input id="wname" type="text" placeholder="Prénom" maxlength="20" autocomplete="off" aria-label="Prénom"><input id="wmail" type="email" inputmode="email" placeholder="E-mail (facultatif)" maxlength="120" autocomplete="off" aria-label="Adresse e-mail"><button class="btn primary" type="submit">Ajouter</button></form>`; }
  if(st===1){ $("stitle").textContent="Quand faites-vous les courses ?";
    $("sbody").innerHTML=`<p class="wlead">Deux passages par semaine gardent les produits frais. L'épicerie et les surgelés sont achetés à la première course.</p>
      <label class="wfield">Première course<select id="wt1" class="pick"><option value="sam"${state.trip1==="sam"?" selected":""}>Samedi, avant la semaine</option><option value="lun"${state.trip1==="lun"?" selected":""}>Lundi</option></select></label>`; }
  if(st===2){ $("stitle").textContent="Vos magasins";
    const near=MAGASINS.slice().sort((a,b)=>km(HOME,a)-km(HOME,b));
    $("sbody").innerHTML=`<p class="wlead">Touchez les magasins où vous allez, dans votre ordre de préférence : le premier touché devient votre magasin habituel.</p>
      <div class="wstores">${near.map(m=>{const r=state.storeOrder.indexOf(m.id);
        return `<button class="wstore${r>=0?" on":""}" data-wpick="${m.id}"><b>${r>=0?`<span class="wrank">${r+1}</span>`:""}${esc(m.nom)}</b><small>${esc(m.lieu)} · ≈ ${kmTxt(km(HOME,m))}</small></button>`}).join("")}</div>
      <label class="wfield">Comment choisir le magasin de chaque course<select id="wmode" class="pick"><option value="auto"${state.storeMode==="auto"?" selected":""}>Le plus avantageux, selon mon ordre</option><option value="fixe"${state.storeMode==="fixe"?" selected":""}>Toujours mon magasin habituel</option></select></label>
      <p class="note">Vous pourrez modifier ce choix et l'ordre dans Réglages.</p>`; }
  $("sfoot").innerHTML=`${st>0?`<button class="btn big" data-wstep="-1">Retour</button>`:`<button class="btn big" data-wskip="1">Plus tard</button>`}<button class="btn primary big" data-wstep="1">${st<2?"Continuer":"C'est parti !"}</button>`; }

// --- Goûts d'un membre ---
function renderGouts(){ const c=sheetCtx, n=state.family[c.i]; if(!n){ closeSheet(); return; }
  $("seyebrow").textContent="Goûts"; $("stitle").textContent=n; $("sextra").innerHTML="";
  const ex=state.exclus[n]||[];
  $("sbody").innerHTML=`<h3 class="shopray">Ingrédients que ${esc(n)} ne mange pas</h3>
    <div class="gfilters wrapchips">${ALL_ING().map(x=>`<button class="chip${ex.includes(x)?" on warn":""} edit-ctl" data-excl="${esc(x)}" aria-pressed="${ex.includes(x)}">${esc(x)}</button>`).join("")}</div>
    <h3 class="shopray">Plats</h3>
    <div class="avislist">${RECETTES.map(r=>{const v=(state.avis[r.id]||{})[n]||0;
      return `<div class="avisrow"><span>${esc(r.nom)}</span><button class="avb up edit-ctl" data-gavis="${r.id}|1" aria-pressed="${v===1}">J'aime</button><button class="avb down edit-ctl" data-gavis="${r.id}|-1" aria-pressed="${v===-1}">Pas pour moi</button></div>`}).join("")}</div>`;
  $("sfoot").innerHTML=`<button class="btn primary big" data-sclose="1">Terminé</button>`; }

// --- Formulaire de recette de famille ---
const UNITS=[["g","grammes"],["cl","centilitres"],["","pièces"]];
function newDraft(){ return {nom:"",acc:"",t:30,pers:5,ing:[["",0,"g","fl"],["",0,"g","fl"],["",0,"g","fl"]],etapes:"",astuce:"",photo:null,prix:""}; }
function renderRecipeForm(){ const c=sheetCtx, dr=c.draft;
  $("seyebrow").textContent=c.editId?"Modifier la recette":"Nouvelle recette de famille"; $("stitle").textContent=dr.nom||"Recette"; $("sextra").innerHTML="";
  $("sbody").innerHTML=`<form id="rform" class="rform">
    <div class="wfield"><span>Importer depuis un lien (facultatif)</span><div style="display:flex;gap:8px"><input id="rf-lien" type="url" inputmode="url" placeholder="https://…" style="flex:1;min-width:0"><button type="button" class="btn" data-rflien="1">Remplir</button></div><small class="note">Remplit le nom, les ingrédients et les étapes. Vérifiez avant d'enregistrer.</small></div>
    <label class="wfield">Nom du plat<input id="rf-nom" type="text" maxlength="60" value="${esc(dr.nom)}" placeholder="Ex. : lasagnes de mamie" required></label>
    <label class="wfield">Accompagnement<input id="rf-acc" type="text" maxlength="60" value="${esc(dr.acc)}" placeholder="Ex. : salade verte"></label>
    <div class="rgrid2"><label class="wfield">Temps (minutes)<input id="rf-t" type="number" inputmode="numeric" min="5" max="240" value="${esc(dr.t)}"></label>
      <label class="wfield">Pour combien de personnes<input id="rf-pers" type="number" inputmode="numeric" min="1" max="20" value="${esc(dr.pers)}"></label></div>
    <div class="wfield"><span>Photo (facultatif)</span><div class="rphoto">${dr.photo?`<img src="${dr.photo}" alt="">`:""}<label class="btn">${dr.photo?"Changer la photo":"Ajouter une photo"}<input id="rf-photo" type="file" accept="image/*" hidden></label>${dr.photo?`<button type="button" class="btn" data-rfnophoto="1">Retirer</button>`:""}</div></div>
    <fieldset class="ringr"><legend>Ingrédients</legend>
      ${dr.ing.map(([n,q,u,ray],k)=>`<div class="ingrow"><input list="inglist" type="text" data-rf="n" data-k="${k}" value="${esc(n)}" placeholder="Ingrédient" aria-label="Ingrédient ${k+1}">
        <input type="number" inputmode="decimal" min="0" step="any" data-rf="q" data-k="${k}" value="${q||""}" placeholder="Qté" aria-label="Quantité">
        <select data-rf="u" data-k="${k}" aria-label="Unité">${UNITS.map(([v,l])=>`<option value="${v}"${u===v?" selected":""}>${l}</option>`).join("")}</select>
        <select data-rf="ray" data-k="${k}" aria-label="Rayon">${RAYKEYS.map(v=>`<option value="${v}"${ray===v?" selected":""}>${RAYONS[v]}</option>`).join("")}</select>
        <button type="button" class="mdel" data-rfdel="${k}" aria-label="Retirer cet ingrédient">×</button></div>`).join("")}
      <datalist id="inglist">${ALL_ING().map(x=>`<option value="${esc(x)}">`).join("")}</datalist>
      <button type="button" class="btn" data-rfadd="1">Ajouter un ingrédient</button></fieldset>
    <label class="wfield">Étapes : une par ligne, sans numéro (la numérotation est automatique)<textarea id="rf-etapes" rows="6" placeholder="Faire revenir l'oignon 3 minutes.&#10;Ajouter la viande…">${esc(dr.etapes)}</textarea><small id="rf-etapes-cpt" class="note">${compteEtapes(dr.etapes)}</small></label>
    <label class="wfield">Astuce (facultatif)<input id="rf-astuce" type="text" maxlength="200" value="${esc(dr.astuce)}"></label>
    <label class="wfield">Coût estimé du plat en euros (facultatif, pour les ingrédients inconnus de l'application)<input id="rf-prix" type="number" inputmode="decimal" min="0" step="0.5" value="${esc(dr.prix)}"></label>
  </form>`;
  $("sfoot").innerHTML=`<button class="btn big" data-sclose="1">Annuler</button><button class="btn primary big" data-rfsave="1">Enregistrer</button>`; }
const API_RECETTE="https://menus-semaine-man20671.vercel.app/api/recette";
function parseLigneIng(l){
  const m=/^(\d+(?:[.,]\d+)?)\s*(kg|g|gr|cl|ml|l)?\.?\s+(?:de |d'|d’)?(.+)$/i.exec(String(l).trim());
  if(!m) return [String(l).trim().slice(0,40),0,"","fl"];
  let q=parseFloat(m[1].replace(",",".")), u=(m[2]||"").toLowerCase(), nom=m[3].trim();
  if(u==="kg"){ q*=1000; u="g"; } else if(u==="gr"){ u="g"; } else if(u==="l"){ q*=100; u="cl"; } else if(u==="ml"){ q/=10; u="cl"; }
  else if(u!=="g"&&u!=="cl"){ if(u) nom=(m[2]+" "+nom); u=""; }
  return [nom.slice(0,40),Math.round(q*100)/100,u,"fl"];
}
async function importerLien(url){
  const r=await fetch(API_RECETTE+"?url="+encodeURIComponent(url));
  const j=await r.json().catch(()=>({}));
  if(!r.ok) throw new Error(j.erreur||"Lecture impossible");
  return j;
}
function compteEtapes(txt){ const n=String(txt||"").split(/\n+/).filter(x=>x.trim()).length; return n+(n>1?" étapes":n?" étape":"")+" (20 maximum)"; }
function readRecipeForm(){ const dr=sheetCtx.draft, v=id=>{const e=$(id); return e?e.value:"";};
  dr.nom=v("rf-nom").trim(); dr.acc=v("rf-acc").trim(); dr.t=+v("rf-t")||30; dr.pers=+v("rf-pers")||5; dr.etapes=v("rf-etapes"); dr.astuce=v("rf-astuce").trim(); dr.prix=v("rf-prix");
  document.querySelectorAll("#rform [data-rf]").forEach(el=>{ const k=+el.dataset.k, f=el.dataset.rf; if(!dr.ing[k]) return;
    if(f==="n") dr.ing[k][0]=el.value; if(f==="q") dr.ing[k][1]=+el.value||0; if(f==="u") dr.ing[k][2]=el.value; if(f==="ray") dr.ing[k][3]=el.value; }); }
function resizePhoto(file){ return new Promise((res,rej)=>{ const fr=new FileReader(); fr.onload=()=>{ const img=new Image(); img.onload=()=>{
  const W=480,H=360, cv=document.createElement("canvas"); cv.width=W; cv.height=H; const g=cv.getContext("2d");
  const sc=Math.max(W/img.width,H/img.height), w=img.width*sc, h=img.height*sc; g.drawImage(img,(W-w)/2,(H-h)/2,w,h);
  res(cv.toDataURL("image/jpeg",0.72)); }; img.onerror=rej; img.src=fr.result; }; fr.onerror=rej; fr.readAsDataURL(file); }); }
function saveRecipe(){ readRecipeForm(); const c=sheetCtx, dr=c.draft;
  if(!dr.nom){ toast("Donnez un nom au plat"); $("rf-nom").focus(); return; }
  const k=5/Math.max(1,dr.pers);
  const ing=dr.ing.filter(([n])=>n.trim()).map(([n,q,u,ray])=>[n.trim(),Math.round(q*k*100)/100,u,ray]);
  if(!ing.length){ toast("Ajoutez au moins un ingrédient"); return; }
  // Étapes : une par ligne ; la numérotation collée (« 1. », « 2) », « - ») est retirée
  const etapes=dr.etapes.split(/\n+/).map(x=>x.trim().replace(/^(\d+[.)]|[-•*])\s+/,"")).filter(Boolean);
  if(etapes.length>20){ toast("20 étapes maximum : regroupez certaines étapes"); $("rf-etapes").focus(); return; }
  if(ing.length>30){ toast("30 ingrédients maximum"); return; }
  const raw={id:c.editId||("p"+Date.now().toString(36)),nom:dr.nom,acc:dr.acc,t:dr.t,ing,etapes,astuce:dr.astuce,photo:dr.photo,prix:dr.prix?Math.round(+dr.prix*k*100)/100:null,auteur:ME};
  const r=registerRecipe(raw); if(!r){ toast("Recette invalide"); return; }
  state.perso=[...state.perso.filter(p=>p.id!==r.id),r]; saveLocal(); saveRecipeShared(r);
  const d=c.forDay; sheetCtx.after=null; closeSheet();
  if(d!==undefined&&d!==null) replaceDay(d,r.id); else { render(); if(modalCtx&&modalCtx.id===r.id) renderModal(); }
  toast(c.editId?"Recette mise à jour":"Recette ajoutée"); }

// --- Clics dans les fenêtres plein écran ---
$("sheet").addEventListener("click",async e=>{ const c=sheetCtx; if(!c) return; const T=e.target.closest("button,a,[data-gf]")||e.target; const D=T.dataset||{};
  if(D.sclose){ closeSheet(); return; }
  if(c.type==="export"){ handleExportClick(D,T); return; }
  if(c.type==="gallery"){ if(D.gf){ c.filter=D.gf; renderGallery(); return; } if(D.gc){ c.cuis=D.gc==="tous"?null:D.gc; renderGallery(); return; }
    if(D.pickrec){ const d=c.d; closeSheet(); if(d===null){ openMeal(D.pickrec,null); return; } if(state.week[d]!==D.pickrec) replaceDay(d,D.pickrec); if(modalCtx&&modalCtx.d===d){ modalCtx.id=state.week[d]; renderModal(); } return; }
    if(D.newrec){ const d=c.d; closeSheet(); openSheet({type:"recipe",draft:newDraft(),forDay:d}); return; } }
  if(c.type==="shop"){ if(D.stop){ c.stop=+D.stop; renderShop(); return; }
    if(D.shopk){ const k=D.shopk; if(state.checked[k]) delete state.checked[k]; else state.checked[k]=true; save(); renderCourses(); renderShop(); try{navigator.vibrate&&navigator.vibrate(15);}catch(err){} return; }
    if(D.shopend){ closeSheet(); return; } }
  if(c.type==="cook"){ if(D.cstep){ c.step=Math.max(0,c.step+(+D.cstep)); renderCook(); $("sbody").scrollTop=0; return; }
    if(D.timer){ startTimer(+D.timer,BYID[c.id].nom+" · étape "+(c.step+1)); return; }
    if(D.tstop){ TIMERS.splice(+D.tstop,1); renderTimers(); return; }
    if(D.cookend){ const {id,d}=c; closeSheet(); openMeal(id,d); setTimeout(()=>{const a=$("avis"); if(a){a.scrollIntoView({behavior:"smooth"}); a.classList.add("flash");}},250); toast("Bon appétit ! Donnez votre avis sur ce plat."); return; } }
  if(c.type==="wizard"){
    if(D.wdel){ const n=state.family[+D.wdel]; state.family.splice(+D.wdel,1); if(state.emails[n]){const em={...state.emails}; delete em[n]; state.emails=em;} syncPersons(); save(); render(); renderWizard(); return; }
    if(D.wpick){ const id=D.wpick; if(c.fresh!==true){ c.fresh=true; state.storeOrder=[]; }
      if(state.storeOrder.includes(id)){ if(state.storeOrder.length>1) state.storeOrder=state.storeOrder.filter(x=>x!==id); } else state.storeOrder=[...state.storeOrder,id];
      if(!state.storeOrder.length) state.storeOrder=[id]; save(); render(); renderWizard(); return; }
    if(D.wstore!==undefined){ if(D.wstore){ state.storeMode="fixe"; state.storeOrder=[D.wstore,...state.storeOrder.filter(x=>x!==D.wstore)]; state.storeOff=state.storeOff.filter(x=>x!==D.wstore); } else state.storeMode="auto"; save(); render(); renderWizard(); return; }
    if(D.wskip){ closeSheet(); return; }
    if(D.wstep){ if(c.step===1){ state.trip1=$("wt1").value; save(); }
      if(c.step===2&&$("wmode")){ state.storeMode=$("wmode").value; save(); }
      if(c.step===0&&!state.family.length&&+D.wstep>0){ toast("Ajoutez au moins une personne, ou touchez « Plus tard »"); return; }
      const nx=c.step+(+D.wstep); if(nx>2){ state.onboarded=true; save(); closeSheet(); render(); toast("C'est prêt ! Bon appétit cette semaine."); return; }
      c.step=Math.max(0,nx); renderWizard(); return; } }
  if(c.type==="gouts"){
    if(D.excl){ const n=state.family[c.i], x=D.excl, cur=new Set(state.exclus[n]||[]); cur.has(x)?cur.delete(x):cur.add(x);
      const ex={...state.exclus}; if(cur.size) ex[n]=[...cur]; else delete ex[n]; state.exclus=ex; save(); render(); renderGouts(); return; }
    if(D.gavis){ const [rid,v]=D.gavis.split("|"); setAvis(rid,state.family[c.i],+v); renderGouts(); return; } }
  if(c.type==="recipe"){
    if(D.rflien){ readRecipeForm(); const lien=($("rf-lien")||{}).value||"";
      if(!/^https?:\/\//.test(lien)){ toast("Collez un lien complet (https://…)"); return; }
      toast("Lecture de la recette…");
      try{ const j=await importerLien(lien); const dr=c.draft;
        dr.nom=j.titre||dr.nom; dr.t=j.tempsMinutes||dr.t; dr.pers=j.portions||dr.pers;
        const ing=(j.ingredients||[]).map(parseLigneIng).filter(x=>x[0]).slice(0,30);
        dr.ing=ing.length?ing:dr.ing; dr.etapes=(j.etapes||[]).join("\n");
        renderRecipeForm(); toast("Recette remplie : vérifiez avant d'enregistrer"); }
      catch(err){ toast(err.message||"Lecture impossible : saisissez la recette à la main"); }
      return; }
    if(D.rfadd){ readRecipeForm(); c.draft.ing.push(["",0,"g","fl"]); renderRecipeForm(); return; }
    if(D.rfdel){ readRecipeForm(); c.draft.ing.splice(+D.rfdel,1); if(!c.draft.ing.length) c.draft.ing.push(["",0,"g","fl"]); renderRecipeForm(); return; }
    if(D.rfnophoto){ readRecipeForm(); c.draft.photo=null; renderRecipeForm(); return; }
    if(D.rfsave){ saveRecipe(); return; } }
});
$("sheet").addEventListener("submit",e=>{ if(e.target.id==="wform"){ e.preventDefault(); const n=$("wname").value.trim(), m=$("wmail").value.trim();
    if(!n) return; if(state.family.some(x=>x.toLowerCase()===n.toLowerCase())){ toast(n+" est déjà dans la famille"); return; }
    if(m&&!validMail(m)){ toast("Adresse e-mail invalide : vérifiez-la"); return; }
    state.family.push(n); if(m) state.emails={...state.emails,[n]:m}; syncPersons(); save(); render(); renderWizard(); setTimeout(()=>{try{$("wname").focus();}catch(err){}},0); }
  if(e.target.id==="rform"){ e.preventDefault(); } });
$("sheet").addEventListener("change",async e=>{ if(e.target.id==="rf-photo"&&e.target.files&&e.target.files[0]){ readRecipeForm();
    try{ sheetCtx.draft.photo=await resizePhoto(e.target.files[0]); renderRecipeForm(); }catch(err){ toast("Impossible de lire cette photo"); } } });
$("sheet").addEventListener("input",e=>{ if(e.target.id==="rf-nom") $("stitle").textContent=e.target.value||"Recette";
  if(e.target.id==="rf-etapes") $("rf-etapes-cpt").textContent=compteEtapes(e.target.value); });

// --- Avis ---
function setAvis(rid,n,v){ if(!n) return; const a={...(state.avis[rid]||{})}; if(a[n]===v) delete a[n]; else a[n]=v;
  const all={...state.avis}; if(Object.keys(a).length) all[rid]=a; else delete all[rid]; state.avis=all; save(); render(); if(modalCtx) renderModal(); }

// --- Clics dans la fiche repas (avis, galerie, mode cuisine, recette perso) ---
$("mbody").addEventListener("click",e=>{ const b=e.target.closest("button"); if(!b||!modalCtx) return; const D=b.dataset;
  if(D.avis){ const [i,v]=D.avis.split("|").map(Number); setAvis(modalCtx.id,state.family[i],v); return; }
  if(D.outtoggle){ toggleOut(+D.outtoggle); return; }
  if(D.gallery){ openSheet({type:"gallery",d:+D.gallery}); return; }
  if(D.swap){ const d=+D.swap, prev=state.week[d];
    const pool=RECETTES.filter(r=>!state.week.includes(r.id)&&!dislikesFor(r,d).length); const alt=(pool.length?pool:RECETTES.filter(r=>r.id!==prev));
    const pick=alt[Math.floor(Math.random()*alt.length)].id; replaceDay(d,pick); modalCtx.id=state.week[d]; renderModal(); return; }
  if(D.cookmode){ const {id,d}=modalCtx; openSheet({type:"cook",id,d,step:0,wake:true}); return; }
  if(D.editrec){ const r=BYID[D.editrec]; openSheet({type:"recipe",editId:r.id,draft:{nom:r.nom,acc:r.acc,t:r.t,pers:5,ing:r.ing.map(x=>[...x]),etapes:(r.etapes||[]).join("\n"),astuce:r.astuce||"",photo:r.photo,prix:r.prix||""},
      after:()=>{ if(modalCtx) renderModal(); }}); return; }
  if(D.delrec){ const id=D.delrec; if(state.weeks&&Object.values(state.weeks).some(w=>w.menu&&w.menu.includes(id))||state.week.includes(id)){ toast("Ce plat est au menu : remplacez-le d'abord"); return; }
    if(delArm!==id){ delArm=id; renderModal(); setTimeout(()=>{ if(delArm===id){ delArm=null; if(modalCtx) renderModal(); } },4000); return; }
    delArm=null; state.perso=state.perso.filter(p=>p.id!==id); const i=RECETTES.findIndex(r=>r.id===id); if(i>=0) RECETTES.splice(i,1); delete BYID[id];
    saveLocal(); deleteRecipeShared(id); closeMeal(); render(); toast("Recette supprimée"); return; }
});

// --- Divers boutons ---
$("tripsel").addEventListener("click",e=>{ const v=e.target.closest("[data-tripvue]"); if(v){ tripVue=+v.dataset.tripvue; renderCourses(); if(typeof renderApSugg==="function") renderApSugg(); return; } });
$("aisles").addEventListener("click",e=>{ const b=e.target.closest("[data-shop]"); if(b) openSheet({type:"shop",t:+b.dataset.shop,stop:0,wake:true}); });
$("members").addEventListener("click",e=>{ const b=e.target.closest("[data-gouts]"); if(b) openSheet({type:"gouts",i:+b.dataset.gouts}); });
let ensFilter="";
function renderStoreOrder(){
  $("storemode").value=state.storeMode;
  const custom=state.home&&!COMMUNES.some(([n])=>n===state.home.nom);
  if(state.home&&state.home.adresse&&!$("addr-cp").value){ $("addr-rue").value=state.home.adresse.rue||""; $("addr-cp").value=state.home.adresse.cp||""; }
  $("homesel").innerHTML=(custom?`<option value="__custom" selected>${esc(HOME.nom)}</option>`:"")+COMMUNES.map(([n])=>`<option value="${esc(n)}"${!custom&&HOME.nom===n?" selected":""}>${esc(n)}</option>`).join("");
  renderGkey();
  $("homenote").textContent=`Les distances et les frais de route sont calculés depuis ${HOME.nom}${HOME.precision==="exacte"?" (position exacte)":HOME.precision==="rue"?" (milieu de la rue)":" (centre de la localité : entrez votre rue pour plus de précision)"}. Ce réglage est propre à cet appareil.`;
  const n=state.storeOrder.length;
  $("sorder").innerHTML=state.storeOrder.map((id,i)=>{const m=MAGBYID(id);
    return `<li class="sitem"><span class="srank">${i+1}</span><span class="sinfo"><b>${esc(m.nom)}</b><small>${esc(m.lieu)} · ≈ ${kmTxt(km(HOME,m))}${i===0?" · magasin habituel":""}${m.perso?" · ajouté par vous":""}${inRayon(m)?"":` · <span class="rtwarn">à plus de ${rayonKm()} km : pas utilisé pour les courses</span>`}</small></span>
      <span class="sbtns"><button class="sbtn" data-sup="${i}" ${i===0?"disabled":""} aria-label="Monter ${esc(m.nom)}">↑</button><button class="sbtn" data-sdown="${i}" ${i===n-1?"disabled":""} aria-label="Descendre ${esc(m.nom)}">↓</button>
      <button class="sbtn wide" data-sdel="${id}" ${n<=1?"disabled":""}>Retirer</button></span></li>`}).join("");
  if(!$("as-ens").options.length) $("as-ens").innerHTML=Object.entries(ENS).filter(([k])=>k!=="autre").map(([k,l])=>`<option value="${k}">${l}</option>`).join("")+'<option value="autre">Autre enseigne</option>';
  const ens=[...new Set(MAGASINS.map(m=>m.ens))];
  $("ensfilter").innerHTML=[["","Toutes"],...ens.map(e=>[e,ENS[e]])].map(([k,l])=>`<button class="chip${ensFilter===k?" on":""}" data-ensf="${k}">${l}</button>`).join("");
  $("rayonchips").innerHTML=[10,12,15].map(k=>`<button class="chip${rayonKm()===k?" on":""}" data-rayon="${k}" type="button">${k} km</button>`).join("");
  $("savailtitle").textContent=`Magasins à moins de ${rayonKm()} km, du plus proche au plus loin`;
  const avail=MAGASINS.filter(m=>inRayon(m)&&!state.storeOrder.includes(m.id)&&(!ensFilter||m.ens===ensFilter)).sort((a,b)=>km(HOME,a)-km(HOME,b));
  $("savail").innerHTML=avail.length?avail.map(m=>`<div class="sitem avail"><span class="srank plus" aria-hidden="true">+</span><span class="sinfo"><b>${esc(m.nom)}</b><small>${esc(m.lieu)} · ≈ ${kmTxt(km(HOME,m))}${PROMOS.some(p=>p.mag===m.ens)?" · promos relevées":""}</small></span>
      <span class="sbtns"><button class="sbtn wide add" data-sadd="${m.id}">Ajouter</button></span></div>`).join("") : `<p class="note">Aucun autre magasin${ensFilter?" de cette enseigne":""} à moins de ${rayonKm()} km de votre domicile. Touchez « Trouver les vrais magasins autour de mon adresse » pour compléter la liste.</p>`;
  $("sordernote").textContent = state.storeMode==="fixe" ? `Toutes les courses se font chez ${MAGNOM[state.storeOrder[0]]}, sauf si vous choisissez un autre magasin dans l'onglet Courses.`
    : `Chaque rang de préférence vaut ${eur(PREF_EUR)} : un magasin moins bien classé n'est choisi que si ses promos compensent la différence et le trajet. Seuls vos magasins sont proposés.`;
}
function setHome(h){ HOME=h; state.home={...h}; saveLocal(); render();
  if((h.precision==="exacte"||h.precision==="rue")&&typeof chercherMagasinsOSM==="function"&&!(state.osmAt&&km(state.osmAt,h)<2)){ toast("Position enregistrée. Recherche des magasins autour…"); chercherMagasinsOSM(); return; }
  const far=state.storeOrder.length&&state.storeOrder.every(id=>km(HOME,MAGBYID(id))>8);
  if(far) toast("Vos magasins sont loin de cette adresse.",()=>pickNearest(),"Prendre les plus proches"); else toast("Trajets calculés depuis "+h.nom); }
// Garde le magasin le plus proche de chaque enseigne, jusqu'à 6, triés par distance
function pickNearest(){ const prev=[...state.storeOrder], seen=new Set();
  const list=MAGASINS.filter(inRayon).sort((a,b)=>km(HOME,a)-km(HOME,b)).filter(m=>{ if(seen.has(m.ens)) return false; seen.add(m.ens); return true; }).slice(0,6);
  if(!list.length){ toast("Aucun magasin connu dans votre rayon : touchez « Trouver les vrais magasins autour de mon adresse »"); return; }
  state.storeOrder=list.map(m=>m.id); state.tripStore=[null,null]; save(); render();
  toast(`Magasins les plus proches : ${list.slice(0,3).map(m=>MAGNOM[m.id]).join(", ")}…`,()=>{ state.storeOrder=prev; save(); render(); }); }
// --- Position précise : adresse -> coordonnées, et vrais magasins autour (OpenStreetMap) ---
// ---- Google Maps (clé du propriétaire, enregistrée dans la base de la famille) ----
let GKEY=null, gmLoad=null, gmToken=null;
// Google Maps abandonné : on n'utilise plus de clé et on efface celle qui aurait été gardée sur l'appareil
try{ localStorage.removeItem(KEY+"-gkey"); }catch(e){}
function chargerGoogle(){ if(!GKEY) return Promise.reject(new Error("pas de clé")); if(window.google&&google.maps&&google.maps.importLibrary) return Promise.resolve();
  if(gmLoad) return gmLoad;
  gmLoad=new Promise((ok,ko)=>{ window.__gmReady=()=>ok(); window.gm_authFailure=()=>{ GKEY_ERR=true; toast("Google Maps refuse la clé : vérifiez les restrictions de la clé (site et API autorisés)."); ko(new Error("auth")); };
    const sc=document.createElement("script"); sc.async=true; sc.onerror=()=>{ gmLoad=null; ko(new Error("load")); };
    sc.src="https://maps.googleapis.com/maps/api/js?"+new URLSearchParams({key:GKEY,v:"weekly",libraries:"places",language:"fr",region:"BE",loading:"async",callback:"__gmReady"});
    document.head.appendChild(sc); setTimeout(()=>ko(new Error("timeout")),12000); });
  return gmLoad; }
let GKEY_ERR=false;
async function adressesGoogle(q){ await chargerGoogle(); const {AutocompleteSuggestion,AutocompleteSessionToken}=await google.maps.importLibrary("places");
  if(!gmToken) gmToken=new AutocompleteSessionToken();
  const {suggestions}=await AutocompleteSuggestion.fetchAutocompleteSuggestions({input:q,includedRegionCodes:["be"],language:"fr",region:"be",sessionToken:gmToken,origin:{lat:HOME.lat,lng:HOME.lon}});
  return (suggestions||[]).map(x=>x.placePrediction).filter(Boolean).slice(0,6).map(pp=>({label:cleanTxt(pp.text&&pp.text.text||""),precis:(pp.types||[]).some(t=>["street_address","premise","subpremise"].includes(t)),
    resolve:async()=>{ const pl=pp.toPlace(); await pl.fetchFields({fields:["location","formattedAddress","types"]}); gmToken=null;
      return {label:cleanTxt(pl.formattedAddress||"").replace(/, Belgique$|, Belgium$/,""),lat:Math.round(pl.location.lat()*1e5)/1e5,lon:Math.round(pl.location.lng()*1e5)/1e5,precis:(pl.types||[]).some(t=>["street_address","premise","subpremise"].includes(t))}; }})); }
async function magasinsGoogle(R){ await chargerGoogle(); const {Place,SearchNearbyRankPreference}=await google.maps.importLibrary("places");
  const center={lat:HOME.lat,lng:HOME.lon}, out=[], vu=new Set();
  const garder=list=>(list||[]).forEach(pl=>{ if(!pl.location||vu.has(pl.id)) return; vu.add(pl.id); const nom=pl.displayName||"", txt=norm(nom);
    let b=OSM_BRANDS.find(([re])=>re.test(txt)); if(!b){ if(!(pl.types||[]).includes("supermarket")) return; b=[null,"autre"]; }
    const lat=Math.round(pl.location.lat()*1e5)/1e5, lon=Math.round(pl.location.lng()*1e5)/1e5; if(km(HOME,{lat,lon})>R/1000) return;
    const adr=cleanTxt(pl.formattedAddress||"").replace(/, Belgique$|, Belgium$/,"").replace(/\b\d{4} /,"");
    out.push({id:("g"+pl.id).replace(/[^A-Za-z0-9_-]/g,"").slice(0,90),ens:b[1],nom:(cleanTxt(nom)||ENS[b[1]]).slice(0,40),lieu:(adr||"Localisé sur la carte").slice(0,80),lat,lon}); });
  const champs=["id","displayName","location","formattedAddress","types"];
  // 20 résultats au plus par demande : les plus proches, puis une recherche par enseigne pour ne rien oublier
  const r1=await Place.searchNearby({fields:champs,locationRestriction:{center,radius:Math.min(R,50000)},includedPrimaryTypes:["supermarket","grocery_store"],maxResultCount:20,rankPreference:SearchNearbyRankPreference.DISTANCE,language:"fr",region:"be"});
  garder(r1.places);
  const enseignes=["Delhaize","Carrefour","Colruyt","Aldi","Lidl","Intermarché","OKay","Spar","Albert Heijn","Louis Delhaize"];
  await Promise.all(enseignes.map(async e=>{ try{ const r=await Place.searchByText({textQuery:e+" supermarché",fields:champs,locationBias:{center,radius:Math.min(R,50000)},maxResultCount:5,language:"fr",region:"be"}); garder(r.places); }catch(err){} }));
  return out; }
function setGoogleKey(k){ k=null; GKEY=null; gmLoad=null; GKEY_ERR=false; try{ k?localStorage.setItem(KEY+"-gkey",k):localStorage.removeItem(KEY+"-gkey"); }catch(e){} renderGkey(); }
function renderGkey(){ const b=$("gkeybox"); if(!b) return; b.hidden=!GKEY; if(!GKEY){ b.innerHTML=""; return; }
  b.innerHTML=`<b>Google Maps</b> <span class="bdg ${GKEY?"b-eco":"b-plaisir"}">${GKEY?"activé":"pas encore activé"}</span>
    <p class="note">${GKEY?"Les adresses et les magasins viennent de Google Maps. OpenStreetMap sert de secours.":"Sans clé, les adresses et les magasins viennent d'OpenStreetMap, moins complet."}</p>
    <div class="owner-only"><div class="addrow"><input id="gkey" type="text" autocomplete="off" spellcheck="false" placeholder="Clé Google Maps (commence par AIza)" value="${GKEY?esc(GKEY):""}" aria-label="Clé Google Maps"><button class="btn primary" type="button" id="gkeyok">Enregistrer</button></div>
    <p class="note">La clé est partagée avec la famille pour que tout le monde en profite. Limitez-la à votre site dans Google Cloud.</p></div>`; }
document.addEventListener("click",async e=>{ if(!e.target.closest("#gkeyok")) return; const k=$("gkey").value.trim();
  if(k&&!/^AIza[0-9A-Za-z_-]{30,}$/.test(k)){ toast("Cette clé ne ressemble pas à une clé Google Maps (elle commence par AIza)"); return; }
  setGoogleKey(k);
  if(DB){ try{ await DB.doc("validations/google").set({cle:k||null,maj:new Date().toISOString()}); toast(k?"Clé enregistrée et partagée avec la famille":"Clé retirée"); }catch(err){ toast("La clé est enregistrée sur cet appareil seulement"); } }
  else toast(k?"Clé enregistrée sur cet appareil":"Clé retirée");
  if(k){ try{ await chargerGoogle(); toast("Google Maps fonctionne"); state.osmAt=null; }catch(err){ if(!GKEY_ERR) toast("Google Maps ne répond pas : vérifiez la clé et les API activées"); } } });
function subscribeGoogle(){ if(!DB) return; DB.doc("validations/google").onSnapshot(snap=>{ if(!snap.exists) return; const d=snap.data(); const k=d&&typeof d.cle==="string"&&/^AIza[0-9A-Za-z_-]{30,}$/.test(d.cle)?d.cle:null; if(k!==GKEY) setGoogleKey(k); },()=>{}); }
// Recherche libre : Photon (OpenStreetMap, fait pour la saisie au fil de la frappe), puis Nominatim en secours
async function chercherAdresses(q){
  const out=[], add=(label,lat,lon,precis)=>{ lat=Math.round(+lat*1e5)/1e5; lon=Math.round(+lon*1e5)/1e5; if(!(lat>49.4&&lat<51.6&&lon>2.5&&lon<6.5)) return; if(!out.some(x=>km(x,{lat,lon})<0.03)) out.push({label,lat,lon,precis}); };
  const tm=ms=>{ const c=new AbortController(); setTimeout(()=>c.abort(),ms); return c.signal; };
  // 0) Google Maps quand la clé est réglée
  if(GKEY&&!GKEY_ERR){ try{ const g=await adressesGoogle(q); if(g.length) return g; }catch(e){} }
  // 1) Service officiel de la Région wallonne (adresses ICAR, registre officiel) : gratuit, sans clé
  try{ const r=await fetch("https://geoservices.wallonie.be/geocodeWS/geocode?"+new URLSearchParams({address:q,crs:"EPSG:4326"}),{signal:tm(6000)});
    if(r.ok){ const j=await r.json(); (j.candidates||[]).slice(0,6).forEach(c=>{ const g=c.geometry&&c.geometry.coordinates; if(!g) return; let [a,b]=g; if(a<40){ const t=a; a=b; b=t; } // [lon,lat] ou [lat,lon]
      const nm=o=>o&&(o.name||o.ident)?String(o.name||o.ident):""; const sc=String(c.score||"");
      const rue=[nm(c.street),c.house&&c.house.name].filter(Boolean).join(" "), lieu=[c.zone&&c.zone.ident,nm(c.city)].filter(Boolean).join(" ");
      add(([rue,lieu].filter(Boolean).join(", ")||q).replace(/</g,""), a, b, sc==="111"||!!(c.house&&c.house.name)); }); }
  }catch(e){}
  if(out.length) return out;
  // 2) Photon, puis 3) Nominatim (OpenStreetMap)
  try{ const r=await fetch("https://photon.komoot.io/api/?"+new URLSearchParams({q,limit:"7",lang:"fr",lat:String(HOME.lat),lon:String(HOME.lon),bbox:"2.5,49.45,6.45,51.55"}),{signal:tm(8000)});
    if(r.ok){ const j=await r.json(); (j.features||[]).forEach(f=>{ const p=f.properties||{}, c=f.geometry&&f.geometry.coordinates; if(!c||(p.countrycode&&p.countrycode!=="BE")) return;
      const rue=[p.street||(p.type==="street"?p.name:""),p.housenumber].filter(Boolean).join(" "), lieu=[p.postcode,p.city||p.district||p.locality||(p.type==="city"?p.name:"")].filter(Boolean).join(" ");
      add([rue||(p.type!=="city"?p.name:""),lieu].filter(Boolean).join(", ")||p.name, c[1], c[0], !!p.housenumber||p.type==="house"); }); }
  }catch(e){}
  if(!out.length){ try{ const r=await fetch("https://nominatim.openstreetmap.org/search?"+new URLSearchParams({q,format:"jsonv2",countrycodes:"be",limit:"6","accept-language":"fr",addressdetails:"1"}),{signal:tm(8000),headers:{Accept:"application/json"}});
    if(r.ok){ const j=await r.json(); (j||[]).forEach(x=>{ const a=x.address||{}; const rue=[a.road,a.house_number].filter(Boolean).join(" "), lieu=[a.postcode,a.village||a.town||a.city||a.municipality].filter(Boolean).join(" ");
      add([rue,lieu].filter(Boolean).join(", ")||x.display_name.split(",").slice(0,3).join(","), x.lat, x.lon, !!a.house_number); }); } }catch(e){} }
  return out; }
let addrTimer=null, addrSeq=0, addrRes=[];
$("addr-q").addEventListener("input",()=>{ clearTimeout(addrTimer); const q=$("addr-q").value.trim(), box=$("addr-sugg");
  if(q.length<4){ box.innerHTML=""; return; }
  addrTimer=setTimeout(async()=>{ const my=++addrSeq; box.innerHTML=`<p class="note">Recherche…</p>`; const l=await chercherAdresses(q); if(my!==addrSeq) return; addrRes=l;
    box.innerHTML=l.length?l.map((x,i)=>`<button type="button" class="addritem" data-addr="${i}" role="option"><b>${esc(x.label)}</b><small>${x.precis?"Adresse exacte":"Rue ou localité"}</small></button>`).join("")
      :`<p class="note">Aucune adresse trouvée. Vérifiez l'orthographe, ajoutez la localité, ou utilisez le code postal ci-dessous.</p>`; },450); });
$("addr-sugg").addEventListener("click",async e=>{ const b=e.target.closest("[data-addr]"); if(!b) return; let x=addrRes[+b.dataset.addr]; if(!x) return;
  if(x.resolve){ try{ b.disabled=true; x=await x.resolve(); }catch(err){ toast("Cette adresse n'a pas pu être localisée, essayez-en une autre"); b.disabled=false; return; } }
  $("addr-sugg").innerHTML=""; $("addr-q").value=""; $("homeaddr").open=false;
  setHome({nom:x.label.slice(0,80),lat:x.lat,lon:x.lon,precision:x.precis?"exacte":"rue"}); });
async function geocodeAdresse(rue,cp,ville){
  // d'abord la recherche libre (plus tolérante sur l'ordre rue / numéro), puis la recherche structurée
  try{ const l=await chercherAdresses(`${rue}, ${cp} ${ville}`); const ok=l.find(x=>x.precis)||l[0]; if(ok) return {lat:ok.lat,lon:ok.lon,exacte:ok.precis}; }catch(e){}
  const tries=[rue, rue.replace(/\s*\d+[a-zA-Z]?(\s*(bte|bt|boîte|bus)\s*\w+)?\s*$/i,"").replace(/^\d+[a-zA-Z]?,?\s*/,"")].filter((v,i,a)=>v&&a.indexOf(v)===i);
  for(const street of tries){
    const u="https://nominatim.openstreetmap.org/search?"+new URLSearchParams({format:"jsonv2",countrycodes:"be",limit:"1","accept-language":"fr",street,postalcode:cp,city:ville});
    const r=await fetch(u,{headers:{Accept:"application/json"}}); if(!r.ok) throw new Error("geocode "+r.status);
    const j=await r.json(); if(j&&j[0]) return {lat:Math.round(+j[0].lat*1e5)/1e5, lon:Math.round(+j[0].lon*1e5)/1e5, exacte:street===rue&&/\d/.test(rue)};
  }
  return null;
}
const OSM_BRANDS=[[/bio ?planet/,"bioplanet"],[/louis delhaize/,"louisdelhaize"],[/delhaize|proxy|shop ?& ?go/,"delhaize"],[/\baldi\b/,"aldi"],[/\blidl\b/,"lidl"],[/colruyt/,"colruyt"],[/carrefour/,"carrefour"],[/intermarche|\bitm\b/,"inter"],[/\bok ?ay\b/,"okay"],[/eurospar/,"eurospar"],[/\bspar\b/,"spar"],[/albert heijn|\bah\b/,"ah"],[/\bjumbo\b/,"jumbo"],[/\bs?match\b/,"match"],[/\bcora\b/,"cora"]];
async function overpass(q){
  // trois serveurs publics OpenStreetMap, 20 secondes maximum chacun
  for(const ep of ["https://overpass-api.de/api/interpreter","https://overpass.private.coffee/api/interpreter","https://maps.mail.ru/osm/tools/overpass/api/interpreter"]){
    const ctl=new AbortController(), tm=setTimeout(()=>ctl.abort(),20000);
    try{ const r=await fetch(ep,{method:"POST",body:"data="+encodeURIComponent(q),headers:{"Content-Type":"application/x-www-form-urlencoded"},signal:ctl.signal}); clearTimeout(tm); if(r.ok) return await r.json(); }catch(e){ clearTimeout(tm); }
  }
  throw new Error("overpass");
}
let osmBusy=false;
async function chercherMagasinsOSM(){
  if(osmBusy) return; if(HOME.precision!=="exacte"&&HOME.precision!=="rue") toast("Astuce : entrez votre rue dans « Entrer mon adresse » pour une recherche plus précise.");
  osmBusy=true; const btn=$("osmstores"); if(btn){ btn.disabled=true; btn.textContent="Recherche des magasins…"; }
  try{
    const R=rayonKm()*1000, a=`(around:${R},${HOME.lat},${HOME.lon})`;
    let gfound=null; if(GKEY){ try{ gfound=await magasinsGoogle(R); }catch(err){ gfound=null; } }
    const j=gfound?{elements:[]}:await overpass(`[out:json][timeout:25];(nwr["shop"="supermarket"]${a};nwr["shop"="convenience"]["brand"]${a};);out center tags 300;`);
    const found=[];
    (j.elements||[]).forEach(el=>{ const t=el.tags||{}, txt=norm((t.brand||"")+" "+(t.name||"")+" "+(t.operator||""));
      let b=OSM_BRANDS.find(([re])=>re.test(txt)); if(!b){ if(t.shop!=="supermarket"||!t.name) return; b=[null,"autre"]; }
      const lat=el.lat!=null?el.lat:el.center&&el.center.lat, lon=el.lon!=null?el.lon:el.center&&el.center.lon; if(typeof lat!=="number"||typeof lon!=="number") return;
      const rue=cleanTxt([t["addr:street"],t["addr:housenumber"]].filter(Boolean).join(" ")), ville=cleanTxt(t["addr:city"]||t["addr:place"]||"");
      found.push({id:"o"+el.type[0]+el.id, ens:b[1], nom:(cleanTxt(t.name||t.brand)||ENS[b[1]]).slice(0,40), lieu:([rue,ville].filter(Boolean).join(", ")||"Localisé sur la carte").slice(0,80), lat:Math.round(lat*1e5)/1e5, lon:Math.round(lon*1e5)/1e5}); });
    if(gfound) found.push(...gfound);
    // le même magasin est parfois dessiné deux fois (un point et le bâtiment) : on n'en garde qu'un
    for(let i=found.length-1;i>=0;i--){ if(found.some((g,k)=>k<i&&g.ens===found[i].ens&&km(g,found[i])<0.15)) found.splice(i,1); }
    if(!found.length){ toast(`Aucun supermarché trouvé à moins de ${rayonKm()} km de ${HOME.nom}. Vérifiez votre adresse.`); return; }
    // les magasins déjà connus reçoivent leur position exacte, les autres sont ajoutés
    const fix={...state.storeFix}, add=[]; let corr=0;
    found.forEach(f=>{ const twin=MAGASINS.filter(m=>!m.perso&&m.ens===f.ens&&!/^(o[nwr]\d|g[A-Za-z0-9_-]{6})/.test(m.id)&&km(m,f)<1.2).sort((x,y)=>km(x,f)-km(y,f))[0];
      if(twin){ if(!fix[twin.id]||km(fix[twin.id],f)>0.01){ fix[twin.id]={lat:f.lat,lon:f.lon,lieu:f.lieu!=="Localisé sur la carte"?f.lieu:twin.lieu}; corr++; } twin.lat=f.lat; twin.lon=f.lon; twin.osm=true; }
      else add.push(f); });
    state.storeFix=fix; state.osmAt={lat:HOME.lat,lon:HOME.lon};
    const keep=state.osmStores.filter(m=>!add.some(x=>x.id===m.id));
    state.osmStores=[...add,...keep].sort((x,y)=>km(HOME,x)-km(HOME,y)).slice(0,80);
    state.osmStores.forEach(m=>{ const ex=MAGASINS.find(x=>x.id===m.id); if(ex) Object.assign(ex,m,{osm:true}); else MAGASINS.push({...m,osm:true}); });
    save(); render();
    toast(`${found.length} magasins trouvés dans un rayon de ${rayonKm()} km${corr?`, dont ${corr} ${corr>1?"repositionnés":"repositionné"} exactement`:""}.`,()=>pickNearest(),"Prendre les plus proches");
  }catch(e){ toast(GKEY?"La recherche n'a pas abouti : vérifiez la clé Google Maps dans Mes magasins.":"Le service de carte OpenStreetMap ne répond pas pour le moment. Réessayez dans une minute."); }
  finally{ osmBusy=false; if(btn){ btn.disabled=false; btn.textContent="Trouver les vrais magasins autour de mon adresse"; } }
}
$("osmstores").onclick=chercherMagasinsOSM;
$("nearest").onclick=pickNearest;
// ajout manuel d'un magasin
async function fillVillesFor(cpId,selId){ const cp=$(cpId).value.trim(), sel=$(selId);
  if(!/^\d{4}$/.test(cp)){ sel.innerHTML='<option value="">Entrez d\'abord le code postal</option>'; return; }
  const d=await loadCP(); if(!d){ sel.innerHTML='<option value="">Liste indisponible, réessayez</option>'; return; }
  const hits=d.filter(x=>x[0]===cp); sel.innerHTML=hits.length? hits.map((x,i)=>`<option value="${i}">${esc(x[1])}</option>`).join("") : '<option value="">Code postal inconnu</option>'; }
$("as-cp").addEventListener("input",()=>fillVillesFor("as-cp","as-ville"));
$("addstore").addEventListener("submit",async e=>{ e.preventDefault();
  const ens=$("as-ens").value, cp=$("as-cp").value.trim(), rue=$("as-rue").value.trim();
  const d=await loadCP(); const hits=d?d.filter(x=>x[0]===cp):[]; const h=hits[+$("as-ville").value];
  if(!h){ toast("Indiquez le code postal et la localité du magasin"); return; }
  let g=null; if(rue){ try{ g=await geocodeAdresse(rue,cp,h[1]); }catch(err){} if(g&&km(g,{lat:h[2],lon:h[3]})>15) g=null; }
  const m={id:"c"+Date.now().toString(36),ens,nom:($("as-nom").value.trim()||ENS[ens]).slice(0,40),lieu:(rue?rue+", ":"")+h[1],lat:g?g.lat:h[2],lon:g?g.lon:h[3]};
  state.customStores=[...state.customStores,m]; MAGASINS.push({...m,perso:true}); state.storeOrder=[...state.storeOrder,m.id];
  ["as-nom","as-rue","as-cp"].forEach(id=>$(id).value=""); $("as-ville").innerHTML='<option value="">Entrez d\'abord le code postal</option>'; $("addstorebox").open=false;
  save(); render(); toast(m.nom+" ajouté à vos magasins"); });
$("homesel").onchange=e=>{ const c=COMMUNES.find(([n])=>n===e.target.value); if(c) setHome({nom:c[0],lat:c[1],lon:c[2]}); };
function parseCoords(t){ t=String(t||"").trim(); let m=t.match(/@(-?\d+\.\d+),\s*(-?\d+\.\d+)/)||t.match(/[?&](?:q|ll|query|center)=(-?\d+\.\d+)(?:,|%2C)\s*(-?\d+\.\d+)/i)||t.match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/)||t.match(/^(-?\d{1,2}[.,]\d+)\s*[,;\s]\s*(-?\d{1,2}[.,]\d+)$/);
  if(!m) return null; const lat=+String(m[1]).replace(",","."), lon=+String(m[2]).replace(",",".");
  return (lat>49.3&&lat<51.6&&lon>2.4&&lon<6.5)?{lat,lon}:null; }
$("homeset").onclick=()=>{ const v=$("homecoord").value, c=parseCoords(v);
  if(!c){ toast(/goo\.gl|maps\.app/.test(v)?"Ce lien court ne contient pas les coordonnées : copiez plutôt les chiffres affichés dans Google Maps":"Coordonnées non reconnues (exemple : 50.4760, 3.8830)"); return; }
  $("homecoord").value=""; setHome({nom:"Mon domicile",precision:"exacte",...c}); };
// --- adresse saisie à la main : code postal -> localités (données publiées avec la page) ---
let CP=null, cpLoading=null;
const norm = t => String(t||"").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9]+/g," ").trim();
function loadCP(){ if(CP) return Promise.resolve(CP); if(!cpLoading) cpLoading=fetch("codes-postaux.json").then(r=>r.json()).then(d=>{CP=d;return d;}).catch(()=>{cpLoading=null; return null;}); return cpLoading; }
async function fillVilles(){ const cp=$("addr-cp").value.trim(), sel=$("addr-ville");
  if(!/^\d{4}$/.test(cp)){ sel.innerHTML='<option value="">Entrez d\'abord le code postal</option>'; return; }
  const d=await loadCP(); if(!d){ sel.innerHTML='<option value="">Liste indisponible, réessayez</option>'; return; }
  const hits=d.filter(x=>x[0]===cp);
  sel.innerHTML=hits.length? hits.map((x,i)=>`<option value="${i}">${esc(x[1])}</option>`).join("") : '<option value="">Code postal inconnu</option>';
  sel.dataset.cp=cp; }
$("addr-cp").addEventListener("input",fillVilles);
$("addr-cp").addEventListener("focus",()=>{ loadCP(); });
$("addrform").addEventListener("submit",async e=>{ e.preventDefault();
  const rue=$("addr-rue").value.trim(), cp=$("addr-cp").value.trim(), sel=$("addr-ville");
  if(!/^\d{4}$/.test(cp)){ toast("Entrez un code postal belge à 4 chiffres"); $("addr-cp").focus(); return; }
  const d=await loadCP(); if(!d){ toast("La liste des codes postaux n'a pas pu être chargée"); return; }
  const hits=d.filter(x=>x[0]===cp); const h=hits[+sel.value]; if(!h){ toast("Choisissez votre localité"); return; }
  const nom=(rue?rue+", ":"")+h[1]; let g=null;
  if(rue){ const b=e.submitter||$("addrform").querySelector("button[type=submit]"); b.disabled=true; b.textContent="Recherche de l'adresse…";
    try{ g=await geocodeAdresse(rue,cp,h[1]); }catch(err){ g=null; } b.disabled=false; b.textContent="Utiliser cette adresse"; }
  if(g&&km(g,{lat:h[2],lon:h[3]})<15){ setHome({nom, lat:g.lat, lon:g.lon, precision:g.exacte?"exacte":"rue", adresse:{rue,cp,ville:h[1]}}); }
  else { setHome({nom, lat:h[2], lon:h[3], precision:"localite", adresse:{rue,cp,ville:h[1]}}); if(rue) setTimeout(()=>toast("Adresse introuvable sur la carte : le trajet part du centre de "+h[1]+". Vérifiez l'orthographe de la rue."),2600); }
  $("homeaddr").open=false; });
$("outdef").addEventListener("click",e=>{ const b=e.target.closest("[data-outdef]"); if(!b) return; const d=+b.dataset.outdef, cur=new Set(state.outDefault);
  cur.has(d)?cur.delete(d):cur.add(d); state.outDefault=[...cur].sort(); save(); render();
  toast(`Soirs habituellement à l'extérieur : ${state.outDefault.length?state.outDefault.map(x=>JOURS[x].toLowerCase()).join(", "):"aucun"}. Une semaine peut toujours être modifiée depuis la fiche du jour.`); });
$("storemode").onchange=e=>{ state.storeMode=e.target.value; save(); render(); toast(state.storeMode==="fixe"?"Courses toujours chez "+MAGNOM[state.storeOrder[0]]:"Magasin le plus avantageux selon vos préférences"); };
$("sorder").addEventListener("click",e=>{ const b=e.target.closest("button"); if(!b||b.disabled) return; const D=b.dataset, o=[...state.storeOrder];
  if(D.sup){ const i=+D.sup; [o[i-1],o[i]]=[o[i],o[i-1]]; state.storeOrder=o; }
  else if(D.sdown){ const i=+D.sdown; [o[i+1],o[i]]=[o[i],o[i+1]]; state.storeOrder=o; }
  else if(D.sdel){ if(o.length<=1){ toast("Gardez au moins un magasin"); return; } const id=D.sdel; state.storeOrder=o.filter(x=>x!==id); state.tripStore=state.tripStore.map(x=>x===id?null:x); toast(MAGNOM[id]+" retiré de vos magasins"); }
  else return; save(); render(); });
$("rayonchips").addEventListener("click",e=>{ const b=e.target.closest("[data-rayon]"); if(!b) return; const before=rayonKm(); state.rayon=+b.dataset.rayon; save(); render();
  if(state.rayon>before&&typeof chercherMagasinsOSM==="function"){ state.osmAt=null; chercherMagasinsOSM(); } else toast(`Rayon de ${state.rayon} km`); });
$("savail").addEventListener("click",e=>{ const b=e.target.closest("[data-sadd]"); if(!b) return; const id=b.dataset.sadd; if(state.storeOrder.includes(id)) return;
  state.storeOrder=[...state.storeOrder,id]; save(); render(); toast(MAGNOM[id]+" ajouté en dernière position : remontez-le si besoin"); });
$("ensfilter").addEventListener("click",e=>{ const b=e.target.closest("[data-ensf]"); if(!b) return; ensFilter=b.dataset.ensf; renderStoreOrder(); });
$("newrecipe").onclick=()=>openSheet({type:"recipe",draft:newDraft()});
$("rewizard").onclick=()=>openSheet({type:"wizard",step:0});
let wizardChecked=false;
function maybeWizard(){ if(wizardChecked) return; wizardChecked=true; if(!state.onboarded&&!state.family.length&&!sheetCtx) openSheet({type:"wizard",step:0}); }

