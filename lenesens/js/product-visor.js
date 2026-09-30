/* ============================================================
   PRODUCT VISOR — Visor 3D interactivo con Three.js
   Lenesens Hydralight
   Construye proceduralmente el frasco, permite girarlo con
   drag/touch, auto-rotación, presets de ángulo y toggle de luz.
   ============================================================ */

'use strict';

(function initProductVisor() {

  const init = () => {

    /* ----------------------------------------------------
       1. DETECCIÓN DEL CONTENEDOR
       ---------------------------------------------------- */
    const container = document.getElementById('threejs-container');
    if (!container) return; // No hay visor en esta página

    /* ----------------------------------------------------
       2. FALLBACK si no hay WebGL
       ---------------------------------------------------- */
    if (!hasWebGL()) {
      renderFallback(container);
      return;
    }

    /* ----------------------------------------------------
       3. ESPERAR A THREE.JS
       ---------------------------------------------------- */
    let tries = 0;
    const MAX_TRIES = 20;

    const waitForThree = () => {
      if (typeof THREE !== 'undefined') {
        buildVisor(container);
      } else if (tries++ < MAX_TRIES) {
        setTimeout(waitForThree, 100);
      } else {
        console.warn('[product-visor] Three.js no cargó a tiempo.');
        renderFallback(container);
      }
    };

    waitForThree();

  };

  /* =========================================================
     DETECCIÓN DE WEBGL
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
     FALLBACK — Imagen estática si no hay WebGL
     ========================================================= */
  function renderFallback(container) {
    container.innerHTML = `
      <img src="assets/img/products/hero-frasco.png"
           alt="Frasco Hydralight 90ml"
           style="max-width:80%; max-height:90%; object-fit:contain;">
    `;
  }

  /* =========================================================
     CONSTRUCCIÓN DEL VISOR 3D
     ========================================================= */
  function buildVisor(container) {

    /* ----------------------------------------------------
       REFERENCIAS AL DOM
       ---------------------------------------------------- */
    const glowEl       = document.getElementById('product-glow');
    const modeLabelEl  = document.getElementById('visor-mode-label');
    const lightIconEl  = document.getElementById('light-icon-svg'); // ← SVG actualizado
    const angleBtns    = document.querySelectorAll('[data-visor-angle]');
    const lightToggle  = document.getElementById('btn-light-toggle');

    /* ----------------------------------------------------
       CONFIGURACIÓN GENERAL
       ---------------------------------------------------- */
    const CONFIG = {
      autoRotateSpeed: 0.4,
      autoRotateDelay: 3500,
      dragSensitivity: 0.012,
      maxVerticalTilt: 0.35,
      cameraDistance: 6.2,
      cameraFOV: 42,
      floatAmplitude: 0.05,
      floatSpeed: 1.6
    };

    /* ----------------------------------------------------
       SETUP DE THREE.JS
       ---------------------------------------------------- */
    const width  = container.clientWidth || 500;
    const height = container.clientHeight || 500;

    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(
      CONFIG.cameraFOV,
      width / height,
      0.1,
      1000
    );
    camera.position.set(0, 0.2, CONFIG.cameraDistance);

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance'
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;

    container.appendChild(renderer.domElement);

    /* ----------------------------------------------------
       GRUPO PRINCIPAL
       ---------------------------------------------------- */
    const bottlePivot = new THREE.Group();
    scene.add(bottlePivot);

    /* ----------------------------------------------------
       MATERIALES
       ---------------------------------------------------- */
    const glassMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      metalness: 0.02,
      roughness: 0.04,
      transmission: 0.94,
      thickness: 1.4,
      ior: 1.52,
      transparent: true,
      opacity: 0.88,
      reflectivity: 0.95,
      clearcoat: 1.0,
      clearcoatRoughness: 0.02,
      envMapIntensity: 1.6
    });

    const serumMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xf44c8c,
      emissive: 0x8a0538,
      emissiveIntensity: 0.28,
      roughness: 0.12,
      metalness: 0.08,
      transmission: 0.72,
      ior: 1.34,
      transparent: true,
      opacity: 0.92,
      clearcoat: 0.8
    });

    const roseGoldMaterial = new THREE.MeshStandardMaterial({
      color: 0xdfab60,
      roughness: 0.18,
      metalness: 0.92,
      envMapIntensity: 2.2
    });

    const dipTubeMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      transmission: 0.92,
      transparent: true,
      opacity: 0.6,
      roughness: 0.1
    });

    const acrylicCapMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      metalness: 0.0,
      roughness: 0.05,
      transmission: 0.96,
      transparent: true,
      opacity: 0.5,
      ior: 1.49,
      clearcoat: 1.0
    });

    const labelMaterial = new THREE.MeshStandardMaterial({
      map: createLabelTexture(),
      roughness: 0.35,
      metalness: 0.05,
      polygonOffset: true,
      polygonOffsetFactor: -1,
      polygonOffsetUnits: -1
    });

    /* ----------------------------------------------------
       GEOMETRÍA — Construcción del frasco
       ---------------------------------------------------- */

    // 1. Cuerpo exterior de vidrio
    const bodyGeo = new THREE.BoxGeometry(1.48, 2.35, 0.98, 4, 8, 4);
    const bodyMesh = new THREE.Mesh(bodyGeo, glassMaterial);
    bodyMesh.position.y = -0.15;
    bodyMesh.castShadow = true;
    bottlePivot.add(bodyMesh);

    // 2. Base de cristal gruesa
    const baseGeo = new THREE.BoxGeometry(1.5, 0.28, 1.0, 2, 2, 2);
    const baseMesh = new THREE.Mesh(baseGeo, glassMaterial);
    baseMesh.position.y = -1.45;
    bottlePivot.add(baseMesh);

    // 3. Hombros curvos
    const shoulderGeo = new THREE.CylinderGeometry(0.48, 0.72, 0.3, 32);
    shoulderGeo.scale(1, 1, 0.75);
    const shoulderMesh = new THREE.Mesh(shoulderGeo, glassMaterial);
    shoulderMesh.position.y = 1.15;
    bottlePivot.add(shoulderMesh);

    // 4. Serum interno
    const serumGeo = new THREE.BoxGeometry(1.3, 2.15, 0.82, 2, 6, 2);
    const serumMesh = new THREE.Mesh(serumGeo, serumMaterial);
    serumMesh.position.y = -0.12;
    bottlePivot.add(serumMesh);

    // 5. Tubo de succión
    const tubeGeo = new THREE.CylinderGeometry(0.04, 0.04, 2.3, 16);
    const tubeMesh = new THREE.Mesh(tubeGeo, dipTubeMaterial);
    tubeMesh.position.set(0.04, -0.15, 0);
    bottlePivot.add(tubeMesh);

    // 6. Etiqueta frontal
    const labelGeo = new THREE.PlaneGeometry(1.18, 1.76);
    const labelFront = new THREE.Mesh(labelGeo, labelMaterial);
    labelFront.position.set(0, -0.14, 0.495);
    bottlePivot.add(labelFront);

    // 7. Etiqueta trasera
    const labelBack = new THREE.Mesh(labelGeo, labelMaterial);
    labelBack.position.set(0, -0.14, -0.495);
    labelBack.rotation.y = Math.PI;
    bottlePivot.add(labelBack);

    // 8. Cuello dorado
    const neckGeo = new THREE.CylinderGeometry(0.38, 0.44, 0.48, 36);
    const neckMesh = new THREE.Mesh(neckGeo, roseGoldMaterial);
    neckMesh.position.y = 1.45;
    bottlePivot.add(neckMesh);

    // 9. Anillo dorado decorativo
    const ringGeo = new THREE.TorusGeometry(0.43, 0.035, 16, 40);
    ringGeo.rotateX(Math.PI / 2);
    const ringMesh = new THREE.Mesh(ringGeo, roseGoldMaterial);
    ringMesh.position.y = 1.34;
    bottlePivot.add(ringMesh);

    // 10. Cuerpo del dosificador
    const pumpGeo = new THREE.CylinderGeometry(0.32, 0.32, 0.65, 32);
    const pumpMesh = new THREE.Mesh(pumpGeo, roseGoldMaterial);
    pumpMesh.position.y = 1.95;
    bottlePivot.add(pumpMesh);

    // 11. Boquilla
    const spoutGeo = new THREE.CylinderGeometry(0.09, 0.12, 0.42, 16);
    spoutGeo.rotateZ(Math.PI / 2.3);
    const spoutMesh = new THREE.Mesh(spoutGeo, roseGoldMaterial);
    spoutMesh.position.set(0.28, 2.12, 0);
    bottlePivot.add(spoutMesh);

    // 12. Tapa acrílica
    const capGeo = new THREE.CylinderGeometry(0.44, 0.44, 1.15, 32);
    const capMesh = new THREE.Mesh(capGeo, acrylicCapMaterial);
    capMesh.position.y = 2.18;
    bottlePivot.add(capMesh);

    // 13. Banda gold en la tapa
    const capBandGeo = new THREE.CylinderGeometry(0.445, 0.445, 0.14, 32);
    const capBandMesh = new THREE.Mesh(capBandGeo, roseGoldMaterial);
    capBandMesh.position.y = 1.66;
    bottlePivot.add(capBandMesh);

    /* ----------------------------------------------------
       PEDESTAL + SOMBRA
       ---------------------------------------------------- */
    const shadowGeo = new THREE.CircleGeometry(1.6, 40);
    shadowGeo.rotateX(-Math.PI / 2);
    const shadowMat = new THREE.MeshBasicMaterial({
      color: 0xb58296,
      transparent: true,
      opacity: 0.32
    });
    const shadowMesh = new THREE.Mesh(shadowGeo, shadowMat);
    shadowMesh.position.y = -1.68;
    scene.add(shadowMesh);

    const pedestalGeo = new THREE.CylinderGeometry(1.85, 2.0, 0.1, 48);
    const pedestalMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.2,
      metalness: 0.15
    });
    const pedestalMesh = new THREE.Mesh(pedestalGeo, pedestalMat);
    pedestalMesh.position.y = -1.74;
    pedestalMesh.receiveShadow = true;
    scene.add(pedestalMesh);

    /* ----------------------------------------------------
       PARTÍCULAS FLOTANTES
       ---------------------------------------------------- */
    const particleCount = 70;
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);

    const colorA = new THREE.Color(0xf68eb0);
    const colorB = new THREE.Color(0xfdd586);

    for (let i = 0; i < particleCount; i++) {
      const angle = (i / particleCount) * Math.PI * 2 + (Math.random() - 0.5) * 0.4;
      const dist = 1.35 + Math.random() * 1.5;

      positions[i * 3]     = Math.cos(angle) * dist;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 3.8;
      positions[i * 3 + 2] = Math.sin(angle) * dist;

      const mixed = Math.random() > 0.4 ? colorA : colorB;
      colors[i * 3]     = mixed.r;
      colors[i * 3 + 1] = mixed.g;
      colors[i * 3 + 2] = mixed.b;
    }

    const particlesGeo = new THREE.BufferGeometry();
    particlesGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    particlesGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const particlesMat = new THREE.PointsMaterial({
      size: 0.09,
      vertexColors: true,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    const particles = new THREE.Points(particlesGeo, particlesMat);
    scene.add(particles);

    /* ----------------------------------------------------
       ILUMINACIÓN
       ---------------------------------------------------- */
    const ambientLight = new THREE.AmbientLight(0xfff5f8, 1.8);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, 2.2);
    keyLight.position.set(4, 6, 5);
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0xfce7f0, 1.4);
    fillLight.position.set(-4, 3, 3);
    scene.add(fillLight);

    const rimLight = new THREE.DirectionalLight(0xffdf96, 2.0);
    rimLight.position.set(0, 4, -5);
    scene.add(rimLight);

    const underLight = new THREE.PointLight(0xff4b8b, 1.2, 8);
    underLight.position.set(0, -1.2, 1.2);
    scene.add(underLight);

    /* ----------------------------------------------------
       ESTADO DE INTERACCIÓN
       ---------------------------------------------------- */
    let isDragging = false;
    let startX = 0;
    let startY = 0;

    let targetRotY = 0.15;
    let targetRotX = 0.04;

    let autoRotate = true;
    let autoRotateTimer = null;

    let isDayLight = true;

    /* ----------------------------------------------------
       EVENTOS — Drag
       ---------------------------------------------------- */
    const onPointerDown = (e) => {
      if (e.type === 'pointerdown' && e.button !== 0) return;

      isDragging = true;
      autoRotate = false;

      if (autoRotateTimer) clearTimeout(autoRotateTimer);

      const point = getPoint(e);
      startX = point.x;
      startY = point.y;

      container.style.cursor = 'grabbing';
    };

    const onPointerMove = (e) => {
      if (!isDragging) return;

      const point = getPoint(e);
      const dx = point.x - startX;
      const dy = point.y - startY;

      startX = point.x;
      startY = point.y;

      targetRotY += dx * CONFIG.dragSensitivity;
      targetRotX += dy * CONFIG.dragSensitivity * 0.8;
      targetRotX = Math.max(-CONFIG.maxVerticalTilt, Math.min(CONFIG.maxVerticalTilt, targetRotX));
    };

    const onPointerUp = () => {
      if (!isDragging) return;
      isDragging = false;
      container.style.cursor = 'grab';

      if (autoRotateTimer) clearTimeout(autoRotateTimer);
      autoRotateTimer = setTimeout(() => {
        autoRotate = true;
      }, CONFIG.autoRotateDelay);
    };

    const getPoint = (e) => {
      if (e.touches && e.touches[0]) {
        return { x: e.touches[0].clientX, y: e.touches[0].clientY };
      }
      return { x: e.clientX, y: e.clientY };
    };

    container.style.cursor = 'grab';

    container.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('pointercancel', onPointerUp);

    /* ----------------------------------------------------
       PRESETS DE ÁNGULO
       ---------------------------------------------------- */
    const setAngle = (angleKey) => {
      autoRotate = false;
      if (autoRotateTimer) clearTimeout(autoRotateTimer);

      switch (angleKey) {
        case 'front':
          targetRotY = 0;
          targetRotX = 0;
          if (modeLabelEl) modeLabelEl.textContent = 'Vista Frontal';
          break;
        case 'side':
          targetRotY = Math.PI / 4;
          targetRotX = 0.06;
          if (modeLabelEl) modeLabelEl.textContent = 'Perspectiva 3/4';
          break;
        case 'back':
          targetRotY = Math.PI;
          targetRotX = 0;
          if (modeLabelEl) modeLabelEl.textContent = 'Reverso & Tabla de Activos';
          break;
        case 'texture':
          targetRotY = -Math.PI / 5;
          targetRotX = 0.22;
          if (modeLabelEl) modeLabelEl.textContent = 'Detalle de Microesferas';
          break;
      }

      autoRotateTimer = setTimeout(() => {
        autoRotate = true;
      }, 4500);
    };

    angleBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        const angle = btn.dataset.visorAngle;
        setAngle(angle);

        angleBtns.forEach((b) => {
          if (b.classList.contains('angle-btn')) {
            b.classList.toggle('is-active', b === btn);
          }
        });
      });
    });

    window.setHydralightAngle = setAngle;

    /* ----------------------------------------------------
       TOGGLE DE ILUMINACIÓN (SVG actualizado)
       ---------------------------------------------------- */
    const toggleLighting = () => {
      isDayLight = !isDayLight;

      if (glowEl) {
        glowEl.classList.toggle('is-night', !isDayLight);
      }

      // Actualizar el icono SVG del sol/luna
      if (lightIconEl) {
        const useEl = lightIconEl.querySelector('use');
        if (useEl) {
          useEl.setAttribute('href', isDayLight
            ? 'assets/icons/sprite.svg#icon-sun'
            : 'assets/icons/sprite.svg#icon-moon'
          );
        }
      }

      // Ajustar luces
      if (isDayLight) {
        ambientLight.intensity = 1.8;
        keyLight.intensity = 2.2;
        fillLight.intensity = 1.4;
        renderer.toneMappingExposure = 1.15;
      } else {
        ambientLight.intensity = 0.9;
        keyLight.intensity = 1.2;
        fillLight.intensity = 0.8;
        renderer.toneMappingExposure = 0.9;
      }
    };

    if (lightToggle) {
      lightToggle.addEventListener('click', toggleLighting);
    }

    /* ----------------------------------------------------
       RENDER LOOP
       ---------------------------------------------------- */
    const clock = new THREE.Clock();
    let isVisible = true;

    const animate = () => {
      requestAnimationFrame(animate);

      if (!isVisible) return;

      const delta = clock.getDelta();
      const elapsed = clock.getElapsedTime();

      if (autoRotate && !isDragging) {
        targetRotY += delta * CONFIG.autoRotateSpeed;
      }

      bottlePivot.rotation.y += (targetRotY - bottlePivot.rotation.y) * 0.09;
      bottlePivot.rotation.x += (targetRotX - bottlePivot.rotation.x) * 0.09;

      bottlePivot.position.y = Math.sin(elapsed * CONFIG.floatSpeed) * CONFIG.floatAmplitude;

      particles.rotation.y = elapsed * 0.18;
      particles.rotation.x = Math.sin(elapsed * 0.4) * 0.06;

      renderer.render(scene, camera);
    };

    animate();

    /* ----------------------------------------------------
       INTERSECTION OBSERVER — Pausa cuando no visible
       ---------------------------------------------------- */
    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            isVisible = entry.isIntersecting;
          });
        },
        { threshold: 0.05 }
      );
      observer.observe(container);
    }

    /* ----------------------------------------------------
       REDUCED MOTION
       ---------------------------------------------------- */
    if (window.LNS?.device.prefersReducedMotion()) {
      autoRotate = false;
      CONFIG.autoRotateSpeed = 0;
      CONFIG.floatAmplitude = 0;
    }

    /* ----------------------------------------------------
       RESIZE
       ---------------------------------------------------- */
    const onResize = window.LNS?.throttle(() => {
      const w = container.clientWidth || width;
      const h = container.clientHeight || height;

      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    }, 200);

    if (onResize) window.addEventListener('resize', onResize);

  }

  /* =========================================================
     CANVAS TEXTURE — Etiqueta de la botella
     ========================================================= */
  function createLabelTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 1480;
    const ctx = canvas.getContext('2d');

    const bgGrad = ctx.createLinearGradient(0, 0, 1024, 1480);
    bgGrad.addColorStop(0, '#ffffff');
    bgGrad.addColorStop(0.5, '#fdfafb');
    bgGrad.addColorStop(1, '#f9f3f6');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, 1024, 1480);

    ctx.strokeStyle = 'rgba(212, 175, 55, 0.85)';
    ctx.lineWidth = 14;
    ctx.strokeRect(36, 36, 1024 - 72, 1480 - 72);

    ctx.strokeStyle = 'rgba(166, 19, 82, 0.35)';
    ctx.lineWidth = 4;
    ctx.strokeRect(58, 58, 1024 - 116, 1480 - 116);

    ctx.fillStyle = '#8f6838';
    ctx.font = '600 32px "Playfair Display", Georgia, serif';
    ctx.textAlign = 'center';
    ctx.letterSpacing = '6px';
    ctx.fillText('COLOMBIA  •  BIOTECNOLOGÍA', 512, 170);

    ctx.strokeStyle = '#d4af37';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(320, 210);
    ctx.lineTo(704, 210);
    ctx.stroke();

    ctx.fillStyle = '#1c1917';
    ctx.font = 'bold 74px "Playfair Display", Georgia, serif';
    ctx.letterSpacing = '4px';
    ctx.fillText('HYDRALIGHT', 512, 320);

    ctx.fillStyle = '#a61352';
    ctx.font = '600 38px "Montserrat", sans-serif';
    ctx.letterSpacing = '2px';
    ctx.fillText('SUERO HIDRATANTE Y ACLARADOR', 512, 390);

    ctx.fillStyle = '#c88da4';
    ctx.font = 'italic 34px "Playfair Display", Georgia, serif';
    ctx.fillText('de la Piel • Zonas Sensibles', 512, 450);

    ctx.fillStyle = '#57534e';
    ctx.font = '400 28px "Montserrat", sans-serif';
    const lines = [
      'Tratamiento bio-activo con micro-gotas',
      'iluminadoras para desvanecer manchas oscuras',
      'y repone elasticidad en axilas, codos, rodillas',
      'y zonas de fricción constante.'
    ];
    let y = 560;
    lines.forEach((line) => {
      ctx.fillText(line, 512, y);
      y += 46;
    });

    ctx.fillStyle = '#fceef3';
    roundRect(ctx, 140, 770, 744, 110, 24);
    ctx.fill();

    ctx.strokeStyle = '#e69bb7';
    ctx.lineWidth = 3;
    roundRect(ctx, 140, 770, 744, 110, 24);
    ctx.stroke();

    ctx.fillStyle = '#780036';
    ctx.font = 'bold 30px "Montserrat", sans-serif';
    ctx.fillText('GLICÓLICO • LÁCTICO • ESCUALANO', 512, 836);

    ctx.fillStyle = '#78716c';
    ctx.font = 'bold 28px "Montserrat", sans-serif';
    ctx.fillText('VEGAN  •  CLEAN BEAUTY', 512, 980);

    ctx.fillStyle = '#1c1917';
    ctx.font = 'bold 46px "Montserrat", sans-serif';
    ctx.fillText('3.1 FL OZ / 90 ML', 512, 1080);

    ctx.fillStyle = '#d4af37';
    ctx.font = 'bold 44px "Playfair Display", Georgia, serif';
    ctx.fillText('✦  LENESENS  ✦', 512, 1220);

    ctx.fillStyle = '#a8a29e';
    ctx.font = '500 24px "Montserrat", sans-serif';
    ctx.fillText('REG. SANITARIO INVIMA • DERMOCOSMÉTICA', 512, 1280);

    const texture = new THREE.CanvasTexture(canvas);
    texture.anisotropy = 8;
    return texture;
  }

  /* =========================================================
     HELPER — roundRect
     ========================================================= */
  function roundRect(ctx, x, y, w, h, r) {
    if (ctx.roundRect) {
      ctx.beginPath();
      ctx.roundRect(x, y, w, h, r);
      return;
    }
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }

  window.LNS?.ready(init) ?? document.addEventListener('DOMContentLoaded', init);

})();