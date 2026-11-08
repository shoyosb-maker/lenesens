/* ============================================================
   ORBITAL REVEAL — Segunda escena recorrida con el scroll
   Lenesens Hydralight
   El video se mantiene fijo mientras el scroll avanza su tiempo.
   ============================================================ */

'use strict';

(function initOrbitalReveal() {

  const init = () => {
    const section = document.querySelector('[data-orbital-reveal]');
    if (!section) return;

    const stage = section.querySelector('[data-reveal-stage]');
    const video = section.querySelector('[data-reveal-video]');
    const canvas = section.querySelector('[data-reveal-canvas]');
    const backdrop = section.querySelector('[data-reveal-backdrop]');
    if (!stage || !video) return;

    const context = canvas?.getContext('2d') || null;
    const backdropContext = backdrop?.getContext('2d') || null;
    const hero = document.getElementById('orbital');
    const heroVideos = hero ? Array.from(hero.querySelectorAll('.orbital-video')) : [];
    const orbit = document.querySelector('.orbital-orbit');
    const routeButtons = Array.from(section.querySelectorAll('[data-reveal-jump]'));
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

    let duration = 0;
    let loaded = false;
    let loadedSource = null;
    let ready = false;
    let frame = 0;
    let heroPaused = false;
    let frameCallbackRegistered = false;
    let routeAnimation = 0;
    let routeScrollBehavior = null;
    let playbackMode = null;
    let playbackFrame = 0;
    let pendingPlayback = null;
    let lockedScrollY = null;
    let orbitHideTimer = 0;
    let endStillLoaded = null;

    const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
    const MAX_CANVAS_PIXELS = 2500000;

    const getMetrics = () => {
      const stageHeight = stage.offsetHeight || window.innerHeight;
      const scrollable = Math.max(1, section.offsetHeight - stageHeight);
      const compact = window.matchMedia('(max-width: 900px)').matches;
      const hold = Math.min(stageHeight * (compact ? 0.4 : 0.45), scrollable);

      return {
        stageHeight,
        hold,
        anim: Math.max(1, scrollable - hold)
      };
    };

    const sizeCanvas = (targetCanvas, targetContext, rect, dprCap) => {
      const dpr = Math.min(window.devicePixelRatio || 1, dprCap);
      let pixelWidth = Math.max(1, Math.round(rect.width * dpr));
      let pixelHeight = Math.max(1, Math.round(rect.height * dpr));

      // En pantallas 4K no hace falta un back-buffer mayor que la fuente.
      const pixelArea = pixelWidth * pixelHeight;
      if (pixelArea > MAX_CANVAS_PIXELS) {
        const ratio = Math.sqrt(MAX_CANVAS_PIXELS / pixelArea);
        pixelWidth = Math.max(1, Math.round(pixelWidth * ratio));
        pixelHeight = Math.max(1, Math.round(pixelHeight * ratio));
      }

      if (targetCanvas.width !== pixelWidth || targetCanvas.height !== pixelHeight) {
        targetCanvas.width = pixelWidth;
        targetCanvas.height = pixelHeight;
        targetContext.imageSmoothingEnabled = true;
        targetContext.imageSmoothingQuality = 'high';
      }
    };

    const drawFrame = () => {
      if (!context || video.readyState < 2) return;

      const videoWidth = video.videoWidth;
      const videoHeight = video.videoHeight;
      if (!videoWidth || !videoHeight) return;

      const rect = stage.getBoundingClientRect();

      sizeCanvas(canvas, context, rect, 2);
      const canvasWidth = canvas.width;
      const canvasHeight = canvas.height;
      const portrait = videoHeight > videoWidth;

      /* En vertical, el master móvil ya está compuesto para pantalla completa. */
      const scale = portrait
        ? Math.max(canvasWidth / videoWidth, canvasHeight / videoHeight)
        : Math.min(canvasWidth / videoWidth, canvasHeight / videoHeight);
      const drawWidth = videoWidth * scale;
      const drawHeight = videoHeight * scale;

      context.clearRect(0, 0, canvasWidth, canvasHeight);
      context.drawImage(
        video,
        (canvasWidth - drawWidth) / 2,
        (canvasHeight - drawHeight) / 2,
        drawWidth,
        drawHeight
      );

      if (portrait) {
        if (backdropContext) {
          sizeCanvas(backdrop, backdropContext, rect, 1);
          backdropContext.clearRect(0, 0, backdrop.width, backdrop.height);
        }
        return;
      }

      /* Relleno desenfocado para los laterales del encuadre horizontal. */
      if (!backdropContext) return;

      sizeCanvas(backdrop, backdropContext, rect, 1);
      const backdropWidth = backdrop.width;
      const backdropHeight = backdrop.height;
      const coverScale = Math.max(backdropWidth / videoWidth, backdropHeight / videoHeight);
      const coverWidth = videoWidth * coverScale;
      const coverHeight = videoHeight * coverScale;

      backdropContext.clearRect(0, 0, backdropWidth, backdropHeight);
      backdropContext.drawImage(
        video,
        (backdropWidth - coverWidth) / 2,
        (backdropHeight - coverHeight) / 2,
        coverWidth,
        coverHeight
      );
    };

    const getSourceKind = () => (
      window.matchMedia('(max-width: 768px)').matches ? 'mobile' : 'desktop'
    );

    // El still de alta definición del último frame solo se descarga cuando
    // la escena ya está por reproducirse, no al abrir la página.
    const loadEndStill = () => {
      if (endStillLoaded !== null) return;
      const picture = section.querySelector('.orbital-reveal-end')?.closest('picture');
      const image = picture?.querySelector('img.orbital-reveal-end');
      endStillLoaded = !!image;
      if (!image || image.getAttribute('src')) return;

      picture.querySelectorAll('source[data-srcset]').forEach((source) => {
        source.setAttribute('srcset', source.dataset.srcset);
      });
      image.setAttribute('src', image.dataset.src);
    };

    const loadVideo = () => {
      if (loaded) return;

      const kind = getSourceKind();
      const source = kind === 'mobile' ? video.dataset.srcMobile : video.dataset.srcDesktop;
      if (!source) return;

      loaded = true;
      loadedSource = kind;

      loadEndStill();

      try {
        video.src = source;
        video.load();
      } catch (error) {
        /* el poster sigue visible */
      }
    };

    const markReady = () => {
      if (!loaded || video.readyState < 2) return;
      drawFrame();
      if (ready) return;
      ready = true;
      stage.classList.add('is-video-ready');
      update();
    };

    const watchVideoFrames = () => {
      if (frameCallbackRegistered || !video.requestVideoFrameCallback) return;
      frameCallbackRegistered = true;

      const onFrame = () => {
        if (!document.hidden) drawFrame();
        video.requestVideoFrameCallback(onFrame);
      };

      video.requestVideoFrameCallback(onFrame);
    };

    const syncHero = (revealActive) => {
      window.LNS = window.LNS || {};
      window.LNS.orbitalRevealActive = revealActive;

      if (revealActive) {
        if (heroPaused) return;
        heroPaused = true;

        heroVideos.forEach((heroVideo) => {
          try {
            if (!heroVideo.paused) heroVideo.pause();
          } catch (error) {
            /* sin video activo */
          }
        });
        return;
      }

      if (!heroPaused) return;
      heroPaused = false;

      if (motionQuery.matches) return;

      const activeVideo = hero?.querySelector('.orbital-video.is-active');
      if (!activeVideo) return;

      const attempt = activeVideo.play();
      if (attempt && typeof attempt.catch === 'function') attempt.catch(() => {});
    };

    const applyTimelineState = (progress, part) => {
      const partTwo = part === 2;

      stage.style.setProperty('--reveal-progress', progress.toFixed(4));
      stage.classList.toggle('is-part-one', !partTwo);
      stage.classList.toggle('is-part-two', partTwo);
      stage.classList.toggle('is-started', partTwo || progress > 0.001);
      stage.classList.toggle('is-complete', progress > 0.9);
      stage.classList.toggle('is-at-end', partTwo && progress >= 0.999);

      routeButtons.forEach((button) => {
        const isStart = button.dataset.revealJump === 'start';
        button.classList.toggle('is-active', isStart ? !partTwo : partTwo);
      });
    };

    // El menú se desvanece al hacer scroll y reaparece al llegar al 2.º video.
    // Al volver hacia arriba se oculta primero (en su sitio de arriba a la
    // derecha) y solo después vuelve a la posición del hero, sin verse saltar.
    const syncOrbit = (inReveal) => {
      if (!orbit) return;
      const hidden = !inReveal && window.scrollY > Math.max(48, window.innerHeight * 0.06);

      if (inReveal) {
        window.clearTimeout(orbitHideTimer);
        orbitHideTimer = 0;
        orbit.classList.remove('is-scrolled');
        orbit.classList.add('is-top');
        return;
      }

      orbit.classList.toggle('is-scrolled', hidden);

      if (!orbit.classList.contains('is-top')) return;

      if (!hidden) {
        orbit.classList.remove('is-top');
        return;
      }

      if (!orbitHideTimer) {
        orbitHideTimer = window.setTimeout(() => {
          orbitHideTimer = 0;
          if (orbit.classList.contains('is-scrolled')) orbit.classList.remove('is-top');
        }, 380);
      }
    };

    function update() {
      frame = 0;

      const sectionTop = section.getBoundingClientRect().top;
      const metrics = getMetrics();

      // En escritorio: a los costados durante el hero y arriba a la derecha
      // al entrar en la segunda escena. En móvil el CSS ignora esta clase.
      syncOrbit(sectionTop <= 0);

      if (document.hidden) return;

      // El video solo empieza a descargarse cuando la escena entra en pantalla.
      if (!loaded && !motionQuery.matches && sectionTop < window.innerHeight) loadVideo();

      const pinned = -sectionTop;
      const inPartTwo = pinned > metrics.hold + 1;
      const progress = duration > 0
        ? clamp(video.currentTime / duration, 0, 1)
        : 0;

      // Mientras la animación corre, la página queda bloqueada y el scroll
      // no puede mover el tiempo del video ni cambiar de parte.
      if (playbackMode) {
        syncHero(sectionTop < metrics.stageHeight * 0.5);
        return;
      }

      if (duration > 0 && video.readyState >= 1) {
        const atStart = video.currentTime <= 0.02;
        const atEnd = video.ended || video.currentTime >= duration - 0.06;

        if (inPartTwo && !atEnd) {
          playForward();
          syncHero(sectionTop < metrics.stageHeight * 0.5);
          return;
        }

        if (!inPartTwo && !atStart) {
          playReverse();
          syncHero(sectionTop < metrics.stageHeight * 0.5);
          return;
        }
      }

      applyTimelineState(progress, inPartTwo ? 2 : 1);
      syncHero(sectionTop < metrics.stageHeight * 0.5);
    }

    const requestUpdate = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(update);
    };

    const restoreRouteScrollBehavior = () => {
      if (routeScrollBehavior === null) return;
      document.documentElement.style.scrollBehavior = routeScrollBehavior;
      routeScrollBehavior = null;
    };

    const cancelRouteScroll = () => {
      if (routeAnimation) {
        window.cancelAnimationFrame(routeAnimation);
        routeAnimation = 0;
      }
      restoreRouteScrollBehavior();
    };

    const scrollToTarget = (targetY) => {
      cancelRouteScroll();

      const maxScroll = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
      const destination = clamp(targetY, 0, maxScroll);
      const startY = window.scrollY;
      const distance = destination - startY;

      if (Math.abs(distance) < 2) return;

      // El CSS global usa scroll-behavior:smooth; durante este recorrido
      // lo desactivamos para que cada frame sea exacto y no se acumule lag.
      routeScrollBehavior = document.documentElement.style.scrollBehavior;
      document.documentElement.style.scrollBehavior = 'auto';

      if (motionQuery.matches) {
        document.scrollingElement.scrollTop = destination;
        restoreRouteScrollBehavior();
        requestUpdate();
        return;
      }

      const duration = clamp(Math.abs(distance) * 1.6, 750, 3000);
      const startedAt = performance.now();
      const ease = (t) => (
        t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
      );

      const step = (now) => {
        const t = clamp((now - startedAt) / duration, 0, 1);
        document.scrollingElement.scrollTop = startY + distance * ease(t);

        if (t < 1) {
          routeAnimation = window.requestAnimationFrame(step);
        } else {
          routeAnimation = 0;
          document.scrollingElement.scrollTop = destination;
          restoreRouteScrollBehavior();
        }
      };

      routeAnimation = window.requestAnimationFrame(step);
    };

    const lockScroll = () => {
      if (lockedScrollY !== null) return;
      lockedScrollY = window.scrollY;
      document.documentElement.classList.add('is-reveal-scroll-locked');
    };

    const restoreScrollPosition = (target) => {
      if (Math.abs(window.scrollY - target) <= 2) return;

      const previous = document.documentElement.style.scrollBehavior;
      document.documentElement.style.scrollBehavior = 'auto';
      document.scrollingElement.scrollTop = target;
      document.documentElement.style.scrollBehavior = previous;
    };

    const unlockScroll = (restore = true) => {
      if (lockedScrollY === null) return;

      const target = lockedScrollY;
      lockedScrollY = null;
      document.documentElement.classList.remove('is-reveal-scroll-locked');

      if (!restore) return;

      const keepPosition = () => {
        if (lockedScrollY === null && !playbackMode) restoreScrollPosition(target);
      };

      keepPosition();
      window.requestAnimationFrame(keepPosition);
    };

    const stopPlayback = (restoreScroll = true) => {
      if (playbackFrame) {
        window.cancelAnimationFrame(playbackFrame);
        playbackFrame = 0;
      }
      if (playbackMode) {
        try {
          video.pause();
        } catch (error) {
          /* sin video activo */
        }
      }
      playbackMode = null;
      pendingPlayback = null;
      unlockScroll(restoreScroll);
    };

    // Si el viewport cruza el breakpoint (rotación del teléfono o resize),
    // el master vertical y el horizontal no son intercambiables: se recarga.
    const syncSource = () => {
      if (!loaded) return;

      const kind = getSourceKind();
      if (kind === loadedSource) return;

      stopPlayback();
      loaded = false;
      loadedSource = null;
      ready = false;
      duration = 0;
      stage.classList.remove('is-video-ready');

      try {
        video.removeAttribute('src');
        video.load();
      } catch (error) {
        /* sin video activo */
      }

      loadVideo();
    };

    const alignToPart = (part) => {
      const metrics = getMetrics();
      const maxScroll = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
      const target = clamp(
        part === 2 ? section.offsetTop + metrics.hold + 2 : section.offsetTop,
        0,
        maxScroll
      );

      if (Math.abs(window.scrollY - target) < 2) return;

      cancelRouteScroll();
      const previous = document.documentElement.style.scrollBehavior;
      document.documentElement.style.scrollBehavior = 'auto';
      document.scrollingElement.scrollTop = target;
      document.documentElement.style.scrollBehavior = previous;
    };

    const finishPlayback = (progress, part) => {
      stopPlayback();
      applyTimelineState(progress, part);
    };

    const startForwardScrub = () => {
      if (duration <= 0) return;

      playbackMode = 'forward';
      const from = video.currentTime;
      const startedAt = performance.now();
      const durationMs = Math.max(350, (duration - from) * 1000);

      const step = (now) => {
        if (playbackMode !== 'forward') return;

        const t = clamp((now - startedAt) / durationMs, 0, 1);
        const time = from + (duration - from) * t;
        const progress = clamp(time / duration, 0, 1);

        try {
          video.currentTime = time;
        } catch (error) {
          /* sin seek disponible */
        }

        applyTimelineState(progress, 2);
        drawFrame();

        if (t < 1) {
          playbackFrame = window.requestAnimationFrame(step);
        } else {
          finishPlayback(1, 2);
        }
      };

      playbackFrame = window.requestAnimationFrame(step);
    };

    const playForward = () => {
      cancelRouteScroll();
      stopPlayback();

      if (!loaded) loadVideo();
      if (duration <= 0) {
        pendingPlayback = 'forward';
        return;
      }

      if (video.currentTime >= duration - 0.06) {
        try {
          video.currentTime = 0;
        } catch (error) {
          /* sin seek disponible */
        }
        applyTimelineState(0, 2);
      }

      playbackMode = 'forward';
      lockScroll();
      syncHero(true);
      applyTimelineState(clamp(video.currentTime / duration, 0, 1), 2);

      const playPromise = video.play();
      if (playPromise && typeof playPromise.catch === 'function') {
        playPromise.catch(() => {
          if (playbackMode !== 'forward') return;
          if (playbackFrame) {
            window.cancelAnimationFrame(playbackFrame);
            playbackFrame = 0;
          }
          startForwardScrub();
        });
      }

      const step = () => {
        if (playbackMode !== 'forward') return;

        const progress = clamp(video.currentTime / duration, 0, 1);
        applyTimelineState(progress, 2);
        drawFrame();

        if (progress >= 0.998) {
          finishPlayback(1, 2);
          return;
        }

        playbackFrame = window.requestAnimationFrame(step);
      };

      playbackFrame = window.requestAnimationFrame(step);
    };

    const playReverse = () => {
      cancelRouteScroll();
      stopPlayback();

      if (!loaded) loadVideo();
      if (duration <= 0) {
        pendingPlayback = 'reverse';
        return;
      }

      const from = video.currentTime;
      if (from <= 0.02) {
        finishPlayback(0, 1);
        return;
      }

      playbackMode = 'reverse';
      lockScroll();
      syncHero(true);

      const startedAt = performance.now();
      const durationMs = Math.max(450, from * 1000);

      const step = (now) => {
        if (playbackMode !== 'reverse') return;

        const t = clamp((now - startedAt) / durationMs, 0, 1);
        const time = from * (1 - t);
        const progress = clamp(time / duration, 0, 1);

        try {
          video.currentTime = time;
        } catch (error) {
          /* sin seek disponible */
        }

        // Al volver, el control 01 queda activo desde el inicio; la línea
        // del 02 es la que se va vaciando con el reverse.
        applyTimelineState(progress, 1);
        drawFrame();

        if (t < 1) {
          playbackFrame = window.requestAnimationFrame(step);
        } else {
          finishPlayback(0, 1);
        }
      };

      playbackFrame = window.requestAnimationFrame(step);
    };

    video.addEventListener('loadedmetadata', () => {
      duration = Number.isFinite(video.duration) ? video.duration : 0;
      update();

      if (pendingPlayback) {
        const direction = pendingPlayback;
        pendingPlayback = null;
        if (direction === 'forward') playForward();
        else playReverse();
      }
    });

    video.addEventListener('loadeddata', () => {
      try {
        if (video.currentTime === 0) video.currentTime = 0.001;
      } catch (error) {
        /* sin seek disponible */
      }
      watchVideoFrames();
      window.requestAnimationFrame(markReady);
    });

    video.addEventListener('seeked', markReady);
    video.addEventListener('error', () => {
      stage.classList.add('is-video-error');
      stopPlayback();
    });
    video.addEventListener('ended', () => {
      if (playbackMode === 'forward') finishPlayback(1, 2);
    });

    window.addEventListener('scroll', requestUpdate, { passive: true });

    // Si el navegador conserva inercia o un scroll suave en curso, se ancla
    // exactamente a la posición donde comenzó la animación.
    window.addEventListener('scroll', () => {
      if (lockedScrollY === null) return;
      if (Math.abs(window.scrollY - lockedScrollY) > 1) {
        restoreScrollPosition(lockedScrollY);
      }
    }, { passive: true });

    const canScrollOverlay = (target) => (
      target instanceof Element
      && Boolean(target.closest('.orbital-cart-panel, .orbital-cart-body, [role="dialog"]'))
    );

    const blockScrollWhileLocked = (event) => {
      if (lockedScrollY === null) return;
      if (canScrollOverlay(event.target)) return;
      if (event.cancelable) event.preventDefault();
    };

    window.addEventListener('wheel', blockScrollWhileLocked, { passive: false });
    window.addEventListener('touchmove', blockScrollWhileLocked, { passive: false });
    window.addEventListener('keydown', (event) => {
      if (lockedScrollY === null) return;
      if (canScrollOverlay(event.target)) return;
      if (!['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End', ' '].includes(event.key)) return;
      const interactive = event.target instanceof Element
        && event.target.closest('button, a, input, textarea, select, [contenteditable="true"]');
      if (interactive && (event.key === ' ' || event.key === 'Enter')) return;
      event.preventDefault();
    });

    window.addEventListener('resize', () => {
      syncSource();
      requestUpdate();
      drawFrame();
    });
    window.addEventListener('orientationchange', () => {
      syncSource();
      requestUpdate();
      drawFrame();
    });

    // En móvil, la barra del navegador cambia la altura visible sin que
    // siempre se dispare resize: el canvas debe seguir llenando la pantalla.
    window.visualViewport?.addEventListener('resize', () => {
      requestUpdate();
      drawFrame();
    });

    // El enlace de la primera escena y los dos controles laterales
    // recorren la escena con una animación controlada: hacia el último
    // frame y de vuelta al primero (transición inversa).
    const cue = document.querySelector('.orbital-scroll-cue');
    cue?.addEventListener('click', (event) => {
      event.preventDefault();
      scrollToTarget(section.offsetTop);
    });

    routeButtons.forEach((button) => {
      button.addEventListener('click', () => {
        const goToEnd = button.dataset.revealJump === 'end';
        const metrics = getMetrics();
        const pinned = -section.getBoundingClientRect().top;
        const inTargetPart = goToEnd ? pinned > metrics.hold + 1 : pinned <= metrics.hold + 1;

        // El salto ocurre detrás del escenario sticky, así que no se ve;
        // después la animación corre sin mover la página.
        if (!inTargetPart) alignToPart(goToEnd ? 2 : 1);
        if (goToEnd) playForward();
        else playReverse();
      });
    });

    // La rueda, el tacto o el teclado solo cancelan el scroll animado del cue.
    // La reproducción del video no se interrumpe: sigue su curso normal.
    ['wheel', 'touchstart', 'pointerdown', 'keydown'].forEach((eventName) => {
      window.addEventListener(eventName, cancelRouteScroll, { passive: true });
    });

    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        cancelRouteScroll();
        stopPlayback();
        return;
      }
      requestUpdate();
    });

    motionQuery.addEventListener?.('change', () => {
      if (motionQuery.matches) {
        stopPlayback();
        try {
          video.pause();
        } catch (error) {
          /* sin video activo */
        }
      } else if (section.getBoundingClientRect().top < window.innerHeight) {
        loadVideo();
      }
      requestUpdate();
    });

    // Si la página se abre con el scroll ya restaurado en esta sección.
    update();
  };

  window.LNS?.ready(init) ?? document.addEventListener('DOMContentLoaded', init);

})();
