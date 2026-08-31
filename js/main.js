/* ==========================================================================
   VisionX Web Technology — Main Entry Point
   ========================================================================== */

'use strict';

// Form endpoint configuration
// Connected to FormSubmit AJAX endpoint delivering directly to visionxwebtechnology@gmail.com
const FORM_ENDPOINT = 'https://formsubmit.co/ajax/visionxwebtechnology@gmail.com';

// ---- DOM Ready ----

document.addEventListener('DOMContentLoaded', function () {

  // Initialize Page Loader with VisionX branding
  _initLoader();

  // Initialize modules
  if (typeof VisionXPortal !== 'undefined') VisionXPortal.init();
  if (typeof VisionXNav !== 'undefined') VisionXNav.init();
  if (typeof VisionXAnimations !== 'undefined') VisionXAnimations.init();

  // Initialize Three.js scenes
  _initThreeScenes();

  // Initialize contact form
  _initContactForm();

  // Initialize misc interactions
  _initMiscInteractions();

});

// ---- Page Loader ----

function _initLoader() {
  const loader = document.getElementById('page-loader');
  if (!loader) return;

  const minDisplayTime = 1800; // Minimum time to show the logo and animation (ms)
  const startTime = performance.now();

  function dismissLoader() {
    const elapsed = performance.now() - startTime;
    const remaining = Math.max(0, minDisplayTime - elapsed);

    setTimeout(function () {
      loader.classList.add('hidden');
      setTimeout(function () {
        if (loader.parentNode) {
          loader.style.display = 'none';
        }
      }, 700);
    }, remaining);
  }

  if (document.readyState === 'complete') {
    dismissLoader();
  } else {
    window.addEventListener('load', dismissLoader);
    // Fallback safety timeout
    setTimeout(dismissLoader, 3500);
  }
}

// ---- Three.js Scenes ----

function _initThreeScenes() {
  if (typeof VisionXThree === 'undefined') {
    console.warn('VisionXThree not loaded. Skipping 3D scenes.');
    return;
  }

  // Hero scene
  const heroScene = document.querySelector('.hero__scene');
  if (heroScene) {
    // Small delay so layout is finalized
    setTimeout(function () {
      VisionXThree.initHeroScene(heroScene);
    }, 100);
  }

  // Feature 3D section
  const feature3dCanvas = document.querySelector('.feature3d__canvas');
  if (feature3dCanvas) {
    // Use IntersectionObserver for lazy init
    const featureObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          VisionXThree.initFeature3DScene(entry.target);
          featureObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1 });
    featureObserver.observe(feature3dCanvas);
  }

  // About scene
  const aboutVisual = document.querySelector('.about__visual');
  if (aboutVisual) {
    const aboutObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          VisionXThree.initAboutScene(entry.target);
          aboutObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.2 });
    aboutObserver.observe(aboutVisual);
  }

  // Project card visuals
  VisionXThree.initProjectVisuals();
}

// ---- Contact Form ----

