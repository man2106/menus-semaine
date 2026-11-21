// ---- Dates : semaine planifiée et validité des promos ----
const isoDate = s => { const [y,m,d]=s.split("-").map(Number); return new Date(y,m-1,d); };
const TODAY = (()=>{const t=new Date(); t.setHours(0,0,0,0); return t;})();
let MONDAY = (()=>{const dow=(TODAY.getDay()+6)%7; const m=new Date(TODAY); m.setDate(TODAY.getDate()-dow+(dow>=4?7:0)); return m;})();
const BASE_MONDAY = new Date(MONDAY);
const isoOf = d => d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0");
const curIso = () => isoOf(MONDAY);
const dayOffset = n => { const d=new Date(MONDAY); d.setDate(MONDAY.getDate()+n); return d; };
// Menu validé dont la semaine a commencé : figé. Jours passés = « Passé », jour en cours = « Ce soir », autres = « Prévu ».
// Menu figé : semaine commencée, ou validé par toute la famille (sauf pour le propriétaire)
const estProprio = () => { try{ return IS_OWNER; }catch(e){ return true; } };
const validePourTous = () => { try{ const f=state.family||[]; return f.length>0 && f.every(n=>{ const a=state.approbations&&state.approbations[n]; return !!a && a.menu===menuKey(); }); }catch(e){ return false; } };
const verrouille = () => (state.statut==="valide" && MONDAY.getTime()<=TODAY.getTime()) || (validePourTous() && !estProprio());
const etatJour = d => { const t=dayOffset(d).getTime(); return t<TODAY.getTime()?"passe":t===TODAY.getTime()?"today":"avenir"; };
const fmtD = d => d.toLocaleDateString("fr-BE",{weekday:"short",day:"2-digit",month:"2-digit"});
const fmtShort = d => d.toLocaleDateString("fr-BE",{day:"2-digit",month:"2-digit"});
const DAY = 86400000;
const validOn = (p,date) => isoDate(p.du)<=date && date<=isoDate(p.au);
function promoStatus(p){
  const du=isoDate(p.du), au=isoDate(p.au);
  if(TODAY<du){const n=Math.round((du-TODAY)/DAY); return {cls:"soon",txt:n===1?"Commence demain":`Commence dans ${n} jours`};}
  if(TODAY>au) return {cls:"over",txt:"Terminée"};
  const left=Math.round((au-TODAY)/DAY);
  return left===0?{cls:"last",txt:"Dernier jour"}:{cls:left<=2?"last":"on",txt:`Encore ${left+1} jours`};
}
const INDICE = [{nom:"Aldi",v:-5.2},{nom:"Colruyt",v:-2.8},{nom:"Albert Heijn",v:1.0},{nom:"Delhaize",v:4.1}];
// promos encore valables pendant la semaine planifiée (à partir de la 1re course)
const promosFor = n => PROMOS.filter(p=>p.ing===n && isoDate(p.au)>=tripDate(0) && isoDate(p.du)<=dayOffset(6));
const promoCount = r => new Set(r.ing.filter(([n])=>promosFor(n).length).map(([n])=>n)).size;
const eur = v => v.toLocaleString("fr-BE",{style:"currency",currency:"EUR"});
const JOURS = ["Lundi","Mardi","Mercredi","Jeudi","Vendredi","Samedi","Dimanche"];
const DEFAUT = ["carbo","omelette","wraps","cantonais","croque","chili","quiche"];
const KEY = "menus-semaine-v1";

