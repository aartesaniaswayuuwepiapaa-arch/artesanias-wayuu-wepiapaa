// admin.js — Artesanías Wayuu Wepiapaa
// Firebase SDK 11 — mismo que el usuario indicó
import { initializeApp } from 'https://www.gstatic.com/firebasejs/11.0.0/firebase-app.js';
import {
  getFirestore, collection, doc,
  addDoc, updateDoc, deleteDoc, setDoc,
  onSnapshot, serverTimestamp
} from 'https://www.gstatic.com/firebasejs/11.0.0/firebase-firestore.js';

const FB = {
  apiKey:'AIzaSyAxUPOz30Sv_n1m87SLtu4-r2IrHUOBkcw',
  authDomain:'artesanias-wayuu-wepiapaa.firebaseapp.com',
  projectId:'artesanias-wayuu-wepiapaa',
  storageBucket:'artesanias-wayuu-wepiapaa.firebasestorage.app',
  messagingSenderId:'995886273941',
  appId:'1:995886273941:web:1e95d63891d14a8ed9529c'
};

// Inicializar Firebase — protegido contra doble inicialización
let app, db;
try { app=initializeApp(FB); } catch(e) { const {getApps}=await import('https://www.gstatic.com/firebasejs/11.0.0/firebase-app.js'); app=getApps()[0]; }
db = getFirestore(app);

const ADMIN_USER='admin', ADMIN_PASS='wayuu2026';
const DLOGO='https://i.ibb.co/35bTfj7S/LOGO.jpg';
let products=[], delId=null, saving=false;

// ── AUTH ──
window.doLogin=function(){
  const u=document.getElementById('u').value.trim();
  const p=document.getElementById('p').value;
  if(u===ADMIN_USER&&p===ADMIN_PASS){
    document.getElementById('login-screen').style.display='none';
    document.getElementById('layout').classList.add('on');
    sessionStorage.setItem('wa_admin','1');
    initAdmin();
  } else {
    const e=document.getElementById('lerr');e.style.display='block';
    setTimeout(()=>e.style.display='none',3000);
  }
};
window.doLogout=function(){sessionStorage.removeItem('wa_admin');location.reload();};
['u','p'].forEach(id=>document.getElementById(id)?.addEventListener('keydown',e=>{if(e.key==='Enter')window.doLogin();}));
if(sessionStorage.getItem('wa_admin')==='1'){
  document.getElementById('login-screen').style.display='none';
  document.getElementById('layout').classList.add('on');
  initAdmin();
}

// ── INIT ──
function initAdmin(){listenProds();listenSocials();listenLogo();}

// ── NAVEGACIÓN ──
const TITLES={dash:'Dashboard',add:'Agregar Producto',list:'Lista de Productos',logo:'Logo de la Tienda',social:'Redes Sociales'};
window.showP=function(id){
  document.querySelectorAll('.panel').forEach(p=>p.classList.remove('on'));
  document.querySelectorAll('.sb-item').forEach(b=>b.classList.remove('on'));
  document.getElementById('panel-'+id)?.classList.add('on');
  document.getElementById('topbar-title').textContent=TITLES[id]||'Admin';
  document.querySelectorAll('.sb-item').forEach(b=>{if(b.getAttribute('onclick')===`showP('${id}')`)b.classList.add('on');});
};

// ── LOGO ──
function listenLogo(){
  onSnapshot(doc(db,'configuracion','tienda'),s=>{
    const u=(s.exists()&&s.data().logoUrl)?s.data().logoUrl:DLOGO;
    ['sb-logo','login-logo','logo-current'].forEach(id=>{const el=document.getElementById(id);if(el)el.src=u;});
  },()=>{});
}
window.prevLogo=function(url){
  const el=document.getElementById('logo-prev');if(!el)return;
  if(url&&url.startsWith('http')){el.src=url;el.classList.add('on');el.onerror=()=>el.classList.remove('on');}
  else el.classList.remove('on');
};
window.saveLogo=async function(){
  const url=(document.getElementById('logo-url').value||'').trim();
  if(!url||!url.startsWith('http')){toast('⚠️ URL inválida — debe comenzar con https://','err');return;}
  try{
    await setDoc(doc(db,'configuracion','tienda'),{logoUrl:url,updatedAt:serverTimestamp()},{merge:true});
    toast('✅ Logo actualizado en todos los dispositivos','ok');
    document.getElementById('logo-url').value='';
    document.getElementById('logo-prev').classList.remove('on');
  }catch(e){fireErr(e,'guardar logo');}
};
window.resetLogo=async function(){
  if(!confirm('¿Restaurar el logo original?'))return;
  try{
    await setDoc(doc(db,'configuracion','tienda'),{logoUrl:DLOGO,updatedAt:serverTimestamp()},{merge:true});
    toast('✅ Logo restaurado','ok');
  }catch(e){fireErr(e,'restaurar logo');}
};

