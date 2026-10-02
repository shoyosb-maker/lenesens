/* ============================================================
   CATALOG — Lógica del catálogo de productos
   Lenesens Hydralight
   Búsqueda en vivo, filtros por categoría, ordenamiento, qty
   por card, añadir al carrito y estado vacío.
   ============================================================ */

'use strict';

(function initCatalog() {

  const init = () => {

    /* ----------------------------------------------------
       1. REFERENCIAS AL DOM
       ---------------------------------------------------- */
    const grid          = document.querySelector('[data-catalog-grid]');
    const cards         = Array.from(document.querySelectorAll('[data-product-card]'));
    const searchInput   = document.getElementById('catalog-search-input');
    const sortSelect    = document.getElementById('catalog-sort-select');
    const chips         = document.querySelectorAll('.catalog-chips .chip');
    const emptyState    = document.querySelector('[data-catalog-empty]');
    const clearBtn      = document.querySelector('[data-clear-filters]');
    const visibleCount  = document.querySelector('[data-visible-count]');
    const totalCount    = document.querySelector('[data-catalog-count]');

    if (!grid || !cards.length) return;

    /* ----------------------------------------------------
       2. ESTADO ACTUAL
       ---------------------------------------------------- */
    const state = {
      search: '',
      category: 'all',
      sort: 'recomendados'
    };

    /* ----------------------------------------------------
       3. PARSER DE DATOS DE CADA CARD
       Lee los data-* y devuelve un objeto limpio.
       ---------------------------------------------------- */
    const parseCard = (card) => ({
      el: card,
      id: card.dataset.productId,
      name: card.dataset.productName || '',
      price: parseInt(card.dataset.productPrice, 10) || 0,
      categories: (card.dataset.categories || '').split(/\s+/).filter(Boolean),
      rating: parseFloat(card.dataset.rating) || 0,
      date: card.dataset.date || ''
    });

    const products = cards.map(parseCard);

    /* ----------------------------------------------------
       4. LÓGICA DE FILTRADO
       ---------------------------------------------------- */
    const matchesSearch = (product, query) => {
      if (!query) return true;
      const q = query.toLowerCase().trim();
      return (
        product.name.toLowerCase().includes(q) ||
        product.categories.some((cat) => cat.toLowerCase().includes(q)) ||
        product.id.toLowerCase().includes(q)
      );
    };

    const matchesCategory = (product, category) => {
      if (category === 'all') return true;
      return product.categories.includes(category);
    };

    /* ----------------------------------------------------
       5. LÓGICA DE ORDENAMIENTO
       ---------------------------------------------------- */
    const sortProducts = (list, sortKey) => {
      const sorted = [...list];

      switch (sortKey) {
        case 'precio-asc':
          sorted.sort((a, b) => a.price - b.price);
          break;
        case 'precio-desc':
          sorted.sort((a, b) => b.price - a.price);
          break;
        case 'calificados':
          sorted.sort((a, b) => b.rating - a.rating);
          break;
        case 'novedad':
          sorted.sort((a, b) => new Date(b.date) - new Date(a.date));
          break;
        case 'recomendados':
        default:
          // Orden original del HTML
          sorted.sort((a, b) => products.indexOf(a) - products.indexOf(b));
          break;
      }

      return sorted;
    };

    /* ----------------------------------------------------
       6. APLICAR FILTROS + SORT
       ---------------------------------------------------- */
    const applyFilters = () => {
      const filtered = products.filter((p) =>
        matchesSearch(p, state.search) && matchesCategory(p, state.category)
      );

      const sorted = sortProducts(filtered, state.sort);

      // Ocultar todas las cards primero
      products.forEach((p) => {
        p.el.classList.add('is-hidden');
        p.el.classList.remove('is-visible');
      });

      // Reordenar en el DOM y mostrar las que pasan el filtro
      sorted.forEach((product) => {
        product.el.classList.remove('is-hidden');
        // Mover al final del grid (reorder)
        grid.appendChild(product.el);
      });

      // Forzar un frame para que la animación de reveal se vea
      requestAnimationFrame(() => {
        sorted.forEach((product) => {
          product.el.classList.add('is-visible');
        });
      });

      // Actualizar contadores
      updateCounters(filtered.length);
      updateEmptyState(filtered.length);
      updateChipCounts();

      // Emitir evento
      document.dispatchEvent(new CustomEvent('catalog:filter', {
        detail: {
          filters: { ...state },
          visibleCount: filtered.length,
          totalCount: products.length
        }
      }));
    };

    /* ----------------------------------------------------
       7. ACTUALIZAR CONTADORES
       ---------------------------------------------------- */
    const updateCounters = (visible) => {
      if (visibleCount) visibleCount.textContent = visible;
      if (totalCount) totalCount.textContent = products.length;
    };

    const updateEmptyState = (visible) => {
      if (!emptyState) return;
      if (visible === 0) {
        emptyState.hidden = false;
        grid.hidden = true;
      } else {
        emptyState.hidden = true;
        grid.hidden = false;
      }
    };

    /* ----------------------------------------------------
       8. ACTUALIZAR CONTADOR DE CADA CHIP
       ---------------------------------------------------- */
    const updateChipCounts = () => {
      const counts = { all: products.length };

      // Resetear contadores
      products.forEach((p) => {
        p.categories.forEach((cat) => {
          counts[cat] = (counts[cat] || 0) + 1;
        });
      });

      document.querySelectorAll('.chip-count').forEach((el) => {
        const key = el.dataset.count;
        if (key) el.textContent = counts[key] || 0;
      });
    };

    /* ----------------------------------------------------
       9. EVENTOS — Búsqueda
       ---------------------------------------------------- */
    if (searchInput) {
      const handleSearch = window.LNS.debounce((value) => {
        state.search = value;
        applyFilters();
      }, 250);

      searchInput.addEventListener('input', (e) => {
        handleSearch(e.target.value);
      });

      // Limpiar con ESC
      searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
          searchInput.value = '';
          state.search = '';
          applyFilters();
        }
      });
    }

    /* ----------------------------------------------------
       10. EVENTOS — Chips de categoría
       ---------------------------------------------------- */
    chips.forEach((chip) => {
      chip.addEventListener('click', () => {
        const category = chip.dataset.filter || 'all';

        // Actualizar estado visual
        chips.forEach((c) => c.classList.toggle('is-active', c === chip));

        state.category = category;
        applyFilters();
      });
    });

    /* ----------------------------------------------------
       11. EVENTOS — Sort
       ---------------------------------------------------- */
    if (sortSelect) {
      sortSelect.addEventListener('change', (e) => {
        state.sort = e.target.value;
        applyFilters();
      });
    }

    /* ----------------------------------------------------
       12. EVENTOS — Limpiar filtros
       ---------------------------------------------------- */
    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        state.search = '';
        state.category = 'all';
        state.sort = 'recomendados';

        if (searchInput) searchInput.value = '';
        if (sortSelect) sortSelect.value = 'recomendados';

        chips.forEach((c) => {
          c.classList.toggle('is-active', c.dataset.filter === 'all');
        });

        applyFilters();
      });
    }

    /* ----------------------------------------------------
       13. QTY STEPPER POR CARD
       Cada card tiene su propio contador local (1-10).
       ---------------------------------------------------- */
    const initCardQty = (card) => {
  const stepper = card.querySelector('[data-card-qty]');
  if (!stepper) return;

  // Guard: prevenir doble inicialización
  if (stepper.dataset.qtyInitialized === 'true') return;
  stepper.dataset.qtyInitialized = 'true';

  const valueEl = stepper.querySelector('[data-qty-value]');
      const btns = stepper.querySelectorAll('[data-qty-action]');

      btns.forEach((btn) => {
        btn.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();

          const action = btn.dataset.qtyAction;
          let current = parseInt(valueEl.textContent, 10) || 1;

          if (action === 'increase') current = Math.min(current + 1, 10);
          else if (action === 'decrease') current = Math.max(current - 1, 1);

          valueEl.textContent = current;
        });
      });
    };

    cards.forEach((card) => initCardQty(card));

          /* ----------------------------------------------------
       14. AÑADIR AL CARRITO DESDE CARD
       ---------------------------------------------------- */
    if (window._catalogAddToCartBound) return;
    window._catalogAddToCartBound = true;

    document.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-add-to-cart-card]');
      if (!btn) return;

      e.preventDefault();

      const card = btn.closest('[data-product-card]');
      if (!card) return;

      const id = card.dataset.productId;
      const name = card.dataset.productName;
      const price = parseInt(card.dataset.productPrice, 10);
      const image = card.dataset.productImage || null;

      // Cantidad del stepper local
      const qtyEl = card.querySelector('[data-qty-value]');
      const quantity = qtyEl ? parseInt(qtyEl.textContent, 10) || 1 : 1;

      if (!id || !price) return;

      // Llamar al carrito global
      if (window.LNS?.cart?.addItem) {
        window.LNS.cart.addItem({
          id,
          name,
          price,
          quantity,
          variant: 'single',
          image
        });

        // Resetear el stepper local
        if (qtyEl) qtyEl.textContent = '1';

        // Feedback visual en el botón
        animateButtonFeedback(btn);

        // Abrir el drawer tras un pequeño delay
        setTimeout(() => {
          if (window.LNS?.cart?.open) window.LNS.cart.open();
        }, 400);

      } else {
        console.warn('[catalog] Cart no disponible');
      }
    });

    /* ----------------------------------------------------
       15. FEEDBACK VISUAL DEL BOTÓN AL AÑADIR
       ---------------------------------------------------- */
    const animateButtonFeedback = (btn) => {
  const original = btn.innerHTML;
  btn.disabled = true;

  btn.innerHTML = `
    <svg class="icon icon-sm" aria-hidden="true"><use href="assets/icons/sprite.svg#icon-check"></use></svg>
    Añadido
  `;
  btn.classList.add('is-added');

  setTimeout(() => {
    btn.innerHTML = original;
    btn.disabled = false;
    btn.classList.remove('is-added');
  }, 1400);
};

    /* ----------------------------------------------------
       16. FAVORITOS (delegado en main.js, pero por si acaso)
       Ya está manejado por main.js, no duplicamos.
       ---------------------------------------------------- */

    /* ----------------------------------------------------
       17. INTERSECTION OBSERVER para el reveal inicial
       ---------------------------------------------------- */
    if ('IntersectionObserver' in window && !window.LNS?.device?.prefersReducedMotion?.()) {
      const revealObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add('is-visible');
              revealObserver.unobserve(entry.target);
            }
          });
        },
        {
          threshold: 0.1,
          rootMargin: '0px 0px -40px 0px'
        }
      );

      cards.forEach((card) => revealObserver.observe(card));
    } else {
      // Sin observer, mostrar todas
      cards.forEach((card) => card.classList.add('is-visible'));
    }

    /* ----------------------------------------------------
       18. ESTADO INICIAL
       ---------------------------------------------------- */
    updateChipCounts();
    applyFilters();

    /* ----------------------------------------------------
       19. DEEP LINK desde URL (?cat=axilas&q=aclarador)
       ---------------------------------------------------- */
    const params = new URLSearchParams(window.location.search);

    const catParam = params.get('cat');
    if (catParam) {
      const targetChip = Array.from(chips).find((c) => c.dataset.filter === catParam);
      if (targetChip) targetChip.click();
    }

    const qParam = params.get('q');
    if (qParam && searchInput) {
      searchInput.value = qParam;
      state.search = qParam;
      applyFilters();
    }

  };

  window.LNS?.ready(init) ?? document.addEventListener('DOMContentLoaded', init);

})();