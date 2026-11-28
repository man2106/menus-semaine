// ---- Deux courses par semaine ----
const STOCKABLE = ["epi","sur"];
const trip1Day = () => state.trip1==="sam" ? -2 : 0;   // samedi avant la semaine = -2
const tripOf = d => 0; // une seule course par semaine (la liste n'est plus scindée)
const tripName = t => t===0 ? (state.trip1==="sam"?"Samedi":"Lundi") : JOURS[state.trip2];
function tripDate(t){ return dayOffset(t===0 ? trip1Day() : state.trip2); }
function coursesTrips(){
  const trips=[new Map()];
  const dejaLa=new Map();
  state.week.forEach((id,d)=>headcount(d)&&BYID[id]&&BYID[id].ing.forEach(([n,q,u,ray])=>{
    if(PLACARD[n]){ const o=dejaLa.get(n)||{n,pour:new Set()}; o.pour.add(JOURS[d]); dejaLa.set(n,o); return; }
    const t=STOCKABLE.includes(ray)?0:tripOf(d), k=n+"|"+u, m=trips[t];
    if(!m.has(k)) m.set(k,{k,ck:t+"|"+k,n,u,ray,q:0,pour:new Set(),jd:new Set(),plats:new Set(),freeze:false});
    const it=m.get(k); it.q+=scale(q,d); it.pour.add(JOURS[d]); it.jd.add(d); it.plats.add(BYID[id].nom);
    const buy=t===0?trip1Day():state.trip2; if(ray==="bou"&&d-buy>=3) it.freeze=true;
  }));
  (state.extras||[]).forEach(x=>{ const t=0, k="x|"+x.id;
    trips[t].set(k,{k,ck:t+"|"+k,n:x.n,u:"",ray:RAYONS[x.ray]?x.ray:"epi",q:0,qt:x.qt||"",pour:new Set(),freeze:false,x:true,id:x.id,par:x.par||""}); });
  // anciennes cases cochées de la 2e course : reprises dans la liste unique
  trips[0].forEach(it=>{ if(state.checked["1|"+it.k]&&!state.checked[it.ck]) state.checked[it.ck]=true; });
  DEJA_LA=[...dejaLa.values()].sort((a,b)=>a.n.localeCompare(b.n,"fr"));
  return trips.map(m=>[...m.values()].sort((a,b)=>ORDRE.indexOf(a.ray)-ORDRE.indexOf(b.ray)||a.n.localeCompare(b.n,"fr")));
}
function suggestStore(items,date){
  const c={}; items.forEach(i=>promosFor(i.n).filter(p=>validOn(p,date)).forEach(p=>c[p.mag]=(c[p.mag]||0)+1));
  const best=Object.keys(c).sort((a,b)=>c[b]-c[a])[0]; return best||"colruyt";
}
// ---- Regroupement par magasin : 1 arrêt, ou 2 si le détour rapporte assez ----
function storeGain(items,date,mag){ let sav=0,n=0; items.forEach(i=>{const ps=promosFor(i.n).filter(p=>p.mag===ensOf(mag)&&validOn(p,date)); if(ps.length){n++; sav+=Math.max(...ps.map(p=>p.avant?p.avant-p.prix:0));}}); return {sav,n}; }
function planTrip(t,items){
  const date=tripDate(t);
  const allowed=orderedStores(); if(!allowed.length) allowed.push(MAGASINS[0]);
  const score=allowed.map(m=>({m:m.id,...storeGain(items,date,m.id),d:km(HOME,m),bonus:prefBonus(m.id)}));
  // gain net = économies promo − frais de route (aller-retour) + bonus de préférence
  let primary=state.storeOrder.includes(state.tripStore[t])?state.tripStore[t]:null;
  if(!primary&&state.storeMode==="fixe") primary=state.storeOrder[0];
  if(!primary){ primary=score.slice().sort((a,b)=>(b.sav-2*b.d*COUT_KM+b.bonus)-(a.sav-2*a.d*COUT_KM+a.bonus)||b.n-a.n)[0].m; }
  const P0=MAGBYID(primary);
  let secondary=null, extra=0, detour=0;
  if(state.maxStores===2){
    let best=-Infinity;
    score.filter(s=>s.m!==primary).forEach(s=>{
      const only=items.filter(i=>{const v=promosFor(i.n).filter(p=>validOn(p,date)); return v.some(p=>p.mag===ensOf(s.m))&&!v.some(p=>p.mag===ensOf(primary));});
      const g=storeGain(only,date,s.m).sav, S=MAGBYID(s.m);
      const dt=km(HOME,P0)+km(P0,S)+km(S,HOME)-2*km(HOME,P0);
      const net=g-dt*COUT_KM+s.bonus*0.5;
      if(g>0&&net>best){best=net;extra=g;detour=dt;secondary=s.m;} });
    if(!secondary||extra-detour*COUT_KM<state.seuil){secondary=null;}
  }
  const assign={};
  items.forEach(i=>{const v=promosFor(i.n).filter(p=>validOn(p,date));
    assign[i.k]= secondary && v.some(p=>p.mag===ensOf(secondary))&&!v.some(p=>p.mag===ensOf(primary)) ? secondary : primary;});
  const P=MAGBYID(primary), S=secondary?MAGBYID(secondary):null;
  const route = S ? km(HOME,P)+km(P,S)+km(S,HOME) : 2*km(HOME,P);
  const sav = storeGain(items.filter(i=>assign[i.k]===primary),date,primary).sav + (S?storeGain(items.filter(i=>assign[i.k]===secondary),date,secondary).sav:0);
  // meilleur second arrêt possible, même s'il n'est pas retenu (pour l'expliquer)
  return {primary,secondary,assign,route,sav,extra,detour,date};
}
function tripStore(t,items){ return planTrip(t,items).primary; }
const kmTxt = v => nf.format(Math.round(v*10)/10)+" km";
function renderPlan(trips){
  const plans=trips.map((items,t)=>planTrip(t,items));
  const totKm=plans.reduce((s,p)=>s+p.route,0), totSav=plans.reduce((s,p)=>s+p.sav,0);
  const stops=plans.reduce((s,p)=>s+(p.secondary?2:1),0);
  $("plan").innerHTML=`<h2>Plan de déplacement</h2>
    <div class="planstats"><span><b>${stops}</b> arrêt${stops>1?"s":""} en magasin</span><span><b>≈ ${kmTxt(totKm)}</b> aller-retour au total</span><span><b>${eur(totSav)}</b> d'économies promo connues</span></div>
    ${plans.map((p,t)=>`<div class="route"><div class="rt">Courses de la semaine · ${fmtD(p.date)}</div>
      <div class="rpath"><span class="rhome">Maison</span><span class="rarrow">→</span><span class="rstop">${MAGNOM[p.primary]}</span>${p.secondary?`<span class="rarrow">→</span><span class="rstop alt">${MAGNOM[p.secondary]}</span>`:""}<span class="rarrow">→</span><span class="rhome">Maison</span></div>
      <small>≈ ${kmTxt(p.route)} (≈ ${eur(p.route*COUT_KM)} de route) · ${p.secondary?`le 2e arrêt rapporte ${eur(p.extra)} pour ${kmTxt(p.detour)} de détour`: (state.maxStores===2 && p.extra>0 ? `un 2e arrêt rapporterait ${eur(p.extra)} pour ${kmTxt(p.detour)} de détour : pas rentable selon votre seuil` : "tout dans un seul magasin")}</small></div>`).join("")}
    <div class="planopts">
      <label>Arrêts par course <select id="maxstores" class="pick"><option value="1"${state.maxStores===1?" selected":""}>1 magasin seulement</option><option value="2"${state.maxStores===2?" selected":""}>Jusqu'à 2 magasins</option></select></label>
      <label${state.maxStores===2?"":" hidden"}>2e arrêt si le gain net atteint <select id="seuil" class="pick">${[1,2,3,5].map(v=>`<option value="${v}"${state.seuil===v?" selected":""}>${eur(v)}</option>`).join("")}</select></label>
    </div>
    <p class="note">Le magasin est choisi pour le meilleur gain net : économies des promos moins les frais de route (estimés à ${eur(COUT_KM)} par km). Distances estimées depuis ${esc(HOME.nom)}. Seules les promos dont l'ancien prix est connu sont chiffrées.</p>`;
  $("plansum").innerHTML=`<span class="sumtitle">Trajet</span><span class="sumval">${plans.map(p=>MAGNOM[p.primary]+(p.secondary?" + "+MAGNOM[p.secondary]:"")).join(" puis ")} · ≈ ${kmTxt(totKm)}</span>`;
  return plans;
}
let tripVue=null; // course affichée sur téléphone (une à la fois)
const tripAuto=()=>0;
function renderCourses(){ try{ renderManquants(); }catch(e){}

  const trips=coursesTrips(); let done=0, total=0;
  if(tripVue===null) tripVue=tripAuto();
  const tdone=trips.map(items=>items.filter(i=>state.checked[i.ck]).length);
  const plans=renderPlan(trips);
  $("aisles").innerHTML=trips.map((items,t)=>{
    const plan=plans[t], store=plan.primary, date=plan.date;
    const days=JOURS.filter((_,d)=>tripOf(d)===t);
    const cover=`Tous les repas de la semaine, du ${days[0].toLowerCase()} au ${days[days.length-1].toLowerCase()}`;
    const stopsHtml=[plan.primary,plan.secondary].filter(Boolean).map((mag,si)=>{
      const sitems=items.filter(i=>plan.assign[i.k]===mag); if(!sitems.length) return "";
      const m=MAGBYID(mag), nP=sitems.filter(i=>promosFor(i.n).some(p=>p.mag===ensOf(mag)&&validOn(p,date))).length;
    const groups=ORDRE.map(ray=>{const its=sitems.filter(i=>i.ray===ray).sort((a,b)=>(!!state.checked[a.ck])-(!!state.checked[b.ck])); if(!its.length) return "";
      const rows=its.map(i=>{const c=!!state.checked[i.ck]; total++; if(c) done++;
        const tags=promosFor(i.n).map(p=>{const ok=validOn(p,date);
          const when= ok ? `jusqu'au ${fmtShort(isoDate(p.au))}` : (isoDate(p.du)>date ? `dès le ${fmtShort(isoDate(p.du))}, pas encore valable ce jour-là` : `terminée le ${fmtShort(isoDate(p.au))}`);
          return `<span class="ptag${ok&&p.mag===ensOf(mag)?"":" off"}">· Promo ${ENS[p.mag]} ${eur(p.prix)} ${when}</span>`}).join("");
        return `<label class="item${c?" checked":""}"><input type="checkbox" data-k="${esc(i.ck)}"${c?" checked":""}><span class="iname${produitDe(i.n)?" has-p":""}">${vignetteProduit(i.n)}<b>${esc(i.n)}</b><small>${i.x?(i.par?"Ajouté par "+esc(nomDe(i.par)):"Ajouté à la main"):[...i.pour].join(", ")}${i.freeze?'<span class="ptag" style="color:var(--accent)">· à congeler à l\'achat</span>':""}${tags}</small></span><span class="qty"><button type="button" class="qtbtn" data-qedit="${esc(i.k)}" aria-label="Changer la quantité de ${esc(i.n)}" data-tip="Changer la quantité"><span class="qtv">${esc(qtyOf(i))||"Quantité"}<i class="qtpen" aria-hidden="true">✎</i></span>${state.qtEdit&&state.qtEdit[i.k]&&!i.x?`<s>${esc(fmt(i.q,i.u))}</s>`:""}</button>${i.x?`<button type="button" class="xdel edit-only" data-xdel="${esc(i.id)}" aria-label="Retirer ${esc(i.n)} de la liste">×</button>`:`<button type="button" class="dejabtn edit-only" data-deja="${esc(i.n)}" aria-label="J'en ai déjà : ${esc(i.n)}" data-tip="J'en ai déjà à la maison : ne plus le mettre sur la liste">🏠</button>`}</span></label>`}).join("");
      return `<div class="aisle"><h2><span>${RAYONS[ray]}</span><span>${its.length}</span></h2><div class="list">${rows}</div></div>`}).join("");
      return `<div class="stop"><div class="stophead"><span class="stopno">Arrêt ${si+1}</span><b>${esc(m.nom)}</b><small>${esc(m.lieu)} · ${sitems.length} article${sitems.length>1?"s":""}${nP?` · ${nP} en promo`:""} · ≈ ${eur(sitems.reduce((s,i)=>s+itemCost(i.n,i.u,i.q,i.ray),0))}</small></div>${groups}</div>`}).join("");
    return `<div class="trip${t===tripVue?" on":""}" id="trip-${t}"><div class="triphead"><div><div class="tripno">Courses de la semaine · ${fmtD(date)}</div><p class="note">${cover}</p></div>
      <button class="btn primary" data-shop="${t}" data-tip="Liste plein écran, rayon par rayon : cochez en avançant dans le magasin">Mode magasin</button>
      <label class="tripstore">Magasin principal <select data-store="${t}" aria-label="Magasin principal"><option value="">Automatique</option>${orderedStores().map(m=>`<option value="${m.id}"${m.id===state.tripStore[t]?" selected":""}>${m.nom} · ${kmTxt(km(HOME,m))}</option>`).join("")}</select></label></div>
      <p class="note">${items.length} articles · ≈ ${eur(items.reduce((s,i)=>s+itemCost(i.n,i.u,i.q,i.ray),0))} (gamme ${GAMMES[state.gamme].nom.toLowerCase()}) · trajet ≈ ${kmTxt(plan.route)}</p>${stopsHtml}</div>`}).join("");
  $("tripsel").innerHTML=(`${trips.map((items,t)=>`<button role="tab" data-tripvue="${t}" aria-selected="${t===tripVue}"><b>Course ${t+1}</b><small>${fmtShort(tripDate(t))} · ${tdone[t]}/${items.length}</small></button>`).join("")}`);
  $("ptext").textContent=`${done} sur ${total} dans le caddie`;
  if(typeof renderHabituels==="function"){ renderHabituels(); renderDejaLa(); renderTicket(); }
  if(typeof renderApTrip==="function") renderApTrip();
  $("pbar").style.width=(total?done/total*100:0)+"%";
  $("ccount").textContent=total-done?String(total-done):"";
  renderNext();
}