// ── PRODUCTOS ──
function listenProds(){
  onSnapshot(collection(db,'productos'),snap=>{
    products=[];snap.forEach(d=>products.push({id:d.id,...d.data()}));
    renderTable(products);updateStats(products);
  },err=>{console.error(err);showRulesAlert();});
}
function updateStats(list){
  const s=(id,v)=>{const el=document.getElementById(id);if(el)el.textContent=v;};
  s('s-total',list.length);s('s-disp',list.filter(p=>p.disponible!==false).length);
  s('s-moch',list.filter(p=>p.categoria==='Mochilas').length);
  s('s-chin',list.filter(p=>p.categoria==='Chinchorros').length);
}
function renderTable(list){
  const tb=document.getElementById('prod-tbody');if(!tb)return;
  if(!list.length){tb.innerHTML=`<tr><td colspan="6" style="text-align:center;padding:34px;color:var(--soft)">Sin productos. <strong onclick="showP('add')" style="cursor:pointer;color:var(--g)">Agregar →</strong></td></tr>`;return;}
  tb.innerHTML=list.map(p=>{
    const pr=parseFloat(p.precio)||0,img=p.imagen||DLOGO,ok=p.disponible!==false;
    return`<tr><td><img src="${x(img)}" class="thumb" onerror="this.src='${DLOGO}'"></td><td><strong>${x(p.nombre||'—')}</strong></td><td><span class="badge b-cat">${x(p.categoria||'—')}</span></td><td><strong>$${Number(pr).toLocaleString('es-CO')}</strong></td><td><span class="badge ${ok?'b-ok':'b-no'}">${ok?'✅ Disponible':'❌ No disponible'}</span></td><td><button class="btn-edit" onclick="editProd('${p.id}')">✏️ Editar</button><button class="btn-del" onclick="confirmDel('${p.id}')">🗑️</button></td></tr>`;
  }).join('');
}
window.searchProds=function(q){
  const ql=(q||'').toLowerCase();
  renderTable(products.filter(p=>(p.nombre||'').toLowerCase().includes(ql)||(p.categoria||'').toLowerCase().includes(ql)));
};

// PREVIEW IMAGEN
window.prevImg=function(url){
  const el=document.getElementById('img-prev');if(!el)return;
  if(url&&url.startsWith('http')){el.src=url;el.classList.add('on');el.onerror=()=>el.classList.remove('on');}
  else el.classList.remove('on');
};

// ── GUARDAR PRODUCTO ──
window.saveProduct=async function(){
  if(saving)return;
  const id=(document.getElementById('edit-id').value||'').trim();
  const nombre=(document.getElementById('f-nombre').value||'').trim();
  const cat=(document.getElementById('f-cat').value||'').trim();
  const precRaw=(document.getElementById('f-precio').value||'').trim();
  const precio=parseFloat(precRaw);
  const desc=(document.getElementById('f-desc').value||'').trim();
  const img=(document.getElementById('f-img').value||'').trim();
  const disp=document.getElementById('f-disp').value==='true';

  if(!nombre){toast('⚠️ Escribe el nombre del producto','err');return;}
  if(!cat){toast('⚠️ Selecciona una categoría','err');return;}
  if(!precRaw||isNaN(precio)||precio<0){toast('⚠️ Ingresa un precio válido','err');return;}
  if(!img){toast('⚠️ Pega la URL de imagen (IMGBB)','err');return;}
  if(!img.startsWith('http')){toast('⚠️ La URL debe comenzar con https://','err');return;}

  const data={nombre,categoria:cat,precio,descripcion:desc,imagen:img,disponible:disp};
  saving=true;
  const btn=document.getElementById('btn-guardar');
  const orig=btn?.textContent||'';
  if(btn){btn.textContent='⏳ Guardando...';btn.disabled=true;}

  try{
    if(id){
      await updateDoc(doc(db,'productos',id),{...data,updatedAt:serverTimestamp()});
      toast('✅ Producto actualizado — visible en todos los dispositivos','ok');
    } else {
      await addDoc(collection(db,'productos'),{...data,createdAt:serverTimestamp()});
      toast('✅ Producto creado — visible en todos los dispositivos','ok');
    }
    clearForm();showP('list');
  }catch(e){
    fireErr(e,'guardar el producto');
  }finally{
    saving=false;
    if(btn){btn.textContent=orig||'💾 Guardar Producto';btn.disabled=false;}
  }
};

// ── EDITAR ──
window.editProd=function(id){
  const p=products.find(q=>q.id===id);
  if(!p){toast('⚠️ Producto no encontrado','err');return;}
  document.getElementById('edit-id').value=id;
  document.getElementById('f-nombre').value=p.nombre||'';
  document.getElementById('f-cat').value=p.categoria||'';
  document.getElementById('f-precio').value=p.precio||'';
  document.getElementById('f-desc').value=p.descripcion||'';
  document.getElementById('f-img').value=p.imagen||'';
  document.getElementById('f-disp').value=p.disponible!==false?'true':'false';
  document.getElementById('form-title').textContent='✏️ Editar Producto';
  if(p.imagen)window.prevImg(p.imagen);
  showP('add');window.scrollTo({top:0,behavior:'smooth'});
};

