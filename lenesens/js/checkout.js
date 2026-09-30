/* ============================================================
   CHECKOUT — Lógica de la página de pago
   Lenesens Hydralight
   Lee el carrito, renderiza items, calcula totales, maneja
   métodos de pago, validación de tarjeta, timer de urgencia
   y confirmación de pedido.
   ============================================================ */

'use strict';

(function initCheckout() {

  const init = () => {

    /* ----------------------------------------------------
       1. VERIFICAR QUE HAY ITEMS EN EL CARRITO
       ---------------------------------------------------- */
    const cart = window.LNS?.cart;
    if (!cart) {
      console.warn('[checkout] Cart no disponible');
      return;
    }

    const items = cart.getItems();

    // Si no hay items, redirigir al catálogo
    if (!items.length) {
      console.warn('[checkout] Carrito vacío, redirigiendo al catálogo');
      // Mostramos un toast antes de redirigir
      if (window.LNS?.toast) {
        window.LNS.toast.warning('Tu bolsa está vacía. Redirigiendo al catálogo...');
      }
      setTimeout(() => {
        window.location.href = 'catalogo.html';
      }, 1500);
      return;
    }

    /* ----------------------------------------------------
       2. REFERENCIAS AL DOM
       ---------------------------------------------------- */
    const itemsList       = document.querySelector('[data-summary-items]');
    const subtotalEl      = document.querySelector('[data-summary-subtotal]');
    const discountRow     = document.querySelector('[data-summary-discount-row]');
    const discountEl      = document.querySelector('[data-summary-discount]');
    const shippingEl      = document.querySelector('[data-summary-shipping]');
    const totalEl         = document.querySelector('[data-summary-total]');
    const countEl         = document.querySelector('[data-summary-count]');
    const couponBlock     = document.querySelector('[data-summary-coupon]');
    const couponCode      = document.querySelector('[data-summary-coupon-code]');
    const couponValue     = document.querySelector('[data-summary-coupon-value]');
    const codAmount       = document.getElementById('cod-amount');
    const addiInstallment = document.getElementById('addi-first-installment');
    const confirmBtn      = document.getElementById('confirm-order-btn');
    const confirmBtnLabel = document.querySelector('[data-confirm-btn-label]');
    const timerEl         = document.getElementById('checkout-timer');

    /* ----------------------------------------------------
       3. RENDERIZAR ITEMS DEL RESUMEN
       ---------------------------------------------------- */
    const renderItems = (items) => {
      if (!itemsList) return;

      itemsList.innerHTML = items.map((item) => `
        <li class="checkout-summary-item">
          <div class="checkout-summary-item-image">
            ${item.image
              ? `<img src="${item.image}" alt="${item.name}" width="56" height="64">`
              : `<span class="cart-item-placeholder">${item.name.charAt(0)}</span>`}
            <span class="checkout-summary-item-qty">×${item.quantity}</span>
          </div>
          <div class="checkout-summary-item-body">
            <div>
              <h3 class="checkout-summary-item-name">${item.name}</h3>
              ${item.variant && item.variant !== 'single'
                ? `<span class="checkout-summary-item-variant">Variante: ${item.variant}</span>`
                : ''}
            </div>
            <div class="checkout-summary-item-price">
              <span class="checkout-summary-item-price-current">${window.LNS.formatPrice(item.price * item.quantity)}</span>
              ${item.originalPrice
                ? `<span class="checkout-summary-item-price-old">${window.LNS.formatPrice(item.originalPrice * item.quantity)}</span>`
                : ''}
            </div>
          </div>
        </li>
      `).join('');
    };

    /* ----------------------------------------------------
       4. ACTUALIZAR TOTALES
       ---------------------------------------------------- */
    const updateTotals = () => {
      const totals = cart.getTotals();

      // Items + count
      renderItems(cart.getItems());

      if (countEl) {
        const totalItems = totals.itemCount;
        countEl.textContent = `${totalItems} ${totalItems === 1 ? 'Artículo' : 'Artículos'}`;
      }

      // Subtotal
      if (subtotalEl) subtotalEl.textContent = window.LNS.formatPrice(totals.subtotal);

      // Descuento
      if (discountRow && discountEl) {
        if (totals.discount > 0) {
          discountRow.hidden = false;
          discountEl.textContent = '−' + window.LNS.formatPrice(totals.discount);
        } else {
          discountRow.hidden = true;
        }
      }

      // Cupón
      if (couponBlock && couponCode && couponValue) {
        const coupon = totals.coupon;
        if (coupon) {
          couponBlock.hidden = false;
          couponCode.textContent = coupon.code;
          couponValue.textContent = coupon.label;
        } else {
          couponBlock.hidden = true;
        }
      }

      // Envío
      if (shippingEl) {
        if (totals.shipping === 0) {
          shippingEl.textContent = 'GRATIS';
        } else {
          shippingEl.textContent = window.LNS.formatPrice(totals.shipping);
        }
      }

      // Total
      if (totalEl) {
        totalEl.textContent = window.LNS.formatPrice(totals.total) + ' COP';
      }

      // Monto de contraentrega
      if (codAmount) {
        codAmount.textContent = window.LNS.formatPrice(totals.total) + ' COP';
      }

      // Primera cuota de Addi
      if (addiInstallment) {
        const firstInstallment = Math.round(totals.total / 3);
        addiInstallment.textContent = window.LNS.formatPrice(firstInstallment) + ' COP';
      }

      // Actualizar labels del CTA según método seleccionado
      updateCtaLabel();
    };

    /* ----------------------------------------------------
       5. SELECTOR DE MÉTODOS DE PAGO
       ---------------------------------------------------- */
    const paymentLabels = {
      cod:   'CONFIRMAR PEDIDO (PAGO CONTRAENTREGA)',
      pse:   'IR A PAGAR CON PSE',
      card:  'PAGAR CON TARJETA',
      nequi: 'SOLICITAR PUSH A NEQUI',
      addi:  'CONTINUAR CON ADDI (3 CUOTAS)'
    };

    const getSelectedPayment = () => {
      const checked = document.querySelector('input[name="payment_method"]:checked');
      return checked ? checked.value : 'cod';
    };

    const updateCtaLabel = () => {
      if (!confirmBtnLabel) return;
      const method = getSelectedPayment();
      confirmBtnLabel.textContent = paymentLabels[method] || paymentLabels.cod;
    };

    // Escuchar cambios en los métodos de pago
    document.querySelectorAll('input[name="payment_method"]').forEach((radio) => {
      radio.addEventListener('change', () => {
        updateCtaLabel();

        // Focus en el primer input del panel activo (mejora UX)
        const activeMethod = radio.closest('.payment-method');
        if (!activeMethod) return;

        const firstInput = activeMethod.querySelector('.payment-method-panel input, .payment-method-panel select');
        if (firstInput && window.innerWidth >= 768) {
          setTimeout(() => firstInput.focus(), 250);
        }
      });
    });

    /* ----------------------------------------------------
       6. FORMATO AUTOMÁTICO DE INPUTS DE TARJETA
       ---------------------------------------------------- */

    // Número de tarjeta: 4-4-4-4
    const cardNumber = document.getElementById('card-number');
    if (cardNumber) {
      cardNumber.addEventListener('input', (e) => {
        let value = e.target.value.replace(/\D/g, '').substring(0, 16);
        value = value.replace(/(\d{4})(?=\d)/g, '$1 ');
        e.target.value = value;
      });
    }

    // Vencimiento: MM / AA
    const cardExpiry = document.getElementById('card-expiry');
    if (cardExpiry) {
      cardExpiry.addEventListener('input', (e) => {
        let value = e.target.value.replace(/\D/g, '').substring(0, 4);
        if (value.length >= 3) {
          value = value.substring(0, 2) + ' / ' + value.substring(2);
        }
        e.target.value = value;
      });

      // Al salir del campo, validar mes
      cardExpiry.addEventListener('blur', (e) => {
        const value = e.target.value.replace(/\D/g, '');
        if (value.length === 4) {
          const month = parseInt(value.substring(0, 2), 10);
          if (month < 1 || month > 12) {
            e.target.classList.add('has-error');
          } else {
            e.target.classList.remove('has-error');
          }
        }
      });
    }

    // CVV: solo dígitos
    const cardCvv = document.getElementById('card-cvv');
    if (cardCvv) {
      cardCvv.addEventListener('input', (e) => {
        e.target.value = e.target.value.replace(/\D/g, '').substring(0, 4);
      });
    }

    // Nequi / Daviplata: formato de teléfono
    const nequiPhone = document.getElementById('nequi-phone');
    if (nequiPhone) {
      nequiPhone.addEventListener('input', (e) => {
        let value = e.target.value.replace(/\D/g, '').substring(0, 10);
        // Formato: 312 458 9201
        if (value.length > 6) {
          value = value.replace(/(\d{3})(\d{3})(\d+)/, '$1 $2 $3');
        } else if (value.length > 3) {
          value = value.replace(/(\d{3})(\d+)/, '$1 $2');
        }
        e.target.value = value;
      });
    }

    /* ----------------------------------------------------
       7. TIMER DE URGENCIA (15 minutos)
       ---------------------------------------------------- */
    const startTimer = () => {
      if (!timerEl) return;

      const DURATION = 15 * 60; // 15 minutos
      const STORAGE_KEY = 'lenesens_checkout_end';

      // Persistir el tiempo final
      let endTime = parseInt(sessionStorage.getItem(STORAGE_KEY), 10);
      if (!endTime || endTime < Date.now()) {
        endTime = Date.now() + DURATION * 1000;
        sessionStorage.setItem(STORAGE_KEY, String(endTime));
      }

      const pad = (n) => String(n).padStart(2, '0');

      const tick = () => {
        const remaining = Math.max(0, endTime - Date.now());
        const totalSec = Math.floor(remaining / 1000);

        const minutes = Math.floor(totalSec / 60);
        const seconds = totalSec % 60;

        timerEl.textContent = `${pad(minutes)}:${pad(seconds)}`;

        // Alerta visual cuando quedan menos de 2 minutos
        if (totalSec <= 120) {
          timerEl.style.background = 'rgba(255, 224, 136, 0.6)';
          timerEl.style.color = 'var(--color-tertiary)';
        }

        if (remaining <= 0) {
          clearInterval(intervalId);
          timerEl.textContent = '00:00';
          if (window.LNS?.toast) {
            window.LNS.toast.warning('Tu reserva ha expirado. El stock vuelve a estar disponible.');
          }
        }
      };

      tick();
      const intervalId = setInterval(tick, 1000);
    };

    /* ----------------------------------------------------
       8. VALIDACIÓN DEL FORMULARIO SEGÚN MÉTODO
       ---------------------------------------------------- */
    const validatePayment = () => {
      const method = getSelectedPayment();

      switch (method) {
        case 'cod':
          return true; // Sin validación, siempre válido

        case 'pse': {
          const bank = document.getElementById('pse-bank');
          if (!bank || !bank.value) {
            showFieldError(bank, 'Selecciona tu banco');
            return false;
          }
          return true;
        }

        case 'card': {
          const number = document.getElementById('card-number');
          const expiry = document.getElementById('card-expiry');
          const cvv = document.getElementById('card-cvv');
          const name = document.getElementById('card-name');

          const cleanNumber = number?.value.replace(/\s/g, '') || '';

          if (!cleanNumber || cleanNumber.length < 15) {
            showFieldError(number, 'Número de tarjeta inválido');
            return false;
          }

          // Luhn check básico
          if (!luhnCheck(cleanNumber)) {
            showFieldError(number, 'Número de tarjeta inválido');
            return false;
          }

          if (!expiry?.value || expiry.value.replace(/\D/g, '').length < 4) {
            showFieldError(expiry, 'Fecha de vencimiento inválida');
            return false;
          }

          if (!cvv?.value || cvv.value.length < 3) {
            showFieldError(cvv, 'CVV inválido');
            return false;
          }

          if (!name?.value.trim()) {
            showFieldError(name, 'Ingresa el nombre del titular');
            return false;
          }

          return true;
        }

        case 'nequi': {
          const phone = document.getElementById('nequi-phone');
          const cleanPhone = phone?.value.replace(/\D/g, '') || '';
          if (cleanPhone.length !== 10) {
            showFieldError(phone, 'Ingresa un número de 10 dígitos');
            return false;
          }
          return true;
        }

        case 'addi':
          return true; // Sin validación, se maneja en el portal de Addi

        default:
          return true;
      }
    };

    // Helper: mostrar error en un campo
    const showFieldError = (field, message) => {
      if (!field) return;

      field.classList.add('has-error');
      field.focus();

      // Toast de error
      if (window.LNS?.toast) {
        window.LNS.toast.error(message);
      }

      // Limpiar el error al escribir
      const clearError = () => {
        field.classList.remove('has-error');
        field.removeEventListener('input', clearError);
      };
      field.addEventListener('input', clearError);

      // Scroll hacia el campo
      setTimeout(() => {
        field.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100);
    };

    // Luhn algorithm para validar tarjetas
    const luhnCheck = (num) => {
      let sum = 0;
      let alternate = false;

      for (let i = num.length - 1; i >= 0; i--) {
        let n = parseInt(num.charAt(i), 10);

        if (alternate) {
          n *= 2;
          if (n > 9) n = (n % 10) + 1;
        }

        sum += n;
        alternate = !alternate;
      }

      return sum % 10 === 0;
    };

    /* ----------------------------------------------------
       9. CONFIRMAR PEDIDO
       ---------------------------------------------------- */
    const handleConfirmOrder = () => {
      // Validar
      if (!validatePayment()) return;

      const method = getSelectedPayment();

      // Estado de carga en el botón
      if (confirmBtn) {
        confirmBtn.disabled = true;
        confirmBtn.classList.add('is-loading');
      }

      // Guardar resumen del pedido en sessionStorage
      // (para que confirmacion.html lo pueda leer)
      const totals = cart.getTotals();
      const orderData = {
        orderId: generateOrderId(),
        items: cart.getItems(),
        totals,
        paymentMethod: method,
        customer: {
          name: 'Camila Andrea Gómez',
          address: 'Calle 93B # 14-20, Apto 502, Chicó Norte, Bogotá D.C.',
          phone: '+57 312 458 9201'
        },
        timestamp: Date.now()
      };

      try {
        sessionStorage.setItem('lenesens_last_order', JSON.stringify(orderData));
      } catch (e) {
        console.warn('[checkout] No se pudo guardar el pedido', e);
      }

      // Simular procesamiento
      setTimeout(() => {
        // Vaciar el carrito
        cart.clearCart();

        // Limpiar el timer
        sessionStorage.removeItem('lenesens_checkout_end');

        // Redirigir a confirmación
        window.location.href = 'confirmacion.html';
      }, 1500);
    };

    /* ----------------------------------------------------
       10. GENERAR ID DE ORDEN
       ---------------------------------------------------- */
    const generateOrderId = () => {
      const prefix = 'LNS';
      const timestamp = Date.now().toString(36).toUpperCase().slice(-6);
      const random = Math.random().toString(36).substring(2, 5).toUpperCase();
      return `${prefix}-${timestamp}-${random}`;
    };

    /* ----------------------------------------------------
       11. EVENTOS
       ---------------------------------------------------- */
    if (confirmBtn) {
      confirmBtn.addEventListener('click', (e) => {
        e.preventDefault();
        handleConfirmOrder();
      });
    }

    // Botón editar dirección → muestra toast de demo
    const editAddressBtn = document.querySelector('.checkout-address-edit');
    if (editAddressBtn) {
      editAddressBtn.addEventListener('click', () => {
        if (window.LNS?.toast) {
          window.LNS.toast.info('Edición de dirección disponible próximamente');
        }
      });
    }

    // Detectar cambios en el carrito (si el usuario modifica en otra pestaña)
    window.addEventListener('storage', (e) => {
      if (e.key === 'lenesens_cart') {
        // Re-verificar si aún hay items
        const currentItems = cart.getItems();
        if (!currentItems.length) {
          window.location.href = 'catalogo.html';
        } else {
          updateTotals();
        }
      }
    });

    /* ----------------------------------------------------
       12. INIT
       ---------------------------------------------------- */
    updateTotals();
    startTimer();

    // Log de demo en consola
    // console.log('[checkout] Orden lista para procesar:', cart.getItems());

  };

  window.LNS?.ready(init) ?? document.addEventListener('DOMContentLoaded', init);

})();