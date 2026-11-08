/* ============================================================
   ORDERS — Historial de pedidos de la tienda
   Persistencia en localStorage (lenesens_orders).
   Lo alimenta el checkout y lo consume el panel de ventas.
   ============================================================ */
(() => {
  'use strict';

  const STORAGE_KEY = 'lenesens_orders';
  const SEED_KEY = 'lenesens_orders_seeded';

  const STATUSES = ['pendiente', 'enviado', 'entregado', 'cancelado'];

  const PAYMENT_LABELS = {
    online: 'Pago en línea (Wompi)',
    paypal: 'PayPal',
    cod: 'Contraentrega',
    /* compatibilidad con pedidos guardados por versiones anteriores */
    pse: 'PSE',
    card: 'Tarjeta',
    nequi: 'Nequi',
    addi: 'Addi'
  };

  const storage = () => window.LNS?.storage;

  const read = () => {
    const data = storage()?.get(STORAGE_KEY, []);
    return Array.isArray(data) ? data : [];
  };

  const write = (orders) => {
    storage()?.set(STORAGE_KEY, orders);
    return orders;
  };

  /* ---------------------------------------------------------
     Normalización (acepta pedidos del checkout o de la demo)
     --------------------------------------------------------- */
  const splitCity = (address = '') => {
    const parts = String(address).split(',');
    if (parts.length < 2) return { address: String(address).trim(), city: '' };
    const city = parts.pop().trim();
    return { address: parts.join(',').trim(), city };
  };

  const normalizeItem = (item = {}) => ({
    id: item.id || 'hydralight-360',
    name: item.name || 'Hydralight Suero Corporal Aclarador 90ml',
    variant: item.variant || 'single',
    price: Number(item.price) || 0,
    quantity: Math.max(1, Number(item.quantity) || 1),
    image: item.image || null
  });

  const normalize = (order = {}) => {
    const customer = order.customer || {};
    const fallback = splitCity(customer.address || '');

    const items = Array.isArray(order.items) ? order.items.map(normalizeItem) : [];

    const subtotal = Number(order.totals?.subtotal) || items.reduce((sum, i) => sum + i.price * i.quantity, 0);
    const discount = Number(order.totals?.discount) || 0;
    const shipping = Number(order.totals?.shipping) || 0;
    const total = Number(order.totals?.total) || subtotal - discount + shipping;

    const timestamp = Number(order.timestamp) || Date.now();

    return {
      orderId: order.orderId || `LNS-${timestamp.toString(36).toUpperCase()}`,
      timestamp,
      items,
      totals: { subtotal, discount, shipping, total },
      paymentMethod: PAYMENT_LABELS[order.paymentMethod] ? order.paymentMethod : 'cod',
      customer: {
        name: (customer.name || 'Cliente').trim(),
        email: (customer.email || '').trim(),
        phone: (customer.phone || '').trim(),
        city: (customer.city || fallback.city || 'Sin ciudad').trim(),
        address: (customer.address || fallback.address || '').trim(),
        notes: (customer.notes || '').trim()
      },
      status: STATUSES.includes(order.status) ? order.status : 'pendiente',
      gateway: order.gateway && typeof order.gateway === 'object'
        ? {
          id: order.gateway.id || '',
          provider: order.gateway.provider || '',
          label: order.gateway.label || '',
          mode: order.gateway.mode === 'live' ? 'live' : 'test',
          publicKeyMasked: order.gateway.publicKeyMasked || ''
        }
        : null,
      demo: Boolean(order.demo)
    };
  };

  const sortDesc = (orders) => orders.slice().sort((a, b) => b.timestamp - a.timestamp);

  /* ---------------------------------------------------------
     API pública
     --------------------------------------------------------- */
  const all = () => sortDesc(read());

  const add = (order) => {
    const normalized = normalize(order);
    const orders = read().filter((o) => o.orderId !== normalized.orderId);
    orders.push(normalized);
    write(orders);
    return normalized;
  };

  const updateStatus = (orderId, status) => {
    if (!STATUSES.includes(status)) return null;
    const orders = read();
    const target = orders.find((o) => o.orderId === orderId);
    if (!target) return null;
    target.status = status;
    write(orders);
    return target;
  };

  const removeDemo = () => write(read().filter((o) => !o.demo));

  const clear = () => write([]);

  /* ---------------------------------------------------------
     Datos de demostración (deterministas)
     --------------------------------------------------------- */
  const mulberry32 = (seed) => () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  const CITIES = [
    'Bogotá D.C.', 'Medellín', 'Cali', 'Barranquilla', 'Cartagena',
    'Bucaramanga', 'Pereira', 'Manizales', 'Villavicencio', 'Ibagué'
  ];
  const CITY_WEIGHTS = [30, 18, 12, 10, 8, 7, 5, 4, 3, 3];

  const METHODS = ['cod', 'card', 'nequi', 'pse', 'addi'];
  const METHOD_WEIGHTS = [34, 26, 18, 14, 8];

  const STATUS_WEIGHTS = [
    ['entregado', 78],
    ['enviado', 12],
    ['pendiente', 8],
    ['cancelado', 2]
  ];

  const FIRST_NAMES = [
    'Camila', 'Valentina', 'Daniela', 'Mariana', 'Sofía', 'Laura', 'Juliana', 'Andrea',
    'Carolina', 'Paula', 'Natalia', 'Isabella', 'Manuela', 'Sara', 'Gabriela', 'Alejandra',
    'Andrés', 'Sebastián', 'Felipe', 'Juan', 'Carlos', 'Santiago', 'Diego', 'Julián'
  ];

  const LAST_NAMES = [
    'Restrepo', 'Gómez', 'Rodríguez', 'Martínez', 'García', 'López', 'Hernández', 'Ramírez',
    'Torres', 'Vargas', 'Castro', 'Moreno', 'Jiménez', 'Rojas', 'Suárez', 'Cárdenas'
  ];

  const STREETS = ['Calle', 'Carrera', 'Transversal', 'Diagonal', 'Avenida'];

  const pick = (rnd, values, weights) => {
    const total = weights.reduce((a, b) => a + b, 0);
    let roll = rnd() * total;
    for (let i = 0; i < values.length; i++) {
      roll -= weights[i];
      if (roll <= 0) return values[i];
    }
    return values[values.length - 1];
  };

  const UNIT_PRICE = 129900;
  const FREE_SHIPPING = 150000;
  const SHIPPING_COST = 15000;

  const buildDemoOrders = (count = 46, days = 110) => {
    const rnd = mulberry32(20261106);
    const orders = [];
    const now = Date.now();

    for (let i = 0; i < count; i++) {
      const daysAgo = Math.floor(Math.pow(rnd(), 1.9) * days);
      const day = new Date(now - daysAgo * 86400000);
      day.setHours(8 + Math.floor(rnd() * 12), Math.floor(rnd() * 60), 0, 0);

      // Nunca en el futuro (cuando el pedido cae "hoy" con hora posterior a la actual)
      const timestamp = Math.min(day.getTime(), now - Math.floor(rnd() * 45 + 5) * 60000);

      const quantity = rnd() < 0.7 ? 1 : rnd() < 0.8 ? 2 : 3;
      const subtotal = UNIT_PRICE * quantity;
      const hasCoupon = rnd() < 0.14;
      const discount = hasCoupon ? Math.round(subtotal * 0.1) : 0;
      const shipping = subtotal - discount >= FREE_SHIPPING ? 0 : SHIPPING_COST;
      const method = pick(rnd, METHODS, METHOD_WEIGHTS);
      const city = pick(rnd, CITIES, CITY_WEIGHTS);

      const name = `${pick(rnd, FIRST_NAMES, FIRST_NAMES.map(() => 1))} ${pick(rnd, LAST_NAMES, LAST_NAMES.map(() => 1))}`;
      const status = daysAgo < 2
        ? (rnd() < 0.5 ? 'pendiente' : 'enviado')
        : pick(rnd, STATUS_WEIGHTS.map((s) => s[0]), STATUS_WEIGHTS.map((s) => s[1]));

      orders.push({
        orderId: `LNS-${Math.floor(timestamp / 1000).toString(36).toUpperCase().slice(-5)}${i.toString(36).toUpperCase().padStart(2, '0')}-D${(i % 9) + 1}`,
        timestamp,
        items: [{
          id: 'hydralight-360',
          name: 'Hydralight Suero Corporal Aclarador 90ml',
          variant: 'single',
          price: UNIT_PRICE,
          quantity
        }],
        totals: { subtotal, discount, shipping, total: subtotal - discount + shipping },
        paymentMethod: method,
        customer: {
          name,
          email: `${name.split(' ')[0].toLowerCase()}${Math.floor(rnd() * 90 + 10)}@correo.com`,
          phone: `3${Math.floor(rnd() * 9)}${Math.floor(10000000 + rnd() * 89999999)}`.slice(0, 10),
          city,
          address: `${pick(rnd, STREETS, [1, 1, 1, 1, 1])} ${Math.floor(rnd() * 90 + 5)} # ${Math.floor(rnd() * 80 + 2)}-${Math.floor(rnd() * 80 + 2)}`,
          notes: rnd() < 0.12 ? 'Entregar en portería, llamar al llegar.' : ''
        },
        status,
        demo: true
      });
    }

    return orders;
  };

  const seed = ({ force = false } = {}) => {
    const existing = read();
    const alreadySeeded = storage()?.get(SEED_KEY, false);

    if (existing.length && !force) return existing;
    if (alreadySeeded && !force) return existing;

    const demo = buildDemoOrders();
    const merged = [...existing];
    demo.forEach((order) => {
      if (!merged.some((o) => o.orderId === order.orderId)) merged.push(order);
    });

    write(merged);
    storage()?.set(SEED_KEY, true);
    return merged;
  };

  window.LNS = window.LNS || {};
  window.LNS.orders = {
    STORAGE_KEY,
    STATUSES,
    PAYMENT_LABELS,
    all,
    add,
    updateStatus,
    removeDemo,
    clear,
    seed
  };
})();