// ---- Prix de revient (estimations) ----
// Prix indicatifs en marque distributeur : [prix, unité] avec unité kg, L ou u (pièce)
const PRIX = {...BASE.prix};   // prix de référence : donnees/recettes-base.json (complétés plus tard par les tickets et recettes.json)
const GAMMES = {
 eco:{nom:"Économique",m:{fl:1,bou:1,cre:1,bl:1,epi:1,sur:1},desc:"Marques distributeur et premiers prix.",ou:"Lidl, Aldi, Colruyt"},
 equi:{nom:"Équilibré",m:{fl:1.2,bou:1.35,cre:1.25,bl:1.3,epi:1.15,sur:1.2},desc:"Épicerie en marque distributeur, viande de boucherie, œufs de plein air, légumes de saison.",ou:"Colruyt + boucher ou marché"},
 qual:{nom:"Qualité",m:{fl:1.7,bou:2,cre:1.7,bl:1.6,epi:1.6,sur:1.5},desc:"Bio ou labels : viande belge labellisée, œufs bio, légumes bio, grandes marques.",ou:"Delhaize, Carrefour, magasin bio"}
};
function promoFactor(n){ const ps=promosFor(n).filter(p=>p.avant); return ps.length? Math.min(...ps.map(p=>p.prix/p.avant)) : 1; }
function itemCost(n,u,q,ray,g){ const p=PRIX[n]; if(!p) return 0; const gm=GAMMES[g||state.gamme].m[ray]||1;
  const qty = u==="g"? q/1000 : u==="cl"? q/100 : q; return p[0]*qty*gm*promoFactor(n); }
