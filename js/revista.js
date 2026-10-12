/* ============================================================
   REVISTA — Lógica del journal editorial
   Lenesens Hydralight
   Filtros por categoría, contadores dinámicos, estado vacío,
   reveal stagger, deep links por URL y botón "Ver todas".
   ============================================================ */
'use strict';
(function initRevista() {
  const init = () => {
    /* ----------------------------------------------------
       1. REFERENCIAS AL DOM
       ---------------------------------------------------- */
    const filtersWrap = document.querySelector('[data-journal-filters]');
    const chips = document.querySelectorAll('[data-journal-filter]');
    const grid = document.querySelector('[data-journal-grid]');
    const allCards = Array.from(document.querySelectorAll('[data-journal-card]'));

    if (!chips.length) return;

    // Solo filtramos las cards dentro del grid (excluye el cover)
    const gridCards = allCards.filter((card) => card.closest('[data-journal-grid]'));

    /* ----------------------------------------------------
       2. ESTADO ACTUAL
       ---------------------------------------------------- */
    const state = {
      filter: 'all',
    };

    /* ----------------------------------------------------
       3. PARSER DE CADA CARD
       ---------------------------------------------------- */
    const parseCard = (card) => ({
      el: card,
      categories: (card.dataset.categories || '').split(/\s+/).filter(Boolean),
    });

    const cards = gridCards.map(parseCard);

    /* ----------------------------------------------------
       4. MATCH CON EL FILTRO ACTIVO
       ---------------------------------------------------- */
    const matchesFilter = (card, filter) => {
      if (filter === 'all') return true;
      return card.categories.includes(filter);
    };

    /* ----------------------------------------------------
       5. ACTUALIZAR CONTADORES DE CADA CHIP
       ---------------------------------------------------- */
    const updateChipCounts = () => {
      const counts = { all: cards.length };
      cards.forEach((card) => {
        card.categories.forEach((cat) => {
          counts[cat] = (counts[cat] || 0) + 1;
        });
      });

      document.querySelectorAll('.chip-count[data-count]').forEach((el) => {
        const key = el.dataset.count;
        if (key in counts) el.textContent = counts[key];
      });
    };

    /* ----------------------------------------------------
       6. APLICAR FILTRO
       ---------------------------------------------------- */
    const applyFilter = () => {
      let visibleCount = 0;

      cards.forEach((card) => {
        const matches = matchesFilter(card, state.filter);
        if (matches) {
          card.el.classList.remove('is-hidden');
          visibleCount++;
        } else {
          card.el.classList.add('is-hidden');
          card.el.classList.remove('is-visible');
        }
      });

      // Reveal en cascada de las cards visibles
      if (!window.LNS?.device?.prefersReducedMotion?.()) {
        requestAnimationFrame(() => {
          let delay = 0;
          cards.forEach((card) => {
            if (!card.el.classList.contains('is-hidden')) {
              card.el.style.transitionDelay = `${delay}ms`;
              card.el.classList.add('is-visible');
              delay += 60;
            }
          });

          // Limpiar los transition delays después de la animación
          setTimeout(() => {
            cards.forEach((card) => {
              card.el.style.transitionDelay = '';
            });
          }, 800);
        });
      } else {
        cards.forEach((card) => {
          if (!card.el.classList.contains('is-hidden')) {
            card.el.classList.add('is-visible');
          }
        });
      }

      updateEmptyState(visibleCount);

      // Emitir evento
      document.dispatchEvent(
        new CustomEvent('journal:filter', {
          detail: {
            filter: state.filter,
            visibleCount,
            totalCount: cards.length,
          },
        })
      );
    };

    /* ----------------------------------------------------
       7. ESTADO VACÍO (creado dinámicamente si no existe)
       ---------------------------------------------------- */
    let emptyState = document.querySelector('.journal-empty');

    const ensureEmptyState = () => {
      if (emptyState || !grid) return;
      emptyState = document.createElement('div');
      emptyState.className = 'journal-empty';
      emptyState.hidden = true;
      emptyState.innerHTML = `
        <div class="journal-empty-icon">
          <svg class="icon icon-xl" aria-hidden="true"><use href="assets/icons/sprite.svg#icon-book"></use></svg>
        </div>
        <h3>No hay artículos en esta categoría</h3>
        <p>Prueba con otra categoría o explora todos los artículos disponibles.</p>
      `;
      grid.parentElement.appendChild(emptyState);
    };

    const updateEmptyState = (visible) => {
      ensureEmptyState();
      if (!emptyState) return;

      if (visible === 0) {
        emptyState.hidden = false;
        if (grid) grid.hidden = true;
      } else {
        emptyState.hidden = true;
        if (grid) grid.hidden = false;
      }
    };

    /* ----------------------------------------------------
       8. CONECTAR CHIPS
       ---------------------------------------------------- */
    chips.forEach((chip) => {
      chip.addEventListener('click', () => {
        const filter = chip.dataset.journalFilter || 'all';

        // Actualizar estado visual de los chips
        chips.forEach((c) => c.classList.toggle('is-active', c === chip));

        state.filter = filter;
        applyFilter();
      });

      // Soporte teclado con flechas
      chip.addEventListener('keydown', (e) => {
        if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;

        const chipsArray = Array.from(chips);
        const idx = chipsArray.indexOf(chip);
        const nextIdx =
          e.key === 'ArrowRight'
            ? (idx + 1) % chipsArray.length
            : (idx - 1 + chipsArray.length) % chipsArray.length;

        chipsArray[nextIdx].focus();
        chipsArray[nextIdx].click();
      });
    });

    /* ----------------------------------------------------
       9. REVEAL INICIAL (Intersection Observer)
       ---------------------------------------------------- */
    if (
      'IntersectionObserver' in window &&
      !window.LNS?.device?.prefersReducedMotion?.()
    ) {
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
          threshold: 0.1,
          rootMargin: '0px 0px -40px 0px',
        }
      );
      cards.forEach((card) => observer.observe(card.el));
    } else {
      // Sin animación: mostrar todas
      cards.forEach((card) => card.el.classList.add('is-visible'));
    }

    /* ----------------------------------------------------
       10. ESTADO INICIAL
       ---------------------------------------------------- */
    updateChipCounts();
    applyFilter();

    /* ----------------------------------------------------
       11. DEEP LINK desde URL (?cat=ingredientes)
       ---------------------------------------------------- */
    const params = new URLSearchParams(window.location.search);
    const catParam = params.get('cat');
    if (catParam) {
      const targetChip = Array.from(chips).find(
        (c) => c.dataset.journalFilter === catParam
      );
      if (targetChip) targetChip.click();
    }

    /* ----------------------------------------------------
       12. AÑADIR AL CARRITO (ya soportado por cart.js)
       Los botones con data-add-to-cart-card se manejan
       automáticamente. Aquí solo dejamos un pequeño feedback
       adicional para el usuario.
       ---------------------------------------------------- */
    document.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-add-to-cart-card]');
      if (!btn) return;

      // Feedback visual: cambiar temporalmente el texto del botón
      const original = btn.innerHTML;
      btn.disabled = true;
      btn.innerHTML = `
        <svg class="icon icon-sm" aria-hidden="true"><use href="assets/icons/sprite.svg#icon-check"></use></svg>
        Añadido a tu Bolsa
      `;
      btn.classList.add('is-added');

      setTimeout(() => {
        btn.innerHTML = original;
        btn.disabled = false;
        btn.classList.remove('is-added');
      }, 1800);
    });

    /* ----------------------------------------------------
       13. BOTÓN "VER TODAS LAS PUBLICACIONES"
       Resetea los filtros y hace scroll al inicio del grid.
       ---------------------------------------------------- */
    const viewAllBtn = document.querySelector('[data-journal-view-all]');
    if (viewAllBtn) {
      viewAllBtn.addEventListener('click', () => {
        // 1. Activar el chip "Todos" (que ya resetea los filtros)
        const allChip = Array.from(chips).find(
          (c) => c.dataset.journalFilter === 'all'
        );
        if (allChip) {
          allChip.click();
        }

        // 2. Scroll suave al inicio del grid
        const gridHeader = document.querySelector('.journal-grid-header');
        if (gridHeader) {
          const headerHeight =
            document.querySelector('.site-header')?.offsetHeight || 80;
          const targetY =
            gridHeader.getBoundingClientRect().top +
            window.scrollY -
            headerHeight -
            16;

          window.scrollTo({
            top: targetY,
            behavior: window.LNS?.device?.prefersReducedMotion?.()
              ? 'auto'
              : 'smooth',
          });
        }

        // 3. Anunciar a lectores de pantalla
        window.LNS?.a11y?.announce?.(
          'Mostrando todos los artículos publicados'
        );
      });
    }
  };

  window.LNS?.ready(init) ?? document.addEventListener('DOMContentLoaded', init);
})();