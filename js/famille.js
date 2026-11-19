// ===================== Retours sur les repas et bilan =====================
// Échelle à 5 visages (échelle hédonique utilisée pour les enfants et les cantines),
// « à refaire ? » et quelques mots à cocher pour savoir quoi corriger.
const NOTES=[[1,"😖","Pas aimé du tout"],[2,"😕","Pas trop"],[3,"😐","Moyen"],[4,"🙂","Bon"],[5,"😋","Délicieux"]];
const REFAIRE=[["oui","À refaire"],["peut","Pourquoi pas"],["non","Plus jamais"]];
const MOTS=["Parfait comme ça","Trop salé","Fade","Trop épicé","Trop gras","Pas assez cuit","Trop cuit","Portion trop petite","Trop de restes","Trop long à faire"];
let RETOURS={}, SEMAINES={}, unsubRetours=null, unsubSemaines=null;
try{ const loc=JSON.parse(localStorage.getItem(KEY+"-retours")||"{}"); if(loc&&typeof loc==="object") RETOURS=loc; }catch(e){}
function saveRetoursLocal(){ try{ localStorage.setItem(KEY+"-retours",JSON.stringify(RETOURS)); }catch(e){} }
const slugNom = n => norm(n).replace(/ /g,"-").slice(0,30)||"x";
const retourId = (iso,d,n) => `${iso}_${d}_${slugNom(n)}`;
function cleanRetour(r){ if(!r||typeof r!=="object") return null; const note=+r.note; if(!(note>=1&&note<=5)) return null;
  if(typeof r.plat!=="string"||typeof r.semaine!=="string"||!/^\d{4}-\d\d-\d\d$/.test(r.semaine)) return null;
  return {semaine:r.semaine,jour:Math.max(0,Math.min(6,+r.jour||0)),plat:r.plat,nom:propre(r.nom,30),note:Math.round(note),
    refaire:["oui","peut","non"].includes(r.refaire)?r.refaire:null,mots:Array.isArray(r.mots)?r.mots.filter(m=>MOTS.includes(m)).slice(0,6):[],
    com:propre(r.com,200),quand:typeof r.quand==="string"?r.quand.slice(0,40):null,cuisinier:propre(r.cuisinier,30)||null}; }
function subscribeRetours(){ if(!DB) return; if(unsubRetours) unsubRetours();
  unsubRetours=DB.collection("retours").onSnapshot(q=>{ let ch=false;
    q.docChanges().forEach(c=>{ if(c.type==="removed"){ delete RETOURS[c.doc.id]; ch=true; return; } const r=cleanRetour(c.doc.data()); if(r){ RETOURS[c.doc.id]=r; ch=true; } });
    // Les avis supprimés dans la base disparaissent aussi du cache local de cet appareil
    if(q.docs){ const vivants=new Set(q.docs.map(d=>d.id)); Object.keys(RETOURS).forEach(k=>{ if(!vivants.has(k)){ delete RETOURS[k]; ch=true; } }); }
    if(ch){ saveRetoursLocal(); renderRetours(); if(sheetCtx&&(sheetCtx.type==="bilan"||sheetCtx.type==="retour")) renderSheet(); } },()=>{});
  // toutes les semaines partagées, pour retrouver les repas déjà mangés
  if(unsubSemaines) unsubSemaines();
  unsubSemaines=DB.collection("semaines").onSnapshot(q=>{ q.docChanges().forEach(c=>{ if(c.type==="removed") delete SEMAINES[c.doc.id]; else SEMAINES[c.doc.id]=c.doc.data(); }); renderRetours(); },()=>{});
}
// Repas déjà servis ces 14 derniers jours (le soir même à partir de 19 h)
function repasPasses(jours=14){
  const src={...state.weeks, ...SEMAINES}; src[curIso()]={...(src[curIso()]||{}),menu:state.week,cuisiniers:state.cooks,absents:state.absents,exterieur:state.exterieur};
  const now=new Date(), lim=new Date(TODAY); lim.setDate(lim.getDate()-jours); const out=[];
  Object.entries(src).forEach(([iso,w])=>{ if(!/^\d{4}-\d\d-\d\d$/.test(iso)||!w||!Array.isArray(w.menu)) return; const mon=isoDate(iso);
    const ext=outList(cleanDays(w.exterieur)); const cooks=Array.isArray(w.cuisiniers)?w.cuisiniers:(Array.isArray(w.cooks)?w.cooks:[]);
    w.menu.forEach((plat,d)=>{ if(!BYID[plat]||ext.includes(d)) return; const date=new Date(mon); date.setDate(mon.getDate()+d);
      if(date<lim) return; const soir=new Date(date); soir.setHours(19,0,0,0); if(soir>now) return;
      const abs=w.absents&&typeof w.absents==="object"?w.absents:{}; const pres=state.family.filter(n=>!(Array.isArray(abs[n])&&abs[n].includes(d)));
      out.push({iso,d,date,plat,pres,cuisinier:cooks[d]||null}); }); });
  return out.sort((a,b)=>b.date-a.date);
}
const retoursDu = (iso,d) => Object.values(RETOURS).filter(r=>r.semaine===iso&&r.jour===d);
// Chacun ne note que pour lui-même. Le propriétaire peut noter pour tout le monde.
function peutNoter(n){ const a=(typeof window.__acces==="function"&&window.__acces())||{}; return !!a.nom && n===a.nom; }
async function enregistrerRetour(iso,d,nom,patch){
  if(!peutNoter(nom)){ toast("Vous ne notez que pour vous"); return; }
  const id=retourId(iso,d,nom), rp=repasPasses(21).find(x=>x.iso===iso&&x.d===d); if(!rp) return;
  const prev=RETOURS[id]||{semaine:iso,jour:d,plat:rp.plat,nom,note:null,refaire:null,mots:[],com:""};
  const next={...prev,...patch,plat:rp.plat,nom,cuisinier:rp.cuisinier,quand:new Date().toISOString(),par:ME||null};
  if(!next.note){ RETOURS[id]=next; renderSheet(); return; } // on attend la note avant d'enregistrer
  RETOURS[id]=cleanRetour(next); saveRetoursLocal(); renderRetours(); renderSheet();
  if(DB){ try{ await DB.collection("retours").doc(id).set({...cleanRetour(next),par:ME||null}); }catch(e){ toast("L'avis n'a pas pu être partagé, il reste sur cet appareil"); } }
}
// ---- Calculs du bilan ----
const moy = a => a.length? a.reduce((s,x)=>s+x,0)/a.length : null;
const ecart = a => { if(a.length<2) return 0; const m=moy(a); return Math.sqrt(moy(a.map(x=>(x-m)**2))); };
const n1 = v => v==null?"–":v.toLocaleString("fr-BE",{minimumFractionDigits:1,maximumFractionDigits:1});
function analyse(){
  const all=Object.values(RETOURS).filter(r=>r&&r.note&&BYID[r.plat]); const G=moy(all.map(r=>r.note))||3.5, K=2;
  const parPlat={}; all.forEach(r=>{ (parPlat[r.plat]=parPlat[r.plat]||[]).push(r); });
  const plats=Object.entries(parPlat).map(([id,l])=>{ const notes=l.map(r=>r.note), n=notes.length, m=moy(notes);
    const servi=new Set(l.map(r=>r.semaine+"-"+r.jour)).size, ref=l.filter(r=>r.refaire), oui=ref.filter(r=>r.refaire==="oui").length, non=ref.filter(r=>r.refaire==="non").length;
    const mots={}; l.forEach(r=>r.mots.forEach(w=>{ if(w!=="Parfait comme ça") mots[w]=(mots[w]||0)+1; }));
    const topMots=Object.entries(mots).sort((a,b)=>b[1]-a[1]).filter(([,c])=>c>=2||n<=3).slice(0,2).map(([w])=>w);
    const score=(n*m+K*G)/(n+K); // moyenne « prudente » : un seul avis ne suffit pas à classer un plat
    let cout=null; try{ const r=BYID[id]; const x=recipeCost(r,state.gamme,null)/Math.max(1,state.family.length||5); cout=isFinite(x)&&x>0?x:null; }catch(e){}
    return {id,nom:BYID[id].nom,n,m,score,servi,oui,non,refTot:ref.length,ecart:ecart(notes),topMots,cout,l}; });
  plats.forEach(p=>{ p.cat = p.n<2 ? "tot" : (p.ecart>=1.3&&p.n>=3) ? "divise" : p.score>=3.9 ? "sur" : p.score<=2.6 ? (p.servi<3?"retester":"retirer") : "ameliorer"; });
  const semaines={}; all.forEach(r=>{ (semaines[r.semaine]=semaines[r.semaine]||[]).push(r.note); });
  const tendance=Object.keys(semaines).sort().slice(-8).map(k=>({iso:k,m:moy(semaines[k]),n:semaines[k].length}));
  const passes=repasPasses(28), attendus=passes.reduce((s,p)=>s+p.pres.length,0), recus=passes.reduce((s,p)=>s+retoursDu(p.iso,p.d).filter(r=>r.note).length,0);
  const personnes=state.family.map(n=>{ const l=all.filter(r=>r.nom===n); const byP={}; l.forEach(r=>{ (byP[r.plat]=byP[r.plat]||[]).push(r.note); });
    const pl=Object.entries(byP).map(([id,v])=>({id,m:moy(v)})).sort((a,b)=>b.m-a.m);
    const mots={}; l.forEach(r=>r.mots.forEach(w=>{ mots[w]=(mots[w]||0)+1; }));
    const att=passes.filter(p=>p.pres.includes(n)).length, rec=passes.filter(p=>p.pres.includes(n)&&RETOURS[retourId(p.iso,p.d,n)]&&RETOURS[retourId(p.iso,p.d,n)].note).length;
    return {n,count:l.length,m:moy(l.map(r=>r.note)),top:pl.filter(x=>x.m>=4).slice(0,2),bas:pl.filter(x=>x.m<=2).slice(-2).reverse(),mot:Object.entries(mots).sort((a,b)=>b[1]-a[1])[0],part:att?rec/att:null}; });
  const coms=all.filter(r=>r.com).sort((a,b)=>String(b.quand).localeCompare(String(a.quand))).slice(0,6);
  const refTot=all.filter(r=>r.refaire), pctOui=refTot.length?refTot.filter(r=>r.refaire==="oui").length/refTot.length:null;
  return {all,G,plats,tendance,part:attendus?recus/attendus:null,recus,attendus,personnes,coms,pctOui};
}
// ---- Hit-parade : chaque avis compte comme un vote ----
function classement(avant){ const lim=avant?Date.now()-7*864e5:Infinity;
  const all=Object.values(RETOURS).filter(r=>r&&r.note&&BYID[r.plat]&&(!avant||(r.quand&&new Date(r.quand).getTime()<lim)));
  if(!all.length) return []; const G=moy(all.map(r=>r.note)), K=2, by={};
  all.forEach(r=>{ (by[r.plat]=by[r.plat]||[]).push(r); });
  return Object.entries(by).map(([id,l])=>{ const m=moy(l.map(r=>r.note)), ref=l.filter(r=>r.refaire);
    return {id,nom:BYID[id].nom,votes:l.length,m,score:(l.length*m+K*G)/(l.length+K),fans:[...new Set(l.filter(r=>r.note>=4).map(r=>r.nom))],
      pctOui:ref.length?ref.filter(r=>r.refaire==="oui").length/ref.length:null}; })
    .sort((a,b)=>b.score-a.score||b.votes-a.votes).map((x,i)=>({...x,rang:i+1}));
}
function hitParade(max=10){ const now=classement(false), prev=classement(true), pr={}; prev.forEach(x=>{ pr[x.id]=x.rang; });
  return now.slice(0,max).map(x=>({...x,avant:pr[x.id]||null})); }
function htmlHitParade(l,compact){ const med=["🥇","🥈","🥉"], aHisto=l.some(x=>x.avant!=null);
  return `<ol class="hp${compact?" compact":""}">${l.map(x=>{ const mv=!aHisto?"":x.avant==null?`<span class="hpmv new">nouveau</span>`:x.avant>x.rang?`<span class="hpmv up" title="${x.avant-x.rang} place${x.avant-x.rang>1?"s":""} gagnée${x.avant-x.rang>1?"s":""}">▲ ${x.avant-x.rang}</span>`:x.avant<x.rang?`<span class="hpmv down" title="${x.rang-x.avant} place${x.rang-x.avant>1?"s":""} perdue${x.rang-x.avant>1?"s":""}">▼ ${x.rang-x.avant}</span>`:`<span class="hpmv same" title="Même place que la semaine dernière">=</span>`;
    return `<li class="hprow"><span class="hprank">${x.rang<=3?med[x.rang-1]:x.rang}</span>${compact?"":`<img src="${photoSrc(x.id)}" alt="" data-cache-err="1" decoding="async" loading="lazy">`}<span class="hpinfo"><b>${esc(x.nom)}</b><small>${n1(x.m)}/5 · ${x.votes} vote${x.votes>1?"s":""}${!compact&&x.pctOui!=null?` · ${Math.round(x.pctOui*100)} % à refaire`:""}${!compact&&x.fans.length?` · fans : ${x.fans.map(esc).join(", ")}`:""}</small></span>${mv}</li>`; }).join("")}</ol>`; }
// Influence sur les propositions de menus : bonus aux valeurs sûres, pause d'un mois pour les plats à retirer
function bonusRetours(r){ const l=Object.values(RETOURS).filter(x=>x.plat===r.id&&x.note); if(!l.length) return 0;
  const G=3.5, K=2, s=(l.length*moy(l.map(x=>x.note))+K*G)/(l.length+K);
  const dernier=l.map(x=>x.quand).sort().pop(), recent=dernier&&(Date.now()-new Date(dernier))<28*864e5;
  if(s<=2.6&&l.length>=2&&recent) return -4; return (s-3.5)*0.9; }