function recipeCost(r,g,d){ return r.ing.reduce((s,[n,q,u,ray])=>s+itemCost(n,u,scale(q,d),ray,g),0) + (r.prix? r.prix*headcount(d)/5*GAMMES[g||state.gamme].m.epi : 0); }
function weekCost(g){ return state.week.reduce((s,id,d)=>s+(BYID[id]?recipeCost(BYID[id],g,d):0),0); }
function renderMix(){ const home=[0,1,2,3,4,5,6].filter(d=>!isOut(d)), q=mixFor(home.length), now={eco:0,moyen:0,plaisir:0}, P={}, F={};
  home.forEach(d=>{ const r=BYID[state.week[d]]; if(!r) return; now[budgetOf(r)]++; if(r.p) P[r.p]=(P[r.p]||0)+1; if(r.f) F[r.f]=(F[r.f]||0)+1; });
  const step=(k,v,max)=>`<span class="mixstep"><button class="sbtn edit-only" data-mix="${k}" data-dv="-1" ${v<=0?"disabled":""} aria-label="Un de moins">−</button><b>${v}</b><button class="sbtn edit-only" data-mix="${k}" data-dv="1" ${max<=0?"disabled":""} aria-label="Un de plus">+</button></span>`;
  const libre=home.length-q.plaisir-q.moyen;
  return `<h3 class="shopray">Répartition des repas de la semaine</h3>
    <p class="note">Les nouvelles propositions suivent cette règle, pour ${home.length} soirs à la maison. Elle vaut pour toute la famille.</p>
    <div class="mixgrid">
      <div class="mixrow b-eco"><span><b>${BUDGETS.eco.nom}</b><small>${BUDGETS.eco.desc}</small></span><span class="mixstep"><b>${q.eco}</b><small>le reste</small></span><span class="mixnow">${now.eco} cette semaine</span></div>
      <div class="mixrow b-moyen"><span><b>${BUDGETS.moyen.nom}</b><small>${BUDGETS.moyen.desc}</small></span>${step("moyen",q.moyen,libre)}<span class="mixnow">${now.moyen} cette semaine</span></div>
      <div class="mixrow b-plaisir"><span><b>${BUDGETS.plaisir.nom}</b><small>${BUDGETS.plaisir.desc}</small></span>${step("plaisir",q.plaisir,libre)}<span class="mixnow">${now.plaisir} cette semaine</span></div>
    </div>
    <p class="note">Variété de la semaine : ${Object.entries(P).map(([k,v])=>`${v} ${PROT[k]||k}`).join(", ")||"–"} · ${Object.entries(F).map(([k,v])=>`${v} ${FECU[k]||k}`).join(", ")||"–"}.
      Règles : pas plus de 2 fois la même viande ni le même féculent, jamais deux soirs de suite, du poisson et un repas sans viande quand c'est possible, et pas les plats des deux dernières semaines.</p>
    <div class="actions"><button class="btn edit-only" id="mixpropose">Proposer un menu avec cette répartition</button></div>`; }