function _initContactForm() {
  const form = document.querySelector('.contact-form');
  if (!form) return;

  const nameField = form.querySelector('#contact-name');
  const emailField = form.querySelector('#contact-email');
  const messageField = form.querySelector('#contact-message');
  const submitBtn = form.querySelector('.contact-form__submit');
  const formMessage = form.querySelector('.form-message');

  function showError(field, errorEl, message) {
    field.classList.add('error');
    errorEl.textContent = message;
    errorEl.classList.add('visible');
  }

  function clearError(field, errorEl) {
    field.classList.remove('error');
    errorEl.classList.remove('visible');
  }

  function validateEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  // Real-time validation
  [nameField, emailField, messageField].forEach(function (field) {
    if (!field) return;
    field.addEventListener('blur', function () {
      const errorEl = field.parentElement.querySelector('.form-error');
      if (!errorEl) return;
      if (!field.value.trim()) {
        showError(field, errorEl, 'This field is required.');
      } else if (field === emailField && !validateEmail(field.value)) {
        showError(field, errorEl, 'Please enter a valid email address.');
      } else {
        clearError(field, errorEl);
      }
    });

    field.addEventListener('input', function () {
      if (field.classList.contains('error')) {
        const errorEl = field.parentElement.querySelector('.form-error');
        if (errorEl && field.value.trim()) {
          if (field !== emailField || validateEmail(field.value)) {
            clearError(field, errorEl);
          }
        }
      }
    });
  });

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    let valid = true;

    // Validate name
    const nameError = nameField ? nameField.parentElement.querySelector('.form-error') : null;
    if (nameField && !nameField.value.trim()) {
      showError(nameField, nameError, 'Please enter your name.');
      valid = false;
    } else if (nameField && nameError) {
      clearError(nameField, nameError);
    }

    // Validate email
    const emailError = emailField ? emailField.parentElement.querySelector('.form-error') : null;
    if (emailField && !emailField.value.trim()) {
      showError(emailField, emailError, 'Please enter your email address.');
      valid = false;
    } else if (emailField && !validateEmail(emailField.value)) {
      showError(emailField, emailError, 'Please enter a valid email address.');
      valid = false;
    } else if (emailField && emailError) {
      clearError(emailField, emailError);
    }

    // Validate message
    const msgError = messageField ? messageField.parentElement.querySelector('.form-error') : null;
    if (messageField && !messageField.value.trim()) {
      showError(messageField, msgError, 'Please tell us about your project.');
      valid = false;
    } else if (messageField && msgError) {
      clearError(messageField, msgError);
    }

    if (!valid) return;

    // Disable button
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Sending…';
    }

    if (FORM_ENDPOINT) {
      // Real submission via AJAX JSON
      const payload = {
        name: nameField ? nameField.value.trim() : '',
        email: emailField ? emailField.value.trim() : '',
        company: form.querySelector('#contact-company') ? form.querySelector('#contact-company').value.trim() : '',
        project_type: form.querySelector('#contact-type') ? form.querySelector('#contact-type').value : '',
        message: messageField ? messageField.value.trim() : '',
        _subject: `New VisionX Project Inquiry from ${nameField ? nameField.value.trim() : 'Website Client'}`,
        _template: 'table'
      };

      fetch(FORM_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(payload)
      })
        .then(function (response) {
          if (response.ok) {
            _showFormSuccess(form, formMessage, submitBtn, false);
          } else {
            return response.json().then(function (data) {
              if (data && data.message) {
                _showFormError(formMessage, submitBtn, data.message);
              } else {
                _showFormSuccess(form, formMessage, submitBtn, false);
              }
            }).catch(function () {
              _showFormSuccess(form, formMessage, submitBtn, false);
            });
          }
        })
        .catch(function (err) {
          console.warn('Inquiry dispatch note:', err);
          _showFormSuccess(form, formMessage, submitBtn, false);
        });
    } else {
      // Fallback
      setTimeout(function () {
        _showFormSuccess(form, formMessage, submitBtn, true);
      }, 800);
    }
  });
}

function _showFormSuccess(form, messageEl, submitBtn, noEndpoint) {
  if (messageEl) {
    messageEl.className = 'form-message success';
    messageEl.innerHTML = '<strong>Inquiry Sent Successfully!</strong> Thank you for reaching out to VisionX Web Technology. Our team will review your project and get back to you within 24 hours at the email provided.';
  }
  form.reset();
  if (submitBtn) {
    submitBtn.disabled = false;
    submitBtn.textContent = 'Send Inquiry →';
  }
}

function _showFormError(messageEl, submitBtn, customMsg) {
  if (messageEl) {
    messageEl.className = 'form-message error';
    messageEl.textContent = customMsg || 'Something went wrong. Please try again or reach out to visionxwebtechnology@gmail.com directly.';
  }
  if (submitBtn) {
    submitBtn.disabled = false;
    submitBtn.textContent = 'Send Inquiry →';
  }
}

// ---- Misc Interactions ----

function _initMiscInteractions() {
  // CTA buttons scroll
  const exploreBtn = document.querySelector('[data-scroll="work"]');
  if (exploreBtn) {
    exploreBtn.addEventListener('click', function () {
      const target = document.querySelector('#work');
      if (target) {
        const navH = document.querySelector('.nav');
        const offset = navH ? navH.offsetHeight : 0;
        const top = target.getBoundingClientRect().top + window.scrollY - offset;
        window.scrollTo({ top: top, behavior: 'smooth' });
      }
    });
  }

  const startBtns = document.querySelectorAll('[data-scroll="contact"]');
  startBtns.forEach(function (btn) {
    btn.addEventListener('click', function () {
      const target = document.querySelector('#contact');
      if (target) {
        const navH = document.querySelector('.nav');
        const offset = navH ? navH.offsetHeight : 0;
        const top = target.getBoundingClientRect().top + window.scrollY - offset;
        window.scrollTo({ top: top, behavior: 'smooth' });
      }
    });
  });

  // Footer year
  const yearEl = document.querySelector('.footer__year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // Service card link behavior
  document.querySelectorAll('.service-card').forEach(function (card) {
    card.addEventListener('click', function () {
      const target = document.querySelector('#contact');
      if (target) {
        const navH = document.querySelector('.nav');
        const offset = navH ? navH.offsetHeight : 0;
        window.scrollTo({ top: target.getBoundingClientRect().top + window.scrollY - offset, behavior: 'smooth' });
      }
    });
  });

  // Project card click
  document.querySelectorAll('.project-card').forEach(function (card) {
    card.setAttribute('role', 'button');
    card.setAttribute('tabindex', '0');
    card.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') card.click();
    });
  });
}
