/* ============================================================
   HEADER — Lógica de navegación
   Lenesens Hydralight
   ============================================================ */

'use strict';

(function initHeader() {

  // Esperamos a que el DOM esté listo
  const init = () => {

    /* ----------------------------------------------------
       1. REFERENCIAS AL DOM
       ---------------------------------------------------- */
    const header       = document.getElementById('site-header');
    const menuBtn      = document.querySelector('[data-action="toggle-menu"]');
    const closeBtn     = document.querySelector('[data-action="close-menu"]');
    const mobileMenu   = document.getElementById('mobile-menu');
    const body         = document.body;
    const currencyBtns = document.querySelectorAll('.currency-option');

    if (!header) return; // Si no hay header, no hacemos nada

    /* ----------------------------------------------------
       2. HEADER STICKY — efecto al hacer scroll
       ---------------------------------------------------- */
    const SCROLL_THRESHOLD = 20;

    const handleScroll = () => {
      const scrolled = window.scrollY > SCROLL_THRESHOLD;
      header.classList.toggle('is-scrolled', scrolled);
    };

    // Throttle para no ejecutar en cada pixel
    window.addEventListener('scroll', window.LNS.throttle(handleScroll, 100), { passive: true });

    // Ejecutamos al cargar por si la página ya está scrolleada
    handleScroll();

    /* ----------------------------------------------------
       3. MENÚ MÓVIL — abrir / cerrar
       ---------------------------------------------------- */
    let releaseFocus = null;

    const openMenu = () => {
      if (!mobileMenu || !menuBtn) return;

      mobileMenu.hidden = false;
      // Forzar un frame para que la transición se ejecute
      requestAnimationFrame(() => {
        mobileMenu.classList.add('is-open');
      });

      menuBtn.setAttribute('aria-expanded', 'true');
      body.classList.add('has-menu-open');

      // Trap focus dentro del menú
      releaseFocus = window.LNS.trapFocus(mobileMenu);
    };

    const closeMenu = () => {
      if (!mobileMenu || !menuBtn) return;

      mobileMenu.classList.remove('is-open');
      menuBtn.setAttribute('aria-expanded', 'false');
      body.classList.remove('has-menu-open');

      // Esperamos a que termine la transición antes de ocultar
      const onTransitionEnd = () => {
        mobileMenu.hidden = true;
        mobileMenu.removeEventListener('transitionend', onTransitionEnd);
      };
      mobileMenu.addEventListener('transitionend', onTransitionEnd, { once: true });

      // Fallback por si la transición no dispara (reduced motion)
      setTimeout(() => {
        if (!mobileMenu.classList.contains('is-open')) {
          mobileMenu.hidden = true;
        }
      }, 500);

      // Liberamos el focus trap
      if (typeof releaseFocus === 'function') {
        releaseFocus();
        releaseFocus = null;
      }

      // Devolvemos el foco al botón
      menuBtn.focus();
    };

    const toggleMenu = () => {
      if (!mobileMenu) return;
      mobileMenu.classList.contains('is-open') ? closeMenu() : openMenu();
    };

    // Listeners del menú
    window.LNS.on(menuBtn, 'click', toggleMenu);
    window.LNS.on(closeBtn, 'click', closeMenu);

    // Cerrar al hacer click en el overlay (fuera del panel)
    window.LNS.on(mobileMenu, 'click', (e) => {
      if (e.target === mobileMenu) closeMenu();
    });

    // Cerrar con tecla ESC
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && mobileMenu?.classList.contains('is-open')) {
        closeMenu();
      }
    });

    // Cerrar al hacer click en un link del menú
    window.LNS.$$('.mobile-nav-list a', mobileMenu).forEach((link) => {
      link.addEventListener('click', closeMenu);
    });

    // Si cambia a desktop, cerramos el menú (por si quedó abierto)
    const desktopQuery = window.matchMedia('(min-width: 1024px)');
    desktopQuery.addEventListener('change', (e) => {
      if (e.matches && mobileMenu?.classList.contains('is-open')) {
        closeMenu();
      }
    });

    /* ----------------------------------------------------
       4. SELECTOR DE MONEDA (COP / USD)
       ---------------------------------------------------- */
    const CURRENCY_KEY = 'lenesens_currency';
    const rates = {
      COP: 1,
      USD: 0.00025   // ~1 USD = 4000 COP (ajustable)
    };

    const setCurrency = (currency) => {
      if (!rates[currency]) return;

      // Actualizamos estado visual de los botones
      currencyBtns.forEach((btn) => {
        btn.classList.toggle('is-active', btn.dataset.currency === currency);
      });

      // Guardamos preferencia
      window.LNS.storage.set(CURRENCY_KEY, currency);

      // Disparamos un evento global para que otras partes del sitio
      // puedan reaccionar (ej: precios en las cards)
      document.dispatchEvent(
        new CustomEvent('currency:change', {
          detail: { currency, rate: rates[currency] }
        })
      );
    };

    currencyBtns.forEach((btn) => {
      btn.addEventListener('click', () => setCurrency(btn.dataset.currency));
    });

    // Restauramos preferencia guardada
    const savedCurrency = window.LNS.storage.get(CURRENCY_KEY, 'COP');
    if (savedCurrency && savedCurrency !== 'COP') {
      setCurrency(savedCurrency);
    }

    /* ----------------------------------------------------
       5. NAVEGACIÓN ACTIVA — marcar el link actual
       ---------------------------------------------------- */
    const currentPath = window.location.pathname.split('/').pop() || 'index.html';
    const navLinks = window.LNS.$$('.nav-link, .mobile-nav-list a');

    navLinks.forEach((link) => {
      const href = link.getAttribute('href') || '';
      // Comparamos solo el nombre del archivo
      const linkPath = href.split('/').pop().split('#')[0];

      if (linkPath === currentPath) {
        link.classList.add('is-active');
        link.setAttribute('aria-current', 'page');
      } else {
        link.classList.remove('is-active');
        link.removeAttribute('aria-current');
      }
    });

    /* ----------------------------------------------------
       6. SMOOTH SCROLL — anchors internos
       ---------------------------------------------------- */
    window.LNS.$$('a[href^="#"]').forEach((link) => {
      link.addEventListener('click', (e) => {
        const targetId = link.getAttribute('href');
        if (targetId === '#' || targetId.length < 2) return;

        const targetEl = document.querySelector(targetId);
        if (!targetEl) return;

        e.preventDefault();

        const headerHeight = header.offsetHeight;
        const targetY = targetEl.getBoundingClientRect().top + window.scrollY - headerHeight - 16;

        window.scrollTo({
          top: targetY,
          behavior: window.LNS.device.prefersReducedMotion() ? 'auto' : 'smooth'
        });

        // Actualizamos la URL sin saltar
        history.pushState(null, '', targetId);
      });
    });

        /* ----------------------------------------------------
       7. CARRITO — reaccionar a cambios
       ---------------------------------------------------- */
    document.addEventListener('cart:update', (e) => {
      const detail = e.detail || {};
      const total = detail.itemCount ?? detail.count ?? 0;

      // Actualizar TODOS los badges de la página (header + drawer)
      const badges = document.querySelectorAll('[data-cart-count]');
      if (!badges.length) return;

      badges.forEach((badge) => {
        badge.textContent = total;
        badge.setAttribute('data-cart-count', total);

        // Animación bump solo si hay items
        if (total > 0) {
          badge.classList.add('is-bumping');
          setTimeout(() => badge.classList.remove('is-bumping'), 400);
        }
      });
    });

  };

  // Arrancamos cuando el DOM esté listo
  window.LNS?.ready(init) ?? document.addEventListener('DOMContentLoaded', init);

})();