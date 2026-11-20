// « Ma photo du plat » : chacun peut remplacer la photo d'un plat par la sienne.
// - La photo est réduite sur le téléphone (800 px max, WebP ou JPEG, environ 100 Ko) puis gardée dans IndexedDB (marche hors ligne et sans famille).
//   Elle ne sert qu'à l'affichage à l'écran (pas à l'impression) : on ne garde pas une définition plus haute que nécessaire.
// - Si le partage famille est actif, elle est aussi envoyée dans la base partagée (rubrique « platsphotos », voir supabase/photos-plats.sql).
//   Si l'envoi échoue (script SQL pas encore exécuté, pas de réseau…), la photo reste sur ce téléphone : rien ne casse.
// - photoSrc() (js/donnees.js) lit PHOTOS_PERSO : la photo remplace l'originale partout (cartes, détail, galerie, menu, retours).
const PP_BASE="menus-photos-plats", PP_STORE="plats", PP_MAX_OCTETS=100000, PP_MAX_DUR=150000;
const PP_LOCAL={}, PP_SHARED={}; let ppPartageLu=false;
const ppIdOk=id=>typeof id==="string"&&/^[A-Za-z0-9_-][A-Za-z0-9_.-]{0,99}$/.test(id);
const ppValide=p=>typeof p==="string"&&/^data:image\/(webp|jpeg);base64,[A-Za-z0-9+/=]+$/.test(p)&&p.length<390000;

// ---------- IndexedDB (toujours dans un try/catch : si elle est bloquée, on travaille en mémoire) ----------
function ppOuvrir(){ return new Promise((ok,ko)=>{ try{ const r=indexedDB.open(PP_BASE,1);
  r.onupgradeneeded=()=>{ r.result.createObjectStore(PP_STORE,{keyPath:"id"}); }; r.onsuccess=()=>ok(r.result); r.onerror=()=>ko(r.error); r.onblocked=()=>ko(new Error("bloquée")); }catch(e){ ko(e); } }); }
async function ppIdb(mode,fn){ const db=await ppOuvrir(); try{ return await new Promise((ok,ko)=>{ const t=db.transaction(PP_STORE,mode), s=t.objectStore(PP_STORE), r=fn(s);
  t.oncomplete=()=>ok(r&&r.result); t.onerror=()=>ko(t.error); t.onabort=()=>ko(t.error); }); } finally{ try{ db.close(); }catch(e){} } }
async function ppChargerLocal(){ try{ const l=await ppIdb("readonly",s=>s.getAll()); (l||[]).forEach(x=>{ if(x&&ppIdOk(x.id)) PP_LOCAL[x.id]={photo:ppValide(x.photo)?x.photo:null,quand:x.quand||""}; });
  Object.keys(PP_LOCAL).forEach(ppRecalc); ppAfficher(); }catch(e){} }
async function ppGarderLocal(id,photo,quand){ PP_LOCAL[id]={photo,quand}; try{ await ppIdb("readwrite",s=>s.put({id,photo,quand})); return true; }catch(e){ return false; } }

// ---------- Photo à afficher : la plus récente entre la copie du téléphone et la copie partagée ----------
function ppRecalc(id){ const l=PP_LOCAL[id], s=PP_SHARED[id]; let c=null;
  if(l&&s) c=(s.quand||"")>=(l.quand||"")?s:l; else c=l||s||null;
  if(c&&c.photo) PHOTOS_PERSO[id]=c.photo; else delete PHOTOS_PERSO[id]; }
function ppAfficher(){ try{ render(); if(modalCtx&&BYID[modalCtx.id]) renderModal(); if(sheetCtx&&sheetCtx.type==="gallery"&&typeof renderGalleryGrid==="function") renderGalleryGrid(); }catch(e){ console.error(e); } }

