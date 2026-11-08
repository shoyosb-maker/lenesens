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

- Landing inmersiva con escenario audiovisual, navegación orbital y carrusel de producto
- Landing editorial anterior conservada en `landing-anterior.html`
- Página 3D con visor interactivo (Babylon.js), frasco individual y compra en un clic
- Ficha técnica independiente: ingredientes, ritual, zonas de uso y estudio clínico
- Catálogo de producto único con vitrina horizontal y compra rápida
- Revista científica con artículos y guías
- Términos y Condiciones con base legal colombiana (Ley 1480 de 2011, Ley 1581 de 2012, Ley 527 de 1999)
- Checkout con 3 formas de pago: pago en línea (tarjeta, PSE, Nequi, Daviplata, Bancolombia, Efecty y cuotas vía Wompi), PayPal y contraentrega
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
- ✅ **Landing orbital** — Video de fondo (escena nocturna y Sakura), navegación lateral de opciones iluminadas al pasar el cursor, carrusel con 3 escenas y compra directa desde un botón flotante
- ✅ **Visor 3D interactivo** — Babylon.js con giro, zoom y vistas de frasco, caja y conjunto
- ✅ **Carrito persistente** — localStorage con sincronización entre pestañas
- ✅ **Toasts accesibles** — `aria-live` para lectores de pantalla
- ✅ **Iconos SVG inline** — Sprite SVG con ~50 iconos tintables
- ✅ **Sistema de cupones** — 4 cupones funcionales
- ✅ **Newsletter funcional** — Validación y guardado local
- ✅ **Pantalla de carga cinematográfica** — Intro de marca con video optimizado en cada carga directa, velo rápido en navegaciones internas, transición de salida entre páginas y espera a que el visor 3D termine de preparar materiales y sombras antes de revelar el contenido

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
- ✅ **Preloader optimizado** — 304 KB desktop / 216 KB móvil, sin audio, `faststart`, póster WebP y sin descargar video en navegaciones internas
- ✅ **Visor 3D optimizado en móvil** — Resolución efectiva 1,5×, sombras 512, menos pétalos y sin MSAA en pantallas táctiles (60 fps en pruebas)
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
| **3D** | Babylon.js | App Hydralight compilada e integrada en `assets/hydralight-3d/` |
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
├── landing-anterior.html         # Contenido del landing anterior (archivo, noindex)
├── producto.html                 # Hydralight en 3D + compra en un clic (producto único)
├── ficha-tecnica.html            # Ficha técnica: ingredientes, uso, zonas y estudio clínico
├── catalogo.html                 # Catálogo (vitrina de producto único)
├── revista.html                  # Revista / Blog editorial
├── terminos-y-condiciones.html   # Términos y Condiciones (ley colombiana)
├── checkout.html                 # Pasarela de pago
├── confirmacion.html             # Confirmación post-compra
├── admin.html                    # Panel de ventas (acceso de super usuario)
├── server/
│   ├── dev-server.js             # Servidor local para ver el sitio (Node 18+, sin dependencias)
│   ├── api.js                    # API: link de pago Wompi + webhooks (Node 18+, sin dependencias)
│   ├── sign-event.js             # Firma un evento de Wompi y lo envía al webhook
│   └── .env.example              # Variables de entorno (llaves) — copiar a .env
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
│   │   ├── floating-cart.css
│   │   ├── orbital-cart.css      # Botón flotante + bolsa del landing
│   │   └── footer.css
│   │
│   └── pages/                    # Estilos específicos por página
│       ├── orbital.css           # Landing inmersiva (video + navegación flotante)
│       ├── landing.css           # Landing anterior (archivo)
│       ├── producto.css
│       ├── catalogo.css
│       ├── revista.css
│       ├── legal.css             # Términos y Condiciones
│       ├── admin.css             # Panel de ventas
│       ├── checkout.css
│       └── confirmacion.css
│
├── js/
│   ├── utils.js                  # Helpers globales (window.LNS)
│   ├── toast.js                  # Notificaciones flotantes
│   ├── cart.js                   # Carrito con localStorage
│   ├── header.js                 # Header + menú móvil + scroll
│   ├── newsletter.js             # Formularios de suscripción
│   ├── orbital.js                # Carrusel, video e idioma/moneda del landing
│   ├── orbital-cart.js           # Botón flotante y bolsa de compra del landing
│   ├── pack-selector.js          # Selector de packs y precios
│   ├── zones.js                  # Tabs de zonas anatómicas
│   ├── faq.js                    # Accordion de FAQ
│   ├── catalog.js                # Filtros del catálogo
│   ├── orders.js                 # Historial de pedidos (localStorage) + datos demo
│   ├── payment-gateways.js       # Configuración de pasarelas de pago (llaves API)
│   ├── admin-payments.js         # UI de la pestaña «Pasarelas de pago»
│   ├── checkout-payments.js      # Conecta el checkout con las pasarelas activas
│   ├── admin.js                  # Login del panel y dashboard de ventas
│   ├── legal.js                  # Impresión y índice de Términos y Condiciones
│   ├── revista.js                # Filtros de la revista
│   ├── checkout.js               # Lógica del checkout
│   ├── confirmacion.js           # Post-compra + factura
│   ├── a11y.js                   # Mejoras de accesibilidad
│   ├── performance.js            # Prefetch + Web Vitals
│   └── main.js                   # Orquestador general
│
├── assets/
│   ├── hydralight-3d/            # Visor 3D interactivo compilado con Babylon.js
│   ├── video/                    # Videos del landing (1080p + 720p, sin audio)
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
- **Node.js 18+** (opcional) — Para el servidor local incluido y la API de pagos

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

