/* ============================================================
   I18N — Motor de traducción ES/EN
   Lenesens Hydralight
   ============================================================ */
'use strict';
(function initI18n() {
  const STORAGE_KEY = 'lenesens_lang';
  const DEFAULT_LANG = 'es';
  const SUPPORTED = ['es', 'en'];

  // Detecta el idioma guardado o el del navegador
  const detectLanguage = () => {
    const saved = window.LNS?.storage?.get?.(STORAGE_KEY, null)
      || localStorage.getItem(STORAGE_KEY);

    if (saved && SUPPORTED.includes(saved)) return saved;

    const browserLang = (navigator.language || 'es').toLowerCase();
    if (browserLang.startsWith('en')) return 'en';
    return DEFAULT_LANG;
  };

  // Obtiene un valor de un objeto anidado: 'nav.home' → dict.nav.home
  const getValue = (obj, path) => {
    if (!obj || !path) return null;
    return path.split('.').reduce((acc, key) => (acc && acc[key] !== undefined ? acc[key] : null), obj);
  };

  // Interpola variables: "Hola {name}" + {name: "Ana"} → "Hola Ana"
  const interpolate = (str, vars) => {
    if (!vars) return str;
    return str.replace(/\{(\w+)\}/g, (match, key) => {
      return vars[key] !== undefined ? vars[key] : match;
    });
  };

  let currentLang = DEFAULT_LANG;

  // Aplica las traducciones a todos los elementos con data-i18n
  const applyTranslations = (lang, customDict) => {
    const dict = customDict || window.LNS_TRANSLATIONS?.[lang];
    if (!dict) {
      console.warn(`[i18n] No hay traducciones para "${lang}"`);
      return;
    }

    // 1. Textos: data-i18n="key" → textContent
    document.querySelectorAll('[data-i18n]').forEach((el) => {
      const key = el.dataset.i18n;
      const raw = getValue(dict, key);
      if (raw === null) return;

      const vars = el.dataset.i18nVars
        ? JSON.parse(el.dataset.i18nVars)
        : null;
      const value = interpolate(raw, vars);

      if (value.includes('<')) {
        el.innerHTML = value;
      } else {
        el.textContent = value;
      }
    });

    // 2. Atributos: data-i18n-attr="placeholder:key,aria-label:key2"
    document.querySelectorAll('[data-i18n-attr]').forEach((el) => {
      el.dataset.i18nAttr.split(',').forEach((pair) => {
        const [attr, key] = pair.split(':').map((s) => s.trim());
        if (!attr || !key) return;
        const value = getValue(dict, key);
        if (value !== null) el.setAttribute(attr, value);
      });
    });

    // 3. Actualizar <html lang="">
    document.documentElement.lang = lang;
  };

  // Actualiza el botón toggle para mostrar el idioma OPUESTO
  const updateLangButton = (lang) => {
    const label = document.querySelector('[data-lang-label]');
    const button = document.querySelector('[data-lang-toggle]');
    if (!label) return;

    const nextLang = lang === 'es' ? 'en' : 'es';
    label.textContent = nextLang.toUpperCase();

    if (button) {
      button.setAttribute(
        'aria-label',
        lang === 'es' ? 'Switch to English' : 'Cambiar a Español'
      );
      button.setAttribute('title', lang === 'es' ? 'Switch to English' : 'Cambiar a Español');
    }
  };

  // Cambia el idioma
  const setLanguage = (lang) => {
    if (!SUPPORTED.includes(lang)) return;
    currentLang = lang;

    try {
      localStorage.setItem(STORAGE_KEY, lang);
    } catch (e) {
      console.warn('[i18n] No se pudo guardar la preferencia');
    }

    applyTranslations(lang);
    updateLangButton(lang);

    document.dispatchEvent(
      new CustomEvent('language:change', {
        detail: { lang },
      })
    );

    const langName = lang === 'es' ? 'Español' : 'English';
    window.LNS?.a11y?.announce?.(`Idioma cambiado a ${langName}`);
  };

  // Inicialización
  const init = () => {
    currentLang = detectLanguage();

    applyTranslations(currentLang);
    updateLangButton(currentLang);

    // Conectar el botón toggle (puede haber 1 por página)
    document.querySelectorAll('[data-lang-toggle]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const nextLang = currentLang === 'es' ? 'en' : 'es';
        setLanguage(nextLang);
      });
    });
  };

  // API global
  window.LNS = window.LNS || {};
  window.LNS.i18n = {
    get: (key, vars) => {
      const dict = window.LNS_TRANSLATIONS?.[currentLang];
      const raw = getValue(dict, key);
      return raw ? interpolate(raw, vars) : key;
    },
    setLanguage,
    getLanguage: () => currentLang,
    applyTranslations,
    supported: SUPPORTED,
  };

  window.LNS?.ready(init) ?? document.addEventListener('DOMContentLoaded', init);
})();