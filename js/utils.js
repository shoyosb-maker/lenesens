/* ============================================================
   UTILS — Funciones helper reutilizables
   Lenesens Hydralight
   ============================================================ */

'use strict';

/* ---------------------------------------------------------
   1. SELECTORES — atajos tipo jQuery pero vanilla
   --------------------------------------------------------- */
const $  = (selector, scope = document) => scope.querySelector(selector);
const $$ = (selector, scope = document) => Array.from(scope.querySelectorAll(selector));

/* ---------------------------------------------------------
   2. EVENTOS — atajos y helpers
   --------------------------------------------------------- */

/**
 * Añade un listener con opciones seguras por defecto.
 */
const on = (el, event, handler, options = {}) => {
  if (!el) return;
  el.addEventListener(event, handler, options);
};

/**
 * Delegación de eventos: escucha en un contenedor y filtra
 * por selector. Útil para listas dinámicas.
 */
const delegate = (container, event, selector, handler) => {
  if (!container) return;
  container.addEventListener(event, (e) => {
    const target = e.target.closest(selector);
    if (target && container.contains(target)) {
      handler.call(target, e, target);
    }
  });
};

/**
 * Debounce: retrasa la ejecución hasta que pasen X ms sin
 * llamarse de nuevo. Ideal para scroll/resize.
 */
const debounce = (fn, wait = 200) => {
  let timeout;
  return function (...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => fn.apply(this, args), wait);
  };
};

/**
 * Throttle: ejecuta la función como máximo una vez cada X ms.
 * Ideal para scroll en tiempo real.
 */
const throttle = (fn, limit = 100) => {
  let inThrottle;
  return function (...args) {
    if (!inThrottle) {
      fn.apply(this, args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
};

/* ---------------------------------------------------------
   3. FORMATO — precios, números, texto
   --------------------------------------------------------- */

/**
 * Formatea un número como precio COP.
 * 129900 → "$129.900 COP"
 */
const formatCOP = (num) => {
  if (typeof num !== 'number' || isNaN(num)) return '$0 COP';
  return '$' + num.toLocaleString('es-CO') + ' COP';
};

/**
 * Formatea un número como precio sin "COP".
 * 129900 → "$129.900"
 */
const formatPrice = (num) => {
  if (typeof num !== 'number' || isNaN(num)) return '$0';
  return '$' + num.toLocaleString('es-CO');
};

/**
 * Formatea número genérico con separador de miles.
 */
const formatNumber = (num) => {
  if (typeof num !== 'number' || isNaN(num)) return '0';
  return num.toLocaleString('es-CO');
};

/* ---------------------------------------------------------
   4. DOM — manipulación de clases
   --------------------------------------------------------- */

/**
 * Añade/quita clases sin repetir código.
 */
const addClass    = (el, ...classes) => el?.classList.add(...classes);
const removeClass = (el, ...classes) => el?.classList.remove(...classes);
const toggleClass = (el, cls, force) => el?.classList.toggle(cls, force);
const hasClass    = (el, cls) => el?.classList.contains(cls);

/* ---------------------------------------------------------
   5. STORAGE — localStorage seguro
   --------------------------------------------------------- */
const storage = {
  /**
   * Lee del localStorage parseando JSON.
   * Devuelve fallback si no existe o está corrupto.
   */
  get(key, fallback = null) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (e) {
      console.warn(`[storage] Error leyendo "${key}":`, e);
      return fallback;
    }
  },

  /**
   * Escribe en localStorage serializando JSON.
   */
  set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (e) {
      console.warn(`[storage] Error guardando "${key}":`, e);
      return false;
    }
  },

  /**
   * Elimina una clave.
   */
  remove(key) {
    try {
      localStorage.removeItem(key);
    } catch (e) {
      console.warn(`[storage] Error eliminando "${key}":`, e);
    }
  }
};

/* ---------------------------------------------------------
   6. DEVICE — detección y responsive
   --------------------------------------------------------- */
const device = {
  isMobile() {
    return window.matchMedia('(max-width: 767px)').matches;
  },
  isTablet() {
    return window.matchMedia('(min-width: 768px) and (max-width: 1023px)').matches;
  },
  isDesktop() {
    return window.matchMedia('(min-width: 1024px)').matches;
  },
  prefersReducedMotion() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  },
  hasTouch() {
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  }
};

/* ---------------------------------------------------------
   7. ANIMACIONES — helpers
   --------------------------------------------------------- */

/**
 * Espera X ms. Útil para pausas en async/await.
 */
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Ejecuta callback cuando el DOM está listo (aunque el script
 * se cargue antes).
 */
const ready = (callback) => {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', callback, { once: true });
  } else {
    callback();
  }
};

/* ---------------------------------------------------------
   8. ACCESIBILIDAD — focus trap
   --------------------------------------------------------- */

/**
 * Atrapa el foco dentro de un contenedor (para modales/menús).
 * Devuelve una función para "liberar" el foco al cerrar.
 */
const trapFocus = (container) => {
  const focusableSelectors = [
    'a[href]',
    'button:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    '[tabindex]:not([tabindex="-1"])'
  ].join(',');

  const handleKey = (e) => {
    if (e.key !== 'Tab') return;

    const focusable = $$(focusableSelectors, container).filter(
      (el) => el.offsetParent !== null  // solo visibles
    );

    if (focusable.length === 0) return;

    const first = focusable[0];
    const last  = focusable[focusable.length - 1];

    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  };

  container.addEventListener('keydown', handleKey);

  // Foco al primer elemento
  const focusable = $$(focusableSelectors, container).filter((el) => el.offsetParent !== null);
  focusable[0]?.focus();

  // Devolvemos cleanup
  return () => container.removeEventListener('keydown', handleKey);
};

/* ---------------------------------------------------------
   9. EXPORTAR AL SCOPE GLOBAL (window.LNS)
   --------------------------------------------------------- */
window.LNS = {
  $, $$, on, delegate, debounce, throttle,
  formatCOP, formatPrice, formatNumber,
  addClass, removeClass, toggleClass, hasClass,
  storage,
  device,
  sleep, ready,
  trapFocus
};

/* ---------------------------------------------------------
   10. LOG DE ARRANQUE (solo desarrollo)
   --------------------------------------------------------- */
// Descomenta para verificar que utils.js cargó bien
// console.log('✅ utils.js cargado');