// ---------- Réduction de la photo ----------
function ppReduire(file){ return new Promise((ok,ko)=>{ const img=new Image(), url=URL.createObjectURL(file);
  img.onerror=()=>{ URL.revokeObjectURL(url); ko(new Error("image illisible")); };
  img.onload=async()=>{ URL.revokeObjectURL(url);
    const lire=b=>new Promise((res,rej)=>{ const fr=new FileReader(); fr.onload=()=>res(fr.result); fr.onerror=()=>rej(fr.error); fr.readAsDataURL(b); });
    const blob=(c,type,q)=>new Promise(res=>c.toBlob(res,type,q));
    try{ let dernier=null;
      for(const maxW of [800,640,480]) for(const q of [0.7,0.6,0.5]){
        const m=Math.min(1,maxW/img.naturalWidth), c=document.createElement("canvas"); c.width=Math.max(1,Math.round(img.naturalWidth*m)); c.height=Math.max(1,Math.round(img.naturalHeight*m));
        c.getContext("2d").drawImage(img,0,0,c.width,c.height);
        let b=await blob(c,"image/webp",q); if(!b||b.type!=="image/webp") b=await blob(c,"image/jpeg",q);   // navigateur sans WebP : JPEG
        if(!b) continue; dernier=b; if(b.size<=PP_MAX_OCTETS) return ok(await lire(b)); }
      if(dernier&&dernier.size<=PP_MAX_DUR) return ok(await lire(dernier));
      ko(new Error("trop lourde")); }catch(e){ ko(e); } };
  img.src=url; }); }

// ---------- Partage famille ----------
async function ppEnvoyer(id,photo,quand){ if(!DB||CAN_WRITE===false||!ppIdOk(id)) return "local";
  try{ const nom=(window.__acces&&window.__acces()&&window.__acces().nom)||""; await DB.collection("platsphotos").doc(id).set({photo,quand,par:nom}); return "ok"; }catch(e){ return "echec"; } }

// ---------- Actions ----------
async function ppChoisir(id,file){ if(!BYID[id]||!file) return;
  let photo; try{ photo=await ppReduire(file); }catch(e){
    const heic=/hei[cf]/i.test(file.type||"")||/\.hei[cf]$/i.test(file.name||"");
    toast(heic?"Ce format (HEIC) n'est pas lu par ce navigateur. Essayez avec Safari, ou exportez la photo en JPEG.":"Cette photo n'a pas pu être préparée. Essayez-en une autre."); return; }
  const quand=new Date().toISOString(); const gardee=await ppGarderLocal(id,photo,quand); ppRecalc(id); ppAfficher();
  const r=await ppEnvoyer(id,photo,quand);
  if(r==="ok") toast("Photo enregistrée pour toute la famille");
  else if(r==="echec") toast(gardee?"Photo gardée sur ce téléphone (le partage a échoué)":"Photo affichée seulement pour l'instant : le partage a échoué");
  else toast(gardee?"Photo gardée sur ce téléphone":"Photo affichée seulement pour l'instant"); }
async function ppRemettre(id){ if(!BYID[id]) return; const quand=new Date().toISOString();
  await ppGarderLocal(id,null,quand); ppRecalc(id); ppAfficher();
  const r=await ppEnvoyer(id,null,quand);
  toast(r==="ok"?"Photo d'origine remise pour toute la famille":"Photo d'origine remise"+(r==="echec"?" (le partage a échoué)":"")); }
