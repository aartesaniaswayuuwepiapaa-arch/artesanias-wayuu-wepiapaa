// ===== ADMIN.JS - ARTESANÍAS WAYUU WEPIAPAA =====
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp
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

// ===== AUTH SIMPLE =====
const ADMIN_USER = 'admin';
const ADMIN_PASS = 'wayuu2026';

let allProducts = [];
let allSocials = [];
let deleteTargetId = null;
let deleteSocialId = null;

window.doLogin = function() {
  const user = document.getElementById('login-user').value.trim();
  const pass = document.getElementById('login-pass').value;
  const err = document.getElementById('login-error');

  if (user === ADMIN_USER && pass === ADMIN_PASS) {
    document.getElementById('login-overlay').style.display = 'none';
    document.getElementById('admin-layout').classList.add('visible');
    sessionStorage.setItem('wayuu_admin', '1');
    initAdmin();
  } else {
    err.style.display = 'block';
    setTimeout(() => err.style.display = 'none', 3000);
  }
};

window.doLogout = function() {
  sessionStorage.removeItem('wayuu_admin');
  location.reload();
};

// Auto-login si ya está en sesión
if (sessionStorage.getItem('wayuu_admin') === '1') {
  document.getElementById('login-overlay').style.display = 'none';
  document.getElementById('admin-layout').classList.add('visible');
  initAdmin();
}

// Enter key en login
['login-user', 'login-pass'].forEach(id => {
  document.getElementById(id)?.addEventListener('keydown', e => {
    if (e.key === 'Enter') window.doLogin();
  });
});

// ===== INIT ADMIN =====
function initAdmin() {
  listenProducts();
  listenSocials();
}

// ===== NAVIGATION =====
window.showPanel = function(panelId) {
  document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));

  const panel = document.getElementById('panel-' + panelId);
  if (panel) panel.classList.add('active');

  const titles = {
    'dashboard': 'Dashboard',
    'add-product': 'Agregar Producto',
    'products-list': 'Lista de Productos',
    'social-panel': 'Redes Sociales'
  };
  document.getElementById('topbar-title').textContent = titles[panelId] || 'Admin';

  // Activar nav item
  document.querySelectorAll('.nav-item').forEach(btn => {
    if (btn.textContent.toLowerCase().includes(panelId.replace('-', ' ').toLowerCase()) ||
        btn.onclick?.toString().includes(panelId)) {
      btn.classList.add('active');
    }
  });
};

// ===== PRODUCTS LISTENER =====
function listenProducts() {
  const q = query(collection(db, 'productos'), orderBy('createdAt', 'desc'));
  onSnapshot(q, snapshot => {
    allProducts = [];
    snapshot.forEach(d => allProducts.push({ id: d.id, ...d.data() }));
    renderProductsTable(allProducts);
    updateStats(allProducts);
  }, err => {
    console.error(err);
    showToast('Error al conectar con Firebase', 'error');
  });
}

// ===== STATS =====
function updateStats(products) {
  document.getElementById('stat-total').textContent = products.length;
  document.getElementById('stat-available').textContent = products.filter(p => p.disponible !== false).length;
  document.getElementById('stat-mochilas').textContent = products.filter(p => p.categoria === 'Mochilas').length;
  document.getElementById('stat-chinchorros').textContent = products.filter(p => p.categoria === 'Chinchorros').length;
}

