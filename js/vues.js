function renderReglages(){
  $("members").innerHTML=state.family.length? state.family.map((n,i)=>{const c=state.cooks.filter(x=>x===n).length, m=state.emails[n]||"";
    const ex=state.exclus[n]||[], nope=RECETTES.filter(r=>(state.avis[r.id]||{})[n]===-1).length, yes=RECETTES.filter(r=>(state.avis[r.id]||{})[n]===1).length;
    return `<div class="mrow"><div class="mname"><b>${esc(n)}</b><small>${c} soir${c>1?"s":""} aux fourneaux</small></div>
      <input type="email" inputmode="email" class="mmail" id="mail-${i}" data-mail="${i}" value="${esc(m)}"${IS_OWNER?"":" readonly"} placeholder="Adresse e-mail" maxlength="120" autocomplete="off" aria-label="Adresse e-mail de ${esc(n)}">
      <button class="mdel edit-only owner-only" data-del="${i}" aria-label="Retirer ${esc(n)}">×</button>
      <button class="mgouts" data-gouts="${i}"><span>Goûts</span><small>${ex.length?"Ne mange pas : "+esc(ex.slice(0,3).join(", "))+(ex.length>3?"…":""):"Aucun ingrédient évité"}${yes||nope?` · ${yes} aimé${yes>1?"s":""}, ${nope} évité${nope>1?"s":""}`:""}</small><span class="dchev" aria-hidden="true">›</span></button></div>`}).join("")
    : `<span class="empty">Aucun membre pour l'instant. Ajoutez le premier prénom ci-dessous.</span>`;
  const nb=state.family.filter(n=>state.emails[n]).length;
  $("mailnote").textContent = !IS_OWNER ? "Seul le propriétaire de l'application ajoute ou retire des membres et modifie les adresses e-mail. Les goûts restent modifiables par tous." : state.family.length ? `${nb} adresse${nb>1?"s":""} sur ${state.family.length}. Elles servent à envoyer les menus par e-mail. Pour inviter quelqu'un, utilisez le lien d'invitation (Réglages, Accès de la famille).` : "";
  $("planning").innerHTML=JOURS.map((j,d)=>`<div class="prow"><span>${j}</span><span>${cookSelect(d)}</span></div>`).join("");
  renderStoreOrder();
  $("outdef").innerHTML=JOURS.map((j,d)=>`<button class="chip${state.outDefault.includes(d)?" on":""}" data-outdef="${d}" aria-pressed="${state.outDefault.includes(d)}">${j.slice(0,3)}</button>`).join("");
  $("fcount").textContent=state.family.length?"":"!";
}
const VUES=["menu","courses","recettes","famille","plus","envies","reglages"];
const ONGLET_DE={envies:"plus",reglages:"plus"};
function setTab(t,opts={}){ if(!VUES.includes(t)) t="menu"; const changed=state.tab!==t; state.tab=t; save(); if(t==="envies"&&typeof renderEnvies==="function") renderEnvies();
  const onglet=ONGLET_DE[t]||t;
  document.querySelectorAll("nav button").forEach(b=>b.setAttribute("aria-selected",b.dataset.tab===onglet));
  VUES.forEach(v=>{const s=$("view-"+v); s.hidden=v!==t; if(v===t&&changed){s.classList.remove("view-in"); void s.offsetWidth; s.classList.add("view-in");}});
  if(location.hash!=="#"+t){ try{history.replaceState(null,"","#"+t);}catch(e){} }
  if(changed&&!opts.keepScroll) window.scrollTo(0,0);
}
window.addEventListener("hashchange",()=>{const h=location.hash.slice(1); if(VUES.includes(h)&&h!==state.tab) setTab(h);});
// Aller à un élément d'une autre vue, avec un repère visuel
function goTo(tab,elId){ setTab(tab,{keepScroll:!!elId}); if(!elId) return;
  requestAnimationFrame(()=>{const el=$(elId); if(!el) return; el.scrollIntoView({behavior:"smooth",block:"start"}); el.classList.remove("flash"); void el.offsetWidth; el.classList.add("flash");}); }