3. **Inicia el servidor local**:
   ```bash
   node server/dev-server.js
   ```
   - Se abre en `http://localhost:4173/`
   - Otro puerto: `node server/dev-server.js 8080`
   - Sirve el sitio tal cual, sin caché, con soporte de `Range` para los videos del hero
   - Bloquea `/server` y los archivos ocultos (`.env`, etc.)

   > Alternativa sin Node: extensión [Live Server](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer) de VS Code (`http://127.0.0.1:5500/`).

**No requiere `npm install` ni build tools.** Solo abrir y usar.

---

## 💻 Uso

### Navegación principal

- **Landing** (`index.html`) — Presentación del producto, ingredientes, testimonios, oferta
- **Hydralight 3D** (`producto.html`) — Visor 3D interactivo, frasco individual y compra en un clic
- **Ficha técnica** (`ficha-tecnica.html`) — Ingredientes, modo de uso, zonas de uso clínico, estudio clínico y FAQ
- **Catálogo** (`catalogo.html`) — Vitrina del producto único: imagen, detalles y compra rápida en una sola tarjeta que ocupa el ancho del contenedor
- **Revista** (`revista.html`) — Artículos editoriales y guías dermatológicas
- **Términos y Condiciones** (`terminos-y-condiciones.html`) — Condiciones de venta, envíos, retracto, garantía, reversión del pago y datos personales conforme a la ley colombiana
- **Checkout** (`checkout.html`) — Finalizar compra con 3 formas de pago: **pago en línea** (tarjeta, PSE, Nequi, Daviplata, Bancolombia, Efecty y cuotas vía Wompi), **PayPal** y **contraentrega**. Los datos de entrega empiezan vacíos: el cliente los escribe una vez y quedan guardados en `localStorage` (`lenesens_customer`) para el siguiente pedido.
- **Confirmación** (`confirmacion.html`) — Post-compra con resumen y factura
- **Panel de ventas** (`admin.html`) — Dashboard privado con login de super usuario (ver más abajo)

### Panel de ventas (`admin.html`)

Acceso privado con login de super usuario. Se llega desde el **botón con icono de persona** del
encabezado (presente en la landing orbital y en todas las páginas internas).

| Campo | Valor |
|-------|-------|
| Usuario | `admin` |
| Contraseña | `admin123` |

Qué incluye:

- **KPIs del periodo** — ingresos, pedidos, ticket promedio y unidades, con variación frente al periodo anterior.
- **Filtros** — 7 días / 30 días / 90 días / histórico, búsqueda por pedido, cliente o ciudad y filtro por estado.
- **Gráficas** — ventas por día (barras), métodos de pago y ciudades con más ventas.
- **Tabla de pedidos** — clic en cualquier fila abre el detalle: cliente, dirección, productos, totales,
  cambio de estado y enlace directo a WhatsApp del cliente.
