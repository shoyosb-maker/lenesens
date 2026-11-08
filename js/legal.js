/* ============================================================
   LEGAL — Interacciones de la página de Términos y Condiciones
   - Botón para imprimir / guardar en PDF
   - Índice lateral con sección activa
   ============================================================ */
(() => {
  'use strict';

  const init = () => {
    const printBtn = document.querySelector('[data-legal-print]');
    printBtn?.addEventListener('click', () => window.print());

    const toc = document.querySelector('[data-legal-toc]');
    if (!toc) return;

    const links = [...toc.querySelectorAll('a[href^="#"]')];
    const items = links
      .map((link) => ({ link, section: document.getElementById(link.getAttribute('href').slice(1)) }))
      .filter((item) => item.section);

    if (!items.length || !('IntersectionObserver' in window)) return;

    const setActive = (id) => {
      items.forEach(({ link }) => {
        link.classList.toggle('is-active', link.getAttribute('href') === `#${id}`);
      });
    };

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActive(entry.target.id);
        });
      },
      { rootMargin: '-15% 0px -70% 0px', threshold: 0 }
    );

    items.forEach(({ section }) => observer.observe(section));
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();
