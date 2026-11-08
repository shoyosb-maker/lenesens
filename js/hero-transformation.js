/* ============================================================
   HERO TRANSFORMATION — Transición Antes/Después/Producto
   Lenesens Hydralight
   Flujo: piel con manchas → piel radiante → producto Hydralight
   ============================================================ */
'use strict';
import * as THREE from 'three';

(function initHeroTransformation() {
  /* =========================================================
     CONFIGURACIÓN
     ========================================================= */
  const TEXTURE_BEFORE   = 'assets/img/lifestyle/skin-before.jpg';
  const TEXTURE_AFTER    = 'assets/img/lifestyle/skin-after.jpg';
  const TEXTURE_PRODUCT  = 'assets/img/products/hero-frasco.png';
  const FALLBACK_TEXTURE = 'assets/img/blog/cover-hyperpigmentation.png';

  /* ---------------------------------------------------------
     Tiempos de cada fase del ciclo (ms)
     --------------------------------------------------------- */
    const CYCLE = {
    HOLD_A:          500,   // Piel con manchas
    REVEAL_AB:       1000,   // Revelado radial → piel radiante (más fluido)
    HOLD_B:          500,   // Pausa en piel radiante
    REVEAL_BC:       1000,   // Cross-fade → producto (más fluido)
    HOLD_C:          4000,   // Pausa mostrando el producto (CTA)
  };
  const TOTAL_CYCLE = Object.values(CYCLE).reduce((s, v) => s + v, 0);

  /* =========================================================
     SHADERS
     ========================================================= */
  const VERTEX_SHADER = /* glsl */ `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `;

    const FRAGMENT_SHADER = /* glsl */ `
    precision highp float;

    uniform sampler2D uTextureBefore;   // piel con manchas
    uniform sampler2D uTextureAfter;    // piel radiante
    uniform sampler2D uTextureProduct;  // frasco Hydralight (PNG transparente)

    uniform vec2  uResolution;
    uniform vec2  uImageResolution;
    uniform float uProgress;      // 0 → 1 → 2 → 1 → 0
    uniform float uTime;
    uniform float uMouse;
    uniform float uIsInteractive;

    varying vec2 vUv;

    /* --- Ruido pseudoaleatorio --- */
    float random(vec2 st) {
      return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
    }

    float noise(vec2 st) {
      vec2 i = floor(st);
      vec2 f = fract(st);
      float a = random(i);
      float b = random(i + vec2(1.0, 0.0));
      float c = random(i + vec2(0.0, 1.0));
      float d = random(i + vec2(1.0, 1.0));
      vec2 u = f * f * (3.0 - 2.0 * f);
      return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
    }

    /* --- Ajuste "cover" de la imagen dentro del canvas --- */
    vec2 coverUv(vec2 uv, vec2 canvasSize, vec2 imageSize) {
      float canvasRatio = canvasSize.x / canvasSize.y;
      float imageRatio  = imageSize.x / imageSize.y;
      vec2 scale = canvasRatio > imageRatio
        ? vec2(1.0, imageRatio / canvasRatio)
        : vec2(canvasRatio / imageRatio, 1.0);
      return (uv - 0.5) * scale + 0.5;
    }

    void main() {
      /* ----------------------------------------------------
         1. UVs
         ---------------------------------------------------- */
      // UV de fondo (piel) con "cover"
      vec2 uvCover = coverUv(vUv, uResolution, uImageResolution);
      // UV de producto — usamos vUv directo para no distorsionar el frasco
      vec2 uvProduct = vUv;

      /* ----------------------------------------------------
         2. FASE 1: Revelado radial A → B (manchas → radiante)
         ---------------------------------------------------- */
      vec2 center = vec2(mix(0.5, 0.35 + uMouse * 0.3, uIsInteractive), 0.5);
      float dist = distance(vUv, center);

      float organicNoise =
      noise(vUv * 5.0 + uTime * 0.12) * 0.14 +
      noise(vUv * 12.0 - uTime * 0.08) * 0.06;

      float phase1 = clamp(uProgress, 0.0, 1.0);
      float radius1 = phase1 * 1.4 + organicNoise;
      float blendAB = 1.0 - smoothstep(radius1 - 0.22, radius1 + 0.22, dist);

      vec4 colorA = texture2D(uTextureBefore, uvCover);
      vec4 colorB = texture2D(uTextureAfter,  uvCover);
      vec4 mixedAB = mix(colorA, colorB, blendAB);

      /* ----------------------------------------------------
         3. FASE 2: Transición B → C (radiante → fondo crema + frasco)
         ---------------------------------------------------- */
      float phase2 = clamp(uProgress - 1.0, 0.0, 1.0);
      // Easing suave
      float fade2 = phase2 * phase2 * (3.0 - 2.0 * phase2);

      // Color del fondo crema de la marca (--color-surface: #fbf9f6)
      vec3 creamBg = vec3(0.984, 0.976, 0.965);

      // La piel radiante se desvanece hacia el fondo crema
      vec4 bgFaded = mix(mixedAB, vec4(creamBg, 1.0), fade2);

      /* ----------------------------------------------------
         4. Producto sobre el fondo crema (respetando su alpha)
         ---------------------------------------------------- */
      vec4 productColor = texture2D(uTextureProduct, uvProduct);

      // Corregir color del PNG (evitar franjas)
      productColor.rgb *= productColor.a;

      // El frasco se dibuja encima del fondo, modulado por su alpha * fade2
      vec3 finalRgb = bgFaded.rgb * (1.0 - productColor.a * fade2)
                    + productColor.rgb * fade2;

      vec4 finalColor = vec4(finalRgb, 1.0);

      /* ----------------------------------------------------
         5. Viñeta sutil en los bordes
         ---------------------------------------------------- */
      float vignette = smoothstep(1.2, 0.3, distance(vUv, vec2(0.5)));
      finalColor.rgb *= mix(1.0, 0.92, (1.0 - vignette));

      gl_FragColor = finalColor;
    }
  `;

  /* =========================================================
     EASING
     ========================================================= */
    const easeInOutQuint = (t) =>
    t < 0.5 ? 16 * t * t * t * t * t : 1 - Math.pow(-2 * t + 2, 5) / 2;

  // Alias para mantener compatibilidad
  const easeInOutCubic = easeInOutQuint;

  /* =========================================================
     WEBGL DETECTION
     ========================================================= */
  function hasWebGL() {
    try {
      const canvas = document.createElement('canvas');
      return !!(
        window.WebGLRenderingContext &&
        (canvas.getContext('webgl') || canvas.getContext('experimental-webgl'))
      );
    } catch (e) {
      return false;
    }
  }

  /* =========================================================
     TEXTURAS — singleton compartido
     ========================================================= */
  const texturesPromise = (() => {
    let promise = null;
    return () => {
      if (promise) return promise;
      promise = new Promise((resolve) => {
        const loader = new THREE.TextureLoader();
        const state = {
          before: null,
          after: null,
          product: null,
          size: new THREE.Vector2(1200, 900),
        };

        const tryLoad = (url, key, onDone) => {
          loader.load(
            url,
            (tex) => {
              tex.colorSpace = THREE.SRGBColorSpace;
              tex.minFilter = THREE.LinearFilter;
              tex.magFilter = THREE.LinearFilter;
              state[key] = tex;
              if (key === 'before' && tex.image) {
                state.size.set(tex.image.width || 1200, tex.image.height || 900);
              }
              onDone();
            },
            undefined,
            () => {
              loader.load(FALLBACK_TEXTURE, (fb) => {
                fb.colorSpace = THREE.SRGBColorSpace;
                fb.minFilter = THREE.LinearFilter;
                fb.magFilter = THREE.LinearFilter;
                state[key] = fb;
                onDone();
              });
            }
          );
        };

        let loaded = 0;
        const totalToLoad = 3;
        const check = () => {
          loaded++;
          if (loaded === totalToLoad) resolve(state);
        };

        tryLoad(TEXTURE_BEFORE,  'before',  check);
        tryLoad(TEXTURE_AFTER,   'after',   check);
        tryLoad(TEXTURE_PRODUCT, 'product', check);
      });
      return promise;
    };
  })();

  /* =========================================================
     FALLBACK sin WebGL
     ========================================================= */
  function renderFallback(container) {
    const img = document.createElement('img');
    img.src = TEXTURE_PRODUCT;
    img.alt = 'Hydralight Suero Corporal Aclarador';
    img.style.cssText = 'width:100%;height:100%;object-fit:contain;display:block;padding:1rem;';
    img.loading = 'lazy';
    img.onerror = () => { img.src = FALLBACK_TEXTURE; };
    container.appendChild(img);
  }

  /* =========================================================
     CREAR UNA INSTANCIA
     ========================================================= */
  function createInstance(canvas, options = {}) {
    const container = canvas.parentElement;
    if (!container) return null;

    if (!hasWebGL()) {
      renderFallback(container);
      return null;
    }

    const { interactive = true, autoRevealOnLoad = false } = options;

    /* ----------------------------------------------------
       Renderer
       ---------------------------------------------------- */
    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(container.clientWidth, container.clientHeight, false);
    renderer.outputColorSpace = THREE.SRGBColorSpace;

    /* ----------------------------------------------------
       Scene + Camera ortográfica
       ---------------------------------------------------- */
    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

    /* ----------------------------------------------------
       Uniforms
       ---------------------------------------------------- */
    const uniforms = {
      uTextureBefore:   { value: null },
      uTextureAfter:    { value: null },
      uTextureProduct:  { value: null },
      uResolution:      { value: new THREE.Vector2(container.clientWidth, container.clientHeight) },
      uImageResolution: { value: new THREE.Vector2(1200, 900) },
      uProgress:        { value: 0 },
      uTime:            { value: 0 },
      uMouse:           { value: 0.5 },
      uIsInteractive:   { value: 0 },
    };

    /* ----------------------------------------------------
       Material + Mesh
       ---------------------------------------------------- */
    const material = new THREE.ShaderMaterial({
      vertexShader: VERTEX_SHADER,
      fragmentShader: FRAGMENT_SHADER,
      uniforms,
    });
    scene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material));

    /* ----------------------------------------------------
       Cargar texturas
       ---------------------------------------------------- */
    texturesPromise().then((state) => {
      uniforms.uTextureBefore.value  = state.before;
      uniforms.uTextureAfter.value   = state.after;
      uniforms.uTextureProduct.value = state.product;
      uniforms.uImageResolution.value.copy(state.size);

      if (autoRevealOnLoad) {
        container.classList.add('is-ready');
      }
    });

    /* ----------------------------------------------------
       Estado
       ---------------------------------------------------- */
    let isVisible = false;
    let cycleStartTime = performance.now();
    let isInteracting = false;
    let interactionProgress = 0;
    const clock = new THREE.Clock();

    /* ----------------------------------------------------
       Cálculo de la fase actual → uProgress (0..2)
       ---------------------------------------------------- */
        const computeProgress = (t) => {
      const t1 = CYCLE.HOLD_A;
      const t2 = t1 + CYCLE.REVEAL_AB;
      const t3 = t2 + CYCLE.HOLD_B;
      const t4 = t3 + CYCLE.REVEAL_BC;
      const t5 = t4 + CYCLE.HOLD_C;

      if (t < t1) {
        // Fase 1: piel con manchas
        return 0;
      } else if (t < t2) {
        // Fase 2: revelado radial → piel radiante
        return easeInOutCubic((t - t1) / CYCLE.REVEAL_AB);
      } else if (t < t3) {
        // Fase 3: pausa en piel radiante
        return 1;
      } else if (t < t4) {
        // Fase 4: cross-fade → producto
        return 1 + easeInOutCubic((t - t3) / CYCLE.REVEAL_BC);
      } else {
        // Fase 5: producto visible indefinidamente (final del ciclo)
        return 2;
      }
    };

    /* ----------------------------------------------------
       Loop
       ---------------------------------------------------- */
    const loop = () => {
      requestAnimationFrame(loop);
      uniforms.uTime.value = clock.getElapsedTime();

      if (!isVisible) return;

        if (!isInteracting) {
        const elapsed = performance.now() - cycleStartTime;
        // Sin bucle: no aplicamos módulo. Cuando termina la secuencia,
        // computeProgress devuelve 2 indefinidamente.
        uniforms.uProgress.value = computeProgress(elapsed);
      } else {
        uniforms.uProgress.value = interactionProgress;
      }

      renderer.render(scene, camera);
    };

    /* ----------------------------------------------------
       Resize
       ---------------------------------------------------- */
    const onResize = () => {
      const w = container.clientWidth;
      const h = container.clientHeight;
      renderer.setSize(w, h, false);
      uniforms.uResolution.value.set(w, h);
    };

    let resizeTimeout;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(onResize, 150);
    });

    /* ----------------------------------------------------
       Intersection Observer
       ---------------------------------------------------- */
    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            isVisible = entry.isIntersecting;
            if (isVisible) {
              cycleStartTime = performance.now();
            }
          });
        },
        { threshold: 0.15 }
      );
      observer.observe(container);
    } else {
      isVisible = true;
    }

    /* ----------------------------------------------------
       Interacción drag/touch
       Drag 0..1 → uProgress 0..2 (revela los 3 estados)
       ---------------------------------------------------- */
    if (interactive) {
      const setMouse = (clientX) => {
        const rect = container.getBoundingClientRect();
        const x = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
        uniforms.uMouse.value = x;
        interactionProgress = x * 2; // 0..2
      };

      const onDown = (e) => {
        isInteracting = true;
        uniforms.uIsInteractive.value = 1;
        setMouse(e.clientX);
        container.setPointerCapture?.(e.pointerId);
        hideHint();
      };
      const onMove = (e) => {
        if (!isInteracting) return;
        setMouse(e.clientX);
      };
      const onUp = () => {
        isInteracting = false;
        uniforms.uIsInteractive.value = 0;
        cycleStartTime = performance.now();
      };

      container.addEventListener('pointerdown', onDown);
      container.addEventListener('pointermove', onMove);
      container.addEventListener('pointerup', onUp);
      container.addEventListener('pointercancel', onUp);
      container.addEventListener('pointerleave', onUp);
    }

    /* ----------------------------------------------------
       Hint
       ---------------------------------------------------- */
    const hint = container.querySelector('.hero-transformation-preview__hint')
              || container.querySelector('.hero-transformation__hint');
    let hintHidden = false;
    const hideHint = () => {
      if (hintHidden || !hint) return;
      hintHidden = true;
      hint.classList.add('is-hidden');
    };
    setTimeout(hideHint, 8000);

    /* ----------------------------------------------------
       Reduced motion
       ---------------------------------------------------- */
    if (window.LNS?.device?.prefersReducedMotion?.()) {
      uniforms.uProgress.value = 2; // Muestra directamente el producto
      container.classList.add('is-ready');
      isVisible = false;
      return { destroy: () => renderer.dispose() };
    }

    /* ----------------------------------------------------
       Arranca el loop
       ---------------------------------------------------- */
    loop();

    return { destroy: () => renderer.dispose() };
  }

  /* =========================================================
     INIT
     ========================================================= */
  const init = () => {
    // Hero mini preview
    const heroCanvas = document.getElementById('hero-transformation-mini');
    if (heroCanvas) {
      const container = heroCanvas.parentElement;
      if (container) {
        requestAnimationFrame(() => {
          setTimeout(() => container.classList.add('is-ready'), 100);
        });
      }
      createInstance(heroCanvas, { interactive: true, autoRevealOnLoad: true });
    }

    // Sección grande de transformación (si existe)
    const bigCanvas = document.getElementById('transformation-canvas');
    if (bigCanvas) {
      createInstance(bigCanvas, { interactive: true });
    }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();