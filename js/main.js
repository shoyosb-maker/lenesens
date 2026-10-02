/* ============================================================
   MAIN — Orquestador de página
   Lenesens Hydralight
   Coordina el arranque de todos los módulos activos en la página.
   ============================================================ */

'use strict';

(function initMain() {

  const init = () => {

    /* ----------------------------------------------------
       1. DETECCIÓN DE PÁGINA
       ---------------------------------------------------- */
    const path = window.location.pathname.split('/').pop() || 'index.html';
    const pageName = path.replace('.html', '') || 'index';

    document.documentElement.setAttribute('data-page', pageName);

    // Descomenta para debug
    // console.log('[main] Página actual:', pageName);

    /* ----------------------------------------------------
       2. CONTADOR REGRESIVO (oferta dúo)
       ---------------------------------------------------- */
    initCountdown();

    /* ----------------------------------------------------
       3. APARICIÓN AL SCROLL (reveal animations)
       ---------------------------------------------------- */
    initScrollReveal();

    /* ----------------------------------------------------
       4. FAVORITOS EN CARDS (corazón)
       ---------------------------------------------------- */
    initFavorites();

    /* ----------------------------------------------------
       5. MARCAJE DEL AÑO ACTUAL EN FOOTER
       ---------------------------------------------------- */
    updateCopyrightYear();

  };

  /* =========================================================
     CONTADOR REGRESIVO
     Busca [data-countdown] y actualiza los hijos
     [data-countdown-hours|minutes|seconds].
     ========================================================= */
  function initCountdown() {
    const container = document.querySelector('[data-countdown]');
    if (!container) return;

    // Duración objetivo: leemos el atributo "8h-42m-19s"
    const raw = container.dataset.countdown || '8h-0m-0s';
    const [h, m, s] = raw.match(/\d+/g)?.map(Number) ?? [8, 0, 0];

    // Punto de fin: ahora + duración
    // Guardamos en sessionStorage para que no se resete al recargar
    const STORAGE_KEY = 'lenesens_countdown_end';
    let endTime = parseInt(sessionStorage.getItem(STORAGE_KEY), 10);

    if (!endTime || endTime < Date.now()) {
      endTime = Date.now() + (h * 3600 + m * 60 + s) * 1000;
      sessionStorage.setItem(STORAGE_KEY, String(endTime));
    }

    const hoursEl   = container.querySelector('[data-countdown-hours]');
    const minutesEl = container.querySelector('[data-countdown-minutes]');
    const secondsEl = container.querySelector('[data-countdown-seconds]');

    const pad = (n) => String(n).padStart(2, '0');

    const tick = () => {
      const remaining = Math.max(0, endTime - Date.now());
      const totalSec = Math.floor(remaining / 1000);

      const hours   = Math.floor(totalSec / 3600);
      const minutes = Math.floor((totalSec % 3600) / 60);
      const seconds = totalSec % 60;

      if (hoursEl)   hoursEl.textContent   = pad(hours);
      if (minutesEl) minutesEl.textContent = pad(minutes);
      if (secondsEl) secondsEl.textContent = pad(seconds);

      if (remaining <= 0) {
        clearInterval(intervalId);
        // Aquí podrías ocultar la oferta o mostrar "Finalizada"
        container.classList.add('is-expired');
      }
    };

    tick();
    const intervalId = setInterval(tick, 1000);
  }

  /* =========================================================
     SCROLL REVEAL
     Añade .is-visible a los elementos [data-reveal] cuando
     entran al viewport. Usa IntersectionObserver (nativo).
     ========================================================= */
  function initScrollReveal() {
    const elements = document.querySelectorAll('[data-reveal]');
    if (!elements.length) return;

    // Si el usuario prefiere menos movimiento, mostramos todo de una
    if (window.LNS.device.prefersReducedMotion()) {
      elements.forEach((el) => el.classList.add('is-visible'));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.12,
        rootMargin: '0px 0px -50px 0px'
      }
    );

    elements.forEach((el) => observer.observe(el));
  }

  /* =========================================================
     FAVORITOS
     Sistema simple: click en [data-favorite] togglea el estado
     visual y guarda en localStorage.
     ========================================================= */
  function initFavorites() {
    const FAVORITES_KEY = 'lenesens_favorites';

    // Delega clicks en cualquier favorito de la página
    window.LNS.delegate(document.body, 'click', '[data-favorite]', (e, btn) => {
      e.preventDefault();
      e.stopPropagation();

      const id = btn.dataset.favorite;
      if (!id) return;

      const favorites = window.LNS.storage.get(FAVORITES_KEY, []);
      const index = favorites.indexOf(id);

      if (index === -1) {
        favorites.push(id);
        btn.classList.add('is-active');
        btn.setAttribute('aria-pressed', 'true');
      } else {
        favorites.splice(index, 1);
        btn.classList.remove('is-active');
        btn.setAttribute('aria-pressed', 'false');
      }

      window.LNS.storage.set(FAVORITES_KEY, favorites);
    });

    // Estado inicial: marcamos los que ya estaban guardados
    const favorites = window.LNS.storage.get(FAVORITES_KEY, []);
    favorites.forEach((id) => {
      const btn = document.querySelector(`[data-favorite="${id}"]`);
      if (btn) {
        btn.classList.add('is-active');
        btn.setAttribute('aria-pressed', 'true');
      }
    });
  }

  /* =========================================================
     AÑO ACTUAL EN EL COPYRIGHT
     Busca [data-current-year] y lo reemplaza por el año actual.
     ========================================================= */
  function updateCopyrightYear() {
    const el = document.querySelector('[data-current-year]');
    if (el) el.textContent = new Date().getFullYear();
  }

  // Arrancamos
  window.LNS?.ready(init) ?? document.addEventListener('DOMContentLoaded', init);

})();