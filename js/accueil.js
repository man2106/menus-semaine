// ===================== Onglet Menu : la semaine en cours et la proposition de la semaine suivante =====================
// L'onglet Menu ne montre que deux rubriques :
//  1. « Cette semaine » : les soirs (cartes), le soir même en évidence, les jours passés repliés ;
//  2. « Semaine prochaine » : liste compacte des 7 soirs, état de la validation, boutons « Voir et modifier » et « Valider ».
// « Voir et modifier » bascule la page sur la semaine suivante (goWeek) ; une flèche « Retour à cette semaine » ramène à la semaine en cours.
// Tout le reste (retours, à compléter, nouveautés, budget, affichage, PDF…) est dans les onglets Famille et Plus.
const isoSemaine = off => { const d=new Date(BASE_MONDAY); d.setDate(d.getDate()+7*off); return isoOf(d); };
const dateSemaine = (off,d=0) => { const x=new Date(BASE_MONDAY); x.setDate(x.getDate()+7*off+d); return x; };
function labelSemaine(off){ const a=dateSemaine(off,0), b=dateSemaine(off,6);
  return `${a.getDate()} ${a.getMonth()!==b.getMonth()?a.toLocaleDateString("fr-BE",{month:"long"})+" ":""}au ${b.getDate()} ${b.toLocaleDateString("fr-BE",{month:"long"})}`; }
// Données d'une semaine déjà préparée, au format de l'application (celles de la base partagée si elles existent, sinon la copie de cet appareil)
function weekFromDoc(d){ return {menu:d.menu,cooks:d.cuisiniers,checked:d.coches,statut:d.statut,journal:d.journal,absents:d.absents,invites:d.invites,approbations:d.approbations,exterieur:d.exterieur,extras:d.ajouts,quantites:d.quantites,lieux:d.lieux,tickets:d.tickets}; }
const menuLisible = m => Array.isArray(m)&&m.length===7;
function semaineSource(off){ const iso=isoSemaine(off), sv=(typeof SEMAINES==="object"&&SEMAINES[iso])||null, lo=state.weeks[iso]||null;
  if(DB&&sv&&menuLisible(sv.menu)) return {iso,doc:sv,menu:sv.menu,cooks:sv.cuisiniers,approbations:sv.approbations,exterieur:sv.exterieur,statut:sv.statut,serveur:true};
  if(lo&&menuLisible(lo.menu)) return {iso,doc:null,menu:lo.menu,cooks:lo.cooks,approbations:lo.approbations,exterieur:lo.exterieur,statut:lo.statut,serveur:false};
  return null; }
function donneesSemaine(off){ const iso=isoSemaine(off);
  if(off===state.weekOffset) return {iso,menu:state.week,cooks:state.cooks,approbations:state.approbations,exterieur:state.exterieur,statut:state.statut,courante:true};
  const s=semaineSource(off); if(!s) return null;
  const a=(s.approbations&&typeof s.approbations==="object")?s.approbations:{}, ext=cleanDays(s.exterieur);
  return {...s,approbations:a,exterieur:ext,cooks:Array.isArray(s.cooks)?s.cooks:Array(7).fill(null),statut:(DB?VALID[iso]==="valide":s.statut==="valide")?"valide":"proposition"}; }
const cleKey = w => (w.menu||[]).join(",")+"|"+outList(w.exterieur).join("");
// Même règle que la validation de la semaine affichée (approvalStats) : une validation compte si elle porte sur le menu actuel
function validationsDe(w){ const key=cleKey(w);
  const ok=state.family.filter(n=>{ const a=w.approbations&&w.approbations[n]; return !!a&&a.menu===key; });
  return {ok,key,total:state.family.length}; }
// Qui est « moi » parmi les membres de la famille : le prénom de l'accès, ou le seul membre quand l'application n'est pas partagée
function monNom(){ let nom=""; try{ nom=(window.__acces&&window.__acces()&&window.__acces().nom)||""; }catch(e){}
  const k=norm(nom), m=k?state.family.find(n=>norm(n)===k):null; if(m) return m;
  return (!DB&&state.family.length===1)?state.family[0]:null; }
// Bascule la validation de « moi » pour une semaine : celle qui est affichée (même chemin que le bouton de la barre de validation) ou une autre (écriture directe dans sa fiche)
function basculerApprobation(n){ const a=approvalOf(n), all={...state.approbations};
  if(a&&!a.ancienne) delete all[n]; else all[n]={quand:new Date().toISOString(),menu:menuKey(),par:ME};
  state.approbations=all; save(); render(); toast(all[n]?`${n} a validé le menu`:`Validation de ${n} retirée`); }