- **Exportar CSV** de los pedidos filtrados e impresión del panel.

#### Pestaña «Pasarelas de pago»

- Lista las pasarelas disponibles: **Wompi, PayPal, pago contraentrega** y, como alternativas,
  PayU Latam, ePayco, Mercado Pago, Bold, Addi, Nequi, Bancolombia y «otra pasarela».
- Cada tarjeta permite configurar: nombre visible en el checkout, modo (pruebas/producción),
  **llave pública**, **llave privada** (oculta con opción de mostrar), **secreto de integridad**,
  **secreto de eventos**, **URL de webhook** (con botón copiar) y qué **forma de pago** habilita.
  PayPal solo pide el **correo de la cuenta del negocio**.
- Interruptor para activar/desactivar: no deja activar una pasarela sin sus datos de conexión.
- Botón **Validar llaves** (formato), **Copiar configuración (JSON)** para pasarla al backend y
  **Restaurar por defecto**.
- Las pasarelas se guardan en `localStorage` bajo `lenesens_gateways` (`js/payment-gateways.js`)
  y la UI vive en `js/admin-payments.js`. El resumen superior indica cuántas están activas y qué
  formas de pago quedan habilitadas.

#### Llaves predeterminadas (Wompi · producción)

Wompi viene **configurada y activa en modo producción**. La llave pública (no es secreta, viaja en
la URL del checkout) está en `WOMPI_DEFAULTS` (`js/payment-gateways.js`); el resto vive solo en
`server/.env`, que nunca se sirve al navegador:

| Dato | Dónde vive |
|------|-----------|
| Llave pública `pub_prod_…VchE` | `js/payment-gateways.js` + `server/.env` |
| Llave privada `prv_prod_…D0Xy` | solo `server/.env` |
| Secreto de integridad `prod_integrity_…a9jB` | solo `server/.env` |
| Secreto de eventos `prod_events_…4nmo` | solo `server/.env` |

- El navegador **no firma en local**: pide la URL firmada a `POST /api/checkout/wompi`, que usa las
  llaves de `server/.env`. Para que el pago en línea funcione hay que levantar el backend:

  ```bash
  node server/api.js          # http://localhost:3000
  # si el puerto 3000 está ocupado (p. ej. el visor 3D de Vite):
  PORT=3210 node server/api.js
  # y abrir: http://localhost:4173/checkout.html?api=http://localhost:3210
  ```

- El backend se puede fijar también con `<meta name="lenesens-api" content="…">` en `checkout.html`.
- Si un administrador pega el secreto de integridad en el panel, la firma se hace en el navegador
  como respaldo (queda solo en ese navegador).
- Si ya guardaste otra configuración, pulsa **Restaurar por defecto** en «Pasarelas de pago».
- ⚠️ **Con llaves de producción cada link generado cobra dinero real.** Para pruebas usa
  `pub_test_…` / `test_integrity_…` en modo «Pruebas».

#### Qué pasa en el checkout

`js/checkout-payments.js` dibuja **solo tres formas de pago** y las conecta con la pasarela activa:

| Forma de pago | Qué agrupa | Pasarela | Requisito |
|---------------|-----------|----------|-----------|
| **Pago en línea** (`online`) | Tarjeta débito/crédito, PSE, Nequi, Daviplata, Botón Bancolombia, Efecty y cuotas | Wompi | Llave pública + privada + secreto de integridad |
| **PayPal** (`paypal`) | Saldo PayPal o tarjeta vinculada (monto convertido COP → USD) | PayPal | Correo de la cuenta del negocio |
| **Contraentrega** (`cod`) | Efectivo al recibir el pedido | — (sin pasarela) | Ninguno, viene activa |

- Cada opción muestra sus medios como etiquetas y la pasarela que la procesa: «Procesado por
  **Wompi** · producción · cuenta `pub_prod••••VchE`».
