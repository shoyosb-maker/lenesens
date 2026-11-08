/* ============================================================
   PRELOADER — Pantalla de carga y transición entre páginas
   Lenesens Hydralight
   ------------------------------------------------------------
   Debe cargarse SIN defer, dentro de <head>, para insertar la
   cortina antes del primer render y evitar el flash de contenido.

   - Carga directa o recarga: intro cinematográfica con video.
   - Navegaciones internas: velo rápido con póster (sin video).
   - Respeta prefers-reduced-motion, ahorro de datos y Escape.
   - Transición de salida suave al navegar entre páginas.
   ============================================================ */

(function initPreloader() {
  'use strict';

  var script = document.currentScript;

  if (!script || window.__lnsPreloaderLoaded) return;
  window.__lnsPreloaderLoaded = true;

  /* No ejecutar dentro del iframe del visor 3D ni en embeds */
  if (window.self !== window.top) return;

  var INTERNAL_NAV_KEY = 'lns:internal-nav';
  var root = document.documentElement;

  var reduceMotion = false;
  try {
    reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch (error) {
    reduceMotion = false;
  }

  var connection =
    navigator.connection || navigator.mozConnection || navigator.webkitConnection;

  var lowData = !!(
    connection &&
    (connection.saveData || /(^|-)2g$/.test(connection.effectiveType || ''))
  );

  var internalNav = false;
  try {
    var navAt = parseInt(
      window.sessionStorage.getItem(INTERNAL_NAV_KEY),
      10
    );
    if (navAt && Date.now() - navAt < 15000) {
      internalNav = true;
      window.sessionStorage.removeItem(INTERNAL_NAV_KEY);
    }
  } catch (error) {
    internalNav = false;
  }

  var forceIntro = /(?:\?|&)intro=1(?:&|$)/.test(window.location.search);
  var forceQuick = /(?:\?|&)nointro=1(?:&|$)/.test(window.location.search);

  /* La intro se ve en cada carga directa; solo se evita al navegar
     dentro del sitio para no repetirla en cada clic. */
  var useVideo =
    !forceQuick &&
    !reduceMotion &&
    !lowData &&
    (forceIntro || !internalNav);

  /* ----------------------------------------------------------
     Rutas de assets (funciona en / y en subcarpetas)
     ---------------------------------------------------------- */
  function assetUrl(fileName) {
    try {
      return new URL('../assets/video/' + fileName, script.src).href;
    } catch (error) {
      return 'assets/video/' + fileName;
    }
  }

  var portrait = false;
  try {
    portrait = window.matchMedia('(max-aspect-ratio: 1/1)').matches;
  } catch (error) {
    portrait = window.innerHeight > window.innerWidth;
  }

  var posterUrl = assetUrl(
    portrait ? 'preloader-poster-mobile.webp' : 'preloader-poster.webp'
  );
  var backdropUrl = assetUrl(
    portrait ? 'preloader-poster-blur-mobile.webp' : 'preloader-poster-blur.webp'
  );
  var videoUrl = assetUrl(
    portrait ? 'preloader-mobile.mp4' : 'preloader-desktop.mp4'
  );

  /* ----------------------------------------------------------
     Construcción de la cortina (antes de que exista <body>)
     ---------------------------------------------------------- */
  root.classList.add('lns-booting');
  if (!useVideo) root.classList.add('lns-quick-page');

  var overlay = document.createElement('div');
  overlay.className = 'preloader';
  overlay.id = 'lns-preloader';
  overlay.setAttribute('role', 'status');
  overlay.setAttribute('aria-live', 'polite');
  overlay.setAttribute('aria-label', 'Cargando Lenesens Hydralight');

  /* Estilos críticos inline: cubren el viewport aunque el CSS tarde.
     top/left/width/height sirven también a Safari antiguo sin inset. */
  overlay.style.cssText =
    'position:fixed;top:0;left:0;right:0;bottom:0;width:100%;height:100%;' +
    'z-index:99999;display:flex;align-items:center;justify-content:center;' +
    'overflow:hidden;background:#f5cdd5;';

  overlay.innerHTML =
    '<div class="preloader__backdrop" aria-hidden="true"></div>' +
    '<div class="preloader__media" aria-hidden="true">' +
    '<video class="preloader__video" muted playsinline preload="auto" tabindex="-1" disablepictureinpicture></video>' +
    '</div>' +
    '<div class="preloader__glow" aria-hidden="true"></div>' +
    '<div class="preloader__brand" aria-hidden="true">' +
    '<span class="preloader__eyebrow">Lenesens</span>' +
    '<span class="preloader__wordmark">Hydralight</span>' +
    '<span class="preloader__rule"></span>' +
    '</div>' +
    '<div class="preloader__status" aria-hidden="true">' +
    '<span class="preloader__label">Preparando tu experiencia</span>' +
    '<span class="preloader__track"><span class="preloader__progress"></span></span>' +
    '</div>' +
    '<button class="preloader__skip" type="button" aria-label="Saltar introducción">Saltar</button>';

  var video = overlay.querySelector('.preloader__video');
  var backdrop = overlay.querySelector('.preloader__backdrop');
  var skipButton = overlay.querySelector('.preloader__skip');

  backdrop.style.backgroundImage = 'url("' + backdropUrl + '")';

  if (!useVideo) overlay.classList.add('is-quick');

  document.documentElement.appendChild(overlay);

  /* En móviles el overlay se pinta de forma más fiable dentro de <body>.
     Cada página llama a esta función justo después de abrir <body>. */
  window.__lnsPreloaderMount = function mountPreloaderInBody() {
    if (!document.body || overlay.parentNode === document.body) return;
    document.body.insertBefore(overlay, document.body.firstChild);
  };

  if (document.body) {
    window.__lnsPreloaderMount();
  } else {
    document.addEventListener(
      'DOMContentLoaded',
      window.__lnsPreloaderMount,
      { once: true }
    );
  }

  /* ----------------------------------------------------------
     Visor 3D: la cortina espera a que la escena esté lista
     ---------------------------------------------------------- */
  var startedAt = performance.now();
  var viewerFrame = null;
  var viewerGate = false;
  var viewerReady = true;
  var viewerSignaled = false;

  window.addEventListener('message', function onViewerMessage(event) {
    var data = event.data;
    if (!data || data.type !== 'lenesens:viewer-ready') return;
    if (viewerFrame && event.source !== viewerFrame.contentWindow) return;

    viewerSignaled = true;
    viewerReady = true;
    maybeHide();
  });

  /* ----------------------------------------------------------
     Control de scroll y foco del contenido de fondo
     ---------------------------------------------------------- */
  var inertedChildren = [];

  function lockPage() {
    if (!document.body) return;

    if (overlay.parentNode !== document.body) {
      window.__lnsPreloaderMount();
    }

    /* El overlay no puede quedar inert: contiene el botón Saltar. */
    inertedChildren = [];
    var children = document.body.children;

    for (var i = 0; i < children.length; i += 1) {
      var child = children[i];
      if (child === overlay) continue;

      try {
        child.inert = true;
      } catch (error) {
        /* navegadores sin inert */
      }

      child.setAttribute('data-lns-inert', '');
      inertedChildren.push(child);
    }

    var frame = document.querySelector('iframe.product-3d-viewer');
    if (frame) {
      viewerFrame = frame;
      viewerGate = true;
      viewerReady = viewerSignaled;

      var viewerLimit = useVideo ? 9000 : 6500;

      /* El visor manda el aviso; esto solo evita una espera eterna */
      window.setTimeout(
        function viewerGuard() {
          if (!viewerGate || viewerReady) return;
          viewerReady = true;
          maybeHide();
        },
        Math.max(0, viewerLimit - (performance.now() - startedAt))
      );

      window.clearTimeout(maxTimer);
      maxTimer = window.setTimeout(hidePreloader, useVideo ? 9500 : 7000);
    }
  }

  function unlockPage() {
    if (document.body) document.body.removeAttribute('aria-busy');

    for (var i = 0; i < inertedChildren.length; i += 1) {
      var child = inertedChildren[i];

      try {
        child.inert = false;
      } catch (error) {
        /* navegadores sin inert */
      }

      child.removeAttribute('data-lns-inert');
    }

    inertedChildren = [];
  }

  if (document.body) {
    lockPage();
  } else {
    document.addEventListener('DOMContentLoaded', lockPage, { once: true });
  }

  /* ----------------------------------------------------------
     Temporización
     ---------------------------------------------------------- */
  var hidden = false;
  var mediaDone = !useVideo;
  var minTimer = null;
  var maxTimer = null;
  var MIN_HOLD = useVideo ? 900 : 300;
  var MAX_HOLD = useVideo ? 8000 : 2400;

  function pageIsLoaded() {
    return document.readyState === 'complete';
  }

  function pageIsReadyForReveal() {
    /* Con el visor 3D listo no hace falta esperar el load del iframe:
       su carga es precisamente lo que más tarda en esta página. */
    return pageIsLoaded() || (viewerGate && viewerReady);
  }

  function maybeHide() {
    if (hidden || !mediaDone) return;

    if (viewerGate && !viewerReady) return;

    if (pageIsReadyForReveal() && performance.now() - startedAt >= MIN_HOLD) {
      hidePreloader();
    }
  }

  function markMediaDone() {
    if (mediaDone) return;
    mediaDone = true;
    maybeHide();
  }

  minTimer = window.setTimeout(maybeHide, MIN_HOLD);
  maxTimer = window.setTimeout(hidePreloader, MAX_HOLD);

  window.addEventListener(
    'load',
    function onWindowLoad() {
      maybeHide();
    },
    { once: true }
  );

  function hidePreloader() {
    if (hidden) return;
    hidden = true;

    window.clearTimeout(minTimer);
    window.clearTimeout(maxTimer);

    var fadeDuration = reduceMotion ? 240 : useVideo ? 720 : 480;

    overlay.classList.add('is-leaving');
    root.classList.remove('lns-booting');
    root.classList.add('lns-ready');

    unlockPage();

    try {
      video.pause();
    } catch (error) {
      /* sin video activo */
    }

    window.setTimeout(function cleanup() {
      if (overlay.parentNode) overlay.parentNode.removeChild(overlay);

      try {
        video.removeAttribute('src');
        video.load();
      } catch (error) {
        /* sin source */
      }
    }, fadeDuration + 140);
  }

  /* ----------------------------------------------------------
     Reproducción del video de intro
     ---------------------------------------------------------- */
  video.poster = posterUrl;

  if (useVideo) {
    video.muted = true;
    video.setAttribute('muted', '');
    video.setAttribute('playsinline', '');
    video.setAttribute('webkit-playsinline', '');
    video.autoplay = true;
    video.src = videoUrl;

    var videoEndTimer = null;

    /* Respaldo: si el navegador no dispara "ended" (throttling, pestaña
       en segundo plano), se revela al cumplirse la duración real. */
    function scheduleEndFromPlayback() {
      if (videoEndTimer) return;
      if (!isFinite(video.duration) || video.duration < 1.5) return;

      videoEndTimer = window.setTimeout(
        markMediaDone,
        video.duration * 1000 + 500
      );
    }

    video.addEventListener(
      'playing',
      function onPlaying() {
        overlay.classList.add('is-playing');
        scheduleEndFromPlayback();
      },
      { once: true }
    );

    video.addEventListener('loadedmetadata', function onMetadata() {
      window.setTimeout(scheduleEndFromPlayback, 1200);
    });

    video.addEventListener('timeupdate', function nearEnd() {
      var duration = video.duration;
      if (!isFinite(duration) || duration < 1.5) return;
      if (video.currentTime >= duration - 0.1) markMediaDone();
    });

    /* La cortina se revela cuando el video termina por completo */
    video.addEventListener(
      'ended',
      function onEnded() {
        window.setTimeout(markMediaDone, 80);
      },
      { once: true }
    );

    video.addEventListener('error', markMediaDone, { once: true });

    try {
      var playback = video.play();
      if (playback && typeof playback.catch === 'function') {
        playback.catch(markMediaDone);
      }
    } catch (error) {
      markMediaDone();
    }
  }

  /* ----------------------------------------------------------
     Saltar intro
     ---------------------------------------------------------- */
  function skip() {
    if (hidden) return;
    hidePreloader();
  }

  skipButton.addEventListener('click', skip);

  document.addEventListener('keydown', function onKeydown(event) {
    if (hidden) return;
    if (event.key === 'Escape' || event.key === 'Esc') skip();
  });

  window.setTimeout(function showSkip() {
    overlay.classList.add('is-ready');
  }, 600);

  /* ----------------------------------------------------------
     Transición de salida entre páginas
     ---------------------------------------------------------- */
  var exitCurtain = null;

  function getExitCurtain() {
    if (exitCurtain && exitCurtain.parentNode) return exitCurtain;

    exitCurtain = document.createElement('div');
    exitCurtain.className = 'lns-page-exit';
    exitCurtain.setAttribute('aria-hidden', 'true');
    document.body.appendChild(exitCurtain);
    return exitCurtain;
  }

  document.addEventListener('click', function onLinkClick(event) {
    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    ) {
      return;
    }

    var target = event.target;
    var link =
      target && target.closest ? target.closest('a[href]') : null;

    if (!link) return;
    if (link.target && link.target !== '_self') return;
    if (link.hasAttribute('download')) return;
    if (link.getAttribute('data-no-page-transition') !== null) return;

    var href = link.getAttribute('href');
    if (
      !href ||
      href.charAt(0) === '#' ||
      /^(mailto:|tel:|sms:|javascript:)/i.test(href)
    ) {
      return;
    }

    var url;
    try {
      url = new URL(link.href, window.location.href);
    } catch (error) {
      return;
    }

    if (url.origin !== window.location.origin) return;

    /* Misma página (solo hash o query): sin cortina */
    if (
      url.pathname === window.location.pathname &&
      url.search === window.location.search
    ) {
      return;
    }

    var isHtmlPage =
      /\.html?$/i.test(url.pathname) ||
      url.pathname.charAt(url.pathname.length - 1) === '/';

    if (!isHtmlPage) return;

    event.preventDefault();

    var curtain = getExitCurtain();
    window.requestAnimationFrame(function revealCurtain() {
      curtain.classList.add('is-on');
    });

    window.setTimeout(
      function navigate() {
        try {
          window.sessionStorage.setItem(
            INTERNAL_NAV_KEY,
            String(Date.now())
          );
        } catch (error) {
          /* almacenamiento no disponible */
        }

        window.location.href = url.href;
      },
      reduceMotion ? 70 : 210
    );
  });

  /* Al volver con el botón atrás (bfcache), limpiar restos */
  window.addEventListener('pageshow', function onPageShow(event) {
    if (!event.persisted) return;

    hidden = true;

    if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
    if (exitCurtain && exitCurtain.parentNode) {
      exitCurtain.parentNode.removeChild(exitCurtain);
    }

    unlockPage();
    root.classList.remove('lns-booting', 'lns-ready', 'lns-quick-page');
  });
})();