// ---- Affichage : invitation à noter (onglet Menu) et résumé (onglet Famille) ----
function renderRetours(){
  const box=$("retoursbox"), fam=$("retoursfam"); if(!box||!fam) return;
  const passes=repasPasses(4).filter(p=>p.pres.length), aNoter=passes.filter(p=>retoursDu(p.iso,p.d).filter(r=>r.note).length<p.pres.length).slice(0,3);
  if(!state.family.length){ box.hidden=true; }
  else if(!aNoter.length){ box.hidden=false; box.innerHTML=`<div class="rthead"><h2>🔔 Rappel : notez les repas</h2></div><p class="note">Rien à noter pour l'instant. Le repas du soir se note à partir de 19 h, après le souper.</p><div class="actions"><button class="btn" data-retourslist="1">Noter un repas</button></div>`; }
  else { box.hidden=false; box.innerHTML=`<div class="rthead"><h2>🔔 Rappel : notez les repas</h2><span class="note">Une note suffit. Un mot facultatif peut suivre pour le cuisinier : les plats aimés reviendront plus souvent.</span></div>
    <div class="rtlist">${aNoter.map(p=>{ const nb=retoursDu(p.iso,p.d).filter(r=>r.note).length;
      return `<button class="rtitem" data-retour="${p.iso}|${p.d}"><img src="${photoSrc(p.plat)}" alt="" data-cache-err="1" decoding="async" loading="lazy"><span><small>${JOURS[(p.date.getDay()+6)%7]} ${fmtShort(p.date)}</small><b>${esc(BYID[p.plat].nom)}</b><small>${nb?`${nb} avis sur ${p.pres.length}`:"Pas encore noté"}</small></span><span class="rtgo">Noter</span></button>`; }).join("")}</div>`; }
  const A=analyse();
  fam.innerHTML=`<div class="phead"><h2>Retours sur les repas</h2><button class="btn primary" data-bilan="1" data-tip="Classement des plats, goûts de chacun et conseils tirés des avis">Voir le bilan</button></div>
    ${A.all.length?`<div class="rtkpis"><div><b>${n1(A.G)}</b><small>note moyenne sur 5</small></div><div><b>${A.all.length}</b><small>avis donnés</small></div><div><b>${A.part==null?"–":Math.round(A.part*100)+" %"}</b><small>de participation (4 semaines)</small></div></div>`
      :`<p>Après chaque souper, chacun note le plat en un geste. Le bilan montre les valeurs sûres, les plats à ajuster et ceux qui divisent la famille.</p>`}
    ${A.all.length?`<h3 class="shopray">Le podium</h3>${htmlHitParade(hitParade(3),true)}`:""}
    <div class="actions"><button class="btn" data-retourslist="1">Noter un repas</button></div>`;
}
// ---- Fenêtre : noter un repas ----
function renderRetourSheet(){ const c=sheetCtx;
  if(c.list){ const l=repasPasses(14);
    $("seyebrow").textContent="Retours"; $("stitle").textContent="Noter un repas"; $("sextra").innerHTML="";
    $("sbody").innerHTML=l.length?`<div class="rtlist">${l.map(p=>{ const nb=retoursDu(p.iso,p.d).filter(r=>r.note).length;
      return `<button class="rtitem" data-retour="${p.iso}|${p.d}"><img src="${photoSrc(p.plat)}" alt="" data-cache-err="1" decoding="async" loading="lazy"><span><small>${JOURS[(p.date.getDay()+6)%7]} ${fmtShort(p.date)}</small><b>${esc(BYID[p.plat].nom)}</b><small>${nb?`${nb} avis sur ${p.pres.length}`:"Pas encore noté"}</small></span><span class="rtgo">${nb>=p.pres.length?"Voir":"Noter"}</span></button>`; }).join("")}</div>`
      :`<p class="note">Aucun repas des deux dernières semaines pour l'instant. Les repas apparaissent ici le soir même, à partir de 19 h.</p>`;
    $("sfoot").innerHTML=`<button class="btn" data-bilan="1">Voir le bilan</button>`; return; }
  const p=repasPasses(21).find(x=>x.iso===c.iso&&x.d===c.d); if(!p){ closeSheet(); return; }
  const r=BYID[p.plat];
  $("seyebrow").textContent=`${JOURS[(p.date.getDay()+6)%7]} ${fmtShort(p.date)}`; $("stitle").textContent=r.nom; $("sextra").innerHTML="";
  $("sbody").innerHTML=`<p class="note">Chacun note pour lui, sur son téléphone ou ici. Une seule note suffit, le reste est facultatif.</p>
    ${p.pres.map(n=>{ const v=RETOURS[retourId(p.iso,p.d,n)]||{}, o=c.open===n||(!v.note&&!c.open);
      if(!peutNoter(n)) return `<section class="rtperson${v.note?" done":""}"><div class="rtname"><b>${esc(n)}</b>${v.note?`<span>${NOTES[v.note-1][1]} ${NOTES[v.note-1][2]}${v.refaire?" · "+REFAIRE.find(x=>x[0]===v.refaire)[1]:""}</span>`:"<span>Pas encore noté</span>"}</div>${v.com?`<p class="note">« ${esc(v.com)} »</p>`:""}<p class="note">Seule cette personne peut noter pour elle-même.</p></section>`;
      return `<section class="rtperson${v.note?" done":""}">
        <div class="rtname"><b>${esc(n)}</b>${v.note?`<span>${NOTES[v.note-1][1]} ${NOTES[v.note-1][2]}${v.refaire?" · "+REFAIRE.find(x=>x[0]===v.refaire)[1]:""}</span>`:""}</div>
        <div class="rtfaces" role="group" aria-label="Note de ${esc(n)}">${NOTES.map(([k,e,l])=>`<button class="rtface${v.note===k?" on":""}" data-rnote="${k}" data-rn="${esc(n)}" aria-label="${l}" title="${l}"><span>${e}</span><small>${l}</small></button>`).join("")}</div>
        ${v.note?`<div class="rtmore"${o||c.open===n?"":""}>
          <div class="gfilters">${REFAIRE.map(([k,l])=>`<button class="chip${v.refaire===k?" on":""}" data-rref="${k}" data-rn="${esc(n)}">${l}</button>`).join("")}</div>
          <div class="gfilters wrapchips">${MOTS.map(w=>`<button class="chip${(v.mots||[]).includes(w)?" on":""}" data-rmot="${esc(w)}" data-rn="${esc(n)}">${w}</button>`).join("")}</div>
          <div class="addrow"><input type="text" maxlength="200" data-rcom="${esc(n)}" value="${esc(v.com||"")}" placeholder="Un mot pour le cuisinier (facultatif)" aria-label="Commentaire de ${esc(n)}"><button class="btn" data-rcomok="${esc(n)}">OK</button></div>
        </div>`:""}
      </section>`; }).join("")}`;
  $("sfoot").innerHTML=`<button class="btn" data-retourslist="1">Autres repas</button><button class="btn primary" data-bilan="1">Voir le bilan</button>`;
}
// ---- Fenêtre : bilan ----
const CATS=[["sur","Les valeurs sûres","Bien notés par presque tout le monde : à garder dans la rotation."],
  ["ameliorer","À ajuster","Corrects, mais un détail revient dans les avis : il suffit souvent de changer la recette."],
  ["divise","Divise la famille","Adoré par les uns, pas aimé par les autres : à servir quand les amateurs sont là, ou avec une variante."],
  ["retester","À retester","Mal notés, mais servis moins de 3 fois. Les études montrent qu'un enfant accepte souvent un plat après 8 à 10 essais : changez un ingrédient et reproposez-le dans quelques semaines."],
  ["retirer","À retirer pour un temps","Mal notés à plusieurs reprises : ils ne seront plus proposés pendant un mois."],
  ["tot","Pas encore assez d'avis","Un seul avis : trop tôt pour juger."]];
