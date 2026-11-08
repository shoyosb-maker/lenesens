/* ============================================================
   ADMIN — Sección de pasarelas de pago
   Renderiza y edita las llaves de las APIs bancarias.
   ============================================================ */
(() => {
  'use strict';

  const root = document.querySelector('[data-gateways]');
  if (!root) return;

  const countEl = document.querySelector('[data-pay-count]');
  const methodsEl = document.querySelector('[data-pay-methods]');

  /* Tarjetas abiertas (se conservan al volver a renderizar) */
  const openIds = new Set();

  const api = () => window.LNS?.gateways;

  const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[char]));

  const webhookFor = (id) => `${api()?.WEBHOOK_BASE || 'https://lenesens.com.co/api/webhooks'}/${id}`;

  const samplePayload = (gateway) => JSON.stringify({
    event: 'transaction.updated',
    gateway: gateway.provider,
    environment: gateway.mode,
    data: {
      transaction: {
        id: 'test_' + gateway.id + '_0001',
        status: 'APPROVED',
        amount_in_cents: 14490000,
        currency: 'COP',
        reference: 'LNS-TEST-0001',
        customer_email: 'cliente@correo.com'
      }
    },
    sent_at: new Date().toISOString()
  }, null, 2);

  const curlFor = (gateway) => {
    const url = api().webhookUrlOf(gateway);
    return [
      `curl -X POST '${url}' \\`,
      '  -H "Content-Type: application/json" \\',
      `  -d '${samplePayload(gateway).replace(/'/g, "'\\''")}'`
    ].join('\n');
  };

  const copyText = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      try {
        const area = document.createElement('textarea');
        area.value = text;
        area.setAttribute('readonly', '');
        area.style.position = 'fixed';
        area.style.opacity = '0';
        document.body.appendChild(area);
        area.select();
        const ok = document.execCommand('copy');
        area.remove();
        return ok;
      } catch {
        return false;
      }
    }
  };

  /* ---------------------------------------------------- */
  /* Render                                               */
  /* ---------------------------------------------------- */
  const renderSummary = () => {
    const gateways = api()?.all() || [];
    const active = gateways.filter((gateway) => gateway.enabled);
    const complete = active.filter((gateway) => api().isComplete(gateway));
    const ready = gateways.filter((gateway) => !gateway.enabled && api().isComplete(gateway) && gateway.publicKey);

    if (countEl) {
      countEl.textContent = `${active.length} de ${gateways.length} activas`;
    }

    if (methodsEl) {
      const methods = api()?.activeMethods() || [];
      const parts = [];

      parts.push(methods.length
        ? `Métodos habilitados: ${methods.map((m) => api().METHODS[m]).join(' · ')}`
        : 'Ningún método habilitado todavía');

      if (active.length && complete.length < active.length) {
        parts.push('hay pasarelas activas sin llaves completas');
      }

      if (ready.length) {
        const names = ready.map((gateway) => gateway.label).join(', ');
        parts.push(
          ready.length === 1
            ? `${names} está lista para activar (el checkout todavía no la usa)`
            : `${names} están listas para activar (el checkout todavía no las usa)`
        );
      }

      methodsEl.textContent = parts.join(' · ');
    }
  };

  const gatewayCard = (gateway) => {
    const info = api().providerInfo(gateway.provider);
    const complete = api().isComplete(gateway);
    const needsKeys = info.requiresKeys;
    const isPaypal = gateway.provider === 'paypal';

    const stateBadge = gateway.enabled
      ? (complete
        ? '<span class="admin-badge admin-badge--entregado">Activa</span>'
        : '<span class="admin-badge admin-badge--pendiente">Faltan llaves</span>')
      : (complete && (gateway.publicKey || gateway.privateKey)
        ? '<span class="admin-badge admin-badge--pendiente">Lista para activar</span>'
        : '<span class="admin-badge admin-badge--cancelado">Inactiva</span>');

    const modeBadge = gateway.mode === 'live'
      ? '<span class="admin-gw-mode is-live">Producción</span>'
      : '<span class="admin-gw-mode">Pruebas</span>';

    const methodChecks = Object.entries(api().METHODS).map(([key, label]) => `
      <label class="admin-gw-check">
        <input type="checkbox" data-gw-method value="${key}" ${gateway.methods.includes(key) ? 'checked' : ''}>
        <span>${esc(label)}</span>
      </label>
    `).join('');

    return `
      <article class="admin-gw ${openIds.has(gateway.id) ? 'is-open' : ''}" data-gw="${esc(gateway.id)}">
        <header class="admin-gw-head">
          <span class="admin-gw-logo" aria-hidden="true">${esc(gateway.label.charAt(0).toUpperCase())}</span>
          <div class="admin-gw-title">
            <h3>${esc(gateway.label)}</h3>
            <p>${esc(info.hint)}</p>
          </div>
          <div class="admin-gw-flags">
            ${modeBadge}
            ${stateBadge}
          </div>
          <label class="admin-switch" title="Activar o desactivar">
            <input type="checkbox" data-gw-enabled ${gateway.enabled ? 'checked' : ''} aria-label="Activar ${esc(gateway.label)}">
            <span class="admin-switch-track" aria-hidden="true"></span>
          </label>
          <button type="button" class="admin-gw-toggle" data-gw-expand aria-expanded="${openIds.has(gateway.id)}" aria-label="Editar ${esc(gateway.label)}">
            <svg aria-hidden="true"><use href="assets/icons/sprite.svg#icon-chevron-down"></use></svg>
          </button>
        </header>

        <div class="admin-gw-body" ${openIds.has(gateway.id) ? '' : 'hidden'}>
          <div class="admin-gw-grid">
            <label class="admin-gw-field">
              <span>Pasarela</span>
              <select data-gw-provider>
                ${api().PROVIDERS.map((provider) => `
                  <option value="${provider.id}" ${provider.id === gateway.provider ? 'selected' : ''}>${esc(provider.name)}</option>
                `).join('')}
              </select>
            </label>

            <label class="admin-gw-field">
              <span>Nombre visible en el checkout</span>
              <input type="text" data-gw-label value="${esc(gateway.label)}" placeholder="Ej: Wompi · Tarjetas y PSE">
            </label>

            <label class="admin-gw-field">
              <span>Modo</span>
              <select data-gw-mode>
                <option value="test" ${gateway.mode === 'test' ? 'selected' : ''}>Pruebas (sandbox)</option>
                <option value="live" ${gateway.mode === 'live' ? 'selected' : ''}>Producción</option>
              </select>
            </label>

            ${isPaypal ? `
              <label class="admin-gw-field">
                <span>Correo de la cuenta PayPal (business)</span>
                <input type="email" data-gw-public value="${esc(gateway.publicKey)}" placeholder="pagos@lenesens.com.co" spellcheck="false" autocomplete="off">
                <span class="admin-gw-hint">
                  Aquí se recibe el dinero del pedido. En modo pruebas se cobra en sandbox.paypal.com.
                </span>
              </label>

              <div class="admin-gw-note">
                PayPal solo necesita la cuenta del negocio: el pago se aprueba en PayPal y el total se convierte de COP a USD.
              </div>
            ` : needsKeys ? `
              <label class="admin-gw-field">
                <span>Llave pública (public key)</span>
                <input type="text" data-gw-public value="${esc(gateway.publicKey)}" placeholder="pub_test_..." spellcheck="false" autocomplete="off">
              </label>

              <label class="admin-gw-field admin-gw-field--secret">
                <span>Llave privada (secret key)</span>
                <span class="admin-secret">
                  <input type="password" data-gw-private value="${esc(gateway.privateKey)}" placeholder="prv_test_..." spellcheck="false" autocomplete="new-password">
                  <button type="button" class="admin-secret-toggle" data-gw-reveal aria-label="Mostrar llave privada" aria-pressed="false">
                    <svg aria-hidden="true"><use href="assets/icons/sprite.svg#icon-eye"></use></svg>
                  </button>
                </span>
              </label>

              <label class="admin-gw-field admin-gw-field--secret">
                <span>Secreto de integridad (firma del checkout)</span>
                <span class="admin-secret">
                  <input type="password" data-gw-integrity value="${esc(gateway.integritySecret)}" placeholder="test_integrity_..." spellcheck="false" autocomplete="new-password">
                  <button type="button" class="admin-secret-toggle" data-gw-reveal aria-label="Mostrar secreto de integridad" aria-pressed="false">
                    <svg aria-hidden="true"><use href="assets/icons/sprite.svg#icon-eye"></use></svg>
                  </button>
                </span>
                <span class="admin-gw-hint">
                  Se usa para firmar la URL de pago. Si no lo pones aquí, el checkout pide la firma a
                  <code>server/.env</code> (<code>WOMPI_INTEGRITY_SECRET</code>).
                </span>
              </label>

              <label class="admin-gw-field admin-gw-field--secret">
                <span>Secreto de eventos / webhook (opcional)</span>
                <span class="admin-secret">
                  <input type="password" data-gw-events value="${esc(gateway.eventsSecret)}" placeholder="whsec_..." spellcheck="false" autocomplete="new-password">
                  <button type="button" class="admin-secret-toggle" data-gw-reveal aria-label="Mostrar secreto de eventos" aria-pressed="false">
                    <svg aria-hidden="true"><use href="assets/icons/sprite.svg#icon-eye"></use></svg>
                  </button>
                </span>
              </label>
            ` : `
              <div class="admin-gw-note">
                Esta pasarela no necesita API: el pago se recibe en efectivo al entregar el pedido.
              </div>
            `}

            <div class="admin-gw-field admin-gw-field--wide">
              <span>URL de notificaciones (webhook)</span>
              <span class="admin-copy-row">
                <input type="url" data-gw-webhook value="${esc(api().webhookUrlOf(gateway))}" placeholder="${esc(api().suggestedWebhook(gateway))}" spellcheck="false" autocomplete="off">
                <button type="button" class="admin-copy-btn" data-gw-copy>Copiar</button>
              </span>
              <span class="admin-gw-hint">
                Pega aquí la URL real de tu backend (si difiere). Debe ser HTTPS y responder 200.
              </span>
              <span class="admin-gw-inline">
                <button type="button" class="admin-gw-chip" data-gw-copy-curl>Copiar cURL de prueba</button>
                <button type="button" class="admin-gw-chip" data-gw-webhook-reset>Usar URL sugerida</button>
                <button type="button" class="admin-gw-chip" data-gw-webhook-regen>Regenerar token</button>
              </span>
            </div>
          </div>

          <fieldset class="admin-gw-methods">
            <legend>Métodos que habilita</legend>
            <div class="admin-gw-checks">${methodChecks}</div>
          </fieldset>

          <p class="admin-gw-live" data-gw-live ${gateway.mode === 'live' ? '' : 'hidden'}>
            <svg aria-hidden="true"><use href="assets/icons/sprite.svg#icon-shield"></use></svg>
            <span>Modo producción: los cobros serán reales. Verifica las llaves antes de activar.</span>
          </p>

          <div class="admin-gw-actions">
            <button type="button" class="btn btn-primary btn-sm" data-gw-save>Guardar cambios</button>
            <button type="button" class="btn btn-outline btn-sm" data-gw-validate>Validar llaves</button>
            <button type="button" class="btn btn-ghost btn-sm admin-gw-delete" data-gw-delete>Eliminar</button>
          </div>

          <p class="admin-gw-verify ${gateway.verified ? (gateway.verified.ok ? 'is-ok' : 'is-error') : ''}" data-gw-verify>${
            gateway.verified
              ? esc(gateway.verified.message)
              : 'Sin validar todavía.'
          }</p>
        </div>
      </article>
    `;
  };

  const render = () => {
    const gateways = api()?.all() || [];

    root.innerHTML = gateways.length
      ? gateways.map(gatewayCard).join('')
      : '<p class="admin-empty">No hay pasarelas configuradas. Añade una para empezar.</p>';

    renderSummary();
  };

  /* ---------------------------------------------------- */
  /* Helpers de tarjeta                                   */
  /* ---------------------------------------------------- */
  const cardOf = (el) => el.closest('[data-gw]');
  const idOf = (card) => card.getAttribute('data-gw');

  const readCard = (card) => ({
    id: idOf(card),
    provider: card.querySelector('[data-gw-provider]')?.value,
    label: card.querySelector('[data-gw-label]')?.value.trim(),
    mode: card.querySelector('[data-gw-mode]')?.value,
    publicKey: card.querySelector('[data-gw-public]')?.value.trim() || '',
    privateKey: card.querySelector('[data-gw-private]')?.value.trim() || '',
    integritySecret: card.querySelector('[data-gw-integrity]')?.value.trim() || '',
    eventsSecret: card.querySelector('[data-gw-events]')?.value.trim() || '',
    webhookUrl: card.querySelector('[data-gw-webhook]')?.value.trim() || '',
    webhookToken: api().get(idOf(card))?.webhookToken || '',
    methods: Array.from(card.querySelectorAll('[data-gw-method]:checked')).map((input) => input.value),
    enabled: Boolean(card.querySelector('[data-gw-enabled]')?.checked)
  });

  /* ---------------------------------------------------- */
  /* Eventos                                              */
  /* ---------------------------------------------------- */
  root.addEventListener('click', async (event) => {
    const card = cardOf(event.target);
    if (!card) return;

    /* Expandir / colapsar */
    const expandBtn = event.target.closest('[data-gw-expand]');
    if (expandBtn) {
      const body = card.querySelector('.admin-gw-body');
      const open = body.hidden;
      body.hidden = !open;
      expandBtn.setAttribute('aria-expanded', String(open));
      card.classList.toggle('is-open', open);

      if (open) openIds.add(idOf(card));
      else openIds.delete(idOf(card));
      return;
    }

    /* Mostrar / ocultar llaves */
    const revealBtn = event.target.closest('[data-gw-reveal]');
    if (revealBtn) {
      const input = revealBtn.parentElement.querySelector('input');
      const visible = input.type === 'text';
      input.type = visible ? 'password' : 'text';
      revealBtn.setAttribute('aria-pressed', String(!visible));
      revealBtn.setAttribute('aria-label', visible ? 'Mostrar llave' : 'Ocultar llave');
      return;
    }

    /* Copiar webhook */
    if (event.target.closest('[data-gw-copy]')) {
      const value = card.querySelector('[data-gw-webhook]')?.value || '';
      const ok = await copyText(value);
      window.LNS?.toast?.[ok ? 'success' : 'error'](ok ? 'URL de notificaciones copiada.' : 'No se pudo copiar.');
      return;
    }

    /* Copiar cURL de prueba con un payload de ejemplo */
    if (event.target.closest('[data-gw-copy-curl]')) {
      const data = readCard(card);
      const url = data.webhookUrl || api().webhookUrlOf(data);

      if (!api().isValidWebhook(url)) {
        window.LNS?.toast?.error('La URL de notificaciones no es válida.');
        return;
      }

      const curl = curlFor({ ...data, webhookUrl: url });
      const ok = await copyText(curl);
      window.LNS?.toast?.[ok ? 'success' : 'error'](
        ok ? 'Comando cURL copiado: pégalo en tu terminal para probar el webhook.' : 'No se pudo copiar.'
      );
      return;
    }

    /* Volver a la URL sugerida */
    if (event.target.closest('[data-gw-webhook-reset]')) {
      const url = api().resetWebhook(idOf(card));
      const input = card.querySelector('[data-gw-webhook]');
      if (input) input.value = url || '';
      window.LNS?.toast?.info('URL sugerida restaurada.');
      return;
    }

    /* Generar un token nuevo */
    if (event.target.closest('[data-gw-webhook-regen]')) {
      const url = api().regenerateWebhook(idOf(card));
      const input = card.querySelector('[data-gw-webhook]');
      if (input) input.value = url || '';
      window.LNS?.toast?.success('Token regenerado. Actualiza la URL en el panel del banco.');
      return;
    }

    /* Guardar */
    if (event.target.closest('[data-gw-save]')) {
      const data = readCard(card);

      if (!data.label) {
        window.LNS?.toast?.error('El nombre visible es obligatorio.');
        return;
      }

      if (data.webhookUrl && !api().isValidWebhook(data.webhookUrl)) {
        window.LNS?.toast?.error('La URL de notificaciones debe empezar por https:// y ser válida.');
        return;
      }

      if (data.enabled && !api().isComplete(data)) {
        window.LNS?.toast?.error('Para activar la pasarela completa sus datos de conexión.');
        return;
      }

      api().save(data);
      render();
      window.LNS?.toast?.success('Pasarela guardada.');
      return;
    }

    /* Validar */
    if (event.target.closest('[data-gw-validate]')) {
      const data = readCard(card);
      const info = api().providerInfo(data.provider);

      if (!info.requiresKeys) {
        window.LNS?.toast?.success('Esta pasarela no requiere llaves.');
        return;
      }

      const missing = [];
      if (!data.publicKey) missing.push('llave pública');
      if (!data.privateKey) missing.push('llave privada');

      if (missing.length) {
        window.LNS?.toast?.error(`Falta: ${missing.join(' y ')}.`);
        return;
      }

      const button = event.target.closest('[data-gw-validate]');
      const status = card.querySelector('[data-gw-verify]');
      const original = button.textContent;

      button.disabled = true;
      button.textContent = 'Validando…';

      if (status) {
        status.className = 'admin-gw-verify is-pending';
        status.textContent = `Consultando ${info.name} (${data.mode === 'live' ? 'producción' : 'sandbox'})…`;
      }

      api().verify(data).then((result) => {
        button.disabled = false;
        button.textContent = original;

        const details = [];

        if (result.publicKey) details.push('llave pública ✓');
        if (result.privateKey) details.push('llave privada ✓');
        if (result.merchant) {
          details.push(`comercio ${result.merchant.id} · ${result.merchant.currencies.join('/')}`);
          details.push(`${result.merchant.methods.length} métodos habilitados`);
        }

        const message = [result.message, details.join(' · ')].filter(Boolean).join(' — ');

        if (status) {
          status.className = 'admin-gw-verify ' + (result.ok ? 'is-ok' : 'is-error');
          status.textContent = message;
        }

        /* Guarda el resultado para mostrarlo al volver a abrir la tarjeta */
        const stored = api().get(data.id);
        if (stored) {
          api().save({ ...stored, verified: { ok: result.ok, message, at: Date.now() } });
        }

        window.LNS?.toast?.[result.ok ? 'success' : 'error'](result.message || 'No se pudo validar.');
      });
      return;
    }

    /* Eliminar */
    if (event.target.closest('[data-gw-delete]')) {
      const id = idOf(card);
      if (!safeConfirm(`¿Eliminar la pasarela "${id}"?`)) return;
      api().remove(id);
      render();
      window.LNS?.toast?.info('Pasarela eliminada.');
    }
  });

  /* Activar / desactivar desde el interruptor */
  root.addEventListener('change', (event) => {
    const modeSelect = event.target.closest('[data-gw-mode]');
    if (modeSelect) {
      const card = cardOf(modeSelect);
      const warning = card?.querySelector('[data-gw-live]');
      if (warning) warning.hidden = modeSelect.value !== 'live';
      return;
    }

    const toggle = event.target.closest('[data-gw-enabled]');
    if (!toggle) return;

    const card = cardOf(toggle);
    const data = readCard(card);

    if (data.enabled && !api().isComplete(data)) {
      toggle.checked = false;
      window.LNS?.toast?.error('Guarda primero los datos de conexión para poder activarla.');
      return;
    }

    api().save({ ...data, enabled: toggle.checked });
    render();
  });

  /* ---------------------------------------------------- */
  /* Acciones globales                                    */
  /* ---------------------------------------------------- */
  const providerSelect = document.querySelector('[data-gateway-provider]');

  const fillProviderOptions = () => {
    if (!providerSelect) return;
    const current = providerSelect.value;
    providerSelect.innerHTML = (api()?.PROVIDERS || [])
      .map((provider) => `<option value="${provider.id}">${esc(provider.name)}</option>`)
      .join('');
    if (current) providerSelect.value = current;
  };

  fillProviderOptions();

  const safeConfirm = (message, fallback = true) => {
    try {
      return window.confirm(message);
    } catch {
      return fallback;
    }
  };

  document.querySelector('[data-gateway-add]')?.addEventListener('click', () => {
    const providerId = providerSelect?.value;
    if (!providerId) return;

    const info = api().providerInfo(providerId);
    api().create(providerId);
    render();
    window.LNS?.toast?.success(`Pasarela ${info.name} añadida.`);
  });

  document.querySelector('[data-pay-export]')?.addEventListener('click', async () => {
    const json = JSON.stringify(api().all(), null, 2);
    const ok = await copyText(json);
    window.LNS?.toast?.[ok ? 'success' : 'error'](
      ok ? 'Configuración copiada al portapapeles.' : 'No se pudo copiar la configuración.'
    );
  });

  document.querySelector('[data-pay-reset]')?.addEventListener('click', () => {
    if (!safeConfirm('¿Restaurar las pasarelas por defecto? Se perderán las llaves guardadas.')) return;
    api().reset();
    render();
    window.LNS?.toast?.info('Configuración restaurada.');
  });

  document.addEventListener('gateways:change', render);

  /* ---------------------------------------------------- */
  /* Arranque                                             */
  /* ---------------------------------------------------- */
  window.LNS = window.LNS || {};
  window.LNS.adminPayments = { render };

  const init = () => render();

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();
