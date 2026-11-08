/* ============================================================
   SCROLL 3D — Animaciones GSAP controladas por scroll
   Lenesens Hydralight
   Efectos: 3D tilt, parallax multicapa, reveal stagger avanzado,
   scale + rotate en secciones clave.
   ============================================================ */
'use strict';
(function initScroll3D() {
  const prefersReducedMotion =
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (prefersReducedMotion) return;
  if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;

  gsap.registerPlugin(ScrollTrigger);

  /* =========================================================
     1. REVEAL STAGGER 3D (para data-stagger-3d)
     Los hijos entran con rotateX(15deg) + translateY + opacity
     ========================================================= */
  const stagger3dTargets = document.querySelectorAll('[data-stagger-3d]');
  stagger3dTargets.forEach((container) => {
    const children = container.children;
    if (!children.length) return;

    gsap.from(children, {
      opacity: 0,
      y: 60,
      rotateX: 15,
      transformOrigin: 'center top',
      duration: 1.1,
      ease: 'expo.out',
      stagger: 0.12,
      scrollTrigger: {
        trigger: container,
        start: 'top 82%',
        once: true,
      },
    });
  });

  /* =========================================================
     2. PARALLAX MULTICAPA (para data-parallax-y="velocidad")
     Ej: <div data-parallax-y="0.3"> → se mueve 30% de la distancia
     ========================================================= */
  const parallaxTargets = document.querySelectorAll('[data-parallax-y]');
  parallaxTargets.forEach((el) => {
    const speed = parseFloat(el.dataset.parallaxY) || 0.2;
    gsap.to(el, {
      yPercent: speed * 100,
      ease: 'none',
      scrollTrigger: {
        trigger: el,
        start: 'top bottom',
        end: 'bottom top',
        scrub: 1.2,
      },
    });
  });

  /* =========================================================
     3. CARD 3D TILT
     Las cards con [data-card-3d] se inclinan según scroll
     ========================================================= */
  const cardTargets = document.querySelectorAll('[data-card-3d]');
  cardTargets.forEach((el) => {
    gsap.fromTo(
      el,
      { rotateY: -8, scale: 0.96 },
      {
        rotateY: 0,
        scale: 1,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: el,
          start: 'top 90%',
          end: 'top 50%',
          scrub: 0.8,
        },
      }
    );
  });

  /* =========================================================
     4. IMAGEN CON ZOOM LENTO (para [data-zoom-scroll])
     La imagen escala suavemente mientras entra al viewport
     ========================================================= */
  const zoomTargets = document.querySelectorAll('[data-zoom-scroll]');
  zoomTargets.forEach((el) => {
    gsap.fromTo(
      el,
      { scale: 1.15 },
      {
        scale: 1,
        ease: 'none',
        scrollTrigger: {
          trigger: el,
          start: 'top bottom',
          end: 'bottom top',
          scrub: 1,
        },
      }
    );
  });

  /* =========================================================
     5. STICKY 3D PIN para el HERO (opcional)
     El hero se queda fijo y los elementos internos rotan al scroll
     ========================================================= */
  const heroStage = document.querySelector('[data-hero-pin]');
  if (heroStage) {
    const heroChildren = heroStage.querySelectorAll('[data-hero-pin-child]');
    if (heroChildren.length) {
      gsap.timeline({
        scrollTrigger: {
          trigger: heroStage,
          start: 'top top',
          end: '+=60%',
          scrub: 1,
          pin: true,
          pinSpacing: true,
        },
      }).to(heroChildren, {
        rotateY: -12,
        scale: 0.92,
        y: -40,
        opacity: 0.6,
        ease: 'none',
        stagger: 0.05,
      });
    }
  }

  /* =========================================================
     6. REVEAL DE SECCIÓN (para [data-section-reveal])
     El header de la sección hace un fade + slide elegante
     ========================================================= */
  const sectionHeaders = document.querySelectorAll('[data-section-reveal]');
  sectionHeaders.forEach((el) => {
    gsap.from(el, {
      opacity: 0,
      y: 40,
      duration: 1.1,
      ease: 'expo.out',
      scrollTrigger: {
        trigger: el,
        start: 'top 85%',
        once: true,
      },
    });
  });

  /* =========================================================
     7. ROTACIÓN CONTINUA por scroll (para [data-rotate-scroll])
     Ej: un ornamento o ícono que gira 360° mientras scrolleas
     ========================================================= */
  const rotateTargets = document.querySelectorAll('[data-rotate-scroll]');
  rotateTargets.forEach((el) => {
    const degrees = parseFloat(el.dataset.rotateScroll) || 360;
    gsap.to(el, {
      rotate: degrees,
      ease: 'none',
      scrollTrigger: {
        trigger: el,
        start: 'top bottom',
        end: 'bottom top',
        scrub: 1,
      },
    });
  });

  /* =========================================================
     8. APARICIÓN DE "ORBES" / HALOS DECORATIVOS
     Los halos con [data-glow-scroll] pulsan al scroll
     ========================================================= */
  const glowTargets = document.querySelectorAll('[data-glow-scroll]');
  glowTargets.forEach((el) => {
    gsap.fromTo(
      el,
      { scale: 0.6, opacity: 0.3 },
      {
        scale: 1.2,
        opacity: 0.6,
        ease: 'none',
        scrollTrigger: {
          trigger: el,
          start: 'top bottom',
          end: 'bottom top',
          scrub: 1.5,
        },
      }
    );
  });

  /* ----------------------------------------------------
     Refresh ScrollTrigger después de cargar fuentes
     ---------------------------------------------------- */
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(() => ScrollTrigger.refresh());
  }
  window.addEventListener('load', () => ScrollTrigger.refresh());
})();