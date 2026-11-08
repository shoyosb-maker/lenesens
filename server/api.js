/* ============================================================
   Lenesens · API (Node 18+, sin dependencias)
   - POST /api/webhooks/:pasarela             Notificaciones de pago
   - POST /api/checkout/wompi                 Link de pago firmado (Web Checkout)
   - GET  /api/checkout/wompi/transactions/:id  Estado de una transacción
   - GET  /api/health                         Salud del servicio

   Variables de entorno:
     WOMPI_PUBLIC_KEY        pub_prod_… / pub_test_…
     WOMPI_PRIVATE_KEY       prv_prod_… / prv_test_…  (estado de transacciones)
     WOMPI_INTEGRITY_SECRET  prod_integrity_… / test_integrity_…
     WOMPI_REDIRECT_URL      URL de retorno tras pagar
     WOMPI_API_BASE          (opcional) base de la API; por defecto según la llave
     WEBHOOK_EVENTS_SECRET   secreto de eventos (firma de webhooks)
     WEBHOOK_KEY_<PASARELA>  token de la URL de notificaciones

   Uso:  node api.js
   ============================================================ */
'use strict';

const http = require('node:http');
const crypto = require('node:crypto');
const fs = require('node:fs/promises');
const path = require('node:path');

/* .env opcional (mismo directorio, sin dependencias) */
const loadEnvFile = async () => {
  try {
    const content = await fs.readFile(path.join(__dirname, '.env'), 'utf8');
    content.split(/\r?\n/).forEach((line) => {
      const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/i);
      if (!match) return;
      const value = match[2].replace(/^["']|["']$/g, '');
      if (!process.env[match[1]]) process.env[match[1]] = value;
    });
  } catch {
    /* sin .env: se usan solo las variables de entorno */
  }
};

const PORT = Number(process.env.PORT) || 3000;
const LOG_DIR = path.join(__dirname, 'data');
const LOG_FILE = path.join(LOG_DIR, 'webhooks.ndjson');
const MAX_BODY = 1024 * 1024;

const WOMPI_CHECKOUT_BASE = 'https://checkout.wompi.co/p/';

/* ------------------------------------------------------------
   Utilidades HTTP
   ------------------------------------------------------------ */
const json = (res, status, payload) => {
  const body = JSON.stringify(payload);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(body),
    'Cache-Control': 'no-store'
  });
  res.end(body);
};

const readBody = (req) => new Promise((resolve, reject) => {
  let size = 0;
  const chunks = [];

  req.on('data', (chunk) => {
    size += chunk.length;
    if (size > MAX_BODY) {
      reject(new Error('payload_too_large'));
      req.destroy();
      return;
    }
    chunks.push(chunk);
  });

  req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
  req.on('error', reject);
});

const parseJson = (raw) => {
  try {
    return { ok: true, value: raw ? JSON.parse(raw) : {} };
  } catch {
    return { ok: false, value: null };
  }
};

/* ------------------------------------------------------------
   Webhooks: verificación de firma
   - Wompi: SHA256(valores de signature.properties + timestamp + secreto)
   - Otros: HMAC-SHA256 del cuerpo (header x-signature)
   ------------------------------------------------------------ */
const readPath = (object, keyPath) =>
  String(keyPath).split('.').reduce((acc, key) => (acc == null ? undefined : acc[key]), object);

const verifyWompiSignature = (body, secret) => {
  const properties = body?.signature?.properties;
  const checksum = body?.signature?.checksum;
  const timestamp = body?.timestamp;

  if (!Array.isArray(properties) || !checksum || timestamp === undefined) {
    return { ok: false, reason: 'missing_signature' };
  }

  const root = body?.data ?? body;

  const concatenated = properties
    .map((keyPath) => {
      const value = readPath(root, keyPath);
      return value === undefined || value === null ? '' : String(value);
    })
    .join('');

  const expected = crypto
    .createHash('sha256')
    .update(concatenated + timestamp + secret)
    .digest('hex');

  const ok = expected.length === String(checksum).length &&
    crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(String(checksum)));

  return ok ? { ok: true } : { ok: false, reason: 'invalid_signature' };
};

