/* ============================================================
   PACK SELECTOR — Selección de packs en la ficha de producto
   Lenesens Hydralight
   Detecta cambios en los radios de packs y actualiza precio,
   precio original, badge de descuento, cuota y sticky bar.
   ============================================================ */

'use strict';

(function initPackSelector() {

  const init = () => {

    /* ----------------------------------------------------
       1. REFERENCIAS AL DOM
       ---------------------------------------------------- */
    const packRadios = document.querySelectorAll('input[name="product-pack"]');
    if (!packRadios.length) return;

    const priceEl       = document.getElementById('current-price');
    const originalEl    = document.getElementById('original-price');
    const badgeEl       = document.getElementById('discount-badge');
    const installmentEl = document.getElementById('installment-calc');
    const stickyEl      = document.getElementById('sticky-price-display');

    /* ----------------------------------------------------
       2. ESTADO ACTUAL DEL PACK
       Guardado para que otros scripts (cart.js) lo lean.
       ---------------------------------------------------- */
    const state = {
      pack: 'single',
      price: 129900,
      original: 165000,
      quantity: 1
    };

    // Exponemos el estado globalmente para que cart.js lo use
    window.LNS = window.LNS || {};
    window.LNS.productState = state;

    /* ----------------------------------------------------
       3. ACTUALIZAR UI DEL PACK
       ---------------------------------------------------- */
    const updatePack = (radio) => {
      const price      = parseInt(radio.dataset.packPrice, 10);
      const original   = parseInt(radio.dataset.packOriginal, 10);
      const badge      = radio.dataset.packBadge;
      const installment = radio.dataset.packInstallment;

      // Guardar en estado
      state.pack = radio.value;
      state.price = price;
      state.original = original;

      // Actualizar precio actual
      if (priceEl) {
        priceEl.textContent = window.LNS.formatPrice(price);
      }

      // Actualizar precio original
      if (originalEl) {
        originalEl.textContent = window.LNS.formatPrice(original);
      }

      // Actualizar badge
      if (badgeEl && badge) {
        badgeEl.textContent = badge;
      }

      // Actualizar cuota
      if (installmentEl && installment) {
        installmentEl.textContent = installment;
      }

      // Actualizar sticky bar
      if (stickyEl) {
        stickyEl.textContent = window.LNS.formatPrice(price) + ' COP';
      }

      // Emitir evento global
      document.dispatchEvent(new CustomEvent('pack:change', {
        detail: { ...state, radio: radio.value }
      }));
    };

    /* ----------------------------------------------------
       4. CONECTAR RADIOS
       ---------------------------------------------------- */
    packRadios.forEach((radio) => {
      radio.addEventListener('change', () => {
        if (radio.checked) updatePack(radio);
      });
    });

    /* ----------------------------------------------------
       5. ESTADO INICIAL
       Al cargar, aplicamos el pack que esté seleccionado.
       ---------------------------------------------------- */
    const checked = document.querySelector('input[name="product-pack"]:checked');
    if (checked) updatePack(checked);

    /* ----------------------------------------------------
       6. QTY STEPPER (integración con packs)
       El stepper de cantidad actualiza state.quantity y
       recalcula el precio total a añadir al carrito.
       ---------------------------------------------------- */
    const qtyStepper = document.querySelector('[data-qty-stepper]');
    if (qtyStepper) {
      const qtyValueEl = qtyStepper.querySelector('[data-qty-value]');
      const btns = qtyStepper.querySelectorAll('[data-qty-action]');

      btns.forEach((btn) => {
        btn.addEventListener('click', () => {
          const action = btn.dataset.qtyAction;
          let current = parseInt(qtyValueEl.textContent, 10) || 1;

          if (action === 'increase') {
            current = Math.min(current + 1, 10); // máximo 10 unidades
          } else if (action === 'decrease') {
            current = Math.max(current - 1, 1); // mínimo 1
          }

          qtyValueEl.textContent = current;
          state.quantity = current;

          // Emitir evento de cambio de cantidad
          document.dispatchEvent(new CustomEvent('product:qty-change', {
            detail: { quantity: current }
          }));
        });
      });

      // Inicializar state.quantity con el valor visible
      state.quantity = parseInt(qtyValueEl.textContent, 10) || 1;
    }

  };

  window.LNS?.ready(init) ?? document.addEventListener('DOMContentLoaded', init);

})();