function renderBudget(){
  const couverts=totalCouverts()||1, per=v=>eur(v/couverts);
  const g=GAMMES[state.gamme], w=weekCost(state.gamme);
  const sorted=state.week.map((id,d)=>BYID[id]?({d,r:BYID[id],c:recipeCost(BYID[id],state.gamme)/state.persons}):null).filter(Boolean).sort((a,b)=>a.c-b.c);
  $("budget").innerHTML=`<h2>Prix de revient de la semaine</h2>
    <div class="bigcost"><span>${eur(w)}</span><small>soit ${per(w)} par personne et par repas · ${totalCouverts()} couverts dans la semaine · gamme ${g.nom.toLowerCase()}</small></div>
    <div class="gammes" role="radiogroup" aria-label="Gamme de produits">${Object.entries(GAMMES).map(([k,x])=>{const c=weekCost(k);
      return `<button class="gamme" role="radio" aria-checked="${k===state.gamme}" data-gamme="${k}"><b>${x.nom}</b><span class="gc">${eur(c)}</span><small>${per(c)} / pers. / repas</small><small class="gd">${x.desc}</small><small class="gd">Où : ${x.ou}</small></button>`}).join("")}</div>
    ${renderMix()}
    ${sorted.length?`<p class="note">Le plus économique cette semaine : ${sorted[0].r.nom.toLowerCase()} (${eur(sorted[0].c)} par personne). Le plus cher : ${sorted[sorted.length-1].r.nom.toLowerCase()} (${eur(sorted[sorted.length-1].c)} par personne).</p>`:""}
    <p class="note">Estimation à partir de prix indicatifs, promos de la semaine déduites. Les ingrédients sont comptés à la quantité utilisée, pas au paquet entier.</p>`;
  const absN=Object.values(state.absents).reduce((s,a)=>s+a.length,0);
  $("budgetsum").innerHTML=`<span class="sumtitle">Budget</span><span class="sumval">≈ ${eur(w)} · ${per(w)} par repas · ${totalCouverts()} couverts${absN?` · ${absN} absence${absN>1?"s":""}`:""}</span>`;
}