const verifySignature = (gateway, body, headers, raw) => {
  const secret = process.env.WEBHOOK_EVENTS_SECRET;
  if (!secret) return { ok: true, skipped: true };

  if (gateway === 'wompi') return verifyWompiSignature(body, secret);

  const signature = headers['x-events-signature'] || headers['x-signature'] || '';
  if (!signature) return { ok: false, reason: 'missing_signature' };

  const expected = crypto.createHmac('sha256', secret).update(raw).digest('hex');
  const clean = String(signature).replace(/^sha256=/i, '').trim();

  const ok = clean.length === expected.length &&
    crypto.timingSafeEqual(Buffer.from(clean), Buffer.from(expected));

  return ok ? { ok: true } : { ok: false, reason: 'invalid_signature' };
};

const appendLog = async (record) => {
  await fs.mkdir(LOG_DIR, { recursive: true });
  await fs.appendFile(LOG_FILE, JSON.stringify(record) + '\n', 'utf8');
};

const tokenFor = (gateway) =>
  process.env[`WEBHOOK_KEY_${gateway.toUpperCase().replace(/-/g, '_')}`] || '';

/* ------------------------------------------------------------
   Checkout Wompi: firma de integridad
   SHA256(referencia + monto_en_centavos + moneda + secreto)
   ------------------------------------------------------------ */
const wompiIntegritySignature = ({ reference, amountInCents, currency, secret }) =>
  crypto
    .createHash('sha256')
    .update(`${reference}${amountInCents}${currency}${secret}`)
    .digest('hex');

const createWompiCheckout = (payload = {}) => {
  const publicKey = process.env.WOMPI_PUBLIC_KEY || '';
  const secret = process.env.WOMPI_INTEGRITY_SECRET || '';

  if (!publicKey) return { ok: false, status: 500, error: 'missing_public_key' };
  if (!secret) return { ok: false, status: 500, error: 'missing_integrity_secret' };

  const reference = String(payload.reference || '').trim();
  const amountInCents = Math.round(Number(payload.amount_in_cents));
  const currency = String(payload.currency || 'COP').toUpperCase();
  const redirectUrl = String(payload.redirect_url || process.env.WOMPI_REDIRECT_URL || '').trim();
  const customerEmail = String(payload.customer_email || '').trim();

  /* Wompi bloquea (403) los redirect-url locales: se omiten */
  const safeRedirect = /^https?:\/\/(localhost|127\.0\.0\.1)([:/]|$)/i.test(redirectUrl) ? '' : redirectUrl;

  if (!reference || reference.length > 100) {
    return { ok: false, status: 400, error: 'invalid_reference' };
  }

  if (!Number.isFinite(amountInCents) || amountInCents <= 0) {
    return { ok: false, status: 400, error: 'invalid_amount' };
  }

  if (!/^[A-Z]{3}$/.test(currency)) {
    return { ok: false, status: 400, error: 'invalid_currency' };
  }

  const signature = wompiIntegritySignature({
    reference,
    amountInCents,
    currency,
    secret
  });

  /* Wompi espera las llaves con dos puntos literales (signature:integrity) */
  const query = [
    `public-key=${encodeURIComponent(publicKey)}`,
    `currency=${encodeURIComponent(currency)}`,
    `amount-in-cents=${amountInCents}`,
    `reference=${encodeURIComponent(reference)}`,
    `signature:integrity=${signature}`
  ];

  if (safeRedirect) query.push(`redirect-url=${encodeURIComponent(safeRedirect)}`);
  if (customerEmail) query.push(`customer-data:email=${encodeURIComponent(customerEmail)}`);

  return {
    ok: true,
    url: `${WOMPI_CHECKOUT_BASE}?${query.join('&')}`,
    signature,
    reference,
    amount_in_cents: amountInCents,
    currency,
    environment: publicKey.startsWith('pub_prod_') ? 'production' : 'test'
  };
};

/* ------------------------------------------------------------
   Wompi · consulta de transacciones
   El checkout cobra con el Web Checkout firmado y, al volver,
   consulta acá el estado real de la transacción.
   ------------------------------------------------------------ */
const WOMPI_BASES = {
  test: 'https://sandbox.wompi.co/v1',
  live: 'https://production.wompi.co/v1'
};

const WOMPI_FETCH_TIMEOUT = 12000;

