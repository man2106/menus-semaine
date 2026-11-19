// ===================== Données mises à jour par la tâche du lundi et du mercredi =====================
const PRIX_REELS={}; // ingrédients dont le prix vient de vos tickets
// donnees/promos.json : promos relevées dans les folders ; donnees/recettes.json : nouvelles recettes de la bibliothèque
const txtOk = (v,max) => typeof v==="string" ? cleanTxt(v).slice(0,max) : "";
function accepterRecette(x){
  if(!x||typeof x!=="object"||typeof x.id!=="string"||!/^[a-z][a-z0-9]{2,30}$/.test(x.id)||BYID[x.id]) return null;
  const ing=(Array.isArray(x.ing)?x.ing:[]).filter(i=>Array.isArray(i)&&typeof i[0]==="string").slice(0,15)
    .map(([n,q,u,ray])=>[txtOk(n,40),Math.max(0,+q||0),typeof u==="string"?txtOk(u,12):"",RAYKEYS.includes(ray)?ray:"epi"]).filter(i=>i[0]);
  const etapes=(Array.isArray(x.etapes)?x.etapes:[]).map(e=>txtOk(e,400)).filter(Boolean).slice(0,8);
  if(ing.length<2||etapes.length<2) return null;
  return {ajoute:typeof x.ajoute==="string"&&/^\d{4}-\d\d-\d\d$/.test(x.ajoute)?x.ajoute:null,id:x.id,nom:txtOk(x.nom,60)||"Recette",acc:txtOk(x.acc,60),t:Math.max(5,Math.min(30,+x.t||30)),
    b:["eco","moyen","plaisir"].includes(x.b)?x.b:undefined,p:PROT[x.p]?x.p:undefined,f:FECU[x.f]?x.f:undefined,c:CUISINES[x.c]?x.c:undefined,
    astuce:txtOk(x.astuce,200),ing,etapes,nouveau:true,
    source:x.source&&typeof x.source.url==="string"&&/^https:\/\//.test(x.source.url)?{titre:txtOk(x.source.titre,80),url:x.source.url.slice(0,300)}:null,
    ajoute:typeof x.ajoute==="string"&&/^\d{4}-\d\d-\d\d$/.test(x.ajoute)?x.ajoute:null, proposePar:propre(x.propose_par,30)||null};
}
// ===================== Fiches produits (photo, description, prix) =====================
const PRODUITS=new Map(), PRIX_DETAIL={};
const MOIS=["janvier","février","mars","avril","mai","juin","juillet","août","septembre","octobre","novembre","décembre"];
function accepterProduit(x){ if(!x||typeof x!=="object") return null; const n=txtOk(x.n,50); if(!n) return null;
  const ok=(a,u)=>Array.isArray(a)&&+a[0]>0&&+a[0]<500&&["kg","L","u"].includes(a[1]);
  const photo=typeof x.photo==="string"&&/^photos\/produits\/[a-z0-9-]+\.(jpg|png|webp)$/.test(x.photo)?x.photo:null;
  const credit=typeof x.credit==="string"&&/^https:\/\/commons\.wikimedia\.org\/wiki\/File:[^\s"'<>]+$/.test(x.credit)?x.credit:null;
  const saison=Array.isArray(x.saison)&&x.saison.length===2&&x.saison.every(m=>Number.isInteger(m)&&m>=1&&m<=12)?x.saison:null;
  const mags=Array.isArray(x.magasins)?x.magasins.filter(m=>m&&ENS[m.mag]&&+m.prix>0&&/^\d{4}-\d\d-\d\d$/.test(m.date||"")).slice(0,20).map(m=>({mag:m.mag,prix:+m.prix,format:txtOk(m.format,60),unitaire:ok(m.unitaire)?[+m.unitaire[0],m.unitaire[1]]:null,date:m.date,source:typeof m.source==="string"&&/^https:\/\/[^\s"'<>]+$/.test(m.source)?m.source:null})):[];
  return {n,ray:RAYONS[x.ray]?x.ray:"epi",desc:txtOk(x.desc,300),format:txtOk(x.format,120),conserver:txtOk(x.conserver,160),saison,ref:ok(x.ref)?[+x.ref[0],x.ref[1]]:null,photo,credit:photo?credit:null,
    alias:Array.isArray(x.alias)?x.alias.map(a=>txtOk(a,50)).filter(Boolean).slice(0,8):[],magasins:mags}; }
function produitDe(n){ const k=norm(n); if(!k) return null; return PRODUITS.get(k)||PRODUITS.get(k.replace(/s$/,""))||PRODUITS.get(k+"s")||PRODUITS.get(k.replace(/x$/,""))||null; }
function deSaison(p,m){ if(!p||!p.saison) return null; const [a,b]=p.saison; return a<=b ? (m>=a&&m<=b) : (m>=a||m<=b); }
function vignetteProduit(n){ const p=produitDe(n); if(!p) return "";
  return `<button type="button" class="pthumb" data-prod="${esc(n)}" aria-label="Fiche produit : ${esc(n)}" data-tip="Photo, description et prix">${p.photo?`<img src="${p.photo}" alt="" loading="lazy" decoding="async">`:`<span aria-hidden="true">i</span>`}</button>`; }
const UNOM={kg:"kg",L:"litre",u:"pièce"};
function ouvrirProduit(n){ const p=produitDe(n); if(!p) return; const nom=p.n, m=new Date().getMonth()+1;
  const ref=PRIX[nom]||p.ref, reel=PRIX_DETAIL[nom]||[], promos=promosFor(nom).filter(x=>isoDate(x.au)>=TODAY);
  const sais=deSaison(p,m);
  const lignesReel=reel.slice(-8).reverse().map(r=>`<li><b>${r.mag?esc(ENS[r.mag]):"Magasin ?"}</b> · ${eur(r.p)} / ${UNOM[r.u]||r.u}<small>${r.produit?esc(r.produit)+" · ":""}ticket du ${fmtShort(isoDate(r.date))}</small></li>`).join("");
  const lignesMag=p.magasins.map(x=>`<li><b>${esc(ENS[x.mag])}</b> · ${eur(x.prix)}${x.format?" ("+esc(x.format)+")":""}${x.unitaire?` · ${eur(x.unitaire[0])} / ${UNOM[x.unitaire[1]]}`:""}<small>relevé du ${fmtShort(isoDate(x.date))}${x.source?` · <a href="${esc(x.source)}" target="_blank" rel="noopener">source</a>`:""}</small></li>`).join("");
  const lignesPromo=promos.map(x=>`<li><b>${esc(ENS[x.mag])}</b> · ${eur(x.prix)}${x.avant?` <s>${eur(x.avant)}</s>`:""}<small>${esc(x.produit||"")} · du ${fmtShort(isoDate(x.du))} au ${fmtShort(isoDate(x.au))}</small></li>`).join("");
  $("ptitle").textContent=nom; $("peyebrow").textContent=RAYONS[p.ray]||"";
  $("pbody").innerHTML=`${p.photo?`<figure class="mphoto pphoto"><img src="${p.photo}" alt="${esc(nom)}" decoding="async" loading="lazy">${p.credit?`<figcaption>Photo d'illustration : <a href="${esc(p.credit)}" target="_blank" rel="noopener">Wikimedia Commons</a> (auteur et licence libre sur la page du fichier)</figcaption>`:""}</figure>`:""}
    ${p.desc?`<p class="pdesc">${esc(p.desc)}</p>`:""}
    <dl class="pinfo">${p.format?`<dt>Conditionnement courant</dt><dd>${esc(p.format)}</dd>`:""}${p.conserver?`<dt>Conservation</dt><dd>${esc(p.conserver)}</dd>`:""}
    ${p.saison?`<dt>Saison</dt><dd>${(p.saison[0]===1&&p.saison[1]===12)||p.saison[1]===p.saison[0]-1?"Disponible toute l'année":`${sais?`<span class="pseason">De saison en ${MOIS[m-1]}</span> · `:`Pas de saison en ${MOIS[m-1]} · `}de ${MOIS[p.saison[0]-1]} à ${MOIS[p.saison[1]-1]}`}</dd>`:""}</dl>
    <section><h3><span>Prix</span>${ref?`<span class="mtotal">≈ ${eur(ref[0])} / ${UNOM[ref[1]]||ref[1]}</span>`:""}</h3>
      ${ref?`<p class="note">${PRIX_REELS[nom]?`Prix calculé d'après vos tickets de caisse (${PRIX_REELS[nom].n} relevé${PRIX_REELS[nom].n>1?"s":""}).`:"Prix de référence estimé (marque de distributeur) : il sera remplacé par vos prix réels dès qu'un ticket le contiendra."}</p>`:`<p class="note">Pas encore de prix connu pour ce produit.</p>`}
      ${lignesPromo?`<h4>En promo</h4><ul class="plist">${lignesPromo}</ul>`:""}
      ${lignesReel?`<h4>Sur vos tickets</h4><ul class="plist">${lignesReel}</ul>`:""}
      ${lignesMag?`<h4>Prix relevés en magasin</h4><ul class="plist">${lignesMag}</ul>`:""}
      ${!lignesReel?`<p class="note">Envoyez la photo de vos tickets (onglet Courses) : les prix de chaque enseigne s'afficheront ici.</p>`:""}
    </section>`;
  pLast=document.activeElement; $("poverlay").hidden=false; $("pclose").focus(); }
let pLast=null;
function fermerProduit(){ $("poverlay").hidden=true; if(pLast&&pLast.focus) try{pLast.focus()}catch(e){} }
$("pclose").addEventListener("click",fermerProduit);
$("poverlay").addEventListener("click",e=>{ if(e.target.id==="poverlay") fermerProduit(); });
document.addEventListener("keydown",e=>{ if(e.key==="Escape"&&!$("poverlay").hidden){ e.stopPropagation(); fermerProduit(); } },true);
document.addEventListener("click",e=>{ const b=e.target.closest&&e.target.closest("[data-prod]"); if(!b) return; e.preventDefault(); e.stopPropagation(); ouvrirProduit(b.dataset.prod); },true);
async function chargerDonnees(){
  const lire=async f=>{ try{ const r=await fetch(f+"?v="+Date.now(),{cache:"no-store"}); return r.ok?await r.json():null; }catch(e){ return null; } };
  const [P,R,X,D]=await Promise.all([lire("donnees/promos.json"),lire("donnees/recettes.json"),lire("donnees/prix.json"),lire("donnees/produits.json")]); let ch=false;
  if(D&&Array.isArray(D.produits)){ D.produits.slice(0,3000).forEach(x=>{ const v=accepterProduit(x); if(!v) return; PRODUITS.set(norm(v.n),v); (v.alias||[]).forEach(a=>{ if(!PRODUITS.has(norm(a))) PRODUITS.set(norm(a),v); });
      if(v.ref&&!PRIX[v.n]) PRIX[v.n]=v.ref; }); ch=true; }
  Object.keys(PRIX).forEach(k=>{ if(!PRODUITS_REF[k]) PRODUITS_REF[k]=[...PRIX[k]]; });
  if(X&&Array.isArray(X.releves)){ const lim=new Date(TODAY); lim.setDate(lim.getDate()-120); const par={};
    X.releves.slice(-5000).forEach(r=>{ if(!r||typeof r.ing!=="string"||!(+r.prixUnitaire>0)||!["kg","L","u"].includes(r.unite)||!/^\d{4}-\d\d-\d\d$/.test(r.date||"")||isoDate(r.date)<lim) return;
      const k=r.ing+"|"+r.unite; (par[k]=par[k]||[]).push({p:+r.prixUnitaire,mag:ENS[r.mag]?r.mag:null});
      (PRIX_DETAIL[r.ing]=PRIX_DETAIL[r.ing]||[]).push({mag:ENS[r.mag]?r.mag:null,p:Math.round(+r.prixUnitaire*100)/100,u:r.unite,date:r.date,produit:txtOk(r.produit,60)}); });
    Object.entries(par).forEach(([k,l])=>{ const [ing,un]=k.split("|"); const ref=PRIX[ing]; if(ref&&ref[1]!==un) return;
      const v=l.map(x=>x.p).sort((a,b)=>a-b), med=v[Math.floor(v.length/2)]; PRIX[ing]=[Math.round(med*100)/100,un]; PRIX_REELS[ing]={n:l.length,mags:[...new Set(l.map(x=>x.mag).filter(Boolean))]}; ch=true; }); }
  if(P&&Array.isArray(P.promos)){
    const l=P.promos.filter(x=>x&&ENS[x.mag]&&typeof x.ing==="string"&&+x.prix>0&&/^\d{4}-\d\d-\d\d$/.test(x.du||"")&&/^\d{4}-\d\d-\d\d$/.test(x.au||""))
      .slice(0,400).map(x=>({mag:x.mag,produit:txtOk(x.produit,80),prix:+x.prix,avant:+x.avant>0?+x.avant:null,du:x.du,au:x.au,ing:txtOk(x.ing,40)}));
    if(l.length){ PROMOS.length=0; PROMOS.push(...l); if(typeof P.releve==="string") RELEVE=txtOk(P.releve,40); if(/^\d{4}-\d\d-\d\d$/.test(P.date||"")) RELEVE_ISO=P.date; ch=true; }
  }
  if(R&&Array.isArray(R.recettes)){
    if(R.prix&&typeof R.prix==="object") Object.entries(R.prix).forEach(([k,v])=>{ if(!PRIX[k]&&Array.isArray(v)&&+v[0]>0&&["kg","L","u"].includes(v[1])) PRIX[k]=[+v[0],v[1]]; });
    R.recettes.slice(0,1500).forEach(x=>{ const r=accepterRecette(x); if(!r) return; RECETTES.push(r); BYID[r.id]=r; ETAPES[r.id]=r.etapes; ch=true; });
  }
  if(ch){ render(); if(state.tab==="envies"&&typeof renderEnvies==="function") renderEnvies(); }
}
// ---- Rubriques pliables : cliquer sur le titre d'un bloc le replie ou le déplie. Mémorisé sur cet appareil. ----
const PLIS_KEY="menus-plis";
let plis={}; try{ plis=JSON.parse(localStorage.getItem(PLIS_KEY)||"{}")||{}; }catch(e){ plis={}; }
const appliquerPlis = () => document.querySelectorAll(".panel[id]").forEach(p=>{ if(plis[p.id]) p.classList.add("fermee"); else p.classList.remove("fermee"); });
document.addEventListener("click", e=>{
  const titre=e.target.closest(".panel[id]>h2:first-child,.panel[id]>h3:first-child,.panel[id]>.phead:first-child");
  if(!titre || e.target.closest("button,a,select,input,label,textarea,summary")) return;
  const pn=titre.parentElement; plis[pn.id]=!plis[pn.id]; try{ localStorage.setItem(PLIS_KEY,JSON.stringify(plis)); }catch(err){}
  pn.classList.toggle("fermee", !!plis[pn.id]);
});
if($("nouveautes")) $("nouveautes").addEventListener("click",e=>{const b=e.target.closest("[data-openrec]"); if(b) openMeal(b.dataset.openrec,null);});
const _renderPlis = render; render = function(){ _renderPlis(); appliquerPlis(); };
// Le rappel se met à jour tout seul : le repas du soir apparaît à 19 h sans recharger la page
setInterval(()=>{ if(state.tab==='menu') renderRetours(); }, 60000);
chargerDonnees();

// ===================== Visite guidée (première ouverture sur un appareil) =====================
const VISITE=[
 {sel:null,t:"Bienvenue !",p:"Voici une visite rapide de l'application des menus de la famille. Elle dure une minute. Vous pourrez la revoir dans Réglages, rubrique Aide."},
 {sel:"#acompleter",t:"Ce qu'il reste à faire",p:"Les soirs sans cuisinier ou sans repas prévu s'affichent ici. Choisissez qui cuisine directement dans la liste. Tant qu'il manque quelque chose, le menu ne peut pas être validé."},
 {sel:"#weekbar .wtop",t:"La semaine",p:"Les flèches passent d'une semaine à l'autre. Vous pouvez préparer jusqu'à trois semaines à l'avance."},
 {sel:"#share",t:"Prévenir la famille",p:"Prépare un message avec le menu et le lien de l'application, à envoyer par WhatsApp ou SMS."},
 {sel:"#weekbar .appr",t:"Chacun valide",p:"Chaque membre indique qu'il est d'accord avec le menu. Le propriétaire peut fixer une date limite de réponse, puis valider le menu final."},
 {sel:"#days .day",t:"Les repas",p:"Touchez un jour pour voir la recette, les courses du plat, changer de plat, choisir qui cuisine ou noter une absence. Les étiquettes Éco, Moyen et Plaisir indiquent le budget."},
 {sel:"#tab-courses",t:"Les courses",p:"La liste se fait toute seule, groupée par magasin et par rayon, en deux passages par semaine. Le mode magasin permet de cocher en avançant dans les rayons."},
 {sel:"#tab-famille",t:"La famille",p:"Qui est là chaque soir, qui cuisine, les goûts de chacun, et les avis donnés après les repas."},
 {sel:"#tab-plus",t:"Vos envies",p:"Répondez au sondage : dites quels plats vous font envie. Les menus proposés en tiennent compte, et des plannings sont suggérés pour les semaines suivantes."},
 {sel:"#tab-plus",t:"Les réglages",p:"Votre adresse et vos magasins, les jours de courses, les recettes de la famille et l'accès des membres."},
 {sel:null,t:"C'est parti !",p:"Passez la souris sur un bouton (ou gardez le doigt appuyé sur mobile) pour savoir à quoi il sert. Bon appétit !"}];
let visite=null;
function visiteFin(){ if(!visite) return; visite.els.forEach(e=>e.remove()); visite=null; try{ localStorage.setItem(KEY+"-visite","1"); }catch(e){} document.removeEventListener("keydown",visiteClavier,true); window.removeEventListener("resize",visitePlacer); }
function visiteClavier(e){ if(!visite) return; if(e.key==="Escape"){ e.stopPropagation(); visiteFin(); } if(e.key==="ArrowRight"||e.key==="Enter"){ e.preventDefault(); visiteAller(visite.i+1); } if(e.key==="ArrowLeft") visiteAller(visite.i-1); }
function visiteEtapes(){ return VISITE.filter(x=>{ if(!x.sel) return true; const el=document.querySelector(x.sel); return el&&el.offsetParent!==null&&el.getClientRects().length; }); }
function visitePlacer(){ if(!visite) return; const x=visite.etapes[visite.i], [voile,trou,bulle]=visite.els; const el=x.sel&&document.querySelector(x.sel);
  if(el){ const r=el.getBoundingClientRect(), m=6; Object.assign(trou.style,{left:(r.left-m)+"px",top:(r.top-m)+"px",width:(r.width+2*m)+"px",height:(r.height+2*m)+"px",opacity:1});
    const bh=bulle.offsetHeight, bw=bulle.offsetWidth; let y=r.bottom+14; if(y+bh>innerHeight-10) y=Math.max(10,r.top-bh-14); if(y<10) y=10;
    bulle.style.left=Math.max(12,Math.min(innerWidth-bw-12,r.left+r.width/2-bw/2))+"px"; bulle.style.top=y+"px"; }
  else { Object.assign(trou.style,{left:(innerWidth/2)+"px",top:(innerHeight/2)+"px",width:"0px",height:"0px"}); bulle.style.left=Math.max(12,(innerWidth-bulle.offsetWidth)/2)+"px"; bulle.style.top=Math.max(20,(innerHeight-bulle.offsetHeight)/2)+"px"; } }
function visiteAller(i){ if(!visite) return; if(i<0) return; if(i>=visite.etapes.length){ visiteFin(); return; } visite.i=i; const x=visite.etapes[i], bulle=visite.els[2], n=visite.etapes.length;
  bulle.innerHTML=`<h3>${x.t}</h3><p>${x.p}</p><div class="tour-pied"><small>${i+1} / ${n}</small><span class="actions">${i>0?`<button class="btn" data-tour="prev" type="button">Précédent</button>`:`<button class="btn" data-tour="fin" type="button">Passer</button>`}<button class="btn primary" data-tour="next" type="button">${i===n-1?"Terminer":"Suivant"}</button></span></div>`;
  const el=x.sel&&document.querySelector(x.sel); if(el){ const r=el.getBoundingClientRect(); if(r.top<70||r.bottom>innerHeight-90) window.scrollBy({top:r.top-innerHeight/3,behavior:"instant"}); }
  requestAnimationFrame(visitePlacer); setTimeout(()=>{ const b=bulle.querySelector('[data-tour="next"]'); if(b) b.focus(); },50); }
function lancerVisite(){ if(visite) return; if(sheetCtx) closeSheet(); if(modalCtx) closeMeal(); setTab("menu"); window.scrollTo(0,0);
  const voile=document.createElement("div"), trou=document.createElement("div"), bulle=document.createElement("div");
  voile.className="tour-voile"; trou.className="tour-trou"; bulle.className="tour-bulle"; bulle.setAttribute("role","dialog"); bulle.setAttribute("aria-label","Visite guidée");
  document.body.append(voile,trou,bulle); visite={i:0,els:[voile,trou,bulle],etapes:visiteEtapes()};
  voile.addEventListener("click",()=>visiteAller(visite.i+1));
  bulle.addEventListener("click",e=>{ const b=e.target.closest("[data-tour]"); if(!b) return; const a=b.dataset.tour; if(a==="next") visiteAller(visite.i+1); else if(a==="prev") visiteAller(visite.i-1); else visiteFin(); });
  document.addEventListener("keydown",visiteClavier,true); window.addEventListener("resize",visitePlacer); visiteAller(0); }
let visiteEssais=0;
function peutEtreVisite(){ let fait=null; try{ fait=localStorage.getItem(KEY+"-visite"); }catch(e){ return; } if(fait) return;
  const g=document.getElementById("gate"); if((g&&!g.hidden)||sheetCtx||modalCtx||!state.family.length){ if(++visiteEssais<40) setTimeout(peutEtreVisite,3000); return; }
  lancerVisite(); }
$("retour-visite").onclick=()=>lancerVisite();
setTimeout(peutEtreVisite,2500);

// démarrage du partage (silencieux si la page n'est pas partagée)
(async()=>{
  try{
    if(!window.claude||!window.claude.use) { setSync("local"); setTimeout(maybeWizard,300); return; }
    const [db,u,dl]=await Promise.all([window.claude.use("db"),window.claude.use("user"),window.claude.use("downloads")]);
    DL=dl; if(sheetCtx&&sheetCtx.type==="export") renderExport();
    USER=u; if(!db){ setSync("local"); setTimeout(maybeWizard,300); return; }
    DB=db; ME=u?await u.id():null;
    const c=u?await u.can("data.write"):null; CAN_WRITE=c;
    window.__dbReady=true;
    IS_OWNER = u ? await u.isOwner() : true; if(!IS_OWNER) document.body.classList.add("notowner");
    DB.doc("validations/menus").onSnapshot(snap=>{ const dd=snap.exists?snap.data():{}; VALID=(dd.semaines&&typeof dd.semaines==="object")?{...dd.semaines}:{}; LIMITES=(dd.limites&&typeof dd.limites==="object")?{...dd.limites}:{}; applyValidation(); saveLocal(); render(); },()=>{});
    if(c===false){ document.body.classList.add("readonly"); }
    subscribeRecettes(); subscribeGouts(); subscribeWeek(); subscribeFamily(); subscribeRetours(); subscribeSondage(); subscribeSugg(); subscribeGoogle(); subscribePlacard(); subscribeTicketsPh(); subscribePhotosPlats();
    setTimeout(maybeWizard,1500);
  }catch(e){ setSync("local"); setTimeout(maybeWizard,300); }
})();
$("reset").onclick=()=>{state.week=state.weekOffset===0?[...DEFAUT]:proposeMenu();state.persons=state.family.length||5;state.checked={};state.cooks=Array(7).fill(null);state.picking=null;save();render();toast("Menu proposé rétabli");};

// ---- Ajout manuel de produits à la liste de courses, avec aide à la saisie ----
const CATALOGUE = {
 fl:["Pommes","Poires","Bananes","Oranges","Clémentines","Citrons","Kiwis","Raisins","Fraises","Avocats","Concombre","Salade","Tomates cerises","Ail","Échalotes","Persil","Ciboulette","Basilic","Radis","Brocoli","Chou-fleur","Melon","Ananas","Mangues","Myrtilles"],
 bou:["Jambon","Saucisson","Salami","Pâté","Filet de dinde","Filet de poulet","Haché","Américain","Boulettes","Poulet entier","Côtelettes de porc","Steaks"],
 cre:["Lait","Beurre","Margarine","Yaourts","Yaourts aux fruits","Fromage blanc","Skyr","Crème fraîche","Œufs","Gouda","Emmental râpé","Brie","Fromage à tartiner","Desserts lactés","Lait d'avoine","Crème soja"],
 bl:["Pain","Pain gris","Pain blanc","Baguette","Pistolets","Croissants","Couques","Pain de mie","Cramique","Sandwichs"],
 epi:["Café","Café en grains","Dosettes de café","Thé","Sucre","Farine","Sel","Poivre","Huile d'olive","Huile de tournesol","Vinaigre","Moutarde","Mayonnaise","Ketchup","Confiture","Choco","Miel","Céréales","Flocons d'avoine","Biscuits","Speculoos","Gaufres","Chocolat","Chips","Cacahuètes","Riz","Pâtes","Sauce tomate","Thon","Maïs","Compote","Bouillon","Épices","Levure","Cacao","Lait UHT","Croquettes pour chat","Croquettes pour chien"],
 boi:["Eau plate","Eau pétillante","Jus d'orange","Jus de pomme","Limonade","Soda","Coca","Ice tea","Sirop","Bière","Vin","Bières spéciales","Vin rouge","Vin blanc","Vin rosé","Chocolat chaud"],
 sur:["Frites surgelées","Glace","Légumes surgelés","Pizza surgelée","Poisson pané","Épinards surgelés","Croquettes de pommes de terre","Fruits rouges surgelés"],
 dro:["Papier toilette","Essuie-tout","Mouchoirs","Liquide vaisselle","Tablettes lave-vaisselle","Sel lave-vaisselle","Lessive","Adoucissant","Sacs poubelle","Éponges","Papier aluminium","Film alimentaire","Sacs congélation","Dentifrice","Brosses à dents","Shampoing","Après-shampoing","Gel douche","Savon","Déodorant","Coton-tiges","Cotons démaquillants","Rasoirs","Serviettes hygiéniques","Couches","Lingettes","Produit WC","Nettoyant multi-usage","Eau de Javel","Piles","Ampoules"]
};
const HKEY="menus-courses-historique";
let HISTO={}; try{ HISTO=JSON.parse(localStorage.getItem(HKEY)||"{}")||{}; }catch(e){ HISTO={}; }
function noteHisto(n,ray,qt){ const k=norm(n); const h=HISTO[k]||{n,c:0}; h.n=n; h.ray=ray; h.c=(h.c||0)+1; if(qt) h.qt=qt; HISTO[k]=h;
  const keys=Object.keys(HISTO); if(keys.length>300) keys.sort((a,b)=>(HISTO[a].c||0)-(HISTO[b].c||0)).slice(0,keys.length-300).forEach(k=>delete HISTO[k]);
  try{ localStorage.setItem(HKEY,JSON.stringify(HISTO)); }catch(e){} }
// tous les produits connus : historique, ajouts de la famille, ingrédients des recettes, catalogue de base
function produitsConnus(){ const m=new Map(), put=(n,ray,c)=>{ const k=norm(n); if(!k) return; const o=m.get(k); if(o){ o.c=Math.max(o.c,c); return; } m.set(k,{n,ray:RAYONS[ray]?ray:"epi",c}); };
  Object.values(HISTO).forEach(h=>put(h.n,h.ray,10+(h.c||0)));
  Object.values(state.weeks||{}).forEach(w=>(w.extras||[]).forEach(x=>put(x.n,x.ray,8)));
  (state.extras||[]).forEach(x=>put(x.n,x.ray,8));
  RECETTES.forEach(r=>r.ing.forEach(([n,,,ray])=>put(n,ray,2)));
  Object.entries(CATALOGUE).forEach(([ray,l])=>l.forEach(n=>put(n,ray,1)));
  CATALOGUE.boi.forEach(n=>{ const o=m.get(norm(n)); if(o) o.ray="boi"; });
  return [...m.values()]; }
// « 2 kg pommes », « pommes 2 kg », « café x2 » : sépare la quantité du nom
const UNITES="kg|g|gr|l|cl|ml|x|pc|pcs|pièces?|paquets?|boîtes?|boites?|bouteilles?|pots?|sachets?|barquettes?|tranches?|rouleaux?|packs?|bacs?|filets?";
function lireSaisie(txt){ let t=String(txt||"").replace(/\s+/g," ").trim(), qt="", m;
  if((m=t.match(new RegExp("^(\\d+(?:[.,]\\d+)?)\\s*("+UNITES+")?\\.?\\s+(?:de |d')?(.+)$","i")))){ qt=(m[1]+(m[2]?" "+m[2]:"")).trim(); t=m[3]; }
  else if((m=t.match(new RegExp("^(.+?)\\s+(?:x\\s*)?(\\d+(?:[.,]\\d+)?)\\s*("+UNITES+")?$","i")))){ qt=(m[2]+(m[3]?" "+m[3]:"")).trim(); t=m[1]; }
  t=t.charAt(0).toUpperCase()+t.slice(1); return {n:t,qt}; }
function chercherProduits(q){ const k=norm(q); if(!k) return [];
  return produitsConnus().map(p=>{ const pn=norm(p.n); let sc=-1;
      if(pn===k) sc=100; else if(pn.startsWith(k)) sc=60; else if(pn.split(" ").some(w=>w.startsWith(k))) sc=40; else if(pn.includes(k)) sc=20;
      return {...p,sc:sc<0?-1:sc+p.c}; }).filter(p=>p.sc>=0).sort((a,b)=>b.sc-a.sc||a.n.localeCompare(b.n,"fr")).slice(0,6); }
let apRayon=null; // saisie en attente du choix d'un rayon
function dejaPrevu(n,t){ const k=norm(n); return coursesTrips()[t].find(i=>norm(i.n)===k); }
function renderApTrip(){ const box=$("aptrip"); if(!box) return; const t=tripVue===null?tripAuto():tripVue;
  box.hidden=true; box.innerHTML=""; }
function renderApSugg(){ const box=$("apsugg"), inp=$("apname"); if(!box||!inp) return;
  const t=tripVue===null?tripAuto():tripVue;
  if(apRayon){ box.hidden=false;
    box.innerHTML=`<p class="aphint">Dans quel rayon ranger <b>${esc(apRayon.n)}</b> ?</p><div class="aprays">${ORDRE.map(r=>`<button type="button" class="chip" data-apray="${r}">${RAYONS[r]}</button>`).join("")}</div>`; return; }
  const {n}=lireSaisie(inp.value), res=chercherProduits(n);
  if(!n||!res.length){ box.hidden=!n; box.innerHTML=n?`<p class="aphint">Nouveau produit : touchez « Ajouter » puis choisissez son rayon.</p>`:""; return; }
  box.hidden=false;
  box.innerHTML=res.map((p,i)=>{ const d=dejaPrevu(p.n,t);
    return `<button type="button" class="apitem" role="option" data-apick="${i}"><b>${esc(p.n)}</b><small>${RAYONS[p.ray]}${d?` · déjà dans la liste${d.x?"":" pour les repas ("+esc(qtyOf(d))+")"}`:""}</small></button>`; }).join("");
  box._res=res; }
function ajouterProduit(n,ray,qt){
  const t=tripVue===null?tripAuto():tripVue, k=norm(n);
  const dbl=(state.extras||[]).find(x=>x.t===t&&norm(x.n)===k);
  if(dbl){ if(qt){ dbl.qt=qt; save(); renderCourses(); toast(`${dbl.n} : quantité mise à jour`); } else toast(`${dbl.n} est déjà dans la liste`); viderSaisie(); return; }
  const prevu=dejaPrevu(n,t);
  state.extras=[...(state.extras||[]),{id:Date.now().toString(36)+Math.random().toString(36).slice(2,6),n,qt:qt||"",ray,t,par:ME||""}];
  noteHisto(n,ray,qt); save(); renderCourses(); viderSaisie();
  toast(prevu?`${n} ajouté : il était déjà prévu pour les repas (${qtyOf(prevu)}), vérifiez la quantité`:`${n} ajouté à la liste`); }
function viderSaisie(){ apRayon=null; $("apname").value=""; $("apqty").value=""; if($("apunit")) $("apunit").value=""; renderApSugg(); }
// quantité saisie + unité choisie (g, kg, cl, L, pièces…) ; « 1500 g » devient « 1,5 kg »
function qteSaisie(){ let q=($("apqty").value||"").trim().replace(/\s+/g," "); const u=$("apunit")?$("apunit").value:"";
  if(!q) return ""; const m=q.match(/^(\d+(?:[.,]\d+)?)$/);
  if(m&&u){ let v=parseFloat(m[1].replace(",",".")), un=u;
    if(un==="g"&&v>=1000){ v=v/1000; un="kg"; } if(un==="cl"&&v>=100){ v=v/100; un="L"; }
    return `${String(Math.round(v*100)/100).replace(".",",")} ${un}`; }
  return q; }
function validerSaisie(){ const inp=$("apname"), lu=lireSaisie(inp.value); if(!lu.n) return;
  const qt=qteSaisie()||lu.qt, connu=produitsConnus().find(p=>norm(p.n)===norm(lu.n));
  if(connu){ ajouterProduit(connu.n,connu.ray,qt); return; }
  const res=chercherProduits(lu.n);
  apRayon={n:lu.n,qt}; renderApSugg(); }
if($("addprod")){
  $("addprod").addEventListener("submit",e=>{ e.preventDefault(); validerSaisie(); });
  $("apname").addEventListener("input",()=>{ apRayon=null; renderApSugg(); });
  $("apname").addEventListener("focus",renderApSugg);
  $("apsugg").addEventListener("click",e=>{
    const p=e.target.closest("[data-apick]"); if(p){ const it=$("apsugg")._res[+p.dataset.apick], lu=lireSaisie($("apname").value); ajouterProduit(it.n,it.ray,qteSaisie()||lu.qt); $("apname").focus(); return; }
    const r=e.target.closest("[data-apray]"); if(r&&apRayon){ ajouterProduit(apRayon.n,r.dataset.apray,apRayon.qt); $("apname").focus(); } });
  $("aptrip").addEventListener("click",e=>{ const b=e.target.closest("[data-aptrip]"); if(!b) return; tripVue=+b.dataset.aptrip; renderCourses(); renderApSugg(); });
  document.addEventListener("click",e=>{ if(!e.target.closest("#addprod")&&!$("apsugg").hidden&&!apRayon){ $("apsugg").hidden=true; } });
}
// retirer un produit ajouté à la main
$("aisles").addEventListener("click",e=>{ const b=e.target.closest("[data-xdel]"); if(!b) return; e.preventDefault(); e.stopPropagation();
  const id=b.dataset.xdel, x=(state.extras||[]).find(y=>y.id===id); if(!x) return;
  state.extras=state.extras.filter(y=>y.id!==id); Object.keys(state.checked).forEach(k=>{ if(k.endsWith("|x|"+id)) delete state.checked[k]; });
  save(); renderCourses();
  toast(`${x.n} retiré de la liste`,()=>{ state.extras=[...state.extras,x]; save(); renderCourses(); },"Annuler"); });

{ const h=location.hash.slice(1); if(VUES.includes(h)) state.tab=h; }
// Garde-fou : un affichage relancé en boucle (plus de 40 fois en 2 secondes) est mis en pause
// 1,5 seconde au lieu de figer l'appareil ; le dernier affichage demandé est fait ensuite.
function gardeBoucle(nom,fn){ let n=0,t0=0,attente=null,dernier=null;
  return function(...a){ const now=performance.now(); if(now-t0>2000){ t0=now; n=0; } n++;
    if(n>40){ dernier=[this,a]; if(!attente){ console.warn("Boucle d'affichage évitée : "+nom); window.__boucles=(window.__boucles||0)+1;
        attente=setTimeout(()=>{ attente=null; n=0; t0=performance.now(); const [t,x]=dernier; try{ fn.apply(t,x); }catch(e){} },1500); }
      return; }
    return fn.apply(this,a); }; }
render=gardeBoucle("render",render); renderCourses=gardeBoucle("renderCourses",renderCourses); renderTicket=gardeBoucle("renderTicket",renderTicket);
renderHabituels=gardeBoucle("renderHabituels",renderHabituels); renderDejaLa=gardeBoucle("renderDejaLa",renderDejaLa); renderEnvies=gardeBoucle("renderEnvies",renderEnvies);
// Deux pages : ?semaine=en-cours (semaine en cours) et ?semaine=suivante (semaine suivante)
const SEM_PAGE={"en-cours":0,"suivante":1};
function urlSemaine(){ try{ const u=new URL(location.href); const k=Object.keys(SEM_PAGE).find(x=>SEM_PAGE[x]===state.weekOffset);
  if(k) u.searchParams.set("semaine",k); else u.searchParams.delete("semaine"); history.replaceState(null,"",u); }catch(e){} }
render(); setTab(state.tab);
{ const q=new URLSearchParams(location.search).get("semaine"); if(q&&q in SEM_PAGE){ setTab("menu"); if(SEM_PAGE[q]!==state.weekOffset) goWeek(SEM_PAGE[q]); else urlSemaine(); } }
