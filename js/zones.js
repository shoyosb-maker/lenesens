/* ============================================================
   ZONES — Tabs interactivos de zonas anatómicas
   Lenesens Hydralight
   Cambia el panel dinámico según la zona seleccionada.
   Usa SVG sprite para el icono del panel.
   ============================================================ */

'use strict';

(function initZones() {

  /* ----------------------------------------------------
     DATOS DE LAS ZONAS
     Cada zona tiene: título, badge, descripción, stat, icono
     (el nombre del icono corresponde al ID del sprite)
     ---------------------------------------------------- */
  const ZONES_DATA = {
    axilas: {
      title: 'Protocolo para Axilas',
      badge: 'Uso Diario',
      desc: 'Aplica 1 gota generosa tras el baño matutino y antes de dormir. Si te has rasurado con cuchilla o cera, espera 5 minutos y aplica Hydralight 360° para calmar la irritación y bloquear la sobreproducción de melanina que genera el oscurecimiento axilar.',
      stat: '87% más clara en 21 días',
      icon: 'droplet'
    },
    codos: {
      title: 'Protocolo para Codos',
      badge: 'Nutrición Profunda',
      desc: 'El ácido glicólico rompe la acumulación de células muertas queratinizadas causadas por apoyar los brazos en mesas y escritorios. Masajea vigorosamente en círculos durante 20 segundos para devolver la textura lisa y el tono natural.',
      stat: '92% suavidad en 14 días',
      icon: 'hand'
    },
    rodillas: {
      title: 'Protocolo para Rodillas',
      badge: 'Fórmula Renovadora',
      desc: 'Zona con piel gruesa propensa a la hiperpigmentación por fricción. La combinación de ácido láctico y escualano penetra los pliegues dérmicos suavizando la sombra grisácea y aportando un brillo satinado saludable.',
      stat: '85% unificación en 4 semanas',
      icon: 'leg'
    },
    manos: {
      title: 'Protocolo para Manos',
      badge: 'Escudo Antioxidante',
      desc: 'Ideal para atenuar pequeñas manchas de fotoenvejecimiento por exposición al sol al conducir. Aplica media pulsación en el dorso de cada mano y sella siempre con tu protector solar habitual.',
      stat: '89% brillo juvenil en 20 días',
      icon: 'sparkle'
    },
    intimas: {
      title: 'Protocolo para Zonas Íntimas Externas',
      badge: 'Tolerancia Óptima',
      desc: 'Diseñado para entrepierna y zona de bikini externa afectada por el elástico de la ropa interior y la fricción constante al caminar. Su fórmula no altera el pH superficial y deja la piel elástica y libre de manchas oscuras.',
      stat: '94% de tolerancia dérmica',
      icon: 'shield-check'
    }
  };

  const init = () => {

    /* ----------------------------------------------------
       1. REFERENCIAS AL DOM
       ---------------------------------------------------- */
    const tabs = document.querySelectorAll('.zone-tab');
    if (!tabs.length) return;

    const panel = document.querySelector('[data-zone-detail]');
    const titleEl = document.getElementById('zone-detail-title');
    const badgeEl = document.getElementById('zone-detail-badge');
    const descEl  = document.getElementById('zone-detail-desc');
    const statEl  = document.getElementById('zone-detail-stat');
    const iconEl  = document.getElementById('zone-detail-icon-svg'); // ← SVG actualizado

    /* ----------------------------------------------------
       2. ACTUALIZAR PANEL
       ---------------------------------------------------- */
    const updatePanel = (zoneKey) => {
      const data = ZONES_DATA[zoneKey];
      if (!data) return;

      // Efecto de fade
      if (panel) panel.style.opacity = '0.4';

      setTimeout(() => {
        if (titleEl) titleEl.textContent = data.title;
        if (badgeEl) badgeEl.textContent = data.badge;
        if (descEl)  descEl.textContent  = data.desc;
        if (statEl)  statEl.textContent  = data.stat;

        // Actualizar el icono SVG del sprite
        if (iconEl) {
          const useEl = iconEl.querySelector('use');
          if (useEl) {
            useEl.setAttribute('href', `assets/icons/sprite.svg#icon-${data.icon}`);
          }
        }

        if (panel) panel.style.opacity = '1';
      }, 150);

      // Emitir evento
      document.dispatchEvent(new CustomEvent('zone:change', {
        detail: { zone: zoneKey }
      }));
    };

    /* ----------------------------------------------------
       3. CONECTAR TABS
       ---------------------------------------------------- */
    tabs.forEach((tab) => {
      tab.addEventListener('click', () => {
        const zoneKey = tab.dataset.zone;
        if (!zoneKey) return;

        // Actualizar estado activo
        tabs.forEach((t) => {
          const isActive = t === tab;
          t.classList.toggle('is-active', isActive);
          t.setAttribute('aria-selected', isActive ? 'true' : 'false');
        });

        updatePanel(zoneKey);
      });

      // Soporte teclado
      tab.addEventListener('keydown', (e) => {
        if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;

        const tabsArray = Array.from(tabs);
        const currentIndex = tabsArray.indexOf(tab);
        const nextIndex = e.key === 'ArrowRight'
          ? (currentIndex + 1) % tabsArray.length
          : (currentIndex - 1 + tabsArray.length) % tabsArray.length;

        tabsArray[nextIndex].focus();
        tabsArray[nextIndex].click();
      });
    });

  };

  window.LNS?.ready(init) ?? document.addEventListener('DOMContentLoaded', init);

})();