- Las opciones sin pasarela activa aparecen deshabilitadas con el motivo exacto y enlace al panel.
- Al confirmar se valida la pasarela de la opción elegida; si no está lista, el pedido no se procesa.
- **Pago en línea** pide la URL firmada y redirige a
  `https://checkout.wompi.co/p/?…signature:integrity=…`, donde el cliente elige tarjeta, PSE, Nequi,
  Daviplata, Bancolombia o Efecty y completa el pago. Así el sitio nunca toca datos de tarjeta, banco
  ni celular.
- **PayPal** redirige al checkout de PayPal (`www.paypal.com` en producción,
  `www.sandbox.paypal.com` en pruebas) con el monto convertido a dólares (tasa 4.000 COP = 1 USD).
- El carrito se conserva hasta que la pasarela confirme el pago.
- La página de confirmación lee `?id=` (lo agrega Wompi al volver), consulta el estado real y lo
  muestra; mientras está pendiente vuelve a consultar cada 6 s.
- El pedido guarda la pasarela usada (`gateway`), el enlace generado (`paymentLink`) y el estado
  (`paymentStatus`); el detalle en el panel de ventas los muestra.
- Requisito: la pasarela debe estar **activa** (interruptor) además de tener sus datos.
- La firma de Wompi la hace el backend si está disponible; si no responde (sitio estático), se firma
  en el navegador con el **secreto de integridad** guardado en el panel. Ver «Firma de la URL» más abajo.

#### Prueba de integración con Wompi (sandbox)

`Validar llaves` consulta la API real de la pasarela:

- `GET /v1/merchants/{public_key}` → valida la llave pública y muestra el comercio
  (`Llaves válidas · comercio … · sandbox — llave pública ✓ · llave privada ✓ · comercio 2112124 · COP · 11 métodos habilitados`).
- `GET /v1/transactions?from_date…` con el encabezado de autorización y la llave privada → la valida
  (un 401 devuelve «La llave privada no es válida (401)»).
- Bases usadas: `sandbox.wompi.co/v1` en modo pruebas y `production.wompi.co/v1` en producción.
- El resultado de la última validación se guarda y reaparece al abrir la tarjeta.
- Con el modo en **Producción** la tarjeta muestra el aviso «los cobros serán reales».

#### Cobro con Wompi (firma de la URL)

El checkout pide una **URL de pago firmada** y redirige al cliente. `server/api.js` expone:

| Método | Ruta | Función |
|---|---|---|
| `POST` | `/api/checkout/wompi` | Firma `SHA256(referencia + monto + moneda + secreto de integridad)` y devuelve la URL del Web Checkout |
| `GET` | `/api/checkout/wompi/transactions/:id` | Estado de la transacción para la página de confirmación |
| `POST` | `/api/webhooks/:pasarela` | Recibe y valida las notificaciones |
| `GET` | `/api/health` | Estado y entorno (test/production) |

```bash
cd server
cp .env.example .env      # completa las llaves (nunca lo subas al repo)
node api.js
```

Variables: `WOMPI_PUBLIC_KEY`, `WOMPI_INTEGRITY_SECRET`, `WOMPI_PRIVATE_KEY` (solo para consultar el
estado), `WEBHOOK_EVENTS_SECRET`, `WEBHOOK_KEY_WOMPI`, `WOMPI_REDIRECT_URL`, `PORT`.
Opcional: `WOMPI_API_BASE` (base de la API; por defecto se deduce de la llave pública).

Flujo: confirmar pedido → `POST /api/checkout/wompi` → redirección a
`https://checkout.wompi.co/p/?...&signature:integrity=…` → el cliente paga en Wompi → Wompi llama al
webhook y devuelve al cliente a `confirmacion.html?id=…`, que consulta el estado real.

**Si el backend no responde** (por ejemplo el sitio está publicado como estático), el checkout firma
la URL en el navegador con la llave pública y el **secreto de integridad** guardados en el panel de
pasarelas; el SHA-256 se calcula con `crypto.subtle` o con la implementación local si el navegador no
lo expone (contextos no seguros). Por eso el panel tiene el campo «Secreto de integridad».