// ===== RENDER TABLE =====
function renderProductsTable(products) {
  const tbody = document.getElementById('products-table-body');
  if (products.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:40px;color:var(--text-light)">
      No hay productos aún. <strong onclick="showPanel('add-product')" style="cursor:pointer;color:var(--primary)">Agregar uno</strong>
    </td></tr>`;
    return;
  }

  tbody.innerHTML = products.map(p => {
    const precio = parseFloat(p.precio) || 0;
    const img = p.imagen || 'https://i.ibb.co/HTmkH6GP/IMAGE-1.jpg';
    const available = p.disponible !== false;
    return `
      <tr>
        <td><img src="${esc(img)}" class="product-thumb" alt="${esc(p.nombre)}"
            onerror="this.src='https://i.ibb.co/HTmkH6GP/IMAGE-1.jpg'"></td>
        <td><strong>${esc(p.nombre)}</strong></td>
        <td><span class="badge badge-cat">${esc(p.categoria || '—')}</span></td>
        <td><strong>$${Number(precio).toLocaleString('es-CO')}</strong></td>
        <td><span class="badge ${available ? 'badge-available' : 'badge-unavailable'}">
          ${available ? '✅ Disponible' : '❌ No disponible'}
        </span></td>
        <td>
          <button class="btn-edit" onclick="editProduct('${p.id}')">✏️ Editar</button>
          <button class="btn-delete" onclick="confirmDelete('${p.id}')">🗑️ Eliminar</button>
        </td>
      </tr>
    `;
  }).join('');
}

// ===== SEARCH =====
window.searchProducts = function(query) {
  const q = query.toLowerCase();
  const filtered = allProducts.filter(p =>
    p.nombre?.toLowerCase().includes(q) ||
    p.categoria?.toLowerCase().includes(q) ||
    p.descripcion?.toLowerCase().includes(q)
  );
  renderProductsTable(filtered);
};

// ===== IMAGE PREVIEW =====
window.previewImg = function(url) {
  const img = document.getElementById('img-preview');
  if (url && url.startsWith('http')) {
    img.src = url;
    img.classList.add('show');
    img.onerror = () => img.classList.remove('show');
  } else {
    img.classList.remove('show');
  }
};

// ===== SAVE PRODUCT =====
window.saveProduct = async function() {
  const id = document.getElementById('edit-id').value;
  const nombre = document.getElementById('f-nombre').value.trim();
  const categoria = document.getElementById('f-categoria').value;
  const precio = parseFloat(document.getElementById('f-precio').value);
  const descripcion = document.getElementById('f-descripcion').value.trim();
  const imagen = document.getElementById('f-imagen').value.trim();
  const disponible = document.getElementById('f-disponible').value === 'true';

  if (!nombre || !categoria || isNaN(precio) || !imagen) {
    showToast('⚠️ Completa todos los campos obligatorios (*)', 'error');
    return;
  }
  if (!imagen.startsWith('http')) {
    showToast('⚠️ La URL de imagen debe comenzar con http...', 'error');
    return;
  }

  const data = { nombre, categoria, precio, descripcion, imagen, disponible };

  try {
    if (id) {
      // EDITAR
      await updateDoc(doc(db, 'productos', id), { ...data, updatedAt: serverTimestamp() });
      showToast('✅ Producto actualizado correctamente', 'success');
    } else {
      // CREAR
      await addDoc(collection(db, 'productos'), { ...data, createdAt: serverTimestamp() });
      showToast('✅ Producto agregado correctamente', 'success');
    }
    clearForm();
    showPanel('products-list');
  } catch (err) {
    console.error(err);
    showToast('❌ Error al guardar: ' + err.message, 'error');
  }
};

// ===== EDIT PRODUCT =====
window.editProduct = function(id) {
  const p = allProducts.find(x => x.id === id);
  if (!p) return;

  document.getElementById('edit-id').value = id;
  document.getElementById('f-nombre').value = p.nombre || '';
  document.getElementById('f-categoria').value = p.categoria || '';
  document.getElementById('f-precio').value = p.precio || '';
  document.getElementById('f-descripcion').value = p.descripcion || '';
  document.getElementById('f-imagen').value = p.imagen || '';
  document.getElementById('f-disponible').value = p.disponible !== false ? 'true' : 'false';
  document.getElementById('form-title').textContent = '✏️ Editar Producto';

  if (p.imagen) window.previewImg(p.imagen);

  showPanel('add-product');
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

// ===== CLEAR FORM =====
window.clearForm = function() {
  ['edit-id','f-nombre','f-precio','f-descripcion','f-imagen'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });
  document.getElementById('f-categoria').value = '';
  document.getElementById('f-disponible').value = 'true';
  document.getElementById('img-preview').classList.remove('show');
  document.getElementById('form-title').textContent = '➕ Agregar Nuevo Producto';
};

// ===== DELETE CONFIRM =====
window.confirmDelete = function(id) {
  deleteTargetId = id;
  document.getElementById('modal-overlay').classList.add('open');
  document.getElementById('modal-confirm-btn').onclick = async () => {
    if (!deleteTargetId) return;
    try {
      await deleteDoc(doc(db, 'productos', deleteTargetId));
      showToast('🗑️ Producto eliminado', 'success');
    } catch (err) {
      showToast('❌ Error al eliminar: ' + err.message, 'error');
    }
    closeModal();
  };
};

window.closeModal = function() {
  document.getElementById('modal-overlay').classList.remove('open');
  deleteTargetId = null;
};

// ===== SOCIAL LISTENER =====
function listenSocials() {
  onSnapshot(collection(db, 'redes_sociales'), snapshot => {
    allSocials = [];
    snapshot.forEach(d => allSocials.push({ id: d.id, ...d.data() }));
    renderSocialsTable(allSocials);
  });
}

// ===== RENDER SOCIALS TABLE =====
function renderSocialsTable(socials) {
  const tbody = document.getElementById('social-table-body');
  if (socials.length === 0) {
    tbody.innerHTML = `<tr><td colspan="4" style="text-align:center;padding:30px;color:var(--text-light)">
      No hay redes sociales guardadas aún.
    </td></tr>`;
    return;
  }
  tbody.innerHTML = socials.map(s => `
    <tr>
      <td><strong>${esc(s.nombre || '—')}</strong></td>
      <td>${esc(s.handle || '—')}</td>
      <td><a href="${esc(s.url || '#')}" target="_blank" style="color:var(--primary)">${esc(s.url || '—')}</a></td>
      <td><button class="btn-delete" onclick="deleteSocial('${s.id}')">🗑️ Eliminar</button></td>
    </tr>
  `).join('');
}

// ===== SAVE SOCIAL =====
window.saveSocial = async function() {
  const nombre = document.getElementById('s-nombre').value;
  const handle = document.getElementById('s-handle').value.trim();
  const url = document.getElementById('s-url').value.trim();

  if (!nombre || !url) {
    showToast('⚠️ Selecciona la red y escribe la URL', 'error');
    return;
  }
  try {
    await addDoc(collection(db, 'redes_sociales'), { nombre, handle, url, createdAt: serverTimestamp() });
    showToast('✅ Red social guardada', 'success');
    document.getElementById('s-nombre').value = '';
    document.getElementById('s-handle').value = '';
    document.getElementById('s-url').value = '';
  } catch (err) {
    showToast('❌ Error: ' + err.message, 'error');
  }
};

// ===== DELETE SOCIAL =====
window.deleteSocial = async function(id) {
  try {
    await deleteDoc(doc(db, 'redes_sociales', id));
    showToast('🗑️ Red social eliminada', 'success');
  } catch (err) {
    showToast('❌ Error al eliminar: ' + err.message, 'error');
  }
};

// ===== TOAST =====
function showToast(msg, type = '') {
  const toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.className = 'toast show ' + type;
  setTimeout(() => toast.className = 'toast', 3000);
}

// ===== UTILS =====
function esc(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
