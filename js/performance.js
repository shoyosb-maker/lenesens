/* ============================================================
   PERFORMANCE — Optimizaciones en runtime
   Lenesens Hydralight
   Precarga de recursos, prefetch de páginas, y métricas.
   ============================================================ */

'use strict';

(function initPerformance() {

  const init = () => {

    /* ----------------------------------------------------
       1. PREFETCH DE PÁGINAS (hover inteligente)
       Al pasar el mouse sobre un nav link, precarga la página
       ---------------------------------------------------- */
    if ('connection' in navigator && navigator.connection.saveData) {
      // Si el usuario pidió ahorro de datos, no prefetch
      return;
    }

    const prefetched = new Set();

    const prefetchPage = (url) => {
      if (!url || prefetched.has(url)) return;
      if (!url.endsWith('.html')) return;

      const link = document.createElement('link');
      link.rel = 'prefetch';
      link.href = url;
      link.as = 'document';
      document.head.appendChild(link);

      prefetched.add(url);
    };

    // Prefetch al hover sobre links internos
    document.querySelectorAll('a[href$=".html"]').forEach((link) => {
      link.addEventListener('mouseenter', () => {
        prefetchPage(link.getAttribute('href'));
      }, { once: true, passive: true });
    });

    /* ----------------------------------------------------
       2. LAZY LOADING NATIVO para iframes
       ---------------------------------------------------- */
    document.querySelectorAll('iframe').forEach((iframe) => {
      if (!iframe.hasAttribute('loading')) {
        iframe.setAttribute('loading', 'lazy');
      }
    });

    /* ----------------------------------------------------
       3. MÉTRICAS DE PERFORMANCE (solo en dev)
       ---------------------------------------------------- */
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      logPerformanceMetrics();
    }

    /* ----------------------------------------------------
       4. DETECTAR CONEXIÓN LENTA
       ---------------------------------------------------- */
    if ('connection' in navigator) {
      const conn = navigator.connection;

      if (conn.effectiveType === 'slow-2g' || conn.effectiveType === '2g') {
        document.documentElement.classList.add('connection-slow');
      }

      if (conn.saveData) {
        document.documentElement.classList.add('connection-save-data');
      }
    }

    /* ----------------------------------------------------
       5. VISIBILITY API — Pausar animaciones en background
       ---------------------------------------------------- */
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        document.documentElement.classList.add('page-hidden');
      } else {
        document.documentElement.classList.remove('page-hidden');
      }
    });

  };

  /* =========================================================
     MÉTRICAS DE PERFORMANCE (Web Vitals)
     ========================================================= */
  function logPerformanceMetrics() {
    if (!('PerformanceObserver' in window)) return;

    console.log('%c⚡ Performance — Web Vitals', 'color: #7f003b; font-weight: bold; font-size: 14px;');

    // LCP — Largest Contentful Paint
    try {
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        const lcp = Math.round(lastEntry.startTime);
        const status = lcp < 2500 ? '✅' : lcp < 4000 ? '⚠️' : '❌';
        console.log(`${status} LCP: ${lcp}ms (objetivo: < 2500ms)`);
      });
      lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });
    } catch (e) {}

    // CLS — Cumulative Layout Shift
    try {
      let clsValue = 0;
      const clsObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (!entry.hadRecentInput) clsValue += entry.value;
        }
      });
      clsObserver.observe({ type: 'layout-shift', buffered: true });

      setTimeout(() => {
        const cls = clsValue.toFixed(3);
        const status = cls < 0.1 ? '✅' : cls < 0.25 ? '⚠️' : '❌';
        console.log(`${status} CLS: ${cls} (objetivo: < 0.1)`);
      }, 3000);
    } catch (e) {}

    // FID — First Input Delay
    try {
      const fidObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          const fid = Math.round(entry.processingStart - entry.startTime);
          const status = fid < 100 ? '✅' : fid < 300 ? '⚠️' : '❌';
          console.log(`${status} FID: ${fid}ms (objetivo: < 100ms)`);
        });
      });
      fidObserver.observe({ type: 'first-input', buffered: true });
    } catch (e) {}

    // TTFB — Time to First Byte
    try {
      const navEntry = performance.getEntriesByType('navigation')[0];
      if (navEntry) {
        const ttfb = Math.round(navEntry.responseStart - navEntry.requestStart);
        const status = ttfb < 800 ? '✅' : ttfb < 1800 ? '⚠️' : '❌';
        console.log(`${status} TTFB: ${ttfb}ms (objetivo: < 800ms)`);
      }
    } catch (e) {}

    // Page Load completo
    window.addEventListener('load', () => {
      setTimeout(() => {
        const navEntry = performance.getEntriesByType('navigation')[0];
        if (navEntry) {
          const loadTime = Math.round(navEntry.loadEventEnd - navEntry.startTime);
          const status = loadTime < 2500 ? '✅' : loadTime < 5000 ? '⚠️' : '❌';
          console.log(`${status} Page Load: ${loadTime}ms`);
        }
      }, 100);
    });
  }

  window.LNS?.ready(init) ?? document.addEventListener('DOMContentLoaded', init);

})();