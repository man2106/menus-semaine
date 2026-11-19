// ======================= Export de la liste : PDF, e-mail, message =======================
let DL=null; // capacité de téléchargement (null si indisponible)
// jsPDF (vendor/) n'est chargé qu'au premier export PDF ; le service worker le garde pour l'usage hors ligne
let jsPdfEnCours=null;
function chargerJsPdf(){ if(window.jspdf) return Promise.resolve();
  if(!jsPdfEnCours) jsPdfEnCours=new Promise((ok,ko)=>{ const s=document.createElement("script"); s.src="vendor/jspdf-4.2.1.umd.min.js"+(window.APP_V?"?v="+window.APP_V:"");
    s.onload=()=>window.jspdf?ok():ko(new Error("jsPDF absent")); s.onerror=()=>ko(new Error("jsPDF introuvable")); document.head.appendChild(s); })
    .catch(e=>{ jsPdfEnCours=null; throw e; });
  return jsPdfEnCours; }
function pdfSafe(t){ return String(t).replace(/[  ]/g," ").replace(/≈\s?/g,"env. ").replace(/→/g,"->").replace(/[‘’]/g,"'").replace(/[“”]/g,'"').replace(/…/g,"...").replace(/✓/g,"x"); }
function exportTrips(){ return [0]; }
function exportItems(t,items){ const c=sheetCtx||{}; return c.onlyLeft? items.filter(i=>!state.checked[i.ck]) : items; }
function exportText(){
  const trips=coursesTrips();
  let txt=`Liste de courses · semaine du ${weekLabel()} (${totalCouverts()} couverts)\n`;
  exportTrips().forEach(t=>{ const all=trips[t], plan=planTrip(t,all), items=exportItems(t,all); if(!items.length) return;
    txt+=`\n== Courses de la semaine · ${fmtD(tripDate(t))} ==\n`;
    [plan.primary,plan.secondary].filter(Boolean).forEach(mag=>{ const si=items.filter(i=>plan.assign[i.k]===mag); if(!si.length) return;
      txt+=`\n>> ${MAGNOM[mag]}\n`+ORDRE.map(ray=>{const its=si.filter(i=>i.ray===ray); return its.length? RAYONS[ray]+"\n"+its.map(i=>`- ${i.n} : ${qtyOf(i)}${state.checked[i.ck]?" (acheté)":""}`).join("\n")+"\n":""}).join(""); }); });
  return txt+`\nÀ vérifier au placard : huile, sel, poivre, ail, vinaigrette, sauce soja.\n${APP_URL}`;
}
function buildPdf(){
  const {jsPDF}=window.jspdf; const doc=new jsPDF({unit:"mm",format:"a4"});
  const W=210, M=16, BOT=282, ACC=[46,122,76], WARM=[184,110,11], MUT=[93,106,96], INK=[30,42,33];
  let y=M; const T=pdfSafe;
  const need=h=>{ if(y+h>BOT){ doc.addPage(); y=M; } };
  doc.setFont("helvetica","bold"); doc.setFontSize(20); doc.setTextColor(...INK); doc.text("Liste de courses",M,y+6); y+=11;
  doc.setFont("helvetica","normal"); doc.setFontSize(11); doc.setTextColor(...MUT);
  doc.text(T(`Semaine du ${weekLabel()} · ${totalCouverts()} couverts · budget estimé ${eur(weekCost(state.gamme))} (gamme ${GAMMES[state.gamme].nom.toLowerCase()})`),M,y); y+=8;
  // menus de la semaine
  doc.setDrawColor(220,227,214); doc.setFillColor(245,247,241); const mh=7*5.2+6; doc.roundedRect(M,y,W-2*M,mh,2,2,"FD"); let yy=y+6;
  doc.setFontSize(9.5); state.week.forEach((id,d)=>{ doc.setFont("helvetica","bold"); doc.setTextColor(...ACC); doc.text(T(`${JOURS[d]} ${fmtShort(dayOffset(d))}`),M+4,yy);
    doc.setFont("helvetica","normal"); doc.setTextColor(...INK); doc.text(T(`${BYID[id].nom} · ${headcount(d)} à table${state.cooks[d]?" · "+state.cooks[d]+" cuisine":""}`),M+34,yy); yy+=5.2; });
  y+=mh+8;
  const trips=coursesTrips();
  exportTrips().forEach(t=>{ const all=trips[t], plan=planTrip(t,all), items=exportItems(t,all); if(!items.length) return;
    need(16); doc.setFont("helvetica","bold"); doc.setFontSize(15); doc.setTextColor(...INK); doc.text(T(`Courses de la semaine · ${fmtD(tripDate(t))}`),M,y); y+=3;
    doc.setDrawColor(...ACC); doc.setLineWidth(0.6); doc.line(M,y,W-M,y); y+=6;
    [plan.primary,plan.secondary].filter(Boolean).forEach(mag=>{ const si=items.filter(i=>plan.assign[i.k]===mag); if(!si.length) return; const m=MAGBYID(mag);
      need(12); doc.setFont("helvetica","bold"); doc.setFontSize(12); doc.setTextColor(...ACC); doc.text(T(m.nom),M,y);
      doc.setFont("helvetica","normal"); doc.setFontSize(9); doc.setTextColor(...MUT); doc.text(T(`${m.lieu} · ${si.length} article${si.length>1?"s":""}`),M+doc.getTextWidth(T(m.nom))*12/9+4,y); y+=6;
      ORDRE.forEach(ray=>{ const its=si.filter(i=>i.ray===ray); if(!its.length) return;
        need(10); doc.setFont("helvetica","bold"); doc.setFontSize(8.5); doc.setTextColor(...MUT); doc.text(T(RAYONS[ray].toUpperCase()),M,y); y+=5;
        its.forEach(i=>{ const pr=promosFor(i.n).find(p=>p.mag===ensOf(mag)&&validOn(p,tripDate(t))); const h=pr?9:6.5; need(h);
          const done=!!state.checked[i.ck];
          doc.setDrawColor(...INK); doc.setLineWidth(0.3); doc.rect(M,y-3.4,4,4);
          if(done){ doc.setDrawColor(...ACC); doc.setLineWidth(0.7); doc.line(M+0.8,y-1.4,M+1.8,y-0.4); doc.line(M+1.8,y-0.4,M+3.4,y-2.8); }
          doc.setFont("helvetica",done?"normal":"normal"); doc.setFontSize(11); doc.setTextColor(...(done?MUT:INK)); doc.text(T(i.n),M+7,y);
          doc.setFont("helvetica","bold"); doc.text(T(qtyOf(i)),W-M,y,{align:"right"});
          if(done){ const w=doc.getTextWidth(T(i.n)); doc.setDrawColor(...MUT); doc.setLineWidth(0.2); doc.line(M+7,y-1.3,M+7+w,y-1.3); }
          if(pr){ doc.setFont("helvetica","normal"); doc.setFontSize(8.5); doc.setTextColor(...WARM); doc.text(T(`Promo ${eur(pr.prix)}${pr.avant?" au lieu de "+eur(pr.avant):""} jusqu'au ${fmtShort(isoDate(pr.au))}`),M+7,y+3.6); }
          y+=h; });
        y+=2; });
      y+=3; });
    y+=4; });
  need(14); doc.setFont("helvetica","normal"); doc.setFontSize(9.5); doc.setTextColor(...MUT);
  doc.text(T("À vérifier au placard : huile, sel, poivre, ail, vinaigrette, sauce soja."),M,y); y+=5;
  doc.text(T("Recettes et liste à jour : "+APP_URL),M,y);
  const n=doc.getNumberOfPages(); for(let k=1;k<=n;k++){ doc.setPage(k); doc.setFontSize(8); doc.setTextColor(...MUT);
    doc.text(T(`Menus de la semaine · créé le ${new Date().toLocaleDateString("fr-BE")} · page ${k}/${n}`),W/2,292,{align:"center"}); }
  return doc.output("blob");
}
function mailtoHref(){
  const to=state.family.map(n=>state.emails[n]).filter(Boolean).join(",");
  let body=exportText(); if(body.length>1800) body=body.slice(0,1800)+"\n... (liste complète dans l'application)\n"+APP_URL;
  return "mailto:"+encodeURIComponent(to).replace(/%2C/g,",")+"?subject="+encodeURIComponent("Liste de courses · semaine du "+weekLabel())+"&body="+encodeURIComponent(body);
}
function renderExport(){ const c=sheetCtx; c.kind=c.kind||"courses"; if(c.kind==="menu") return renderExportMenu(); c.which=c.which||"both";
  const trips=coursesTrips(), cnt=t=>exportItems(t,trips[t]).length;
  const mails=state.family.map(n=>state.emails[n]).filter(Boolean);
  $("seyebrow").textContent=`Semaine du ${weekLabel()}`; $("stitle").textContent="Exporter et envoyer"; $("sextra").innerHTML="";
  $("sbody").innerHTML=`${exportKindChips()}<div class="wfield"><span>Quelle liste ?</span>
    <label class="xcheck"><input type="checkbox" id="xleft"${c.onlyLeft?" checked":""}> Seulement les articles qui restent à acheter</label>
    <p class="note">${exportTrips().map(t=>`${cnt(t)} article${cnt(t)>1?"s":""}`).join(" · ")}</p>
    <div class="xopt"><div><b>En PDF</b><small>Un document imprimable, avec les cases à cocher, classé par magasin et par rayon. Sur téléphone, le menu de partage s'ouvre : choisissez Mail, Messages ou WhatsApp.</small></div>
      <button class="btn primary big" data-xpdf="1"${DL?"":" disabled"}>Créer le PDF</button>
      ${DL?"":`<small class="xwarn">L'export PDF n'est pas disponible dans cette vue. Ouvrez l'application depuis claude.ai ou l'app Claude.</small>`}</div>
    <div class="xopt"><div><b>Par e-mail</b><small>${mails.length?`À ${mails.length} membre${mails.length>1?"s":""} de la famille : ${esc(mails.join(", "))}.`:"Ajoutez les adresses dans l'onglet Famille pour les remplir automatiquement."} Si votre messagerie ne s'ouvre pas, utilisez le PDF ou copiez le texte.</small></div>
      <a class="btn big" href="${esc(mailtoHref())}" target="_blank" rel="noopener" data-xmail="1">Préparer l'e-mail</a></div>
    <div class="xopt"><div><b>Par message</b><small>Copie la liste en texte, prête à coller dans un SMS, WhatsApp ou Messenger.</small></div>
      <button class="btn big" data-xcopy="1">Copier le texte</button></div>
    <textarea class="copybox" id="xtext" readonly hidden aria-label="Liste en texte"></textarea>`;
  $("sfoot").innerHTML=`<button class="btn primary big" data-sclose="1">Terminé</button>`;
}
async function exportPdf(btn){
  if(!DL){ toast("Export PDF indisponible ici"); return; }
  btn.disabled=true; btn.textContent="Création du PDF…";
  try{ await chargerJsPdf(); const blob=buildPdf(); const res=await DL.save({filename:`courses-semaine-${curIso()}.pdf`,data:blob});
    toast(res&&res.status==="shared"?"PDF partagé":"PDF téléchargé : joignez-le à un e-mail ou un message"); }
  catch(e){ const code=e&&e.code; if(code==="declined") toast("Export annulé"); else if(code==="rate_limited") toast("Un export est déjà en cours, réessayez dans un instant"); else toast("Le PDF n'a pas pu être créé"); }
  btn.disabled=false; btn.textContent="Créer le PDF";
}
function exportKindChips(){ const k=sheetCtx.kind; return `<div class="gfilters">${[["courses","Liste de courses"],["menu","Menu de la semaine"]].map(([v,l])=>`<button class="chip${k===v?" on":""}" data-xkind="${v}">${l}</button>`).join("")}</div>`; }
// ---- Export du menu de la semaine ----
function menuRows(){ return state.week.map((id,d)=>{ const r=BYID[id], abs=state.family.filter(n=>(state.absents[n]||[]).includes(d));
  return {d,r,date:dayOffset(d),hc:headcount(d),cook:state.cooks[d],abs,inv:state.invites[d]||0,cost:recipeCost(r,undefined,d),out:isOut(d)}; }); }
