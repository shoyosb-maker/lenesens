/* ============================================================
   ARTÍCULO — Lógica compartida de los artículos de la revista
   Lenesens Hydralight
   - Barra de progreso de lectura
   - Botón de compartir (Web Share API + copiar)
   - Cálculo automático de tiempo de lectura
   - Marcar artículo activo en navegación
   ============================================================ */

'use strict';

(function initArticle() {

  const init = () => {
    initReadProgress();
    initShareButtons();
    initReadTime();
    initExternalLinkTracking();
  };

  /* =========================================================
     1. BARRA DE PROGRESO DE LECTURA
     ========================================================= */
  function initReadProgress() {
    const article = document.querySelector('.article-body');
    if (!article) return;

    // Crear barra de progreso flotante
    const bar = document.createElement('div');
    bar.className = 'article-progress-bar';
    bar.setAttribute('role', 'progressbar');
    bar.setAttribute('aria-label', 'Progreso de lectura');
    bar.setAttribute('aria-valuemin', '0');
    bar.setAttribute('aria-valuemax', '100');
    bar.setAttribute('aria-valuenow', '0');
    bar.innerHTML = '<div class="article-progress-fill"></div>';
    document.body.appendChild(bar);

    const fill = bar.querySelector('.article-progress-fill');

    const update = () => {
      const rect = article.getBoundingClientRect();
      const articleTop = rect.top + window.scrollY;
      const articleHeight = rect.height;
      const viewportHeight = window.innerHeight;
      const scrolled = window.scrollY - articleTop + viewportHeight * 0.3;
      const percent = Math.max(0, Math.min(100, (scrolled / articleHeight) * 100));

      fill.style.width = percent + '%';
      bar.setAttribute('aria-valuenow', Math.round(percent));
    };

    window.addEventListener('scroll', window.LNS.throttle(update, 50), { passive: true });
    update();
  }

  /* =========================================================
     2. BOTONES DE COMPARTIR
     ========================================================= */
  function initShareButtons() {
    const shareButtons = document.querySelectorAll('[data-share]');
    if (!shareButtons.length) return;

    const pageUrl = window.location.href;
    const pageTitle = document.title;

    shareButtons.forEach((btn) => {
      btn.addEventListener('click', async () => {
        const type = btn.dataset.share;

        if (type === 'native') {
          // Web Share API
          if (navigator.share) {
            try {
              await navigator.share({
                title: pageTitle,
                text: 'Mira este artículo de Lenesens Skin Journal',
                url: pageUrl
              });
              return;
            } catch (err) {
              // Usuario canceló, no hacemos nada
              if (err.name === 'AbortError') return;
            }
          }
          // Fallback: copiar al portapapeles
          copyToClipboard(pageUrl);
          return;
        }

        if (type === 'whatsapp') {
          const url = `https://wa.me/?text=${encodeURIComponent(pageTitle + ' ' + pageUrl)}`;
          window.open(url, '_blank', 'noopener,noreferrer');
          return;
        }

        if (type === 'facebook') {
          const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(pageUrl)}`;
          window.open(url, '_blank', 'noopener,noreferrer');
          return;
        }

        if (type === 'twitter') {
          const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(pageTitle)}&url=${encodeURIComponent(pageUrl)}`;
          window.open(url, '_blank', 'noopener,noreferrer');
          return;
        }

        if (type === 'copy') {
          copyToClipboard(pageUrl);
          return;
        }
      });
    });
  }

  /* ---------------------------------------------------------
     Copiar al portapapeles con feedback
     --------------------------------------------------------- */
  async function copyToClipboard(text) {
    let success = false;

    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
        success = true;
      } else {
        // Fallback
        const input = document.createElement('textarea');
        input.value = text;
        input.style.position = 'fixed';
        input.style.opacity = '0';
        document.body.appendChild(input);
        input.select();
        success = document.execCommand('copy');
        document.body.removeChild(input);
      }
    } catch (e) {
      success = false;
    }

    if (window.LNS?.toast) {
      if (success) {
        window.LNS.toast.success('Enlace copiado al portapapeles');
      } else {
        window.LNS.toast.error('No se pudo copiar el enlace');
      }
    }
  }

  /* =========================================================
     3. CÁLCULO DE TIEMPO DE LECTURA
     Cuenta palabras del article-body y muestra "X min de lectura"
     ========================================================= */
  function initReadTime() {
    const article = document.querySelector('.article-body');
    const timeEl = document.querySelector('[data-read-time]');
    if (!article || !timeEl) return;

    // Contar palabras (ignorando elementos no textuales)
    const clone = article.cloneNode(true);
    // Eliminar bloques no textuales
    clone.querySelectorAll('script, style, figure, .article-product-cta, .article-callout').forEach((el) => el.remove());
    const text = clone.textContent || '';
    const words = text.trim().split(/\s+/).filter(Boolean).length;

    // 200 palabras por minuto
    const minutes = Math.max(1, Math.round(words / 200));

    timeEl.textContent = `${minutes} min de lectura`;
    timeEl.setAttribute('data-calculated', 'true');
  }

  /* =========================================================
     4. TRACKING DE LINKS EXTERNOS
     Añade rel="noopener noreferrer" a links externos
     ========================================================= */
  function initExternalLinkTracking() {
    const links = document.querySelectorAll('a[href^="http"]');
    const currentHost = window.location.hostname;

    links.forEach((link) => {
      try {
        const url = new URL(link.href);
        if (url.hostname !== currentHost) {
          link.setAttribute('target', '_blank');
          link.setAttribute('rel', 'noopener noreferrer');
        }
      } catch (e) {
        // URL inválida, ignorar
      }
    });
  }

  /* --------------------------------------------------------
     ARRANQUE
     -------------------------------------------------------- */
  window.LNS?.ready(init) ?? document.addEventListener('DOMContentLoaded', init);

})();