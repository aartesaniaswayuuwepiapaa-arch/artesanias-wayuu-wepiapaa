// script.js — Artesanías Wayuu Wepiapaa
// Firebase SDK 11 (compatible con la versión del usuario)
import { initializeApp } from 'https://www.gstatic.com/firebasejs/11.0.0/firebase-app.js';
import { getFirestore, collection, doc, onSnapshot } from 'https://www.gstatic.com/firebasejs/11.0.0/firebase-firestore.js';

const FB = {
  apiKey:'AIzaSyAxUPOz30Sv_n1m87SLtu4-r2IrHUOBkcw',
  authDomain:'artesanias-wayuu-wepiapaa.firebaseapp.com',
  projectId:'artesanias-wayuu-wepiapaa',
  storageBucket:'artesanias-wayuu-wepiapaa.firebasestorage.app',
  messagingSenderId:'995886273941',
  appId:'1:995886273941:web:1e95d63891d14a8ed9529c'
};
const app = initializeApp(FB);
const db  = getFirestore(app);

let products=[], cart=JSON.parse(localStorage.getItem('ww_cart')||'[]'), filter='Todos';
const DIMG='https://i.ibb.co/HTmkH6GP/IMAGE-1.jpg';
const WA='573137904864';

// SLIDER
const track=document.getElementById('sl-track');
const slides=document.querySelectorAll('.slide');
const dotsEl=document.getElementById('sl-dots');
let cur=0,timer;
slides.forEach((_,i)=>{
  const d=document.createElement('button');
  d.className='dot'+(i===0?' on':'');d.setAttribute('aria-label','Slide '+(i+1));
  d.onclick=()=>{clearInterval(timer);go(i);auto();};
  dotsEl.appendChild(d);
});
function go(n){
  slides[cur].classList.remove('on');dotsEl.children[cur].classList.remove('on');
  cur=(n+slides.length)%slides.length;
  slides[cur].classList.add('on');dotsEl.children[cur].classList.add('on');
  track.style.transform=`translateX(-${cur*100}%)`;
}
function auto(){timer=setInterval(()=>go(cur+1),5000);}
document.getElementById('prev').onclick=()=>{clearInterval(timer);go(cur-1);auto();};
document.getElementById('next').onclick=()=>{clearInterval(timer);go(cur+1);auto();};
auto();

// NAV MÓVIL
const nav=document.getElementById('main-nav');
document.getElementById('ham').onclick=()=>nav.classList.toggle('on');
document.querySelectorAll('#main-nav a').forEach(a=>a.addEventListener('click',()=>nav.classList.remove('on')));

// LOGO DINÁMICO
onSnapshot(doc(db,'configuracion','tienda'),s=>{
  if(!s.exists())return;
  const u=s.data().logoUrl;if(!u)return;
  ['site-logo','footer-logo'].forEach(id=>{const el=document.getElementById(id);if(el)el.src=u;});
  const fv=document.getElementById('favicon');if(fv)fv.href=u;
},()=>{});

// PRODUCTOS EN TIEMPO REAL
const grid=document.getElementById('pgrid');
const fb=setTimeout(()=>{if(grid.querySelector('.spin'))showEmpty('🧺','Sin productos por ahora','El administrador pronto agregará productos. ¡Contáctanos!');},8000);
onSnapshot(collection(db,'productos'),snap=>{
  clearTimeout(fb);
  products=[];snap.forEach(d=>products.push({id:d.id,...d.data()}));
  render();
},err=>{
  clearTimeout(fb);
  console.error(err);
  if(err.code==='permission-denied')showEmpty('🔒','Acceso denegado','Configura las reglas de Firestore. Ver README.');
  else showEmpty('⚠️','Error de conexión','Verifica tu internet y recarga la página.');
});

function render(){
  const list=(filter==='Todos'?products:products.filter(p=>p.categoria===filter)).filter(p=>p.disponible!==false);
  if(!list.length){showEmpty('🧺','Sin productos en esta categoría','¡Vuelve pronto!');return;}
  grid.innerHTML=list.map(cardHTML).join('');
}
function cardHTML(p){
  const img=p.imagen||DIMG,pr=parseFloat(p.precio)||0;
  return`<div class="pc"><div class="pi"><img src="${x(img)}" alt="${x(p.nombre)}" loading="lazy" onerror="this.src='${DIMG}'"><span class="pb">✨ Artesanal</span><button class="pw" onclick="this.textContent=this.textContent==='🤍'?'❤️':'🤍'">🤍</button></div><div class="pinfo"><span class="pcat">${x(p.categoria||'Artesanía')}</span><h3>${x(p.nombre)}</h3><p class="pdesc">${x(p.descripcion||'')}</p><div class="pfoot"><span class="pprice">${fmt(pr)}</span><button class="btn-add" onclick="addCart('${p.id}')">🛒 Agregar</button></div></div></div>`;
}
function showEmpty(ico,ttl,msg){
  grid.innerHTML=`<div class="ebox"><div class="eico">${ico}</div><h3 style="font-family:'Cinzel',serif;color:var(--gd);margin-bottom:7px">${ttl}</h3><p>${msg}</p></div>`;
}