function menuText(){
  const {ok,wait}=approvalStats();
  let t=`Menus du soir · semaine du ${weekLabel()}\nStatut : ${state.statut==="valide"?"menu validé":"proposition à discuter"}${limiteTxt()?` · réponse attendue avant ${limiteTxt()}`:""}\n\n`;
  menuRows().forEach(x=>{ if(x.out){ t+=`${JOURS[x.d]} ${fmtShort(x.date)} : repas à l'extérieur\n`; return; } t+=`${JOURS[x.d]} ${fmtShort(x.date)} : ${x.r.nom}${x.r.acc?" (avec "+x.r.acc.toLowerCase()+")":""}\n   ${x.r.t} min · ${x.hc} couvert${x.hc>1?"s":""}${x.abs.length?" · absents : "+x.abs.join(", "):""}${x.inv?" · invités : "+x.inv:""} · cuisine : ${x.cook||"à définir"}\n`; });
  t+=`\n${totalCouverts()} couverts dans la semaine · budget estimé ${eur(weekCost(state.gamme))}\n`;
  if(state.family.length) t+=`\nOnt validé : ${ok.length?ok.join(", "):"personne pour l'instant"}\nEn attente : ${wait.length?wait.join(", "):"personne"}\n`;
  if(sheetCtx&&sheetCtx.withRecipes) menuRows().filter(x=>!x.out).forEach(x=>{ t+=`\n--- ${x.r.nom} (${JOURS[x.d]}, ${x.hc} pers.) ---\nIngrédients : ${x.r.ing.map(([n,q,u])=>n+" "+fmt(scale(q,x.d),u)).join(", ")}\n${getSteps(x.r.id).map((s,i)=>(i+1)+". "+s).join("\n")}\n`; });
  return t+`\n${APP_URL}`;
}
// Photo d'un plat en data URL pour le PDF (photos publiées avec la page ou recette de famille)
async function photoData(id){ try{ const src=photoSrc(id).replace(/\.webp$/,".jpg"); if(src.startsWith("data:image/jpeg")) return src; if(src.startsWith("data:")) return null;
  const blob=await (await fetch(src)).blob(); return await new Promise(res=>{ const fr=new FileReader(); fr.onload=()=>res(fr.result); fr.onerror=()=>res(null); fr.readAsDataURL(blob); }); }catch(e){ return null; } }
