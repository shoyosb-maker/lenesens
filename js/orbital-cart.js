/* ============================================================
   ORBITAL CART — Botón flotante y bolsa de compra de la landing
   Lenesens Hydralight
   Reutiliza la API de js/cart.js (localStorage: lenesens_cart),
   de modo que checkout.html recibe el mismo pedido.
   ============================================================ */

'use strict';

(function initOrbitalCart() {

  const PRODUCT = {
    id: 'hydralight-360',
    name: 'Hydralight Suero (90 mL)',
    price: 129900,
    originalPrice: 165000,
    variant: 'single',
    image: 'assets/img/products/hydralight-frasco.webp'
  };

  const MIN_QTY = 1;
  const MAX_QTY = 10;

  const init = () => {
    const root = document.getElementById('orbital-cart');
    const cart = window.LNS?.cart;
    if (!root || !cart) return;

    /* ----------------------------------------------------
       Referencias
       ---------------------------------------------------- */
    const qtyValueEl = root.querySelector('[data-oc-qty-value]');
    const qtyBtns = root.querySelectorAll('[data-oc-qty]');
    const addBtn = root.querySelector('[data-oc-add]');
    const feedbackEl = root.querySelector('[data-oc-feedback]');

    const bagEl = root.querySelector('[data-oc-bag]');
    const itemsEl = root.querySelector('[data-oc-items]');
    const emptyEl = root.querySelector('[data-oc-empty]');
    const footerEl = root.querySelector('[data-oc-footer]');

    const subtotalEl = root.querySelector('[data-oc-subtotal]');
    const shippingEl = root.querySelector('[data-oc-shipping]');
    const totalEl = root.querySelector('[data-oc-total]');

    const badges = document.querySelectorAll('[data-cart-count]');

    let qty = 1;
    let lastFocus = null;
    let pendingFocus = null;
    let feedbackTimer = 0;

    /* ----------------------------------------------------
       Helpers
       ---------------------------------------------------- */
    const t = (key, vars) => window.LNS?.i18n?.get?.(key, vars) || key;
    const money = (value) => window.LNS.formatPrice(value);

    const escapeHtml = (value) => String(value).replace(/[&<>"']/g, (char) => (
      { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]
    ));

    const countItems = () => cart.getItems().reduce((sum, item) => sum + item.quantity, 0);

    /* ----------------------------------------------------
       Cantidad
       ---------------------------------------------------- */
    const renderQty = () => {
      if (!qtyValueEl) return;
      qtyValueEl.textContent = String(qty);

      qtyBtns.forEach((btn) => {
        const delta = Number(btn.dataset.ocQty);
        btn.disabled = delta < 0 ? qty <= MIN_QTY : qty >= MAX_QTY;
      });
    };

    qtyBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        const delta = Number(btn.dataset.ocQty);
        qty = Math.min(MAX_QTY, Math.max(MIN_QTY, qty + delta));
        renderQty();
      });
    });

    /* ----------------------------------------------------
       Render de la bolsa
       ---------------------------------------------------- */
    const renderItems = () => {
      const items = cart.getItems();
      const totals = cart.getTotals();

      if (!items.length) {
        itemsEl.innerHTML = '';
        bagEl.hidden = true;
        emptyEl.hidden = false;
        footerEl.hidden = true;
        return;
      }

      bagEl.hidden = false;
      emptyEl.hidden = true;
      footerEl.hidden = false;

      itemsEl.innerHTML = items.map((item, index) => {
        const thumb = item.image
          ? `<img class="orbital-cart-item-thumb" src="${escapeHtml(item.image)}" alt="" width="40" height="52" loading="lazy" decoding="async">`
          : '';

        const canDecrease = item.quantity > MIN_QTY ? '' : ' disabled';
        const canIncrease = item.quantity < MAX_QTY ? '' : ' disabled';

        return `
          <li class="orbital-cart-item">
            ${thumb}
            <div class="orbital-cart-item-body">
              <p class="orbital-cart-item-name">${escapeHtml(item.name)}</p>
              <p class="orbital-cart-item-price">${money(item.price)} · ${item.quantity} ×</p>
            </div>
            <div class="orbital-cart-item-side">
              <div class="orbital-qty orbital-qty--sm">
                <button type="button" class="orbital-qty-btn" data-cart-action="decrease" data-cart-index="${index}"
                        aria-label="${escapeHtml(t('orbital.cart.decrease'))}"${canDecrease}>−</button>
                <span class="orbital-qty-value">${item.quantity}</span>
                <button type="button" class="orbital-qty-btn" data-cart-action="increase" data-cart-index="${index}"
                        aria-label="${escapeHtml(t('orbital.cart.increase'))}"${canIncrease}>+</button>
              </div>
              <button type="button" class="orbital-cart-item-remove" data-cart-action="remove" data-cart-index="${index}"
                      aria-label="${escapeHtml(t('orbital.cart.remove'))}">
                <svg class="orbital-icon" aria-hidden="true"><use href="assets/icons/sprite.svg#icon-close"></use></svg>
              </button>
            </div>
          </li>
        `;
      }).join('');

      subtotalEl.textContent = money(totals.subtotal);
      shippingEl.textContent = totals.shipping === 0 ? t('cart.totals.free') : money(totals.shipping);
      totalEl.textContent = money(totals.total) + ' COP';
    };

    const syncBadges = () => {
      const count = countItems();

      badges.forEach((badge) => {
        badge.textContent = String(count);
        badge.hidden = count === 0;
      });
    };

    const bumpBadge = () => {
      badges.forEach((badge) => {
        badge.classList.remove('is-bump');
        // Fuerza el reinicio de la animación
        void badge.offsetWidth;
        badge.classList.add('is-bump');
      });
    };

    /* ----------------------------------------------------
       Añadir a la bolsa
       ---------------------------------------------------- */
    const showFeedback = (message) => {
      if (!feedbackEl) return;
      feedbackEl.textContent = message;
      window.clearTimeout(feedbackTimer);
      feedbackTimer = window.setTimeout(() => { feedbackEl.textContent = ''; }, 3200);
    };

    addBtn?.addEventListener('click', () => {
      const added = cart.addItem({ ...PRODUCT, quantity: qty });
      if (!added) return;

      const total = countItems();
      showFeedback(t('orbital.cart.added', { count: String(total) }));
      bumpBadge();
      qty = MIN_QTY;
      renderQty();
    });

    /* ----------------------------------------------------
       Abrir / cerrar
       ---------------------------------------------------- */
    let releaseFocus = null;
    let isOpen = false;

    const open = () => {
      if (isOpen) return;
      isOpen = true;
      lastFocus = document.activeElement;

      root.classList.add('is-open');
      document.body.classList.add('has-cart-open');

      releaseFocus?.();
      releaseFocus = window.LNS.trapFocus?.(root) ?? null;
    };

    const close = () => {
      if (!isOpen) return;
      isOpen = false;

      root.classList.remove('is-open');
      document.body.classList.remove('has-cart-open');

      releaseFocus?.();
      releaseFocus = null;

      if (lastFocus && typeof lastFocus.focus === 'function') {
        lastFocus.focus({ preventScroll: true });
      }
    };

    document.addEventListener('click', (event) => {
      if (event.target.closest('[data-cart-open]')) {
        event.preventDefault();
        open();
        return;
      }

      if (event.target.closest('[data-cart-close]')) {
        event.preventDefault();
        close();
      }
    });

    document.addEventListener('keydown', (event) => {
      if (!isOpen || event.key !== 'Escape') return;
      event.preventDefault();
      close();
    });

    /* ----------------------------------------------------
       Sincronización con el carrito
       ---------------------------------------------------- */
    itemsEl.addEventListener('click', (event) => {
      const btn = event.target.closest('[data-cart-action]');
      if (!btn) return;
      pendingFocus = {
        action: btn.dataset.cartAction,
        index: Number(btn.dataset.cartIndex)
      };
    });

    document.addEventListener('cart:update', () => {
      renderItems();
      syncBadges();

      if (pendingFocus) {
        const selector = `[data-cart-action="${pendingFocus.action}"][data-cart-index="${pendingFocus.index}"]`;
        const target = itemsEl.querySelector(selector);
        (target && !target.disabled ? target : addBtn)?.focus({ preventScroll: true });
        pendingFocus = null;
      }
    });

    document.addEventListener('language:change', () => {
      renderQty();
      renderItems();
    });

    /* ----------------------------------------------------
       Estado inicial
       ---------------------------------------------------- */
    renderQty();
    renderItems();
    syncBadges();
  };

  window.LNS?.ready(init) ?? document.addEventListener('DOMContentLoaded', init);

})();
