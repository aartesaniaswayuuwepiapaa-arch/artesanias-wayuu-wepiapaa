// ===== SCRIPT.JS - ARTESANÍAS WAYUU WEPIAPAA =====
// Firebase SDK (módulo ESM via CDN)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getFirestore,
  collection,
  onSnapshot
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// ===== FIREBASE CONFIG =====
const firebaseConfig = {
  apiKey: "AIzaSyAxUPOz30Sv_n1m87SLtu4-r2IrHUOBkcw",
  authDomain: "artesanias-wayuu-wepiapaa.firebaseapp.com",
  projectId: "artesanias-wayuu-wepiapaa",
  storageBucket: "artesanias-wayuu-wepiapaa.firebasestorage.app",
  messagingSenderId: "995886273941",
  appId: "1:995886273941:web:1e95d63891d14a8ed9529c"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// ===== ESTADO GLOBAL =====
let allProducts = [];
let cart = JSON.parse(localStorage.getItem('wayuu_cart') || '[]');
let currentFilter = 'Todos';

// ===== SLIDER =====
const sliderTrack = document.getElementById('slider-track');
const slides = document.querySelectorAll('.slide');
const dotsContainer = document.getElementById('slider-dots');
let currentSlide = 0;
let sliderInterval;

function initSlider() {
  slides.forEach((_, i) => {
    const dot = document.createElement('button');
    dot.className = 'dot' + (i === 0 ? ' active' : '');
    dot.setAttribute('aria-label', `Diapositiva ${i + 1}`);
    dot.addEventListener('click', () => goToSlide(i));
    dotsContainer.appendChild(dot);
  });
  startAutoSlide();
}

function goToSlide(n) {
  slides[currentSlide].classList.remove('active');
  document.querySelectorAll('.dot')[currentSlide]?.classList.remove('active');
  currentSlide = (n + slides.length) % slides.length;
  slides[currentSlide].classList.add('active');
  document.querySelectorAll('.dot')[currentSlide]?.classList.add('active');
  sliderTrack.style.transform = `translateX(-${currentSlide * 100}%)`;
}

function startAutoSlide() {
  sliderInterval = setInterval(() => goToSlide(currentSlide + 1), 5000);
}

document.getElementById('prev-slide')?.addEventListener('click', () => {
  clearInterval(sliderInterval);
  goToSlide(currentSlide - 1);
  startAutoSlide();
});
document.getElementById('next-slide')?.addEventListener('click', () => {
  clearInterval(sliderInterval);
  goToSlide(currentSlide + 1);
  startAutoSlide();
});

initSlider();

// ===== MENÚ MÓVIL =====
document.getElementById('menu-toggle')?.addEventListener('click', () => {
  const nav = document.getElementById('main-nav');
  nav.classList.toggle('open');
});

// ===== FIREBASE: ESCUCHAR PRODUCTOS EN TIEMPO REAL =====
function listenProducts() {
  // Timeout de seguridad: si Firebase no responde en 8 segundos, muestra estado vacío
  const timeout = setTimeout(() => {
    const grid = document.getElementById('products-grid');
    if (grid && grid.querySelector('.spinner')) {
      grid.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">🧺</div>
          <h3 style="font-family:'Cinzel',serif; color:var(--color-primary-dark); margin-bottom:8px;">Aún no hay productos</h3>
          <p>El administrador aún no ha agregado productos.<br>¡Vuelve pronto o contáctanos por WhatsApp!</p>
        </div>
      `;
    }
  }, 8000);

  // Sin orderBy para evitar necesidad de índice compuesto en Firestore
  onSnapshot(collection(db, 'productos'), (snapshot) => {
    clearTimeout(timeout);
    allProducts = [];
    snapshot.forEach(doc => {
      allProducts.push({ id: doc.id, ...doc.data() });
    });
    renderProducts(allProducts, currentFilter);
  }, (error) => {
    clearTimeout(timeout);
    console.error('Error cargando productos:', error);
    // Si falla por permisos, mostrar estado vacío en lugar de error técnico
    if (error.code === 'permission-denied') {
      document.getElementById('products-grid').innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">🔒</div>
          <h3 style="font-family:'Cinzel',serif; color:var(--color-primary-dark); margin-bottom:8px;">Sin productos aún</h3>
          <p>Configura las reglas de Firebase para ver los productos.<br>Revisa el README para más información.</p>
        </div>
      `;
    } else {
      renderProductsError();
    }
  });
}

// ===== FIREBASE: ESCUCHAR REDES SOCIALES =====
function listenSocials() {
  onSnapshot(collection(db, 'redes_sociales'), (snapshot) => {
    const socials = [];
    snapshot.forEach(doc => socials.push({ id: doc.id, ...doc.data() }));
    renderSocials(socials);
  });
}

// ===== RENDER PRODUCTOS =====
function renderProducts(products, filter = 'Todos') {
  const grid = document.getElementById('products-grid');
  let filtered = filter === 'Todos' ? products : products.filter(p => p.categoria === filter);
  // Solo mostrar disponibles
  const visible = filtered.filter(p => p.disponible !== false);

  if (visible.length === 0) {
    grid.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">🧺</div>
        <h3 style="font-family:'Cinzel',serif; color:var(--color-primary-dark); margin-bottom:8px;">Sin productos en esta categoría</h3>
        <p>Pronto agregaremos más artesanías. ¡Vuelve pronto!</p>
      </div>
    `;
    return;
  }

  grid.innerHTML = visible.map(p => createProductCard(p)).join('');
}

function createProductCard(p) {
  const inCart = cart.some(c => c.id === p.id);
  const imgSrc = p.imagen || 'https://i.ibb.co/HTmkH6GP/IMAGE-1.jpg';
  const precio = parseFloat(p.precio) || 0;
  const precioStr = formatPrice(precio);

  return `
    <div class="product-card" data-id="${p.id}">
      <div class="product-img-wrap">
        <img src="${escapeHtml(imgSrc)}" alt="${escapeHtml(p.nombre)}" loading="lazy"
             onerror="this.src='https://i.ibb.co/HTmkH6GP/IMAGE-1.jpg'">
        <span class="product-badge">✨ Artesanal</span>
        <button class="product-wishlist" title="Me gusta" onclick="toggleWishlist('${p.id}', this)">🤍</button>
      </div>
      <div class="product-info">
        <span class="product-category">${escapeHtml(p.categoria || 'Artesanía')}</span>
        <h3>${escapeHtml(p.nombre)}</h3>
        <p class="product-desc">${escapeHtml(p.descripcion || '')}</p>
        <div class="product-footer">
          <span class="product-price">${precioStr}</span>
          <button class="btn-add-cart" onclick="addToCart('${p.id}')">
            🛒 Agregar
          </button>
        </div>
      </div>
    </div>
  `;
}

function renderProductsError() {
  document.getElementById('products-grid').innerHTML = `
    <div class="empty-state">
      <div class="empty-icon">⚠️</div>
      <h3 style="font-family:'Cinzel',serif; color:var(--color-primary-dark); margin-bottom:8px;">Error al cargar productos</h3>
      <p>Verifica tu conexión a internet o revisa la configuración de Firebase.</p>
    </div>
  `;
}

// ===== RENDER REDES SOCIALES =====
function renderSocials(socials) {
  const grid = document.getElementById('social-grid');
  const icons = { Instagram: '📸', Facebook: '📘', TikTok: '🎵', YouTube: '▶️', Twitter: '🐦', WhatsApp: '📱' };

  const defaultWA = `
    <a href="https://wa.me/573137904864" target="_blank" class="social-card">
      <span class="social-icon">📱</span>
      <div class="social-info">
        <strong>WhatsApp</strong>
        <span>3137904864</span>
      </div>
    </a>
  `;

  if (!socials || socials.length === 0) {
    grid.innerHTML = defaultWA;
    return;
  }

  grid.innerHTML = socials.map(s => `
    <a href="${escapeHtml(s.url || '#')}" target="_blank" rel="noopener" class="social-card">
      <span class="social-icon">${icons[s.nombre] || '🌐'}</span>
      <div class="social-info">
        <strong>${escapeHtml(s.nombre)}</strong>
        <span>${escapeHtml(s.handle || '')}</span>
      </div>
    </a>
  `).join('');
}

// ===== FILTROS =====
window.filterCategory = function(cat) {
  currentFilter = cat;
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.classList.toggle('active', btn.textContent.trim() === cat || (cat === 'Todos' && btn.textContent.trim() === 'Todos'));
  });
  renderProducts(allProducts, cat);
  // Scroll a productos si viene desde categorías
  if (cat !== 'Todos') {
    document.getElementById('productos')?.scrollIntoView({ behavior: 'smooth' });
  }
};

// ===== CARRITO =====
function saveCart() {
  localStorage.setItem('wayuu_cart', JSON.stringify(cart));
  updateCartUI();
}

function updateCartUI() {
  const count = cart.reduce((s, i) => s + i.qty, 0);
  document.getElementById('cart-count').textContent = count;
  renderCartItems();
}

window.addToCart = function(productId) {
  const product = allProducts.find(p => p.id === productId);
  if (!product) return;

  const existing = cart.find(c => c.id === productId);
  if (existing) {
    existing.qty++;
  } else {
    cart.push({
      id: product.id,
      nombre: product.nombre,
      precio: parseFloat(product.precio) || 0,
      imagen: product.imagen || '',
      qty: 1
    });
  }
  saveCart();
  showToast(`✅ "${product.nombre}" agregado al carrito`);
  openCart();
};

window.toggleWishlist = function(id, btn) {
  btn.textContent = btn.textContent === '🤍' ? '❤️' : '🤍';
};

function renderCartItems() {
  const list = document.getElementById('cart-items-list');
  const footer = document.getElementById('cart-footer');

  if (cart.length === 0) {
    list.innerHTML = `
      <div class="cart-empty">
        <div class="empty-icon">🛒</div>
        <p>Tu carrito está vacío.<br>¡Agrega algunas artesanías!</p>
      </div>
    `;
    footer.style.display = 'none';
    return;
  }

  let total = 0;
  list.innerHTML = cart.map(item => {
    total += item.precio * item.qty;
    return `
      <div class="cart-item">
        <img class="cart-item-img" src="${escapeHtml(item.imagen || 'https://i.ibb.co/HTmkH6GP/IMAGE-1.jpg')}"
             alt="${escapeHtml(item.nombre)}"
             onerror="this.src='https://i.ibb.co/HTmkH6GP/IMAGE-1.jpg'">
        <div class="cart-item-info">
          <div class="cart-item-name">${escapeHtml(item.nombre)}</div>
          <div class="cart-item-price">${formatPrice(item.precio)}</div>
          <div class="cart-item-qty">
            <button class="qty-btn" onclick="changeQty('${item.id}', -1)">−</button>
            <span class="qty-num">${item.qty}</span>
            <button class="qty-btn" onclick="changeQty('${item.id}', 1)">+</button>
          </div>
        </div>
        <button class="btn-remove-item" onclick="removeFromCart('${item.id}')" title="Eliminar">🗑️</button>
      </div>
    `;
  }).join('');

  document.getElementById('cart-total-price').textContent = formatPrice(total);
  footer.style.display = 'block';
}

window.changeQty = function(id, delta) {
  const item = cart.find(c => c.id === id);
  if (!item) return;
  item.qty += delta;
  if (item.qty <= 0) {
    cart = cart.filter(c => c.id !== id);
  }
  saveCart();
};

window.removeFromCart = function(id) {
  cart = cart.filter(c => c.id !== id);
  saveCart();
};

function openCart() {
  document.getElementById('cart-sidebar').classList.add('open');
  document.getElementById('cart-overlay').classList.add('open');
  document.body.style.overflow = 'hidden';
}
function closeCart() {
  document.getElementById('cart-sidebar').classList.remove('open');
  document.getElementById('cart-overlay').classList.remove('open');
  document.body.style.overflow = '';
}

document.getElementById('btn-open-cart')?.addEventListener('click', openCart);
document.getElementById('btn-close-cart')?.addEventListener('click', closeCart);
document.getElementById('cart-overlay')?.addEventListener('click', closeCart);

// ===== WHATSAPP ORDER =====
document.getElementById('btn-send-whatsapp')?.addEventListener('click', () => {
  if (cart.length === 0) return;

  const total = cart.reduce((s, i) => s + i.precio * i.qty, 0);
  const itemLines = cart.map(i => `• ${i.nombre} x${i.qty} — ${formatPrice(i.precio * i.qty)}`).join('\n');

  const msg = [
    '🎨 *ARTESANÍAS WAYUU WEPIAPAA*',
    '',
    '¡Hola! Quiero hacer el siguiente pedido:',
    '',
    itemLines,
    '',
    `*Total del pedido: ${formatPrice(total)}*`,
    '',
    '📦 *Nota:* El costo del envío será acordado directamente con el cliente.',
    '',
    '¡Gracias por tu pedido! 🌺'
  ].join('\n');

  const encoded = encodeURIComponent(msg);
  window.open(`https://wa.me/573137904864?text=${encoded}`, '_blank');
});

// ===== TOAST =====
function showToast(msg) {
  const toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 2800);
}

// ===== UTILS =====
function formatPrice(n) {
  return '$' + Number(n).toLocaleString('es-CO');
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ===== SMOOTH SCROLL NAV =====
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    const target = document.querySelector(a.getAttribute('href'));
    if (target) {
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth' });
      document.getElementById('main-nav')?.classList.remove('open');
    }
  });
});

// ===== INIT =====
updateCartUI();
listenProducts();
listenSocials();
