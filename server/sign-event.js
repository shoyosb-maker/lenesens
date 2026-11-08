/* Genera un evento estilo Wompi firmado con el secreto de eventos,
   para probar el endpoint /api/webhooks/wompi de punta a punta. */
const crypto = require('node:crypto');

const SECRET = process.argv[2];
const KEY = process.argv[3] || '';

if (!SECRET) {
  console.error('Uso: node sign-event.js <events_secret> [key]');
  process.exit(1);
}

const timestamp = Math.floor(Date.now() / 1000);

const event = {
  event: 'transaction.updated',
  data: {
    transaction: {
      id: '12000-' + timestamp,
      created_at: new Date().toISOString(),
      finalized_at: new Date().toISOString(),
      amount_in_cents: 14490000,
      reference: 'LNS-TEST-' + timestamp,
      customer_email: 'cliente@lenesens.com.co',
      currency: 'COP',
      payment_method_type: 'PSE',
      payment_method: { type: 'PSE', user_type: 0, user_legal_id_type: 'CC', user_legal_id: '1088339209', financial_institution_code: '1', payment_description: 'Hydralight 90ml' },
      status: 'APPROVED',
      status_message: 'Aprobada',
      shipping_address: null,
      redirect_url: null,
      payment_link_id: null,
      payment_source_id: null
    }
  },
  environment: 'test',
  signature: {
    properties: [
      'transaction.id',
      'transaction.status',
      'transaction.amount_in_cents'
    ],
    checksum: ''
  },
  timestamp,
  sent_at: new Date().toISOString()
};

const readPath = (object, path) =>
  String(path).split('.').reduce((acc, key) => (acc == null ? undefined : acc[key]), object);

const concatenated = event.signature.properties
  .map((path) => {
    const value = readPath(event.data, path.replace(/^transaction\./, 'transaction.'));
    return value === undefined || value === null ? '' : String(value);
  })
  .join('');

event.signature.checksum = crypto
  .createHash('sha256')
  .update(concatenated + timestamp + SECRET)
  .digest('hex');

const target = `http://127.0.0.1:3000/api/webhooks/wompi${KEY ? `?key=${KEY}` : ''}`;

(async () => {
  const body = JSON.stringify(event);
  const response = await fetch(target, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body
  });

  const text = await response.text();
  console.log('POST', target);
  console.log('HTTP', response.status, text);

  /* Segundo intento con checksum manipulado */
  const tampered = JSON.parse(body);
  tampered.signature.checksum = 'a'.repeat(64);

  const bad = await fetch(target, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(tampered)
  });

  console.log('Con checksum inválido -> HTTP', bad.status, await bad.text());
})();