function ppSousFigure(id){ const a=PHOTOS_PERSO[id]?true:false, en=!!DB&&CAN_WRITE!==false, i=esc(id);
  return `<div class="ppact"><label class="btn ppcam">📷 Prendre une photo<input id="pp-photo-cam" data-pp="${i}" type="file" accept="image/*" capture="environment" hidden></label><label class="btn pplib">🖼️ Choisir dans mes photos<input id="pp-photo-lib" data-pp="${i}" type="file" accept="image/*,.heic,.heif" hidden></label>${a?`<button type="button" class="btn" data-ppreset="${i}">Remettre la photo d'origine</button>`:""}</div><p class="note ppnote ppastuce">Vous pouvez aussi glisser une image sur la photo, ou la coller (Cmd+V).</p>${a&&!en?`<p class="note ppnote">Photo gardée sur ce téléphone</p>`:""}`; }
document.addEventListener("change",e=>{ const t=e.target; if(!t||(t.id!=="pp-photo-cam"&&t.id!=="pp-photo-lib")) return; const f=t.files&&t.files[0], id=t.dataset.pp; t.value=""; if(f) ppChoisir(id,f); });
// Glisser-déposer sur la photo du plat + coller (Cmd+V / Ctrl+V) pendant que le détail est ouvert
const ppImgDe=dt=>{ const l=dt&&dt.files?Array.from(dt.files):[]; return l.find(f=>/^image\//.test(f.type)||/\.(hei[cf]|jpe?g|png|webp|gif)$/i.test(f.name||""))||null; };
const ppAvecFichier=dt=>!!dt&&Array.from(dt.types||[]).includes("Files");
document.addEventListener("dragover",e=>{ const z=e.target.closest&&e.target.closest(".mphoto"); if(!z||!ppAvecFichier(e.dataTransfer)) return; e.preventDefault(); z.classList.add("ppdrop"); });
document.addEventListener("dragleave",e=>{ const z=e.target.closest&&e.target.closest(".mphoto"); if(z&&!z.contains(e.relatedTarget)) z.classList.remove("ppdrop"); });
document.addEventListener("drop",e=>{ const z=e.target.closest&&e.target.closest(".mphoto"); if(!z) return; z.classList.remove("ppdrop"); if(!ppAvecFichier(e.dataTransfer)) return; e.preventDefault();
  const f=ppImgDe(e.dataTransfer); if(!f){ toast("Ce fichier n'est pas une image."); return; } if(modalCtx&&modalCtx.id) ppChoisir(modalCtx.id,f); });
document.addEventListener("paste",e=>{ if(!modalCtx||!modalCtx.id||!BYID[modalCtx.id]) return; const t=e.target; if(t&&/^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName)||(t&&t.isContentEditable)) return;
  const f=ppImgDe(e.clipboardData); if(f){ e.preventDefault(); ppChoisir(modalCtx.id,f); } });
document.addEventListener("click",e=>{ const b=e.target.closest("[data-ppreset]"); if(b) ppRemettre(b.dataset.ppreset); });

// ---------- Lecture du partage (appelée par app.js une fois la base prête) ----------
function subscribePhotosPlats(){ if(!DB) return;
  DB.collection("platsphotos").onSnapshot(q=>{ try{ const ids=[];
    q.docChanges().forEach(c=>{ const id=c.doc.id; if(c.type==="removed") delete PP_SHARED[id]; else { const d=c.doc.data()||{};
      if(d.photo===null) PP_SHARED[id]={photo:null,quand:typeof d.quand==="string"?d.quand:""}; else if(ppValide(d.photo)) PP_SHARED[id]={photo:d.photo,quand:typeof d.quand==="string"?d.quand:""}; else delete PP_SHARED[id]; } ids.push(id); });
    ids.forEach(ppRecalc); ppAfficher();
    if(!ppPartageLu){ ppPartageLu=true;   // photos prises avant d'être connecté : on les partage maintenant
      Object.keys(PP_LOCAL).forEach(id=>{ const l=PP_LOCAL[id], s=PP_SHARED[id]; if(l.photo&&(!s||(s.quand||"")<(l.quand||""))) ppEnvoyer(id,l.photo,l.quand); }); }
  }catch(e){ console.error(e); } },()=>{}); }

// ---------- Pour le PDF : JPEG recadré à la forme de la case (jsPDF ne lit pas le WebP) ----------
function ppEnJpeg(src,ratio){ return new Promise(res=>{ const img=new Image(); img.onerror=()=>res(null);
  img.onload=()=>{ try{ const W=600, H=Math.round(W/ratio), c=document.createElement("canvas"); c.width=W; c.height=H; const x=c.getContext("2d"); x.fillStyle="#fff"; x.fillRect(0,0,W,H);
    const s=Math.max(W/img.naturalWidth,H/img.naturalHeight), w=img.naturalWidth*s, h=img.naturalHeight*s; x.drawImage(img,(W-w)/2,(H-h)/2,w,h); res(c.toDataURL("image/jpeg",0.85)); }catch(e){ res(null); } };
  img.src=src; }); }

ppChargerLocal();
