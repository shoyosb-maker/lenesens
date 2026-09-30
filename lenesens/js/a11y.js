/* ============================================================
   A11Y — Mejoras de accesibilidad
   Lenesens Hydralight
   Focus trap avanzado, anuncios ARIA, atajos de teclado,
   y mejoras de navegación.
   ============================================================ */

'use strict';

(function initA11y() {

  const init = () => {

    /* ----------------------------------------------------
       1. ANUNCIOS ARIA LIVE
       Crea una región aria-live global para mensajes dinámicos.
       ---------------------------------------------------- */
    const liveRegion = document.createElement('div');
    liveRegion.id = 'a11y-live-region';
    liveRegion.className = 'sr-only';
    liveRegion.setAttribute('role', 'status');
    liveRegion.setAttribute('aria-live', 'polite');
    liveRegion.setAttribute('aria-atomic', 'true');
    document.body.appendChild(liveRegion);

    // Expone una API para que otros scripts anuncien cambios
    window.LNS = window.LNS || {};
    window.LNS.a11y = {
      /**
       * Anuncia un mensaje a lectores de pantalla.
       * @param {string} message - Texto a anunciar
       * @param {'polite'|'assertive'} priority - Urgencia
       */
      announce(message, priority = 'polite') {
        if (!message) return;
        liveRegion.setAttribute('aria-live', priority);
        liveRegion.textContent = '';

        // Pequeño delay para forzar el anuncio
        setTimeout(() => {
          liveRegion.textContent = message;
        }, 100);
      }
    };

    /* ----------------------------------------------------
       2. ATAJOS DE TECLADO GLOBALES
       ---------------------------------------------------- */

    // ESC cierra modales/menús abiertos
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        // Cerrar cart drawer
        if (document.body.classList.contains('has-cart-open')) {
          window.LNS?.cart?.close?.();
        }

        // Cerrar menú móvil
        if (document.body.classList.contains('has-menu-open')) {
          const closeMenuBtn = document.querySelector('[data-action="close-menu"]');
          if (closeMenuBtn) closeMenuBtn.click();
        }
      }
    });

    // "/" enfoca el buscador (cuando no estás escribiendo)
    document.addEventListener('keydown', (e) => {
      if (e.key !== '/') return;

      const target = e.target;
      const isTyping = (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      );

      if (isTyping) return;

      e.preventDefault();

      const searchInput = document.getElementById('catalog-search-input');
      if (searchInput) {
        searchInput.focus();
        window.LNS?.a11y?.announce('Buscador enfocado');
      } else {
        // Si no hay search, abrir el buscador del header
        const searchBtn = document.querySelector('[data-action="open-search"]');
        if (searchBtn) searchBtn.click();
      }
    });

    /* ----------------------------------------------------
       3. FOCUS TRAP AVANZADO PARA DRAWER Y MENÚ
       ---------------------------------------------------- */
    // Refuerza el focus trap existente agregando "inert" a
    // elementos fuera del focus trap (mejor que solo keydown)

    const observeFocusableContainers = () => {
      // Cart drawer
      const cartDrawer = document.getElementById('cart-drawer');
      if (cartDrawer) {
        const observer = new MutationObserver((mutations) => {
          mutations.forEach((mutation) => {
            if (mutation.attributeName === 'class') {
              const isOpen = cartDrawer.classList.contains('is-open');
              handleFocusTrap(cartDrawer, isOpen);
            }
          });
        });
        observer.observe(cartDrawer, { attributes: true });
      }

      // Mobile menu
      const mobileMenu = document.getElementById('mobile-menu');
      if (mobileMenu) {
        const observer = new MutationObserver((mutations) => {
          mutations.forEach((mutation) => {
            if (mutation.attributeName === 'class') {
              const isOpen = mobileMenu.classList.contains('is-open');
              handleFocusTrap(mobileMenu, isOpen);
            }
          });
        });
        observer.observe(mobileMenu, { attributes: true });
      }
    };

    const handleFocusTrap = (container, isOpen) => {
      const focusableElements = getFocusable(container);

      if (isOpen) {
        // Guardar el elemento que tenía el foco antes
        container._previousFocus = document.activeElement;

        // Focus al primer elemento
        if (focusableElements.length) {
          setTimeout(() => focusableElements[0].focus(), 100);
        }

        // Aplicar inert al resto del body
        applyInert(container);
      } else {
        // Remover inert
        removeInert();

        // Restaurar el foco previo
        if (container._previousFocus && container._previousFocus.focus) {
          container._previousFocus.focus();
        }
      }
    };

    const getFocusable = (container) => {
      const selectors = [
        'a[href]',
        'button:not([disabled])',
        'input:not([disabled])',
        'select:not([disabled])',
        'textarea:not([disabled])',
        '[tabindex]:not([tabindex="-1"])'
      ].join(',');

      return Array.from(container.querySelectorAll(selectors)).filter(
        (el) => el.offsetParent !== null
      );
    };

    const applyInert = (keepContainer) => {
      const body = document.body;
      Array.from(body.children).forEach((child) => {
        if (
          child === keepContainer ||
          child.classList.contains('toast-container') ||
          child.id === 'a11y-live-region'
        ) {
          return;
        }
        // Aplicar inert solo si el navegador lo soporta
        if ('inert' in HTMLElement.prototype) {
          child.inert = true;
        } else {
          // Fallback: aria-hidden
          child.setAttribute('aria-hidden', 'true');
        }
      });
    };

    const removeInert = () => {
      Array.from(document.body.children).forEach((child) => {
        if ('inert' in HTMLElement.prototype) {
          child.inert = false;
        } else {
          child.removeAttribute('aria-hidden');
        }
      });
    };

    observeFocusableContainers();

    /* ----------------------------------------------------
       4. MEJORAS DE NAVEGACIÓN POR TECLADO
       ---------------------------------------------------- */

    // En el menú móvil, permitir cerrar con ESC (redundante pero refuerza)
    document.addEventListener('keydown', (e) => {
      if (e.key !== 'Tab') return;

      // Detecta si hay un focus trap activo
      const activeTraps = document.querySelectorAll('.cart-drawer.is-open, .mobile-menu.is-open');
      if (!activeTraps.length) return;

      const activeTrap = activeTraps[0];
      const focusable = getFocusable(activeTrap);
      if (!focusable.length) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    });

    /* ----------------------------------------------------
       5. NAVEGACIÓN POR ANCHORS CON FOCO
       Mejora el scroll suave con gestión de foco
       ---------------------------------------------------- */
    window.LNS.$$('a[href^="#"]').forEach((link) => {
      link.addEventListener('click', (e) => {
        const targetId = link.getAttribute('href');
        if (!targetId || targetId === '#') return;

        const target = document.querySelector(targetId);
        if (!target) return;

        // Mover el foco al target (importante para lectores de pantalla)
        if (!target.hasAttribute('tabindex')) {
          target.setAttribute('tabindex', '-1');
        }

        setTimeout(() => {
          target.focus({ preventScroll: true });
        }, 500);

        // Anunciar el cambio
        const title = target.querySelector('h1, h2, h3')?.textContent?.trim() ||
                      target.getAttribute('aria-label') ||
                      'Sección';
        window.LNS?.a11y?.announce(`Navegando a: ${title}`);
      });
    });

    /* ----------------------------------------------------
       6. ANUNCIAR CAMBIOS DE FILTROS (catalog + revista)
       ---------------------------------------------------- */
    document.addEventListener('catalog:filter', (e) => {
      const { visibleCount, totalCount } = e.detail || {};
      if (typeof visibleCount === 'number' && typeof totalCount === 'number') {
        const msg = visibleCount === 0
          ? 'No se encontraron productos'
          : `Mostrando ${visibleCount} de ${totalCount} productos`;
        window.LNS?.a11y?.announce(msg);
      }
    });

    document.addEventListener('journal:filter', (e) => {
      const { visibleCount, totalCount } = e.detail || {};
      if (typeof visibleCount === 'number') {
        const msg = visibleCount === 0
          ? 'No hay artículos en esta categoría'
          : `Mostrando ${visibleCount} de ${totalCount} artículos`;
        window.LNS?.a11y?.announce(msg);
      }
    });

    /* ----------------------------------------------------
       7. ANUNCIAR AÑADIR AL CARRITO
       ---------------------------------------------------- */
    document.addEventListener('cart:update', (e) => {
      const { itemCount } = e.detail || {};
      if (typeof itemCount === 'number' && itemCount > 0) {
        window.LNS?.a11y?.announce(
          `Carrito actualizado. ${itemCount} ${itemCount === 1 ? 'producto' : 'productos'} en la bolsa.`,
          'polite'
        );
      }
    });

    /* ----------------------------------------------------
       8. DETECTAR PROBLEMAS COMUNES DE ACCESIBILIDAD
       (solo en desarrollo)
       ---------------------------------------------------- */
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      checkCommonIssues();
    }

  };

  /* =========================================================
     DIAGNÓSTICO DE PROBLEMAS COMUNES (solo dev)
     ========================================================= */
  function checkCommonIssues() {
    const issues = [];

    // 1. Botones sin aria-label ni texto
    document.querySelectorAll('button').forEach((btn) => {
      const hasText = btn.textContent.trim().length > 0;
      const hasAria = btn.getAttribute('aria-label');
      const hasIconOnly = btn.querySelector('svg, img');

      if (!hasText && !hasAria && hasIconOnly) {
        issues.push(`Botón sin label: ${btn.className}`);
      }
    });

    // 2. Imágenes sin alt
    document.querySelectorAll('img').forEach((img) => {
      if (!img.hasAttribute('alt')) {
        issues.push(`Imagen sin alt: ${img.src}`);
      }
    });

    // 3. Inputs sin label asociado
    document.querySelectorAll('input:not([type="hidden"])').forEach((input) => {
      const id = input.id;
      const hasLabel = id && document.querySelector(`label[for="${id}"]`);
      const hasAriaLabel = input.getAttribute('aria-label');
      const hasAriaLabelledby = input.getAttribute('aria-labelledby');

      if (!hasLabel && !hasAriaLabel && !hasAriaLabelledby) {
        issues.push(`Input sin label: ${input.type} ${input.name || input.id}`);
      }
    });

    if (issues.length) {
      console.group('%c🔍 A11Y — Problemas detectados', 'color: #d4af37; font-weight: bold;');
      issues.forEach((issue) => console.warn(issue));
      console.groupEnd();
    } else {
      console.log('%c✅ A11Y — Sin problemas básicos detectados', 'color: #2b5a15; font-weight: bold;');
    }
  }

  window.LNS?.ready(init) ?? document.addEventListener('DOMContentLoaded', init);

})();