document.addEventListener("click",e=>{
  const g=e.target.closest("[data-goto]"); if(g){ e.preventDefault(); if(modalCtx) closeMeal(); goTo(g.dataset.goto,g.dataset.el||null); return; }
  const tr=e.target.closest("[data-gotrip]"); if(tr){ e.preventDefault(); if(modalCtx) closeMeal(); tripVue=+tr.dataset.gotrip; renderCourses(); goTo("courses","trip-"+tr.dataset.gotrip); }
});
// Bandeau « À suivre » : prochain repas et prochaine course
function renderNext(){
  let d=state.week.findIndex((id,i)=>dayOffset(i)>=TODAY&&!isOut(i)&&BYID[id]); if(d<0) d=homeDays().find(i=>BYID[state.week[i]])??-1;
  const r=d<0?null:BYID[state.week[d]], isToday=d>=0&&dayOffset(d).getTime()===TODAY.getTime();
  const trips=coursesTrips();
  let t=0;
  const items=trips[t], plan=planTrip(t,items), left=items.filter(i=>!state.checked[i.ck]).length;
  const days=Math.round((tripDate(t)-TODAY)/DAY);
  const when=days===0?"aujourd'hui":days===1?"demain":fmtD(tripDate(t));
  const dd=homeDays().find(i=>!BYID[state.week[i]])??0;
  $("next").innerHTML=(r?`<button class="ncard" data-open="${d}"><img src="${photoSrc(r.id)}" alt="" data-cache-err="1" decoding="async"><div><small>${isToday?"Ce soir":"Prochain repas · "+fmtD(dayOffset(d))}</small><b>${esc(r.nom)}</b><span class="nsub">${r.t} min${state.cooks[d]?" · "+esc(state.cooks[d])+" cuisine":""} · voir la recette</span></div></button>`:`<button class="ncard edit-only" data-cpick="${dd}"><div><small>Prochain repas</small><b>À décider</b><span class="nsub">Aucun plat prévu · choisir un plat</span></div></button>`)+`
    <button class="ncard" data-gotrip="${t}"><span class="nicon"><svg viewBox="0 0 24 24"><path d="M3 4h2l2.4 11h10.2L20 8H6.2"/><circle cx="9" cy="19.5" r="1.4"/><circle cx="17" cy="19.5" r="1.4"/></svg></span><div><small>Prochaine course · ${when}</small><b>${MAGNOM[plan.primary]}${plan.secondary?" + "+MAGNOM[plan.secondary]:""}</b><span class="nsub">${left?`${left} article${left>1?"s":""} à acheter`:"Tout est dans le caddie"} · ≈ ${kmTxt(plan.route)}</span></div></button>`;
}
$("next").addEventListener("click",e=>{const o=e.target.closest("[data-open]"); if(o) openMeal(state.week[+o.dataset.open],+o.dataset.open);});
// ---- Fenêtre détail d'un repas ----
let modalCtx=null, lastFocus=null;
function mealItems(id,d){
  return BYID[id].ing.map(([n,q,u,ray])=>{
    const t = d===null ? null : (STOCKABLE.includes(ray)?0:tripOf(d));
    return {n,u,ray,q:scale(q,d),t,ck:t===null?null:t+"|"+n+"|"+u,cost:itemCost(n,u,scale(q,d),ray)};
  });
}
function renderModal(){
  if(!modalCtx) return; if(!BYID[modalCtx.id]){ closeMeal(); return; } const {id,d}=modalCtx, r=BYID[id], items=mealItems(id,d), total=items.reduce((s,i)=>s+i.cost,0);
  $("meyebrow").textContent = d===null ? "Recette" : `${JOURS[d]} ${fmtShort(dayOffset(d))}${state.cooks[d]?" · cuisiné par "+state.cooks[d]:""}`;
  $("mtitle").textContent = r.nom;
  $("mmeta").innerHTML = `<span class="pill">${r.t} min</span><span class="pill cost">≈ ${eur(total)} · ${eur(total/Math.max(1,headcount(d)))} / pers.</span><span>${headcount(d)} à table · avec ${r.acc.toLowerCase()}</span>`;
  const trips = d===null ? [null] : [...new Set(items.map(i=>i.t))].sort();
  const lists = trips.map(t=>{const its=items.filter(i=>i.t===t);
    const plan = t===null?null:planTrip(t,coursesTrips()[t]), date = t===null?null:tripDate(t);
    const head = t===null ? "" : `<div class="store">Courses de la semaine · ${fmtD(date)}</div>`;
    const rows = its.map(i=>{const c = i.ck && !!state.checked[i.ck];
      const tags = promosFor(i.n).map(p=>{const ok = date ? validOn(p,date) : true;
        return `<span class="ptag"${ok?"":' style="opacity:.6"'}>· Promo ${ENS[p.mag]} ${eur(p.prix)}${ok?"":" (pas valable ce jour-là)"}</span>`}).join("");
      const box = i.ck ? `<input type="checkbox" data-mk="${esc(i.ck)}"${c?" checked":""} aria-label="${esc(i.n)} acheté">` : `<span></span>`;
      return `<label class="item${c?" checked":""}">${box}<span class="iname${produitDe(i.n)?" has-p":""}">${vignetteProduit(i.n)}<b>${esc(i.n)}</b><small>${plan?`<b style="color:var(--accent);font-weight:700">${MAGNOM[plan.assign[i.n+"|"+i.u]||plan.primary]}</b> · `:""}${RAYONS[i.ray]} · ≈ ${eur(i.cost)}${tags}</small></span><span class="qty">${qtyOf(i)}</span></label>`}).join("");
    return head+`<div class="list">${rows}</div>`}).join("");
  const steps = getSteps(id).map(s=>`<li><span>${esc(s)}</span></li>`).join("");
  const w=dislikesFor(r,d), pp=photoPage(id);
  const ctrl = d===null ? `<div class="mctrl"><button class="btn primary" data-cookmode="1">Cuisiner pas à pas</button>${r.perso?`<button class="btn edit-only" data-editrec="${id}">Modifier</button><button class="btn edit-only owner-only" data-delrec="${id}">${delArm===id?"Confirmer la suppression":"Supprimer"}</button>`:""}</div>`
    : isOut(d) ? `<div class="mout"><b>Ce soir, repas à l'extérieur.</b><span>Ce plat n'est ni compté dans les courses ni dans le budget. Il reste proposé si vos plans changent.</span><button class="btn primary edit-only" data-outtoggle="${d}">Finalement, on mange à la maison</button></div>`
    : `<div class="mctrl"><button class="btn primary" data-cookmode="1">Cuisiner pas à pas</button><button class="btn edit-only" data-gallery="${d}">Changer de plat</button><button class="btn edit-only" data-swap="${d}">Autre idée</button><button class="btn edit-only" data-outtoggle="${d}">Manger à l'extérieur ce soir</button><button class="btn edit-only" data-unset="${d}">Retirer le plat (à décider)</button></div>
       <div class="mcook edit-only"><span>Aux fourneaux</span>${cookSelect(d)}</div>`;
  const avis = state.family.length ? `<section id="avis"><h3><span>L'avis de la famille</span><span class="mtotal">${avisSummary(r)}</span></h3>
      <div class="avislist">${state.family.map((n,i)=>`<div class="avisrow">${htmlAvisBoutons(id,n,"data-avis",i)}</div>`).join("")}</div>
      <p class="note">Chacun donne son avis pour lui-même, une seule fois : le choix enregistré ne se change plus. Les plats aimés reviennent plus souvent dans les propositions, les autres sont évités les soirs où la personne est là.</p></section>` : "";
  $("mbody").innerHTML = `<figure class="mphoto"><img src="${photoSrc(id)}" alt="${esc(r.nom)}" data-cache-parent="1" decoding="async">${PHOTOS_PERSO[id]?`<figcaption>Photo de la famille</figcaption>`:pp?`<figcaption>Photo d'illustration : <a href="${pp}" target="_blank" rel="noopener">Wikimedia Commons</a> (auteur et licence libre sur la page du fichier)</figcaption>`:(r.perso?`<figcaption>Recette de la famille</figcaption>`:"")}</figure>${typeof ppSousFigure==="function"?ppSousFigure(id):""}
    ${w.length?`<div class="mwarn">${esc(w.join(", "))} n'aime${w.length>1?"nt":""} pas ce plat${d!==null?" et sera là ce soir":""}.</div>`:""}
    ${ctrl}
    <section><h3><span>Courses pour ce repas</span><span class="mtotal">${items.length} ingrédients</span></h3>${lists}
      ${d!==null?'<p class="note" style="margin-top:6px">Cocher ici coche aussi l\'article dans la liste de la course correspondante.</p>':""}
      <div class="actions" style="margin-top:8px"><button class="btn" id="mcopy">Copier ces ingrédients</button></div></section>
    <section><h3><span>Préparation</span><span class="mtotal">${r.t} min</span></h3>${steps?`<ol class="steps">${steps}</ol>`:`<p class="note">Pas encore d'étapes pour cette recette.</p>`}</section>
    ${r.astuce?`<div class="mtip"><b>Astuce :</b> ${esc(r.astuce)}</div>`:""}
    ${r.proposePar?`<p class="note">Recette proposée par ${esc(r.proposePar)}.</p>`:""}
    ${r.source?`<p class="note">Idée trouvée sur <a href="${esc(r.source.url)}" target="_blank" rel="noopener">${esc(r.source.titre||"le web")}</a>${r.ajoute?`, ajoutée le ${new Date(r.ajoute).toLocaleDateString("fr-BE")}`:""}.</p>`:""}
    ${avis}
    <p class="note">Sel, poivre, huile et ail sont à prendre au placard. Coût estimé selon la gamme ${GAMMES[state.gamme].nom.toLowerCase()}.</p>
    ${d===null?"":`<div class="links"><button class="chip" data-gotrip="${items.find(i=>i.t!==null)?.t??0}">Voir la liste de la course</button><button class="chip" data-goto="courses" data-el="economies">Voir les promos</button></div>
    <div class="mnav"><button data-mday="${d-1}"${d===0?" disabled":""}><small>← Veille</small>${d>0?(BYID[state.week[d-1]]?esc(BYID[state.week[d-1]].nom):"À décider"):"—"}</button><button data-mday="${d+1}"${d===6?" disabled":""}><small>Lendemain →</small>${d<6?(BYID[state.week[d+1]]?esc(BYID[state.week[d+1]].nom):"À décider"):"—"}</button></div>`}`;
}
function openMeal(id,d){ if(!BYID[id]){ if(d!==null&&d!==undefined&&!document.body.classList.contains("readonly")) openSheet({type:"gallery",d}); return; } lastFocus=document.activeElement; modalCtx={id,d}; renderModal(); $("overlay").hidden=false; document.body.style.overflow="hidden"; $("mclose").focus(); }
function closeMeal(){ modalCtx=null; $("overlay").hidden=true; document.body.style.overflow=""; if(lastFocus&&lastFocus.focus) try{lastFocus.focus()}catch(e){} }
$("mclose").onclick=closeMeal;
function modalDay(nd){ if(!modalCtx||modalCtx.d===null||nd<0||nd>6) return; if(!BYID[state.week[nd]]){ closeMeal(); openMeal(null,nd); return; } modalCtx={id:state.week[nd],d:nd}; renderModal(); $("modal").scrollTop=0; }
$("mbody").addEventListener("click",e=>{const b=e.target.closest("[data-mday]"); if(b&&!b.disabled) modalDay(+b.dataset.mday);});
document.addEventListener("keydown",e=>{ if(!modalCtx||modalCtx.d===null) return; if(e.key==="ArrowLeft") modalDay(modalCtx.d-1); if(e.key==="ArrowRight") modalDay(modalCtx.d+1); });
// glisser à gauche/droite pour changer de jour
(()=>{let x0=null,y0=null; const m=$("modal");
  m.addEventListener("touchstart",e=>{const t=e.touches[0]; x0=t.clientX; y0=t.clientY;},{passive:true});
  m.addEventListener("touchend",e=>{ if(x0===null) return; const t=e.changedTouches[0], dx=t.clientX-x0, dy=t.clientY-y0; x0=null;
    if(Math.abs(dx)>70&&Math.abs(dx)>Math.abs(dy)*1.5&&modalCtx) modalDay(modalCtx.d+(dx<0?1:-1)); },{passive:true});
})();
$("overlay").addEventListener("click",e=>{ if(e.target===$("overlay")) closeMeal(); });
document.addEventListener("keydown",e=>{ if(e.key==="Escape"&&modalCtx) closeMeal(); });
$("mbody").addEventListener("change",e=>{const k=e.target.dataset&&e.target.dataset.mk; if(!k) return;
  if(e.target.checked) state.checked[k]=true; else delete state.checked[k]; save(); renderCourses(); renderModal();});
$("mbody").addEventListener("click",e=>{ if(e.target.id!=="mcopy") return;
  const {id,d}=modalCtx, items=mealItems(id,d);
  const txt=BYID[id].nom+(d!==null?" ("+JOURS[d]+")":"")+" · "+headcount(d)+" pers.\n"+items.map(i=>"- "+i.n+" : "+qtyOf(i)).join("\n");
  try{ navigator.clipboard.writeText(txt).then(()=>toast("Ingrédients copiés"),()=>toast("Copie impossible ici")); }catch(err){ toast("Copie impossible ici"); }
});
$("recipes").addEventListener("click",e=>{const b=e.target.closest("[data-openrec]"); if(b) openMeal(b.dataset.openrec,null);});
$("trip1").onchange=e=>{state.trip1=e.target.value;state.checked={};save();render();toast("Jour des courses : "+tripName(0));};

function render(){if(!$("view-menu")) return; document.body.classList.toggle("verrou",verrouille()); renderNouveautes(); $("trip1").value=state.trip1;renderWeekbar();if(typeof renderMenuPage==="function")renderMenuPage();renderCompteHaut();renderACompleter();renderCalendrier();renderPresences();renderBudget();renderStats();renderDays();renderCourses();renderPromos();renderRecettes();renderReglages();if(typeof renderRetours==="function")renderRetours();if(state.tab==="envies"&&typeof renderEnvies==="function")renderEnvies();}
$("sugg").addEventListener("change",e=>{const s=e.target.closest("select[data-add]"); if(!s||s.value==="") return;
  replaceDay(+s.value,s.dataset.add);});
$("cmp").addEventListener("change",e=>{const inp=e.target.closest("input[data-pk]"); if(!inp) return;
  const k=inp.dataset.pk, m=inp.dataset.mag, v=parseFloat(String(inp.value).replace(",","."));
  state.prices[k]=state.prices[k]||{}; if(isNaN(v)) delete state.prices[k][m]; else state.prices[k][m]=Math.round(v*100)/100;
  save(); renderCmp(true);});
$("clearprices").onclick=()=>{state.prices={};save();renderCmp();toast("Prix effacés");};
function syncPersons(){ if(state.family.length) state.persons=state.family.length; }
document.addEventListener("change",e=>{const s=e.target.closest("select[data-cook]"); if(!s) return;
  state.cooks[+s.dataset.cook]=s.value||null; save(); render(); if(modalCtx) renderModal();});
$("addform").addEventListener("submit",e=>{e.preventDefault(); const n=$("newname").value.trim();
  if(!n) return; if(state.family.some(x=>x.toLowerCase()===n.toLowerCase())){toast(n+" est déjà dans la famille");return;}
  const m=$("newmail").value.trim();
  if(m&&!validMail(m)){ toast("Adresse e-mail invalide : vérifiez-la"); $("newmail").focus(); return; }
  state.family.push(n); if(m) state.emails={...state.emails,[n]:m};
  syncPersons(); $("newname").value=""; $("newmail").value=""; save(); render(); $("newname").focus(); toast(n+" ajouté(e)");});
const validMail = m => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(m);
$("members").addEventListener("change",e=>{const inp=e.target.closest("input[data-mail]"); if(!inp) return;
  const n=state.family[+inp.dataset.mail]; if(!n) return; const m=inp.value.trim();
  if(m&&!validMail(m)){ inp.classList.add("bad"); toast("Adresse e-mail invalide : vérifiez-la"); return; }
  inp.classList.remove("bad"); const em={...state.emails}; if(m) em[n]=m; else delete em[n]; state.emails=em; save(); renderReglages(); if(shareOpen) renderWeekbar(); toast(m?"Adresse enregistrée":"Adresse retirée");});
$("copymails").onclick=()=>{ const list=state.family.map(n=>state.emails[n]).filter(Boolean);
  if(!list.length){ toast("Ajoutez d'abord des adresses e-mail"); return; }
  const txt=list.join(", ");
  try{ navigator.clipboard.writeText(txt).then(()=>toast(list.length+" adresse"+(list.length>1?"s":"")+" copiée"+(list.length>1?"s":"")),()=>toast(txt)); }catch(err){ toast(txt); } };
$("members").addEventListener("click",e=>{const b=e.target.closest("[data-del]"); if(!b) return;
  const n=state.family[+b.dataset.del]; state.family.splice(+b.dataset.del,1);
  state.cooks=state.cooks.map(c=>c===n?null:c); if(state.absents[n]){ const c={...state.absents}; delete c[n]; state.absents=c; } if(state.emails[n]){ const em={...state.emails}; delete em[n]; state.emails=em; } syncPersons(); save(); render(); toast(n+" retiré(e)");});
$("autoassign").onclick=()=>{ if(!state.family.length){toast("Ajoutez d'abord des prénoms");return;}
  const start=Math.floor(Math.random()*state.family.length);
  state.cooks=JOURS.map((_,d)=>state.family[(start+d)%state.family.length]); save(); render(); toast("Soirs répartis");};
$("clearassign").onclick=()=>{state.cooks=Array(7).fill(null);save();render();toast("Attributions effacées");};
function toast(msg,undo,label){const t=$("toast");t.textContent=msg;
  if(undo){const b=document.createElement("button");b.textContent=label||"Annuler";b.onclick=()=>{undo();t.hidden=true;};t.appendChild(b);}
  t.hidden=false;clearTimeout(toast.h);toast.h=setTimeout(()=>t.hidden=true,undo?4500:2000);}
// Remplacement d'un plat avec possibilité d'annuler
function replaceDay(d,newId){ if(verrouille()){ toast("Menu figé : validé par toute la famille ou semaine commencée"); return; } const prev=state.week[d]; state.week[d]=newId; state.picking=null; save(); render();
  toast(JOURS[d]+" : "+BYID[newId].nom,()=>{state.week[d]=prev; save(); render(); toast("Plat rétabli");}); }

document.querySelector("nav").addEventListener("click",e=>{const b=e.target.closest("button[data-tab]"); if(b) setTab(b.dataset.tab);});
document.getElementById("view-plus").addEventListener("click",e=>{const b=e.target.closest("[data-go]"); if(b) setTab(b.dataset.go);});
$("minus").onclick=()=>{if(state.persons>1){state.persons--;save();render();}};
$("plus").onclick=()=>{if(state.persons<12){state.persons++;save();render();}};
$("days").addEventListener("click",e=>{
  const o=e.target.closest("[data-open]"); if(o){ openMeal(state.week[+o.dataset.open], +o.dataset.open); return; }
  const s=e.target.closest("[data-swap]"), p=e.target.closest("[data-pick]");
  if(s){const d=+s.dataset.swap; const libres=RECETTES.filter(r=>!state.week.includes(r.id));
    const pool=libres.length?libres:RECETTES.filter(r=>r.id!==state.week[d]);
    replaceDay(d,pool[Math.floor(Math.random()*pool.length)].id);}
  if(p){const d=+p.dataset.pick; state.picking=state.picking===d?null:d; renderDays(); const sel=$("pick-"+d); if(sel) sel.focus();}
});
$("days").addEventListener("change",e=>{const sel=e.target.closest("select.pick"); if(!sel) return;
  replaceDay(+sel.dataset.day,sel.value);});
$("aisles").addEventListener("change",e=>{const k=e.target.dataset.k; if(!k) return; if(e.target.checked) state.checked[k]=true; else delete state.checked[k]; save(); renderCourses();});
$("aisles").addEventListener("change",e=>{const s=e.target.closest("select[data-store]"); if(!s) return;
  state.tripStore[+s.dataset.store]=s.value||null; save(); renderCourses();});
$("plan").addEventListener("change",e=>{
  if(e.target.id==="maxstores"){state.maxStores=+e.target.value;}
  else if(e.target.id==="seuil"){state.seuil=+e.target.value;}
  else return; save(); renderCourses();});
$("budget").addEventListener("click",e=>{ const m=e.target.closest("[data-mix]"); if(m){ const k=m.dataset.mix, v=Math.max(0,(state.mix[k]|0)+(+m.dataset.dv)); state.mix={...state.mix,[k]:v}; save(); render(); toast("Répartition enregistrée : elle s'appliquera à la prochaine proposition"); return; }
  if(e.target.closest("#mixpropose")){ $("propose")&&$("propose").click(); return; } });
$("budget").addEventListener("click",e=>{const b=e.target.closest("[data-gamme]"); if(!b) return; state.gamme=b.dataset.gamme; save(); render();});
$("uncheck").onclick=()=>{state.checked={};save();renderCourses();toast("Liste remise à zéro");};
$("copy").onclick=()=>{
  const trips=coursesTrips();
  const txt="Courses de la semaine ("+totalCouverts()+" couverts)\n"+trips.map((all,t)=>{const items=all.filter(i=>!state.checked[i.ck]); if(!items.length) return "";
    const plan=planTrip(t,all);
    return "\n== Course "+(t+1)+" · "+tripName(t)+" ==\n"+[plan.primary,plan.secondary].filter(Boolean).map(mag=>{const si=items.filter(i=>plan.assign[i.k]===mag); if(!si.length) return "";
      return "\n>> "+MAGNOM[mag]+"\n"+ORDRE.map(ray=>{const its=si.filter(i=>i.ray===ray); return its.length? RAYONS[ray]+"\n"+its.map(i=>"- "+i.n+" : "+qtyOf(i)).join("\n")+"\n":""}).join("");}).join("");}).join("");
  const box=$("copybox");
  const fallback=()=>{box.value=txt;box.hidden=false;box.focus();box.select();toast("Sélectionnez le texte puis copiez-le");};
  try{ navigator.clipboard.writeText(txt).then(()=>{box.hidden=true;toast("Liste copiée");},fallback);}catch(err){fallback();}
};
// ======================= Semaines et partage familial =======================
// Proposition automatique : évite les plats de la semaine précédente, privilégie les promos,
// plats les plus rapides en semaine et ceux de 30 min le week-end.
// ---- Règle des budgets et de la variété ----
const BUDGETS={eco:{nom:"Économique",court:"Éco",desc:"Le quotidien à petit prix"},moyen:{nom:"Budget moyen",court:"Moyen",desc:"Un peu plus de viande ou de variété"},plaisir:{nom:"Pour se faire plaisir",court:"Plaisir",desc:"Le repas qu'on attend dans la semaine"}};
const PROT={veau:"veau",boeuf:"bœuf",porc:"porc",volaille:"volaille",poisson:"poisson",oeufs:"œufs",vege:"végétarien"};
const FECU={legumes:"légumes",lentilles:"lentilles",galette:"galettes",pates:"pâtes",riz:"riz",pdt:"pommes de terre",pain:"pain ou galette",tarte:"pâte à tarte",semoule:"semoule"};
// Recette de famille : budget déduit de son prix de revient par personne (gamme économique)
function budgetOf(r){ if(r.b) return r.b; let c=0; try{ c=r.ing.reduce((s,[n,q,u,ray])=>s+itemCost(n,u,q,ray,"eco"),0)/5+(r.prix?r.prix/5:0); }catch(e){} return c<1.6?"eco":c<2.6?"moyen":"plaisir"; }
function mixFor(n){ const m=state.mix||{plaisir:1,moyen:2}; let pl=Math.min(n,Math.max(0,m.plaisir|0)), mo=Math.min(n-pl,Math.max(0,m.moyen|0)); return {plaisir:pl,moyen:mo,eco:n-pl-mo}; }
function recentIds(nbWeeks){ const ids=new Set(), src={...state.weeks,...(typeof SEMAINES==="object"?SEMAINES:{})};
  for(let k=1;k<=nbWeeks;k++){ const iso=isoOf(new Date(MONDAY.getFullYear(),MONDAY.getMonth(),MONDAY.getDate()-7*k)); const w=src[iso]; if(w&&Array.isArray(w.menu)) w.menu.forEach(id=>ids.add(id)); } return ids; }
function proposeMenu(opts={}){
  const out=opts.out||outList(state.exterieur), home=[0,1,2,3,4,5,6].filter(d=>!out.includes(d)), quota=opts.mix?(()=>{ const pl=Math.min(home.length,opts.mix.plaisir), mo=Math.min(home.length-pl,opts.mix.moyen); return {plaisir:pl,moyen:mo,eco:home.length-pl-mo}; })():mixFor(home.length);
  const recent1=recentIds(1), recent2=recentIds(2), avoid=opts.avoid||new Set();
  let profs=null; try{ if(typeof profil==="function"&&state.family.length) profs=Object.fromEntries(state.family.map(n=>[n,profil(n)])); }catch(e){}
  const fam=r=>{ try{ return profs?scoreFamille(r,profs):0; }catch(e){ return 0; } };
  const base=r=>promoCount(r)*0.6+(opts.extra?opts.extra(r):likeScore(r)*0.6+fam(r)*1.2)-dislikesFor(r,null).length*1.5+(typeof bonusRetours==="function"?bonusRetours(r):0)-(recent1.has(r.id)||avoid.has(r.id)?6:recent2.has(r.id)?2:0);
  const S=Object.fromEntries(RECETTES.map(r=>[r.id,base(r)]));
  // le plat plaisir de préférence le vendredi ou le dimanche, les plats de 30 minutes plutôt le week-end
  const order=[...home].sort((x,y)=>([4,6,5,3,2,1,0].indexOf(x))-([4,6,5,3,2,1,0].indexOf(y)));
  const sols=[];
  for(let essai=0;essai<250;essai++){
    const left={...quota}, used=new Set(), pick={}, cntP={}, cntF={}; let total=0, ok=true;
    for(const d of order){
      const want=left.plaisir>0?"plaisir":left.moyen>0&&Math.random()<left.moyen/(left.moyen+left.eco)?"moyen":left.eco>0?"eco":"moyen";
      const cand=RECETTES.filter(r=>!used.has(r.id)&&budgetOf(r)===want).filter(r=>{
        const p=r.p||"autre", f=r.f||"autre";
        if((cntF[f]||0)>=2) return false;                                   // pas plus de 2 fois le même féculent
        if(p!=="vege"&&(cntP[p]||0)>=2) return false;                       // pas plus de 2 fois la même viande
        if(pick[d-1]&&(BYID[pick[d-1]].p===p&&p!=="vege"||BYID[pick[d-1]].f===f)) return false;   // pas deux soirs de suite pareil
        if(pick[d+1]&&(BYID[pick[d+1]].p===p&&p!=="vege"||BYID[pick[d+1]].f===f)) return false;
        if(r.t>=30&&(d<4)&&Math.random()<0.5) return false;                 // les plats plus longs plutôt en fin de semaine
        return true; });
      if(!cand.length){ ok=false; break; }
      const sc=cand.map(r=>({r,s:S[r.id]+Math.random()*3})).sort((x,y)=>y.s-x.s)[0];
      pick[d]=sc.r.id; used.add(sc.r.id); cntP[sc.r.p]=(cntP[sc.r.p]||0)+1; cntF[sc.r.f]=(cntF[sc.r.f]||0)+1; left[want]--; total+=sc.s;
    }
    if(!ok) continue;
    const prots=Object.keys(cntP); if(prots.includes("poisson")) total+=1; if(prots.includes("vege")||prots.includes("oeufs")) total+=1.5; total+=prots.length*0.5;
    sols.push({total,pick});
  }
  // on tire au hasard parmi les 25 meilleures combinaisons : les menus changent d'une proposition à l'autre
  sols.sort((x,y)=>y.total-x.total); const best=sols.length?sols[Math.floor(Math.random()*Math.min(25,sols.length))]:null;
  const res=Array(7).fill(null);
  if(best) Object.entries(best.pick).forEach(([d,id])=>{ res[+d]=id; });
  // jours à l'extérieur, ou si aucune combinaison ne respecte les règles : on complète simplement
  const pool=RECETTES.map(r=>r.id).filter(id=>!res.includes(id)).sort((x,y)=>S[y]-S[x]);
  for(let d=0;d<7;d++) if(!res[d]) res[d]=pool.shift()||RECETTES[d%RECETTES.length].id;
  return res;
}
function weekLabel(){ const a=dayOffset(0), b=dayOffset(6);
  return `${a.getDate()} ${a.getMonth()!==b.getMonth()?a.toLocaleDateString("fr-BE",{month:"short"})+" ":""}au ${b.getDate()} ${b.toLocaleDateString("fr-BE",{month:"long"})}`; }
function relWeek(){ return ["Cette semaine","Semaine suivante","Dans 2 semaines","Dans 3 semaines"][state.weekOffset]; }
function goWeek(off){ if(off<0||off>3||off===state.weekOffset) return;
  stashWeek(); state.weekOffset=off; setMonday(off);
  const w=state.weeks[curIso()], sv=(typeof SEMAINES==="object"&&DB)?SEMAINES[curIso()]:null;
  if(w&&menuOk(w.menu)) applyWeekData(w);
  else if(sv&&menuOk(sv.menu)) applyWeekData(weekFromDoc(sv));   // semaine déjà préparée par un autre membre : on part de sa fiche, pas d'une nouvelle proposition
  else { state.week=proposeMenu(); state.cooks=Array(7).fill(null); state.checked={}; state.statut="proposition"; state.journal=[]; state.absents={}; state.invites=[0,0,0,0,0,0,0]; state.approbations={}; state.limite=null; state.exterieur=null; state.extras=[]; state.qtEdit={}; state.lieux={}; state.tickets=[]; }
  state.picking=null; applyValidation(); saveLocal(); subscribeWeek(); render();
  urlSemaine(); }


// --- partage via la base de données de la page ---
let DB=null, USER=null, ME=null, CAN_WRITE=null, unsubWeek=null, unsubFam=null, IS_OWNER=true, VALID={}, LIMITES={};
let shareOpen=false, shareReady=false, lastShared=null, lastFamily=null, writing=false, dirty=false, syncState="local";
const sharedPayload=()=>({menu:state.week,cuisiniers:state.cooks,coches:state.checked,absents:state.absents,invites:state.invites,approbations:state.approbations,exterieur:state.exterieur,ajouts:state.extras,quantites:state.qtEdit||{},lieux:state.lieux||{},tickets:state.tickets||[]});
function describeChange(prev,next){
  if(!prev) return "a proposé le menu de la semaine";
  const out=[];
  next.menu.forEach((id,d)=>{ if(prev.menu&&prev.menu[d]!==id) out.push(`${JOURS[d]} : ${BYID[id]?BYID[id].nom:"à décider"}`); });
  next.cuisiniers.forEach((c,d)=>{ if((prev.cuisiniers||[])[d]!==c) out.push(`${JOURS[d]} : ${c?c+" aux fourneaux":"personne aux fourneaux"}`); });
  state.family.forEach(n=>{ const a=(prev.absents||{})[n]||[], b=(next.absents||{})[n]||[];
    JOURS.forEach((j,d)=>{ if(a.includes(d)!==b.includes(d)) out.push(`${n} ${b.includes(d)?"absent(e)":"présent(e)"} ${j.toLowerCase()}`); }); });
  JOURS.forEach((j,d)=>{ const a=outList(prev.exterieur).includes(d), b=outList(next.exterieur).includes(d); if(a!==b) out.push(`${j} : ${b?"repas à l'extérieur":"on mange à la maison"}`); });
  state.family.forEach(n=>{ const a=(prev.approbations||{})[n], b=(next.approbations||{})[n]; if(!a&&b) out.push(`${n} a validé le menu`); if(a&&!b) out.push(`${n} a retiré sa validation`); });
  (next.invites||[]).forEach((v,d)=>{ const o=(prev.invites||[])[d]||0; if(o!==v) out.push(`${JOURS[d]} : ${v} invité${v>1?"s":""}`); });
  const pa=new Set((prev.ajouts||[]).map(x=>x.id)), na=(next.ajouts||[]).filter(x=>!pa.has(x.id));
  if(na.length) out.push(`a ajouté ${na.map(x=>x.n.toLowerCase()).join(", ")} aux courses`);
  if(!out.length && JSON.stringify(prev.coches)!==JSON.stringify(next.coches)) return null; // cocher ne pollue pas le journal
  return out.slice(0,3).join(" · ")+(out.length>3?` (+${out.length-3})`:"");
}
function shareSync(){
  if(!DB||CAN_WRITE===false||!shareReady) return;
  const now=sharedPayload(), s=JSON.stringify(now);
  if(s===lastShared) return;
  const txt=describeChange(lastShared?JSON.parse(lastShared):null,now);
  lastShared=s;
  if(txt){ state.journal=[{par:ME,quand:new Date().toISOString(),texte:txt},...state.journal].slice(0,15); saveLocal(); }
  queueWrite();
}
async function queueWrite(){
  if(writing){dirty=true;return;} writing=true;
  const iso=curIso(), body={...sharedPayload(),journal:state.journal,maj:new Date().toISOString()};
  try{ await DB.doc("semaines/"+iso).set(body); setSync("ok"); }
  catch(e){ if(e&&e.code==="invalid_argument"){ CAN_WRITE=false; document.body.classList.add("readonly"); setSync("readonly"); } else setSync("err"); }
  writing=false; if(dirty){dirty=false; queueWrite();}
}
function subscribeWeek(){
  if(!DB) return; if(unsubWeek) unsubWeek(); shareReady=false; lastShared=null; setSync("load");
  const iso=curIso(); const timer=setTimeout(()=>setSync("slow"),10000);
  unsubWeek=DB.doc("semaines/"+iso).onSnapshot(snap=>{
    if(iso!==curIso()) return;
    if(snap.exists){
      const d=snap.data();
      if(Array.isArray(d.menu)&&d.menu.length===7&&d.menu.some(id=>id!==null&&!BYID[id])) pendingWeek={iso,d};
      if(!snap.metadata.hasPendingWrites && menuOk(d.menu)){
        applyWeekData({menu:d.menu,cooks:d.cuisiniers,checked:d.coches,statut:d.statut,journal:d.journal,absents:d.absents,invites:d.invites,approbations:d.approbations,exterieur:d.exterieur,extras:d.ajouts,quantites:d.quantites,lieux:d.lieux,tickets:d.tickets});
        lastShared=JSON.stringify(sharedPayload()); saveLocal(); render(); if(modalCtx) renderModal();
      }
    }
    if(!snap.metadata.fromCache){ clearTimeout(timer); shareReady=true; setTimeout(()=>{ try{ rappelManquants(); }catch(e){} },900); setSync(CAN_WRITE===false?"readonly":"ok");
      if(!snap.exists) shareSync(); }   // première ouverture : on publie le menu local pour la famille
  }, err=>{ clearTimeout(timer); setSync("err"); });
}
function subscribeFamily(){
  if(!DB) return; if(unsubFam) unsubFam();
  unsubFam=DB.doc("famille/liste").onSnapshot(snap=>{
    if(snap.exists){ const m=snap.data().membres; if(Array.isArray(m)&&!snap.metadata.hasPendingWrites){ state.family=[...new Set(m.map(x=>propre(x,30)).filter(Boolean))].slice(0,20); const em=snap.data().emails; state.emails={}; if(em&&typeof em==="object") state.family.forEach(n=>{ if(typeof em[n]==="string"&&validMail(em[n])) state.emails[n]=em[n]; }); lastFamily=JSON.stringify(famPayload()); syncPersons(); saveLocal(); render(); } }
    else if(!snap.metadata.fromCache){ lastFamily=""; familySync(); }
  },()=>{});
}
let famWriting=false, famDirty=false;
const famPayload=()=>({membres:state.family,emails:Object.fromEntries(state.family.filter(n=>state.emails[n]).map(n=>[n,state.emails[n]]))});
async function familySync(){
  if(DB&&!IS_OWNER) return;
  if(!DB||CAN_WRITE===false||lastFamily===null) return;
  const s=JSON.stringify(famPayload()); if(s===lastFamily) return;
  if(famWriting){famDirty=true;return;} famWriting=true; lastFamily=s;
  try{ await DB.doc("famille/liste").set(famPayload()); }catch(e){}
  famWriting=false; if(famDirty){famDirty=false; familySync();}
}
function setSync(st){ syncState=st; const el=$("sync"); if(!el) return;
  const t={local:"Enregistré sur cet appareil",load:"Synchronisation…",ok:"Partagé avec la famille",slow:"Connexion lente : vos changements partiront dès que possible",err:"Partage indisponible pour le moment",readonly:"Lecture seule"}[st];
  el.textContent=t; el.className="sync "+st; }
async function renderJournal(){
  const box=$("journal"); if(!box) return;
  const items=state.journal.slice(0,5);
  if(!items.length){ box.innerHTML=`<p class="note">${DB?"Les modifications de chacun apparaîtront ici.":"Le journal des modifications s'active quand vous rejoignez la famille avec le code d'invitation."}</p>`; return; }
  box.innerHTML=items.map((j,i)=>`<div class="jrow"><span class="jwho" id="jw-${i}">…</span><span class="jtxt"></span><span class="jwhen">${ago(j.quand)}</span></div>`).join("");
  items.forEach((j,i)=>{ box.children[i].querySelector(".jtxt").textContent=j.texte; });
  const ids=[...new Set(items.map(j=>j.par).filter(Boolean))];
  let ps={}; try{ if(USER&&ids.length) ps=await USER.profiles(ids); }catch(e){}
  items.forEach((j,i)=>{ const el=$("jw-"+i); if(!el) return; const p=j.par&&ps[j.par];
    el.textContent = p&&p.isMe ? "Vous" : (p&&p.name) || "Quelqu'un"; });
}
function ago(iso){ const m=Math.round((Date.now()-new Date(iso).getTime())/60000);
  if(!(m>=0)) return ""; if(m<1) return "à l'instant"; if(m<60) return `il y a ${m} min`; const h=Math.round(m/60); if(h<24) return `il y a ${h} h`; return `il y a ${Math.round(h/24)} j`; }
function kindTitre(valide){
  if(state.weekOffset===0) return valide?"Menu officiel de cette semaine":"Menu de cette semaine à valider";
  return valide?"Menu validé pour la semaine suivante":"Propositions pour la semaine suivante";
}
function renderWeekbar(){
  const valide=state.statut==="valide";
  $("weekbar").innerHTML=`    <div class="actions wact">
      <button class="btn primary" id="share" data-tip="Prépare un message avec le menu et le lien de l'application, à envoyer par WhatsApp ou SMS">Envoyer à la famille</button>
      <button class="btn edit-only owner-only${!valide&&manques().length?" incomplet":""}" id="valider" data-tip="${valide?"Permet à nouveau de changer les plats et les cuisiniers":manques().length?"Impossible pour l'instant : "+esc(manquesTexte(manques()))+". Complétez d'abord ces soirs.":"Fige le menu de la semaine : il devient le menu officiel"}">${valide?"Rouvrir aux modifications":"Valider le menu"}</button>
      <button class="btn" id="exportmenu" data-tip="Calendrier de la semaine en PDF (ou en texte), avec les plats, les cuisiniers et les couverts">📄 Menu en PDF</button>
      <button class="btn edit-only" id="propose" data-tip="Tire un nouveau menu selon la répartition des budgets, la variété et les goûts de chacun">Nouvelle proposition</button>
    </div>
    ${renderApprovals()}
    <div class="sharebox" id="sharebox"${shareOpen?"":" hidden"}>
      <ol class="sharesteps">
        <li>${window.INVITE_URL?`Envoyez ce lien d'invitation à chaque membre de la famille. En l'ouvrant, chacun indique son prénom et peut tout de suite modifier les menus.<div class="invite"><code>${esc(window.INVITE_URL)}</code><button class="btn" id="copyinvite" type="button">Copier le lien</button></div>`:`Demandez le lien d'invitation au propriétaire de l'application (Réglages, Accès de la famille).`}</li>
        <li>Envoyez-leur le message ci-dessous par WhatsApp, SMS ou e-mail.</li>
      </ol>
      <textarea class="copybox" id="sharemsg" readonly aria-label="Message pour la famille">${esc(shareMessage())}</textarea>
      <div class="actions"><button class="btn primary" id="copymsg">Copier le message</button></div>
    </div>
    <div class="journal"><h3>Dernières modifications</h3><div id="journal"></div></div>`;
  renderJournal();
}
// ---- Validation par chaque membre et date limite ----
const menuKey = () => state.week.join(",")+"|"+outList(state.exterieur).join("");
function approvalOf(n){ const a=state.approbations[n]; if(!a) return null; return {...a, ancienne: a.menu && a.menu!==menuKey()}; }
// Date limite de réponse : par défaut le samedi qui précède la semaine, à 10 h (jour de la première course)
function limiteParDefaut(){ const d=new Date(MONDAY); d.setDate(d.getDate()-2); d.setHours(10,0,0,0); return d; }
const isoLocal = d => isoOf(d)+"T"+String(d.getHours()).padStart(2,"0")+":"+String(d.getMinutes()).padStart(2,"0");
function limiteDate(){ return state.limite? new Date(state.limite) : limiteParDefaut(); }
// Décompte affiché en haut à droite de la page
function renderCompteHaut(){ const box=$("comptehaut"); if(!box) return; const L=limiteDate();
  if(!state.family.length||!L||isNaN(L)){ box.hidden=true; return; } box.hidden=false; const t=decompte(L);
  if(state.statut==="valide"){ box.className="comptehaut"; box.innerHTML=`<small>Menu validé</small><b>✓</b><small>Semaine du ${esc(weekLabel())}</small>`; return; }
  const {ok}=approvalStats(); if(ok.length===state.family.length){ box.className="comptehaut"; box.innerHTML=`<small>Toute la famille a validé</small><b>${ok.length}/${state.family.length} ✓</b><small>${IS_OWNER?"Il reste à valider le menu final":"En attente de la validation finale"}</small>`; return; }
  box.className="comptehaut"+(!t?" fini":(L-Date.now())<24*36e5?" urgent":"");
  box.innerHTML=t?`<small>Validation du menu : il reste</small><b role="timer" data-compte="${L.getTime()}">${t}</b><small>avant ${esc(limiteTxt())}</small>`:`<small>Validation du menu</small><b>Délai dépassé</b><small>depuis ${esc(limiteTxt())}</small>`; }
// Décompte : « 1 j 12 h 05 min », mis à jour en continu dans tout élément portant data-compte
function decompte(L){ let ms=L-Date.now(); if(ms<=0) return null; const j=Math.floor(ms/864e5); ms-=j*864e5; const h=Math.floor(ms/36e5); ms-=h*36e5; const m=Math.floor(ms/6e4), sec=Math.floor((ms-m*6e4)/1000);
  const mm=String(m).padStart(2,"0"), ss=String(sec).padStart(2,"0");
  return j?`${j} j ${h} h ${mm} min ${ss} s`:h?`${h} h ${mm} min ${ss} s`:`${m} min ${ss} s`; }
setInterval(()=>{ document.querySelectorAll("[data-compte]").forEach(el=>{ const L=new Date(+el.dataset.compte), t=decompte(L);
  if(t) el.textContent=t; else if(!el.dataset.fini){ el.dataset.fini="1"; render(); } }); },1000);
function limiteTxt(){ const L=limiteDate(); if(!L||isNaN(L)) return null;
  return L.toLocaleDateString("fr-BE",{weekday:"long",day:"numeric",month:"long"})+" à "+L.toLocaleTimeString("fr-BE",{hour:"2-digit",minute:"2-digit"}); }
function approvalStats(){ const ok=state.family.filter(n=>{const a=approvalOf(n); return a&&!a.ancienne;}); return {ok, wait:state.family.filter(n=>!ok.includes(n))}; }
function renderApprovals(){
  if(!state.family.length) return "";
  const L=limiteDate(), past=L&&Date.now()>L.getTime(), {ok,wait}=approvalStats();
  const urgent=L&&!past&&(L-Date.now())<24*36e5;
  return `<div class="appr">
    <div class="apprhead"><b>Validation de la famille</b><span class="st ${wait.length?"soon":"on"}">${ok.length}/${state.family.length} ont validé</span></div>
    <div class="apprdeadline${past?" late":""}">
      ${past?`<span>Délai dépassé depuis ${esc(limiteTxt())}</span>`:`<span>Réponse attendue avant <b>${esc(limiteTxt())}</b></span>
`}
      <span class="owner-only edit-only"><label class="sr" for="limite">Date limite</label><input type="datetime-local" id="limite" value="${esc(isoLocal(L))}" aria-label="Date limite de réponse" data-tip="Par défaut : le samedi avant la semaine, à 10 h">${state.limite?`<button class="chip" id="nolimite" data-tip="Revenir au samedi 10 h">Samedi 10 h</button>`:""}</span></div>
    <div class="apprlist">${state.family.map((n,i)=>{const a=approvalOf(n);
      const st=!a?"wait":a.ancienne?"old":"ok";
      return `<div class="apprrow ${st}"><span class="adot" aria-hidden="true">${st==="ok"?"✓":st==="old"?"!":"…"}</span><span class="aname"><b>${esc(n)}</b><small>${st==="ok"?"a validé "+ago(a.quand):st==="old"?"a validé une version précédente "+ago(a.quand):(past?"n'a pas répondu à temps":"n'a pas encore validé")}</small></span>
        <button class="chip ${st==="ok"?"":"on"} edit-ctl" data-appr="${i}">${st==="ok"?"Retirer":"Valider pour "+esc(n)}</button></div>`}).join("")}</div>
  </div>`;
}
function shareMessage(){
  return `Bonjour la famille ! Voici les menus du soir proposés pour la semaine du ${weekLabel()} :\n`+
    state.week.map((id,d)=>isOut(d)?`- ${JOURS[d]} : repas à l'extérieur`:`- ${JOURS[d]} : ${BYID[id]?BYID[id].nom:"à décider"}${state.cooks[d]?" (cuisine : "+state.cooks[d]+")":""}`).join("\n")+
    `${limiteTxt()?`\n\nMerci de valider le menu (ou de proposer des changements) avant ${limiteTxt()}.`:""}\n\nVous pouvez changer un plat, choisir qui cuisine et cocher les courses directement dans l'application :\n${window.INVITE_URL||APP_URL}`;
}
const APP_URL="https://man2106.github.io/menus-semaine/";
function setLimite(v){ if(DB&&!IS_OWNER){ toast("Seul le propriétaire fixe la date limite"); return; }
  state.limite=v||null;
  if(DB){ LIMITES={...LIMITES}; if(v) LIMITES[curIso()]=v; else delete LIMITES[curIso()]; DB.doc("validations/menus").set({semaines:VALID,limites:LIMITES}).catch(()=>toast("La date limite n'a pas pu être enregistrée")); }
  saveLocal(); render(); toast(v?"Réponse attendue avant "+limiteTxt():"Date limite : le samedi à 10 h, avant la première course"); }
