/* ============================================================
   FAQ — Accordion de preguntas frecuentes
   Lenesens Hydralight
   Cierra automáticamente los otros items al abrir uno.
   ============================================================ */

'use strict';

(function initFAQ() {

  const init = () => {

    /* ----------------------------------------------------
       1. DETECTAR TODOS LOS FAQ ITEMS
       ---------------------------------------------------- */
    const faqItems = document.querySelectorAll('.faq-item');
    if (!faqItems.length) return;

    /* ----------------------------------------------------
       2. COMPORTAMIENTO ACCORDION
       Al abrir uno, cerramos los demás (solo en el mismo grupo).
       ---------------------------------------------------- */
    faqItems.forEach((item) => {
      // Escuchar el toggle nativo de <details>
      item.addEventListener('toggle', () => {
        if (!item.open) return;

        // Encontrar el contenedor padre (para no cerrar FAQs de otros grupos)
        const parent = item.parentElement;
        if (!parent) return;

        // Cerrar los demás items del mismo grupo
        const siblings = parent.querySelectorAll('.faq-item');
        siblings.forEach((sibling) => {
          if (sibling !== item && sibling.open) {
            sibling.open = false;
          }
        });

        // Emitir evento
        const question = item.querySelector('.faq-question span');
        document.dispatchEvent(new CustomEvent('faq:open', {
          detail: {
            question: question?.textContent || '',
            item
          }
        }));
      });
    });

    /* ----------------------------------------------------
       3. ACCESIBILIDAD — Soporte teclado
       Por defecto <details> ya soporta Enter/Space,
       pero añadimos navegación con flechas.
       ---------------------------------------------------- */
    faqItems.forEach((item, index) => {
      const summary = item.querySelector('.faq-question');
      if (!summary) return;

      summary.addEventListener('keydown', (e) => {
        const allSummaries = Array.from(
          item.parentElement.querySelectorAll('.faq-question')
        );
        const currentIndex = allSummaries.indexOf(summary);

        if (e.key === 'ArrowDown') {
          e.preventDefault();
          const next = allSummaries[currentIndex + 1] || allSummaries[0];
          next.focus();
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          const prev = allSummaries[currentIndex - 1] || allSummaries[allSummaries.length - 1];
          prev.focus();
        } else if (e.key === 'Home') {
          e.preventDefault();
          allSummaries[0].focus();
        } else if (e.key === 'End') {
          e.preventDefault();
          allSummaries[allSummaries.length - 1].focus();
        }
      });
    });

    /* ----------------------------------------------------
       4. DEEP LINKING (opcional)
       Si la URL tiene #faq-2, abrimos ese item automáticamente.
       ---------------------------------------------------- */
    const hash = window.location.hash;
    if (hash && hash.startsWith('#faq-')) {
      const index = parseInt(hash.replace('#faq-', ''), 10) - 1;
      if (faqItems[index]) {
        faqItems[index].open = true;
        setTimeout(() => {
          faqItems[index].scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 100);
      }
    }

  };

  window.LNS?.ready(init) ?? document.addEventListener('DOMContentLoaded', init);

})();