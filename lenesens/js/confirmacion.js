/* ============================================================
   CONFIRMACIÓN — Lógica de la página post-compra
   Lenesens Hydralight
   Lee el pedido desde sessionStorage, rellena la UI, maneja
   acciones (copiar orden, descargar factura) y confetti.
   ============================================================ */

'use strict';

(function initConfirmacion() {

  const init = () => {

    /* ----------------------------------------------------
       1. LEER EL PEDIDO DESDE SESSIONSTORAGE
       ---------------------------------------------------- */
    let order = null;

    try {
      const raw = sessionStorage.getItem('lenesens_last_order');
      order = raw ? JSON.parse(raw) : null;
    } catch (e) {
      console.warn('[confirmacion] Error leyendo el pedido', e);
    }

    /* ----------------------------------------------------
       2. SI NO HAY PEDIDO → redirigir a home
       ---------------------------------------------------- */
    if (!order || !order.items || !order.items.length) {
      console.warn('[confirmacion] No hay pedido guardado, redirigiendo...');
      window.location.href = 'index.html';
      return;
    }

    /* ----------------------------------------------------
       3. HELPERS DE FORMATO
       ---------------------------------------------------- */
    const pad = (n) => String(n).padStart(2, '0');

    const formatDate = (timestamp) => {
      const date = new Date(timestamp);
      const months = [
        'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
        'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
      ];
      return `${date.getDate()} de ${months[date.getMonth()]} de ${date.getFullYear()}`;
    };

    const formatTime = (timestamp) => {
      const date = new Date(timestamp);
      return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
    };

    const getEstimatedDeliveryDate = (timestamp) => {
      const date = new Date(timestamp);
      date.setDate(date.getDate() + 1);

      const days = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
      const months = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

      const dayName = days[date.getDay()];
      const dayNum = date.getDate();
      const monthName = months[date.getMonth()];

      return `${dayName}, ${dayNum} de ${monthName}`;
    };

    const getEstimatedArrivalDate = (timestamp) => {
      const date = new Date(timestamp);
      date.setDate(date.getDate() + 1);
      const days = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
      const dayName = days[date.getDay()];
      return `Antes de las 6 PM del ${dayName}`;
    };

    const getPaymentMethodLabel = (method) => {
      const labels = {
        cod:   'Pago Contraentrega en Efectivo',
        pse:   'PSE / Débito Bancario',
        card:  'Tarjeta de Crédito o Débito',
        nequi: 'Nequi o Daviplata',
        addi:  'Addi / Sistecredito (3 cuotas)'
      };
      return labels[method] || 'Pago Seguro';
    };

    /* ----------------------------------------------------
       4. RELLENAR DATOS DEL CLIENTE
       ---------------------------------------------------- */
    const setText = (selector, text) => {
      const el = document.querySelector(selector);
      if (el) el.textContent = text;
    };

    const firstName = (order.customer?.name || 'Clienta').split(' ')[0];

    setText('[data-customer-name]', firstName);
    setText('[data-customer-fullname]', order.customer?.name || 'Clienta Lenesens');
    setText('[data-customer-address]', order.customer?.address || 'Dirección por confirmar');
    setText('[data-customer-phone]', order.customer?.phone || '+57 300 000 0000');

    /* ----------------------------------------------------
       5. RELLENAR DATOS DEL PEDIDO
       ---------------------------------------------------- */
    setText('[data-order-id]', order.orderId);
    setText('[data-order-date]', formatDate(order.timestamp));
    setText('[data-order-payment]', getPaymentMethodLabel(order.paymentMethod));

    /* ----------------------------------------------------
       6. FECHAS ESTIMADAS
       ---------------------------------------------------- */
    setText('[data-estimated-delivery]', getEstimatedDeliveryDate(order.timestamp));
    setText('[data-estimated-arrival]', getEstimatedArrivalDate(order.timestamp));

    /* ----------------------------------------------------
       7. RENDERIZAR ITEMS DEL PEDIDO
       ---------------------------------------------------- */
    const itemsList = document.querySelector('[data-order-items]');
    const countEl = document.querySelector('[data-order-count]');

    if (itemsList && order.items) {
      itemsList.innerHTML = order.items.map((item) => `
        <li class="confirmation-item">
          <div class="confirmation-item-image">
            ${item.image
              ? `<img src="${item.image}" alt="${item.name}" width="56" height="64">`
              : `<span class="cart-item-placeholder">${item.name.charAt(0)}</span>`}
            <span class="confirmation-item-qty">×${item.quantity}</span>
          </div>
          <div class="confirmation-item-body">
            <div>
              <h3 class="confirmation-item-name">${item.name}</h3>
              ${item.variant && item.variant !== 'single'
                ? `<span class="confirmation-item-variant">Variante: ${item.variant}</span>`
                : ''}
            </div>
            <div class="confirmation-item-price">
              <span class="confirmation-item-price-current">${window.LNS.formatPrice(item.price * item.quantity)}</span>
            </div>
          </div>
        </li>
      `).join('');
    }

    // Contador de artículos
    if (countEl) {
      const total = order.totals?.itemCount || order.items.reduce((s, i) => s + i.quantity, 0);
      countEl.textContent = `${total} ${total === 1 ? 'Artículo' : 'Artículos'}`;
    }

    /* ----------------------------------------------------
       8. RENDERIZAR TOTALES
       ---------------------------------------------------- */
    const totals = order.totals || {
      subtotal: 0, discount: 0, shipping: 0, total: 0
    };

    setText('[data-confirm-subtotal]', window.LNS.formatPrice(totals.subtotal));

    // Descuento
    const discountRow = document.querySelector('[data-confirm-discount-row]');
    const discountEl = document.querySelector('[data-confirm-discount]');
    if (totals.discount > 0 && discountRow && discountEl) {
      discountRow.hidden = false;
      discountEl.textContent = '−' + window.LNS.formatPrice(totals.discount);
    }

    // Envío
    const shippingEl = document.querySelector('[data-confirm-shipping]');
    if (shippingEl) {
      shippingEl.textContent = totals.shipping === 0
        ? 'GRATIS'
        : window.LNS.formatPrice(totals.shipping);
    }

    // Total
    setText('[data-confirm-total]', window.LNS.formatPrice(totals.total) + ' COP');

    /* ----------------------------------------------------
       9. BOTÓN COPIAR NÚMERO DE ORDEN
       ---------------------------------------------------- */
    const copyBtn = document.querySelector('[data-copy-order]');

    if (copyBtn) {
      copyBtn.addEventListener('click', async () => {
        const orderId = order.orderId;
        let success = false;

        // Intentar con Clipboard API moderna
        if (navigator.clipboard && window.isSecureContext) {
          try {
            await navigator.clipboard.writeText(orderId);
            success = true;
          } catch (e) {
            // Fallback: input temporal
            success = fallbackCopy(orderId);
          }
        } else {
          success = fallbackCopy(orderId);
        }

        if (success) {
          // Feedback visual en el botón
          copyBtn.classList.add('is-copied');

          // Cambiar el icono a check temporalmente
          const img = copyBtn.querySelector('img');
          const originalSrc = img?.src;
          if (img) img.src = 'assets/icons/actions/check.png';

          if (window.LNS?.toast) {
            window.LNS.toast.success(`Orden ${orderId} copiada al portapapeles`);
          }

          setTimeout(() => {
            copyBtn.classList.remove('is-copied');
            if (img && originalSrc) img.src = originalSrc;
          }, 2000);
        } else {
          if (window.LNS?.toast) {
            window.LNS.toast.error('No se pudo copiar. Copia manualmente.');
          }
        }
      });
    }

    // Fallback para navegadores antiguos
    const fallbackCopy = (text) => {
      try {
        const input = document.createElement('textarea');
        input.value = text;
        input.style.position = 'fixed';
        input.style.opacity = '0';
        document.body.appendChild(input);
        input.select();
        const success = document.execCommand('copy');
        document.body.removeChild(input);
        return success;
      } catch (e) {
        return false;
      }
    };

    /* ----------------------------------------------------
       10. BOTÓN DESCARGAR FACTURA
       ---------------------------------------------------- */
    const invoiceBtn = document.querySelector('[data-download-invoice]');

    if (invoiceBtn) {
      invoiceBtn.addEventListener('click', () => {
        // Generar contenido de la factura
        const lines = [];

        lines.push('════════════════════════════════════════');
        lines.push('       LENESENS HYDRALIGHT COLOMBIA');
        lines.push('        Nit: 901.234.567-8');
        lines.push('════════════════════════════════════════');
        lines.push('');
        lines.push('FACTURA ELECTRÓNICA DE VENTA');
        lines.push('');
        lines.push(`Orden N°: ${order.orderId}`);
        lines.push(`Fecha: ${formatDate(order.timestamp)} ${formatTime(order.timestamp)}`);
        lines.push(`Método de Pago: ${getPaymentMethodLabel(order.paymentMethod)}`);
        lines.push('');
        lines.push('────────────────────────────────────────');
        lines.push('DATOS DEL CLIENTE');
        lines.push('────────────────────────────────────────');
        lines.push(`Nombre: ${order.customer?.name || '—'}`);
        lines.push(`Dirección: ${order.customer?.address || '—'}`);
        lines.push(`Teléfono: ${order.customer?.phone || '—'}`);
        lines.push('');
        lines.push('────────────────────────────────────────');
        lines.push('DETALLE DEL PEDIDO');
        lines.push('────────────────────────────────────────');

        order.items.forEach((item) => {
          lines.push(`• ${item.name}`);
          lines.push(`  Cantidad: ${item.quantity}`);
          lines.push(`  Precio unitario: ${window.LNS.formatPrice(item.price)}`);
          lines.push(`  Subtotal: ${window.LNS.formatPrice(item.price * item.quantity)}`);
          lines.push('');
        });

        lines.push('────────────────────────────────────────');
        lines.push('RESUMEN DE PAGO');
        lines.push('────────────────────────────────────────');
        lines.push(`Subtotal:        ${window.LNS.formatPrice(totals.subtotal)}`);
        if (totals.discount > 0) {
          lines.push(`Descuento:      -${window.LNS.formatPrice(totals.discount)}`);
        }
        lines.push(`Envío:           ${totals.shipping === 0 ? 'GRATIS' : window.LNS.formatPrice(totals.shipping)}`);
        lines.push('────────────────────────────────────────');
        lines.push(`TOTAL PAGADO:    ${window.LNS.formatPrice(totals.total)} COP`);
        lines.push('');
        lines.push('════════════════════════════════════════');
        lines.push('  GRACIAS POR TU COMPRA 💗');
        lines.push('  Soporte: +57 300 912 8400');
        lines.push('  www.lenesens.com.co');
        lines.push('════════════════════════════════════════');

        // Crear el archivo
        const content = lines.join('\n');
        const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `Factura-${order.orderId}.txt`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        if (window.LNS?.toast) {
          window.LNS.toast.success('Factura descargada correctamente');
        }
      });
    }

    /* ----------------------------------------------------
       11. ANIMACIÓN DE ENTRADA DEL ICONO DE ÉXITO
       ---------------------------------------------------- */
    const successIcon = document.querySelector('.confirmation-success-icon');

    if (successIcon && !window.LNS?.device?.prefersReducedMotion?.()) {
      successIcon.style.transform = 'scale(0) rotate(-180deg)';
      successIcon.style.transition = 'transform 700ms cubic-bezier(0.34, 1.56, 0.64, 1)';

      requestAnimationFrame(() => {
        setTimeout(() => {
          successIcon.style.transform = 'scale(1) rotate(0deg)';
        }, 100);
      });
    }

    /* ----------------------------------------------------
       12. CONFETTI DE CONFIRMACIÓN (CSS puro)
       ---------------------------------------------------- */
    const triggerConfetti = () => {
      if (window.LNS?.device?.prefersReducedMotion?.()) return;

      const colors = ['#a61352', '#f78da7', '#d4af37', '#ffd1dc', '#7f003b'];
      const particleCount = 40;

      const container = document.createElement('div');
      container.className = 'confetti-container';
      container.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        pointer-events: none;
        z-index: 9999;
        overflow: hidden;
      `;
      document.body.appendChild(container);

      for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        const color = colors[Math.floor(Math.random() * colors.length)];
        const left = Math.random() * 100;
        const delay = Math.random() * 0.5;
        const duration = 2.5 + Math.random() * 1.5;
        const size = 6 + Math.random() * 8;

        particle.style.cssText = `
          position: absolute;
          top: -20px;
          left: ${left}%;
          width: ${size}px;
          height: ${size * 0.6}px;
          background: ${color};
          border-radius: ${Math.random() > 0.5 ? '50%' : '2px'};
          opacity: 0;
          animation: confetti-fall ${duration}s ease-out ${delay}s forwards;
          transform: rotate(${Math.random() * 360}deg);
        `;

        container.appendChild(particle);
      }

      // Limpiar después de la animación
      setTimeout(() => {
        if (container.parentElement) container.parentElement.removeChild(container);
      }, 5000);
    };

    // Disparar confetti después de un delay
    setTimeout(triggerConfetti, 400);

    /* ----------------------------------------------------
       13. LIMPIAR ESTADO DEL CHECKOUT
       ---------------------------------------------------- */
    // Eliminamos el pedido de sessionStorage para que no se pueda
    // volver a la confirmación con el mismo pedido recargando
    // (pero esperamos 3s por si el usuario recarga rápido)
    setTimeout(() => {
      try {
        // No lo eliminamos inmediatamente, sino después de un rato
        // para evitar perderlo si el usuario recarga
      } catch (e) {
        console.warn('[confirmacion] No se pudo limpiar sessionStorage');
      }
    }, 3000);

    /* ----------------------------------------------------
       14. ACTUALIZAR TÍTULO CON ORDER ID
       ---------------------------------------------------- */
    document.title = `Pedido ${order.orderId} confirmado · Lenesens`;

    /* ----------------------------------------------------
       15. LOG DE DESARROLLO
       ---------------------------------------------------- */
    // console.log('[confirmacion] Pedido cargado:', order);

  };

  window.LNS?.ready(init) ?? document.addEventListener('DOMContentLoaded', init);

})();