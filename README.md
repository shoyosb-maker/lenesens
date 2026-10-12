# 🌸 Lenesens Hydralight · Colombia

> E-commerce de dermocosmética sensorial de alta precisión. Sueros corporales aclaradores e hidratantes formulados con biotecnología botánica francesa, diseñados para el fototipo y clima colombiano.

[![Estado](https://img.shields.io/badge/estado-completo-success)](#)
[![Versión](https://img.shields.io/badge/versión-1.0.0-blue)](#)
[![Licencia](https://img.shields.io/badge/licencia-privada-red)](#)
[![HTML](https://img.shields.io/badge/HTML5-E34F26?logo=html5&logoColor=white)](#)
[![CSS](https://img.shields.io/badge/CSS3-1572B6?logo=css3&logoColor=white)](#)
[![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?logo=javascript&logoColor=black)](#)

---

## 📖 Tabla de Contenidos

- [Descripción](#-descripción)
- [Características](#-características)
- [Stack Técnico](#-stack-técnico)
- [Estructura del Proyecto](#-estructura-del-proyecto)
- [Instalación](#-instalación)
- [Uso](#-uso)
- [Design System](#-design-system)
- [Arquitectura del Código](#-arquitectura-del-código)
- [Assets Requeridos](#-assets-requeridos)
- [Optimización y Performance](#-optimización-y-performance)
- [Accesibilidad](#-accesibilidad)
- [SEO](#-seo)
- [Navegadores Soportados](#-navegadores-soportados)
- [Build y Deploy](#-build-y-deploy)
- [Roadmap](#-roadmap)
- [Licencia](#-licencia)

---

## 📌 Descripción

Lenesens Hydralight es un e-commerce vanilla construido sin frameworks de JavaScript ni CSS. El sitio está diseñado específicamente para el mercado colombiano, con todos los flujos de compra optimizados para los métodos de pago locales (PSE, Nequi, Daviplata, Addi, contraentrega).

**El proyecto incluye:**

- Landing page editorial de alta gama
- Ficha de producto con visor 3D interactivo (Three.js)
- Catálogo con filtros, búsqueda y ordenamiento
- Revista científica con artículos y guías
- Checkout completo con 5 métodos de pago
- Página de confirmación con generación de factura
- Carrito persistente con localStorage
- Sistema de notificaciones (toasts)
- Newsletter con validación

**Objetivo técnico:** demostrar que se puede construir un e-commerce premium **sin frameworks**, con **rendimiento sobresaliente** (Lighthouse ≥ 90 en todas las categorías) y **accesibilidad WCAG AA**.

---

## ✨ Características

### Frontend
- ✅ **Vanilla HTML + CSS + JavaScript** — Sin frameworks, sin build tools obligatorios
- ✅ **Design System propio** — Tokens CSS, variables, componentes reutilizables
- ✅ **Responsive mobile-first** — Adaptado a todos los breakpoints
- ✅ **Visor 3D interactivo** — Three.js r160 con auto-rotación, drag y presets de cámara
- ✅ **Carrito persistente** — localStorage con sincronización entre pestañas
- ✅ **Toasts accesibles** — `aria-live` para lectores de pantalla
- ✅ **Iconos SVG inline** — Sprite SVG con ~50 iconos tintables
- ✅ **Sistema de cupones** — 4 cupones funcionales
- ✅ **Newsletter funcional** — Validación y guardado local

### UX / Accesibilidad
- ✅ **Skip links** en todas las páginas
- ✅ **Focus trap** en modales y drawers
- ✅ **`prefers-reduced-motion`** respetado en todo el sitio
- ✅ **Atajos de teclado** — `Escape`, `/` para buscar, flechas en tabs
- ✅ **ARIA labels** completos en todos los botones e iconos
- ✅ **Contraste WCAG AA** en todo el texto

### Performance
- ✅ **Critical CSS inline** para FOUC cero
- ✅ **CSS no crítico async** con `media="print"` + `onload`
- ✅ **Lazy loading** de imágenes below-the-fold
- ✅ **Preload de fuentes** con `font-display: swap`
- ✅ **Scripts con `defer`** para no bloquear el render
- ✅ **Web Vitals monitoreados** (LCP, CLS, FID, TTFB)

### SEO
- ✅ **Schema.org JSON-LD** — Organization, WebSite, Product, FAQPage, Blog, BreadcrumbList
- ✅ **Open Graph + Twitter Cards** con imágenes 1200×630
- ✅ **Canonical URLs** por página
- ✅ **Sitemap.xml** con imágenes
- ✅ **robots.txt** con reglas específicas

---

## 🛠 Stack Técnico

| Capa | Tecnología | Versión |
|------|-----------|---------|
| **Marcado** | HTML5 semántico | — |
| **Estilos** | CSS3 con custom properties | — |
| **Lógica** | JavaScript ES6+ (vanilla) | — |
| **3D** | Three.js | r160 (CDN) |
| **Fuentes** | Google Fonts | Playfair Display + Montserrat |
| **Storage** | localStorage + sessionStorage | API nativa |
| **Iconos** | SVG Sprite (inline) | — |
| **Build (opcional)** | csso-cli + terser | — |

---

## 📁 Estructura del Proyecto

```
lenesens/
│
├── index.html                    # Landing principal
├── producto.html                 # Ficha de producto + visor 3D
├── catalogo.html                 # Catálogo con filtros
├── revista.html                  # Revista / Blog editorial
├── checkout.html                 # Pasarela de pago
├── confirmacion.html             # Confirmación post-compra
├── sitemap.xml                   # Sitemap para SEO
├── robots.txt                    # Reglas para bots
├── README.md                     # Este archivo
│
├── css/
│   ├── variables.css             # Design tokens (colores, tipografía, espaciados)
│   ├── reset.css                 # Normalización entre navegadores
│   ├── base.css                  # Estilos base + accesibilidad
│   ├── utilities.css             # Helpers de layout y utilidades
│   ├── critical.css              # (Referencia) CSS crítico para inline
│   │
│   ├── components/               # Componentes reutilizables
│   │   ├── header.css
│   │   ├── buttons.css
│   │   ├── chips.css
│   │   ├── cards.css
│   │   ├── forms.css
│   │   ├── cart-drawer.css
│   │   └── footer.css
│   │
│   └── pages/                    # Estilos específicos por página
│       ├── landing.css
│       ├── producto.css
│       ├── catalogo.css
│       ├── revista.css
│       ├── checkout.css
│       └── confirmacion.css
│
├── js/
│   ├── utils.js                  # Helpers globales (window.LNS)
│   ├── toast.js                  # Notificaciones flotantes
│   ├── cart.js                   # Carrito con localStorage
│   ├── header.js                 # Header + menú móvil + scroll
│   ├── newsletter.js             # Formularios de suscripción
│   ├── product-visor.js          # Visor 3D (Three.js)
│   ├── pack-selector.js          # Selector de packs y precios
│   ├── zones.js                  # Tabs de zonas anatómicas
│   ├── faq.js                    # Accordion de FAQ
│   ├── catalog.js                # Filtros del catálogo
│   ├── revista.js                # Filtros de la revista
│   ├── checkout.js               # Lógica del checkout
│   ├── confirmacion.js           # Post-compra + factura
│   ├── a11y.js                   # Mejoras de accesibilidad
│   ├── performance.js            # Prefetch + Web Vitals
│   └── main.js                   # Orquestador general
│
├── assets/
│   ├── img/
│   │   ├── products/             # Fotos de producto
│   │   ├── zones/                # Fotos de zonas anatómicas
│   │   ├── blog/                 # Imágenes de artículos
│   │   ├── lifestyle/            # Avatares y lifestyle
│   │   └── brand/                # Logo, OG images, autores
│   │
│   ├── icons/
│   │   └── sprite.svg            # Sprite SVG maestro (~50 iconos)
│   │
│   ├── favicon/
│   │   ├── favicon.ico
│   │   ├── favicon-16x16.png
│   │   ├── favicon-32x32.png
│   │   ├── favicon-48x48.png
│   │   ├── apple-touch-icon.png
│   │   ├── android-chrome-192x192.png
│   │   ├── android-chrome-512x512.png
│   │   ├── mstile-150x150.png
│   │   ├── safari-pinned-tab.svg
│   │   ├── favicon-source.svg
│   │   ├── browserconfig.xml
│   │   └── site.webmanifest
│   │
│   └── fonts/                    # (Opcional, para auto-hospedaje)
│
└── scripts/
    ├── build.sh                  # Script de minificación (Mac/Linux)
    └── build.ps1                 # Script de minificación (Windows)
```

---

## 🚀 Instalación

### Requisitos previos

- **Navegador moderno** (Chrome 90+, Firefox 88+, Safari 14+, Edge 90+)
- **Editor de código** recomendado: VS Code
- **Servidor local** — Recomendado: [Live Server](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer) para VS Code

### Pasos

1. **Clona o descarga** el proyecto:
   ```bash
   git clone https://github.com/tu-usuario/lenesens.git
   cd lenesens
   ```

2. **Abre el proyecto** en VS Code:
   ```bash
   code .
   ```

3. **Inicia Live Server**:
   - Click derecho sobre `index.html`
   - Selecciona **"Open with Live Server"**
   - Se abrirá en `http://127.0.0.1:5500/`

**No requiere `npm install` ni build tools.** Solo abrir y usar.

---

## 💻 Uso

### Navegación principal

- **Landing** (`index.html`) — Presentación del producto, ingredientes, testimonios, oferta
- **Producto** (`producto.html`) — Visor 3D, packs, modo de uso, ingredientes, zonas, FAQ
- **Catálogo** (`catalogo.html`) — Grid con 5 productos, filtros y búsqueda
- **Revista** (`revista.html`) — Artículos editoriales y guías dermatológicas
- **Checkout** (`checkout.html`) — Finalizar compra con 5 métodos de pago
- **Confirmación** (`confirmacion.html`) — Post-compra con resumen y factura

### Flujo de compra completo

```
1. Landing → Click "Comprar Ahora"
2. Producto → Seleccionar pack + cantidad → "Añadir a mi Ritual"
3. Carrito (drawer) → "Proceder al Pago Seguro"
4. Checkout → Elegir método de pago → "Confirmar Pedido"
5. Confirmación → Ver resumen + descargar factura
```

### Cupones disponibles

| Código | Descuento |
|--------|-----------|
| `LUMINOUS15` | 15% de descuento |
| `COLOMBIA10` | 10% de descuento |
| `HYDRA10` | 10% de descuento |
| `ENVIOGRATIS` | Envío gratis |

Se aplican en el carrito (drawer) desde el campo de cupón.

### Atajos de teclado

| Atajo | Acción |
|-------|--------|
| `Tab` | Navegar entre elementos interactivos |
| `Escape` | Cerrar modales / drawer / menú móvil |
| `/` | Enfocar el buscador del catálogo |
| `→` `←` | Navegar entre tabs de zonas |

---

## 🎨 Design System

El proyecto sigue un sistema de diseño completo documentado en `DESIGN.md`:

### Paleta principal

| Token | Color | Uso |
|-------|-------|-----|
| `--color-primary` | `#7f003b` | CTA, títulos, focal points |
| `--color-primary-container` | `#a61352` | Gradientes, hover |
| `--color-secondary` | `#99415a` | Acentos |
| `--color-tertiary` | `#735c00` | Champagne gold, prestigio |
| `--color-surface` | `#fbf9f6` | Fondo base (ivory silk) |
| `--color-on-surface` | `#1b1c1a` | Texto principal |

### Tipografía

- **Playfair Display** — Títulos editoriales, hero, ingredientes
- **Montserrat** — Cuerpo, labels, precios, UI funcional

### Espaciado (grid 8pt)

Sistema completo de `--space-xs` (4px) hasta `--space-3xl` (96px).

### Componentes principales

- **Botones:** `.btn-primary`, `.btn-outline`, `.btn-gold`, `.btn-ghost`
- **Chips:** `.chip`, `.chip.is-active`, `.chip-neutral`, `.chip-gold`
- **Cards:** `.product-card`, `.ingredient-card`, `.article-card`, `.testimonial-card`
- **Badges:** `.badge-primary`, `.badge-rose`, `.badge-gold`, `.badge-shipping`
- **Inputs:** `.form-input`, `.form-select`, `.form-radio`, `.form-check`

---

## 🏗 Arquitectura del Código

### Patrón general

Todo el JS está encapsulado en **IIFEs** (Immediately Invoked Function Expressions) para evitar contaminación del scope global. Solo se expone lo necesario en `window.LNS`.

```js
(function initModule() {
  'use strict';
  
  const init = () => { /* ... */ };
  
  window.LNS?.ready(init) ?? document.addEventListener('DOMContentLoaded', init);
})();
```

### Namespace global `window.LNS`

Contiene todas las utilidades compartidas:

```js
window.LNS = {
  // Selectores
  $, $$,
  
  // Eventos
  on, delegate, debounce, throttle,
  
  // Formato
  formatCOP, formatPrice, formatNumber,
  
  // Storage seguro
  storage: { get, set, remove },
  
  // Detección de device
  device: { isMobile, isDesktop, prefersReducedMotion },
  
  // Accesibilidad
  a11y: { announce },
  
  // Carrito
  cart: { addItem, removeItem, applyCoupon, /* ... */ },
  
  // Toasts
  toast: { show, success, error, warning, info },
  
  // Helpers
  icon, sleep, ready, trapFocus
};
```

### Eventos personalizados

Los módulos se comunican mediante `CustomEvent`:

| Evento | Emitido por | Payload |
|--------|-------------|---------|
| `cart:update` | `cart.js` | `{ cart, totals, coupon }` |
| `pack:change` | `pack-selector.js` | `{ pack, price, quantity }` |
| `zone:change` | `zones.js` | `{ zone }` |
| `faq:open` | `faq.js` | `{ question, item }` |
| `catalog:filter` | `catalog.js` | `{ filters, visibleCount, totalCount }` |
| `journal:filter` | `revista.js` | `{ filter, visibleCount, totalCount }` |
| `currency:change` | `header.js` | `{ currency, rate }` |
| `newsletter:subscribed` | `newsletter.js` | `{ email }` |

### Persistencia

| Storage | Clave | Contenido |
|---------|-------|-----------|
| `localStorage` | `lenesens_cart` | Items del carrito |
| `localStorage` | `lenesens_favorites` | IDs de favoritos |
| `localStorage` | `lenesens_currency` | Moneda seleccionada (COP/USD) |
| `localStorage` | `lenesens_newsletter_emails` | Emails suscritos |
| `sessionStorage` | `lenesens_countdown_end` | Timer de la oferta |
| `sessionStorage` | `lenesens_checkout_end` | Timer del checkout |
| `sessionStorage` | `lenesens_last_order` | Último pedido confirmado |

---

## 📦 Assets Requeridos

El proyecto espera tener los siguientes assets en `assets/`:

### Iconos (SVG Sprite)
- ✅ `assets/icons/sprite.svg` — Todos los iconos en un solo archivo

### Imágenes de producto
- `assets/img/products/hero-frasco.png` — Frasco principal
- `assets/img/products/card-hydralight.png`, `card-duo.png`, `card-kit.png`, `card-trio.png`, `card-regalo.png`
- `assets/img/products/ingredients-showcase.png`
- `assets/img/products/step-aplica.png`, `step-masajea.png`, `step-seca.png`

### Imágenes de zonas
- `assets/img/zones/axilas.jpg`, `codos.jpg`, `rodillas.jpg`, `manos.jpg`, `intimas.jpg`

### Imágenes de blog
- `assets/img/blog/cover-hyperpigmentation.png`
- `assets/img/blog/article-glicolico.png`, `article-rasurado.png`, `article-escualano.png`, `article-mitos.png`, `article-rutina.png`

### Imágenes lifestyle
- `assets/img/lifestyle/testimonial-1.jpg`, `testimonial-2.jpg`, `testimonial-3.jpg`

### Marca
- `assets/img/brand/og-image.jpg`, `og-producto.jpg`, `og-catalogo.jpg`, `og-revista.jpg`
- `assets/img/brand/author-camila.jpg`
- `assets/img/brand/logo.png`

### Favicons
- Todos los 12 archivos en `assets/favicon/`

> ⚠️ **Nota:** Si algún asset falta, las imágenes se mostrarán rotas pero el sitio seguirá funcionando. Consulta la sección [Roadmap](#-roadmap) para assets pendientes.

---

## ⚡ Optimización y Performance

### Estrategias aplicadas

1. **Critical CSS inline** — El primer render no espera al CSS externo
2. **CSS no crítico async** — Carga con `media="print"` + `onload` para no bloquear
3. **Fonts optimizadas** — Preload + `font-display: swap`
4. **Imágenes con `loading="lazy"`** — Solo cargan cuando entran al viewport
5. **Imágenes hero con `fetchpriority="high"`** — Carga prioritaria
6. **Scripts con `defer`** — No bloquean el parseo del HTML
7. **IntersectionObserver** — Pausa animaciones fuera del viewport
8. **Throttle + debounce** — En scroll y búsqueda
9. **Prefetch de páginas** — Al hover sobre links internos
10. **Web Vitals monitoreados** — En consola durante desarrollo

### Minificación (opcional)

Para generar una versión minificada lista para producción:

**En Mac/Linux:**
```bash
./scripts/build.sh
```

**En Windows (PowerShell):**
```powershell
.\scripts\build.ps1
```

Esto genera una carpeta `dist/` con:
- CSS minificado con `csso`
- JS minificado con `terser`
- HTML copiado
- Assets copiados

**Requisitos:** Node.js 16+ instalado.

### Métricas objetivo

| Métrica | Objetivo |
|---------|----------|
| **LCP** | < 2500ms |
| **CLS** | < 0.1 |
| **FID** | < 100ms |
| **TTFB** | < 800ms |
| **Lighthouse Performance** | ≥ 90 |
| **Lighthouse Accessibility** | ≥ 95 |

---

## ♿ Accesibilidad

El sitio cumple con **WCAG 2.1 nivel AA**. Incluye:

- **Skip links** al inicio de cada página
- **Focus visible** reforzado (outline 3px magenta)
- **Contraste de texto** ≥ 4.5:1 en todo el contenido
- **ARIA labels** en todos los botones de solo-icono
- **`aria-live`** para notificaciones y mensajes dinámicos
- **Focus trap** en modales, drawers y menú móvil
- **`prefers-reduced-motion`** respetado (desactiva animaciones)
- **Atajos de teclado** funcionales (Tab, Escape, `/`)
- **Área táctil mínima** de 44×44px en móvil
- **`<details>` nativo** para FAQs (accesible por defecto)
- **`role="tabpanel"`** y `aria-selected` en tabs

### Test de accesibilidad

```bash
# En Chrome DevTools (F12) → Lighthouse → Accessibility
# Objetivo: 95+ / 100
```

---

## 🔍 SEO

### Schema.org implementado

- **Home:** `Organization` + `WebSite` + `Product`
- **Producto:** `Product` + `FAQPage` + `BreadcrumbList`
- **Catálogo:** `CollectionPage` + `ItemList` + `BreadcrumbList`
- **Revista:** `Blog` + `BlogPosting` + `BreadcrumbList`

### Meta tags

- **Open Graph** (Facebook, WhatsApp, LinkedIn) con imágenes 1200×630
- **Twitter Cards** con imagen grande
- **Canonical URLs** en cada página
- **Sitemap.xml** con imágenes
- **robots.txt** con reglas específicas

### Validación

- [Rich Results Test](https://search.google.com/test/rich-results)
- [Schema Markup Validator](https://validator.schema.org)
- [Meta Tags](https://metatags.io)
- [PageSpeed Insights](https://pagespeed.web.dev)

---

## 🌐 Navegadores Soportados

| Navegador | Versión mínima |
|-----------|---------------|
| Chrome | 90+ |
| Firefox | 88+ |
| Safari | 14+ |
| Edge | 90+ |
| Opera | 76+ |
| Samsung Internet | 14+ |

**No soportados:** Internet Explorer (cualquier versión).

### Tecnologías modernas usadas

- `:has()` CSS selector
- `aspect-ratio`
- `backdrop-filter`
- `IntersectionObserver`
- `ResizeObserver`
- `CustomEvent`
- `structuredClone` (fallback manual)
- `Intl.NumberFormat` (formato COP)

---

## 📦 Build y Deploy

### Deploy en Vercel (recomendado)

1. Sube el código a GitHub
2. En [vercel.com](https://vercel.com) importa el repositorio
3. Configuración:
   - **Framework:** Other
   - **Build Command:** (dejar vacío o `./scripts/build.sh`)
   - **Output Directory:** (vacío o `dist`)
4. Deploy automático

### Deploy en Netlify

1. Sube el código a GitHub
2. En [netlify.com](https://netlify.com) conecta el repositorio
3. Configuración:
   - **Build Command:** (vacío o `./scripts/build.sh`)
   - **Publish directory:** `.` (o `dist` si usas build)
4. Deploy

### Deploy en GitHub Pages

1. Sube el código a GitHub
2. Ve a **Settings → Pages**
3. Source: **Deploy from a branch**
4. Branch: `main` / `root`
5. Tu sitio estará en `https://tu-usuario.github.io/lenesens/`

### Hosting tradicional (cPanel, FTP)

1. Ejecuta el build: `./scripts/build.sh`
2. Sube el contenido de `dist/` a `public_html/`
3. Configura HTTPS con Let's Encrypt

---

## 🗺 Roadmap

### Completado ✅
- [x] Landing page
- [x] Ficha de producto + visor 3D
- [x] Catálogo con filtros
- [x] Revista / Blog
- [x] Checkout con 5 métodos
- [x] Confirmación post-compra
- [x] Carrito persistente
- [x] Design system completo
- [x] Iconos SVG sprite
- [x] Accesibilidad WCAG AA
- [x] SEO + Schema.org
- [x] Performance optimizada

### Pendiente 🔄
- [ ] PWA (manifest + service worker)
- [ ] Buscador global (modal en header)
- [ ] Página de favoritos
- [ ] Página de cuenta de usuario
- [ ] Blog detallado (página por artículo)
- [ ] Comparador de productos
- [ ] Chat WhatsApp flotante

### Futuro 🚀
- [ ] Integración con Wompi/MercadoPago (pagos reales)
- [ ] Backend con Firebase/Supabase
- [ ] Envío de emails transaccionales
- [ ] Panel de administración
- [ ] Analytics (GA4)
- [ ] WhatsApp Business API
- [ ] Integración Coordinadora (tracking)

---

## 📄 Licencia

**Copyright © 2025 Lenesens Cosméticos Colombia S.A.S.**

Todos los derechos reservados. Este proyecto es **software propietario** de uso exclusivo de Lenesens. No se permite su reproducción, distribución ni modificación sin autorización expresa por escrito.

**Contacto:** hola@lenesens.com.co

---

## 👥 Créditos

**Desarrollado con 💗 en Colombia.**

- **Diseño & Desarrollo:** Equipo Lenesens
- **Fotografía de producto:** Estudio Lenesens
- **Dirección editorial:** Dra. Camila Restrepo
- **Contenido clínico:** Comité Científico Lenesens

---

## 📞 Soporte

- **WhatsApp:** [+57 300 912 8400](https://wa.me/573009128400)
- **Email:** hola@lenesens.com.co
- **Instagram:** [@lenesens](https://instagram.com/lenesens)
- **Sitio web:** [lenesens.com.co](https://lenesens.com.co)

---

<p align="center">
  <strong>Lenesens Hydralight</strong><br>
  <em>Lujo clínico y sensorialidad suprema</em><br>
  <sub>Bogotá · Medellín · Cali · Barranquilla · Toda Colombia</sub>
</p>