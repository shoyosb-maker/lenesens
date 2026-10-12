/* ============================================================
   SCROLL ANIMATIONS — Efectos de scroll tipo Apple
   Lenesens Hydralight
   - Reveal con IntersectionObserver
   - Stagger automático en grids
   - Parallax suave con requestAnimationFrame
   ============================================================ */
'use strict';
(function initScrollAnimations() {
  const prefersReducedMotion = () =>
    window.LNS?.device?.prefersReducedMotion?.() ||
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* =========================================================
     1. REVEAL + STAGGER
     ========================================================= */
  const initReveal = () => {
    const elements = document.querySelectorAll(
      '[data-reveal], [data-stagger]'
    );
    if (!elements.length) return;

    // Sin observer o con reduced motion: mostrar todo
    if (!('IntersectionObserver' in window) || prefersReducedMotion()) {
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
        rootMargin: '0px 0px -60px 0px',
      }
    );

    elements.forEach((el) => observer.observe(el));
  };

  /* =========================================================
     2. PARALLAX
     Los elementos con [data-parallax] se mueven verticalmente
     a distinta velocidad que el scroll. El atributo puede ser
     un número (velocidad) o se usa 0.15 por defecto.
     Ejemplos:
       <div data-parallax>              → velocidad 0.15
       <div data-parallax="0.3">        → velocidad 0.3
       <div data-parallax="-0.2">       → se mueve al contrario
     ========================================================= */
  const initParallax = () => {
    const items = document.querySelectorAll('[data-parallax]');
    if (!items.length) return;
    if (prefersReducedMotion()) return;

    // Cachear los elementos con su velocidad
    const parallaxItems = Array.from(items).map((el) => {
      const speed = parseFloat(el.dataset.parallax) || 0.15;
      return { el, speed };
    });

    let ticking = false;

    const update = () => {
      const viewportHeight = window.innerHeight;
      const scrollY = window.scrollY;

      parallaxItems.forEach(({ el, speed }) => {
        const rect = el.getBoundingClientRect();
        const elementCenter = rect.top + rect.height / 2;

        // Distancia del centro del elemento respecto al centro del viewport
        const distanceFromCenter = elementCenter - viewportHeight / 2;

        // Movimiento: cuanto más lejos del centro, más desplazamiento
        // El signo de speed controla la dirección
        const offset = -distanceFromCenter * speed;

        el.style.transform = `translate3d(0, ${offset.toFixed(2)}px, 0)`;
      });

      ticking = false;
    };

    const onScroll = () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(update);
      }
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });

    // Primer render
    update();
  };

  /* =========================================================
     3. SCROLL PROGRESS BAR (opcional)
     Se activa si existe <div class="scroll-progress">
     ========================================================= */
  const initScrollProgress = () => {
    const bar = document.querySelector('.scroll-progress');
    if (!bar) return;

    let ticking = false;

    const update = () => {
      const scrollHeight =
        document.documentElement.scrollHeight - window.innerHeight;
      const progress = scrollHeight > 0 ? (window.scrollY / scrollHeight) * 100 : 0;
      bar.style.width = progress.toFixed(2) + '%';
      ticking = false;
    };

    const onScroll = () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(update);
      }
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    update();
  };

  /* =========================================================
     INIT
     ========================================================= */
  const init = () => {
    initReveal();
    initParallax();
    initScrollProgress();
  };

  window.LNS?.ready(init) ?? document.addEventListener('DOMContentLoaded', init);
})();