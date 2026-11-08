/* ============================================================
   SMOOTH SCROLL — Lenis con integración a GSAP
   Lenesens Hydralight
   ============================================================ */
'use strict';
(function initSmoothScroll() {
  const prefersReducedMotion =
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Si el usuario prefiere menos movimiento, no activamos Lenis
  if (prefersReducedMotion) return;
  if (typeof Lenis === 'undefined') return;

  /* ----------------------------------------------------
     Configuración de Lenis
     ---------------------------------------------------- */
  const lenis = new Lenis({
    duration: 1.4,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), // expo out
    orientation: 'vertical',
    gestureOrientation: 'vertical',
    smoothWheel: true,
    wheelMultiplier: 0.9,
    touchMultiplier: 1.6,
    infinite: false,
  });

  /* ----------------------------------------------------
     Integración con GSAP ScrollTrigger
     ---------------------------------------------------- */
  if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
    gsap.registerPlugin(ScrollTrigger);

    // Sincronizar Lenis con ScrollTrigger
    lenis.on('scroll', ScrollTrigger.update);

    // Añadir Lenis al ticker de GSAP (una sola RAF para todo)
    gsap.ticker.add((time) => {
      lenis.raf(time * 1000);
    });

    // Desactivar el smoothing interno de GSAP (lo maneja Lenis)
    gsap.ticker.lagSmoothing(0);
  } else {
    // Sin GSAP: RAF manual
    function raf(time) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);
  }

  /* ----------------------------------------------------
     Sincronizar anclas internas (#hash)
     ---------------------------------------------------- */
  document.querySelectorAll('a[href^="#"]').forEach((link) => {
    link.addEventListener('click', (e) => {
      const targetId = link.getAttribute('href');
      if (!targetId || targetId === '#') return;
      const targetEl = document.querySelector(targetId);
      if (!targetEl) return;
      e.preventDefault();
      lenis.scrollTo(targetEl, { offset: -96, duration: 1.6 });
      history.pushState(null, '', targetId);
    });
  });

  /* ----------------------------------------------------
     Exponer API global
     ---------------------------------------------------- */
  window.LNS = window.LNS || {};
  window.LNS.lenis = lenis;
  window.LNS.scrollTo = (target, opts) => lenis.scrollTo(target, opts);
  window.LNS.scrollStop = () => lenis.stop();
  window.LNS.scrollStart = () => lenis.start();

  /* ----------------------------------------------------
     Compatibilidad con el cart drawer y modales
     Pausa el scroll cuando el drawer se abre
     ---------------------------------------------------- */
  document.addEventListener('cart:open', () => lenis.stop());
  document.addEventListener('cart:close', () => lenis.start());
})();