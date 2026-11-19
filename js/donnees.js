// Image introuvable : on la masque (remplace les anciens attributs onerror, interdits par la politique de sécurité)
window.addEventListener("error",e=>{ const t=e.target; if(t&&t.tagName==="IMG"){ if(t.dataset.cacheParent) t.parentNode.hidden=true; else t.style.visibility="hidden"; } },true);

// Nettoie un texte venu de la base partagée ou d'un fichier : jamais de balise ni de caractère dangereux à l'affichage
function propre(v,max){ return typeof v==="string" ? v.replace(/[<>&"'`]/g,"").replace(/[\u0000-\u001f]/g," ").trim().slice(0,max||200) : ""; }
const RAYONS = {bou:"Boucherie & charcuterie", cre:"Crèmerie", fl:"Fruits & légumes", bl:"Boulangerie", epi:"Épicerie", sur:"Surgelés", boi:"Boissons", dro:"Droguerie & hygiène"};
const ORDRE = ["fl","bou","cre","bl","epi","boi","sur","dro"];
// Quantités pour 5 personnes : [nom, quantité, unité, rayon]
// Recettes de base et prix de référence : donnees/recettes-base.json, lu par js/demarrage.js avant ce fichier (window.BASE_RECETTES).
// Quantités pour 5 personnes : [nom, quantité, unité, rayon]
const BASE = window.BASE_RECETTES;
const ETAPES = {};   // étapes de préparation de chaque recette, par id
const RECETTES = BASE.recettes.map(({etapes, ...r}) => { ETAPES[r.id] = etapes || []; return r; });
// Cuisine de chaque recette (bibliothèque) ; les recettes de famille n'en ont pas forcément
const CUISINES={belge:"Belge",francaise:"Française",italienne:"Italienne",grecque:"Grecque",espagnole:"Espagnole",asiatique:"Asiatique",indienne:"Indienne",orientale:"Orientale",mexicaine:"Mexicaine",americaine:"Américaine"};
const BYID = Object.fromEntries(RECETTES.map(r=>[r.id,r]));
const RAYKEYS=["fl","bou","cre","bl","epi","boi","sur"];
// Recette de la famille : quantités ramenées à 5 personnes, photo en data URL facultative
function cleanRecipe(x){
  if(!x||typeof x!=="object"||typeof x.id!=="string"||!/^p[a-z0-9]{3,20}$/.test(x.id)) return null;
  const ing=(Array.isArray(x.ing)?x.ing:[]).filter(i=>Array.isArray(i)&&typeof i[0]==="string"&&i[0].trim()).slice(0,30)
    .map(([n,q,u,ray])=>[propre(n,40),Math.max(0,+q||0),["g","cl",""].includes(u)?u:"",RAYKEYS.includes(ray)?ray:"epi"]).filter(i=>i[0]);
  return {id:x.id,perso:true,nom:propre(x.nom,60)||"Recette",acc:propre(x.acc,60),t:Math.max(5,Math.min(240,+x.t||30)),
    astuce:propre(x.astuce,200),ing,etapes:(Array.isArray(x.etapes)?x.etapes:[]).map(e=>propre(e,400)).filter(Boolean).slice(0,20),
    photo:(typeof x.photo==="string"&&x.photo.startsWith("data:image/jpeg;base64,")&&x.photo.length<200000)?x.photo:null,
    prix:(+x.prix>0&&+x.prix<500)?+x.prix:null, auteur:typeof x.auteur==="string"?propre(x.auteur,60):null};
}
function registerRecipe(x){ const r=cleanRecipe(x); if(!r) return null;
  const i=RECETTES.findIndex(y=>y.id===r.id); if(i>=0) RECETTES[i]=r; else RECETTES.push(r);
  BYID[r.id]=r; ETAPES_PERSO[r.id]=r.etapes; return r; }
const ETAPES_PERSO={};
// Photos libres de droits (Wikimedia Commons) : fichier publié avec la page + page source
const PHOTOS = {
 carbo:"Spaghetti_alla_Carbonara.jpg", omelette:"Tortilla_de_patatas_en_un_plato.jpg", wraps:"Smoked_chicken_and_avocado_wrap.jpg",
 cantonais:"Yeung_Chow_Fried_Rice_in_Hong_Kong_Fast_Food_Shop.JPG", croque:"Croque_Monsieur.JPG", chili:"Chili-con-carne.jpg",
 quiche:"Quiche_lorraine_01.JPG", stoemp:"Boerenkool_met_worst.jpg", thon:"Spaghetti_al_Pomodoro.JPG", boulettes:"Pasta_with_meatballs.jpg",
 pizza:"Pizza_prosciutto_e_funghi,_Edingen.jpg", poisson:"Fish_fingers.jpg", soupe:"Potage_Crécy_soup.jpg", curry:"Chana_masala.jpg"
};
const PLACEHOLDER="data:image/svg+xml,"+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 90"><rect width="120" height="90" fill="#E2F0E6"/><circle cx="60" cy="47" r="26" fill="#fff" stroke="#2E7A4C" stroke-width="3"/><path d="M28 20v22M33 20v22M28 42c0 5 5 5 5 0M92 20c-6 0-8 10-8 18h8v30" stroke="#2E7A4C" stroke-width="3" fill="none" stroke-linecap="round"/></svg>');
// En attendant une photo : une illustration simple, propre à chaque plat
const EMOJI={veloutepotiron:"🎃",chouxbxl:"🥬",stoemppoireaux:"🥔",potee:"🥬",celeri:"🌭",patespotiron:"🎃",wrapspatate:"🌯",frittata:"🍳",patespoireaux:"🍝",tortellini:"🍝",flammekueche:"🫓",falafels:"🧆",couscouslegumes:"🥘",croutechampi:"🍄",lentilles:"🥣",chourouge:"🍎",maquereau:"🐟",lasagnepoele:"🍝",patesgrecques:"🫒",quichepoireaux:"🥧",tajine:"🥘",pouletchampi:"🍄",dindepoireaux:"🍗",colin:"🐟",gyozas:"🥟",padthai:"🍜",bibimbap:"🍚",saltimbocca:"🍋",enchiladas:"🌯",burritobowl:"🥙",risottopoireaux:"🍚",canard:"🦆",milanaise:"🍝",croquettes:"🦐",saumonteriyaki:"🍣",raclette:"🧀",thonsteak:"🐟",gambas:"🦐",fondue:"🫕",waterzooipoisson:"🍲",burger:"🍔",burgerpoisson:"🍔",hotdog:"🌭",pizzapain:"🍕",tacos:"🌮",fajitas:"🌯",quesadillas:"🌮",ramen:"🍜",nouilles:"🍜",tofu:"🥢",wok:"🥢",teriyaki:"🍗",aigredoux:"🍍",poke:"🍣",
 steakfrites:"🥩",americain:"🥩",carbonnades:"🍲",boulets:"🧆",keftedes:"🧆",kefta:"🧆",waterzooi:"🍲",minestrone:"🥣",moules:"🦪",saumon:"🐟",cabillaud:"🐟",galettespdt:"🥔",
 scampis:"🍤",tagsaumon:"🍝",bolo:"🍝",pesto:"🍝",arrabbiata:"🍝",pennepoulet:"🍝",gratinpates:"🧀",orzo:"🍝",gnocchis:"🍅",risotto:"🍄",dahl:"🍛",butterchicken:"🍛",pouletcurry:"🍛",
 couscous:"🥘",sincarne:"🌶️",shakshuka:"🍳",oeufsbrouilles:"🍳",galettes:"🥞",tartiflette:"🧀",chicons:"🥬",liegeoise:"🥗",boudin:"🍎",parmentier:"🥔",cordonbleu:"🍗",cotesporc:"🍖",
 escalopes:"🍗",pita:"🥙",souvlaki:"🥙",piadina:"🫓",volauvent:"🥧",pouletcompote:"🍗"};
const ILLU={}; const TEINTES=["#E2F0E6","#FBEBD2","#E6ECF7","#F6E3E3","#EDE6F5","#E8F1D8"];
function illustration(id){ if(ILLU[id]) return ILLU[id]; const e=EMOJI[id]||"🍽️", bg=TEINTES[[...id].reduce((s,c)=>s+c.charCodeAt(0),0)%TEINTES.length];
  return ILLU[id]="data:image/svg+xml,"+encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 120"><rect width="160" height="120" fill="${bg}"/><text x="80" y="64" font-size="60" text-anchor="middle" dominant-baseline="middle">${e}</text></svg>`); }
const photoSrc = id => { const r=BYID[id]; if(r&&r.perso) return r.photo||PLACEHOLDER; return PHOTOS[id]?"photos/"+id+".webp":illustration(id); };
// Si un navigateur ne sait pas lire le WebP, on retombe sur la photo JPEG (gardée à côté)
document.addEventListener("error",e=>{ const i=e.target; if(i&&i.tagName==="IMG"&&/^photos\/[a-z0-9]+\.webp$/.test(i.getAttribute("src")||"")) i.src=i.getAttribute("src").replace(/\.webp$/,".jpg"); },true);
const photoPage = id => PHOTOS[id]?"https://commons.wikimedia.org/wiki/File:"+encodeURIComponent(PHOTOS[id]):null;
// Magasins autour de Ghlin
const MAGASINS = [
 {id:"inter",ens:"inter",nom:"Intermarché",lieu:"Av. de la Libération, Ghlin",lat:50.4749,lon:3.8999},
 {id:"lidl",ens:"lidl",nom:"Lidl",lieu:"Route de Mons, Ghlin",lat:50.4712,lon:3.9189},
 {id:"delhaize",ens:"delhaize",nom:"Delhaize Shop & Go",lieu:"Rue de Mons, Ghlin",lat:50.4690,lon:3.9212},
 {id:"aldi-jemappes",ens:"aldi",nom:"Aldi",lieu:"Av. Wilson, Jemappes",lat:50.4495,lon:3.9016},
 {id:"aldi-baudarts",ens:"aldi",nom:"Aldi",lieu:"Résidence des Baudarts, Mons",lat:50.4628,lon:3.9420},
 {id:"carrefour",ens:"carrefour",nom:"Carrefour",lieu:"Grands Prés, Mons",lat:50.4557,lon:3.9328},
 {id:"delhaize-nimy",ens:"delhaize",nom:"Delhaize",lieu:"Rue de Nimy, Mons",lat:50.4593,lon:3.9552},
 {id:"spar-quaregnon",ens:"spar",nom:"Spar",lieu:"Chemin du Bon Dieu, Quaregnon",lat:50.4378,lon:3.8702},
 {id:"delhaize-hornu",ens:"delhaize",nom:"Delhaize",lieu:"Rue de Mons, Hornu",lat:50.4375,lon:3.8392},
 {id:"carrefour-stg",ens:"carrefour",nom:"Carrefour Market",lieu:"Rue du Sas, Saint-Ghislain",lat:50.4563,lon:3.8134},
 {id:"colruyt",ens:"colruyt",nom:"Colruyt",lieu:"Chaussée de Binche, Mons",lat:50.4528,lon:3.9768},
 {id:"delhaize-roeulx",ens:"delhaize",nom:"Delhaize",lieu:"Chaussée du Roeulx, Mons",lat:50.4551,lon:3.9837},
 {id:"spar-hyon",ens:"spar",nom:"Spar",lieu:"Chaussée de Maubeuge, Hyon",lat:50.4276,lon:3.9469},
 {id:"carrefour-casteau",ens:"carrefour",nom:"Carrefour Market",lieu:"Shopping Shape, Casteau",lat:50.5039,lon:3.9725},
 {id:"okay-frameries",ens:"okay",nom:"OKay",lieu:"Rue de l'Industrie, Frameries",lat:50.4106,lon:3.8719},
 {id:"okay-brugelette",ens:"okay",nom:"OKay",lieu:"Chaussée de Mons, Brugelette",lat:50.5862,lon:3.8478},
 {id:"bioplanet-mons",ens:"bioplanet",nom:"Bio-Planet",lieu:"Chaussée du Roeulx, Mons",lat:50.4562,lon:3.9757},
 {id:"colruyt-jemappes",ens:"colruyt",nom:"Colruyt",lieu:"Av. Wilson, Jemappes",lat:50.4479,lon:3.9062},
 {id:"lidl-jemappes",ens:"lidl",nom:"Lidl",lieu:"Av. Wilson, Jemappes",lat:50.4498,lon:3.9091},
 {id:"aldi-binche",ens:"aldi",nom:"Aldi",lieu:"Chaussée de Binche, Mons",lat:50.4527,lon:3.9747},
 {id:"inter-maisieres",ens:"inter",nom:"Intermarché",lieu:"Rue Grande, Maisières",lat:50.4914,lon:3.9696},
 {id:"inter-procession",ens:"inter",nom:"Intermarché",lieu:"Chemin de la Procession, Mons",lat:50.4583,lon:3.9765},
 {id:"inter-frameries",ens:"inter",nom:"Intermarché",lieu:"Route Nationale, Frameries",lat:50.4173,lon:3.8749},
 {id:"inter-boussu",ens:"inter",nom:"Intermarché",lieu:"Rue des Chaufours, Boussu",lat:50.4199,lon:3.8018},
 {id:"delhaize-dolez",ens:"delhaize",nom:"Delhaize Shop & Go",lieu:"Boulevard Dolez, Mons",lat:50.4493,lon:3.9549},
 {id:"louisdelhaize-binche",ens:"louisdelhaize",nom:"Louis Delhaize",lieu:"Chaussée de Binche, Mons",lat:50.4489,lon:3.9898},
 {id:"okay-givry",ens:"okay",nom:"OKay",lieu:"Chaussée de Beaumont, Givry",lat:50.3786,lon:4.0373},
 {id:"lidl-binche",ens:"lidl",nom:"Lidl",lieu:"Route de Mons, Binche",lat:50.4140,lon:4.1450},
 {id:"aldi-binche-zf",ens:"aldi",nom:"Aldi",lieu:"Rue Zéphirin Fontaine, Binche",lat:50.4160,lon:4.1600},
 {id:"colruyt-binche",ens:"colruyt",nom:"Colruyt",lieu:"Rue Zéphirin Fontaine, Binche",lat:50.4165,lon:4.1580},
 {id:"carrefour-binche",ens:"carrefour",nom:"Carrefour Market",lieu:"Rue de Robiano, Binche",lat:50.4110,lon:4.1700},
 {id:"delhaize-epinois",ens:"delhaize",nom:"Delhaize",lieu:"Rue Saint-Fiacre, Épinois",lat:50.4050,lon:4.2094},
 {id:"carrefour-leval",ens:"carrefour",nom:"Carrefour Market",lieu:"Rue Salvador Allende, Leval-Trahegnies",lat:50.4165,lon:4.2181},
 {id:"okay-roeulx",ens:"okay",nom:"OKay",lieu:"Rue d'Houdeng, Le Rœulx",lat:50.5004,lon:4.1179}
];
// Enseignes : les promotions sont relevées par enseigne et valent dans tous ses magasins
const ENS = {autre:"Autre",inter:"Intermarché",lidl:"Lidl",delhaize:"Delhaize",aldi:"Aldi",carrefour:"Carrefour",colruyt:"Colruyt",okay:"OKay",bioplanet:"Bio-Planet",spar:"Spar",louisdelhaize:"Louis Delhaize",ah:"Albert Heijn",jumbo:"Jumbo",match:"Match",cora:"Cora",eurospar:"Eurospar"};
const ensOf = id => { const m=MAGASINS.find(x=>x.id===id); return m?m.ens:id; };
// Domicile approximatif (Ghlin) ; distance routière estimée = vol d'oiseau × 1,3
let HOME = {nom:"Ghlin",lat:50.48,lon:3.88};
// Points de départ proposés (centre approximatif de chaque localité)
const COMMUNES = [
 ["Ghlin",50.4800,3.8800],["Mons (centre)",50.4542,3.9523],["Jemappes",50.4515,3.8890],["Nimy",50.4719,3.9496],["Maisières",50.4870,3.9640],
 ["Cuesmes",50.4386,3.9264],["Hyon",50.4386,3.9708],["Havré",50.4600,4.0400],["Casteau",50.5150,3.9850],["Jurbise",50.5300,3.9100],
 ["Baudour",50.4800,3.8320],["Saint-Ghislain",50.4500,3.8183],["Hornu",50.4330,3.8290],["Boussu",50.4342,3.7953],["Quaregnon",50.4404,3.8649],
 ["Frameries",50.4083,3.8962],["Quévy",50.3700,3.9400],["Erquelinnes",50.3080,4.1100]
];
function km(a,b){ const R=6371, toR=x=>x*Math.PI/180, dLa=toR(b.lat-a.lat), dLo=toR(b.lon-a.lon);
  const h=Math.sin(dLa/2)**2+Math.cos(toR(a.lat))*Math.cos(toR(b.lat))*Math.sin(dLo/2)**2; return 2*R*Math.asin(Math.sqrt(h))*1.3; }
const MAGBYID = id => MAGASINS.find(m=>m.id===id);
const COUT_KM = 0.25; // carburant + usure, estimation
const PREF_EUR = 0.6;  // valeur d'un rang de préférence, en euros
// magasins retenus : dans un rayon de 10 à 15 km autour du domicile (à vol d'oiseau), réglable
const rayonKm = () => [10,12,15].includes(state.rayon) ? state.rayon : 15;
const inRayon = m => !!m && km(HOME,m) <= rayonKm();
const orderedStores = () => { const l=state.storeOrder.map(MAGBYID).filter(Boolean), near=l.filter(inRayon); return near.length?near:l; };
function prefBonus(id){ const act=state.storeOrder, r=act.indexOf(id); return r<0?0:(act.length-1-r)*PREF_EUR; }
const MAGNOM = new Proxy({}, {get:(_,id)=>{ const m=MAGASINS.find(x=>x.id===id); if(!m) return ENS[id]||id; const twin=(state&&state.storeOrder||[]).filter(x=>x!==id&&MAGASINS.find(y=>y.id===x&&y.nom===m.nom)).length; return twin? m.nom+" "+m.lieu.split(", ").pop() : m.nom; }});
// Promotions relevées le 13/11/2026 (folders et PrijsProfeet). ing = ingrédient des recettes concerné
let RELEVE = "13 novembre 2026", RELEVE_ISO = "2026-11-13";
const PROMOS = [
 {mag:"colruyt",produit:"Barilla Spaghettoni n°7",prix:0.99,avant:1.99,du:"2026-11-04",au:"2026-11-17",ing:"Spaghetti"},
 {mag:"colruyt",produit:"Champignons shimeji Boni",prix:0.99,avant:1.99,du:"2026-11-04",au:"2026-11-17",ing:"Champignons"},
 {mag:"delhaize",produit:"Beurre doux Balade",prix:1.34,avant:2.69,du:"2026-11-12",au:"2026-11-18",ing:"Beurre"},
 {mag:"delhaize",produit:"Carottes de Hesbaye",prix:1.49,avant:null,du:"2026-11-12",au:"2026-11-18",ing:"Carottes"},
 {mag:"delhaize",produit:"Herta jambon cuit (folder)",prix:4.49,avant:null,du:"2026-11-12",au:"2026-11-18",ing:"Jambon cuit"},
 {mag:"delhaize",produit:"Emmental Mifroma (folder)",prix:4.12,avant:null,du:"2026-11-12",au:"2026-11-18",ing:"Fromage râpé"},
 {mag:"delhaize",produit:"Penne rigate Soubry (folder)",prix:4.65,avant:null,du:"2026-11-12",au:"2026-11-18",ing:"Penne"},
 {mag:"lidl",produit:"Haché préparé porc et bœuf",prix:2.49,avant:3.79,du:"2026-11-16",au:"2026-11-21",ing:"Haché porc-bœuf"},
 {mag:"lidl",produit:"Pommes de terre chair ferme XXL",prix:5.99,avant:8.94,du:"2026-11-16",au:"2026-11-21",ing:"Pommes de terre"}
];