let validationEnCours=false;
async function validerSemaine(off){ const n=monNom();
  if(!n){ toast("Choisissez votre prénom : touchez « Voir et modifier », puis « Valider pour… » à côté de votre nom"); if(off>0&&off!==state.weekOffset) goWeek(off); return; }
  if(off===state.weekOffset){ basculerApprobation(n); return; }
  if(validationEnCours) return; const w=donneesSemaine(off); if(!w){ toast("Préparez d'abord le menu de la semaine prochaine"); return; }
  const {ok,key}=validationsDe(w), deja=ok.includes(n), a={...w.approbations};
  if(deja) delete a[n]; else a[n]={quand:new Date().toISOString(),menu:key,par:ME};
  const quand=new Date().toISOString(), texte=deja?`${n} a retiré sa validation`:`${n} a validé le menu`;
  const lo=state.weeks[w.iso]; if(lo){ lo.approbations=a; lo.journal=[{par:ME,quand,texte},...(lo.journal||[])].slice(0,15); }
  if(DB&&CAN_WRITE!==false){ validationEnCours=true;
    // On repart de la fiche partagée telle qu'elle est : seules les validations changent
    const base=w.doc?JSON.parse(JSON.stringify(w.doc)):{menu:w.menu,cuisiniers:w.cooks,absents:(lo&&lo.absents)||{},invites:(lo&&lo.invites)||[0,0,0,0,0,0,0],exterieur:w.exterieur,coches:(lo&&lo.checked)||{},ajouts:(lo&&lo.extras)||[],quantites:(lo&&lo.quantites)||{},lieux:(lo&&lo.lieux)||{},tickets:(lo&&lo.tickets)||[]};
    const body={...base,approbations:a,journal:[{par:ME,quand,texte},...(Array.isArray(base.journal)?base.journal:[])].slice(0,15),maj:quand};
    try{ await DB.doc("semaines/"+w.iso).set(body); SEMAINES[w.iso]=body; saveLocal(); toast(deja?"Validation retirée":"Merci, votre validation est enregistrée"); }
    catch(e){ toast("La validation n'a pas pu être enregistrée : réessayez"); }
    validationEnCours=false; }
  else { saveLocal(); toast(deja?"Validation retirée":"Votre validation est enregistrée sur cet appareil"); }
  renderMenuPage(); }

// ---- En-tête de « Cette semaine » (ou de la semaine ouverte en modification) ----
function renderMenuHeader(){ const box=$("mshead"); if(!box) return;
  const off=state.weekOffset, valide=state.statut==="valide", {ok}=approvalStats(), n=state.family.length, moi=monNom(), aValide=!!moi&&ok.includes(moi);
  box.className="mshead"+(off>0?" edit":"");
  box.innerHTML=`${off>0?`<div class="mback"><button class="btn" type="button" data-week="0">← Retour à cette semaine</button></div>`:""}
    <div class="mstitle">${off>0?`<button class="wnav" type="button" data-week="${off-1}" aria-label="Semaine précédente">‹</button>`:""}
      <div class="mstxt"><small>${relWeek()}</small><h2>Du ${esc(weekLabel())}</h2></div>
      ${off>0?`<button class="wnav" type="button" data-week="${off+1}" ${off>=3?"disabled":""} aria-label="Semaine suivante">›</button>`:""}</div>
    <div class="msstate"><span class="st ${valide?"on":"soon"}">${valide?"Menu validé":"Proposition à discuter"}</span>${n?`<span class="msvalid">Validé par ${ok.length} sur ${n}</span>`:""}<span class="sync ${syncState}" id="sync"></span></div>
    <p class="note kindtxt">${valide?(verrouille()?"Verrouillé : la semaine a commencé, les jours passés sont figés.":"Menu figé. Rouvrez-le pour modifier."):"À discuter en famille avant validation."}</p>
    ${n&&moi?`<div class="actions"><button class="btn ${aValide?"":"primary"} edit-ctl" type="button" data-mevalider="${off}">${aValide?"Retirer ma validation":"Valider ce menu"}</button></div>`:""}`;
  setSync(syncState); }

