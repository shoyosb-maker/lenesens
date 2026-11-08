/* ============================================================
   CHECKOUT — Lógica de la página de pago
   Lenesens Hydralight
   Incluye:
   - Lectura del carrito desde localStorage
   - Render de items y totales
   - Métodos de pago con CTA dinámico
   - Formato automático de inputs de tarjeta
   - Timer de urgencia persistente
   - Validación con Luhn check
   - **Formulario de dirección editable**
   - Confirmación y guardado del pedido
   ============================================================ */

'use strict';

(function initCheckout() {

  /* =========================================================
     MÓDULO DE DIRECCIÓN EDITABLE
     ========================================================= */

  const CUSTOMER_KEY = 'lenesens_customer';

  /* El checkout arranca sin datos: el cliente escribe los suyos */
  const EMPTY_CUSTOMER = {
    name: '',
    phone: '',
    email: '',
    address: '',
    city: '',
    notes: ''
  };

  /* Obtiene el cliente actual desde localStorage */
  const getCustomer = () => {
    const saved = window.LNS?.storage?.get(CUSTOMER_KEY, null);
    return { ...EMPTY_CUSTOMER, ...(saved || {}) };
  };

  /* ¿Ya hay datos completos de entrega? */
  const hasCustomerData = (customer) => Boolean(
    String(customer?.name || '').trim() &&
    String(customer?.phone || '').trim() &&
    String(customer?.address || '').trim() &&
    String(customer?.city || '').trim()
  );

  /* Guarda el cliente en localStorage */
  const saveCustomer = (customer) => {
    window.LNS?.storage?.set(CUSTOMER_KEY, customer);
  };

  /* Formatea el teléfono para mostrar */
  const formatPhone = (phone) => {
    const clean = String(phone).replace(/\D/g, '');
    if (clean.length === 10) {
      return `+57 ${clean.substring(0, 3)} ${clean.substring(3, 6)} ${clean.substring(6)}`;
    }
    return phone;
  };

  /* Módulo del formulario de dirección */
  const initAddressForm = () => {
    const wrapper   = document.querySelector('[data-checkout-address]');
    const formEl    = document.querySelector('[data-address-form]');
    const editBtn   = document.querySelector('[data-action="edit-address"]');
    const cancelBtn = document.querySelector('[data-action="cancel-address"]');

    if (!wrapper || !formEl || !editBtn) return;

    /* Elementos de la vista */
    const viewName  = wrapper.querySelector('[data-address-name]');
    const viewLine  = wrapper.querySelector('[data-address-line]');
    const viewPhone = wrapper.querySelector('[data-address-phone]');
    const viewCity  = wrapper.querySelector('[data-address-city]');

    /* Campos del formulario */
    const inputName    = formEl.querySelector('#addr-name');
    const inputPhone   = formEl.querySelector('#addr-phone');
    const inputEmail   = formEl.querySelector('#addr-email');
    const inputAddress = formEl.querySelector('#addr-address');
    const inputCity    = formEl.querySelector('#addr-city');
    const inputNotes   = formEl.querySelector('#addr-notes');

    /* Actualiza la vista */
    const renderView = (customer) => {
      if (viewName)  viewName.textContent  = customer.name;
      if (viewLine)  viewLine.textContent  = customer.address;
      if (viewPhone) viewPhone.textContent = formatPhone(customer.phone);
      if (viewCity)  viewCity.textContent  = customer.city;
    };

    /* Carga los valores en el formulario */
    const fillForm = (customer) => {
      if (inputName)    inputName.value    = customer.name;
      if (inputPhone)   inputPhone.value   = customer.phone;
      if (inputEmail)   inputEmail.value   = customer.email || '';
      if (inputAddress) inputAddress.value = customer.address;
      if (inputCity)    inputCity.value    = customer.city;
      if (inputNotes)   inputNotes.value   = customer.notes || '';
    };

    /* El botón "Cancelar" solo tiene sentido si hay datos guardados */
    const syncCancelButton = (customer) => {
      if (cancelBtn) cancelBtn.hidden = !hasCustomerData(customer);
    };

    /* Entrar en modo edición */
    const enterEditMode = ({ focus = true } = {}) => {
      const customer = getCustomer();
      fillForm(customer);
      syncCancelButton(customer);

      wrapper.setAttribute('data-editing', 'true');
      formEl.hidden = false;

      if (focus) setTimeout(() => inputName?.focus(), 100);
    };

    /* Salir del modo edición */
    const exitEditMode = () => {
      if (!hasCustomerData(getCustomer())) return;

      wrapper.setAttribute('data-editing', 'false');
      formEl.hidden = true;
    };

    /* Submit del formulario */
    const handleSubmit = (e) => {
      e.preventDefault();

      const name    = inputName?.value.trim()    || '';
      const phone   = inputPhone?.value.trim()   || '';
      const email   = inputEmail?.value.trim()   || '';
      const address = inputAddress?.value.trim() || '';
      const city    = inputCity?.value.trim()    || '';
      const notes   = inputNotes?.value.trim()   || '';

      const errors = [];
      if (!name)    errors.push('nombre');
      if (!phone)   errors.push('teléfono');
      if (!address) errors.push('dirección');
      if (!city)    errors.push('ciudad');

      if (errors.length) {
        if (window.LNS?.toast) {
          window.LNS.toast.error(`Completa: ${errors.join(', ')}`);
        }
        return;
      }

      if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
        if (window.LNS?.toast) {
          window.LNS.toast.error('Revisa el correo electrónico');
        }
        inputEmail?.focus();
        return;
      }

      const phoneDigits = phone.replace(/\D/g, '');
      if (phoneDigits.length < 10) {
        if (window.LNS?.toast) {
          window.LNS.toast.error('El teléfono debe tener al menos 10 dígitos');
        }
        inputPhone?.focus();
        return;
      }

      const customer = { name, phone, email, address, city, notes };
      saveCustomer(customer);
      renderView(customer);
      syncCancelButton(customer);
      exitEditMode();

      if (window.LNS?.toast) {
        window.LNS.toast.success('Información de entrega actualizada');
      }
      if (window.LNS?.a11y?.announce) {
        window.LNS.a11y.announce('Información de entrega actualizada');
      }
    };

    /* Listeners */
    editBtn.addEventListener('click', enterEditMode);
    if (cancelBtn) cancelBtn.addEventListener('click', exitEditMode);
    formEl.addEventListener('submit', handleSubmit);

    formEl.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        exitEditMode();
      }
    });

    /* Estado inicial: sin datos guardados, el formulario se muestra vacío */
    const startState = () => {
      const customer = getCustomer();
      renderView(customer);

      if (hasCustomerData(customer)) {
        exitEditMode();
      } else {
        enterEditMode({ focus: false });
      }
    };

    startState();

    /* Exponer globalmente */
    window.LNS = window.LNS || {};
    window.LNS.getCustomer = getCustomer;
    window.LNS.hasCustomerData = hasCustomerData;
    window.LNS.openAddressForm = () => {
      enterEditMode();
      wrapper.scrollIntoView({ behavior: 'smooth', block: 'center' });
    };
  };

  /* =========================================================
     INIT PRINCIPAL
     ========================================================= */
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

    if (!items.length) {
      console.warn('[checkout] Carrito vacío, redirigiendo al catálogo');
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

      renderItems(cart.getItems());

      if (countEl) {
        const totalItems = totals.itemCount;
        countEl.textContent = `${totalItems} ${totalItems === 1 ? 'Artículo' : 'Artículos'}`;
      }

      if (subtotalEl) subtotalEl.textContent = window.LNS.formatPrice(totals.subtotal);

      if (discountRow && discountEl) {
        if (totals.discount > 0) {
          discountRow.hidden = false;
          discountEl.textContent = '−' + window.LNS.formatPrice(totals.discount);
        } else {
          discountRow.hidden = true;
        }
      }

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

      if (shippingEl) {
        shippingEl.textContent = totals.shipping === 0
          ? 'GRATIS'
          : window.LNS.formatPrice(totals.shipping);
      }

      if (totalEl) {
        totalEl.textContent = window.LNS.formatPrice(totals.total) + ' COP';
      }

      const payable = document.querySelector('[data-cod-amount]');
      if (payable) payable.textContent = window.LNS.formatPrice(totals.total) + ' COP';

      const paypalAmount = document.querySelector('[data-paypal-amount]');
      if (paypalAmount) {
        paypalAmount.textContent = 'US$ ' + window.LNS.payments.usdFromCop(totals.total).toFixed(2);
      }

      updateCtaLabel();
    };

    /* ----------------------------------------------------
       5. SELECTOR DE MÉTODOS DE PAGO
       Las tarjetas las dibuja js/checkout-payments.js
       ---------------------------------------------------- */
    const paymentLabels = {
      online: 'IR A PAGAR EN LÍNEA',
      paypal: 'CONTINUAR CON PAYPAL',
      cod:    'CONFIRMAR PEDIDO (CONTRAENTREGA)'
    };

    const getSelectedPayment = () =>
      window.LNS?.payments?.getSelected?.()
      || document.querySelector('input[name="payment_method"]:checked')?.value
      || null;

    const updateCtaLabel = () => {
      if (!confirmBtnLabel) return;
      const method = getSelectedPayment();
      confirmBtnLabel.textContent = paymentLabels[method] || paymentLabels.cod;
    };

    document.addEventListener('payment:change', updateCtaLabel);
    document.addEventListener('payment:methods', () => {
      updateCtaLabel();
      updateTotals();
    });

    // Mantiene el resumen sincronizado si el carrito o el cupón cambian
    // en otra pestaña (cart.js emite cart:update también en ese caso).
    document.addEventListener('cart:update', updateTotals);

    /* ----------------------------------------------------
       6. (Los inputs de tarjeta, PSE y Nequi ya no existen:
           el pago se completa en la página segura de Wompi)
       ---------------------------------------------------- */

    /* ----------------------------------------------------
       7. TIMER DE URGENCIA (15 minutos)
       ---------------------------------------------------- */
    const startTimer = () => {
      if (!timerEl) return;

      const DURATION = 15 * 60;
      const STORAGE_KEY = 'lenesens_checkout_end';

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
       8. VALIDACIÓN DEL MÉTODO DE PAGO
       El pago se completa en la pasarela: aquí solo se
       comprueba que exista una pasarela activa y con llaves.
       ---------------------------------------------------- */
    const validatePayment = () => {
      const method = getSelectedPayment();

      if (!method) {
        window.LNS?.toast?.error('Selecciona un método de pago para continuar.');
        return false;
      }

      return Boolean(window.LNS?.payments?.validate(method));
    };

    const showFieldError = (field, message) => {
      if (!field) {
        window.LNS?.toast?.error(message);
        return;
      }

      field.classList.add('has-error');
      field.focus();

      if (window.LNS?.toast) {
        window.LNS.toast.error(message);
      }

      const clearError = () => {
        field.classList.remove('has-error');
        field.removeEventListener('input', clearError);
      };
      field.addEventListener('input', clearError);

      setTimeout(() => {
        field.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100);
    };

    /* ----------------------------------------------------
       9. CONFIRMAR PEDIDO
       ---------------------------------------------------- */
    const handleConfirmOrder = async () => {
      const customer = getCustomer();

      if (!hasCustomerData(customer)) {
        window.LNS?.toast?.error('Completa tu dirección de entrega para continuar.');
        window.LNS?.openAddressForm?.();
        return;
      }

      if (!validatePayment()) return;

      const method = getSelectedPayment();

      if (confirmBtn) {
        confirmBtn.disabled = true;
        confirmBtn.classList.add('is-loading');
      }

      const totals = cart.getTotals();

      const orderData = {
        orderId: generateOrderId(),
        items: cart.getItems(),
        totals,
        paymentMethod: method,
        gateway: window.LNS?.payments?.snapshot(method) || null,
        customer: {
          name: customer.name,
          email: customer.email || '',
          address: `${customer.address}, ${customer.city}`,
          city: customer.city,
          phone: customer.phone,
          notes: customer.notes || ''
        },
        timestamp: Date.now()
      };

      /* Cada opción resuelve su link: Wompi para pago en línea, PayPal o pedido local */
      const gateway = window.LNS?.payments?.gatewayFor(method);
      const needsRedirect = Boolean(gateway) && gateway.provider !== 'contraentrega';

      if (needsRedirect) {
        const link = await window.LNS.payments.createCheckoutLink({
          method,
          reference: orderData.orderId,
          amountInCents: Math.round(totals.total * 100),
          email: orderData.customer.email,
          redirectUrl: window.LNS.payments.redirectUrlFor()
        });

        if (link.ok) {
          orderData.paymentLink = {
            environment: link.environment,
            createdAt: Date.now(),
            signedBy: link.source
          };
          orderData.paymentStatus = 'PENDING';

          try {
            sessionStorage.setItem('lenesens_last_order', JSON.stringify(orderData));
          } catch (e) {
            console.warn('[checkout] No se pudo guardar el pedido', e);
          }

          window.LNS?.orders?.add(orderData);
          window.LNS?.toast?.info(
            gateway.provider === 'paypal'
              ? 'Redirigiendo a PayPal…'
              : 'Redirigiendo a la pasarela de pagos de Wompi…'
          );

          /* El carrito se conserva hasta que la pasarela confirme el pago */
          setTimeout(() => {
            window.location.href = link.url;
          }, 600);
          return;
        }

        if (confirmBtn) {
          confirmBtn.disabled = false;
          confirmBtn.classList.remove('is-loading');
        }

        const linkErrors = {
          no_gateway: 'No hay una pasarela activa para esa forma de pago.',
          missing_public_key: 'Falta la llave pública de Wompi: agrégala en el panel de pasarelas.',
          missing_integrity_secret: 'No se pudo firmar el pago: inicia el backend (node server/api.js, lee las llaves de server/.env) o guarda el secreto de integridad en el panel.',
          missing_paypal_account: 'Falta el correo de la cuenta PayPal: agrégalo en el panel de pasarelas.',
          unsupported_gateway: 'Esa pasarela todavía no genera links de pago. Usa Wompi o PayPal.',
          invalid_order: 'El monto o la referencia del pedido no son válidos.'
        };

        const backendDown = Boolean(link.backendError)
          && /network_error|timeout|failed|http_/.test(String(link.backendError));

        window.LNS?.toast?.error(
          backendDown
            ? `No se pudo contactar el backend de pagos (${window.LNS.payments.apiBase}). Inicia node server/api.js o revisa ?api= en la URL.`
            : (linkErrors[link.error] || `No se pudo abrir la pasarela de pago (${link.error}).`)
        );
        return;
      }

      /* Contraentrega: pedido local, sin pasarela */
      try {
        sessionStorage.setItem('lenesens_last_order', JSON.stringify(orderData));
      } catch (e) {
        console.warn('[checkout] No se pudo guardar el pedido', e);
      }

      window.LNS?.orders?.add(orderData);

      setTimeout(() => {
        cart.clearCart();
        sessionStorage.removeItem('lenesens_checkout_end');
        window.location.href = 'confirmacion.html';
      }, 1200);
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

    // Sync entre pestañas
    window.addEventListener('storage', (e) => {
      if (e.key === 'lenesens_cart') {
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
    initAddressForm();
    updateTotals();
    startTimer();

  };

  /* --------------------------------------------------------
     ARRANQUE
     -------------------------------------------------------- */
  window.LNS?.ready(init) ?? document.addEventListener('DOMContentLoaded', init);

})();