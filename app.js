/**
 * sevenstudios® — app.js
 *
 * Handles:
 *  1. Fake loading animation → fade to main app
 *  2. Contact form validation + Formspree AJAX submission
 */

/* ═══════════════════════════════════════════════════
   1. LOADER
═══════════════════════════════════════════════════ */

const loader    = document.getElementById('loader');
const app       = document.getElementById('app');
const loaderBar = document.getElementById('loaderBar');

/**
 * Animate the progress bar from 0 → 100 over ~duration ms,
 * then fade the loader out and reveal the app.
 */
function runLoader(duration = 1600) {
  const start   = performance.now();
  const easeOut = t => 1 - Math.pow(1 - t, 3); // cubic ease-out

  function tick(now) {
    const elapsed  = now - start;
    const progress = Math.min(elapsed / duration, 1);
    const eased    = easeOut(progress);

    loaderBar.style.width = `${eased * 100}%`;

    if (progress < 1) {
      requestAnimationFrame(tick);
    } else {
      // Small pause at 100% before fading
      setTimeout(revealApp, 200);
    }
  }

  requestAnimationFrame(tick);
}

function revealApp() {
  loader.classList.add('fade-out');
  app.removeAttribute('aria-hidden');
  app.classList.add('visible');

  // Remove loader from DOM after transition
  loader.addEventListener('transitionend', () => loader.remove(), { once: true });
}

// Kick off the loader on DOMContentLoaded
document.addEventListener('DOMContentLoaded', () => {
  runLoader(1600);
  initContactForm();
});


/* ═══════════════════════════════════════════════════
   2. CONTACT FORM — Formspree AJAX
   Endpoint: https://formspree.io/f/xgopnvwy
═══════════════════════════════════════════════════ */

const FORMSPREE_ENDPOINT = 'https://formspree.io/f/xgopnvwy';

function initContactForm() {
  const form      = document.getElementById('contactForm');
  const submitBtn = document.getElementById('submitBtn');
  const toast     = document.getElementById('toast');

  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault(); // Always prevent native submit

    // ── Validate ────────────────────────────────────
    const isValid = validateForm(form);
    if (!isValid) return;

    // ── Loading state ────────────────────────────────
    setButtonLoading(submitBtn, true);
    hideToast(toast);

    // ── Collect data ─────────────────────────────────
    const payload = {
      name:    form.name.value.trim(),
      email:   form.email.value.trim(),
      service: form.service.value,
      message: form.message.value.trim(),
    };

    // ── Send to Formspree ────────────────────────────
    try {
      const response = await fetch(FORMSPREE_ENDPOINT, {
        method:  'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept':       'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.ok) {
        // Success
        form.reset();
        showToast(toast, true);
        clearAllErrors(form);
      } else {
        // Formspree returned validation errors
        if (data.errors) {
          data.errors.forEach(err => {
            // err.field is the field name, err.message is the error
            showFieldError(form, err.field, err.message);
          });
        } else {
          showToast(toast, false, 'Something went wrong. Please try again.');
        }
      }
    } catch (networkErr) {
      console.error('Network error:', networkErr);
      showToast(toast, false, 'Network error. Please check your connection.');
    } finally {
      setButtonLoading(submitBtn, false);
    }
  });

  // Live validation — clear errors on change
  ['name', 'email', 'service', 'message'].forEach(fieldName => {
    const input = form[fieldName];
    input.addEventListener('input', () => clearFieldError(form, fieldName));
    input.addEventListener('change', () => clearFieldError(form, fieldName));
  });
}


/* ── Validation helpers ───────────────────────────── */

/**
 * Runs all field validations.
 * Returns true if the form is valid.
 */
function validateForm(form) {
  let valid = true;

  // Name
  const name = form.name.value.trim();
  if (!name) {
    showFieldError(form, 'name', 'Please enter your name.');
    valid = false;
  }

  // Email
  const email = form.email.value.trim();
  if (!email) {
    showFieldError(form, 'email', 'Please enter your email address.');
    valid = false;
  } else if (!isValidEmail(email)) {
    showFieldError(form, 'email', 'Please enter a valid email address.');
    valid = false;
  }

  // Service
  const service = form.service.value;
  if (!service) {
    showFieldError(form, 'service', 'Please select a service.');
    valid = false;
  }

  // Message
  const message = form.message.value.trim();
  if (!message) {
    showFieldError(form, 'message', 'Please tell us about your project.');
    valid = false;
  }

  return valid;
}

function isValidEmail(email) {
  // RFC 5322 simplified pattern
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/**
 * Show an inline error for a specific field.
 * @param {HTMLFormElement} form
 * @param {string} fieldName - matches `name` attribute
 * @param {string} message
 */
function showFieldError(form, fieldName, message) {
  const input = form[fieldName];
  const errorEl = document.getElementById(`error-${fieldName}`);
  if (!input || !errorEl) return;

  input.setAttribute('aria-invalid', 'true');
  errorEl.textContent = message;

  // Add visual indicator to the wrapper
  const fieldWrapper = document.getElementById(`field-${fieldName}`);
  if (fieldWrapper) fieldWrapper.classList.add('field--error');
}

function clearFieldError(form, fieldName) {
  const input = form[fieldName];
  const errorEl = document.getElementById(`error-${fieldName}`);
  if (!input || !errorEl) return;

  input.removeAttribute('aria-invalid');
  errorEl.textContent = '';

  const fieldWrapper = document.getElementById(`field-${fieldName}`);
  if (fieldWrapper) fieldWrapper.classList.remove('field--error');
}

function clearAllErrors(form) {
  ['name', 'email', 'service', 'message'].forEach(f => clearFieldError(form, f));
}


/* ── Toast helpers ────────────────────────────────── */

/**
 * Show the toast.
 * @param {HTMLElement} toast
 * @param {boolean} success - true = success, false = error
 * @param {string} [customMessage]
 */
function showToast(toast, success, customMessage) {
  const icon = toast.querySelector('.toast__icon');
  const text = toast.querySelector('.toast__text');

  if (success) {
    icon.textContent = '✓';
    text.textContent = customMessage || 'Message sent. We\'ll be in touch soon.';
    toast.style.borderColor = 'rgba(255,255,255,0.2)';
  } else {
    icon.textContent = '✕';
    text.textContent = customMessage || 'Something went wrong. Please try again.';
    toast.style.borderColor = 'rgba(255, 80, 80, 0.4)';
  }

  toast.classList.add('show');

  // Auto-hide after 6 seconds
  setTimeout(() => hideToast(toast), 6000);
}

function hideToast(toast) {
  toast.classList.remove('show');
}


/* ── Button state helpers ─────────────────────────── */

function setButtonLoading(btn, loading) {
  btn.disabled = loading;
  btn.classList.toggle('btn--loading', loading);
}