> El secreto de integridad en el navegador queda visible para quien inspeccione la página: en
> producción conviene tener el backend desplegado y dejar ese campo vacío.

> En desarrollo (`localhost`) se omite `redirect-url` porque Wompi responde **403** a dominios locales;
> el cobro se completa igual en su página.

Verificación del webhook con el secreto de eventos:

```bash
cd server
node sign-event.js <secret> <token>     # firma un evento de prueba y lo envía
```

El endpoint valida el `checksum` de Wompi (`SHA256(valores de signature.properties + timestamp + secreto)`)
y responde `200`; con el checksum alterado responde `401`.
#### URL de notificaciones (webhook)

Cada pasarela genera su propia URL con un token secreto:

```
https://lenesens.com.co/api/webhooks/wompi?key=2eb406f00170c743c24de80a
```

- El campo es **editable**: si el banco te da otra URL (o usas otro hosting) la pegas y guardas.
- **Copiar**: la pasa al portapapeles para registrarla en el panel del banco.
- **Copiar cURL de prueba**: comando listo para pegar en una terminal y simular el evento.
- **Regenerar token**: crea un `key` nuevo (invalida el anterior).
- **Usar URL sugerida**: vuelve a la URL automática si habías puesto una personalizada.

Valida el `?key=`, verifica la firma (`checksum` de Wompi o HMAC para otros proveedores) cuando defines
`WEBHOOK_EVENTS_SECRET`, guarda cada evento en `server/data/webhooks.ndjson` y responde `{"ok":true}`.
Ahí se conecta la actualización del pedido (marcar pagado, cambiar estado, enviar correo).

Datos:

- Los pedidos se guardan en `localStorage` bajo la clave `lenesens_orders` (`js/orders.js`); el checkout
  agrega cada compra automáticamente al confirmarla.
- La primera vez el panel carga **46 pedidos de demostración** (marcados como `demo`) para visualizar las
  métricas; se pueden eliminar desde el aviso superior.
- La sesión se guarda en `sessionStorage` (`lenesens_admin_session`) y se cierra con el botón «Cerrar sesión».

> ⚠️ **Aviso de seguridad:** al ser un sitio estático sin backend, la validación de credenciales ocurre en el
> navegador. Sirve como acceso de demostración, no como seguridad real: cualquiera con acceso al código puede
> leer la lógica. Para producción hay que mover la autenticación y el historial de pedidos a un servidor.

### Flujo de compra completo

```
1. Landing → Menú Hydralight: "3D" (ficha interactiva) o "Ficha técnica" (documentación)
2. Hydralight 3D → Ver el visor + elegir cantidad → "Añadir a mi Ritual" o "Comprar con 1 Clic"
3. Carrito (drawer) → "Proceder al Pago Seguro"
4. Checkout → Elegir método de pago → "Confirmar Pedido"
5. Confirmación → Ver resumen + descargar factura
6. Panel de ventas (admin.html) → el pedido queda disponible en el historial
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

### Visor 3D (Babylon.js)

El visor vive en `assets/hydralight-3d/` y se genera desde el proyecto `hydralight`:

```bash
cd hydralight
npm run build:site -- --outDir "../trabajos web/lenesens/assets/hydralight-3d" --emptyOutDir
```

`build:site` usa Vite en modo `site`, que **no copia `public/`** (la escena del Babylon.js Editor no se usa en runtime: el producto se genera por código). Esto evita publicar ~4 MB innecesarios.

Notas de rendimiento:

- El iframe usa `data-src`: se carga después del evento `load` y en tiempo ocioso para no competir con el LCP.
- `js/performance.js` avisa al visor cuando entra o sale de pantalla y este detiene/reanuda el render (ahorro de GPU y batería).
- El render se limita a 2× de densidad de píxeles en pantallas de alta densidad.

Las imágenes de la ficha de producto se sirven en WebP optimizado; los originales se conservan para otras páginas.

### Landing orbital (index.html)

El nuevo inicio es un escenario de pantalla completa con video de fondo, navegación flotante
y una barra inferior con carrusel. La versión anterior vive en `landing-anterior.html`.

- **Medios** (`assets/video/`, sin audio y con `faststart`):
  - `hero-night.mp4` — escena nocturna (1080p, ~2,4 MB; 720p ~0,9 MB para móvil).
  - `hero-body.mp4` — ritual corporal (1080p, ~2,1 MB; 720p ~0,9 MB).
  - `hero-sakura.mp4` — escena Sakura de día (1080p, ~2,4 MB; 720p ~1,1 MB).
  - Posters en `assets/img/brand/hero-*-poster.webp`.
- **Navegación lateral**: dos columnas de opciones tipográficas (Catálogo/Revista y
  Contacto/Novedades) centradas a los costados. Cada opción tiene un filo luminoso que se
  extiende y un halo rosado al pasar el cursor o al recibir foco por teclado; el video recibe
  un atenuado lateral para garantizar contraste. En móvil se reparten en dos columnas sobre la barra inferior.
- **Barra inferior**: nombre del producto, carrusel 01–03 y, al final, el acceso directo «3D»
  (abre el visor de `producto.html#visor-3d`) junto al enlace a la ficha técnica (`ficha-tecnica.html`).