// REDES
onSnapshot(collection(db,'redes_sociales'),snap=>{
  const list=[];snap.forEach(d=>list.push({id:d.id,...d.data()}));
  const sg=document.getElementById('soc-g');
  const IC={Instagram:'📸',Facebook:'📘',TikTok:'🎵',YouTube:'▶️',Twitter:'🐦',WhatsApp:'💬'};
  if(!list.length){sg.innerHTML=`<a href="https://wa.me/${WA}" target="_blank" class="sc"><span class="si">💬</span><div class="sinfo"><strong>WhatsApp</strong><span>${WA.slice(2)}</span></div></a>`;return;}
  sg.innerHTML=list.map(s=>`<a href="${x(s.url||'#')}" target="_blank" rel="noopener" class="sc"><span class="si">${IC[s.nombre]||'🌐'}</span><div class="sinfo"><strong>${x(s.nombre)}</strong><span>${x(s.handle||'')}</span></div></a>`).join('');
},()=>{});

// FILTROS
window.filterCat=function(cat){
  filter=cat;
  document.querySelectorAll('.fbtn').forEach(b=>b.classList.toggle('on',b.textContent.trim()===cat));
  render();
  if(cat!=='Todos')document.getElementById('productos').scrollIntoView({behavior:'smooth'});
};

// CARRITO
function saveCart(){localStorage.setItem('ww_cart',JSON.stringify(cart));updateUI();}
function updateUI(){
  document.getElementById('cart-badge').textContent=cart.reduce((s,i)=>s+i.qty,0);
  renderCart();
}
window.addCart=function(id){
  const p=products.find(q=>q.id===id);if(!p)return;
  const ex=cart.find(c=>c.id===id);
  if(ex)ex.qty++;
  else cart.push({id:p.id,nombre:p.nombre,precio:parseFloat(p.precio)||0,imagen:p.imagen||'',qty:1});
  saveCart();
  toast(`✅ "${p.nombre}" agregado`);
  openCart();
};
function renderCart(){
  const cb=document.getElementById('cb'),cf=document.getElementById('cf');
  if(!cart.length){cb.innerHTML='<div class="ce"><div class="ei">🛒</div><p>Tu carrito está vacío.<br>¡Agrega artesanías!</p></div>';cf.style.display='none';return;}
  let total=0;
  cb.innerHTML=cart.map(it=>{total+=it.precio*it.qty;
    return`<div class="cit"><img class="cim" src="${x(it.imagen||DIMG)}" alt="${x(it.nombre)}" onerror="this.src='${DIMG}'"><div class="cin"><div class="cnm">${x(it.nombre)}</div><div class="cpr">${fmt(it.precio)}</div><div class="cqw"><button class="qb" onclick="chQ('${it.id}',-1)">−</button><span class="qn">${it.qty}</span><button class="qb" onclick="chQ('${it.id}',1)">+</button></div></div><button class="brm" onclick="rmIt('${it.id}')">🗑️</button></div>`;
  }).join('');
  document.getElementById('ctotal').textContent=fmt(total);
  cf.style.display='block';
}
window.chQ=function(id,d){const it=cart.find(c=>c.id===id);if(!it)return;it.qty+=d;if(it.qty<=0)cart=cart.filter(c=>c.id!==id);saveCart();};
window.rmIt=function(id){cart=cart.filter(c=>c.id!==id);saveCart();};
function openCart(){document.getElementById('cs').classList.add('on');document.getElementById('cov').classList.add('on');document.body.style.overflow='hidden';}
function closeCart(){document.getElementById('cs').classList.remove('on');document.getElementById('cov').classList.remove('on');document.body.style.overflow='';}
document.getElementById('btn-cart').onclick=openCart;
document.getElementById('btn-xc').onclick=closeCart;
document.getElementById('cov').onclick=closeCart;

// PEDIDO POR WHATSAPP con datos de envío
document.getElementById('btn-wa-order').onclick=function(){
  if(!cart.length)return;
  const nombre=(document.getElementById('ck-nombre').value||'').trim();
  const tel=(document.getElementById('ck-tel').value||'').trim();
  const ciudad=(document.getElementById('ck-ciudad').value||'').trim();
  const dir=(document.getElementById('ck-dir').value||'').trim();
  const nota=(document.getElementById('ck-nota').value||'').trim();
  if(!nombre||!tel||!ciudad||!dir){toast('⚠️ Completa los datos de envío obligatorios (*)');return;}
  const total=cart.reduce((s,i)=>s+i.precio*i.qty,0);
  const lines=cart.map(i=>`• ${i.nombre} x${i.qty} — ${fmt(i.precio*i.qty)}`).join('\n');
  const msg=[
    '🎨 *ARTESANÍAS WAYUU WEPIAPAA*','',
    '¡Hola! Quiero hacer el siguiente pedido:','',
    lines,'',
    `*Total del pedido: ${fmt(total)}*`,'',
    '📋 *Datos de envío:*',
    `👤 Nombre: ${nombre}`,
    `📱 Teléfono: ${tel}`,
    `📍 Ciudad: ${ciudad}`,
    `🏠 Dirección: ${dir}`,
    nota?`📝 Notas: ${nota}`:'','',
    '📦 *El costo del envío será acordado directamente con el vendedor.*','',
    '¡Gracias! 🌺'
  ].filter(l=>l!==undefined).join('\n');
  window.open(`https://wa.me/${WA}?text=${encodeURIComponent(msg)}`,'_blank');
};

// TOAST
function toast(msg){const t=document.getElementById('toast');t.textContent=msg;t.classList.add('on');setTimeout(()=>t.classList.remove('on'),2800);}

// UTILS
function fmt(n){return'$'+Number(n).toLocaleString('es-CO');}
function x(s){if(!s)return'';return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}

// Smooth scroll
document.querySelectorAll('a[href^="#"]').forEach(a=>a.addEventListener('click',e=>{const t=document.querySelector(a.getAttribute('href'));if(t){e.preventDefault();t.scrollIntoView({behavior:'smooth'});}}));

// Init
updateUI();