async function buildMenuPdf(){
  const {jsPDF}=window.jspdf; const doc=new jsPDF({unit:"mm",format:"a4",orientation:"landscape"});
  const ACC=[46,122,76], ACCS=[226,240,230], WARM=[184,110,11], WARMS=[251,235,210], MUT=[93,106,96], INK=[30,42,33], LINE=[220,227,214], BG=[245,247,241]; const T=pdfSafe;
  const PW=297, PH=210, M=12, GAP=5, COLS=4, top=31, bottom=PH-11;
  const bw=(PW-2*M-(COLS-1)*GAP)/COLS, bh=(bottom-top-GAP)/2;
  // en-tête
  doc.setFont("helvetica","bold"); doc.setFontSize(19); doc.setTextColor(...INK); doc.text("Menus de la semaine",M,M+5);
  doc.setFont("helvetica","normal"); doc.setFontSize(10.5); doc.setTextColor(...MUT);
  doc.text(T(`Semaine du ${weekLabel()} · ${totalCouverts()} couverts · budget estimé ${eur(weekCost(state.gamme))}`),M,M+11.5);
  const stT=T(state.statut==="valide"?"Menu validé":"Proposition à discuter"); doc.setFont("helvetica","bold"); doc.setFontSize(10);
  const sw=doc.getTextWidth(stT)+8; doc.setFillColor(...(state.statut==="valide"?ACCS:WARMS)); doc.roundedRect(PW-M-sw,M,sw,7,3.5,3.5,"F");
  doc.setTextColor(...(state.statut==="valide"?ACC:WARM)); doc.text(stT,PW-M-sw+4,M+4.9);
  if(limiteTxt()){ doc.setFont("helvetica","normal"); doc.setFontSize(9); doc.setTextColor(...MUT); doc.text(T(`Réponse attendue avant ${limiteTxt()}`),PW-M,M+12,{align:"right"}); }
  const rows=menuRows(), photos=await Promise.all(rows.map(x=>x.out?null:photoData(x.r.id)));
  rows.forEach((x,i)=>{ const col=i%COLS, row=Math.floor(i/COLS), X=M+col*(bw+GAP), Y=top+row*(bh+GAP);
    const today=x.date.getTime()===TODAY.getTime();
    doc.setDrawColor(...(today?ACC:LINE)); doc.setLineWidth(today?0.8:0.3); doc.setFillColor(...(x.out?BG:[255,255,255])); doc.roundedRect(X,Y,bw,bh,3,3,"FD");
    // bandeau du jour
    doc.setFillColor(...(x.out?MUT:ACC)); doc.roundedRect(X,Y,bw,9,3,3,"F"); doc.rect(X,Y+5,bw,4,"F");
    doc.setFont("helvetica","bold"); doc.setFontSize(10.5); doc.setTextColor(255,255,255); doc.text(T(JOURS[x.d]),X+4,Y+6.2);
    doc.setFont("helvetica","normal"); doc.setFontSize(9); doc.text(T(fmtShort(x.date)),X+bw-4,Y+6.2,{align:"right"});
    let y=Y+9;
    if(x.out){ doc.setFont("helvetica","bold"); doc.setFontSize(14); doc.setTextColor(...MUT); doc.text(T("Repas à l'extérieur"),X+bw/2,Y+bh/2,{align:"center"});
      doc.setFont("helvetica","normal"); doc.setFontSize(9); doc.text(T("Pas de cuisine ni de courses"),X+bw/2,Y+bh/2+6,{align:"center"}); return; }
    const ph=photos[i], ih=26;
    if(ph){ try{ doc.addImage(ph,"JPEG",X+0.3,y,bw-0.6,ih,undefined,"FAST"); y+=ih; }catch(e){} }
    y+=5;
    doc.setFont("helvetica","bold"); doc.setFontSize(11); doc.setTextColor(...INK);
    const nom=doc.splitTextToSize(T(x.r.nom),bw-8).slice(0,2); doc.text(nom,X+4,y); y+=nom.length*4.6;
    if(x.r.acc){ doc.setFont("helvetica","normal"); doc.setFontSize(8.5); doc.setTextColor(...MUT); const acc=doc.splitTextToSize(T("avec "+x.r.acc.toLowerCase()),bw-8).slice(0,1); doc.text(acc,X+4,y); y+=4.2; }
    // pied de case : cuisinier, couverts, durée
    const fy=Y+bh-12;
    doc.setDrawColor(...LINE); doc.setLineWidth(0.2); doc.line(X+4,fy-3,X+bw-4,fy-3);
    doc.setFont("helvetica","normal"); doc.setFontSize(8.5); doc.setTextColor(...MUT); doc.text("Cuisine",X+4,fy+0.5);
    doc.setFont("helvetica","bold"); doc.setFontSize(10); doc.setTextColor(...(x.cook?INK:MUT)); doc.text(T(x.cook||"à définir"),X+4,fy+5.5);
    doc.setFont("helvetica","normal"); doc.setFontSize(8.5); doc.setTextColor(...MUT); doc.text("Couverts",X+bw-4,fy+0.5,{align:"right"});
    doc.setFont("helvetica","bold"); doc.setFontSize(14); doc.setTextColor(...ACC); doc.text(String(x.hc),X+bw-4,fy+6,{align:"right"});
    const extra=[`${x.r.t} min`, x.abs.length?"absent : "+x.abs.join(", "):"", x.inv?`+${x.inv} invité${x.inv>1?"s":""}`:""].filter(Boolean).join(" · ");
    doc.setFont("helvetica","normal"); doc.setFontSize(8); doc.setTextColor(...MUT); doc.text(doc.splitTextToSize(T(extra),bw-8).slice(0,2),X+4,Math.min(y+1,fy-5));
  });
  // 8e case : résumé et validations
  { const X=M+3*(bw+GAP), Y=top+bh+GAP; doc.setFillColor(...BG); doc.setDrawColor(...LINE); doc.setLineWidth(0.3); doc.roundedRect(X,Y,bw,bh,3,3,"FD");
    let y=Y+8; doc.setFont("helvetica","bold"); doc.setFontSize(11); doc.setTextColor(...INK); doc.text("La semaine en bref",X+4,y); y+=6;
    doc.setFont("helvetica","normal"); doc.setFontSize(9); doc.setTextColor(...INK);
    [`${homeDays().length} soirs à la maison`,`${totalCouverts()} couverts`,`Budget ≈ ${eur(weekCost(state.gamme))}`].forEach(l=>{ doc.text(T(l),X+4,y); y+=4.6; });
    if(state.family.length){ const {ok}=approvalStats(); y+=2; doc.setFont("helvetica","bold"); doc.setFontSize(10); doc.text(T(`Validations ${ok.length}/${state.family.length}`),X+4,y); y+=5;
      doc.setFontSize(9); state.family.slice(0,9).forEach(n=>{ const a=approvalOf(n), okk=a&&!a.ancienne;
        doc.setFillColor(...(okk?ACC:LINE)); doc.circle(X+5.5,y-1.2,1.6,"F"); doc.setFont("helvetica",okk?"bold":"normal"); doc.setTextColor(...(okk?INK:MUT));
        doc.text(T(n+(okk?"":a&&a.ancienne?" (ancienne version)":" (en attente)")),X+9,y); y+=4.4; }); }
    if(limiteTxt()){ doc.setFont("helvetica","bold"); doc.setFontSize(8.5); doc.setTextColor(...WARM); doc.text(doc.splitTextToSize(T("Réponse avant "+limiteTxt()),bw-8),X+4,Y+bh-8); } }
  // pages de recettes (portrait)
  if(sheetCtx&&sheetCtx.withRecipes){ const W=210, M2=16, BOT=282; let y;
    const need=h=>{ if(y+h>BOT){ doc.addPage("a4","portrait"); y=M2; } };
    rows.filter(x=>!x.out).forEach(x=>{ doc.addPage("a4","portrait"); y=M2;
      doc.setFont("helvetica","bold"); doc.setFontSize(9); doc.setTextColor(...ACC); doc.text(T(`${JOURS[x.d].toUpperCase()} ${fmtShort(x.date)} · ${x.hc} COUVERTS${x.cook?" · CUISINE : "+x.cook.toUpperCase():""}`),M2,y); y+=8;
      doc.setFontSize(18); doc.setTextColor(...INK); doc.text(T(x.r.nom),M2,y); y+=6;
      doc.setFont("helvetica","normal"); doc.setFontSize(10); doc.setTextColor(...MUT); doc.text(T(`${x.r.t} min${x.r.acc?" · avec "+x.r.acc.toLowerCase():""} · coût estimé ${eur(x.cost)}`),M2,y); y+=9;
      doc.setFont("helvetica","bold"); doc.setFontSize(12); doc.setTextColor(...INK); doc.text("Ingrédients",M2,y); y+=6;
      doc.setFont("helvetica","normal"); doc.setFontSize(10.5); x.r.ing.forEach(([n,q,u])=>{ need(6); doc.setTextColor(...INK); doc.text(T(n),M2+2,y); doc.text(T(fmt(scale(q,x.d),u)),W-M2,y,{align:"right"}); y+=5.5; });
      y+=4; doc.setFont("helvetica","bold"); doc.setFontSize(12); doc.text("Préparation",M2,y); y+=6;
      doc.setFont("helvetica","normal"); doc.setFontSize(10.5); getSteps(x.r.id).forEach((st,i)=>{ const lines=doc.splitTextToSize(T(st),W-2*M2-10); need(lines.length*5+3);
        doc.setFont("helvetica","bold"); doc.setTextColor(...ACC); doc.text(String(i+1)+".",M2,y); doc.setFont("helvetica","normal"); doc.setTextColor(...INK); doc.text(lines,M2+8,y); y+=lines.length*5+3; });
      if(x.r.astuce){ y+=2; need(10); doc.setFont("helvetica","italic"); doc.setTextColor(...WARM); doc.text(doc.splitTextToSize(T("Astuce : "+x.r.astuce),W-2*M2),M2,y); } }); }
  const n=doc.getNumberOfPages(); for(let k=1;k<=n;k++){ doc.setPage(k); const w=doc.internal.pageSize.getWidth(), h=doc.internal.pageSize.getHeight();
    doc.setFont("helvetica","normal"); doc.setFontSize(8); doc.setTextColor(...MUT); doc.text(T(`Menus de la semaine · créé le ${new Date().toLocaleDateString("fr-BE")} · page ${k}/${n}`),w/2,h-5,{align:"center"}); }
  return doc.output("blob");
}
function menuMailto(){ const to=state.family.map(n=>state.emails[n]).filter(Boolean).join(",");
  let body=menuText(); if(body.length>1800) body=body.slice(0,1800)+"\n... (détails dans l'application)\n"+APP_URL;
  return "mailto:"+encodeURIComponent(to).replace(/%2C/g,",")+"?subject="+encodeURIComponent("Menus de la semaine du "+weekLabel())+"&body="+encodeURIComponent(body); }
