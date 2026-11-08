/* ============================================================
   NEWSLETTER — Formularios de suscripción
   Lenesens Hydralight
   Valida email, guarda local, muestra feedback visual.
   ============================================================ */

'use strict';

(function initNewsletter() {

  const init = () => {

    /* ----------------------------------------------------
       1. ENGANCHE A TODOS LOS FORMULARIOS
       ---------------------------------------------------- */
    const forms = document.querySelectorAll('[data-newsletter-form]');
    if (!forms.length) return;

    forms.forEach((form) => attachHandler(form));
  };

  /* ----------------------------------------------------
     MANEJO DEL SUBMIT
     ---------------------------------------------------- */
  function attachHandler(form) {
    const input  = form.querySelector('input[type="email"]');
    const btn    = form.querySelector('button[type="submit"]');

    if (!input || !btn) return;

    form.addEventListener('submit', (e) => {
      e.preventDefault();

      const email = input.value.trim();

      /* --- Validación simple --- */
      if (!isValidEmail(email)) {
        showFeedback(form, 'error', 'Por favor, ingresa un correo electrónico válido.');
        input.focus();
        return;
      }

      /* --- Estado de carga --- */
      setLoading(btn, true);

      /* --- Simulación de envío (reemplazar por fetch real) --- */
      setTimeout(() => {
        setLoading(btn, false);
        showFeedback(form, 'success', '¡Bienvenida al Círculo! Revisa tu bandeja de entrada.');

        // Guardamos el email localmente para demo
        const savedEmails = window.LNS.storage.get('lenesens_newsletter_emails', []);
        if (!savedEmails.includes(email)) {
          savedEmails.push(email);
          window.LNS.storage.set('lenesens_newsletter_emails', savedEmails);
        }

        // Limpiamos el input
        input.value = '';

        // Emitimos evento global (por si el carrito o el header reaccionan)
        document.dispatchEvent(
          new CustomEvent('newsletter:subscribed', {
            detail: { email }
          })
        );

      }, 700);
    });
  }

  /* ----------------------------------------------------
     VALIDACIÓN EMAIL (simple y funcional)
     ---------------------------------------------------- */
  function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
  }

  /* ----------------------------------------------------
     ESTADO DE CARGA EN EL BOTÓN
     ---------------------------------------------------- */
  function setLoading(btn, isLoading) {
    btn.classList.toggle('is-loading', isLoading);
    btn.disabled = isLoading;
  }

  /* ----------------------------------------------------
     FEEDBACK VISUAL
     Muestra un mensaje debajo del input.
     ---------------------------------------------------- */
  function showFeedback(form, type, message) {
    // Busca o crea el contenedor de feedback
    let feedback = form.querySelector('.newsletter-feedback');

    if (!feedback) {
      feedback = document.createElement('p');
      feedback.className = 'newsletter-feedback';
      feedback.setAttribute('role', 'status');
      feedback.setAttribute('aria-live', 'polite');
      form.appendChild(feedback);
    }

    feedback.textContent = message;
    feedback.dataset.type = type;

    // Color según el tipo (lo estilizamos aquí por rapidez)
    feedback.style.marginTop = '0.5rem';
    feedback.style.fontSize = '0.75rem';
    feedback.style.fontWeight = '600';
    feedback.style.textAlign = 'center';

    if (type === 'success') {
      feedback.style.color = '#2b5a15';
    } else if (type === 'error') {
      feedback.style.color = '#ba1a1a';
    }

    // Autolimpiar el mensaje de éxito después de 5s
    if (type === 'success') {
      setTimeout(() => {
        feedback.textContent = '';
      }, 5000);
    }
  }

  // Arrancamos
  window.LNS?.ready(init) ?? document.addEventListener('DOMContentLoaded', init);

})();