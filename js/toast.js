/* ============================================================
   TOAST — Notificaciones flotantes no intrusivas
   Lenesens Hydralight
   Muestra mensajes breves en la esquina inferior derecha.
   ============================================================ */

'use strict';

(function initToast() {

  /* ----------------------------------------------------
     CONFIGURACIÓN
     ---------------------------------------------------- */
  const DURATION = 3000;   // ms visible
  const POSITION = 'bottom-right';

  /* ----------------------------------------------------
     CREAR CONTENEDOR
     ---------------------------------------------------- */
  let container = null;

  function ensureContainer() {
    if (container) return container;

    container = document.createElement('div');
    container.className = 'toast-container';
    container.setAttribute('aria-live', 'polite');
    container.setAttribute('aria-atomic', 'true');
    container.dataset.position = POSITION;
    document.body.appendChild(container);

    return container;
  }

  /* ----------------------------------------------------
     API: show(message, options)
     ---------------------------------------------------- */
  function show(message, options = {}) {
    const {
      type = 'default',       // 'default' | 'success' | 'error' | 'warning' | 'info'
      duration = DURATION,
      icon = null,
      action = null           // { label, onClick }
    } = options;

    const cont = ensureContainer();

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.setAttribute('role', type === 'error' ? 'alert' : 'status');
    toast.setAttribute('aria-live', type === 'error' ? 'assertive' : 'polite');
    toast.setAttribute('aria-atomic', 'true');

    // Icono
    let iconHTML = '';
    if (icon) {
      iconHTML = `<img src="${icon}" alt="" width="18" height="18" class="toast-icon">`;
    } else if (type === 'success') {
      iconHTML = `<span class="toast-icon toast-icon-success">✓</span>`;
    } else if (type === 'error') {
      iconHTML = `<span class="toast-icon toast-icon-error">!</span>`;
    } else if (type === 'warning') {
      iconHTML = `<span class="toast-icon toast-icon-warning">!</span>`;
    }

    // Acción
    let actionHTML = '';
    if (action && action.label) {
      actionHTML = `<button type="button" class="toast-action">${action.label}</button>`;
    }

    toast.innerHTML = `
      ${iconHTML}
      <span class="toast-message">${message}</span>
      ${actionHTML}
    `;

    // Listener de acción
    if (action && action.onClick) {
      const actionBtn = toast.querySelector('.toast-action');
      if (actionBtn) {
        actionBtn.addEventListener('click', () => {
          action.onClick();
          dismiss(toast);
        });
      }
    }

    // Click en el toast lo cierra
    toast.addEventListener('click', (e) => {
      if (e.target.classList.contains('toast-action')) return;
      dismiss(toast);
    });

    // Añadir al DOM
    cont.appendChild(toast);

    // Animar entrada
    requestAnimationFrame(() => {
      toast.classList.add('is-visible');
    });

    // Auto-dismiss
    if (duration > 0) {
      setTimeout(() => dismiss(toast), duration);
    }

    return toast;
  }

  /* ----------------------------------------------------
     API: dismiss(toast)
     ---------------------------------------------------- */
  function dismiss(toast) {
    if (!toast || !toast.parentElement) return;

    toast.classList.remove('is-visible');
    toast.classList.add('is-leaving');

    setTimeout(() => {
      if (toast.parentElement) toast.parentElement.removeChild(toast);
    }, 300);
  }

  /* ----------------------------------------------------
     API: clear()
     ---------------------------------------------------- */
  function clear() {
    if (!container) return;
    container.innerHTML = '';
  }

  /* ----------------------------------------------------
     EXPORTAR
     ---------------------------------------------------- */
  window.LNS = window.LNS || {};
  window.LNS.toast = {
    show,
    dismiss,
    clear,
    success: (msg, opts = {}) => show(msg, { ...opts, type: 'success' }),
    error:   (msg, opts = {}) => show(msg, { ...opts, type: 'error' }),
    warning: (msg, opts = {}) => show(msg, { ...opts, type: 'warning' }),
    info:    (msg, opts = {}) => show(msg, { ...opts, type: 'info' })
  };

})();