// ---- Onglet Recettes : recherche, filtres, liste complète ----
let recQ="", recFiltre="toutes", recNouveau=null;
function renderRecettes(){ const box=$("recipes"); if(!box) return;
  const tout=[...RECETTES].sort((x,y)=>(y.perso?1:0)-(x.perso?1:0)||x.nom.localeCompare(y.nom,"fr")), fam=tout.filter(r=>r.perso).length;
  const k=norm(recQ); let list=tout; if(recFiltre==="famille") list=list.filter(r=>r.perso); if(k) list=list.filter(r=>norm(r.nom).includes(k));
  const f=$("recfilters"); if(f) f.innerHTML=`<button class="chip${recFiltre==="toutes"?" on":""}" type="button" data-recf="toutes" aria-pressed="${recFiltre==="toutes"}">Toutes (${tout.length})</button><button class="chip${recFiltre==="famille"?" on":""}" type="button" data-recf="famille" aria-pressed="${recFiltre==="famille"}">De la famille (${fam})</button>`;
  const c=$("reccount"); if(c) c.textContent=list.length===tout.length?`${tout.length} recettes. Touchez une recette pour la voir.`:`${list.length} recette${list.length>1?"s":""} sur ${tout.length}.`;
  box.innerHTML=list.length?list.map(r=>{const days=state.week.map((id,d)=>id===r.id?JOURS[d].slice(0,3):null).filter(Boolean), lk=likeScore(r);
    return `<button class="rrow${recNouveau===r.id?" nouvelle":""}" data-openrec="${r.id}"><img class="rthumb" src="${photoSrc(r.id)}" alt="" loading="lazy" decoding="async"><span class="rinfo"><span class="rtitle">${esc(r.nom)}</span>
      <span class="rmeta">${r.t} min${r.perso?" · recette de famille":""}${lk>0?` · aimé par ${lk}`:""}${days.length?` · au menu ${days.join(", ")}`:""}</span></span><span class="dchev" aria-hidden="true">›</span></button>`}).join("")
    :`<p class="note">${k?"Aucune recette ne correspond à cette recherche.":"Aucune recette de la famille pour l'instant : touchez « Nouvelle recette » pour ajouter la première."}</p>`;
}
// Après un enregistrement : la nouvelle recette reste en évidence dans la liste
function montrerRecette(id){ recNouveau=id; recQ=""; recFiltre="toutes"; const q=$("recq"); if(q) q.value=""; renderRecettes();
  requestAnimationFrame(()=>{ const el=document.querySelector('#recipes [data-openrec="'+id+'"]'); if(el){ el.scrollIntoView({block:"center",behavior:"smooth"}); el.classList.remove("flash"); void el.offsetWidth; el.classList.add("flash"); } });
  setTimeout(()=>{ if(recNouveau===id){ recNouveau=null; const el=document.querySelector('#recipes [data-openrec="'+id+'"]'); if(el) el.classList.remove("nouvelle"); } },8000); }
document.addEventListener("input",e=>{ if(e.target.id==="recq"){ recQ=e.target.value; renderRecettes(); } });
document.addEventListener("click",e=>{ const f=e.target.closest("[data-recf]"); if(f){ recFiltre=f.dataset.recf; renderRecettes(); } });