- **Carrusel de 3 vistas**: escena nocturna, ritual corporal y escena Sakura, todas en video.
  En móvil, al final del video del ritual aparece el símbolo de marca (`assets/img/brand/marca-agua.webp`)
  centrado, a todo el ancho de la pantalla y desvanecido, antes de reiniciar el bucle, para reforzar
  la pertenencia a Hydralight.
- **Bolsa flotante** (`css/components/orbital-cart.css` + `js/orbital-cart.js`):
  - Botón flotante «Comprar» en la esquina inferior derecha (en móvil pasa a la barra superior) con contador de unidades.
  - Abre un panel lateral oscuro (hoja inferior en móvil) con la ficha del producto, selector de cantidad 1–10, lista de la bolsa con steppers, totales y acceso a `checkout.html`.
  - Usa la misma API de `js/cart.js` y la clave `lenesens_cart`, así que el checkout recibe el pedido sin conversiones.
  - Accesible: `role="dialog"`, foco atrapado con `LNS.trapFocus`, `Esc` para cerrar, `aria-live` en el feedback y foco devuelto al botón.
- **Comportamiento** (`js/orbital.js`):
  - Los videos se inician por JS (muted) para poder respetar `prefers-reduced-motion`.
  - Cada video se activa solo en su vista: los demás se pausan y los que no se han visto se cargan al llegar a ellos.
  - Flechas `←`/`→` del teclado cambian de vista; los botones tienen `aria-label`.
  - El contador se anuncia con `aria-live` en el idioma activo.
  - Idioma y moneda comparten las preferencias del resto del sitio (`lenesens_lang`, `lenesens_currency`).

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

> La ficha de producto sirve versiones WebP optimizadas (`step-*.webp`, `zones/*.webp`,
> `ingredients/*.webp`, `hero-frasco.webp`). Los originales se mantienen como fuente.

### Imágenes de zonas
- `assets/img/zones/axilas.jpg`, `codos.jpg`, `rodillas.jpg`, `manos.jpg`, `intimas.jpg`
- Versiones servidas en la ficha: `assets/img/zones/*.webp` (320 × 320)

### Imágenes de blog
- `assets/img/blog/cover-hyperpigmentation.png`
- `assets/img/blog/article-glicolico.png`, `article-rasurado.png`, `article-escualano.png`, `article-mitos.png`, `article-rutina.png`

### Imágenes lifestyle
- `assets/img/lifestyle/testimonial-1.jpg`, `testimonial-2.jpg`, `testimonial-3.jpg`

### Marca
- `assets/img/brand/og-image.jpg`, `og-producto.jpg`, `og-catalogo.jpg`, `og-revista.jpg`
- `assets/img/brand/author-camila.jpg`
- `assets/img/brand/logo.png`
- `assets/img/brand/marca-agua.webp` (512 × 512, símbolo de marca para el cierre del video 2 en móvil)

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
- **Términos y Condiciones:** `WebPage` + `BreadcrumbList`

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
- [x] Checkout con 3 formas de pago (pago en línea, PayPal y contraentrega)
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
