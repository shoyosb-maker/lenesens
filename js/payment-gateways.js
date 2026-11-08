/* ============================================================
   PAYMENT GATEWAYS — Pasarelas de pago (configuración)
   Guarda las llaves de las APIs bancarias en localStorage
   (lenesens_gateways). Consumido por el panel de ventas.
   ============================================================ */
(() => {
  'use strict';

  const STORAGE_KEY = 'lenesens_gateways';

  /* Las 3 formas de pago del checkout (una sola opción agrupa todo lo online) */
  const METHODS = {
    online: 'Pago en línea · Tarjeta, PSE, Nequi, Daviplata, Efecty y cuotas',
    paypal: 'PayPal',
    cod: 'Contraentrega (Lenesens)'
  };

  const PROVIDERS = [
    { id: 'wompi', name: 'Wompi', hint: 'Agrupa tarjetas, PSE, Nequi, Daviplata, Bancolombia, Efecty y BNPL', methods: ['online'], requiresKeys: true, keyFields: ['publicKey'] },
    { id: 'paypal', name: 'PayPal', hint: 'Pago internacional con la cuenta del negocio', methods: ['paypal'], requiresKeys: true, keyFields: ['publicKey'] },
    { id: 'contraentrega', name: 'Pago contraentrega', hint: 'Efectivo al recibir (sin API)', methods: ['cod'], requiresKeys: false },
    { id: 'payu', name: 'PayU Latam', hint: 'Tarjetas y PSE', methods: ['online'], requiresKeys: true },
    { id: 'epayco', name: 'ePayco', hint: 'Tarjetas y PSE', methods: ['online'], requiresKeys: true },
    { id: 'mercadopago', name: 'Mercado Pago', hint: 'Tarjetas y saldo', methods: ['online'], requiresKeys: true },
    { id: 'bold', name: 'Bold', hint: 'Datáfono y links de pago', methods: ['online'], requiresKeys: true },
    { id: 'addi', name: 'Addi', hint: 'Compra ahora, paga después', methods: ['online'], requiresKeys: true },
    { id: 'nequi', name: 'Nequi', hint: 'Transferencia desde el celular', methods: ['online'], requiresKeys: true },
    { id: 'bancolombia', name: 'Bancolombia', hint: 'Botón de pagos', methods: ['online'], requiresKeys: true },
    { id: 'otro', name: 'Otra pasarela', hint: 'Configuración manual', methods: [], requiresKeys: true }
  ];

  const providerInfo = (id) => PROVIDERS.find((item) => item.id === id) || PROVIDERS[PROVIDERS.length - 1];

  /* Métodos de versiones anteriores → forma de pago actual */
  const LEGACY_METHODS = {
    card: 'online',
    pse: 'online',
    nequi: 'online',
    daviplata: 'online',
    bancolombia: 'online',
    efecty: 'online',
    bnpl: 'online',
    addi: 'online',
    paypal: 'paypal',
    cod: 'cod'
  };

  /* Bases de API conocidas para validar llaves en vivo */
  const API_BASES = {
    wompi: {
      test: 'https://sandbox.wompi.co/v1',
      live: 'https://production.wompi.co/v1'
    }
  };

  /* Llaves de Wompi predeterminadas.
     La llave pública es pública por diseño (viaja en la URL del checkout).
     La llave privada, el secreto de integridad y el de eventos viven en
     `server/.env`; el navegador pide la URL firmada al backend.
     El panel de ventas permite sobrescribirlos (quedan en ese navegador). */
  const WOMPI_DEFAULTS = {
    publicKey: 'pub_prod_epqD9I1WpMHIvuvvvhWa5cG1YwIUVchE'
  };

  const DEFAULTS = [
    { id: 'contraentrega', provider: 'contraentrega', label: 'Pago contraentrega', mode: 'live', publicKey: '', privateKey: '', integritySecret: '', eventsSecret: '', webhookUrl: '', methods: ['cod'], enabled: true },
    { id: 'wompi', provider: 'wompi', label: 'Wompi · Tarjeta, PSE, Nequi y más', mode: 'live', ...WOMPI_DEFAULTS, privateKey: '', integritySecret: '', eventsSecret: '', webhookUrl: '', methods: ['online'], enabled: true },
    { id: 'paypal', provider: 'paypal', label: 'PayPal', mode: 'test', publicKey: '', privateKey: '', integritySecret: '', eventsSecret: '', webhookUrl: '', methods: ['paypal'], enabled: false }
  ];

  const storage = () => window.LNS?.storage;

  /* ---------------------------------------------------- */
  /* URL de notificaciones (webhook)                      */
  /* ---------------------------------------------------- */
  const WEBHOOK_BASE = 'https://lenesens.com.co/api/webhooks';

  const randomToken = (length = 24) => {
    const bytes = new Uint8Array(Math.ceil(length / 2));
    if (window.crypto?.getRandomValues) {
      window.crypto.getRandomValues(bytes);
    } else {
      for (let i = 0; i < bytes.length; i++) bytes[i] = Math.floor(Math.random() * 256);
    }
    return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('').slice(0, length);
  };

  /* URL sugerida: base + id de la pasarela + token secreto */
  const suggestedWebhook = (gateway) => {
    const token = gateway.webhookToken || randomToken();
    return `${WEBHOOK_BASE}/${encodeURIComponent(gateway.id)}?key=${token}`;
  };

  /* URL que se usa realmente (la editada si existe) */
  const webhookUrlOf = (gateway) => (gateway.webhookUrl || '').trim() || suggestedWebhook(gateway);

  const isValidWebhook = (url) => {
    try {
      const parsed = new URL(url);
      return parsed.protocol === 'https:' || parsed.protocol === 'http:';
    } catch {
      return false;
    }
  };

  const normalize = (gateway = {}) => {
    const provider = providerInfo(gateway.provider);
    const rawMethods = Array.isArray(gateway.methods) && gateway.methods.length
      ? gateway.methods
      : provider.methods;
    const methods = [...new Set(rawMethods.map((method) => LEGACY_METHODS[method] || method))]
      .filter((method) => provider.methods.includes(method));

    return {
      id: gateway.id || provider.id,
      provider: provider.id,
      label: (gateway.label || provider.name).trim(),
      mode: gateway.mode === 'live' ? 'live' : 'test',
      publicKey: gateway.publicKey || '',
      privateKey: gateway.privateKey || '',
      integritySecret: gateway.integritySecret || '',
      eventsSecret: gateway.eventsSecret || '',
      webhookUrl: (gateway.webhookUrl || '').trim(),
      webhookToken: gateway.webhookToken || '',
      methods: methods.length ? methods : provider.methods.slice(),
      enabled: Boolean(gateway.enabled),
      verified: gateway.verified && typeof gateway.verified === 'object'
        ? {
          ok: Boolean(gateway.verified.ok),
          message: String(gateway.verified.message || ''),
          at: Number(gateway.verified.at) || 0
        }
        : null,
      updatedAt: Number(gateway.updatedAt) || Date.now()
    };
  };

  const read = () => {
    const saved = storage()?.get(STORAGE_KEY, null);
    if (!Array.isArray(saved) || !saved.length) return DEFAULTS.map(normalize);
    return saved.map(normalize);
  };

  const write = (list) => {
    storage()?.set(STORAGE_KEY, list.map(normalize));
    document.dispatchEvent(new CustomEvent('gateways:change'));
    return list;
  };

  /* Asegura que cada pasarela tenga token de webhook y persiste la migración */
  const all = () => {
    const list = read();
    let migrated = false;

    list.forEach((gateway) => {
      if (!gateway.webhookToken) {
        gateway.webhookToken = randomToken();
        migrated = true;
      }
    });

    if (migrated) storage()?.set(STORAGE_KEY, list.map(normalize));
    return list;
  };

  const get = (id) => all().find((item) => item.id === id) || null;

  const save = (gateway) => {
    const list = all();
    const normalized = normalize({ ...gateway, updatedAt: Date.now() });

    if (!normalized.webhookToken) normalized.webhookToken = randomToken();

    const index = list.findIndex((item) => item.id === normalized.id);

    if (index >= 0) list[index] = normalized;
    else list.push(normalized);

    write(list);
    return normalized;
  };

  /* Genera un token nuevo para la URL de notificaciones */
  const regenerateWebhook = (id) => {
    const list = all();
    const target = list.find((item) => item.id === id);
    if (!target) return null;

    target.webhookToken = randomToken();
    target.webhookUrl = '';
    write(list);
    return suggestedWebhook(target);
  };

  /* Vuelve a la URL sugerida (descarta la personalizada) */
  const resetWebhook = (id) => {
    const list = all();
    const target = list.find((item) => item.id === id);
    if (!target) return null;

    target.webhookUrl = '';
    write(list);
    return suggestedWebhook(target);
  };

  const create = (providerId = 'otro') => {
    const info = providerInfo(providerId);
    const list = all();

    let id = providerId;
    let suffix = 2;
    while (list.some((item) => item.id === id)) {
      id = `${providerId}-${suffix++}`;
    }

    return save({
      id,
      provider: info.id,
      label: info.name,
      mode: 'test',
      methods: info.methods.slice(),
      enabled: false,
      webhookToken: randomToken()
    });
  };

  const remove = (id) => write(all().filter((item) => item.id !== id));

  const reset = () => {
    storage()?.remove(STORAGE_KEY);
    document.dispatchEvent(new CustomEvent('gateways:change'));
    return all();
  };

  const active = () => all().filter((item) => item.enabled);

  const activeMethods = () => {
    const set = new Set();
    active().forEach((gateway) => gateway.methods.forEach((method) => set.add(method)));
    return [...set];
  };

  const isComplete = (gateway) => {
    const info = providerInfo(gateway.provider);
    if (!info.requiresKeys) return true;
    const fields = info.keyFields || ['publicKey', 'privateKey'];
    return fields.every((field) => String(gateway[field] || '').trim());
  };

  /* ---------------------------------------------------- */
  /* Validación en vivo contra la API de la pasarela      */
  /* ---------------------------------------------------- */
  const apiBase = (gateway) => {
    const bases = API_BASES[gateway.provider];
    if (!bases) return null;
    return bases[gateway.mode === 'live' ? 'live' : 'test'];
  };

  const withTimeout = (promise, ms = 12000) => Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), ms))
  ]);

  const verify = async (gateway) => {
    const base = apiBase(gateway);

    if (!base) {
      return {
        ok: false,
        unsupported: true,
        message: `${providerInfo(gateway.provider).name}: la validación automática todavía no está disponible.`
      };
    }

    if (!gateway.publicKey || !gateway.privateKey) {
      return { ok: false, message: 'La validación en vivo necesita la llave privada en este navegador (también puede vivir en server/.env).' };
    }

    const result = { ok: false, publicKey: null, privateKey: null, merchant: null, message: '' };

    /* 1. Llave pública → datos del comercio */
    try {
      const response = await withTimeout(fetch(`${base}/merchants/${encodeURIComponent(gateway.publicKey)}`));
      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        result.publicKey = false;
        result.message = 'La llave pública no es válida para este entorno.';
        return result;
      }

      result.publicKey = true;
      result.merchant = payload?.data
        ? {
          id: payload.data.id,
          name: payload.data.name,
          active: payload.data.active,
          currencies: payload.data.accepted_currencies || [],
          methods: payload.data.accepted_payment_methods || []
        }
        : null;
    } catch (error) {
      result.publicKey = false;
      result.message = error.message === 'timeout'
        ? 'La API no respondió a tiempo (revisa tu conexión).'
        : 'No se pudo conectar con la API de la pasarela.';
      return result;
    }

    /* 2. Llave privada → endpoint autenticado */
    try {
      const now = new Date();
      const from = new Date(now.getTime() - 30 * 86400000);
      const query = new URLSearchParams({
        from_date: from.toISOString(),
        until_date: now.toISOString(),
        page: '1',
        page_size: '1'
      });

      const response = await withTimeout(fetch(`${base}/transactions?${query}`, {
        headers: { Authorization: `Bearer ${gateway.privateKey}` }
      }));

      result.privateKey = response.ok;
      if (!response.ok) {
        result.message = response.status === 401
          ? 'La llave privada no es válida (401).'
          : `La llave privada fue rechazada (HTTP ${response.status}).`;
        return result;
      }
    } catch (error) {
      result.privateKey = false;
      result.message = 'No se pudo validar la llave privada (conexión).';
      return result;
    }

    result.ok = true;
    result.message = result.merchant
      ? `Llaves válidas · comercio ${result.merchant.name}${result.merchant.active ? '' : ' (inactivo)'} · ${gateway.mode === 'live' ? 'producción' : 'sandbox'}`
      : 'Llaves válidas.';

    return result;
  };

  window.LNS = window.LNS || {};
  window.LNS.gateways = {
    STORAGE_KEY,
    METHODS,
    PROVIDERS,
    WEBHOOK_BASE,
    providerInfo,
    all,
    get,
    save,
    create,
    remove,
    reset,
    active,
    activeMethods,
    isComplete,
    suggestedWebhook,
    webhookUrlOf,
    isValidWebhook,
    regenerateWebhook,
    resetWebhook,
    verify,
    apiBase
  };
})();