$("weekbar").addEventListener("change",e=>{ if(e.target.id==="limite"){ const v=e.target.value; if(v) setLimite(v); } });
$("weekbar").addEventListener("click",e=>{
  if(e.target.id==="share"){ shareOpen=!shareOpen; const b=$("sharebox"); b.hidden=!shareOpen; if(shareOpen){ $("sharemsg").value=shareMessage(); } return; }
  const ap=e.target.closest("[data-appr]");
  if(ap){ const n=state.family[+ap.dataset.appr]; if(!n) return; basculerApprobation(n); return; }
  if(e.target.id==="nolimite"){ setLimite(null); return; }
  if(e.target.id==="exportmenu"){ openSheet({type:"export",kind:"menu",withRecipes:false}); return; }
  if(e.target.id==="copymails2"){ $("copymails").click(); return; }
  if(e.target.id==="copyinvite"){ try{ navigator.clipboard.writeText(window.INVITE_URL).then(()=>toast("Lien d'invitation copié"),()=>toast(window.INVITE_URL)); }catch(err){ toast(window.INVITE_URL); } return; }
  if(e.target.id==="copymsg"){ const txt=shareMessage(), box=$("sharemsg"); box.value=txt;
    try{ navigator.clipboard.writeText(txt).then(()=>toast("Message copié"),()=>{box.focus();box.select();toast("Sélectionnez le texte puis copiez-le");}); }catch(err){box.focus();box.select();} return; }
  if(e.target.id==="valider"){ if(DB&&!IS_OWNER){ toast("Seul le propriétaire valide le menu"); return; }
    if(verrouille()){ toast("Menu figé : validé par toute la famille ou semaine commencée"); return; }
    if(state.statut!=="valide"){ const m=manques(); if(m.length){ toast(`Validation impossible : ${manquesTexte(m)}.`); if($("acompleter")) goTo("famille","acompleter"); return; } }
    state.statut=state.statut==="valide"?"proposition":"valide";
    if(DB){ VALID={...VALID,[curIso()]:state.statut}; DB.doc("validations/menus").set({semaines:VALID,limites:LIMITES}).catch(()=>toast("La validation n'a pas pu être enregistrée"));
      state.journal=[{par:ME,quand:new Date().toISOString(),texte:state.statut==="valide"?"a validé le menu":"a rouvert le menu aux modifications"},...state.journal].slice(0,15); if(shareReady) queueWrite(); }
    saveLocal(); render(); toast(state.statut==="valide"?"Menu validé":"Menu rouvert"); return; }
  if(e.target.id==="propose"){ const prev=[...state.week]; state.week=proposeMenu(); state.statut="proposition"; save(); render();
    toast("Nouvelle proposition",()=>{state.week=prev; save(); render(); toast("Proposition précédente rétablie");}); return; }
});
// ---- Calendrier de présence ----
function gcalLink(d){
  const day=dayOffset(d), r=BYID[state.week[d]]||{nom:"plat à décider"}, ymd=isoOf(day).replace(/-/g,"");
  const pres=state.family.filter(n=>!(state.absents[n]||[]).includes(d));
  const det=[`${headcount(d)} à table`, state.cooks[d]?`Cuisine : ${state.cooks[d]}`:"", pres.length?`Présents : ${pres.join(", ")}`:"", state.invites[d]?`Invités : ${state.invites[d]}`:"", "Recette et courses : "+APP_URL].filter(Boolean).join("\n");
  const q=new URLSearchParams({action:"TEMPLATE",text:`Dîner : ${r.nom}`,dates:`${ymd}T190000/${ymd}T200000`,ctz:"Europe/Brussels",details:det});
  return "https://calendar.google.com/calendar/render?"+q.toString();
}
function planningText(){
  return `Présences aux repas du soir, semaine du ${weekLabel()} :\n`+JOURS.map((j,d)=>{
    const abs=state.family.filter(n=>(state.absents[n]||[]).includes(d));
    return `- ${j} ${fmtShort(dayOffset(d))} : ${headcount(d)} à table (${BYID[state.week[d]]?BYID[state.week[d]].nom:"plat à décider"})${abs.length?" · absents : "+abs.join(", "):""}${state.invites[d]?" · invités : "+state.invites[d]:""}${state.cooks[d]?" · cuisine : "+state.cooks[d]:""}`;}).join("\n")+
    `\n\nIndiquez vos absences dans l'application :\n${APP_URL}`;
}
function renderPresences(){
  const box=$("presences");
  if(!state.family.length){
    box.innerHTML=`<h2>Qui sera à table ?</h2><p>Ajoutez les membres de la famille pour que chacun indique ses présences. Les quantités s'adapteront à chaque repas.</p>
      <div class="links"><button class="chip" data-goto="famille" data-el="members">Ajouter la famille</button></div>`; return; }
  const head=JOURS.map((j,d)=>`<th scope="col"${dayOffset(d).getTime()===TODAY.getTime()?' class="today"':""}>${j.slice(0,2)}<small>${dayOffset(d).getDate()}</small></th>`).join("");
  const rows=state.family.map((n,i)=>`<tr><th scope="row">${esc(n)}</th>${JOURS.map((j,d)=>{const here=!(state.absents[n]||[]).includes(d);
      return `<td><button class="pres ${here?"in":"out"} edit-ctl" data-pres="${i}|${d}" aria-pressed="${here}" aria-label="${esc(n)} ${j} : ${here?"présent":"absent"}">${here?"✓":"–"}</button></td>`}).join("")}</tr>`).join("");
  const inv=`<tr class="inv"><th scope="row">Invités</th>${JOURS.map((j,d)=>`<td><select class="edit-ctl" data-inv="${d}" aria-label="Invités ${j}">${Array.from({length:11},(_,k)=>`<option value="${k}"${(state.invites[d]||0)===k?" selected":""}>${k?"+"+k:"0"}</option>`).join("")}</select></td>`).join("")}</tr>`;
  const tot=`<tr class="tot"><th scope="row">À table</th>${JOURS.map((j,d)=>`<td>${isOut(d)?'<small class="outsmall">Dehors</small>':`<b>${headcount(d)}</b>`}</td>`).join("")}</tr>`;
  box.innerHTML=`<h2>Qui sera à table ?</h2>
    <p>Touchez une case pour indiquer une absence. Chacun peut remplir la sienne : les quantités, les courses et le budget s'adaptent à chaque repas.</p>
    <div class="prwrap"><table class="prtable"><thead><tr><th></th>${head}</tr></thead><tbody>${rows}${inv}</tbody><tfoot>${tot}</tfoot></table></div>
    <p class="note">${totalCouverts()} couverts cette semaine${JOURS.some((_,d)=>!headcount(d))?" · les soirs sans personne n'entrent pas dans les courses":""}.</p>
    <div class="actions">
      <button class="btn primary" id="sharecal" data-tip="Envoie les soirs et les présences à la famille">Partager le calendrier</button>
      <button class="btn edit-ctl" id="allhere">Tout le monde présent</button>
    </div>
    <div class="sharebox" id="calbox"${calOpen?"":" hidden"}>
      <p class="note">Le calendrier se met à jour en direct pour toute la famille invitée sur l'application. Vous pouvez aussi envoyer le planning ou ajouter les dîners à un agenda.</p>
      <textarea class="copybox" id="calmsg" readonly aria-label="Planning des présences">${esc(planningText())}</textarea>
      <div class="actions"><button class="btn primary" id="copycal">Copier le planning</button></div>
      <div class="gcal"><span class="note">Ajouter à Google Agenda :</span>${JOURS.map((j,d)=>`<a class="chip" href="${gcalLink(d)}" target="_blank" rel="noopener">${j.slice(0,3)} ${dayOffset(d).getDate()}</a>`).join("")}</div>
    </div>`;
}
let calOpen=false;
$("presences").addEventListener("click",e=>{
  const b=e.target.closest("[data-pres]");
  if(b){ const [i,d]=b.dataset.pres.split("|").map(Number), n=state.family[i]; if(!n) return;
    const a=new Set(state.absents[n]||[]); a.has(d)?a.delete(d):a.add(d);
    state.absents={...state.absents,[n]:[...a].sort()}; if(!state.absents[n].length){ const c={...state.absents}; delete c[n]; state.absents=c; }
    save(); render(); return; }
  if(e.target.id==="allhere"){ const prevA=state.absents, prevI=[...state.invites]; state.absents={}; state.invites=[0,0,0,0,0,0,0]; save(); render();
    toast("Tout le monde est présent",()=>{state.absents=prevA; state.invites=prevI; save(); render();}); return; }
  if(e.target.id==="sharecal"){ calOpen=!calOpen; $("calbox").hidden=!calOpen; if(calOpen) $("calmsg").value=planningText(); return; }
  if(e.target.id==="copycal"){ const txt=planningText(), box=$("calmsg"); box.value=txt;
    try{ navigator.clipboard.writeText(txt).then(()=>toast("Planning copié"),()=>{box.focus();box.select();toast("Sélectionnez le texte puis copiez-le");}); }catch(err){box.focus();box.select();} }
});
$("presences").addEventListener("change",e=>{const s=e.target.closest("select[data-inv]"); if(!s) return;
  const inv=[...state.invites]; inv[+s.dataset.inv]=+s.value; state.invites=inv; save(); render();});
