/* ============================================================
   PRODUCT VISOR — Visor 3D interactivo con Three.js
   Lenesens Hydralight
   Versión: GLB + OrbitControls + RoomEnvironment
   Basado en el visor funcional de referencia.
   ============================================================ */

'use strict';

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

(function initProductVisor() {

  /* =========================================================
     CONFIGURACIÓN
     ========================================================= */
  const MODEL_PATH = 'assets/models/hydralight-90ml.glb';

  /* =========================================================
     INIT
     ========================================================= */
  const init = () => {
    const container = document.getElementById('threejs-container');
    if (!container) return;

    if (!hasWebGL()) {
      renderFallback(container);
      return;
    }

    buildVisor(container);
  };

  /* =========================================================
     DETECCIÓN WEBGL
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
     FALLBACK
     ========================================================= */
  function renderFallback(container) {
    container.innerHTML = `
      <img src="assets/img/products/hero-frasco.png"
           alt="Frasco Hydralight 90ml"
           style="max-width:80%;max-height:90%;object-fit:contain;">
    `;
  }

  /* =========================================================
     CONSTRUCCIÓN DEL VISOR
     ========================================================= */
  function buildVisor(container) {

    /* ----------------------------------------------------
       REFERENCIAS AL DOM
       ---------------------------------------------------- */
    const glowEl      = document.getElementById('product-glow');
    const modeLabelEl = document.getElementById('visor-mode-label');
    const lightIconEl = document.getElementById('light-icon-svg');
    const angleBtns   = document.querySelectorAll('[data-visor-angle]');
    const lightToggle = document.getElementById('btn-light-toggle');

    /* ----------------------------------------------------
       ESCENA
       ---------------------------------------------------- */
    const width  = container.clientWidth || 500;
    const height = container.clientHeight || 500;

    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(40, width / height, 0.01, 1000);
    camera.position.set(2, 1.5, 3);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance'
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;

    container.appendChild(renderer.domElement);

    /* ----------------------------------------------------
       ENTORNO — Reflejos realistas sin imágenes externas
       ---------------------------------------------------- */
    const pmrem = new THREE.PMREMGenerator(renderer);
    scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

    /* ----------------------------------------------------
       LUCES
       ---------------------------------------------------- */
    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 1.2);
    scene.add(hemiLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, 2.2);
    keyLight.position.set(5, 10, 7);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.set(1024, 1024);
    keyLight.shadow.camera.near = 0.1;
    keyLight.shadow.camera.far = 50;
    keyLight.shadow.camera.left = -10;
    keyLight.shadow.camera.right = 10;
    keyLight.shadow.camera.top = 10;
    keyLight.shadow.camera.bottom = -10;
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0xfce7f0, 0.6);
    fillLight.position.set(-5, 3, -5);
    scene.add(fillLight);

    /* ----------------------------------------------------
       SUELO — Sombra suave bajo el frasco
       ---------------------------------------------------- */
    const ground = new THREE.Mesh(
      new THREE.CircleGeometry(5, 64),
      new THREE.ShadowMaterial({ opacity: 0.28 })
    );
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);

    /* ----------------------------------------------------
       CONTROLES — OrbitControls (drag, zoom, pan)
       ---------------------------------------------------- */
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.enableZoom = true;
    controls.enablePan = false;          // Deshabilitamos pan para no descentrar
    controls.minDistance = 2;
    controls.maxDistance = 12;
    controls.minPolarAngle = Math.PI / 3.5;
    controls.maxPolarAngle = Math.PI / 1.85;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 1.5;
    controls.rotateSpeed = 0.8;

    // Pausar auto-rotación al interactuar
    controls.addEventListener('start', () => { controls.autoRotate = false; });
    controls.addEventListener('end', () => {
      setTimeout(() => { controls.autoRotate = true; }, 3000);
    });

    /* ----------------------------------------------------
       LOADERS
       ---------------------------------------------------- */
    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath('https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/libs/draco/');

    const gltfLoader = new GLTFLoader();
    gltfLoader.setDRACOLoader(dracoLoader);

    /* ----------------------------------------------------
       ESTADO
       ---------------------------------------------------- */
    let currentModel = null;
    let currentMixer = null;
    let isVisible = true;
    let isDayLight = true;

    const clock = new THREE.Clock();

    /* ----------------------------------------------------
       CARGAR MODELO
       ---------------------------------------------------- */
    const loadModel = () => {
      gltfLoader.load(
        MODEL_PATH,
        // onLoad
        (gltf) => {
          currentModel = gltf.scene;

          // Sombras + materiales
          currentModel.traverse((obj) => {
            if (obj.isMesh) {
              obj.castShadow = true;
              obj.receiveShadow = true;
              if (obj.material) {
                const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
                mats.forEach((m) => {
                  if (m.map) m.map.colorSpace = THREE.SRGBColorSpace;
                  if ('envMapIntensity' in m) m.envMapIntensity = 1.2;
                });
              }
            }
          });

          scene.add(currentModel);

          // Auto-encuadrar la cámara
          fitCameraToObject(currentModel);

          // Animaciones si las tiene
          if (gltf.animations && gltf.animations.length) {
            currentMixer = new THREE.AnimationMixer(currentModel);
            gltf.animations.forEach((clip) => currentMixer.clipAction(clip).play());
          }

          // console.log('[product-visor] Modelo cargado:', MODEL_PATH);
        },
        // onProgress
        (xhr) => {
          if (xhr.total > 0) {
            const percent = Math.round((xhr.loaded / xhr.total) * 100);
            // console.log(`[product-visor] Cargando: ${percent}%`);
          }
        },
        // onError
        (err) => {
          console.error('[product-visor] Error cargando el modelo:', err);
          renderFallback(container);
        }
      );
    };

    /* ----------------------------------------------------
       AUTO-ENCUADRAR CÁMARA AL MODELO
       ---------------------------------------------------- */
    const fitCameraToObject = (obj) => {
      const box = new THREE.Box3().setFromObject(obj);
      const size = box.getSize(new THREE.Vector3());
      const center = box.getCenter(new THREE.Vector3());

      // Centrar el modelo en el origen
      obj.position.sub(center);

      const maxDim = Math.max(size.x, size.y, size.z);
      const fov = camera.fov * (Math.PI / 180);
      let dist = Math.abs(maxDim / 2 / Math.tan(fov / 2));
      dist *= 2.0;

      // Cámara mirando de frente, ligeramente arriba
      camera.position.set(0, maxDim * 0.1, dist);
      camera.near = dist / 100;
      camera.far = dist * 100;
      camera.updateProjectionMatrix();

      controls.target.set(0, 0, 0);
      controls.minDistance = dist * 0.4;
      controls.maxDistance = dist * 2.5;
      controls.update();

      // Colocar el suelo bajo el modelo
      const yMin = box.min.y - center.y;
      ground.position.y = yMin - 0.005;
    };

    /* ----------------------------------------------------
       TOGGLE DE ILUMINACIÓN
       ---------------------------------------------------- */
    const toggleLighting = () => {
      isDayLight = !isDayLight;

      if (glowEl) {
        glowEl.classList.toggle('is-night', !isDayLight);
      }

      if (lightIconEl) {
        const useEl = lightIconEl.querySelector('use');
        if (useEl) {
          useEl.setAttribute('href', isDayLight
            ? 'assets/icons/sprite.svg#icon-sun'
            : 'assets/icons/sprite.svg#icon-moon'
          );
        }
      }

      if (isDayLight) {
        hemiLight.intensity = 1.2;
        keyLight.intensity = 2.2;
        fillLight.intensity = 0.6;
        renderer.toneMappingExposure = 1.0;
      } else {
        hemiLight.intensity = 0.5;
        keyLight.intensity = 1.2;
        fillLight.intensity = 0.3;
        renderer.toneMappingExposure = 0.75;
      }
    };

    if (lightToggle) {
      lightToggle.addEventListener('click', toggleLighting);
    }

    /* ----------------------------------------------------
       PRESETS DE ÁNGULO
       ---------------------------------------------------- */
    const setAngle = (angleKey) => {
      controls.autoRotate = false;

      const dist = camera.position.length();
      const targetY = 0;

      switch (angleKey) {
        case 'front':
          camera.position.set(0, dist * 0.08, dist);
          if (modeLabelEl) modeLabelEl.textContent = 'Vista Frontal';
          break;
        case 'side':
          camera.position.set(dist * 0.7, dist * 0.1, dist * 0.7);
          if (modeLabelEl) modeLabelEl.textContent = 'Perspectiva 3/4';
          break;
        case 'back':
          camera.position.set(0, dist * 0.08, -dist);
          if (modeLabelEl) modeLabelEl.textContent = 'Vista Reversa';
          break;
        case 'texture':
          camera.position.set(-dist * 0.5, dist * 0.4, dist * 0.6);
          if (modeLabelEl) modeLabelEl.textContent = 'Detalle de Textura';
          break;
      }

      camera.lookAt(0, targetY, 0);
      controls.target.set(0, targetY, 0);
      controls.update();

      setTimeout(() => { controls.autoRotate = true; }, 4000);
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
       REDUCED MOTION
       ---------------------------------------------------- */
    if (window.LNS?.device.prefersReducedMotion()) {
      controls.autoRotate = false;
    }

    /* ----------------------------------------------------
       INTERSECTION OBSERVER — Pausa si no visible
       ---------------------------------------------------- */
    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => { isVisible = entry.isIntersecting; });
        },
        { threshold: 0.05 }
      );
      observer.observe(container);
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

    /* ----------------------------------------------------
       RENDER LOOP
       ---------------------------------------------------- */
    const animate = () => {
      requestAnimationFrame(animate);
      if (!isVisible) return;

      const delta = clock.getDelta();
      if (currentMixer) currentMixer.update(delta);

      controls.update();
      renderer.render(scene, camera);
    };

    animate();

    /* ----------------------------------------------------
       INICIAR CARGA
       ---------------------------------------------------- */
    loadModel();

  }

  /* --------------------------------------------------------
     ARRANQUE
     -------------------------------------------------------- */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }

})();