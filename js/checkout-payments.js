/* ============================================================
   CHECKOUT · Métodos de pago conectados a las pasarelas
   Renderiza solo los métodos que ofrecen las pasarelas activas
   (catálogo real de Wompi) y valida antes de cobrar.
   ============================================================ */
(() => {
  'use strict';

  /* Catálogo de opciones de pago: el checkout solo ofrece 3 caminos */
  const CATALOG = {
    online: {
      icon: 'icon-card',
      tags: ['Tarjeta', 'PSE', 'Nequi', 'Daviplata', 'Bancolombia', 'Efecty', 'Cuotas'],
      es: {
        title: 'Pago en línea',
        badge: null,
        desc: 'Tarjeta débito/crédito, PSE, Nequi, Daviplata, Bancolombia, Efecty y cuotas en un mismo checkout seguro.',
        tip: 'Te llevamos al checkout seguro de Wompi: eliges el medio y confirmas en segundos.'
      },
      en: {
        title: 'Pay online',
        badge: null,
        desc: 'Debit/credit card, PSE, Nequi, Daviplata, Bancolombia, Efecty and installments in one secure checkout.',
        tip: "We take you to Wompi's secure checkout: pick your method and confirm in seconds."
      }
    },
    paypal: {
      icon: 'icon-sell',
      tags: ['PayPal'],
      es: {
        title: 'PayPal',
        badge: 'Internacional',
        desc: 'Paga con tu saldo o con la tarjeta vinculada a tu cuenta PayPal.',
        tip: 'Serás redirigido a PayPal para aprobar el pago con tu cuenta.'
      },
      en: {
        title: 'PayPal',
        badge: 'International',
        desc: 'Pay with your PayPal balance or the card linked to your account.',
        tip: "You'll be redirected to PayPal to approve the payment with your account."
      }
    },
    cod: {
      icon: 'icon-truck',
      tags: [],
      es: {
        title: 'Pago contraentrega en efectivo',
        badge: 'Recomendado',
        desc: 'Pagas al recibir tu producto sellado en la puerta de tu casa u oficina.',
        tip: 'Ten el efectivo listo: los mensajeros llevan datáfono sujeto a cobertura.'
      },
      en: {
        title: 'Cash on delivery',
        badge: 'Recommended',
        desc: 'Pay when you receive your sealed product at your home or office door.',
        tip: 'Have the cash ready: couriers carry a card reader subject to coverage.'
      }
    }
  };

  /* Orden de las opciones en el checkout */
  const ORDER = ['online', 'paypal', 'cod'];

  /* PayPal no acepta COP: se convierte a USD con la misma tasa del header */
  const COP_PER_USD = 4000;

  const MASK = (key) => {
    const value = String(key || '');
    if (!value) return '';
    if (value.length <= 12) return value.slice(0, 4) + '••••';
    return value.slice(0, 8) + '••••' + value.slice(-4);
  };

  const api = () => window.LNS?.gateways;
  const toast = (type, message) => window.LNS?.toast?.[type]?.(message);

  const mount = document.querySelector('[data-payment-methods]');
  const state = { selected: null };

  const lang = () => ((window.LNS?.i18n?.getLanguage?.() || document.documentElement.lang) === 'en' ? 'en' : 'es');
  const copyFor = (method) => CATALOG[method]?.[lang()] || CATALOG[method]?.es || {};
  const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[char]));

  /* ---------------------------------------------------- */
  /* Pasarelas                                            */
  /* ---------------------------------------------------- */
  const gatewayFor = (method) => {
    const gateways = api()?.all?.() || [];
    return gateways.find((gateway) =>
      gateway.enabled && gateway.methods.includes(method) && api().isComplete(gateway)
    ) || null;
  };

  const partialFor = (method) => {
    const gateways = api()?.all?.() || [];
    return gateways.find((gateway) => gateway.methods.includes(method)) || null;
  };

  const availableMethods = () => ORDER.filter((method) => gatewayFor(method));

  /* Campos obligatorios según la pasarela (PayPal solo pide la cuenta) */
  const keysOf = (gateway) => api()?.providerInfo?.(gateway.provider)?.keyFields || ['publicKey', 'privateKey'];

  const missingKeys = (gateway) => keysOf(gateway).filter((field) => !String(gateway[field] || '').trim());

  const missingReason = (gateway) => {
    if (!missingKeys(gateway).length) return '';
    if (gateway.provider === 'paypal') {
      return lang() === 'es' ? 'falta el correo de la cuenta PayPal' : 'the PayPal account email is missing';
    }
    return lang() === 'es' ? 'faltan las llaves pública y privada' : 'public and private keys are missing';
  };

  /* ---------------------------------------------------- */
  /* Render                                               */
  /* ---------------------------------------------------- */
  const gatewayNote = (method) => {
    const gateway = gatewayFor(method);
    const partial = partialFor(method);

    if (gateway) {
      if (gateway.provider === 'contraentrega') {
        return `
          <span class="payment-gateway is-ready">
            <svg aria-hidden="true"><use href="assets/icons/sprite.svg#icon-shield-check"></use></svg>
            <span>${lang() === 'es' ? 'Sin pasarela: pagas al recibir tu pedido, sin recargos' : 'No gateway needed: you pay when your order arrives, no extra fees'}</span>
          </span>`;
      }

      const mode = gateway.mode === 'live'
        ? (lang() === 'es' ? 'producción' : 'live')
        : (lang() === 'es' ? 'modo pruebas' : 'test mode');
      const key = gateway.provider === 'paypal' ? String(gateway.publicKey || '') : MASK(gateway.publicKey);
      const who = gateway.provider === 'wompi' ? 'Wompi' : (gateway.provider === 'paypal' ? 'PayPal' : gateway.label);

      return `
        <span class="payment-gateway is-ready">
          <svg aria-hidden="true"><use href="assets/icons/sprite.svg#icon-shield-check"></use></svg>
          <span>${lang() === 'es' ? 'Procesado por' : 'Processed by'} <strong>${esc(who)}</strong> · ${mode}${key ? ` · ${lang() === 'es' ? 'cuenta' : 'account'} ${esc(key)}` : ''}</span>
        </span>`;
    }

    if (partial) {
      const reason = !partial.enabled
        ? (lang() === 'es' ? 'la pasarela está inactiva' : 'the gateway is inactive')
        : missingReason(partial);

      return `
        <span class="payment-gateway is-blocked">
          <svg aria-hidden="true"><use href="assets/icons/sprite.svg#icon-info"></use></svg>
          <span>${esc(partial.label)}: ${reason}. <a href="admin.html">${lang() === 'es' ? 'Configúrala en el panel' : 'Configure it in the panel'}</a>.</span>
        </span>`;
    }

    return `
      <span class="payment-gateway is-blocked">
        <svg aria-hidden="true"><use href="assets/icons/sprite.svg#icon-info"></use></svg>
        <span>${lang() === 'es' ? 'Método sin pasarela configurada.' : 'Method without a configured gateway.'} <a href="admin.html">${lang() === 'es' ? 'Añádela en el panel' : 'Add one in the panel'}</a>.</span>
      </span>`;
  };

  const cardTemplate = (method, index) => {
    const copy = copyFor(method);
    const gateway = gatewayFor(method);
    const checked = gateway && (state.selected === method);
    const totalCOP = Number(window.LNS?.cart?.getTotals?.().total) || 0;
    const totalUSD = (totalCOP / COP_PER_USD).toFixed(2);

    return `
      <label class="payment-method ${gateway ? '' : 'is-unavailable'} ${checked ? 'is-active' : ''}" data-payment-option="${method}">
        <input type="radio" name="payment_method" value="${method}" ${gateway ? '' : 'disabled'} ${checked ? 'checked' : ''}>
        <span class="payment-method-radio" aria-hidden="true"></span>
        <span class="payment-method-body">
          <span class="payment-method-header">
            <span class="payment-method-name">
              <svg class="payment-method-svg" aria-hidden="true"><use href="assets/icons/sprite.svg#${CATALOG[method].icon}"></use></svg>
              ${esc(copy.title)}
            </span>
            <span class="payment-method-tags">
              ${(CATALOG[method].tags || []).map((tag) => `<span class="payment-method-tag">${esc(tag)}</span>`).join('')}
              ${copy.badge ? `<span class="payment-method-tag is-accent">${esc(copy.badge)}</span>` : ''}
            </span>
          </span>
          <span class="payment-method-desc">${esc(copy.desc)}</span>
          <span class="payment-method-panel">
            ${method === 'cod' ? `
              <span class="payment-method-note">
                <svg class="icon icon-sm" aria-hidden="true"><use href="assets/icons/sprite.svg#icon-check-circle"></use></svg>
                <span>${lang() === 'es' ? 'Monto exacto a cancelar:' : 'Exact amount to pay:'}</span>
                <strong data-cod-amount>$0 COP</strong>
              </span>` : ''}
            ${method === 'paypal' ? `
              <span class="payment-method-note">
                <svg class="icon icon-sm" aria-hidden="true"><use href="assets/icons/sprite.svg#icon-card"></use></svg>
                <span>${lang() === 'es' ? 'Equivale a:' : 'Equivalent to:'}</span>
                <strong data-paypal-amount>US$ ${totalUSD}</strong>
              </span>` : ''}
            <span class="payment-method-tip">
              <svg class="icon icon-sm" aria-hidden="true"><use href="assets/icons/sprite.svg#icon-lock"></use></svg>
              <span>${esc(copy.tip)}</span>
            </span>
            ${gatewayNote(method)}
          </span>
        </span>
      </label>
    `;
  };

  const render = () => {
    if (!mount) return;

    const methods = availableMethods();
    const visible = ORDER.filter((method) => gatewayFor(method) || partialFor(method));

    if (!visible.length) {
      mount.innerHTML = `
        <p class="payment-empty">
          ${lang() === 'es'
            ? 'No hay métodos de pago disponibles. <a href="admin.html">Configura una pasarela</a> para activarlos.'
            : 'No payment methods available. <a href="admin.html">Configure a gateway</a> to enable them.'}
        </p>`;
      state.selected = null;
      document.dispatchEvent(new CustomEvent('payment:methods', { detail: { methods: [], selected: null } }));
      return;
    }

    if (!state.selected || !gatewayFor(state.selected)) {
      state.selected = methods[0] || null;
    }

    mount.innerHTML = visible.map(cardTemplate).join('');

    document.dispatchEvent(new CustomEvent('payment:methods', {
      detail: { methods, selected: state.selected }
    }));

    if (state.selected) {
      document.dispatchEvent(new CustomEvent('payment:change', { detail: { method: state.selected } }));
    }
  };

  /* ---------------------------------------------------- */
  /* Selección                                            */
  /* ---------------------------------------------------- */
  const onSelect = (method) => {
    if (!gatewayFor(method)) return;
    state.selected = method;

    document.querySelectorAll('[data-payment-option]').forEach((label) => {
      label.classList.toggle('is-active', label.getAttribute('data-payment-option') === method);
    });

    document.dispatchEvent(new CustomEvent('payment:change', { detail: { method } }));
  };

  mount?.addEventListener('change', (event) => {
    const radio = event.target.closest('input[name="payment_method"]');
    if (!radio) return;
    onSelect(radio.value);
  });

  mount?.addEventListener('click', (event) => {
    const label = event.target.closest('[data-payment-option]');
    if (!label) return;

    const method = label.getAttribute('data-payment-option');
    if (gatewayFor(method)) return;

    event.preventDefault();
    toast('error', lang() === 'es'
      ? 'Esa forma de pago todavía no está activa. Configúrala en el panel de pagos.'
      : 'That payment option is not active yet. Configure it in the payments panel.');
  });

  /* ---------------------------------------------------- */
  /* API pública                                          */
  /* ---------------------------------------------------- */
  const getSelected = () => state.selected
    || document.querySelector('input[name="payment_method"]:checked')?.value
    || null;

  const validate = (method) => {
    const target = method || getSelected();
    const gateway = gatewayFor(target);

    if (gateway) {
      if (gateway.provider === 'wompi' && !gateway.integritySecret) {
        toast('warning', 'Wompi no tiene el secreto de integridad en este navegador: la firma se pedirá a server/.env.');
      }

      return true;
    }

    const partial = partialFor(target);

    if (partial) {
      toast('error', !partial.enabled
        ? (lang() === 'es' ? `${partial.label} está inactiva. Actívala en el panel de pagos.` : `${partial.label} is inactive. Enable it in the payments panel.`)
        : (lang() === 'es' ? `${partial.label}: ${missingReason(partial)}.` : `${partial.label}: ${missingReason(partial)}.`));
      return false;
    }

    toast('error', lang() === 'es'
      ? 'Esta forma de pago no tiene una pasarela configurada.'
      : 'This payment option has no configured gateway.');
    return false;
  };

  const snapshot = (method) => {
    const gateway = gatewayFor(method || getSelected());
    if (!gateway) return null;

    return {
      id: gateway.id,
      provider: gateway.provider,
      label: gateway.label,
      mode: gateway.mode,
      publicKeyMasked: gateway.provider === 'paypal' ? '' : MASK(gateway.publicKey)
    };
  };

  /* ---------------------------------------------------- */
  /* PayPal: link de pago (sin API, con la cuenta del panel) */
  /* ---------------------------------------------------- */
  const PAYPAL_LIVE = 'https://www.paypal.com/cgi-bin/webscr';
  const PAYPAL_TEST = 'https://www.sandbox.paypal.com/cgi-bin/webscr';

  const buildPayPalUrl = (gateway, order) => {
    const business = String(gateway?.publicKey || '').trim();
    if (!business) return { ok: false, error: 'missing_paypal_account' };

    const amountInCents = Math.round(Number(order?.amountInCents));
    if (!order?.reference || !Number.isFinite(amountInCents) || amountInCents <= 0) {
      return { ok: false, error: 'invalid_order' };
    }

    const amount = (amountInCents / 100 / COP_PER_USD).toFixed(2);
    const base = gateway.mode === 'live' ? PAYPAL_LIVE : PAYPAL_TEST;

    const query = new URLSearchParams({
      cmd: '_xclick',
      business,
      item_name: `Lenesens Hydralight · ${order.reference}`,
      item_number: String(order.reference),
      amount,
      currency_code: 'USD',
      no_shipping: '1',
      no_note: '1'
    });

    const redirectUrl = String(order.redirectUrl ?? redirectUrlFor()).trim();
    if (redirectUrl && !isLocalOrigin()) query.set('return', redirectUrl);

    return {
      ok: true,
      url: `${base}?${query.toString()}`,
      amount,
      currency: 'USD',
      environment: gateway.mode === 'live' ? 'production' : 'sandbox',
      source: 'browser'
    };
  };

  /* Link de pago según la pasarela de la opción elegida */
  const createCheckoutLink = async (order) => {
    const gateway = gatewayFor(order?.method);
    if (!gateway) return { ok: false, error: 'no_gateway' };

    if (gateway.provider === 'wompi') return createWompiCheckout(order);
    if (gateway.provider === 'paypal') return buildPayPalUrl(gateway, order);

    return { ok: false, error: 'unsupported_gateway' };
  };

  /* ---------------------------------------------------- */
  /* Endpoint del backend y link de pago                  */
  /* ---------------------------------------------------- */
  const API_BASE = (() => {
    /* Permite apuntar a otro backend: checkout.html?api=http://localhost:3210
       o <meta name="lenesens-api" content="…"> */
    const fromQuery = new URLSearchParams(window.location.search).get('api');
    if (fromQuery) return fromQuery.replace(/\/+$/, '');

    const meta = document.querySelector('meta[name="lenesens-api"]')?.content?.trim();
    if (meta) return meta.replace(/\/+$/, '');

    const { protocol, hostname } = window.location;
    if (protocol === 'file:') return 'http://localhost:3000';
    if (hostname === 'localhost' || hostname === '127.0.0.1') return `${protocol}//${hostname}:3000`;
    return '';
  })();

  const isLocalOrigin = () => ['localhost', '127.0.0.1', ''].includes(window.location.hostname)
    || window.location.protocol === 'file:';

  const redirectUrlFor = () => {
    if (isLocalOrigin()) return '';
    return `${window.location.origin}/confirmacion.html`;
  };

  /* ---------------------------------------------------- */
  /* Firma del checkout (backend o navegador)             */
  /* ---------------------------------------------------- */
  const CHECKOUT_BASE = 'https://checkout.wompi.co/p/';

  const K = [
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
    0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
    0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
    0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
    0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
    0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2
  ];

  const rotr = (value, bits) => (value >>> bits) | (value << (32 - bits));

  /* SHA-256 en JS puro: crypto.subtle no existe fuera de HTTPS/localhost */
  const sha256Fallback = (bytes) => {
    const size = ((bytes.length + 9 + 63) >> 6) << 6;
    const buffer = new Uint8Array(size);
    buffer.set(bytes);
    buffer[bytes.length] = 0x80;

    const view = new DataView(buffer.buffer);
    const bitLength = bytes.length * 8;
    view.setUint32(size - 8, Math.floor(bitLength / 4294967296));
    view.setUint32(size - 4, bitLength >>> 0);

    let h = [0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19];
    const w = new Uint32Array(64);

    for (let offset = 0; offset < size; offset += 64) {
      for (let i = 0; i < 16; i++) w[i] = view.getUint32(offset + i * 4);
      for (let i = 16; i < 64; i++) {
        const s0 = rotr(w[i - 15], 7) ^ rotr(w[i - 15], 18) ^ (w[i - 15] >>> 3);
        const s1 = rotr(w[i - 2], 17) ^ rotr(w[i - 2], 19) ^ (w[i - 2] >>> 10);
        w[i] = (w[i - 16] + s0 + w[i - 7] + s1) >>> 0;
      }

      let a = h[0], b = h[1], c = h[2], d = h[3];
      let e = h[4], f = h[5], g = h[6], hh = h[7];

      for (let i = 0; i < 64; i++) {
        const s1 = rotr(e, 6) ^ rotr(e, 11) ^ rotr(e, 25);
        const ch = (e & f) ^ (~e & g);
        const t1 = (hh + s1 + ch + K[i] + w[i]) >>> 0;
        const s0 = rotr(a, 2) ^ rotr(a, 13) ^ rotr(a, 22);
        const maj = (a & b) ^ (a & c) ^ (b & c);
        const t2 = (s0 + maj) >>> 0;

        hh = g; g = f; f = e; e = (d + t1) >>> 0;
        d = c; c = b; b = a; a = (t1 + t2) >>> 0;
      }

      h = [
        (h[0] + a) >>> 0, (h[1] + b) >>> 0, (h[2] + c) >>> 0, (h[3] + d) >>> 0,
        (h[4] + e) >>> 0, (h[5] + f) >>> 0, (h[6] + g) >>> 0, (h[7] + hh) >>> 0
      ];
    }

    return h.map((word) => word.toString(16).padStart(8, '0')).join('');
  };

  const sha256Hex = async (text) => {
    const bytes = new TextEncoder().encode(text);

    if (window.crypto?.subtle) {
      try {
        const digest = await window.crypto.subtle.digest('SHA-256', bytes);
        return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
      } catch {
        /* cae al cálculo local */
      }
    }

    return sha256Fallback(bytes);
  };

  /* URL firmada del Web Checkout: la misma que arma el backend */
  const buildCheckoutUrl = async (gateway, order) => {
    const reference = String(order.reference || '').trim();
    const amountInCents = Math.round(Number(order.amountInCents));
    const currency = 'COP';
    const publicKey = String(gateway.publicKey || '').trim();
    const secret = String(gateway.integritySecret || '').trim();

    if (!publicKey) return { ok: false, error: 'missing_public_key' };
    if (!secret) return { ok: false, error: 'missing_integrity_secret' };
    if (!reference || !Number.isFinite(amountInCents) || amountInCents <= 0) {
      return { ok: false, error: 'invalid_order' };
    }

    const signature = await sha256Hex(`${reference}${amountInCents}${currency}${secret}`);

    const query = [
      `public-key=${encodeURIComponent(publicKey)}`,
      `currency=${currency}`,
      `amount-in-cents=${amountInCents}`,
      `reference=${encodeURIComponent(reference)}`,
      `signature:integrity=${signature}`
    ];

    const redirectUrl = String(order.redirectUrl ?? redirectUrlFor()).trim();
    if (redirectUrl && !isLocalOrigin()) query.push(`redirect-url=${encodeURIComponent(redirectUrl)}`);

    const email = String(order.email || '').trim();
    if (email) query.push(`customer-data:email=${encodeURIComponent(email)}`);

    return {
      ok: true,
      url: `${CHECKOUT_BASE}?${query.join('&')}`,
      signature,
      environment: publicKey.startsWith('pub_prod_') ? 'production' : 'test',
      source: 'browser'
    };
  };

  const createWompiCheckout = async (order) => {
    const gateway = gatewayFor(order.method);
    if (!gateway || gateway.provider !== 'wompi') return { ok: false, error: 'no_wompi_gateway' };

    let backendError = '';

    try {
      const response = await Promise.race([
        fetch(`${API_BASE}/api/checkout/wompi`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            reference: order.reference,
            amount_in_cents: order.amountInCents,
            currency: 'COP',
            customer_email: order.email || '',
            redirect_url: order.redirectUrl ?? redirectUrlFor()
          })
        }),
        new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 12000))
      ]);

      const payload = await response.json().catch(() => null);

      if (response.ok && payload?.ok && payload.url) {
        return {
          ok: true,
          url: payload.url,
          signature: payload.signature,
          environment: payload.environment,
          source: 'server'
        };
      }

      backendError = payload?.error || `http_${response.status}`;
    } catch (error) {
      backendError = error.message || 'network_error';
    }

    /* Sin backend (o sin llaves allí): se firma en el navegador con el panel */
    const local = await buildCheckoutUrl(gateway, order);
    if (local.ok) return { ...local, backendError };
    return { ok: false, error: local.error, backendError };
  };

  const fetchTransactionStatus = async (transactionId) => {
    if (!transactionId) return { ok: false, error: 'missing_id' };

    try {
      const response = await fetch(
        `${API_BASE}/api/checkout/wompi/transactions/${encodeURIComponent(transactionId)}`
      );
      const payload = await response.json().catch(() => null);

      if (!response.ok || !payload?.ok) {
        return { ok: false, error: payload?.error || `http_${response.status}` };
      }

      return { ok: true, ...payload };
    } catch (error) {
      return { ok: false, error: error.message || 'network_error' };
    }
  };

  /* ---------------------------------------------------- */
  /* Arranque                                             */
  /* ---------------------------------------------------- */
  window.LNS = window.LNS || {};
  window.LNS.payments = {
    render,
    validate,
    gatewayFor,
    partialFor,
    snapshot,
    getSelected,
    availableMethods,
    createWompiCheckout,
    createCheckoutLink,
    buildPayPalUrl,
    fetchTransactionStatus,
    buildCheckoutUrl,
    sha256Hex,
    redirectUrlFor,
    COP_PER_USD,
    usdFromCop: (cop) => (Number(cop) || 0) / COP_PER_USD,
    apiBase: API_BASE
  };

  document.addEventListener('gateways:change', render);
  document.addEventListener('language:change', render);

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', render, { once: true });
  } else {
    render();
  }
})();
