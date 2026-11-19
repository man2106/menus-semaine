function renderPromos(){
  const ageReleve=Math.round((TODAY-isoDate(RELEVE_ISO))/864e5), vieux=ageReleve>7;
  $("promodate").className="promodate"+(vieux?" vieux":"");
  $("promodate").innerHTML=`<b>Promos relevées le ${esc(RELEVE)}</b>${vieux?` · attention, ce relevé a ${ageReleve} jours : les prix ont peut-être changé`:""}<br>Enseignes autour de chez vous (mise à jour le lundi et le mercredi). Vérifiez en magasin avant d'acheter.`;
  const ranked=RECETTES.map(r=>({r,c:promoCount(r)})).filter(x=>x.c).sort((a,b)=>b.c-a.c||a.r.t-b.r.t);
  $("sugg").innerHTML=ranked.map(({r,c})=>{const days=state.week.map((id,d)=>id===r.id?JOURS[d]:null).filter(Boolean);
    const what=[...new Set(r.ing.map(([n])=>n).filter(n=>promosFor(n).length))].map(n=>n.toLowerCase()+" ("+promosFor(n).map(p=>ENS[p.mag]).join(", ")+")").join(", ");
    return `<div class="srow"><span><b>${esc(r.nom)}</b> <span class="promo">${c} en promo</span><small>${what}</small>${days.length?`<small>Déjà au menu : ${days.join(", ")}</small>`:""}</span>
      <select data-add="${r.id}" aria-label="Mettre ${esc(r.nom)} au menu"><option value="">Mettre au menu…</option>${JOURS.map((j,d)=>`<option value="${d}">${j}${state.week[d]===r.id?" ✓":""}</option>`).join("")}</select></div>`}).join("");
  // promos utiles pour la liste actuelle
  const items=courses(); const byMag={}; let gain=0;
  items.forEach(i=>promosFor(i.n).forEach(p=>{(byMag[p.mag]=byMag[p.mag]||[]).push({p,i}); if(p.avant) gain+=p.avant-p.prix;}));
  const mags=Object.keys(byMag).sort((a,b)=>byMag[b].length-byMag[a].length);
  $("planinfo").textContent=mags.length? `${mags.length} enseigne${mags.length>1?"s":""} ont des promos sur votre liste. Économie connue : environ ${eur(gain)} par paquet acheté en promo.` : "Aucun article de votre liste n'est en promo cette semaine.";
  $("pcount").textContent=String(items.filter(i=>promosFor(i.n).length).length||"");
  $("deals").innerHTML=mags.map(m=>{const mine=orderedStores().filter(x=>x.ens===m);
    return `<div class="store">${ENS[m]}${mine.length?" · "+mine.map(x=>x.lieu.split(", ").pop()).join(", "):" · pas dans vos magasins"}</div>`+byMag[m].map(({p,i})=>`<div class="deal"><span>${esc(p.produit)}</span><span class="p">${p.avant?`<s>${eur(p.avant)}</s>`:""}${eur(p.prix)}</span><small>Pour : ${i.n.toLowerCase()} (${qtyOf(i)}) · du ${fmtD(isoDate(p.du))} au ${fmtD(isoDate(p.au))} <span class="st ${promoStatus(p).cls}">${promoStatus(p).txt}</span></small></div>`).join("")}).join("");
  // validité par magasin
  const parMag={}; PROMOS.forEach(p=>(parMag[p.mag]=parMag[p.mag]||[]).push(p));
  const seen=new Set();
  $("validite").innerHTML=orderedStores().filter(m=>!seen.has(m.ens)&&seen.add(m.ens)).map(m=>{const ps=parMag[m.ens]; m={...m,nom:ENS[m.ens],lieu:orderedStores().filter(x=>x.ens===m.ens).map(x=>x.lieu).join(" · ")};
    if(!ps) return `<div class="vrow"><div><b>${m.nom}</b><small>${m.lieu}</small></div><div class="vr"><span class="st none">Pas de folder relevé</span></div></div>`;
    const periods=[...new Set(ps.map(p=>p.du+"|"+p.au))].map(k=>{const [du,au]=k.split("|"); const p=ps.find(x=>x.du===du&&x.au===au); const s=promoStatus(p);
      return `<div class="vr"><span>du ${fmtD(isoDate(du))} au ${fmtD(isoDate(au))}</span><span class="st ${s.cls}">${s.txt}</span></div>`}).join("");
    const c1=ps.some(p=>validOn(p,tripDate(0))), c2=false;
    const use=[c1?`les courses du ${fmtShort(tripDate(0))}`:null].filter(Boolean);
    return `<div class="vrow"><div><b>${m.nom}</b><small>${m.lieu} · ${ps.length} promo${ps.length>1?"s":""}</small><small>${use.length?"Valable pour la "+use.join(" et la "):"Non valable vos jours de courses"}</small></div><div>${periods}</div></div>`}).join("");
  // indice
  const max=6;
  $("index").innerHTML=INDICE.map(x=>{const w=Math.abs(x.v)/max*50; const col=x.v<0?"var(--accent)":"var(--warm)";
    return `<div class="irow"><span>${x.nom}</span><span class="ibar"><i style="background:${col};width:${w}%;${x.v<0?`right:50%`:`left:50%`}"></i></span><span style="color:${col}">${x.v>0?"+":""}${nf.format(x.v)} %</span></div>`}).join("");
  renderCmp();
}
function renderCmp(onlyTotals){
  const items=courses();
  if(onlyTotals){ const tot={},cnt={}; orderedStores().forEach(m=>{tot[m.id]=0;cnt[m.id]=0;});
    items.forEach(i=>{const pr=state.prices[i.k]||{}; orderedStores().forEach(m=>{if(typeof pr[m.id]==="number"){tot[m.id]+=pr[m.id];cnt[m.id]++;}})});
    const full=orderedStores().filter(m=>cnt[m.id]===items.length&&items.length); const best=full.length?Math.min(...full.map(m=>tot[m.id])):null;
    $("cmp").querySelector("tfoot").innerHTML=`<tr><td>Total</td>${orderedStores().map(m=>`<td class="${best!==null&&tot[m.id]===best&&cnt[m.id]===items.length?"best":""}">${cnt[m.id]?eur(tot[m.id]):"—"}</td>`).join("")}</tr>`;
    $("cmpnote").textContent=`Articles renseignés : ${orderedStores().map(m=>`${m.nom} ${cnt[m.id]}/${items.length}`).join(" · ")}. Un total n'est comparable que lorsque tous les articles sont remplis.`;
    return; }
  const tot={}, cnt={};
  orderedStores().forEach(m=>{tot[m.id]=0;cnt[m.id]=0;});
  const rows=items.map(i=>{const pr=state.prices[i.k]||{};
    return `<tr><td>${esc(i.n)}<small>${esc(qtyOf(i))}</small></td>${orderedStores().map(m=>{const v=pr[m.id]; if(typeof v==="number"){tot[m.id]+=v;cnt[m.id]++;}
      return `<td><input type="number" inputmode="decimal" min="0" step="0.01" id="px-${i.k.replace(/[^a-zA-Z0-9]/g,"_")}-${m.id}" data-pk="${esc(i.k)}" data-mag="${m.id}" value="${typeof v==="number"?v:""}" aria-label="Prix ${esc(i.n)} chez ${m.nom}"></td>`}).join("")}</tr>`}).join("");
  const full=orderedStores().filter(m=>cnt[m.id]===items.length&&items.length);
  const best=full.length?Math.min(...full.map(m=>tot[m.id])):null;
  $("cmp").innerHTML=`<thead><tr><th>Article</th>${orderedStores().map(m=>`<th>${m.nom}</th>`).join("")}</tr></thead><tbody>${rows}</tbody>
    <tfoot><tr><td>Total</td>${orderedStores().map(m=>`<td class="${best!==null&&tot[m.id]===best&&cnt[m.id]===items.length?"best":""}">${cnt[m.id]?eur(tot[m.id]):"—"}</td>`).join("")}</tr></tfoot>`;
  const filled=orderedStores().map(m=>`${m.nom} ${cnt[m.id]}/${items.length}`).join(" · ");
  $("cmpnote").textContent=`Articles renseignés : ${filled}. Un total n'est comparable que lorsque tous les articles sont remplis.`;
}