// ---- Semaine prochaine : liste compacte, état de la validation, deux boutons ----
function renderSemaineProchaine(){ const sec=$("msec-suivante"), head=$("nwhead"), body=$("nextweek"); if(!sec||!head||!body) return;
  const edit=state.weekOffset>0; sec.hidden=edit; const cet=$("msec-cette"); if(cet) cet.classList.toggle("edit-pleine",edit); if(edit) return;
  head.className="mshead";
  const w=donneesSemaine(1), moi=monNom();
  const V=w?validationsDe(w):null, valide=!!w&&w.statut==="valide", aValide=!!(V&&moi&&V.ok.includes(moi));
  head.innerHTML=`<div class="mstitle"><div class="mstxt"><small>Semaine prochaine</small><h2>Du ${esc(labelSemaine(1))}</h2></div></div>
    ${w?`<div class="msstate"><span class="st ${valide?"on":"soon"}">${valide?"Menu validé":"Proposition"}</span>${V.total?`<span class="msvalid">Validé par ${V.ok.length} sur ${V.total}</span>`:""}</div>`:""}`;
  if(!w){ body.innerHTML=`<div class="panel nwvide"><p>Le menu de la semaine prochaine n'est pas encore préparé. Une proposition est faite automatiquement, selon les goûts de la famille et les promos.</p>
      <button class="btn primary big edit-only" type="button" data-nwedit="1">Préparer la proposition</button></div>`; return; }
  const out=outList(w.exterieur);
  const rows=w.menu.map((id,d)=>{ const r=BYID[id], date=dateSemaine(1,d), jour=`<span class="nwday"><b>${JOURS[d].slice(0,3)}</b> ${fmtShort(date)}</span>`;
    const plat=out.includes(d)?`<span class="nwdish out">Repas à l'extérieur</span>`:r?`<span class="nwdish">${esc(r.nom)}</span>`:id?`<span class="nwdish out">Recette en chargement…</span>`:`<span class="nwdish manque">À décider</span>`;
    return `<li><button type="button" class="nwrow" data-nwopen="${d}" aria-label="${JOURS[d]} ${fmtShort(date)} : ${out.includes(d)?"repas à l'extérieur":r?esc(r.nom):"à décider"}, ouvrir">${jour}${plat}<span class="dchev" aria-hidden="true">›</span></button></li>`; }).join("");
  body.innerHTML=`<div class="panel nwpanel">
    <ul class="nwlist">${rows}</ul>
    <div class="nwvalid"><b>${V.total?`Validé par ${V.ok.length} sur ${V.total}`:"Aucun membre dans la famille"}</b>${V.ok.length?`<small>${V.ok.map(esc).join(", ")}</small>`:""}${V.total&&V.ok.length<V.total?`<small>En attente : ${state.family.filter(x=>!V.ok.includes(x)).map(esc).join(", ")}</small>`:""}</div>
    <div class="actions nwact"><button class="btn big" type="button" data-nwedit="1">Voir et modifier</button>${V.total?`<button class="btn big ${aValide?"":"primary"} edit-ctl" type="button" data-mevalider="1">${aValide?"Retirer ma validation":"Valider"}</button>`:""}</div>
  </div>`; }
function renderMenuPage(){ try{ renderMenuHeader(); renderSemaineProchaine(); }catch(e){ console.error(e); } }
// Ouvre la semaine suivante dans l'écran de modification habituel ; la flèche « Retour à cette semaine » revient en arrière
function voirEtModifier(jour){ const dep=state.weekOffset; if(dep!==1) goWeek(1); if(typeof jour==="number") openMeal(state.week[jour],jour); else { toast("Semaine prochaine : modifiez les plats, puis revenez avec la flèche en haut"); window.scrollTo(0,0); } }
document.addEventListener("click",e=>{
  const w=e.target.closest("#view-menu [data-week]"); if(w&&!w.disabled){ goWeek(+w.dataset.week); window.scrollTo(0,0); toast(relWeek()+" : semaine du "+weekLabel()); return; }
  if(e.target.closest("[data-nwedit]")){ voirEtModifier(); return; }
  const o=e.target.closest("[data-nwopen]"); if(o){ voirEtModifier(+o.dataset.nwopen); return; }
  const v=e.target.closest("[data-mevalider]"); if(v){ validerSemaine(+v.dataset.mevalider); return; }
  const p=e.target.closest("[data-passes]"); if(p){ passesOuverts=!passesOuverts; renderDays(); return; }
});