function renderExportMenu(){ const c=sheetCtx, mails=state.family.map(n=>state.emails[n]).filter(Boolean), {ok,wait}=approvalStats();
  $("seyebrow").textContent=`Semaine du ${weekLabel()}`; $("stitle").textContent="Exporter et envoyer"; $("sextra").innerHTML="";
  $("sbody").innerHTML=`${exportKindChips()}
    <p class="note">Le menu jour par jour avec le plat, qui cuisine, le nombre de couverts, les absents et invités${state.family.length?`, puis qui a validé (${ok.length}/${state.family.length})`:""}${limiteTxt()?` et la date limite de réponse (${esc(limiteTxt())})`:""}.</p>
    <label class="xcheck"><input type="checkbox" id="xrec"${c.withRecipes?" checked":""}> Ajouter les recettes détaillées (ingrédients et étapes, une page par repas)</label>
    <div class="xopt"><div><b>En PDF</b><small>À imprimer ou à envoyer. Sur téléphone, le menu de partage s'ouvre : choisissez Mail, Messages ou WhatsApp.</small></div>
      <button class="btn primary big" data-xpdfmenu="1"${DL?"":" disabled"}>Créer le PDF</button>
      ${DL?"":`<small class="xwarn">L'export PDF n'est pas disponible dans cette vue. Ouvrez l'application depuis claude.ai ou l'app Claude.</small>`}</div>
    <div class="xopt"><div><b>Par e-mail</b><small>${mails.length?`À ${mails.length} membre${mails.length>1?"s":""} de la famille.`:"Ajoutez les adresses dans l'onglet Famille pour les remplir automatiquement."}${wait.length?` Pensez à relancer : ${esc(wait.join(", "))}.`:""}</small></div>
      <a class="btn big" href="${esc(menuMailto())}" target="_blank" rel="noopener" data-xmail="1">Préparer l'e-mail</a></div>
    <div class="xopt"><div><b>Par message</b><small>Le menu en texte, prêt à coller dans un SMS ou WhatsApp.</small></div>
      <button class="btn big" data-xcopymenu="1">Copier le texte</button></div>
    <textarea class="copybox" id="xtext" readonly hidden aria-label="Menu en texte"></textarea>`;
  $("sfoot").innerHTML=`<button class="btn primary big" data-sclose="1">Terminé</button>`; }