let state = {week:[...DEFAUT], persons:5, checked:{}, tab:"menu", picking:null, family:[], cooks:Array(7).fill(null), prices:{}, trip1:"sam", trip2:3, tripStore:[null,null], gamme:"eco", maxStores:1, seuil:2, weekOffset:0, weeks:{}, statut:"proposition", journal:[], approbations:{}, limite:null, exterieur:null, outDefault:[5], absents:{}, invites:[0,0,0,0,0,0,0], extras:[], emails:{}, perso:[], avis:{}, exclus:{}, storePref:null, onboarded:false};
try{const s=JSON.parse(localStorage.getItem(KEY)||"null"); if(s&&Array.isArray(s.perso)) s.perso.forEach(registerRecipe); if(s&&Array.isArray(s.week)&&s.week.every(id=>BYID[id])) state={...state,...s,picking:null};}catch(e){}
if(!Array.isArray(state.family)) state.family=[];
if(!state.prices||typeof state.prices!=="object") state.prices={};
if(!["sam","lun"].includes(state.trip1)) state.trip1="sam";
if(![2,3,4].includes(state.trip2)) state.trip2=3;
if(!Array.isArray(state.tripStore)||state.tripStore.length!==2) state.tripStore=[null,null];
if(!["eco","equi","qual"].includes(state.gamme)) state.gamme="eco";
state.family=Array.isArray(state.family)?[...new Set(state.family.map(x=>propre(x,30)).filter(Boolean))].slice(0,20):[];
const cleanMix=m=>(m&&typeof m==="object")?{plaisir:Math.max(0,Math.min(7,m.plaisir|0)),moyen:Math.max(0,Math.min(7,m.moyen|0))}:null;
state.mix=cleanMix(state.mix)||{plaisir:1,moyen:2};
if(![1,2].includes(state.maxStores)) state.maxStores=1;
if(![1,2,3,5].includes(state.seuil)) state.seuil=2;
if(!state.weeks||typeof state.weeks!=="object") state.weeks={};
if(!Array.isArray(state.customStores)) state.customStores=[];
state.customStores=state.customStores.filter(m=>m&&typeof m.id==="string"&&/^c[a-z0-9]{3,20}$/.test(m.id)&&typeof m.lat==="number"&&typeof m.lon==="number"&&ENS[m.ens]).slice(0,30);
const cleanTxt = t => String(t==null?"":t).replace(/[<>&"'`]/g,"").trim();
if(!Array.isArray(state.osmStores)) state.osmStores=[];
state.osmStores=state.osmStores.filter(m=>m&&typeof m.id==="string"&&/^(o[nwr]\d{1,14}|g[A-Za-z0-9_-]{6,90})$/.test(m.id)&&typeof m.lat==="number"&&typeof m.lon==="number"&&ENS[m.ens]).slice(0,80);
if(!state.storeFix||typeof state.storeFix!=="object") state.storeFix={};
Object.entries(state.storeFix).forEach(([id,c])=>{ const m=MAGASINS.find(x=>x.id===id); if(m&&c&&typeof c.lat==="number"&&typeof c.lon==="number"){ m.lat=c.lat; m.lon=c.lon; if(c.lieu) m.lieu=cleanTxt(c.lieu).slice(0,80); m.osm=true; } });
state.osmStores.forEach(m=>{ if(!MAGASINS.some(x=>x.id===m.id)) MAGASINS.push({id:m.id,ens:m.ens,nom:cleanTxt(m.nom).slice(0,40),lieu:cleanTxt(m.lieu).slice(0,80),lat:m.lat,lon:m.lon,osm:true}); });
state.customStores.forEach(m=>{ if(!MAGASINS.some(x=>x.id===m.id)) MAGASINS.push({id:m.id,ens:m.ens,nom:propre(m.nom,40)||ENS[m.ens],lieu:propre(m.lieu,80),lat:m.lat,lon:m.lon,perso:true}); });
if(state.home&&typeof state.home.lat==="number"&&typeof state.home.lon==="number"&&state.home.lat>49.3&&state.home.lat<51.6&&state.home.lon>2.4&&state.home.lon<6.5) HOME={nom:String(state.home.nom||"Mon domicile").slice(0,90),lat:state.home.lat,lon:state.home.lon,precision:state.home.precision==="exacte"?"exacte":"localite"}; else state.home=null;
if(!Number.isInteger(state.weekOffset)||state.weekOffset<0||state.weekOffset>3) state.weekOffset=0;
if(!["proposition","valide"].includes(state.statut)) state.statut="proposition";
if(!Array.isArray(state.journal)) state.journal=[];
if(!state.approbations||typeof state.approbations!=="object") state.approbations={};
if(typeof state.limite!=="string") state.limite=null;
const cleanDays=a=>Array.isArray(a)?[...new Set(a.filter(x=>Number.isInteger(x)&&x>=0&&x<7))].sort():null;
state.outDefault=cleanDays(state.outDefault)||[5]; state.exterieur=cleanDays(state.exterieur);
if(!state.absents||typeof state.absents!=="object") state.absents={};
if(!state.emails||typeof state.emails!=="object") state.emails={};
if(!Array.isArray(state.perso)) state.perso=[];
if(!state.avis||typeof state.avis!=="object") state.avis={};
if(!state.exclus||typeof state.exclus!=="object") state.exclus={};
if(state.storePref&&!MAGASINS.some(m=>m.id===state.storePref)) state.storePref=null;
// ordre de préférence des magasins (le premier est le magasin habituel)
{ const ids=MAGASINS.map(m=>m.id);
  let o=Array.isArray(state.storeOrder)?state.storeOrder.filter(id=>ids.includes(id)):[];
  if(!o.length) o=["inter","lidl","delhaize","carrefour","colruyt"];
  if(Array.isArray(state.storeOff)) o=o.filter(id=>!state.storeOff.includes(id));
  if(!o.length) o=["inter"];
  if(state.storePref){ o=[state.storePref,...o.filter(id=>id!==state.storePref)]; if(!state.storeMode) state.storeMode="fixe"; state.storePref=null; }
  state.storeOrder=o;
  state.storeOff=[];
  if(!["auto","fixe"].includes(state.storeMode)) state.storeMode="auto"; }
if(!Array.isArray(state.invites)||state.invites.length!==7) state.invites=[0,0,0,0,0,0,0];
// semaine affichée au démarrage
function setMonday(off){ MONDAY=new Date(BASE_MONDAY); MONDAY.setDate(BASE_MONDAY.getDate()+7*off); }
setMonday(state.weekOffset);
function stashWeek(){ state.weeks[curIso()]={lieux:{...(state.lieux||{})},menu:[...state.week],cooks:[...state.cooks],checked:{...state.checked},statut:state.statut,journal:state.journal.slice(0,15),approbations:JSON.parse(JSON.stringify(state.approbations)),limite:state.limite,exterieur:state.exterieur,absents:JSON.parse(JSON.stringify(state.absents)),invites:[...state.invites],extras:JSON.parse(JSON.stringify(state.extras||[])),quantites:{...(state.qtEdit||{})},tickets:JSON.parse(JSON.stringify(state.tickets||[]))};
  // ne garder que les semaines récentes
  const limit=new Date(BASE_MONDAY); limit.setDate(limit.getDate()-14); Object.keys(state.weeks).forEach(k=>{ if(isoDate(k)<limit) delete state.weeks[k]; }); }
function applyValidation(){ if(DB){ state.statut = VALID[curIso()]==="valide" ? "valide" : "proposition"; state.limite = LIMITES[curIso()]||null; } }
function applyWeekData(w){ state.week=[...w.menu]; state.cooks=(Array.isArray(w.cooks)&&w.cooks.length===7)?w.cooks.map(x=>propre(x,30)||null):Array(7).fill(null); state.checked={...(w.checked||{})}; state.statut=w.statut||"proposition"; state.journal=Array.isArray(w.journal)?w.journal:[];
  state.approbations=(w.approbations&&typeof w.approbations==="object")?JSON.parse(JSON.stringify(w.approbations)):{}; state.limite=typeof w.limite==="string"?w.limite:null; state.exterieur=cleanDays(w.exterieur);
  state.absents=(w.absents&&typeof w.absents==="object")?JSON.parse(JSON.stringify(w.absents)):{}; if(window.__dbReady) applyValidation(); state.invites=(Array.isArray(w.invites)&&w.invites.length===7)?w.invites.map(x=>Math.max(0,Math.min(20,+x||0))):[0,0,0,0,0,0,0]; state.extras=cleanExtras(w.extras); state.qtEdit=cleanQt(w.quantites); state.lieux=cleanLieux(w.lieux); state.tickets=cleanTickets(w.tickets); }
const LIEUX={super:"au supermarché",boucher:"chez le boucher",boulanger:"chez le boulanger",marche:"au marché",autre:"dans un autre magasin"};
function cleanLieux(o){ const r={}; if(o&&typeof o==="object") Object.entries(o).slice(0,200).forEach(([k,v])=>{ if(typeof k==="string"&&k.length<=90&&LIEUX[v]) r[k]=v; }); return r; }
function cleanQt(o){ const r={}; if(o&&typeof o==="object") Object.entries(o).slice(0,300).forEach(([k,v])=>{ if(typeof k==="string"&&k.length<=90&&typeof v==="string"&&v.trim()) r[k]=propre(v,20); }); return r; }
function cleanTickets(a){ return Array.isArray(a)?a.filter(x=>x&&+x.montant>0&&+x.montant<5000).slice(0,10).map(x=>({montant:Math.round(+x.montant*100)/100,mag:typeof x.mag==="string"?x.mag.replace(/[<>"'`]/g,"").slice(0,40):"",quand:typeof x.quand==="string"?x.quand.slice(0,30):"",estime:+x.estime>0?Math.round(+x.estime*100)/100:null,par:propre(x.par,30)})):[]; }
function cleanExtras(a){ return Array.isArray(a)? a.filter(x=>x&&typeof x.n==="string"&&x.n.trim()&&x.id).slice(0,200).map(x=>({id:String(x.id).slice(0,40),n:String(x.n).trim().slice(0,60),qt:String(x.qt||"").slice(0,20),ray:RAYONS[x.ray]?x.ray:"epi",t:x.t===1?1:0,par:String(x.par||"").replace(/[^0-9a-f-]/g,"").slice(0,36)})) : []; }
{ const w=state.weeks[curIso()]; if(w&&Array.isArray(w.menu)&&w.menu.length===7&&w.menu.every(id=>BYID[id])) applyWeekData(w); }
if(!Array.isArray(state.cooks)||state.cooks.length!==7) state.cooks=Array(7).fill(null);
function save(){ saveLocal(); if(typeof shareSync==="function"){ shareSync(); familySync(); goutsSync(); } }
function saveLocal(){ stashWeek(); try{localStorage.setItem(KEY,JSON.stringify({outDefault:state.outDefault,mix:state.mix,rayon:state.rayon,vueMenu:state.vueMenu,customStores:state.customStores,osmStores:state.osmStores,osmAt:state.osmAt,storeFix:state.storeFix,home:state.home,perso:state.perso,avis:state.avis,exclus:state.exclus,storeOrder:state.storeOrder,storeOff:state.storeOff,storeMode:state.storeMode,onboarded:state.onboarded,emails:state.emails,weekOffset:state.weekOffset,weeks:state.weeks,statut:state.statut,journal:state.journal,week:state.week,persons:state.persons,checked:state.checked,tab:state.tab,family:state.family,cooks:state.cooks,prices:state.prices,trip1:state.trip1,trip2:state.trip2,tripStore:state.tripStore,gamme:state.gamme,maxStores:state.maxStores,seuil:state.seuil}))}catch(e){}}
const esc=s=>String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
function cookSelect(d,extra=""){
  const v=state.cooks[d];
  if(!state.family.length) return `<span class="empty">Ajoutez la famille dans Réglages</span>`;
  return `<select data-cook="${d}" class="${v?"set":""}" aria-label="Qui cuisine le ${JOURS[d]}"${extra}><option value="">Personne</option>${state.family.map(n=>`<option${n===v?" selected":""}>${esc(n)}</option>`).join("")}</select>`;
}

const nf = new Intl.NumberFormat("fr-BE",{maximumFractionDigits:2});
function plural(u,c){ if(!u||c<=1) return u; if(u.endsWith("s")) return u; if(u.endsWith("eau")) return u+"x"; return u+"s"; }
const qtyOf = i => (state.qtEdit&&state.qtEdit[i.k]) ? state.qtEdit[i.k] : i.x ? (i.qt||"") : fmt(i.q,i.u);
function fmt(q,u){
  if(u==="g"){ q=Math.max(50,Math.round(q/50)*50); return q>=1000? nf.format(q/1000)+" kg" : q+" g"; }
  if(u==="cl"){ q=Math.max(5,Math.round(q/5)*5); return q>=100? nf.format(q/100)+" L" : q+" cl"; }
  const c=Math.max(1,Math.ceil(q-1e-9)); return u? c+" "+plural(u,c) : String(c);
}
// Nombre de personnes à table : présences de la famille + invités, sinon le réglage général
const outList = ex => Array.isArray(ex) ? ex : state.outDefault;
function isOut(d){ return d!==undefined && d!==null && outList(state.exterieur).includes(d); }
function toggleOut(d){ const cur=new Set(outList(state.exterieur)); cur.has(d)?cur.delete(d):cur.add(d); state.exterieur=[...cur].sort(); save(); render(); if(modalCtx) renderModal();
  toast(isOut(d)?`${JOURS[d]} : repas à l'extérieur, pas de courses`:`${JOURS[d]} : on mange à la maison`); }
const homeDays = () => JOURS.map((_,d)=>d).filter(d=>!isOut(d));
// ---- Ce qui manque pour valider : un plat et un cuisinier pour chaque soir où quelqu'un mange à la maison ----
function manques(){ const l=[];
  homeDays().filter(d=>headcount(d)>0).forEach(d=>{ const j=JOURS[d].toLowerCase();
    if(!BYID[state.week[d]]) l.push({d,court:"pas de plat le "+j}); else if(!state.cooks[d]) l.push({d,court:"pas de cuisinier le "+j}); });
  return l; }
// ---- Bulles d'aide : au survol (souris) ou au clavier, sur tout élément portant data-tip ----
(function(){ let bulle=null, minuteur=null, cible=null;
  const montrer=el=>{ const t=el.getAttribute("data-tip"); if(!t) return; if(!bulle){ bulle=document.createElement("div"); bulle.className="tip"; bulle.setAttribute("role","tooltip"); document.body.appendChild(bulle); }
    bulle.textContent=t; bulle.hidden=false; const r=el.getBoundingClientRect(), w=Math.min(280,innerWidth-24); bulle.style.maxWidth=w+"px";
    const bw=bulle.offsetWidth, bh=bulle.offsetHeight; let x=Math.max(12,Math.min(innerWidth-bw-12,r.left+r.width/2-bw/2)), y=r.bottom+8; if(y+bh>innerHeight-8) y=r.top-bh-8;
    bulle.style.left=x+"px"; bulle.style.top=y+"px"; };
  const cacher=()=>{ clearTimeout(minuteur); cible=null; if(bulle) bulle.hidden=true; };
  document.addEventListener("pointerover",e=>{ if(e.pointerType!=="mouse") return; const el=e.target.closest("[data-tip]"); if(el===cible) return; cacher(); if(!el) return; cible=el; minuteur=setTimeout(()=>montrer(el),350); });
  document.addEventListener("focusin",e=>{ const el=e.target.closest&&e.target.closest("[data-tip]"); cacher(); if(el&&el.matches(":focus-visible")){ cible=el; montrer(el); } });
  // sur téléphone : appui long sur un bouton pour voir son aide (l'action n'est alors pas déclenchée)
  let appui=null, bloquerClic=false;
  document.addEventListener("pointerdown",e=>{ if(e.pointerType==="mouse") return; const el=e.target.closest("[data-tip]"); if(!el) return;
    appui=setTimeout(()=>{ cible=el; montrer(el); bloquerClic=true; setTimeout(cacher,3500); },550); },true);
  ["pointerup","pointercancel","pointermove"].forEach(ev=>document.addEventListener(ev,e=>{ if(ev==="pointermove"&&Math.abs(e.movementX||0)+Math.abs(e.movementY||0)<6) return; clearTimeout(appui); },true));
  document.addEventListener("click",e=>{ if(bloquerClic){ bloquerClic=false; e.preventDefault(); e.stopPropagation(); } },true);
  document.addEventListener("contextmenu",e=>{ if(e.target.closest&&e.target.closest("[data-tip]")) e.preventDefault(); });
  ["focusout","scroll","keydown"].forEach(ev=>document.addEventListener(ev,cacher,true));
  document.addEventListener("click",()=>{ if(!bloquerClic) cacher(); },true);
})();
function manquesTexte(m){ const liste=l=>l.length>1?l.slice(0,-1).join(", ")+" et "+l[l.length-1]:l[0];
  const j=x=>JOURS[x.d].toLowerCase(), pc=m.filter(x=>x.court.startsWith("pas de cuisinier")).map(j), pp=m.filter(x=>x.court.startsWith("pas de plat")).map(j);
  return [pp.length?"il manque un plat "+liste(pp):"",pc.length?"il manque un cuisinier "+liste(pc):""].filter(Boolean).join(" ; "); }
// ---- Vue calendrier : la semaine comme dans l'export PDF, cases à compléter en orange ----
function renderCalendrier(){ const box=$("calendrier"), liste=$("days"); if(!box||!liste) return;
  const cal=(state.vueMenu||(innerWidth>=700?"cal":"liste"))==="cal"; box.hidden=!cal; liste.hidden=cal;
  document.querySelectorAll("[data-vue]").forEach(b=>b.classList.toggle("on",(b.dataset.vue==="cal")===cal));
  if(!cal) return;
  const cases=menuRows().map(x=>{ const today=x.date.getTime()===TODAY.getTime(), head=`<span class="chead"><span>${JOURS[x.d]}</span><small>${fmtShort(x.date)}</small></span>`;
    if(x.out) return `<div class="cbox dehors">${head}<span class="cvide"><b>Pas de repas à la maison</b><span>Soir à l'extérieur</span><button class="chip edit-only" data-acout="${x.d}" type="button">Prévoir un repas</button></span></div>`;
    if(!x.hc) return `<div class="cbox dehors">${head}<span class="cvide"><b>Personne à table</b><span>Tout le monde est absent</span></span></div>`;
    if(!x.r) return `<div class="cbox manque">${head}<span class="cvide"><b>Aucun plat prévu</b><button class="chip on edit-only" data-cpick="${x.d}" type="button">Choisir un plat</button></span></div>`;
    const sansCuisinier=!x.cook;
    return `<div class="cbox${today?" today":""}${sansCuisinier?" manque":""}" data-copen="${x.d}" role="button" tabindex="0" aria-label="${JOURS[x.d]} : ${esc(x.r.nom)}">${head}
      <img src="${photoSrc(x.r.id)}" alt="" loading="lazy" data-cache-err="1" decoding="async">
      <span class="cbody"><b>${esc(x.r.nom)}</b>${x.r.acc?`<small>avec ${esc(x.r.acc.toLowerCase())}</small>`:""}<small><span class="bdg b-${budgetOf(x.r)}">${BUDGETS[budgetOf(x.r)].court}</span> ${x.r.t} min${x.abs.length?` · absent : ${x.abs.map(esc).join(", ")}`:""}${x.inv?` · +${x.inv} invité${x.inv>1?"s":""}`:""}</small></span>
      <span class="cfoot"><span><small>Cuisine</small>${sansCuisinier?(state.family.length?`<span class="edit-only">${cookSelect(x.d)}</span>`:"<b>à définir</b>"):`<b>${esc(x.cook)}</b>`}</span><span><small>Couverts</small><span class="ccouv">${x.hc}</span></span></span></div>`; });
  const m=manques(), {ok}=approvalStats();
  cases.push(`<div class="cbox bref"><span class="chead"><span>La semaine en bref</span></span><span class="cbody">
    <small>${homeDays().length} soirs à la maison · ${totalCouverts()} couverts</small><small>Budget ≈ ${eur(weekCost(state.gamme))}</small>
    ${state.family.length?`<small>Validations : ${ok.length}/${state.family.length}</small>`:""}
    ${state.statut!=="valide"&&decompte(limiteDate())?`<small>Réponses avant ${esc(limiteTxt())} · il reste <b data-compte="${limiteDate().getTime()}">${decompte(limiteDate())}</b></small>`:""}
    <b style="color:${m.length?"var(--warm)":"var(--accent)"}">${m.length?"À compléter : "+esc(manquesTexte(m)):"✓ Prêt à être validé"}</b></span></div>`);
  box.innerHTML=cases.join("")+`<p class="calleg"><span><i style="background:var(--warm)"></i>à compléter</span><span><i style="background:var(--muted)"></i>pas de repas à la maison</span><span><i style="background:var(--accent)"></i>prêt</span></p>`; }
document.addEventListener("click",e=>{ const pd=e.target.closest("[data-pdfdirect]"); if(pd){ const t=pd.textContent; exportMenuPdf(pd).finally(()=>{ pd.disabled=false; pd.textContent=t; }); return; }
  const v=e.target.closest("[data-vue]"); if(v){ state.vueMenu=v.dataset.vue; saveLocal(); renderCalendrier(); return; }
  const pk=e.target.closest("[data-cpick]"); if(pk){ openSheet({type:"gallery",d:+pk.dataset.cpick}); return; }
  if(e.target.closest("select,button,a")) return; const c=e.target.closest("[data-copen]"); if(c) openMeal(state.week[+c.dataset.copen],+c.dataset.copen); });
document.addEventListener("keydown",e=>{ if(e.key!=="Enter") return; const c=e.target.closest&&e.target.closest("[data-copen]"); if(c&&e.target===c) openMeal(state.week[+c.dataset.copen],+c.dataset.copen); });
// ---- Page principale : les soirs sans repas prévu ou sans cuisinier ----
// ---- Nouveautés : recettes ajoutées (14 derniers jours) et promos nouvelles (7 derniers jours) ----
const ymd = d => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
function renderNouveautes(){ const box=$("nouveautes"); if(!box) return;
  const il14=new Date(TODAY); il14.setDate(il14.getDate()-14); const il7=new Date(TODAY); il7.setDate(il7.getDate()-7);
  const recs=RECETTES.filter(r=>r.ajoute && r.ajoute>=ymd(il14)).slice(0,8);
  const proms=PROMOS.filter(p=>p.du>=ymd(il7)).slice(0,8);
  if(!recs.length && !proms.length){ box.hidden=true; box.innerHTML=""; return; }
  box.hidden=false;
  box.innerHTML=`<div class="phead"><h2>Nouveautés</h2></div>
    ${recs.length?`<h3 class="nvh">Recettes ajoutées</h3><ul class="nvlist">${recs.map(r=>`<li><button class="link" data-openrec="${esc(r.id)}" type="button">${esc(r.nom)}</button> <small>ajoutée le ${esc(r.ajoute.slice(8,10))}/${esc(r.ajoute.slice(5,7))}</small></li>`).join("")}</ul>`:""}
    ${proms.length?`<h3 class="nvh">Nouvelles promos</h3><ul class="nvlist">${proms.map(p=>`<li><b>${esc(p.produit)}</b> <small>${esc(ENS[p.mag]||p.mag)} · ${p.prix.toFixed(2).replace(".",",")} € · jusqu'au ${esc(p.au.slice(8,10))}/${esc(p.au.slice(5,7))}</small></li>`).join("")}</ul>`:""}`;
}
function renderACompleter(){ const box=$("acompleter"); if(!box) return;
  const sansCuisinier=homeDays().filter(d=>headcount(d)>0&&!state.cooks[d]);
  const dehors=JOURS.map((_,d)=>d).filter(d=>isOut(d)), personne=homeDays().filter(d=>headcount(d)===0);
  const jour=d=>`${JOURS[d].slice(0,3)}<br>${fmtShort(dayOffset(d))}`;
  if(!sansCuisinier.length&&!personne.length&&!dehors.length){ box.className="panel acomp ok"; box.innerHTML=`<p>✓ Chaque soir a un repas et un cuisinier.</p>`; return; }
  box.className="panel acomp";
  const lignes=[...sansCuisinier.map(d=>({d,html:`<span class="acday">${jour(d)}</span><span class="acinfo"><b>${esc(BYID[state.week[d]].nom)}</b><small>Pas encore de cuisinier · ${headcount(d)} à table</small></span><span class="edit-only">${state.family.length?cookSelect(d):""}</span>`})),
    ...personne.map(d=>({d,html:`<span class="acday">${jour(d)}</span><span class="acinfo"><b>Personne à table</b><small>Tout le monde est absent : pas de repas prévu</small></span><span></span>`})),
    ...dehors.map(d=>({d,html:`<span class="acday">${jour(d)}</span><span class="acinfo"><b>Pas de repas prévu à la maison</b><small>Soir marqué « à l'extérieur »</small></span><button class="chip edit-only" data-acout="${d}" type="button">Prévoir un repas</button>`}))].sort((x,y)=>x.d-y.d);
  box.innerHTML=`<div class="phead"><h2>À compléter cette semaine</h2>${sansCuisinier.length>1&&state.family.length?`<button class="btn edit-only" id="acrepartir" type="button" data-tip="Attribue ces soirs aux personnes présentes, en commençant par celles qui cuisinent le moins">Répartir ces soirs</button>`:""}</div>
    ${!state.family.length?`<p class="note">Ajoutez les membres de la famille pour choisir qui cuisine.</p>`:""}
    ${lignes.map(l=>`<div class="acrow">${l.html}</div>`).join("")}`; }
document.addEventListener("click",e=>{ const o=e.target.closest("[data-acout]"); if(o){ toggleOut(+o.dataset.acout); return; }
  if(e.target.closest("#acrepartir")){ const vides=homeDays().filter(d=>headcount(d)>0&&!state.cooks[d]), cnt={};
    state.family.forEach(n=>cnt[n]=state.cooks.filter(c=>c===n).length);
    vides.forEach(d=>{ const dispo=presentAt(d).filter(n=>state.family.includes(n)); const l=(dispo.length?dispo:state.family).slice().sort((a,b)=>cnt[a]-cnt[b]||Math.random()-.5); state.cooks[d]=l[0]; cnt[l[0]]++; });
    save(); render(); toast(`${vides.length} soirs répartis entre les présents`); } });
function headcount(d){
  if(isOut(d)) return 0;
  if(d===undefined||d===null) return state.persons;
  const inv=Math.max(0,+(state.invites[d]||0));
  if(!state.family.length) return state.persons+inv;
  return state.family.filter(n=>!(state.absents[n]||[]).includes(d)).length+inv;
}
const scale = (q,d) => q*headcount(d)/5;
const totalCouverts = () => JOURS.reduce((s,_,d)=>s+headcount(d),0);

function courses(){
  const map=new Map();
  state.week.forEach((id,d)=>{ if(!headcount(d)) return; const r=BYID[id]; r.ing.forEach(([n,q,u,ray])=>{
    const k=n+"|"+u; if(!map.has(k)) map.set(k,{k,n,u,ray,q:0,pour:new Set()});
    const it=map.get(k); it.q+=scale(q,d); it.pour.add(JOURS[d]); }); });
  return [...map.values()].sort((a,b)=>ORDRE.indexOf(a.ray)-ORDRE.indexOf(b.ray)||a.n.localeCompare(b.n,"fr"));
}

const $=id=>document.getElementById(id);
const todayIdx=(new Date().getDay()+6)%7;

function renderStats(){
  const hd=homeDays(), mins=hd.reduce((s,d)=>s+BYID[state.week[d]].t,0);
  const n=courses().length;
  $("stats").innerHTML=`<span><b>${hd.length}</b> soirs à la maison</span><span><b>${Math.floor(mins/60)} h ${String(mins%60).padStart(2,"0")}</b> en cuisine</span><span><b>${n}</b> articles</span>`;
  $("persons").textContent=state.persons+(state.persons>1?" personnes":" personne");
  document.querySelector(".stepper").hidden=!!state.family.length;
}

function renderDays(){
  $("days").innerHTML=state.week.map((id,d)=>{const r=BYID[id];
    if(isOut(d)) return `<article class="day out${dayOffset(d).getTime()===TODAY.getTime()?" today":""}" id="day-${d}">
      <button class="dcard" data-open="${d}" aria-label="${JOURS[d]} : repas à l'extérieur, ouvrir la fiche">
        <span class="dthumbbox outbox" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M7 3v8a2 2 0 0 0 4 0V3M9 11v10M17 3c-2 0-3 3-3 7h3v11"/></svg></span>
        <span class="dinfo"><span class="dday">${JOURS[d]} ${fmtShort(dayOffset(d))}</span><b class="dish">Repas à l'extérieur</b><span class="dmeta">Pas de cuisine ni de courses ce soir</span></span>
        <span class="dchev" aria-hidden="true">›</span></button></article>`;
    const isToday=dayOffset(d).getTime()===TODAY.getTime(), pc=promoCount(r), hc=headcount(d), w=dislikesFor(r,d);
    const et=etatJour(d), vtag=verrouille()?(et==="passe"?`<span class="jstat passe">Passé</span>`:et==="avenir"?`<span class="jstat prevu">Prévu</span>`:""):"";
    return `<article class="day${isToday?" today":""}${et==="passe"?" passe":""}" id="day-${d}">
      <button class="dgrip" type="button" aria-label="Glisser pour échanger ce repas avec un autre soir" data-tip="Glisser pour échanger ce repas avec un autre soir">⠿</button>
      <button class="dcard" data-open="${d}" aria-label="${JOURS[d]} : ${esc(r.nom)}, ouvrir la fiche">
        <span class="dthumbbox"><img class="dthumb" src="${photoSrc(id)}" alt="" loading="lazy" data-cache-err="1" decoding="async"></span>
        <span class="dinfo">
          <span class="dday">${JOURS[d]} ${fmtShort(dayOffset(d))}${isToday?' <span class="tonight">Ce soir</span>':""}${vtag}</span>
          <b class="dish">${esc(r.nom)}</b>
          <span class="dmeta"><span class="bdg b-${budgetOf(r)}">${BUDGETS[budgetOf(r)].court}</span> ${hc?`${r.t} min · ${hc} à table`:"Personne à table"}${state.cooks[d]?` · <span class="dcook">${esc(state.cooks[d])} cuisine</span>`:(hc?` · <span class="dnocook">pas de cuisinier</span>`:"")}${pc&&hc?` · <span class="promo">promo</span>`:""}</span>
          ${w.length&&hc?`<span class="dwarn">${esc(w.join(", "))} n'aime${w.length>1?"nt":""} pas ce plat</span>`:""}
        </span>
        <span class="dchev" aria-hidden="true">›</span>
      </button>
    </article>`}).join("");
}

// ---- Glisser-déposer : une poignée ⠿ sur chaque soir pour échanger deux repas ----
let dragRepas=null, dragBouge=false;
$("days").addEventListener("pointerdown", e=>{
  const g=e.target.closest(".dgrip"); if(!g) return;
  if(document.body.classList.contains("verrou")||document.body.classList.contains("readonly")){ toast("Menu verrouillé : impossible de déplacer"); return; }
  e.preventDefault(); dragBouge=false;
  const art=g.closest("article.day"); try{ g.setPointerCapture(e.pointerId); }catch(err){}
  dragRepas={from:+art.id.slice(4), id:e.pointerId, x:e.clientX, y:e.clientY, el:art, over:null};
  art.classList.add("dragging");
});
document.addEventListener("pointermove", e=>{
  const d=dragRepas; if(!d||e.pointerId!==d.id) return;
  e.preventDefault(); dragBouge=true;
  d.el.style.transform=`translate(${e.clientX-d.x}px,${e.clientY-d.y}px)`;
  document.querySelectorAll(".day.dover").forEach(x=>x.classList.remove("dover"));
  const cible=document.elementFromPoint(e.clientX,e.clientY)?.closest("article.day:not(.out)");
  d.over=(cible&&cible.id!==d.el.id)?+cible.id.slice(4):null;
  if(d.over!=null) cible.classList.add("dover");
}, {passive:false});
function finDeplacement(annule){
  const d=dragRepas; if(!d) return; dragRepas=null;
  d.el.style.transform=""; d.el.classList.remove("dragging");
  document.querySelectorAll(".day.dover").forEach(x=>x.classList.remove("dover"));
  if(!annule && d.over!=null && d.over!==d.from){
    const a=d.from, b=d.over, prev=[...state.week];
    [state.week[a],state.week[b]]=[state.week[b],state.week[a]];
    save(); render();
    toast(`${JOURS[a]} et ${JOURS[b]} échangés`,()=>{ state.week=prev; save(); render(); toast("Échange annulé"); });
  }
}
document.addEventListener("pointerup", e=>{ if(dragRepas&&e.pointerId===dragRepas.id) finDeplacement(false); });
document.addEventListener("pointercancel", e=>{ if(dragRepas&&e.pointerId===dragRepas.id) finDeplacement(true); });
// Après un glisser, le clic qui suit n'ouvre pas la fiche du repas
document.addEventListener("click", e=>{ if(dragBouge){ e.stopPropagation(); e.preventDefault(); dragBouge=false; } }, true);