const wompiConfig = () => ({
  publicKey: (process.env.WOMPI_PUBLIC_KEY || '').trim(),
  privateKey: (process.env.WOMPI_PRIVATE_KEY || '').trim(),
  integritySecret: (process.env.WOMPI_INTEGRITY_SECRET || '').trim()
});

const wompiEnvironment = () => {
  const { publicKey } = wompiConfig();
  return publicKey.startsWith('pub_prod_') ? 'live' : 'test';
};

const wompiBase = () => {
  const override = (process.env.WOMPI_API_BASE || '').trim();
  if (override) return override.replace(/\/+$/, '');
  return WOMPI_BASES[wompiEnvironment()];
};

const wompiRequest = async (pathname, { method = 'GET', body, auth = false } = {}) => {
  const { privateKey } = wompiConfig();
  const headers = { Accept: 'application/json' };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (auth) headers.Authorization = `Bearer ${privateKey}`;

  try {
    const response = await fetch(`${wompiBase()}${pathname}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: AbortSignal.timeout(WOMPI_FETCH_TIMEOUT)
    });

    const payload = await response.json().catch(() => null);
    return { ok: response.ok, status: response.status, payload };
  } catch (error) {
    return {
      ok: false,
      status: 0,
      payload: null,
      error: error.name === 'TimeoutError' || error.name === 'AbortError' ? 'timeout' : 'network_error'
    };
  }
};

/* Mensaje legible de un error de Wompi */
const wompiErrorMessage = (payload) => {
  const error = payload?.error;
  if (!error) return payload?.message || '';

  if (error.messages) {
    const groups = typeof error.messages === 'object' ? Object.values(error.messages) : [error.messages];
    const flat = groups.flat().filter(Boolean);
    if (flat.length) return flat.join(' · ');
  }

  return error.reason || error.type || '';
};

const transactionSnapshot = (payload) => {
  const data = payload?.data || {};
  return {
    id: String(data.id || ''),
    status: String(data.status || ''),
    reference: String(data.reference || ''),
    amount_in_cents: data.amount_in_cents ?? null,
    currency: data.currency || 'COP',
    method: String(data.payment_method_type || data.payment_method?.type || ''),
    asyncUrl: data.payment_method?.extra?.async_payment_url || '',
    message: String(data.status_message || '')
  };
};

const wompiTransactionById = async (id) => {
  const { privateKey } = wompiConfig();
  if (!privateKey) return { ok: false, status: 500, error: 'missing_private_key' };
  if (!/^[A-Za-z0-9_-]{1,80}$/.test(String(id || ''))) return { ok: false, status: 400, error: 'invalid_transaction_id' };

  const result = await wompiRequest(`/transactions/${encodeURIComponent(id)}`, { auth: true });

  if (!result.ok || !result.payload?.data) {
    return {
      ok: false,
      status: result.status || 502,
      error: result.error || 'transaction_lookup_failed',
      message: wompiErrorMessage(result.payload)
    };
  }

  return { ok: true, transaction: transactionSnapshot(result.payload) };
};
/* ------------------------------------------------------------
   Servidor
   ------------------------------------------------------------ */
const handleWebhook = async (req, res, gateway) => {
  const expected = tokenFor(gateway);
  const url = new URL(req.url, 'http://localhost');

  if (expected && url.searchParams.get('key') !== expected) {
    return json(res, 401, { ok: false, error: 'invalid_key' });
  }

  let raw = '';
  try {
    raw = await readBody(req);
  } catch (error) {
    return json(res, 413, { ok: false, error: error.message });
  }

  const parsed = parseJson(raw);
  if (!parsed.ok) return json(res, 400, { ok: false, error: 'invalid_json' });

  const event = parsed.value;
  const signature = verifySignature(gateway, event, req.headers, raw);

  if (!signature.ok) {
    return json(res, 401, { ok: false, error: signature.reason });
  }

  const transaction = event?.data?.transaction || event?.transaction || {};
  const reference = transaction.reference || event.reference || '';
  const status = transaction.status || event.status || '';

  const record = {
    received_at: new Date().toISOString(),
    gateway,
    event: event.event || event.type || 'unknown',
    reference,
    status,
    amount_in_cents: transaction.amount_in_cents ?? null,
    currency: transaction.currency || 'COP',
    payment_method_type: transaction.payment_method_type || transaction.payment_method?.type || null,
    signature_skipped: Boolean(signature.skipped),
    payload: event
  };

  try {
    await appendLog(record);
  } catch (error) {
    console.error('[webhooks] No se pudo registrar el evento:', error.message);
    return json(res, 500, { ok: false, error: 'log_failed' });
  }

  console.log(`[webhooks] ${gateway} · ${record.event} · ${reference || 'sin referencia'} · ${status || 'sin estado'}`);

  /* Aquí se actualiza el pedido: se marca pagado, cambia el estado, envía el correo… */
  return json(res, 200, { ok: true, received: record.event, reference });
};

const server = http.createServer(async (req, res) => {
  const host = req.headers.host || 'localhost';
  const url = new URL(req.url, `http://${host}`);

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Events-Signature, X-Signature');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  /* Salud */
  if (req.method === 'GET' && url.pathname === '/api/health') {
    const config = wompiConfig();
    return json(res, 200, {
      ok: true,
      service: 'lenesens-api',
      wompi: {
        publicKey: config.publicKey ? 'configurada' : 'falta',
        privateKey: config.privateKey ? 'configurada' : 'falta',
        integritySecret: config.integritySecret ? 'configurado' : 'falta',
        environment: wompiEnvironment() === 'live' ? 'production' : 'test'
      },
      directPayments: Boolean(
        config.publicKey && (config.integritySecret || process.env.WOMPI_INTEGRITY_SECRET)
      ),
      webhooks: Boolean(process.env.WEBHOOK_EVENTS_SECRET)
    });
  }

  /* Estado de una transacción (página de confirmación) */
  const txMatch = url.pathname.match(/^\/api\/checkout\/wompi\/transactions\/([A-Za-z0-9_-]+)\/?$/);

  if (req.method === 'GET' && txMatch) {
    const result = await wompiTransactionById(txMatch[1]);

    if (!result.ok) {
      return json(res, result.status || 502, {
        ok: false,
        error: result.error,
        message: result.message || ''
      });
    }

    return json(res, 200, { ok: true, ...result.transaction });
  }

  /* Checkout firmado de Wompi */
  if (req.method === 'POST' && /^\/api\/checkout\/wompi\/?$/.test(url.pathname)) {
    let raw = '';
    try {
      raw = await readBody(req);
    } catch (error) {
      return json(res, 413, { ok: false, error: error.message });
    }

    const parsed = parseJson(raw);
    if (!parsed.ok) return json(res, 400, { ok: false, error: 'invalid_json' });

    const result = createWompiCheckout(parsed.value);

    if (!result.ok) {
      return json(res, result.status, { ok: false, error: result.error });
    }

    console.log(`[checkout] ${result.environment} · ${result.reference} · ${result.amount_in_cents} ${result.currency}`);
    return json(res, 200, result);
  }

  /* Webhooks */
  const match = url.pathname.match(/^\/api\/webhooks\/([a-z0-9-]+)\/?$/i);

  if (req.method === 'POST' && match) {
    return handleWebhook(req, res, match[1].toLowerCase());
  }

  if (req.method === 'GET' && url.pathname === '/api/webhooks') {
    return json(res, 200, {
      ok: true,
      service: 'lenesens-api',
      gateways: ['wompi', 'payu', 'epayco', 'mercadopago', 'bold', 'addi', 'nequi', 'bancolombia', 'paypal']
    });
  }

  return json(res, 404, { ok: false, error: 'not_found' });
});

loadEnvFile().then(() => {
  server.listen(PORT, () => {
    const env = (process.env.WOMPI_PUBLIC_KEY || '').startsWith('pub_prod_') ? 'production' : 'test';
    console.log(`Lenesens API en http://localhost:${PORT}`);
    console.log(`  POST /api/checkout/wompi                 (Wompi ${env})`);
    console.log(`  GET  /api/checkout/wompi/transactions/:id  (estado)`);
    console.log(`  POST /api/webhooks/:gw                   (firma ${process.env.WEBHOOK_EVENTS_SECRET ? 'activa' : 'desactivada'})`);
  });
});

module.exports = {
  createWompiCheckout,
  wompiTransactionById,
  wompiIntegritySignature
};