async function exportMenuPdf(btn){
  if(!DL){ toast("Export PDF indisponible ici"); return; }
  btn.disabled=true; btn.textContent="Création du PDF…";
  try{ await chargerJsPdf(); const pdf=await buildMenuPdf(); const res=await DL.save({filename:`menu-semaine-${curIso()}.pdf`,data:pdf}); toast(res&&res.status==="shared"?"PDF partagé":"PDF téléchargé : joignez-le à un e-mail ou un message"); }
  catch(e){ const code=e&&e.code; toast(code==="declined"?"Export annulé":code==="rate_limited"?"Un export est déjà en cours, réessayez dans un instant":"Le PDF n'a pas pu être créé"); }
  btn.disabled=false; btn.textContent="Créer le PDF"; }
function handleExportClick(D,T){
  const c=sheetCtx;
  if(D.xkind){ c.kind=D.xkind; renderExport(); return true; }
  if(D.xpdfmenu){ exportMenuPdf(T); return true; }
  if(D.xcopymenu){ const txt=menuText(), box=$("xtext"); box.value=txt;
    try{ navigator.clipboard.writeText(txt).then(()=>toast("Menu copié : collez-le dans votre message"),()=>{box.hidden=false;box.focus();box.select();}); }catch(err){ box.hidden=false; box.focus(); box.select(); } return true; }
  if(D.xwhich){ c.which=D.xwhich; renderExport(); return true; }
  if(D.xpdf){ exportPdf(T); return true; }
  if(D.xcopy){ const txt=exportText(), box=$("xtext"); box.value=txt;
    try{ navigator.clipboard.writeText(txt).then(()=>toast("Liste copiée : collez-la dans votre message"),()=>{box.hidden=false;box.focus();box.select();toast("Sélectionnez le texte puis copiez-le");}); }catch(err){ box.hidden=false; box.focus(); box.select(); }
    return true; }
  if(D.xmail){ toast("Ouverture de votre messagerie…"); return false; }
  return false;
}
$("sheet").addEventListener("change",e=>{ if(!sheetCtx||sheetCtx.type!=="export") return; if(e.target.id==="xleft"){ sheetCtx.onlyLeft=e.target.checked; renderExport(); } if(e.target.id==="xrec"){ sheetCtx.withRecipes=e.target.checked; renderExport(); } });
$("export").onclick=()=>openSheet({type:"export",kind:"courses",which:"both",onlyLeft:true});

