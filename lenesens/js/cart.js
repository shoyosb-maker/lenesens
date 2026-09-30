/* ============================================================
   CART — Sistema de carrito con localStorage
   Lenesens Hydralight
   Añade productos, persiste en localStorage, emite eventos,
   sincroniza el badge del header y controla el drawer lateral.
   ============================================================ */

'use strict';

(function initCart() {

  /* =========================================================
     CONSTANTES
     ========================================================= */
  const STORAGE_KEY = 'lenesens_cart';
  const COUPONS = {
    'LUMINOUS15': { type: 'percent', value: 15, label: '-15% Dúo Exclusivo' },
    'COLOMBIA10': { type: 'percent', value: 10, label: '-10% Bienvenida' },
    'HYDRA10':    { type: 'percent', value: 10, label: '-10% Hidratación' },
    'ENVIOGRATIS': { type: 'shipping', value: 0, label: 'Envío gratis' }
  };
  const FREE_SHIPPING_THRESHOLD = 150000;

  /* =========================================================
     ESTADO INTERNO
     ========================================================= */
  let cart = loadCart();
  let appliedCoupon = null;

  /* =========================================================
     HELPERS DE STORAGE
     ========================================================= */

  function loadCart() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      console.warn('[cart] Error cargando carrito:', e);
      return [];
    }
  }

  function saveCart() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
    } catch (e) {
      console.warn('[cart] Error guardando carrito:', e);
    }
  }

  /* =========================================================
     CÁLCULOS
     ========================================================= */

  function calcSubtotal() {
    return cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }

  function calcDiscount(subtotal) {
    if (!appliedCoupon) return 0;
    if (appliedCoupon.type === 'percent') {
      return Math.round(subtotal * (appliedCoupon.value / 100));
    }
    return 0;
  }

  function calcShipping(subtotal) {
    if (subtotal === 0) return 0;
    if (subtotal >= FREE_SHIPPING_THRESHOLD) return 0;
    if (appliedCoupon?.type === 'shipping') return 0;
    return 15000;
  }

  function calcTotals() {
    const subtotal = calcSubtotal();
    const discount = calcDiscount(subtotal);
    const subtotalAfterDiscount = subtotal - discount;
    const shipping = calcShipping(subtotalAfterDiscount);
    const total = subtotalAfterDiscount + shipping;

    return {
      subtotal,
      discount,
      subtotalAfterDiscount,
      shipping,
      total,
      itemCount: cart.reduce((sum, item) => sum + item.quantity, 0),
      freeShipping: subtotalAfterDiscount >= FREE_SHIPPING_THRESHOLD,
      missingForFreeShipping: Math.max(0, FREE_SHIPPING_THRESHOLD - subtotalAfterDiscount)
    };
  }

  /* =========================================================
     OPERACIONES DEL CARRITO
     ========================================================= */

  /**
   * Añade un producto al carrito.
   * Si ya existe (mismo id + variante), suma la cantidad.
   */
  function addItem(item) {
    if (!item || !item.id || !item.price) {
      console.warn('[cart] Item inválido:', item);
      return;
    }

    const existing = cart.find(
      (i) => i.id === item.id && i.variant === item.variant
    );

    if (existing) {
      existing.quantity += item.quantity || 1;
    } else {
      cart.push({
        id: item.id,
        name: item.name,
        price: item.price,
        originalPrice: item.originalPrice || null,
        quantity: item.quantity || 1,
        variant: item.variant || 'single',
        image: item.image || null,
        badge: item.badge || null
      });
    }

    saveCart();
    emitUpdate();

    // Feedback visual
    showToast(`${item.name} añadido a tu bolsa`);

    return true;
  }

  /**
   * Elimina un item por índice.
   */
  function removeItem(index) {
    if (index < 0 || index >= cart.length) return;
    const removed = cart.splice(index, 1)[0];
    saveCart();
    emitUpdate();
    showToast(`${removed.name} eliminado`);
  }

  /**
   * Cambia la cantidad de un item.
   */
  function updateQuantity(index, delta) {
    const item = cart[index];
    if (!item) return;

    const newQty = Math.max(1, Math.min(10, item.quantity + delta));
    if (newQty === item.quantity) return;

    item.quantity = newQty;
    saveCart();
    emitUpdate();
  }

  /**
   * Vacía el carrito.
   */
  function clearCart() {
    cart = [];
    appliedCoupon = null;
    saveCart();
    emitUpdate();
  }

  /**
   * Aplica un cupón.
   */
  function applyCoupon(code) {
    const normalized = (code || '').trim().toUpperCase();
    const coupon = COUPONS[normalized];

    if (!coupon) {
      showToast('Cupón no válido o expirado');
      return false;
    }

    appliedCoupon = { ...coupon, code: normalized };
    emitUpdate();
    showToast(`¡Cupón aplicado! ${coupon.label}`);
    return true;
  }

  /**
   * Quita el cupón.
   */
  function removeCoupon() {
    appliedCoupon = null;
    emitUpdate();
  }

  /* =========================================================
     EVENTOS
     ========================================================= */

  function emitUpdate() {
    const totals = calcTotals();
    document.dispatchEvent(new CustomEvent('cart:update', {
      detail: { cart, ...totals, coupon: appliedCoupon }
    }));
  }

  /* =========================================================
     DRAWER LATERAL DEL CARRITO
     ========================================================= */

  const drawer = {
    el: null,
    isOpen: false,

    init() {
      this.el = document.getElementById('cart-drawer');
      if (!this.el) return;

      // Botones que abren el drawer
      document.querySelectorAll('[data-action="open-cart"]').forEach((btn) => {
        btn.addEventListener('click', (e) => {
          e.preventDefault();
          this.open();
        });
      });

      // Botón cerrar
      const closeBtn = this.el.querySelector('[data-action="close-cart"]');
      if (closeBtn) closeBtn.addEventListener('click', () => this.close());

      // Click en el overlay cierra
      this.el.addEventListener('click', (e) => {
        if (e.target === this.el) this.close();
      });

      // ESC cierra
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && this.isOpen) this.close();
      });

      // Render inicial + re-render en cada update
      this.render();
      document.addEventListener('cart:update', () => this.render());
    },

    open() {
      if (!this.el) return;
      this.el.hidden = false;
      requestAnimationFrame(() => {
        this.el.classList.add('is-open');
        document.body.classList.add('has-cart-open');
      });
      this.isOpen = true;
    },

    close() {
      if (!this.el) return;
      this.el.classList.remove('is-open');
      document.body.classList.remove('has-cart-open');
      this.isOpen = false;
      setTimeout(() => {
        if (!this.isOpen) this.el.hidden = true;
      }, 400);
    },

    render() {
      if (!this.el) return;

      const itemsContainer = this.el.querySelector('[data-cart-items]');
      const emptyState = this.el.querySelector('[data-cart-empty]');
      const footer = this.el.querySelector('[data-cart-footer]');
      const totals = calcTotals();

      // --- Estado vacío ---
      if (cart.length === 0) {
        if (itemsContainer) itemsContainer.innerHTML = '';
        if (emptyState) emptyState.hidden = false;
        if (footer) footer.hidden = true;
        return;
      }

      if (emptyState) emptyState.hidden = true;
      if (footer) footer.hidden = false;

      // --- Render items ---
      if (itemsContainer) {
        itemsContainer.innerHTML = cart.map((item, index) => `
          <li class="cart-item" data-cart-index="${index}">
            <div class="cart-item-image">
              ${item.image
                ? `<img src="${item.image}" alt="${item.name}" width="64" height="64">`
                : `<span class="cart-item-placeholder">${item.name.charAt(0)}</span>`}
            </div>
            <div class="cart-item-body">
              <div class="cart-item-header">
                <h4 class="cart-item-name">${item.name}</h4>
                ${item.badge ? `<span class="cart-item-badge">${item.badge}</span>` : ''}
              </div>
              <div class="cart-item-price">
                <span class="cart-item-price-current">${window.LNS.formatPrice(item.price)}</span>
                ${item.originalPrice ? `<span class="cart-item-price-old">${window.LNS.formatPrice(item.originalPrice)}</span>` : ''}
              </div>
              <div class="cart-item-controls">
                <div class="qty-stepper qty-stepper-sm">
                  <button type="button" class="qty-btn" data-cart-action="decrease" data-cart-index="${index}" aria-label="Reducir">−</button>
                  <span class="qty-value">${item.quantity}</span>
                  <button type="button" class="qty-btn" data-cart-action="increase" data-cart-index="${index}" aria-label="Aumentar">+</button>
                </div>
                <button type="button" class="cart-item-remove" data-cart-action="remove" data-cart-index="${index}" aria-label="Eliminar">
                  <img src="assets/icons/nav/close.png" alt="" width="14" height="14">
                </button>
              </div>
            </div>
          </li>
        `).join('');
      }

      // --- Barra de progreso hacia envío gratis ---
      const shippingBar = this.el.querySelector('[data-shipping-progress]');
      if (shippingBar) {
        const { subtotalAfterDiscount, freeShipping, missingForFreeShipping } = totals;
        const percent = Math.min(100, Math.round((subtotalAfterDiscount / FREE_SHIPPING_THRESHOLD) * 100));

        const fill = shippingBar.querySelector('[data-shipping-fill]');
        const label = shippingBar.querySelector('[data-shipping-label]');
        const note = shippingBar.querySelector('[data-shipping-note]');

        if (fill) fill.style.width = percent + '%';
        if (label) {
          label.textContent = freeShipping
            ? '¡Envío Gratis!'
            : `Faltan ${window.LNS.formatPrice(missingForFreeShipping)}`;
          label.classList.toggle('is-success', freeShipping);
        }
        if (note) {
          note.textContent = freeShipping
            ? 'Calificas para despacho prioritario a toda Colombia.'
            : 'Suma más productos para alcanzar envío gratis.';
        }
      }

      // --- Totales ---
      const subtotalEl = this.el.querySelector('[data-cart-subtotal]');
      const discountEl = this.el.querySelector('[data-cart-discount]');
      const shippingEl = this.el.querySelector('[data-cart-shipping]');
      const totalEl    = this.el.querySelector('[data-cart-total]');

      if (subtotalEl) subtotalEl.textContent = window.LNS.formatPrice(totals.subtotal);
      if (discountEl) {
        discountEl.textContent = totals.discount > 0
          ? '−' + window.LNS.formatPrice(totals.discount)
          : '—';
        discountEl.parentElement?.classList.toggle('has-discount', totals.discount > 0);
      }
      if (shippingEl) {
        shippingEl.textContent = totals.shipping === 0 ? 'GRATIS' : window.LNS.formatPrice(totals.shipping);
        shippingEl.classList.toggle('is-free', totals.shipping === 0);
      }
      if (totalEl) totalEl.textContent = window.LNS.formatPrice(totals.total) + ' COP';

      // --- Cupón ---
      const couponBlock = this.el.querySelector('[data-coupon-block]');
      const couponTag = this.el.querySelector('[data-coupon-tag]');
      if (couponBlock && couponTag) {
        if (appliedCoupon) {
          couponTag.innerHTML = `
            <span class="cart-coupon-code">${appliedCoupon.code}</span>
            <span class="cart-coupon-label">${appliedCoupon.label}</span>
            <button type="button" class="cart-coupon-remove" data-cart-action="remove-coupon" aria-label="Quitar cupón">
              <img src="assets/icons/nav/close.png" alt="" width="12" height="12">
            </button>
          `;
          couponTag.hidden = false;
          couponBlock.classList.add('has-coupon');
        } else {
          couponTag.hidden = true;
          couponBlock.classList.remove('has-coupon');
        }
      }
    }
  };

  /* =========================================================
     DELEGACIÓN DE EVENTOS EN EL DRAWER
     ========================================================= */

  document.addEventListener('click', (e) => {
    const action = e.target.closest('[data-cart-action]');
    if (!action) return;

    const act = action.dataset.cartAction;
    const index = parseInt(action.dataset.cartIndex, 10);

    if (act === 'increase') updateQuantity(index, +1);
    else if (act === 'decrease') updateQuantity(index, -1);
    else if (act === 'remove') removeItem(index);
    else if (act === 'remove-coupon') removeCoupon();
  });

  /* =========================================================
     FORM DE CUPÓN
     ========================================================= */

  document.addEventListener('submit', (e) => {
    const form = e.target.closest('[data-coupon-form]');
    if (!form) return;

    e.preventDefault();
    const input = form.querySelector('input[name="coupon"]');
    if (!input) return;

    const code = input.value.trim();
    if (code) {
      applyCoupon(code);
      input.value = '';
    }
  });

  /* =========================================================
     ADD TO CART desde botones con data-add-to-cart
     Lee el estado de producto (pack-selector.js) si existe,
     si no, añade el producto base.
     ========================================================= */

  document.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-add-to-cart]');
    if (!btn) return;

    e.preventDefault();

    const state = window.LNS?.productState;

    if (state) {
      // Viene de la ficha de producto
      const packNames = {
        single: 'Hydralight 360° Suero (90 mL)',
        duo:    'Pack Dúo Transformación (2× 90 mL)',
        trio:   'Tratamiento Familiar (3× 90 mL)'
      };
      const packBadges = {
        single: null,
        duo:    'Más Elegido',
        trio:   'Pack Familiar'
      };

      addItem({
        id: 'hydralight-360',
        name: packNames[state.pack] || packNames.single,
        price: state.price,
        originalPrice: state.original,
        quantity: state.quantity || 1,
        variant: state.pack,
        image: 'assets/img/products/hero-frasco.png',
        badge: packBadges[state.pack] || null
      });

      // Abrimos el drawer para dar feedback
      setTimeout(() => drawer.open(), 300);

    } else {
      // Botón genérico sin estado (por si viene del catálogo)
      const card = btn.closest('[data-product-card]');
      if (!card) return;

      const id = card.dataset.productId;
      const name = card.dataset.productName;
      const price = parseInt(card.dataset.productPrice, 10);
      const image = card.dataset.productImage || null;

      if (!id || !price) return;

      addItem({
        id,
        name: name || 'Producto',
        price,
        quantity: 1,
        variant: 'single',
        image
      });

      setTimeout(() => drawer.open(), 300);
    }
  });

  /* =========================================================
     QUICK CHECKOUT
     ========================================================= */

  document.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-quick-checkout]');
    if (!btn) return;

    e.preventDefault();

    const state = window.LNS?.productState;
    if (!state) {
      showToast('Selecciona un producto primero');
      return;
    }

    // Añadimos al carrito y navegamos a checkout
    const packNames = {
      single: 'Hydralight 360° Suero (90 mL)',
      duo:    'Pack Dúo Transformación (2× 90 mL)',
      trio:   'Tratamiento Familiar (3× 90 mL)'
    };

    addItem({
      id: 'hydralight-360',
      name: packNames[state.pack] || packNames.single,
      price: state.price,
      originalPrice: state.original,
      quantity: state.quantity || 1,
      variant: state.pack,
      image: 'assets/img/products/hero-frasco.png'
    });

    // Navegamos a checkout después de un pequeño delay
    setTimeout(() => {
      window.location.href = 'checkout.html';
    }, 400);
  });

  /* =========================================================
     EXPORTAR API
     ========================================================= */
  window.LNS = window.LNS || {};
  window.LNS.cart = {
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    applyCoupon,
    removeCoupon,
    getItems: () => [...cart],
    getTotals: calcTotals,
    open: () => drawer.open(),
    close: () => drawer.close()
  };

  /* =========================================================
     TOAST helper (por si toast.js no está cargado aún)
     ========================================================= */
  function showToast(message) {
    if (window.LNS?.toast?.show) {
      window.LNS.toast.show(message);
    } else {
      // Fallback: no hacemos nada (silencioso)
      // console.log('[toast]', message);
    }
  }

  /* =========================================================
     INIT
     ========================================================= */
  const init = () => {
    drawer.init();
    emitUpdate();
  };

  window.LNS?.ready(init) ?? document.addEventListener('DOMContentLoaded', init);

})();