# 🌺 ARTESANÍAS WAYUU WEPIAPAA

Tienda en línea de artesanías auténticas Wayuu: mochilas, chinchorros y accesorios hechos a mano desde La Guajira colombiana.

---

## 📁 Estructura de archivos

```
artesanias-wayuu-wepiapaa/
├── index.html      → Página principal de la tienda
├── admin.html      → Panel de administración
├── script.js       → Lógica de la tienda (Firebase, carrito, slider)
├── admin.js        → Lógica del panel administrador (CRUD Firebase)
├── styles.css      → Estilos visuales completos
└── README.md       → Esta documentación
```

---

## 🔥 Configuración de Firebase

El proyecto usa **Firebase Firestore** para almacenar productos y redes sociales de forma global y persistente.

**Configuración ya incluida en los archivos:**
```js
const firebaseConfig = {
  apiKey: "AIzaSyAxUPOz30Sv_n1m87SLtu4-r2IrHUOBkcw",
  authDomain: "artesanias-wayuu-wepiapaa.firebaseapp.com",
  projectId: "artesanias-wayuu-wepiapaa",
  storageBucket: "artesanias-wayuu-wepiapaa.firebasestorage.app",
  messagingSenderId: "995886273941",
  appId: "1:995886273941:web:1e95d63891d14a8ed9529c"
};
```

### Colecciones en Firestore:
| Colección | Descripción |
|-----------|-------------|
| `productos` | Todos los productos de la tienda |
| `redes_sociales` | Links a redes sociales de la tienda |

### Reglas de Firestore recomendadas:
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read: if true;
      allow write: if true;
    }
  }
}
```

---

## 🖼️ Cómo usar IMGBB para imágenes

1. Ve a [https://imgbb.com](https://imgbb.com)
2. Crea una cuenta gratuita
3. Sube la imagen del producto
4. Copia el **enlace directo** (Direct link), que termina en `.jpg`, `.png`, etc.
5. Pega esa URL en el campo de imagen del panel administrador

**Ejemplo de URL válida:**
```
https://i.ibb.co/AbCdEfGh/mi-mochila.jpg
```

---

## 🛠️ Panel Administrador

### Acceso:
- Abre `admin.html`
- **Usuario:** `admin`
- **Contraseña:** `wayuu2026`

### Funciones del panel:

#### 📦 Productos
- **Agregar producto:** Completa el formulario con nombre, categoría, precio, descripción, URL de imagen y disponibilidad
- **Editar producto:** Haz clic en "✏️ Editar" en la lista de productos
- **Eliminar producto:** Haz clic en "🗑️ Eliminar" y confirma

#### Campos de cada producto:
| Campo | Descripción |
|-------|-------------|
| `nombre` | Nombre visible del producto |
| `descripcion` | Descripción del producto |
| `precio` | Precio en pesos colombianos (COP) |
| `categoria` | Mochilas / Chinchorros / Accesorios |
| `imagen` | URL de la imagen (IMGBB recomendado) |
| `disponible` | Si aparece o no en la tienda |

#### 📱 Redes Sociales
- Agrega redes sociales con nombre, handle y URL
- Los cambios se reflejan automáticamente en la tienda

---

## 🌐 Sincronización global entre dispositivos

El proyecto usa **`onSnapshot`** de Firebase Firestore, que escucha cambios en tiempo real:

- Cuando el admin agrega/edita/elimina un producto, **todos los usuarios** ven el cambio de inmediato sin recargar la página
- Los datos persisten en Firebase: no se pierden al cerrar el navegador
- Funciona en celular, tablet y computador simultáneamente

---

## 🛒 Carrito de compras y WhatsApp

- El carrito se guarda en `localStorage` del navegador del cliente
- Al hacer clic en "Pedir por WhatsApp", se genera un mensaje automático con:
  - Lista de productos seleccionados
  - Cantidades
  - Total del pedido
  - Nota sobre costo de envío
- El mensaje se envía al número **3137904864**

---

## 🚀 Publicar en GitHub Pages

1. Crea un repositorio en [github.com](https://github.com)
2. Sube todos los archivos del proyecto al repositorio
3. Ve a **Settings → Pages**
4. En "Source" selecciona `main` branch y carpeta raíz (`/`)
5. Haz clic en **Save**
6. Tu tienda estará disponible en: `https://tu-usuario.github.io/tu-repositorio/`

> **Nota importante:** GitHub Pages requiere que los archivos JS sean módulos ES (`type="module"`), lo cual ya está configurado en los archivos `index.html` y `admin.html`.

---

## 📋 Checklist de configuración

- [ ] Verificar reglas de Firestore en Firebase Console
- [ ] Subir imágenes a IMGBB
- [ ] Agregar productos desde `admin.html`
- [ ] Agregar redes sociales desde el panel admin
- [ ] Publicar en GitHub Pages
- [ ] Compartir el link de la tienda

---

## 📱 Número de WhatsApp

**3137904864** – Todos los pedidos van a este número.

---

## 🎨 Tecnologías usadas

- **HTML5 + CSS3 + JavaScript puro** (sin frameworks)
- **Firebase Firestore** – Base de datos en tiempo real
- **IMGBB** – Hosting de imágenes para productos
- **Google Fonts** – Cinzel, Playfair Display, Lato
- **WhatsApp API** – Para recibir pedidos

---

*Hecho con ❤️ para Artesanías Wayuu Wepiapaa — La Guajira, Colombia*
