/* ============================================================
   ADMIN — Panel de ventas
   Acceso de super usuario + dashboard de pedidos.
   Los datos viven en localStorage (lenesens_orders).
   ============================================================ */
(() => {
  'use strict';

  /* ---------------------------------------------------- */
  /* 1. CREDENCIALES (huella FNV-1a, no texto plano)      */
  /* ---------------------------------------------------- */
  const CREDENTIALS = {
    salt: 'lenesens::',
    user: '88fb87ab',
    pass: '88b0eaa5'
  };

  const SESSION_KEY = 'lenesens_admin_session';

  const fingerprint = (value) => {
    let hash = 2166136261;
    const input = CREDENTIALS.salt + String(value).trim();
    for (let i = 0; i < input.length; i++) {
      hash ^= input.charCodeAt(i);
      hash = Math.imul(hash, 16777619);
    }
    return (hash >>> 0).toString(16).padStart(8, '0');
  };

  /* ---------------------------------------------------- */
  /* 2. REFERENCIAS                                       */
  /* ---------------------------------------------------- */
  const $ = (sel, scope = document) => scope.querySelector(sel);
  const $$ = (sel, scope = document) => Array.from(scope.querySelectorAll(sel));

  const gate = $('[data-admin-gate]');
  const app = $('[data-admin-app]');
  const form = $('[data-admin-form]');
  const errorEl = $('[data-admin-error]');
  const userInput = $('#admin-user');
  const passInput = $('#admin-pass');

  const rowsEl = $('[data-admin-rows]');
  const emptyEl = $('[data-admin-empty]');
  const countEl = $('[data-admin-count]');
  const rangeLabel = $('[data-admin-range-label]');
  const noticeEl = $('[data-admin-notice]');
  const noticeText = $('[data-admin-notice-text]');
  const noticeAction = $('[data-admin-notice-action]');

  const modal = $('[data-admin-modal]');
  const modalBody = $('[data-modal-body]');

  const state = {
    range: '30',
    search: '',
    status: 'all',
    orders: [],
    filtered: [],
    user: 'admin'
  };

  const ordersApi = () => window.LNS?.orders;

  const money = (value) => (window.LNS?.formatPrice ? window.LNS.formatPrice(value) : '$' + value);
  const number = (value) => (window.LNS?.formatNumber ? window.LNS.formatNumber(value) : String(value));

  const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[char]));

  /* ---------------------------------------------------- */
  /* 3. SESIÓN                                            */
  /* ---------------------------------------------------- */
  const readSession = () => {
    try {
      return JSON.parse(sessionStorage.getItem(SESSION_KEY) || 'null');
    } catch {
      return null;
    }
  };

  const saveSession = (user) => {
    try {
      sessionStorage.setItem(SESSION_KEY, JSON.stringify({ user, since: Date.now() }));
    } catch {
      /* modo privado */
    }
  };

  const clearSession = () => {
    try {
      sessionStorage.removeItem(SESSION_KEY);
    } catch {
      /* noop */
    }
  };

  const showApp = () => {
    gate.hidden = true;
    app.hidden = false;
    document.body.classList.add('is-admin');
    const label = $('[data-admin-username]');
    if (label) label.textContent = state.user;

    ordersApi()?.seed();
    loadOrders();
    render();
  };

  const showGate = () => {
    gate.hidden = false;
    app.hidden = true;
    document.body.classList.remove('is-admin');
    passInput.value = '';
    userInput.focus();
  };

  /* ---------------------------------------------------- */
  /* 4. LOGIN                                             */
  /* ---------------------------------------------------- */
  const showError = (message) => {
    errorEl.textContent = message;
    errorEl.hidden = false;
    errorEl.style.animation = 'none';
    void errorEl.offsetWidth;
    errorEl.style.animation = '';
  };

  const togglePassword = $('[data-toggle-pass]');

  togglePassword?.addEventListener('click', () => {
    const visible = passInput.type === 'text';
    passInput.type = visible ? 'password' : 'text';
    togglePassword.setAttribute('aria-pressed', String(!visible));
    togglePassword.setAttribute('aria-label', visible ? 'Mostrar contraseña' : 'Ocultar contraseña');
    passInput.focus();
  });

  form?.addEventListener('submit', (event) => {
    event.preventDefault();
    errorEl.hidden = true;

    const user = userInput.value.trim();
    const pass = passInput.value;

    if (!user || !pass) {
      showError('Ingresa tu usuario y tu contraseña.');
      return;
    }

    if (fingerprint(user) !== CREDENTIALS.user || fingerprint(pass) !== CREDENTIALS.pass) {
      showError('Usuario o contraseña incorrectos.');
      passInput.select();
      return;
    }

    state.user = user;
    saveSession(user);
    showApp();
    window.LNS?.toast?.success('Sesión iniciada como super usuario.');
  });

  $('[data-admin-logout]')?.addEventListener('click', () => {
    clearSession();
    showGate();
    window.LNS?.toast?.info('Sesión cerrada.');
  });

  /* ---------------------------------------------------- */
  /* 5. RANGOS Y FILTROS                                  */
  /* ---------------------------------------------------- */
  const DAY = 86400000;

  const rangeConfig = () => {
    const now = Date.now();

    switch (state.range) {
      case '7':
        return { from: now - 7 * DAY, to: now, label: 'Últimos 7 días', bucket: 'day' };
      case '90':
        return { from: now - 90 * DAY, to: now, label: 'Últimos 90 días', bucket: 'week' };
      case 'all':
        return { from: 0, to: now, label: 'Histórico completo', bucket: 'month' };
      case '30':
      default:
        return { from: now - 30 * DAY, to: now, label: 'Últimos 30 días', bucket: 'day' };
    }
  };

  const matchesSearch = (order) => {
    if (!state.search) return true;
    const needle = state.search.toLowerCase();
    const haystack = `${order.orderId} ${order.customer.name} ${order.customer.city} ${order.customer.email}`.toLowerCase();
    return haystack.includes(needle);
  };

  const applyFilters = () => {
    const { from, to } = rangeConfig();

    return state.orders
      .filter((order) => order.timestamp >= from && order.timestamp <= to)
      .filter((order) => (state.status === 'all' ? true : order.status === state.status))
      .filter(matchesSearch);
  };

  /* ---------------------------------------------------- */
  /* 6. MÉTRICAS                                          */
  /* ---------------------------------------------------- */
  const metrics = (orders) => {
    const valid = orders.filter((order) => order.status !== 'cancelado');

    const revenue = valid.reduce((sum, order) => sum + order.totals.total, 0);
    const units = valid.reduce((sum, order) => sum + order.items.reduce((q, item) => q + item.quantity, 0), 0);
    const ordersCount = valid.length;

    return {
      revenue,
      orders: ordersCount,
      units,
      ticket: ordersCount ? Math.round(revenue / ordersCount) : 0
    };
  };

  const previousRange = () => {
    const { from, to } = rangeConfig();
    if (state.range === 'all') return null;

    const span = to - from;
    const prevFrom = from - span;

    return state.orders.filter((order) => order.timestamp >= prevFrom && order.timestamp < from);
  };

  const deltaLabel = (current, previous) => {
    if (!previous) return '';
    if (previous <= 0) return current > 0 ? 'nuevo en el periodo' : '';

    const change = ((current - previous) / previous) * 100;
    const rounded = Math.round(change);

    if (rounded === 0) return 'sin cambios';
    return `${rounded > 0 ? '▲' : '▼'} ${Math.abs(rounded)}% vs. periodo anterior`;
  };

  const renderKpis = () => {
    const current = metrics(state.filtered);
    const prevOrders = previousRange();
    const previous = prevOrders ? metrics(prevOrders.filter((o) => state.status === 'all' || o.status === state.status).filter(matchesSearch)) : null;

    const map = {
      revenue: money(current.revenue),
      orders: number(current.orders),
      ticket: money(current.ticket),
      units: number(current.units)
    };

    Object.entries(map).forEach(([key, value]) => {
      const el = $(`[data-kpi="${key}"]`);
      if (el) el.textContent = value;
    });

    ['revenue', 'orders', 'ticket', 'units'].forEach((key) => {
      const el = $(`[data-kpi-delta="${key}"]`);
      if (!el) return;

      const text = deltaLabel(current[key], previous ? previous[key] : null);
      el.textContent = text;
      el.classList.toggle('is-up', text.startsWith('▲'));
      el.classList.toggle('is-down', text.startsWith('▼'));
    });
  };

  /* ---------------------------------------------------- */
  /* 7. GRÁFICA DE VENTAS                                 */
  /* ---------------------------------------------------- */
  const startOfDay = (date) => {
    const copy = new Date(date);
    copy.setHours(0, 0, 0, 0);
    return copy;
  };

  const bucketKey = (timestamp, bucket) => {
    const date = new Date(timestamp);

    if (bucket === 'month') {
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    }

    if (bucket === 'week') {
      const start = startOfDay(date);
      const dow = (start.getDay() + 6) % 7;
      start.setDate(start.getDate() - dow);
      return start.toISOString().slice(0, 10);
    }

    return date.toISOString().slice(0, 10);
  };

  const buildBuckets = (bucket) => {
    const now = new Date();
    const buckets = [];

    if (bucket === 'day') {
      const days = state.range === '7' ? 7 : 30;
      for (let i = days - 1; i >= 0; i--) {
        const date = startOfDay(new Date(now.getTime() - i * DAY));
        buckets.push({ key: date.toISOString().slice(0, 10), date });
      }
      return buckets;
    }

    if (bucket === 'week') {
      const current = startOfDay(new Date(now.getTime() - 12 * 7 * DAY));
      const dow = (current.getDay() + 6) % 7;
      current.setDate(current.getDate() - dow);

      for (let i = 0; i < 13; i++) {
        const date = new Date(current.getTime() + i * 7 * DAY);
        buckets.push({ key: date.toISOString().slice(0, 10), date });
      }
      return buckets;
    }

    for (let i = 11; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      buckets.push({
        key: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`,
        date
      });
    }
    return buckets;
  };

  const formatBucketLabel = (date, bucket) => {
    if (bucket === 'month') {
      return date.toLocaleDateString('es-CO', { month: 'short' }).replace('.', '');
    }
    return `${date.getDate()}/${date.getMonth() + 1}`;
  };

  const renderDailyChart = () => {
    const container = $('[data-chart-daily]');
    if (!container) return;

    const { bucket } = rangeConfig();
    const buckets = buildBuckets(bucket);
    const totals = new Map(buckets.map((b) => [b.key, 0]));

    state.filtered
      .filter((order) => order.status !== 'cancelado')
      .forEach((order) => {
        const key = bucketKey(order.timestamp, bucket);
        if (totals.has(key)) totals.set(key, totals.get(key) + order.totals.total);
      });

    const values = buckets.map((b) => ({ ...b, value: totals.get(b.key) || 0 }));
    const max = Math.max(...values.map((v) => v.value), 1);
    const total = values.reduce((sum, v) => sum + v.value, 0);

    const meta = $('[data-chart-daily-total]');
    if (meta) meta.textContent = `Total ${money(total)}`;

    const W = 660;
    const H = 250;
    const padTop = 18;
    const padBottom = 30;
    const chartH = H - padTop - padBottom;
    const slot = W / values.length;
    const barW = Math.max(4, Math.min(34, slot * 0.62));
    const step = Math.ceil(values.length / 8);

    const bars = values.map((point, index) => {
      const label = formatBucketLabel(point.date, bucket);
      const showLabel = index % step === 0 || index === values.length - 1;
      const x = index * slot + (slot - barW) / 2;

      if (point.value <= 0) {
        return showLabel
          ? `<text class="chart-label" x="${(x + barW / 2).toFixed(1)}" y="${H - 10}" text-anchor="middle">${esc(label)}</text>`
          : '';
      }

      const height = Math.max(3, (point.value / max) * chartH);
      const y = padTop + chartH - height;

      return `
        <rect class="chart-bar" x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${barW.toFixed(1)}" height="${height.toFixed(1)}" rx="${Math.min(6, barW / 2).toFixed(1)}">
          <title>${esc(label)}: ${esc(money(point.value))}</title>
        </rect>
        ${showLabel ? `<text class="chart-label" x="${(x + barW / 2).toFixed(1)}" y="${H - 10}" text-anchor="middle">${esc(label)}</text>` : ''}
      `;
    }).join('');

    container.innerHTML = `
      <svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Ventas por periodo. Total ${esc(money(total))}.">
        <defs>
          <linearGradient id="adminBarGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#c2185b" />
            <stop offset="100%" stop-color="#f7a1b8" />
          </linearGradient>
        </defs>
        <line class="chart-grid" x1="0" y1="${padTop + chartH}" x2="${W}" y2="${padTop + chartH}" />
        ${bars}
      </svg>
    `;
  };

  const renderBars = (selector, entries, emptyMessage) => {
    const list = $(selector);
    if (!list) return;

    if (!entries.length) {
      list.innerHTML = `<li class="admin-bars-empty">${esc(emptyMessage)}</li>`;
      return;
    }

    const max = Math.max(...entries.map((entry) => entry.value), 1);

    list.innerHTML = entries.map((entry) => `
      <li class="admin-bar-item">
        <span class="admin-bar-name">${esc(entry.name)}</span>
        <span class="admin-bar-value">${esc(entry.display)}</span>
        <span class="admin-bar-track">
          <span class="admin-bar-fill" style="width:${((entry.value / max) * 100).toFixed(1)}%"></span>
        </span>
      </li>
    `).join('');
  };

  const renderMethods = () => {
    const labels = ordersApi()?.PAYMENT_LABELS || {};
    const valid = state.filtered.filter((order) => order.status !== 'cancelado');
    const totals = new Map();

    valid.forEach((order) => {
      totals.set(order.paymentMethod, (totals.get(order.paymentMethod) || 0) + order.totals.total);
    });

    const sum = [...totals.values()].reduce((a, b) => a + b, 0) || 1;

    const entries = [...totals.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([key, value]) => ({
        name: labels[key] || key,
        value,
        display: `${Math.round((value / sum) * 100)}% · ${money(value)}`
      }));

    renderBars('[data-chart-methods]', entries, 'Sin ventas en el periodo.');
  };

  const renderCities = () => {
    const valid = state.filtered.filter((order) => order.status !== 'cancelado');
    const totals = new Map();

    valid.forEach((order) => {
      const city = order.customer.city || 'Sin ciudad';
      totals.set(city, (totals.get(city) || 0) + order.totals.total);
    });

    const entries = [...totals.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([city, value]) => ({ name: city, value, display: money(value) }));

    renderBars('[data-chart-cities]', entries, 'Sin ventas en el periodo.');
  };

  /* ---------------------------------------------------- */
  /* 8. TABLA                                             */
  /* ---------------------------------------------------- */
  const formatDate = (timestamp) => new Date(timestamp).toLocaleDateString('es-CO', {
    day: '2-digit', month: 'short', year: '2-digit'
  });

  const badge = (status) => `<span class="admin-badge admin-badge--${esc(status)}">${esc(status)}</span>`;

  const renderTable = () => {
    if (!rowsEl) return;

    countEl.textContent = number(state.filtered.length);

    if (!state.filtered.length) {
      rowsEl.innerHTML = '';
      emptyEl.hidden = false;
      return;
    }

    emptyEl.hidden = true;

    rowsEl.innerHTML = state.filtered.map((order) => {
      const units = order.items.reduce((sum, item) => sum + item.quantity, 0);
      const method = ordersApi()?.PAYMENT_LABELS?.[order.paymentMethod] || order.paymentMethod;

      return `
        <tr data-order-row="${esc(order.orderId)}" tabindex="0">
          <td class="cell-id">${esc(order.orderId)}</td>
          <td class="cell-date">${esc(formatDate(order.timestamp))}</td>
          <td>${esc(order.customer.name)}</td>
          <td class="cell-city">${esc(order.customer.city)}</td>
          <td>${esc(method)}</td>
          <td class="is-num">${units}</td>
          <td>${badge(order.status)}</td>
          <td class="is-num cell-total">${esc(money(order.totals.total))}</td>
        </tr>
      `;
    }).join('');
  };

  /* ---------------------------------------------------- */
  /* 9. MODAL DE DETALLE                                  */
  /* ---------------------------------------------------- */
  const openDetail = (orderId) => {
    const order = state.orders.find((item) => item.orderId === orderId);
    if (!order) return;

    const labels = ordersApi()?.PAYMENT_LABELS || {};
    const statuses = ordersApi()?.STATUSES || ['pendiente'];
    const units = order.items.reduce((sum, item) => sum + item.quantity, 0);

    const phoneDigits = order.customer.phone.replace(/\D/g, '');
    const waLink = phoneDigits.length >= 10
      ? `<a class="admin-wa" href="https://wa.me/57${esc(phoneDigits.slice(-10))}" target="_blank" rel="noopener noreferrer">
           <svg aria-hidden="true"><use href="assets/icons/sprite.svg#icon-whatsapp"></use></svg>
           Escribir al cliente
         </a>`
      : '';

    modalBody.innerHTML = `
      <p class="admin-detail-id">${esc(order.orderId)}${order.demo ? ' · demostración' : ''}</p>
      <h3 class="admin-detail-title" id="admin-modal-title">${esc(order.customer.name)}</h3>
      <p class="admin-detail-sub">${esc(new Date(order.timestamp).toLocaleString('es-CO', { dateStyle: 'long', timeStyle: 'short' }))}</p>

      <div class="admin-detail-status">
        ${badge(order.status)}
        <select data-order-status aria-label="Cambiar estado del pedido">
          ${statuses.map((status) => `<option value="${status}" ${status === order.status ? 'selected' : ''}>${status.charAt(0).toUpperCase() + status.slice(1)}</option>`).join('')}
        </select>
      </div>

      <div class="admin-detail-block">
        <h3>Entrega</h3>
        <ul class="admin-detail-list">
          <li><span>Ciudad</span><strong>${esc(order.customer.city)}</strong></li>
          <li><span>Dirección</span><strong>${esc(order.customer.address || '—')}</strong></li>
          <li><span>Teléfono</span><strong>${esc(order.customer.phone || '—')}</strong></li>
          ${order.customer.email ? `<li><span>Correo</span><strong>${esc(order.customer.email)}</strong></li>` : ''}
          ${order.customer.notes ? `<li><span>Notas</span><strong>${esc(order.customer.notes)}</strong></li>` : ''}
        </ul>
        ${waLink ? `<div class="admin-detail-actions">${waLink}</div>` : ''}
      </div>

      <div class="admin-detail-block">
        <h3>Productos</h3>
        <ul class="admin-detail-list">
          ${order.items.map((item) => `
            <li><span>${esc(item.name)} × ${item.quantity}</span><strong>${esc(money(item.price * item.quantity))}</strong></li>
          `).join('')}
        </ul>
      </div>

      <div class="admin-detail-block">
        <h3>Pago</h3>
        <ul class="admin-detail-list">
          <li><span>Método</span><strong>${esc(labels[order.paymentMethod] || order.paymentMethod)}</strong></li>
          ${order.gateway
            ? `<li><span>Pasarela</span><strong>${esc(order.gateway.label || order.gateway.id)} · ${order.gateway.mode === 'live' ? 'producción' : 'pruebas'}${order.gateway.publicKeyMasked ? ` · ${esc(order.gateway.publicKeyMasked)}` : ''}</strong></li>`
            : ''}
          <li><span>Subtotal</span><strong>${esc(money(order.totals.subtotal))}</strong></li>
          ${order.totals.discount ? `<li><span>Descuento</span><strong>−${esc(money(order.totals.discount))}</strong></li>` : ''}
          <li><span>Envío</span><strong>${order.totals.shipping ? esc(money(order.totals.shipping)) : 'Gratis'}</strong></li>
          <li><span>Unidades</span><strong>${units}</strong></li>
        </ul>
        <p class="admin-detail-total"><span>Total</span><span>${esc(money(order.totals.total))}</span></p>
      </div>
    `;

    modal.hidden = false;
    document.body.style.overflow = 'hidden';

    const select = $('[data-order-status]', modalBody);
    select?.addEventListener('change', () => {
      ordersApi()?.updateStatus(order.orderId, select.value);
      loadOrders();
      render();
      openDetail(order.orderId);
      window.LNS?.toast?.success('Estado actualizado.');
    });

    $('.admin-modal-close', modal)?.focus();
  };

  const closeDetail = () => {
    modal.hidden = true;
    document.body.style.overflow = '';
  };

  $$('[data-modal-close]').forEach((el) => el.addEventListener('click', closeDetail));

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && !modal.hidden) closeDetail();
  });

  document.addEventListener('click', (event) => {
    const row = event.target.closest('[data-order-row]');
    if (row) openDetail(row.getAttribute('data-order-row'));
  });

  document.addEventListener('keydown', (event) => {
    if (event.key !== 'Enter') return;
    const row = event.target.closest('[data-order-row]');
    if (row) openDetail(row.getAttribute('data-order-row'));
  });

  /* ---------------------------------------------------- */
  /* 10. AVISO DE DATOS DE DEMOSTRACIÓN                   */
  /* ---------------------------------------------------- */
  const renderNotice = () => {
    if (!noticeEl) return;

    const hasDemo = state.orders.some((order) => order.demo);

    if (!state.orders.length) {
      noticeEl.hidden = false;
      noticeText.textContent = 'Todavía no hay pedidos registrados en este navegador.';
      noticeAction.hidden = false;
      noticeAction.textContent = 'Cargar datos de demostración';
      noticeAction.dataset.action = 'seed';
      return;
    }

    if (hasDemo) {
      noticeEl.hidden = false;
      noticeText.textContent = 'El panel incluye pedidos de demostración para visualizar las métricas.';
      noticeAction.hidden = false;
      noticeAction.textContent = 'Eliminar datos de demostración';
      noticeAction.dataset.action = 'clear-demo';
      return;
    }

    noticeEl.hidden = true;
  };

  noticeAction?.addEventListener('click', () => {
    const action = noticeAction.dataset.action;

    if (action === 'seed') {
      ordersApi()?.seed({ force: true });
      loadOrders();
      render();
      window.LNS?.toast?.success('Datos de demostración cargados.');
      return;
    }

    if (action === 'clear-demo') {
      ordersApi()?.removeDemo();
      loadOrders();
      render();
      window.LNS?.toast?.info('Datos de demostración eliminados.');
    }
  });

  /* ---------------------------------------------------- */
  /* 11. RENDER GENERAL                                   */
  /* ---------------------------------------------------- */
  const render = () => {
    state.filtered = applyFilters();

    const { label } = rangeConfig();
    const count = state.filtered.length;
    rangeLabel.textContent = `${label} · ${count} ${count === 1 ? 'pedido' : 'pedidos'}`;

    renderKpis();
    renderDailyChart();
    renderMethods();
    renderCities();
    renderTable();
    renderNotice();
  };

  const loadOrders = () => {
    state.orders = ordersApi()?.all() || [];
  };

  /* ---------------------------------------------------- */
  /* 12. CONTROLES                                        */
  /* ---------------------------------------------------- */
  $$('[data-range]').forEach((button) => {
    button.addEventListener('click', () => {
      state.range = button.dataset.range;
      $$('[data-range]').forEach((other) => {
        const active = other === button;
        other.classList.toggle('is-active', active);
        other.setAttribute('aria-pressed', String(active));
      });
      render();
    });
  });

  $$('[data-status]').forEach((button) => {
    button.addEventListener('click', () => {
      state.status = button.dataset.status;
      $$('[data-status]').forEach((other) => {
        const active = other === button;
        other.classList.toggle('is-active', active);
        other.setAttribute('aria-pressed', String(active));
      });
      render();
    });
  });

  const searchInput = $('[data-admin-search]');
  let searchTimer = null;

  searchInput?.addEventListener('input', () => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => {
      state.search = searchInput.value.trim();
      render();
    }, 220);
  });

  $('[data-admin-refresh]')?.addEventListener('click', () => {
    loadOrders();
    render();
    window.LNS?.toast?.success('Datos actualizados.');
  });

  /* ---------------------------------------------------- */
  /* 13. EXPORTAR CSV                                     */
  /* ---------------------------------------------------- */
  const toCsv = (rows) => {
    const headers = ['Pedido', 'Fecha', 'Cliente', 'Ciudad', 'Direccion', 'Telefono', 'Metodo', 'Unidades', 'Subtotal', 'Descuento', 'Envio', 'Total', 'Estado'];
    const labels = ordersApi()?.PAYMENT_LABELS || {};

    const escapeCell = (value) => `"${String(value).replace(/"/g, '""')}"`;

    const lines = rows.map((order) => [
      order.orderId,
      new Date(order.timestamp).toISOString().slice(0, 16).replace('T', ' '),
      order.customer.name,
      order.customer.city,
      order.customer.address,
      order.customer.phone,
      labels[order.paymentMethod] || order.paymentMethod,
      order.items.reduce((sum, item) => sum + item.quantity, 0),
      order.totals.subtotal,
      order.totals.discount,
      order.totals.shipping,
      order.totals.total,
      order.status
    ].map(escapeCell).join(','));

    return [headers.map(escapeCell).join(','), ...lines].join('\r\n');
  };

  $('[data-admin-export]')?.addEventListener('click', () => {
    if (!state.filtered.length) {
      window.LNS?.toast?.warning('No hay pedidos para exportar con los filtros actuales.');
      return;
    }

    const csv = '\uFEFF' + toCsv(state.filtered);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    link.href = url;
    link.download = `lenesens-ventas-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);

    window.LNS?.toast?.success(`Exportados ${state.filtered.length} pedidos.`);
  });

  /* ---------------------------------------------------- */
  /* 14. SINCRONIZACIÓN ENTRE PESTAÑAS                    */
  /* ---------------------------------------------------- */
  window.addEventListener('storage', (event) => {
    if (event.key !== (ordersApi()?.STORAGE_KEY || 'lenesens_orders')) return;
    if (app.hidden) return;
    loadOrders();
    render();
  });

  /* ---------------------------------------------------- */
  /* 15. PESTAÑAS (Resumen / Pasarelas de pago)            */
  /* ---------------------------------------------------- */
  const tabs = $$('[data-tab]');
  const panels = $$('[data-panel]');

  const activateTab = (name) => {
    tabs.forEach((tab) => {
      const active = tab.dataset.tab === name;
      tab.classList.toggle('is-active', active);
      tab.setAttribute('aria-selected', String(active));
      tab.tabIndex = active ? 0 : -1;
    });

    panels.forEach((panel) => {
      panel.hidden = panel.dataset.panel !== name;
    });

    if (name === 'pagos') window.LNS?.adminPayments?.render?.();
  };

  tabs.forEach((tab, index) => {
    tab.addEventListener('click', () => activateTab(tab.dataset.tab));

    tab.addEventListener('keydown', (event) => {
      if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return;
      event.preventDefault();
      const next = (index + (event.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length;
      tabs[next].focus();
      activateTab(tabs[next].dataset.tab);
    });
  });

  /* ---------------------------------------------------- */
  /* 16. ARRANQUE                                         */
  /* ---------------------------------------------------- */
  const init = () => {
    const session = readSession();

    if (session?.user) {
      state.user = session.user;
      showApp();
    } else {
      showGate();
      userInput?.focus();
    }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();