function renderBilan(){ const A=analyse();
  $("seyebrow").textContent="Retours sur les repas"; $("stitle").textContent="Bilan des repas"; $("sextra").innerHTML="";
  $("sfoot").innerHTML=`<button class="btn" data-retourslist="1">Noter un repas</button>`;
  if(!A.all.length){ $("sbody").innerHTML=`<p>Pas encore d'avis. Après le souper, touchez « C'était comment ? » dans l'onglet Menu : chacun choisit un visage, c'est tout.</p>
    <p class="note">Le bilan apparaît dès les premiers avis. Il devient vraiment parlant après 2 ou 3 semaines.</p>`; return; }
  const maxM=5, reco=[];
  const surs=A.plats.filter(p=>p.cat==="sur").sort((a,b)=>b.score-a.score), adj=A.plats.filter(p=>p.cat==="ameliorer"&&p.topMots.length), ret=A.plats.filter(p=>p.cat==="retester");
  if(surs.length) reco.push(`Proposer plus souvent : <b>${surs.slice(0,3).map(p=>esc(p.nom)).join(", ")}</b>.`);
  adj.slice(0,2).forEach(p=>reco.push(`${esc(p.nom)} : souvent « ${esc(p.topMots[0].toLowerCase())} ». Adaptez la recette avant de le reproposer.`));
  if(ret.length) reco.push(`Retester plus tard, avec une variante : <b>${ret.slice(0,2).map(p=>esc(p.nom)).join(", ")}</b>.`);
  if(A.part!=null&&A.part<0.5) reco.push(`Seulement ${Math.round(A.part*100)} % des repas sont notés : rappelez à chacun que noter prend 2 secondes.`);
  const bonPasCher=A.plats.filter(p=>p.cout&&p.n>=2&&p.score>=3.6).sort((a,b)=>(b.score/b.cout)-(a.score/a.cout)).slice(0,3);
  $("sbody").innerHTML=`
    <div class="rtkpis"><div><b>${n1(A.G)}</b><small>note moyenne sur 5</small></div><div><b>${A.pctOui==null?"–":Math.round(A.pctOui*100)+" %"}</b><small>« à refaire »</small></div><div><b>${A.part==null?"–":Math.round(A.part*100)+" %"}</b><small>participation (4 semaines)</small></div><div><b>${A.all.length}</b><small>avis</small></div></div>
    <section class="rtsec"><h3>Hit-parade des plats</h3><p class="note">Chaque avis compte comme un vote. Le classement tient compte du nombre de votes ; les flèches comparent à la semaine dernière.</p>${htmlHitParade(hitParade(10),false)}</section>
    ${reco.length?`<section class="rtsec"><h3>Ce que je vous conseille</h3><ul class="rtreco">${reco.map(t=>`<li>${t}</li>`).join("")}</ul></section>`:""}
    ${A.tendance.length>1?`<section class="rtsec"><h3>Évolution par semaine</h3><div class="rttrend">${A.tendance.map(t=>`<div class="rtbar"><i style="height:${Math.round(t.m/maxM*100)}%"></i><b>${n1(t.m)}</b><small>${fmtShort(isoDate(t.iso))}</small></div>`).join("")}</div></section>`:""}
    ${CATS.map(([k,t,d])=>{ const l=A.plats.filter(p=>p.cat===k).sort((a,b)=>b.score-a.score); if(!l.length) return "";
      return `<section class="rtsec"><h3>${t} <span class="badge">${l.length}</span></h3><p class="note">${d}</p>
        <div class="rtplats">${l.map(p=>`<div class="rtplat"><img src="${photoSrc(p.id)}" alt="" data-cache-err="1" decoding="async" loading="lazy"><span><b>${esc(p.nom)}</b>
          <small>${n1(p.m)}/5 · ${p.n} avis · servi ${p.servi} fois${p.refTot?` · ${Math.round(p.oui/p.refTot*100)} % à refaire`:""}${p.cout?` · ${eur(p.cout)}/pers.`:""}</small>
          ${p.topMots.length?`<small class="rtwarn">Souvent : ${p.topMots.map(esc).join(", ").toLowerCase()}</small>`:""}
          ${k==="divise"?`<small>${p.l.filter(r=>r.note>=4).map(r=>esc(r.nom)).filter((v,i,a)=>a.indexOf(v)===i).join(", ")||"–"} aiment · ${p.l.filter(r=>r.note<=2).map(r=>esc(r.nom)).filter((v,i,a)=>a.indexOf(v)===i).join(", ")||"–"} n'aiment pas</small>`:""}</span>
          <span class="rtscore" style="--p:${Math.round(p.m/5*100)}%">${n1(p.m)}</span></div>`).join("")}</div></section>`; }).join("")}
    ${bonPasCher.length?`<section class="rtsec"><h3>Bons et pas chers</h3><p class="note">Le meilleur rapport entre plaisir et prix par personne.</p><ol class="rtreco">${bonPasCher.map(p=>`<li><b>${esc(p.nom)}</b> : ${n1(p.m)}/5 pour ${eur(p.cout)} par personne</li>`).join("")}</ol></section>`:""}
    <section class="rtsec"><h3>Les goûts de chacun</h3><div class="rtpeople">${A.personnes.map(p=>`<div class="rtpers"><b>${esc(p.n)}</b>
      <small>${p.count?`${p.count} avis · moyenne ${n1(p.m)}/5`:"Pas encore d'avis"}${p.part!=null?` · note ${Math.round(p.part*100)} % de ses repas`:""}</small>
      ${p.top.length?`<small>Adore : ${p.top.map(x=>esc(BYID[x.id].nom)).join(", ")}</small>`:""}${p.bas.length?`<small>N'aime pas : ${p.bas.map(x=>esc(BYID[x.id].nom)).join(", ")}</small>`:""}
      ${p.mot&&p.mot[1]>=2&&p.mot[0]!=="Parfait comme ça"?`<small>Remarque souvent : ${esc(p.mot[0].toLowerCase())}</small>`:""}</div>`).join("")}</div></section>
    ${A.coms.length?`<section class="rtsec"><h3>Derniers commentaires</h3>${A.coms.map(r=>`<blockquote class="rtcom">« ${esc(r.com)} »<small>${esc(r.nom)} · ${esc(BYID[r.plat].nom)} · ${fmtShort(isoDate(r.semaine))}</small></blockquote>`).join("")}</section>`:""}
    <p class="note">Méthode : la note d'un plat est une moyenne prudente, qui tient compte du nombre d'avis, pour qu'un seul avis ne suffise pas à classer un plat. Les avis ne sont pas regroupés par cuisinier.</p>`;
}
document.addEventListener("click",e=>{ const b=e.target.closest("[data-retour],[data-bilan],[data-retourslist],[data-rnote],[data-rref],[data-rmot],[data-rcomok]"); if(!b) return; const D=b.dataset;
  if(D.retour){ const [iso,d]=D.retour.split("|"); const ctx={type:"retour",iso,d:+d}; sheetCtx?(sheetCtx=ctx,renderSheet(),$("sbody").scrollTop=0):openSheet(ctx); return; }
  if(D.bilan){ const ctx={type:"bilan"}; sheetCtx?(sheetCtx=ctx,renderSheet(),$("sbody").scrollTop=0):openSheet(ctx); return; }
  if(D.retourslist){ const ctx={type:"retour",list:true}; sheetCtx?(sheetCtx=ctx,renderSheet(),$("sbody").scrollTop=0):openSheet(ctx); return; }
  const c=sheetCtx; if(!c||c.type!=="retour"||c.list) return; const n=D.rn;
  if((D.rnote||D.rref||D.rmot||D.rcomok!=null) && !peutNoter(n)){ toast("Vous ne notez que pour vous"); return; }
  if(D.rnote){ enregistrerRetour(c.iso,c.d,n,{note:+D.rnote}); return; }
  const v=RETOURS[retourId(c.iso,c.d,n)]||{};
  if(D.rref){ enregistrerRetour(c.iso,c.d,n,{refaire:v.refaire===D.rref?null:D.rref}); return; }
  if(D.rmot){ const s=new Set(v.mots||[]); s.has(D.rmot)?s.delete(D.rmot):s.add(D.rmot); enregistrerRetour(c.iso,c.d,n,{mots:[...s]}); return; }
  if(D.rcomok!=null){ const inp=[...document.querySelectorAll("[data-rcom]")].find(x=>x.dataset.rcom===n); if(inp){ enregistrerRetour(c.iso,c.d,n,{com:inp.value.trim()}); toast("Commentaire enregistré"); } }
});



// ===================== Liste de courses : habituels, quantités, « j'en ai déjà », ticket réel =====================
let PLACARD={}, DEJA_LA=[];
// Les ajouts gardent l'identifiant de l'appareil : on affiche le prénom correspondant
const NOMS_PAR={}, NOMS_DEMANDES=new Set(); let nomsEnCours=false;
const UUID_RE=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
// Chaque identifiant n'est demandé qu'une fois : un appareil retiré de la famille ne relance jamais l'affichage
function nomDe(par){ if(typeof par!=="string") return "un membre de la famille"; if(!UUID_RE.test(par)) return /^[0-9a-f-]{20,}$/.test(par)?"un membre de la famille":par; if(NOMS_PAR[par]) return NOMS_PAR[par];
  if(!nomsEnCours&&USER&&USER.profiles){ const ids=[...new Set([...(state.extras||[]).map(x=>x.par),par])].filter(x=>typeof x==="string"&&UUID_RE.test(x)&&!NOMS_DEMANDES.has(x));
    if(ids.length){ nomsEnCours=true; ids.forEach(x=>NOMS_DEMANDES.add(x));
      USER.profiles(ids).then(ps=>{ let neuf=false; Object.entries(ps||{}).forEach(([id,p])=>{ if(p&&p.name&&!NOMS_PAR[id]){ NOMS_PAR[id]=p.name; neuf=true; } }); nomsEnCours=false; if(neuf) renderCourses(); }).catch(()=>{ nomsEnCours=false; }); } }
  return "un membre de la famille"; }
function subscribePlacard(){ if(!DB) return; DB.doc("famille/placard").onSnapshot(snap=>{ const d=snap.exists?snap.data():{}; const r={};
  if(d&&d.noms&&typeof d.noms==="object") Object.entries(d.noms).slice(0,200).forEach(([k,v])=>{ const n=propre(k,40); if(n) r[n]=typeof v==="string"?v.slice(0,10):""; });
  PLACARD=r; try{ localStorage.setItem(KEY+"-placard",JSON.stringify(r)); }catch(e){} renderCourses(); },()=>{}); }
try{ PLACARD=JSON.parse(localStorage.getItem(KEY+"-placard")||"{}")||{}; }catch(e){ PLACARD={}; }
async function majPlacard(n,garder){ const r={...PLACARD}; if(garder) r[n]=isoOf(TODAY); else delete r[n]; PLACARD=r;
  try{ localStorage.setItem(KEY+"-placard",JSON.stringify(r)); }catch(e){} renderCourses();
  if(DB){ try{ await DB.doc("famille/placard").set({noms:r}); }catch(e){ toast("Le changement n'a pas pu être partagé"); } } }
// Les courses habituelles : produits ajoutés le plus souvent, toutes semaines confondues
function habituels(){ const c=new Map(), add=(n,ray,qt,poids)=>{ const k=norm(n); if(!k) return; const o=c.get(k)||{n,ray,qt:"",c:0}; o.c+=poids; if(qt&&!o.qt) o.qt=qt; c.set(k,o); };
  Object.entries({...state.weeks,...(typeof SEMAINES==="object"?SEMAINES:{})}).forEach(([iso,w])=>{ if(iso===curIso()) return; (w.extras||w.ajouts||[]).forEach(x=>x&&x.n&&add(x.n,x.ray,x.qt,2)); });
  (state.extras||[]).forEach(x=>add(x.n,x.ray,x.qt,0.5));
  try{ Object.values(TICKETS_PH).forEach(t=>(t.res.lignes||[]).forEach(l=>{ const n=l.i||""; if(n&&!estIngredientMenu(n)) add(n,l.r,"",1.5); })); }catch(e){}
  Object.values(HISTO).forEach(h=>add(h.n,h.ray,h.qt,Math.min(3,(h.c||0)/2)));
  let l=[...c.values()].filter(x=>x.c>=1).sort((a,b)=>b.c-a.c).slice(0,14);
  if(l.length<6) ["Lait","Pain","Œufs","Yaourts","Beurre","Bananes","Pommes","Café","Eau plate","Papier toilette"].forEach(n=>{ if(l.length<12&&!l.some(x=>norm(x.n)===norm(n))) { const p=produitsConnus().find(x=>norm(x.n)===norm(n)); l.push({n,ray:p?p.ray:"epi",qt:"",c:0}); } });
  return l; }
function renderHabituels(){ const box=$("habituels"); if(!box) return; const l=habituels(), dans=new Set((state.extras||[]).map(x=>norm(x.n)));
  box.innerHTML=`<span class="habtitle">Courses habituelles</span>`+l.map((x,i)=>{ const ok=dans.has(norm(x.n));
    return `<button type="button" class="chip${ok?" on":""}" data-hab="${i}" ${ok?'aria-pressed="true"':""} data-tip="${ok?"Déjà dans la liste":"Ajouter à la liste"+(x.qt?" ("+esc(x.qt)+")":"")}">${ok?"✓":"+"} ${esc(x.n)}</button>`; }).join("");
  box._l=l; }
// Panneau « déjà à la maison » sous la liste
function renderDejaLa(){ const box=$("dejala"); if(!box) return; const autres=Object.keys(PLACARD).filter(n=>!DEJA_LA.some(x=>x.n===n));
  if(!DEJA_LA.length&&!autres.length){ box.hidden=true; return; } box.hidden=false;
  box.innerHTML=`<summary>Déjà à la maison <span class="badge">${DEJA_LA.length}</span></summary>
    <p class="note">Ces ingrédients ne sont plus mis sur la liste, cette semaine comme les suivantes. Touchez « Remettre » quand il faut en racheter.</p>
    <div class="dejalist">${DEJA_LA.map(x=>`<div><span><b>${esc(x.n)}</b><small>pour ${[...x.pour].join(", ").toLowerCase()}</small></span><button type="button" class="chip edit-only" data-remettre="${esc(x.n)}">Remettre sur la liste</button></div>`).join("")}
    ${autres.map(n=>`<div><span><b>${esc(n)}</b><small>pas utilisé cette semaine</small></span><button type="button" class="chip edit-only" data-remettre="${esc(n)}">Remettre</button></div>`).join("")}</div>`; }
// Modifier une quantité directement dans la liste
let qtOuvert=null;
const QUNITES=["pièce(s)","g","kg","cl","L","paquet(s)","bouteille(s)","boîte(s)"];
function articleQt(k){ return coursesTrips().flat().find(i=>i.k===k)||null; }
function ouvrirQt(btn){ const k=btn.dataset.qedit; const it=articleQt(k); if(!it) return; qtOuvert=k;
  const cur=String(qtyOf(it)||""), m=cur.match(/^(\d+(?:[.,]\d+)?)\s*(.*)$/);
  let u=m?m[2].trim():""; if(u==="pièce"||u==="pièces"||(!u&&m)) u="pièce(s)"; if(!QUNITES.includes(u)&&u) u="";
  $("qnom").textContent=it.n; $("qval").value=m?m[1]:cur; $("qunits").innerHTML=QUNITES.map(x=>`<button type="button" class="chip${x===u?" on":""}" data-qunit="${esc(x)}" aria-pressed="${x===u}">${x}</button>`).join("");
  $("qorig").innerHTML=!it.x&&state.qtEdit&&state.qtEdit[k]?`Quantité prévue par les recettes : <b>${esc(fmt(it.q,it.u))}</b> · <button type="button" class="linkbtn" data-qreset="${esc(k)}">Rétablir</button>`:(!it.x?`Quantité calculée d'après les recettes de la semaine.`:"");
  qLast=document.activeElement; $("qoverlay").hidden=false; const inp=$("qval"); setTimeout(()=>{ try{ inp.focus(); inp.select(); }catch(e){} },30); }
let qLast=null;
function fermerQt(){ $("qoverlay").hidden=true; qtOuvert=null; if(qLast&&qLast.focus&&document.contains(qLast)) try{qLast.focus()}catch(e){} }
function pasQt(u){ return u==="g"?50:u==="cl"?10:(u==="kg"||u==="L")?0.25:1; }
function uniteQt(){ const b=document.querySelector("#qunits .chip.on"); return b?b.dataset.qunit:""; }
function changerQt(sens){ const inp=$("qval"); const n=parseFloat(String(inp.value).replace(",","."))||0, st=pasQt(uniteQt());
  const v=Math.max(0,Math.round((n+sens*st)*100)/100); inp.value=String(v).replace(".",","); }
function validerQt(k){ const it=articleQt(k); if(!it) return; const v=$("qval").value.trim(), u=uniteQt();
  let q=v; const m=v.match(/^(\d+(?:[.,]\d+)?)$/);
  if(m){ let n=parseFloat(m[1].replace(",",".")), un=u; if(n===0){ q=""; } else { if(un==="g"&&n>=1000){ n/=1000; un="kg"; } if(un==="cl"&&n>=100){ n/=100; un="L"; }
    if(un==="pièce(s)") un=it.x?"":""; q=`${String(Math.round(n*100)/100).replace(".",",")}${un?" "+un:""}`; } }
  q=propre(q,20);
  if(it.x){ const x=(state.extras||[]).find(y=>y.id===it.id); if(x) x.qt=q; }
  else { state.qtEdit={...(state.qtEdit||{})}; if(q) state.qtEdit[k]=q; else delete state.qtEdit[k]; }
  fermerQt(); save(); renderCourses(); if(sheetCtx&&sheetCtx.type==="shop") renderShop(); toast(q?`${it.n} : ${q}`:`${it.n} : quantité effacée`); }
$("qclose").addEventListener("click",fermerQt); $("qcancel").addEventListener("click",fermerQt);
$("qoverlay").addEventListener("click",e=>{ if(e.target.id==="qoverlay") fermerQt();
  const un=e.target.closest("[data-qunit]"); if(un){ document.querySelectorAll("#qunits .chip").forEach(c=>{ c.classList.toggle("on",c===un); c.setAttribute("aria-pressed",c===un); }); }
  const pm=e.target.closest("[data-qpas]"); if(pm) changerQt(+pm.dataset.qpas); });
$("qok").addEventListener("click",()=>{ if(qtOuvert) validerQt(qtOuvert); });
$("qval").addEventListener("keydown",e=>{ if(e.key==="Enter"){ e.preventDefault(); if(qtOuvert) validerQt(qtOuvert); } });
document.addEventListener("keydown",e=>{ if(e.key==="Escape"&&!$("qoverlay").hidden){ e.stopPropagation(); fermerQt(); } },true);
// Photos de tickets : lues par la mise à jour du lundi et du mercredi, elles alimentent la base des prix réels
let TICKETS_PH={};
// Texte d'une ligne de ticket : on garde les apostrophes (« Huile d'olive »), on retire tout ce qui pourrait former du code
function txtLigne(v,max){ return typeof v==="string"?v.replace(/[<>"`\\{}]/g,"").replace(/\s+/g," ").trim().slice(0,max):""; }
function cleanTicketPh(x){ if(!x||typeof x!=="object") return null; const r=x.resultat&&typeof x.resultat==="object"?x.resultat:{};
  const jr=v=>typeof v==="string"&&/^\d{4}-\d{2}-\d{2}/.test(v)?v.slice(0,10):"";
  return {semaine:jr(x.semaine),quand:typeof x.quand==="string"&&/^\d{4}-\d{2}-\d{2}T[\d:.]+Z?$/.test(x.quand)?x.quand:"",par:typeof x.par==="string"&&UUID_RE.test(x.par)?x.par:propre(x.par,30),mag:typeof x.mag==="string"?x.mag.replace(/[<>"'`]/g,"").slice(0,40):"",
    lie:!!x.lie,statut:["attente","analyse","illisible"].includes(x.statut)?x.statut:"attente",aPhoto:typeof x.photo==="string",
    res:{total:+r.total>0?Math.round(+r.total*100)/100:null,articles:+r.articles>0?Math.round(+r.articles):null,magasin:propre(r.magasin,50),date:jr(r.date),reconnus:+r.reconnus>=0?Math.round(+r.reconnus):null,note:propre(r.note,200),
      lignes:Array.isArray(r.lignes)?r.lignes.slice(0,250).map(l=>l&&typeof l==="object"?{p:txtLigne(l.p,70),i:txtLigne(l.i,50),q:+l.q>0&&+l.q<1000?+l.q:1,u:["kg","L","u","g","cl"].includes(l.u)?l.u:"u",m:+l.m>=0&&+l.m<1000?Math.round(+l.m*100)/100:0,r:RAYONS[l.r]?l.r:"epi",md:!!l.md}:null).filter(l=>l&&l.p):[]}}; }
function subscribeTicketsPh(){ if(!DB) return; DB.collection("tickets").onSnapshot(q=>{ q.docChanges().forEach(c=>{ if(c.type==="removed") delete TICKETS_PH[c.doc.id]; else { const v=cleanTicketPh(c.doc.data()); if(v) TICKETS_PH[c.doc.id]=v; } }); if(state.tab==="courses") renderTicket(); try{ renderManquants(); }catch(e){} },()=>{}); }
function compresserTicket(file){ return new Promise((ok,ko)=>{ const img=new Image(), url=URL.createObjectURL(file);
  img.onload=()=>{ URL.revokeObjectURL(url); const essai=(max,q)=>{ const m=Math.min(1,max/Math.max(img.naturalWidth,img.naturalHeight)), c=document.createElement("canvas");
      c.width=Math.round(img.naturalWidth*m); c.height=Math.round(img.naturalHeight*m); const x=c.getContext("2d"); x.filter="grayscale(1) contrast(1.15)"; x.drawImage(img,0,0,c.width,c.height); return c.toDataURL("image/jpeg",q); };
    for(const [max,q] of [[2000,0.6],[1800,0.5],[1600,0.45],[1400,0.4],[1200,0.4]]){ const d=essai(max,q); if(d.length<370000) return ok(d); } ko(new Error("trop lourde")); };
  img.onerror=()=>{ URL.revokeObjectURL(url); ko(new Error("image")); }; img.src=url; }); }
async function envoyerTicketPhoto(file){ if(!DB){ toast("L'envoi de photos demande le partage avec la famille"); return; }
  let photo; try{ photo=await compresserTicket(file); }catch(e){ toast("Cette photo n'a pas pu être préparée : essayez de la recadrer sur le ticket"); return; }
  const v=parseFloat((($("tk-montant")||{}).value||"").replace(",",".").replace(/[^\d.]/g,"")), mag=($("tk-mag")||{}).value||"", nom=(window.__acces&&window.__acces()&&window.__acces().nom)||"";
  const id=curIso()+"-"+Date.now().toString(36);
  try{ await DB.collection("tickets").doc(id).set({semaine:curIso(),photo,quand:new Date().toISOString(),par:nom,mag,lie:v>0,statut:"attente"}); }
  catch(e){ toast("La photo n'a pas pu être envoyée. Réessayez dans un instant."); return; }
  if(v>0&&v<5000){ state.tickets=[...(state.tickets||[]),{montant:Math.round(v*100)/100,mag,quand:new Date().toISOString(),estime:Math.round(weekCost(state.gamme)*100)/100,par:nom}]; save(); }
  toast("Photo du ticket envoyée : elle sera lue lundi ou mercredi"); renderTicket(); }
document.addEventListener("change",e=>{ if(e.target.id!=="tk-photo") return; const f=e.target.files&&e.target.files[0]; if(f) envoyerTicketPhoto(f); e.target.value=""; });
document.addEventListener("click",async e=>{ const b=e.target.closest("[data-tphdel]"); if(!b) return; try{ await DB.collection("tickets").doc(b.dataset.tphdel).delete(); toast("Photo de ticket supprimée"); }catch(err){ toast("Seul le propriétaire peut supprimer une photo de ticket"); } });
// Ticket de caisse réel
function renderTicket(){ const box=$("ticketbox"); if(!box) return;
  const ph=Object.entries(TICKETS_PH).filter(([,x])=>x.semaine===curIso()).sort((a,b)=>String(b[1].quand).localeCompare(String(a[1].quand)));
  const est=weekCost(state.gamme), tk=state.tickets||[], tot=tk.reduce((s,x)=>s+x.montant,0)+ph.filter(([,x])=>!x.lie&&x.res.total).reduce((s,[,x])=>s+x.res.total,0);
  const hist=Object.entries({...state.weeks,...(typeof SEMAINES==="object"?SEMAINES:{})}).map(([iso,w])=>{ const t=cleanTickets(w.tickets); return {iso,reel:t.reduce((s,x)=>s+x.montant,0),est:t.find(x=>x.estime)?t.find(x=>x.estime).estime:null}; })
    .filter(x=>x.reel>0&&/^\d{4}-\d\d-\d\d$/.test(x.iso)); const hm=new Map(hist.map(x=>[x.iso,x])); if(tot>0) hm.set(curIso(),{iso:curIso(),reel:tot,est});
  const h=[...hm.values()].sort((a,b)=>a.iso.localeCompare(b.iso)).slice(-8), max=Math.max(1,...h.map(x=>Math.max(x.reel,x.est||0)));
  const ecart=tot>0?tot-est:null, moisCle=isoOf(TODAY).slice(0,7), mois=[...hm.values()].filter(x=>x.iso.slice(0,7)===moisCle).reduce((s,x)=>s+x.reel,0);
  box.innerHTML=`<summary>Ticket de caisse <span class="badge">${tot>0?eur(tot):"à noter"}</span></summary>
    <p class="note">Notez le montant réel après les courses : l'application compare au budget estimé (${eur(est)} cette semaine, gamme ${GAMMES[state.gamme].nom.toLowerCase()}).</p>${Object.keys(PRIX_REELS).length?`<p class="note">Base des prix réels : ${Object.keys(PRIX_REELS).length} ingrédients chiffrés d'après vos tickets.</p>`:""}
    <form class="addrow" id="ticketform"><input id="tk-montant" type="text" inputmode="decimal" placeholder="Montant payé (ex. 87,45)" aria-label="Montant du ticket en euros" maxlength="9"><select id="tk-mag" aria-label="Magasin">${(()=>{ let pm=""; try{ pm=MAGNOM[planTrip(0,coursesTrips()[0]).primary]; }catch(e){} return orderedStores().map(m=>`<option value="${esc(m.nom)}"${m.nom===pm?" selected":""}>${esc(m.nom)}</option>`).join(""); })()}<option value="">Autre</option></select><button class="btn primary edit-only" type="submit">Noter</button></form>
    <label class="btn tkphoto edit-only" data-tip="Photographiez le ticket entier : il sera lu lundi ou mercredi pour enrichir la base des prix réels">📷 Photo du ticket<input id="tk-photo" type="file" accept="image/*" capture="environment" hidden></label>
    ${ph.length?`<div class="tklist">${ph.map(([id,x])=>`<div><span><b>${x.statut==="analyse"?`Ticket lu${x.res.total?" : "+eur(x.res.total):""}`:x.statut==="illisible"?"Ticket illisible":"Photo en attente de lecture"}</b>
      <small>${esc(x.res.magasin||x.mag||"")}${x.res.date?" · "+new Date(x.res.date).toLocaleDateString("fr-BE"):x.quand?" · envoyée le "+new Date(x.quand).toLocaleDateString("fr-BE"):""}${x.res.articles?` · ${x.res.articles} articles`:""}${x.res.reconnus!=null?`, ${x.res.reconnus} ajoutés à la base des prix`:""}${x.statut==="attente"?" · lecture lundi ou mercredi":""}${x.par?" · "+esc(x.par):""}</small>${x.res.note?`<small>${esc(x.res.note)}</small>`:""}</span>
      <button type="button" class="sbtn owner-only" data-tphdel="${esc(id)}" aria-label="Supprimer cette photo de ticket">×</button></div>`).join("")}</div>`:""}
    ${tk.length?`<div class="tklist">${tk.map((x,i)=>`<div><span><b>${eur(x.montant)}</b><small>${esc(x.mag||"Magasin")} · ${x.quand?new Date(x.quand).toLocaleDateString("fr-BE"):""}${x.par?" · "+esc(x.par):""}</small></span><button type="button" class="sbtn edit-only" data-tkdel="${i}" aria-label="Supprimer ce ticket">×</button></div>`).join("")}</div>
      <p class="tkecart ${ecart>0?"plus":"moins"}">Total ${eur(tot)} · estimé ${eur(est)} · ${ecart>0?`${eur(ecart)} de plus que prévu`:`${eur(-ecart)} de moins que prévu`}${ecart>0&&(state.extras||[]).length?` (dont ${state.extras.length} produits ajoutés hors recettes)`:""}</p>`:""}
    ${h.length?`<h3 class="shopray">Semaine après semaine</h3><div class="tkbars">${h.map(x=>`<div class="tkbar" title="Réel ${eur(x.reel)}${x.est?", estimé "+eur(x.est):""}"><span class="tkcols"><i class="r" style="height:${Math.round(x.reel/max*100)}%"></i>${x.est?`<i class="e" style="height:${Math.round(x.est/max*100)}%"></i>`:""}</span><b>${Math.round(x.reel)} €</b><small>${fmtShort(isoDate(x.iso))}</small></div>`).join("")}</div>
      <p class="note"><i class="leg r"></i> réel <i class="leg e"></i> estimé · ce mois-ci : ${eur(mois)} dépensés</p>`:""}
    <button type="button" class="btn histbtn" data-histo="1" data-tip="Dépenses, produits récurrents, évolution des prix et détail de chaque ticket">📊 Historique et analyse des courses</button>`; }
document.addEventListener("submit",e=>{ if(e.target.id!=="ticketform") return; e.preventDefault(); const v=parseFloat(($("tk-montant").value||"").replace(",",".").replace(/[^\d.]/g,""));
  if(!(v>0&&v<5000)){ toast("Indiquez le montant du ticket, par exemple 87,45"); return; }
  const nom=(window.__acces&&window.__acces()&&window.__acces().nom)||"";
  state.tickets=[...(state.tickets||[]),{montant:Math.round(v*100)/100,mag:$("tk-mag").value,quand:new Date().toISOString(),estime:Math.round(weekCost(state.gamme)*100)/100,par:nom}];
  save(); renderTicket(); toast(`Ticket de ${eur(v)} noté`); });
document.addEventListener("click",e=>{
  const h=e.target.closest("[data-hab]"); if(h){ const x=($("habituels")._l||[])[+h.dataset.hab]; if(!x) return; if((state.extras||[]).some(y=>norm(y.n)===norm(x.n))){ toast(`${x.n} est déjà dans la liste`); return; } ajouterProduit(x.n,x.ray,x.qt||""); return; }
  const q=e.target.closest("[data-qedit]"); if(q){ e.preventDefault(); e.stopPropagation(); if(document.body.classList.contains("readonly")) return; ouvrirQt(q); return; }
  const rs=e.target.closest("[data-qreset]"); if(rs){ e.preventDefault(); e.stopPropagation(); const k=rs.dataset.qreset; state.qtEdit={...(state.qtEdit||{})}; delete state.qtEdit[k]; fermerQt(); save(); renderCourses(); if(sheetCtx&&sheetCtx.type==="shop") renderShop(); toast("Quantité de la recette rétablie"); return; }
  if(e.target.closest(".qtedit")){ e.preventDefault(); e.stopPropagation(); return; }
  const dj=e.target.closest("[data-deja]"); if(dj){ e.preventDefault(); e.stopPropagation(); const n=dj.dataset.deja; majPlacard(n,true); toast(`${n} : noté comme déjà à la maison`,()=>majPlacard(n,false),"Annuler"); return; }
  const re=e.target.closest("[data-remettre]"); if(re){ const n=re.dataset.remettre; majPlacard(n,false); toast(`${n} remis sur la liste`); return; }
  const td=e.target.closest("[data-tkdel]"); if(td){ state.tickets=(state.tickets||[]).filter((_,i)=>i!==+td.dataset.tkdel); save(); renderTicket(); toast("Ticket supprimé"); return; }
},true);

// ===================== Ingrédients encore à acheter =====================
// Après le jour des courses, tout article de la liste non coché est « manquant » : on rappelle pour quel repas
// et quel jour il le faut, et où l'acheter (boucher, boulanger…), choix partagé avec la famille.
function coursesFaites(){ return TODAY>=tripDate(0); }
function lignesTicketSemaine(){ const out=[]; try{ Object.values(TICKETS_PH).forEach(t=>{ if(t.semaine===curIso()&&t.statut==="analyse") (t.res.lignes||[]).forEach(l=>out.push(l)); }); }catch(e){} return out; }
const MOTS_VIDES=new Set(["de","du","des","la","le","les","en","au","aux","et","a","pour","avec","sans","bocal","pot","paquet","sachet","boite"]);
function motsCles(t,variantes){ return String(t||"").toLowerCase().replace(/œ/g,"oe").replace(/æ/g,"ae").normalize("NFD").replace(/[̀-ͯ]/g,"").split(/[^a-z0-9]+/).flatMap(w=>variantes&&/^[dl][aeiouh]/.test(w)&&w.length>=5?[w,w.slice(1)]:[w]).filter(w=>w.length>=3&&!MOTS_VIDES.has(w)&&!/^\d/.test(w)).map(w=>w.slice(0,4)); }
// Un article de la liste est considéré comme acheté s'il ressemble assez à une ligne du ticket (au moins la moitié de ses mots)
function surLeTicket(n,lignes){ const m=[...new Set(motsCles(n))]; if(!m.length) return false;
  return lignes.some(l=>{ const t=new Set([...motsCles(l.i,true),...motsCles(l.p,true)]); const ok=m.filter(w=>t.has(w)).length; const ing=motsCles(l.i);
    return ok>=Math.max(1,Math.ceil(m.length/2))||(ing.length>0&&ing.every(w=>m.includes(w))); }); }
function manquantsSemaine(){ if(!coursesFaites()) return []; const lt=lignesTicketSemaine();
  const recettes=[]; state.week.forEach((id,d)=>headcount(d)&&BYID[id]&&BYID[id].ing.forEach(([n])=>recettes.push({d,n,plat:BYID[id].nom,m:motsCles(n)})));
  return coursesTrips()[0].filter(i=>!state.checked[i.ck]&&!surLeTicket(i.n,lt)).map(i=>{
    // article ajouté à la main : on le relie au repas du menu qui utilise ce produit (« Boudin boucherie » → Boudin, compote et purée)
    if(i.x&&!(i.jd&&i.jd.size)){ const mi=motsCles(i.n); const r=recettes.filter(r=>r.m.length&&r.m.every(w=>mi.includes(w))); if(r.length){ i={...i,jd:new Set(r.map(x=>x.d)),plats:new Set(r.map(x=>x.plat))}; } }
    const jours=i.jd?[...i.jd].sort((a,b)=>a-b):[];
    const futurs=jours.filter(d=>dayOffset(d)>=TODAY), d=futurs.length?futurs[0]:(jours.length?jours[jours.length-1]:null);
    const date=d!=null?dayOffset(d):null, dans=date?Math.round((date-TODAY)/DAY):null;
    return {...i,d,date,dans,lieu:(state.lieux||{})[i.k]||(i.ray==="bou"?"boucher":i.ray==="bl"?"boulanger":"super"),choisi:!!(state.lieux||{})[i.k],plats:i.plats?[...i.plats]:[]}; })
    .filter(x=>x.dans==null||x.dans>=0).sort((a,b)=>(a.dans==null?99:a.dans)-(b.dans==null?99:b.dans)||a.n.localeCompare(b.n,"fr")); }
function quand(x){ return x.dans==null?"cette semaine":x.dans===0?"aujourd'hui":x.dans===1?"demain":JOURS[x.d].toLowerCase()+" "+fmtShort(x.date); }
function renderManquants(){ const l=manquantsSemaine();
  ["manquants","manquants2"].forEach(id=>{ const box=$(id); if(!box) return; if(!l.length){ box.hidden=true; box.innerHTML=""; return; } box.hidden=false;
    const urg=l.filter(x=>x.dans!=null&&x.dans<=1).length;
    box.innerHTML=`<div class="mqhead"><h3>Il manque encore ${l.length} ingrédient${l.length>1?"s":""}${urg?` <span class="badge warm">${urg} pour ${l.some(x=>x.dans===0)?"aujourd'hui ou ":""}demain</span>`:""}</h3>
      <span class="mqact"><button type="button" class="btn small" data-mqtout="1" data-tip="Coche tous ces articles : tout a été acheté">Tout est acheté</button><button type="button" class="btn small" data-mqics="1" data-tip="Ajoute un rappel dans l'agenda du téléphone, la veille de chaque repas concerné">📅 Rappel agenda</button></span></div>
      ${lignesTicketSemaine().length?`<p class="note">Les produits lus sur le ticket de la semaine sont déjà comptés comme achetés.</p>`:""}
      <div class="mqlist">${l.map(x=>`<div class="mq${x.dans!=null&&x.dans<=1?" urgent":""}"><span class="mqn"><b>${esc(x.n)}</b> <small>${esc(qtyOf(x))}</small>
        <small>pour ${x.plats.length?esc(x.plats.join(", ")):"la semaine"} · <b>${quand(x)}</b></small></span>
        <select class="mqlieu edit-ctl" data-mqlieu="${esc(x.k)}" aria-label="Où acheter ${esc(x.n)}">${Object.entries(LIEUX).map(([k,v])=>`<option value="${k}"${k===x.lieu?" selected":""}>${v[0].toUpperCase()+v.slice(1)}</option>`).join("")}</select>
        <button type="button" class="chip on" data-mqok="${esc(x.ck)}" aria-label="${esc(x.n)} est acheté">Acheté ✓</button></div>`).join("")}</div>`; }); }
function rappelManquants(){ if(window.__mqRappel) return; const l=manquantsSemaine().filter(x=>x.dans!=null&&x.dans<=1); if(!l.length) return; window.__mqRappel=true;
  const x=l[0], reste=l.length-1;
  setTimeout(()=>toast(`${l.some(y=>y.dans===0)?"Aujourd'hui":"Demain"} : ${x.n} ${LIEUX[x.lieu]}${reste?` et ${reste} autre${reste>1?"s":""}`:""}`,()=>setTab("courses"),"Voir"),1500); }
function icsManquants(){ const l=manquantsSemaine(); const pad=n=>String(n).padStart(2,"0"), f=d=>`${d.getFullYear()}${pad(d.getMonth()+1)}${pad(d.getDate())}T${pad(d.getHours())}${pad(d.getMinutes())}00`;
  const parJour=new Map(); l.forEach(x=>{ const k=x.date?x.date.getTime():TODAY.getTime(); (parJour.get(k)||parJour.set(k,[]).get(k)).push(x); });
  const now=new Date(), ev=[...parJour.entries()].map(([t,xs],i)=>{ let d=new Date(t); d.setDate(d.getDate()-1); d.setHours(17,30,0,0); if(d<now){ d=new Date(now.getTime()+60*60000); }
    const fin=new Date(d.getTime()+30*60000), txt=s=>String(s).replace(/[\;,]/g,m=>"\\"+m).replace(/\n/g,"\\n");
    const resume="Courses : "+xs.map(x=>x.n).join(", "), desc=xs.map(x=>`- ${x.n} ${qtyOf(x)} ${LIEUX[x.lieu]} (pour ${x.plats.join(", ")||"la semaine"}, ${quand(x)})`).join("\n");
    return ["BEGIN:VEVENT",`UID:menus-${curIso()}-${i}-${now.getTime()}@menus-semaine`,`DTSTAMP:${f(now)}`,`DTSTART:${f(d)}`,`DTEND:${f(fin)}`,`SUMMARY:${txt(resume)}`,`DESCRIPTION:${txt(desc)}`,"BEGIN:VALARM","ACTION:DISPLAY",`DESCRIPTION:${txt(resume)}`,"TRIGGER:-PT0M","END:VALARM","END:VEVENT"].join("\r\n"); });
  return new Blob([["BEGIN:VCALENDAR","VERSION:2.0","PRODID:-//Menus de la semaine//FR","CALSCALE:GREGORIAN",...ev,"END:VCALENDAR"].join("\r\n")],{type:"text/calendar;charset=utf-8"}); }
document.addEventListener("change",e=>{ const s=e.target.closest&&e.target.closest("[data-mqlieu]"); if(!s) return; state.lieux={...(state.lieux||{}),[s.dataset.mqlieu]:s.value}; save(); renderManquants(); toast(`Noté : ${LIEUX[s.value]}`); });
document.addEventListener("click",async e=>{
  const ok=e.target.closest("[data-mqok]"); if(ok){ const k=ok.dataset.mqok; state.checked[k]=true; save(); renderCourses(); const it=coursesTrips()[0].find(i=>i.ck===k); toast(`${it?it.n:"Article"} acheté`,()=>{ delete state.checked[k]; save(); renderCourses(); },"Annuler"); return; }
  const tt=e.target.closest("[data-mqtout]"); if(tt){ const l=manquantsSemaine(); if(!l.length) return; const avant={...state.checked}; l.forEach(x=>state.checked[x.ck]=true); save(); renderCourses(); toast(`${l.length} article${l.length>1?"s":""} cochés comme achetés`,()=>{ state.checked=avant; save(); renderCourses(); },"Annuler"); return; }
  const ic=e.target.closest("[data-mqics]"); if(ic){ try{ const res=await DL.save({filename:`rappel-courses-${curIso()}.ics`,data:icsManquants()}); toast(res&&res.status==="shared"?"Rappel partagé : choisissez votre agenda":"Fichier de rappel téléchargé : ouvrez-le pour l'ajouter à votre agenda"); }catch(err){ toast("Rappel impossible sur cet appareil"); } return; }
});

// ===================== Historique des courses =====================
// Sources : les lignes des tickets lus (base privée de la famille), les listes de chaque semaine (menu + produits ajoutés)
// et les montants notés à la main. Rien n'est publié dans le dépôt.
function estIngredientMenu(n){ const k=norm(n); return Object.values(BYID).some(r=>r.ing.some(x=>norm(x[0])===k)); }
function historique(){
  const weeks={...state.weeks,...(typeof SEMAINES==="object"?SEMAINES:{})};
  weeks[curIso()]={...(weeks[curIso()]||{}),menu:state.week,ajouts:state.extras,tickets:state.tickets,coches:state.checked};
  const tks=Object.entries(TICKETS_PH).map(([id,t])=>({id,...t})).filter(t=>t.statut==="analyse");
  // achats réels
  const lignes=[]; tks.forEach(t=>{ const d=t.res.date||t.semaine; (t.res.lignes||[]).forEach(l=>lignes.push({...l,date:d,sem:t.semaine,mag:t.res.magasin||t.mag||"",n:l.i||l.p})); });
  // dépenses par semaine
  const dep={}; const addDep=(iso,v,est)=>{ if(!/^\d{4}-\d\d-\d\d$/.test(iso)) return; const o=dep[iso]||(dep[iso]={iso,reel:0,est:null}); o.reel+=v; if(est&&!o.est) o.est=est; };
  Object.entries(weeks).forEach(([iso,w])=>cleanTickets(w.tickets).forEach(x=>addDep(iso,x.montant,x.estime)));
  tks.filter(t=>!t.lie&&t.res.total).forEach(t=>addDep(t.semaine,t.res.total));
  const semaines=Object.values(dep).filter(x=>x.reel>0).sort((a,b)=>a.iso.localeCompare(b.iso));
  // produits : semaines où ils étaient sur la liste, achats réels
  const P=new Map(), get=n=>{ const k=norm(n); let o=P.get(k); if(!o){ o={n,listes:new Set(),achats:[],depense:0,qte:0,ray:null}; P.set(k,o); } return o; };
  Object.entries(weeks).forEach(([iso,w])=>{ if(!/^\d{4}-\d\d-\d\d$/.test(iso)) return;
    (Array.isArray(w.menu)?w.menu:[]).forEach(id=>BYID[id]&&BYID[id].ing.forEach(([n,,,ray])=>{ const o=get(n); o.listes.add(iso); o.ray=o.ray||ray; }));
    (Array.isArray(w.ajouts||w.extras)?(w.ajouts||w.extras):[]).forEach(x=>{ if(x&&x.n){ const o=get(String(x.n).slice(0,50)); o.listes.add(iso); o.ray=o.ray||x.ray; } }); });
  lignes.forEach(l=>{ const o=get(l.n); o.achats.push(l.date); o.depense+=l.m; o.qte+=l.q; o.ray=l.r||o.ray; if(l.mag) o.mag=l.mag; });
  const nbSem=Math.max(1,new Set([...Object.keys(weeks).filter(k=>/^\d{4}-\d\d-\d\d$/.test(k)&&(weeks[k].menu||[]).some(Boolean)),...tks.map(t=>t.semaine).filter(Boolean)]).size);
  const produits=[...P.values()].map(o=>{ const dates=[...new Set(o.achats)].sort(), sems=new Set([...o.listes,...lignes.filter(l=>norm(l.n)===norm(o.n)).map(l=>l.sem)]);
    let intervalle=null; if(dates.length>=2){ intervalle=Math.round((isoDate(dates[dates.length-1])-isoDate(dates[0]))/DAY/(dates.length-1)); }
    else if(sems.size>=2){ const ss=[...sems].sort(); intervalle=Math.round((isoDate(ss[ss.length-1])-isoDate(ss[0]))/DAY/(ss.length-1)); }
    const dernier=dates.length?dates[dates.length-1]:null, prochain=dernier&&intervalle?new Date(isoDate(dernier).getTime()+intervalle*DAY):null;
    return {...o,semaines:sems.size,dates,dernier,intervalle,prochain}; }).sort((a,b)=>b.semaines-a.semaines||b.depense-a.depense);
  const total=lignes.reduce((s,l)=>s+l.m,0), parRayon={}; lignes.forEach(l=>parRayon[l.r]=(parRayon[l.r]||0)+l.m);
  const md=lignes.filter(l=>l.md).reduce((s,l)=>s+l.m,0);
  return {weeks,tks,lignes,semaines,produits,total,parRayon,md,nbSem}; }
function barresH(items,max){ return `<div class="hbars">${items.map(([lab,v,extra])=>`<div class="hbar"><span class="hlab">${lab}</span><span class="htrack"><i style="width:${max?Math.max(2,Math.round(v/max*100)):0}%"></i></span><span class="hval">${extra||eur(v)}</span></div>`).join("")}</div>`; }
function renderHistorique(){ const H=historique(), c=sheetCtx, onglet=c.onglet||"apercu";
  $("seyebrow").textContent="Vos courses semaine après semaine"; $("stitle").textContent="Historique des courses";
  $("sextra").innerHTML=""; $("sfoot").innerHTML=`<button class="btn" data-histcsv="1">Exporter (tableur)</button><button class="btn primary" data-histfin="1">Fermer</button>`;
  const tabs=[["apercu","Aperçu"],["produits","Produits"],["prix","Prix"],["tickets","Tickets"]];
  let html=`<div class="gfilters histtabs" role="tablist">${tabs.map(([k,l])=>`<button class="chip${k===onglet?" on":""}" role="tab" aria-selected="${k===onglet}" data-histtab="${k}">${l}</button>`).join("")}</div>`;
  const peu=H.semaines.length<2&&H.tks.length<2;
  if(onglet==="apercu"){
    const tot=H.semaines.reduce((s,x)=>s+x.reel,0), moy=H.semaines.length?tot/H.semaines.length:0, der=H.semaines[H.semaines.length-1], av=H.semaines[H.semaines.length-2];
    const mois={}; H.semaines.forEach(x=>{ const k=x.iso.slice(0,7); mois[k]=(mois[k]||0)+x.reel; });
    const maxS=Math.max(1,...H.semaines.map(x=>Math.max(x.reel,x.est||0)));
    const ray=Object.entries(H.parRayon).sort((a,b)=>b[1]-a[1]), maxR=Math.max(1,...ray.map(x=>x[1]));
    const fl=(H.parRayon.fl||0)/(H.total||1), mdp=H.md/(H.total||1);
    const dus=H.produits.filter(p=>p.prochain&&p.prochain<=new Date(TODAY.getTime()+4*DAY)).slice(0,8);
    html+=`<div class="hkpis"><div><b>${eur(tot)}</b><small>dépensés en ${H.semaines.length} semaine${H.semaines.length>1?"s":""}</small></div><div><b>${eur(moy)}</b><small>par semaine en moyenne</small></div><div><b>${moy?eur(moy/5/7):"–"}</b><small>par personne et par jour (5 pers.)</small></div>${der&&av?`<div><b class="${der.reel>av.reel?"up":"down"}">${der.reel>av.reel?"+":"−"}${Math.abs(Math.round((der.reel-av.reel)/av.reel*100))} %</b><small>par rapport à la semaine d'avant</small></div>`:""}</div>
    ${H.semaines.length?`<h3 class="shopray">Dépenses par semaine</h3><div class="hcols">${H.semaines.slice(-12).map(x=>`<div class="hcol" title="Semaine du ${fmtShort(isoDate(x.iso))} : ${eur(x.reel)}${x.est?" (estimé "+eur(x.est)+")":""}"><span class="hstack"><i class="r" style="height:${Math.round(x.reel/maxS*100)}%"></i>${x.est?`<i class="e" style="height:${Math.round(x.est/maxS*100)}%"></i>`:""}</span><small>${fmtShort(isoDate(x.iso))}</small><b>${Math.round(x.reel)} €</b></div>`).join("")}</div>
      <p class="note"><i class="leg r"></i> payé <i class="leg e"></i> estimé par l'application${Object.keys(mois).length>1?" · "+Object.entries(mois).map(([k,v])=>`${MOIS[+k.slice(5)-1]} : ${eur(v)}`).join(" · "):""}</p>`:`<p class="note">Aucune dépense notée pour l'instant.</p>`}
    ${ray.length?`<h3 class="shopray">Où va l'argent (d'après les tickets lus)</h3>${barresH(ray.map(([r,v])=>[esc(RAYONS[r]||r),v,`${eur(v)} · ${Math.round(v/H.total*100)} %`]),maxR)}`:""}
    ${H.lignes.length?`<h3 class="shopray">Repères</h3><ul class="hreps">
      <li><b>${Math.round(fl*100)} %</b> du ticket en fruits et légumes ${fl<0.2?"<small>(repère courant : viser au moins 20 à 25 % du budget alimentaire)</small>":"<small>(bonne part)</small>"}</li>
      <li><b>${Math.round(mdp*100)} %</b> en marques de distributeur ${mdp<0.7?`<small>(passer aux marques du magasin pour les produits de base fait souvent gagner 20 à 40 % sur ces articles)</small>`:""}</li>
      ${(()=>{ const b=H.lignes.filter(l=>!l.md&&l.m>=3).sort((a,b)=>b.m-a.m).slice(0,3); return b.length?`<li>Plus grosses dépenses en marque nationale : ${b.map(l=>`${esc(l.p)} (${eur(l.m)})`).join(", ")}</li>`:""; })()}
    </ul>`:""}
    ${dus.length?`<h3 class="shopray">Probablement à racheter</h3><div class="gfilters wrap">${dus.map(p=>`<button class="chip" data-histadd="${esc(p.n)}" data-ray="${esc(p.ray||"epi")}">+ ${esc(p.n)}</button>`).join("")}</div>`:""}
    ${peu?`<p class="note hinfo">L'historique devient vraiment parlant après 3 ou 4 semaines : continuez à envoyer la photo de chaque ticket.</p>`:""}`;
  }
  if(onglet==="produits"){
    const dans=new Set([...(state.extras||[]).map(x=>norm(x.n)),...coursesTrips().flat().map(i=>norm(i.n))]);
    const l=H.produits.filter(p=>p.semaines>=1).slice(0,60);
    html+=`<p class="note">Les produits qui reviennent le plus souvent sur vos listes et vos tickets (${H.nbSem} semaine${H.nbSem>1?"s":""} d'historique). Touchez un nom pour sa fiche.</p>
    <div class="htable" role="table"><div class="hrow hhead" role="row"><span>Produit</span><span>Semaines</span><span>Dernier achat</span><span>Dépensé</span><span></span></div>
    ${l.map(p=>{ const pr=promosFor(p.n).filter(x=>isoDate(x.au)>=TODAY)[0]; const deja=dans.has(norm(p.n));
      return `<div class="hrow" role="row"><span>${produitDe(p.n)?`<button type="button" class="linkbtn" data-prod="${esc(p.n)}">${esc(p.n)}</button>`:esc(p.n)}${pr?`<small class="hpromo">En promo chez ${esc(ENS[pr.mag])} : ${eur(pr.prix)}</small>`:""}${p.intervalle?`<small>tous les ${p.intervalle} jours environ${p.prochain?` · prochain vers le ${fmtShort(p.prochain)}`:""}</small>`:""}</span>
        <span>${p.semaines}/${H.nbSem}</span><span>${p.dernier?fmtShort(isoDate(p.dernier)):"–"}</span><span>${p.depense?eur(p.depense):"–"}</span>
        <span>${deja?`<small>sur la liste</small>`:`<button type="button" class="sbtn" data-histadd="${esc(p.n)}" data-ray="${esc(p.ray||"epi")}" aria-label="Ajouter ${esc(p.n)} à la liste">+</button>`}</span></div>`; }).join("")}</div>`;
  }
  if(onglet==="prix"){
    const ev=Object.entries(PRIX_DETAIL).map(([n,l])=>{ const s=[...l].sort((a,b)=>a.date.localeCompare(b.date)); const a=s[0], z=s[s.length-1]; const ref=(PRODUITS_REF[n]||null);
      const ad=s.filter(x=>x.date===a.date&&x.u===a.u), zd=s.filter(x=>x.date===z.date&&x.u===z.u), moy=l=>l.reduce((t,x)=>t+x.p,0)/l.length;
      return {n,l:s,a,z:{...z,p:Math.round(moy(zd)*100)/100},var:a.date!==z.date&&a.u===z.u?(moy(zd)-moy(ad))/moy(ad):null,ref}; });
    const varies=ev.filter(x=>x.var!=null).sort((a,b)=>Math.abs(b.var)-Math.abs(a.var));
    const ecarts=ev.filter(x=>x.ref&&x.ref[1]===x.z.u).map(x=>({...x,e:(x.z.p-x.ref[0])/x.ref[0]})).sort((a,b)=>b.e-a.e);
    html+=`${varies.length?`<h3 class="shopray">Évolution de vos prix</h3>${barresH(varies.slice(0,15).map(x=>[esc(x.n),Math.abs(x.var),`${x.var>0?"+":"−"}${Math.abs(Math.round(x.var*100))} % · ${eur(x.z.p)}/${x.z.u}`]),Math.max(...varies.map(x=>Math.abs(x.var))))}`:`<p class="note">L'évolution des prix apparaîtra dès qu'un même produit figurera sur 2 tickets.</p>`}
      ${ecarts.length?`<h3 class="shopray">Vos prix comparés aux estimations</h3>${barresH(ecarts.slice(0,15).map(x=>[esc(x.n),Math.abs(x.e),`${x.e>0?"+":"−"}${Math.abs(Math.round(x.e*100))} % · ${eur(x.z.p)} au lieu de ${eur(x.ref[0])}`]),Math.max(...ecarts.map(x=>Math.abs(x.e))))}`:""}
      <p class="note">Plus vous envoyez de tickets (et de magasins différents), plus les comparaisons sont fiables.</p>`;
  }
  if(onglet==="tickets"){
    const grp=new Map(); H.tks.forEach(t=>{ const k=(t.res.date||t.semaine)+"|"+norm(t.res.magasin||t.mag||""); const g=grp.get(k)||{d:t.res.date||t.semaine,mag:t.res.magasin||t.mag,total:null,tot2:null,l:[],note:"",photos:0};
      g.photos++; if(t.res.total) g.tot2=Math.max(g.tot2||0,t.res.total); if(!t.lie&&t.res.total) g.total=(g.total||0)+t.res.total; g.l.push(...(t.res.lignes||[])); grp.set(k,g); });
    const list=[...[...grp.values()].map(g=>({...g,note:g.photos>1?`Ticket envoyé en ${g.photos} photos.`:""})),
      ...Object.entries(H.weeks).flatMap(([iso,w])=>cleanTickets(w.tickets).map(x=>({d:(x.quand||iso).slice(0,10),mag:x.mag,total:x.montant,l:[],manuel:true})))].sort((a,b)=>String(b.d).localeCompare(String(a.d)));
    html+=list.length?list.map(t=>`<details class="panel htk"><summary><b>${t.d?new Date(t.d).toLocaleDateString("fr-BE",{weekday:"short",day:"numeric",month:"short"}):""}</b> · ${esc(t.mag||"Magasin")}${t.total?` · ${eur(t.total)}`:t.tot2?` · ${eur(t.tot2)}`:""}${t.manuel?" <small>(montant noté)</small>":t.l.length?` <small>(${t.l.length} articles)</small>`:""}</summary>
      ${t.l.length?`<div class="hlignes">${t.l.map(l=>`<div><span>${esc(l.p)}${l.md?' <small class="md">marque magasin</small>':""}</span><span>${l.q!==1?String(l.q).replace(".",",")+(l.u==="u"?" ×":" "+l.u):""}</span><b>${eur(l.m)}</b></div>`).join("")}</div>`:`<p class="note">${t.manuel?"Montant noté à la main, sans le détail des articles.":"Détail non disponible."}</p>`}${t.note?`<p class="note">${esc(t.note)}</p>`:""}</details>`).join(""):`<p class="note">Aucun ticket pour l'instant.</p>`;
  }
  $("sbody").innerHTML=html; }
const PRODUITS_REF={};
function exporterHistorique(){ const H=historique(); const sep=";", q=v=>`"${String(v==null?"":v).replace(/"/g,'""')}"`;
  const rows=[["Date","Magasin","Article","Produit de l'application","Rayon","Quantité","Unité","Montant (€)","Marque magasin"].map(q).join(sep),
    ...H.lignes.map(l=>[l.date,l.mag,l.p,l.i,RAYONS[l.r]||l.r,String(l.q).replace(".",","),l.u,String(l.m).replace(".",","),l.md?"oui":"non"].map(q).join(sep))];
  return new Blob(["﻿"+rows.join("\r\n")],{type:"text/csv;charset=utf-8"}); }
document.addEventListener("click",async e=>{
  const o=e.target.closest("[data-histo]"); if(o){ openSheet({type:"historique",onglet:"apercu"}); return; }
  const t=e.target.closest("[data-histtab]"); if(t&&sheetCtx){ sheetCtx.onglet=t.dataset.histtab; renderHistorique(); $("sbody").scrollTop=0; return; }
  const f=e.target.closest("[data-histfin]"); if(f){ closeSheet(); return; }
  const a=e.target.closest("[data-histadd]"); if(a){ const n=a.dataset.histadd; if((state.extras||[]).some(y=>norm(y.n)===norm(n))){ toast(`${n} est déjà dans la liste`); return; } ajouterProduit(n,a.dataset.ray||"epi",""); if(sheetCtx&&sheetCtx.type==="historique") renderHistorique(); return; }
  const c=e.target.closest("[data-histcsv]"); if(c){ try{ const res=await DL.save({filename:`historique-courses-${curIso()}.csv`,data:exporterHistorique()}); toast(res&&res.status==="shared"?"Historique partagé":"Historique téléchargé (s'ouvre dans Excel ou Google Sheets)"); }catch(err){ toast("Export impossible sur cet appareil"); } return; }
});

// ===================== Propositions de recettes par la famille =====================
// Un lien, une envie en quelques mots, ou la photo d'une recette : la tâche du lundi et du mercredi en fait une recette de la bibliothèque.
let SUGG={}, unsubSugg=null, suggForm={type:"lien",photo:null};
function cleanSugg(x){ if(!x||typeof x!=="object") return null; const st=["attente","ajoutee","refusee"].includes(x.statut)?x.statut:"attente";
  return {nom:propre(x.nom,30),type:["lien","envie","photo"].includes(x.type)?x.type:"envie",texte:propre(x.texte,600),
    url:typeof x.url==="string"&&/^https?:\/\/[^\s"<>]{3,400}$/.test(x.url)?x.url:"",photo:typeof x.photo==="string"&&/^data:image\/jpeg;base64,[A-Za-z0-9+/=]+$/.test(x.photo)&&x.photo.length<380000?x.photo:null,
    quand:typeof x.quand==="string"?x.quand.slice(0,40):"",statut:st,recette:typeof x.recette==="string"&&/^[a-z0-9]{2,40}$/.test(x.recette)?x.recette:null,note:propre(x.note,300)}; }
function subscribeSugg(){ if(!DB) return; if(unsubSugg) unsubSugg();
  unsubSugg=DB.collection("suggestions").onSnapshot(q=>{ q.docChanges().forEach(c=>{ if(c.type==="removed") delete SUGG[c.doc.id]; else { const v=cleanSugg(c.doc.data()); if(v) SUGG[c.doc.id]=v; } }); if(state.tab==="envies") renderEnvies(); },()=>{}); }
function compresserPhoto(file){ return new Promise((ok,ko)=>{ const img=new Image(), url=URL.createObjectURL(file);
  img.onload=()=>{ let w=img.naturalWidth, h=img.naturalHeight, m=Math.min(1,1400/Math.max(w,h)); const c=document.createElement("canvas"); c.width=Math.round(w*m); c.height=Math.round(h*m);
    c.getContext("2d").drawImage(img,0,0,c.width,c.height); URL.revokeObjectURL(url); let q=0.75, d=c.toDataURL("image/jpeg",q);
    while(d.length>330000&&q>0.3){ q-=0.1; d=c.toDataURL("image/jpeg",q); } if(d.length>370000){ const c2=document.createElement("canvas"); c2.width=Math.round(c.width*0.7); c2.height=Math.round(c.height*0.7); c2.getContext("2d").drawImage(c,0,0,c2.width,c2.height); d=c2.toDataURL("image/jpeg",0.6); }
    ok(d); }; img.onerror=()=>{ URL.revokeObjectURL(url); ko(new Error("image")); }; img.src=url; }); }
function htmlSuggestions(){ const qui=envQui||(window.__acces&&window.__acces()&&window.__acces().nom)||"";
  const T=[["lien","🔗 Un lien internet"],["envie","💬 Une envie, une idée"],["photo","📷 La photo d'une recette"]], f=suggForm;
  const liste=Object.entries(SUGG).sort((a,b)=>String(b[1].quand).localeCompare(String(a[1].quand)));
  return `<div class="panel" id="suggbox"><h2>Proposer une recette</h2>
    <p>Un plat que vous aimeriez manger ? Donnez un lien vers une recette, décrivez votre envie (« des lasagnes végétariennes », « un plat thaï pas trop épicé ») ou photographiez une page de livre. Les propositions sont ajoutées à la bibliothèque le lundi ou le mercredi.</p>
    <div class="gfilters wrapchips">${T.map(([k,l])=>`<button class="chip${f.type===k?" on":""}" data-sgtype="${k}" type="button">${l}</button>`).join("")}</div>
    <form class="addrform" id="suggform" autocomplete="off">
      ${f.type==="lien"?`<label class="wfield">Lien de la recette<input id="sg-url" type="url" inputmode="url" maxlength="400" placeholder="https://www.exemple.be/recette-de-…" required></label>`:""}
      ${f.type==="photo"?`<label class="wfield">Photo de la recette<input id="sg-photo" type="file" accept="image/*" capture="environment"></label>${f.photo?`<img class="sgprev" src="${f.photo}" alt="Aperçu de la photo">`:""}`:""}
      <label class="wfield">${f.type==="envie"?"Votre envie":"Un mot sur cette recette (facultatif)"}<textarea id="sg-texte" rows="3" maxlength="600" placeholder="${f.type==="envie"?"Ex. : un gratin de chicons, des wraps végétariens, quelque chose avec du saumon…":"Ex. : on l'a mangée chez mamie, sans les champignons pour les enfants"}"${f.type==="envie"?" required":""}></textarea></label>
      <label class="wfield">Proposé par<select id="sg-nom" class="pick">${state.family.map(n=>`<option${n===qui?" selected":""}>${esc(n)}</option>`).join("")}<option value="">Quelqu'un de la famille</option></select></label>
      <button class="btn primary edit-only" type="submit">Envoyer la proposition</button>
    </form>
    ${liste.length?`<h3 class="shopray">Propositions de la famille (${liste.length})</h3><div class="sglist">${liste.map(([id,x])=>{ const r=x.recette&&BYID[x.recette];
      const st=x.statut==="ajoutee"?`<span class="bdg b-eco">Ajoutée</span>`:x.statut==="refusee"?`<span class="bdg b-plaisir">Pas retenue</span>`:`<span class="bdg b-moyen">En attente</span>`;
      return `<div class="sgitem">${x.photo?`<img src="${x.photo}" alt="">`:`<span class="sgicon" aria-hidden="true">${x.type==="lien"?"🔗":"💬"}</span>`}<span class="sginfo"><b>${esc(x.texte||x.url||"Photo d'une recette")}</b>
        <small>${st} ${esc(x.nom||"Quelqu'un")} · ${x.quand?new Date(x.quand).toLocaleDateString("fr-BE"):""}${x.url?` · <a href="${esc(x.url)}" target="_blank" rel="noopener noreferrer">voir le lien</a>`:""}</small>
        ${r?`<small>Devenue : <button class="link" data-openrec="${r.id}" type="button">${esc(r.nom)}</button></small>`:x.statut==="ajoutee"?`<small>La recette arrive à la prochaine mise à jour.</small>`:""}${x.note?`<small>${esc(x.note)}</small>`:""}</span>
        <button class="sbtn owner-only" data-sgdel="${esc(id)}" type="button" aria-label="Supprimer cette proposition">×</button></div>`; }).join("")}</div>`:""}
  </div>`; }
document.addEventListener("click",async e=>{ const o=e.target.closest("#suggbox [data-openrec]"); if(o){ openMeal(o.dataset.openrec,null); return; }
  const o2=e.target.closest("[data-openrec2]"); if(o2){ openMeal(o2.dataset.openrec2,null); return; }
  const b=e.target.closest("[data-sgtype],[data-sgdel]"); if(!b) return;
  if(b.dataset.sgtype){ suggForm={type:b.dataset.sgtype,photo:null}; renderEnvies(); return; }
  if(b.dataset.sgdel){ const id=b.dataset.sgdel; if(!DB) { delete SUGG[id]; renderEnvies(); return; } try{ await DB.collection("suggestions").doc(id).delete(); toast("Proposition supprimée"); }catch(err){ toast("Seul le propriétaire peut supprimer une proposition"); } } });
document.addEventListener("change",async e=>{ if(e.target.id!=="sg-photo") return; const f=e.target.files&&e.target.files[0]; if(!f) return;
  try{ suggForm.photo=await compresserPhoto(f); renderEnvies(); const s=$("suggbox"); if(s) s.scrollIntoView({block:"start"}); }catch(err){ toast("Cette photo n'a pas pu être lue"); } });
document.addEventListener("submit",async e=>{ if(e.target.id!=="suggform") return; e.preventDefault();
  const f=suggForm, texte=($("sg-texte")||{}).value||"", url=(($("sg-url")||{}).value||"").trim(), nom=($("sg-nom")||{}).value||"";
  if(f.type==="lien"&&!/^https?:\/\/\S{3,}$/.test(url)){ toast("Collez le lien complet de la recette (il commence par https://)"); return; }
  if(f.type==="photo"&&!f.photo){ toast("Choisissez d'abord une photo"); return; }
  if(f.type==="envie"&&texte.trim().length<3){ toast("Décrivez votre envie en quelques mots"); return; }
  const doc=cleanSugg({nom,type:f.type,texte,url,photo:f.photo,quand:new Date().toISOString(),statut:"attente"}); const id=Date.now().toString(36)+"-"+slugNom(nom||"famille");
  if(!DB){ SUGG[id]=doc; suggForm={type:f.type,photo:null}; renderEnvies(); toast("Proposition notée sur cet appareil (partage non activé)"); return; }
  try{ await DB.collection("suggestions").doc(id).set(doc); suggForm={type:f.type,photo:null}; toast("Merci ! Votre proposition sera ajoutée lundi ou mercredi"); }
  catch(err){ toast("La proposition n'a pas pu être envoyée. Réessayez dans un instant."); } });

// ===================== Envies : sondage, goûts de chacun et plannings suggérés =====================
const ENVIE=[[1,"😍","J'en ai envie"],[0,"😐","Bof"],[-1,"🙅","Non merci"]];
const PREF_VEGE=[[0,"Jamais"],[1,"1 soir"],[2,"2 soirs ou plus"]];
const PREF_NEW=[["classiques","Nos classiques"],["unpeu","Un peu de nouveau"],["beaucoup","Beaucoup de nouveautés"]];
const PREF_PIQ=[["non","Pas épicé"],["unpeu","Un peu"],["oui","J'aime le piquant"]];
let SONDAGE={}, unsubSondage=null;
try{ const loc=JSON.parse(localStorage.getItem(KEY+"-sondage")||"{}"); if(loc&&typeof loc==="object") SONDAGE=loc; }catch(e){}
const saveSondageLocal=()=>{ try{ localStorage.setItem(KEY+"-sondage",JSON.stringify(SONDAGE)); }catch(e){} };
function cleanSondage(x){ if(!x||typeof x!=="object"||typeof x.nom!=="string") return null; const env={};
  if(x.envies&&typeof x.envies==="object") Object.entries(x.envies).forEach(([k,v])=>{ if(BYID[k]&&[1,0,-1].includes(v)) env[k]=v; });
  const p=x.prefs&&typeof x.prefs==="object"?x.prefs:{};
  return {nom:propre(x.nom,30),envies:env,quand:typeof x.quand==="string"?x.quand:null,
    prefs:{cuisines:Array.isArray(p.cuisines)?p.cuisines.filter(c=>CUISINES[c]):[],vege:[0,1,2].includes(p.vege)?p.vege:null,
      nouveautes:PREF_NEW.some(([k])=>k===p.nouveautes)?p.nouveautes:null,piquant:PREF_PIQ.some(([k])=>k===p.piquant)?p.piquant:null}}; }
function subscribeSondage(){ if(!DB) return; if(unsubSondage) unsubSondage();
  unsubSondage=DB.collection("sondage").onSnapshot(q=>{ q.docChanges().forEach(c=>{ if(c.type==="removed") delete SONDAGE[c.doc.id]; else { const v=cleanSondage(c.doc.data()); if(v) SONDAGE[c.doc.id]=v; } });
    saveSondageLocal(); if(state.tab==="envies") renderEnvies(); },()=>{}); }
const sondageDe = n => SONDAGE[slugNom(n)] || {nom:n,envies:{},prefs:{cuisines:[],vege:null,nouveautes:null,piquant:null},quand:null};
let envWrite={};
function majSondage(n,fn){ const cur=JSON.parse(JSON.stringify(sondageDe(n))); fn(cur); cur.nom=n; cur.quand=new Date().toISOString();
  const id=slugNom(n); SONDAGE[id]=cleanSondage(cur); saveSondageLocal(); renderEnvies();
  if(DB){ clearTimeout(envWrite[id]); envWrite[id]=setTimeout(()=>{ DB.collection("sondage").doc(id).set(SONDAGE[id]).catch(()=>toast("Réponse gardée sur cet appareil : le partage a échoué")); },600); } }
// ---- Ce que l'on sait des goûts de chacun ----
function servisIds(){ const s=new Set(); Object.values({...state.weeks,...SEMAINES}).forEach(w=>{ if(w&&Array.isArray(w.menu)) w.menu.forEach(id=>s.add(id)); }); Object.values(RETOURS).forEach(r=>s.add(r.plat)); return s; }
function profil(n){ const sd=sondageDe(n), mine=Object.values(RETOURS).filter(r=>r.nom===n&&r.note&&BYID[r.plat]);
  const parC={}, parP={}; mine.forEach(r=>{ const x=BYID[r.plat]; if(x.c)(parC[x.c]=parC[x.c]||[]).push(r.note); if(x.p)(parP[x.p]=parP[x.p]||[]).push(r.note); });
  Object.entries(sd.envies).forEach(([id,v])=>{ const x=BYID[id]; if(x&&x.c&&v!==0)(parC[x.c]=parC[x.c]||[]).push(v>0?4.5:1.5); });
  const cuis=Object.fromEntries(Object.entries(parC).map(([k,v])=>[k,moy(v)])), prot=Object.fromEntries(Object.entries(parP).map(([k,v])=>[k,moy(v)]));
  const nbAvis=Object.keys(state.avis).filter(id=>(state.avis[id]||{})[n]).length;
  return {sd,mine,cuis,prot,signaux:mine.length+Object.keys(sd.envies).length+nbAvis+(sd.prefs.cuisines.length?3:0)}; }
const PIQUANT=new Set(["chili","sincarne","fajitas","tacos","couscous","kefta","arrabbiata","curry","dahl","pouletcurry"]);
// Affinité d'une personne pour un plat : retours (le plus fiable), goûts déclarés, sondage, cuisines et viandes aimées
function affinite(n,r,P){ P=P||profil(n); let a=0, w=0;
  const notes=P.mine.filter(x=>x.plat===r.id).map(x=>x.note); if(notes.length){ a+=(moy(notes)-3)*1.1*Math.min(1,notes.length/2+0.3); w++; }
  const av=(state.avis[r.id]||{})[n]; if(av){ a+=av*0.9; w++; }
  const e=P.sd.envies[r.id]; if(e!=null){ a+=e===1?0.9:e===-1?-1.2:-0.1; w++; }
  if(r.c&&P.sd.prefs.cuisines.includes(r.c)) a+=0.4; if(r.c&&P.cuis[r.c]!=null) a+=(P.cuis[r.c]-3)*0.25; if(r.p&&P.prot[r.p]!=null) a+=(P.prot[r.p]-3)*0.2;
  if((state.exclus[n]||[]).some(x=>r.ing.some(([i])=>i===x))) a-=2.5;
  if(P.sd.prefs.piquant==="non"&&PIQUANT.has(r.id)) a-=0.5; if(P.sd.prefs.piquant==="oui"&&PIQUANT.has(r.id)) a+=0.3;
  return a; }
function scoreFamille(r,profs){ const fam=state.family; if(!fam.length) return 0; profs=profs||Object.fromEntries(fam.map(n=>[n,profil(n)]));
  const v=fam.map(n=>affinite(n,r,profs[n])); return moy(v)+Math.min(0,Math.min(...v)+1)*0.6; }
// préférences de groupe : nouveautés et soirs sans viande (moyenne des réponses)
function prefsGroupe(){ const l=state.family.map(n=>sondageDe(n).prefs); const nv=l.map(p=>({classiques:0,unpeu:1,beaucoup:2})[p.nouveautes]).filter(x=>x!=null), vg=l.map(p=>p.vege).filter(x=>x!=null);
  return {nouveautes:nv.length?moy(nv):1,vege:vg.length?Math.round(moy(vg)):null}; }
// ---- Plannings suggérés pour les semaines à venir ----
let PLANS={}, envCible=1, envQui=null;
try{ envQui=localStorage.getItem(KEY+"-moi"); }catch(e){}
function genPlans(off){ const profs=Object.fromEntries(state.family.map(n=>[n,profil(n)])), fam={}; RECETTES.forEach(r=>{ fam[r.id]=scoreFamille(r,profs); });
  const servis=servisIds(), G=prefsGroupe(), avoid=new Set(state.week);
  const novel=r=>!servis.has(r.id), cost=r=>{ try{ return r.ing.reduce((s,[n,q,u,ray])=>s+itemCost(n,u,q,ray,"eco"),0)/5; }catch(e){ return 2; } };
  const vegeBonus=r=>G.vege&&(r.p==="vege"||r.p==="oeufs")?0.6*G.vege:0;
  const defs=[
    {k:"famille",t:"Le préféré de la famille",d:"Les plats qui plaisent au plus grand nombre, d'après les retours et le sondage.",x:r=>fam[r.id]*2.2+vegeBonus(r)},
    {k:"decouverte",t:"Découverte",d:`Deux ou trois plats jamais servis, choisis parmi ceux qui font envie.`,x:r=>fam[r.id]*1.4+(novel(r)?1.2+0.6*G.nouveautes:0)+vegeBonus(r)},
    {k:"budget",t:"Petit budget",d:"Surtout des plats économiques, sans renoncer à ce que la famille aime.",x:r=>fam[r.id]*1.2-cost(r)*1.3+vegeBonus(r),mix:{plaisir:0,moyen:1}}];
  return defs.map(D=>{ const menu=proposeMenu({extra:D.x,mix:D.mix,avoid,out:outList(null)}); return {...D,menu}; }); }
function evalPlan(menu){ const home=[0,1,2,3,4,5,6].filter(d=>!outList(null).includes(d)), profs=Object.fromEntries(state.family.map(n=>[n,profil(n)]));
  let ok=0, tot=0, cout=0; const rows=home.map(d=>{ const r=BYID[menu[d]], aff=state.family.map(n=>[n,affinite(n,r,profs[n])]);
    aff.forEach(([,a])=>{ tot++; if(a>-0.2) ok++; }); try{ cout+=r.ing.reduce((s,[n,q,u,ray])=>s+itemCost(n,u,q,ray,"eco"),0); }catch(e){}
    return {d,r,fans:aff.filter(([,a])=>a>=0.6).map(([n])=>n),contre:aff.filter(([,a])=>a<=-0.8).map(([n])=>n)}; });
  return {rows,satis:tot?ok/tot:null,cout}; }
function renderEnvies(){ const box=$("view-envies"); if(!box) return;
  const fam=state.family; if(!envQui||!fam.includes(envQui)) envQui=fam.find(n=>window.__acces&&window.__acces()&&norm(window.__acces().nom)===norm(n))||null;
  if(!fam.length){ box.innerHTML=`<div class="panel"><h2>Envies</h2><p>Ajoutez d'abord les membres de la famille dans l'onglet Famille : chacun pourra ensuite répondre au sondage.</p></div>`; return; }
  const repondu=fam.filter(n=>Object.keys(sondageDe(n).envies).length>=5||sondageDe(n).prefs.cuisines.length);
  const lundi=o=>{ const m=new Date(BASE_MONDAY); m.setDate(m.getDate()+7*o); return m; };
  const key=envCible+"|"+state.family.join(","); if(!PLANS[key]) PLANS[key]=genPlans(envCible);
  // --- 1. Le sondage ---
  let html=`<div class="panel"><div class="phead"><h2>Sondage des envies</h2><span class="st ${repondu.length===fam.length?"on":"soon"}">${repondu.length}/${fam.length} ont répondu</span></div>
    <p>Chacun dit ce qui lui fait envie. Les réponses, avec les avis donnés après les repas, guident les menus proposés.</p>
    <div class="wfield">Qui répond ?<div class="gfilters">${fam.map(n=>`<button class="chip${envQui===n?" on":""}" data-envqui="${esc(n)}">${esc(n)}${repondu.includes(n)?" ✓":""}</button>`).join("")}</div></div>
    <div class="actions"><button class="btn" id="envinvite">Copier l'invitation au sondage</button></div>`;
  if(envQui){ const sd=sondageDe(envQui), p=sd.prefs;
    const q=(lab,k,opts,cur)=>`<div class="envq"><b>${lab}</b><div class="gfilters wrapchips">${opts.map(([v,l])=>`<button class="chip${cur===v?" on":""}" data-envpref="${k}" data-v="${v}">${l}</button>`).join("")}</div></div>`;
    html+=`<h3 class="shopray">${esc(envQui)}, vos préférences</h3>
      <div class="envq"><b>Les cuisines que vous aimez</b><div class="gfilters wrapchips">${Object.entries(CUISINES).map(([k,l])=>`<button class="chip${p.cuisines.includes(k)?" on":""}" data-envcuis="${k}">${l}</button>`).join("")}</div></div>
      ${q("Soirs sans viande par semaine","vege",PREF_VEGE,p.vege)}${q("Nouveautés","nouveautes",PREF_NEW,p.nouveautes)}${q("Épicé","piquant",PREF_PIQ,p.piquant)}`;
    // 8 plats à la fois : d'abord ceux sur lesquels on ne sait encore rien
    const P=profil(envQui), servis=servisIds();
    const inconnus=RECETTES.filter(r=>sd.envies[r.id]==null&&!(state.avis[r.id]||{})[envQui]&&!P.mine.some(x=>x.plat===r.id));
    const tri=inconnus.map(r=>({r,s:(servis.has(r.id)?0:1)+(r.c&&p.cuisines.includes(r.c)?0.5:0)+((r.id.charCodeAt(0)*7+r.id.length*13+(envCible))%10)/10})).sort((a,b)=>b.s-a.s).slice(0,8).map(x=>x.r);
    const nbRep=Object.keys(sd.envies).length;
    html+=`<h3 class="shopray">Ces plats vous font-ils envie ? <span class="badge">${nbRep} réponse${nbRep>1?"s":""}</span></h3>
      ${tri.length?`<div class="envgrid">${tri.map(r=>`<div class="envcard"><img src="${photoSrc(r.id)}" alt="" loading="lazy" data-cache-err="1" decoding="async"><div class="envtxt"><b>${esc(r.nom)}</b><small><span class="bdg b-${budgetOf(r)}">${BUDGETS[budgetOf(r)].court}</span> ${r.t} min${r.c?" · "+CUISINES[r.c]:""}${servis.has(r.id)?"":" · jamais servi"}</small></div>
        <div class="envbtns">${ENVIE.map(([v,e,l])=>`<button class="envbtn" data-envie="${r.id}" data-v="${v}" title="${l}" aria-label="${l} : ${esc(r.nom)}"><span>${e}</span><small>${l}</small></button>`).join("")}</div></div>`).join("")}</div>
        <p class="note">Chaque réponse fait apparaître un nouveau plat. Revenez quand vous voulez : les nouvelles recettes de la bibliothèque s'ajoutent ici.</p>`
      :`<p class="note">Vous avez donné votre avis sur toutes les recettes. Merci !</p>`}
      ${nbRep?`<details class="homeadv"><summary>Revoir mes réponses (${nbRep})</summary><div class="envmine">${Object.entries(sd.envies).map(([id,v])=>`<span class="chip on" data-envreset="${id}">${ENVIE.find(x=>x[0]===v)[1]} ${esc(BYID[id].nom)} ×</span>`).join("")}</div><p class="note">Touchez une réponse pour l'effacer.</p></details>`:""}`;
  } else html+=`<p class="note">Choisissez votre prénom pour répondre.</p>`;
  html+=`</div>`;
  html+=htmlSuggestions();
  // --- 2. Les goûts de chacun ---
  // Ce que disent les réponses au sondage, tous ensemble
  const votes={}; fam.forEach(n=>Object.entries(sondageDe(n).envies).forEach(([id,v])=>{ if(!BYID[id]) return; (votes[id]=votes[id]||{plus:[],moins:[]}); if(v===1) votes[id].plus.push(n); if(v===-1) votes[id].moins.push(n); }));
  const unan=Object.entries(votes).filter(([,v])=>v.plus.length>=Math.min(3,Math.max(2,repondu.length-1))&&!v.moins.length).sort((a,b)=>b[1].plus.length-a[1].plus.length);
  const divise=Object.entries(votes).filter(([,v])=>v.plus.length&&v.moins.length).sort((a,b)=>(b[1].plus.length+b[1].moins.length)-(a[1].plus.length+a[1].moins.length));
  const rejet=Object.entries(votes).filter(([,v])=>v.moins.length>=2&&v.moins.length>v.plus.length);
  const pasRep=fam.filter(n=>!repondu.includes(n));
  if(Object.keys(votes).length) html+=`<div class="panel"><h2>Ce que dit le sondage</h2>
    <p class="note">${repondu.length} réponse${repondu.length>1?"s":""} sur ${fam.length}${pasRep.length?` · pas encore répondu : ${pasRep.map(esc).join(", ")}`:""}. Les menus proposés en tiennent compte.</p>
    ${unan.length?`<h3 class="shopray">Font l'unanimité</h3><div class="envmine">${unan.slice(0,12).map(([id,v])=>`<button class="chip on" data-openrec2="${id}" type="button">😍 ${esc(BYID[id].nom)} · ${v.plus.length}</button>`).join("")}</div>`:""}
    ${divise.length?`<h3 class="shopray">Divisent la famille</h3><div class="sondiv">${divise.slice(0,8).map(([id,v])=>`<div><b>${esc(BYID[id].nom)}</b><small>👍 ${v.plus.map(esc).join(", ")} · 👎 ${v.moins.map(esc).join(", ")}</small></div>`).join("")}</div><p class="note">À servir quand les amateurs sont là, ou avec une variante.</p>`:""}
    ${rejet.length?`<h3 class="shopray">À éviter</h3><p>${rejet.map(([id,v])=>`${esc(BYID[id].nom)} (${v.moins.map(esc).join(", ")})`).join(" · ")}</p>`:""}
  </div>`;
  html+=`<div class="panel"><h2>Les goûts de chacun</h2><p class="note">Ce profil se précise à chaque avis et chaque réponse au sondage.</p><div class="rtpeople">${fam.map(n=>{ const P=profil(n);
    const cu=Object.entries(P.cuis).filter(([,m])=>m>=3.8).sort((a,b)=>b[1]-a[1]).map(([k])=>CUISINES[k]); P.sd.prefs.cuisines.forEach(c=>{ if(!cu.includes(CUISINES[c])) cu.push(CUISINES[c]); });
    const aff=RECETTES.map(r=>({r,a:affinite(n,r,P)})).sort((a,b)=>b.a-a.a), top=aff.filter(x=>x.a>=0.8).slice(0,3), bas=aff.filter(x=>x.a<=-0.8).slice(-3).reverse();
    const fiab=P.signaux>=25?"bien connu":P.signaux>=8?"en cours":"à découvrir";
    return `<div class="rtpers"><b>${esc(n)} <span class="bdg ${P.signaux>=25?"b-eco":P.signaux>=8?"b-moyen":"b-plaisir"}">Profil ${fiab}</span></b>
      <small>${P.signaux} indice${P.signaux>1?"s":""} : ${P.mine.length} avis sur des repas, ${Object.keys(P.sd.envies).length} réponses au sondage</small>
      ${cu.length?`<small>Cuisines aimées : ${cu.slice(0,4).join(", ")}</small>`:""}
      ${top.length?`<small>Envies : ${top.map(x=>esc(x.r.nom)).join(", ")}</small>`:""}
      ${bas.length?`<small class="rtwarn">À éviter : ${bas.map(x=>esc(x.r.nom)).join(", ")}</small>`:""}
      ${P.sd.prefs.vege!=null?`<small>Sans viande : ${PREF_VEGE.find(x=>x[0]===P.sd.prefs.vege)[1].toLowerCase()} par semaine</small>`:""}</div>`; }).join("")}</div></div>`;
  // --- 3. Plannings suggérés ---
  html+=`<div class="panel"><div class="phead"><h2>Plannings suggérés</h2><button class="btn" id="envregen" data-tip="Calcule trois nouveaux plannings">Autres suggestions</button></div>
    <div class="gfilters">${[1,2,3].map(o=>`<button class="chip${envCible===o?" on":""}" data-envweek="${o}">Semaine du ${fmtShort(lundi(o))}</button>`).join("")}</div>
    <p class="note">Trois façons d'organiser la semaine, selon les goûts connus aujourd'hui. Chaque planning respecte les règles de budget et de variété.</p>
    <div class="plans">${PLANS[key].map((pl,i)=>{ const E=evalPlan(pl.menu);
      return `<article class="plan"><div class="planhead"><b>${pl.t}</b><span class="planstats">${E.satis!=null?`${Math.round(E.satis*100)} % d'assiettes appréciées`:""} · ≈ ${eur(E.cout)}</span></div><p class="note">${pl.d}</p>
        <ol class="planlist">${E.rows.map(x=>`<li><span class="pday">${JOURS[x.d].slice(0,3)}</span><span class="pinfo"><b>${esc(x.r.nom)}</b><small><span class="bdg b-${budgetOf(x.r)}">${BUDGETS[budgetOf(x.r)].court}</span>${x.r.c?" "+CUISINES[x.r.c]:""}${x.fans.length?` · plaira à ${x.fans.map(esc).join(", ")}`:""}</small>${x.contre.length?`<small class="rtwarn">${x.contre.map(esc).join(", ")} : pas trop envie</small>`:""}</span></li>`).join("")}</ol>
        <div class="actions"><button class="btn primary edit-only" data-envuse="${i}">Utiliser pour la semaine du ${fmtShort(lundi(envCible))}</button></div></article>`; }).join("")}</div></div>`;
  box.innerHTML=html;
}
document.addEventListener("click",e=>{ const b=e.target.closest("[data-envqui],[data-envpref],[data-envcuis],[data-envie],[data-envreset],[data-envweek],#envregen,[data-envuse],#envinvite"); if(!b) return; const D=b.dataset;
  if(D.envqui){ envQui=D.envqui; try{ localStorage.setItem(KEY+"-moi",envQui); }catch(err){} renderEnvies(); return; }
  if(D.envpref){ const k=D.envpref, v=k==="vege"?+D.v:D.v; majSondage(envQui,s=>{ s.prefs[k]=s.prefs[k]===v?null:v; }); PLANS={}; return; }
  if(D.envcuis){ majSondage(envQui,s=>{ const c=new Set(s.prefs.cuisines); c.has(D.envcuis)?c.delete(D.envcuis):c.add(D.envcuis); s.prefs.cuisines=[...c]; }); PLANS={}; return; }
  if(D.envie){ majSondage(envQui,s=>{ s.envies[D.envie]=+D.v; }); PLANS={}; return; }
  if(D.envreset){ majSondage(envQui,s=>{ delete s.envies[D.envreset]; }); PLANS={}; return; }
  if(D.envweek){ envCible=+D.envweek; renderEnvies(); return; }
  if(b.id==="envregen"){ PLANS={}; renderEnvies(); toast("Nouvelles suggestions"); return; }
  if(b.id==="envinvite"){ const t=`Petit sondage pour les menus : dites quels plats vous font envie (2 minutes) !\n${(window.INVITE_URL||APP_URL).replace(/#.*$/,"")}#envies`;
    try{ navigator.clipboard.writeText(t).then(()=>toast("Invitation copiée : collez-la dans WhatsApp ou un SMS"),()=>toast(t)); }catch(err){ toast(t); } return; }
  if(D.envuse!=null){ const pl=PLANS[envCible+"|"+state.family.join(",")]; if(!pl) return; const menu=pl[+D.envuse].menu, prev=state.weekOffset;
    goWeek(envCible); state.week=[...menu]; state.statut="proposition"; save(); render(); setTab("menu");
    toast(`Planning « ${pl[+D.envuse].t} » placé sur la semaine du ${weekLabel()}`,()=>{ goWeek(prev); },"Revenir"); }
});

