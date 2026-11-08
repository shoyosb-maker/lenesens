/* ============================================================
   ORBITAL LANDING — Escenario audiovisual + carrusel
   Lenesens Hydralight
   ============================================================ */

'use strict';

(function initOrbitalLanding() {

  const init = () => {
    const stage = document.getElementById('orbital');
    if (!stage) return;

    /* ----------------------------------------------------
       Referencias
       ---------------------------------------------------- */
    const night = document.getElementById('orbital-video-night');
    const bodyVideo = document.getElementById('orbital-video-body');
    const sakura = document.getElementById('orbital-video-sakura');

    const currentEl = document.querySelector('[data-slide-current]');
    const totalEl = document.querySelector('[data-slide-total]');
    const announceEl = document.querySelector('[data-slide-announce]');
    const prevBtn = document.querySelector('[data-slide-prev]');
    const nextBtn = document.querySelector('[data-slide-next]');

    const SLIDES = [
      { media: 'video', video: night, label: 'orbital.slides.night' },
      { media: 'video', video: bodyVideo, label: 'orbital.slides.body' },
      { media: 'video', video: sakura, label: 'orbital.slides.sakura' }
    ];
    const total = SLIDES.length;

    const videos = SLIDES.map((slide) => slide.video).filter(Boolean);

    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    let reduceMotion = motionQuery.matches;
    let index = 0;

    const t = (key, vars) => window.LNS?.i18n?.get?.(key, vars) || '';

    /* ----------------------------------------------------
       Video
       ---------------------------------------------------- */
    const play = (video) => {
      if (!video || reduceMotion || window.LNS?.orbitalRevealActive) return;
      const attempt = video.play();
      if (attempt && typeof attempt.catch === 'function') attempt.catch(() => {});
    };

    const pause = (video) => {
      if (video && !video.paused) video.pause();
    };

    /* ----------------------------------------------------
       Marca de cierre del ritual (el CSS solo la muestra en móvil)
       Aparece desvanecida en los últimos segundos del video 2.
       ---------------------------------------------------- */
    const sign = document.querySelector('[data-orbital-sign]');
    const SIGN_LEAD = 1.7;

    const updateSign = () => {
      if (!sign) return;

      const isRitualSlide = SLIDES[index]?.video === bodyVideo;
      const duration = bodyVideo?.duration;

      let visible = false;
      if (isRitualSlide && Number.isFinite(duration) && duration > 0) {
        const remaining = duration - bodyVideo.currentTime;
        visible = remaining > 0 && remaining <= SIGN_LEAD;
      }

      sign.classList.toggle('is-visible', visible);
    };

    bodyVideo?.addEventListener('timeupdate', updateSign);
    bodyVideo?.addEventListener('seeked', updateSign);
    bodyVideo?.addEventListener('loadedmetadata', updateSign);
    bodyVideo?.addEventListener('emptied', updateSign);

    /* ----------------------------------------------------
       Render del slide activo
       ---------------------------------------------------- */
    const announce = () => {
      if (!announceEl) return;

      announceEl.textContent = t('orbital.slideAnnounce', {
        current: String(index + 1),
        total: String(total),
        label: t(SLIDES[index].label)
      });
    };

    const render = () => {
      const slide = SLIDES[index];

      stage.dataset.slide = String(index + 1);
      stage.dataset.media = slide.media;

      videos.forEach((video) => {
        const isCurrent = video === slide.video;
        video.classList.toggle('is-active', isCurrent);

        // El poster de cada slide se pide solo cuando ese slide entra,
        // para no descargar los tres al abrir la página.
        if (isCurrent && video.dataset.poster && !video.getAttribute('poster')) {
          video.setAttribute('poster', video.dataset.poster);
        }

        if (isCurrent) play(video);
        else pause(video);
      });

      if (currentEl) currentEl.textContent = String(index + 1).padStart(2, '0');
      if (totalEl) totalEl.textContent = String(total).padStart(2, '0');

      updateSign();
      announce();
    };

    const goTo = (next) => {
      index = (next + total) % total;
      render();
    };

    /* ----------------------------------------------------
       Controles del carrusel
       ---------------------------------------------------- */
    prevBtn?.addEventListener('click', () => goTo(index - 1));
    nextBtn?.addEventListener('click', () => goTo(index + 1));

    document.addEventListener('keydown', (event) => {
      if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey) return;
      if (window.LNS?.orbitalRevealActive) return;

      const tag = (event.target?.tagName || '').toLowerCase();
      if (tag === 'input' || tag === 'textarea' || tag === 'select') return;

      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        goTo(index - 1);
      } else if (event.key === 'ArrowRight') {
        event.preventDefault();
        goTo(index + 1);
      }
    });

    // Los mensajes del lector de pantalla siguen el idioma activo.
    document.addEventListener('language:change', announce);

    /* ----------------------------------------------------
       Pausa cuando la pestaña no está visible
       ---------------------------------------------------- */
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        videos.forEach(pause);
      } else {
        render();
      }
    });

    /* ----------------------------------------------------
       Respeto por "movimiento reducido"
       ---------------------------------------------------- */
    motionQuery.addEventListener?.('change', (event) => {
      reduceMotion = event.matches;

      if (reduceMotion) {
        videos.forEach(pause);
      } else {
        render();
      }
    });

    /* ----------------------------------------------------
       Selector de moneda (preferencia compartida con el sitio)
       ---------------------------------------------------- */
    const CURRENCY_KEY = 'lenesens_currency';
    const currencyBtns = document.querySelectorAll('[data-currency]');

    const setCurrency = (currency, persist) => {
      currencyBtns.forEach((btn) => {
        const active = btn.dataset.currency === currency;
        btn.classList.toggle('is-active', active);
        btn.setAttribute('aria-pressed', String(active));
      });

      if (persist) window.LNS?.storage?.set?.(CURRENCY_KEY, currency);

      document.dispatchEvent(new CustomEvent('currency:change', {
        detail: { currency }
      }));
    };

    const savedCurrency = window.LNS?.storage?.get?.(CURRENCY_KEY, 'COP') || 'COP';
    setCurrency(savedCurrency, false);

    currencyBtns.forEach((btn) => {
      btn.addEventListener('click', () => setCurrency(btn.dataset.currency, true));
    });

    /* ----------------------------------------------------
       Estado inicial
       ---------------------------------------------------- */
    if (totalEl) totalEl.textContent = String(total).padStart(2, '0');
    render();
  };

  window.LNS?.ready(init) ?? document.addEventListener('DOMContentLoaded', init);

})();