// ── LIMPIAR FORM ──
window.clearForm=function(){
  ['edit-id','f-nombre','f-precio','f-desc','f-img'].forEach(id=>{const el=document.getElementById(id);if(el)el.value='';});
  const c=document.getElementById('f-cat'),d=document.getElementById('f-disp'),
        pv=document.getElementById('img-prev'),tl=document.getElementById('form-title');
  if(c)c.value='';if(d)d.value='true';if(pv)pv.classList.remove('on');
  if(tl)tl.textContent='➕ Agregar Nuevo Producto';
};

// ── ELIMINAR ──
window.confirmDel=function(id){
  delId=id;document.getElementById('modal').classList.add('on');
  document.getElementById('modal-ok').onclick=async()=>{
    try{await deleteDoc(doc(db,'productos',delId));toast('🗑️ Producto eliminado','ok');}
    catch(e){fireErr(e,'eliminar el producto');}
    closeModal();
  };
};
window.closeModal=function(){document.getElementById('modal').classList.remove('on');delId=null;};

// ── REDES SOCIALES ──
function listenSocials(){
  onSnapshot(collection(db,'redes_sociales'),snap=>{
    const list=[];snap.forEach(d=>list.push({id:d.id,...d.data()}));
    const tb=document.getElementById('social-tbody');if(!tb)return;
    if(!list.length){tb.innerHTML=`<tr><td colspan="4" style="text-align:center;padding:26px;color:var(--soft)">Sin redes guardadas.</td></tr>`;return;}
    tb.innerHTML=list.map(s=>`<tr><td><strong>${x(s.nombre||'—')}</strong></td><td>${x(s.handle||'—')}</td><td><a href="${x(s.url||'#')}" target="_blank" style="color:var(--g)">${x(s.url||'—')}</a></td><td><button class="btn-del" onclick="delSocial('${s.id}')">🗑️</button></td></tr>`).join('');
  },()=>{});
}
window.saveSocial=async function(){
  const n=document.getElementById('s-nombre').value;
  const h=(document.getElementById('s-handle').value||'').trim();
  const u=(document.getElementById('s-url').value||'').trim();
  if(!n||!u){toast('⚠️ Selecciona la red y escribe la URL','err');return;}
  try{
    await addDoc(collection(db,'redes_sociales'),{nombre:n,handle:h,url:u,createdAt:serverTimestamp()});
    toast('✅ Red social guardada','ok');
    ['s-nombre','s-handle','s-url'].forEach(id=>{const el=document.getElementById(id);if(el)el.value='';});
  }catch(e){fireErr(e,'guardar red social');}
};
window.delSocial=async function(id){
  try{await deleteDoc(doc(db,'redes_sociales',id));toast('🗑️ Eliminada','ok');}
  catch(e){fireErr(e,'eliminar red social');}
};

// ── ERRORES FIREBASE ──
function fireErr(err,accion){
  console.error(`Error al ${accion}:`,err);
  if(err.code==='permission-denied'||err.message?.includes('Missing or insufficient permissions')){
    toast('🔒 Sin permisos en Firestore — configura las reglas. Ver README.','err');
    showRulesAlert();
  } else if(err.code==='unavailable'){
    toast('📡 Sin conexión a internet.','err');
  } else {
    toast(`❌ Error: ${err.message||err.code||'desconocido'}. Revisa la consola.`,'err');
  }
}
function showRulesAlert(){
  if(document.getElementById('rules-alert'))return;
  const d=document.createElement('div');d.id='rules-alert';
  d.style.cssText='position:fixed;top:84px;left:50%;transform:translateX(-50%);background:#fff3cd;border:2px solid #ffc107;border-radius:12px;padding:17px 22px;max-width:540px;width:92%;z-index:8000;box-shadow:0 8px 26px rgba(0,0,0,.13);font-family:Lato,sans-serif';
  d.innerHTML=`<div style="display:flex;justify-content:space-between;gap:10px"><div><strong style="color:#856404">⚠️ Reglas de Firestore no configuradas</strong><p style="font-size:.81rem;color:#5a4c00;margin:8px 0 5px">Ve a <a href="https://console.firebase.google.com" target="_blank" style="color:#2A7B2E;font-weight:700">console.firebase.google.com</a> → tu proyecto → <strong>Firestore Database → Reglas</strong> y pega:</p><pre style="background:#f8f0cd;border-radius:6px;padding:10px;font-size:.73rem;overflow-x:auto;color:#333;margin:0">rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}</pre><p style="font-size:.74rem;color:#856404;margin-top:6px">Luego haz clic en <strong>Publicar</strong> y recarga esta página.</p></div><button onclick="document.getElementById('rules-alert').remove()" style="background:none;border:none;cursor:pointer;font-size:1.25rem;color:#856404;flex-shrink:0">✕</button></div>`;
  document.body.appendChild(d);
}

// ── TOAST ──
function toast(msg,type=''){
  const t=document.getElementById('toast');if(!t)return;
  t.textContent=msg;t.className=`toast on ${type}`;
  setTimeout(()=>t.className='toast',3600);
}

// ── ESCAPE HTML ──
function x(s){if(s==null)return'';return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}
