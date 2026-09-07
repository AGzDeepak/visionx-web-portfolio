/* ==========================================================================
   VisionX Web Technology — Liquid Glass Cursor Pointer
   Theme-aware fluid physics, specular refraction, and context morphing
   ========================================================================== */

'use strict';

const VisionXLiquidCursor = (function () {
  let cursorEl, dotEl, glassEl, labelEl, rippleEl;
  let mouseX = -100, mouseY = -100;
  let glassX = -100, glassY = -100;
  let prevMouseX = -100, prevMouseY = -100;
  let currentAngle = 0;
  let currentScaleX = 1, currentScaleY = 1;
  let isHovering = false;
  let isViewing = false;
  let isText = false;
  let isGrab = false;
  let isHidden = true;
  let isMouseDown = false;
  let animFrameId = null;

  // Check if touch or coarse pointer or reduced motion
  function isSupported() {
    if (typeof window === 'undefined') return false;
    const isCoarse = window.matchMedia('(pointer: coarse)').matches;
    const isMobile = window.innerWidth <= 768;
    return !isCoarse && !isMobile;
  }

  function init() {
    if (!isSupported()) return;

    cursorEl = document.getElementById('liquid-cursor');
    if (!cursorEl) {
      cursorEl = document.createElement('div');
      cursorEl.id = 'liquid-cursor';
      cursorEl.className = 'liquid-cursor is-hidden';
      cursorEl.setAttribute('aria-hidden', 'true');
      cursorEl.innerHTML = `
        <div class="liquid-cursor__dot"></div>
        <div class="liquid-cursor__glass">
          <div class="liquid-cursor__highlight"></div>
          <div class="liquid-cursor__label"></div>
        </div>
        <div class="liquid-cursor__ripple"></div>
      `;
      document.body.appendChild(cursorEl);
    }

    dotEl = cursorEl.querySelector('.liquid-cursor__dot');
    glassEl = cursorEl.querySelector('.liquid-cursor__glass');
    labelEl = cursorEl.querySelector('.liquid-cursor__label');
    rippleEl = cursorEl.querySelector('.liquid-cursor__ripple');

    document.body.classList.add('has-custom-cursor');

    _bindEvents();
    _startAnimationLoop();
  }

  function _bindEvents() {
    // Mouse movement
    window.addEventListener('mousemove', function (e) {
      if (isHidden) {
        isHidden = false;
        cursorEl.classList.remove('is-hidden');
      }
      mouseX = e.clientX;
      mouseY = e.clientY;

      if (glassX === -100) {
        glassX = mouseX;
        glassY = mouseY;
      }
    }, { passive: true });

    // Window leaves / enters
    document.addEventListener('mouseleave', function () {
      isHidden = true;
      cursorEl.classList.add('is-hidden');
    });

    document.addEventListener('mouseenter', function () {
      isHidden = false;
      cursorEl.classList.remove('is-hidden');
    });

    // Mousedown / Mouseup for liquid compression and ripple
    window.addEventListener('mousedown', function (e) {
      isMouseDown = true;
      cursorEl.classList.add('is-active');
      _triggerRipple(e.clientX, e.clientY);
    });

    window.addEventListener('mouseup', function () {
      isMouseDown = false;
      cursorEl.classList.remove('is-active');
    });

    // Interactive element delegation
    document.addEventListener('mouseover', _handleElementHover, { passive: true });
    document.addEventListener('mouseout', _handleElementLeave, { passive: true });
  }

  function _triggerRipple(x, y) {
    if (!rippleEl) return;
    rippleEl.classList.remove('animate');
    void rippleEl.offsetWidth; // Trigger reflow
    rippleEl.style.left = x + 'px';
    rippleEl.style.top = y + 'px';
    rippleEl.classList.add('animate');
  }

  function _handleElementHover(e) {
    const target = e.target;
    if (!target || !(target instanceof Element)) return;

    // 1. Interactive 3D Canvas / WebGL
    if (target.closest('.hero__scene-canvas, .feature3d__canvas, .about__visual canvas')) {
      _setState('grab', 'DRAG');
      return;
    }

    // 2. Project Card or Interactive Showcase
    const projectCard = target.closest('.project-card, .feature3d');
    if (projectCard) {
      _setState('view', 'EXPLORE');
      return;
    }

    // 3. Clickable / Action targets
    const clickable = target.closest(
      'a, button, .btn, .nav__portal-btn, .nav__start-btn, .nav__hamburger, ' +
      '.floating-quick-action, .tech-tag, .service-card, .review-card, ' +
      '.portal-trigger-btn, .portal-tab-btn, .faq-question, [role="button"], select, .tab-btn'
    );
    if (clickable) {
      _setState('hover');
      return;
    }

    // 4. Text input fields
    const isTextInput = target.closest('input, textarea, [contenteditable="true"]');
    if (isTextInput) {
      _setState('text');
      return;
    }

    // Default resting state
    _resetState();
  }

  function _handleElementLeave(e) {
    const related = e.relatedTarget;
    if (!related || (related instanceof Element && !related.closest('a, button, .btn, .project-card, .service-card, .tech-tag, input, textarea, canvas'))) {
      _resetState();
    }
  }

  function _setState(type, label = '') {
    isHovering = (type === 'hover');
    isViewing = (type === 'view');
    isText = (type === 'text');
    isGrab = (type === 'grab');

    cursorEl.classList.toggle('is-hovering', isHovering);
    cursorEl.classList.toggle('is-viewing', isViewing);
    cursorEl.classList.toggle('is-text', isText);
    cursorEl.classList.toggle('is-grab', isGrab);

    if (labelEl) {
      labelEl.textContent = label;
      labelEl.style.opacity = label ? '1' : '0';
    }
  }

  function _resetState() {
    isHovering = false;
    isViewing = false;
    isText = false;
    isGrab = false;

    cursorEl.classList.remove('is-hovering', 'is-viewing', 'is-text', 'is-grab');
    if (labelEl) {
      labelEl.textContent = '';
      labelEl.style.opacity = '0';
    }
  }

  function _startAnimationLoop() {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    function render() {
      if (!isHidden && mouseX > -50) {
        // Direct tracking for center dot
        dotEl.style.transform = `translate3d(${mouseX}px, ${mouseY}px, 0)`;

        // Spring lerp for outer liquid glass lens
        const lerpFactor = isHovering || isViewing ? 0.22 : 0.16;
        glassX += (mouseX - glassX) * lerpFactor;
        glassY += (mouseY - glassY) * lerpFactor;

        // Velocity-based fluid droplet distortion
        const vx = mouseX - prevMouseX;
        const vy = mouseY - prevMouseY;
        const speed = Math.sqrt(vx * vx + vy * vy);

        prevMouseX = mouseX;
        prevMouseY = mouseY;

        const baseTargetScale = isViewing ? 1.85 : isHovering ? 1.55 : isGrab ? 1.42 : 1.0;

        if (!reducedMotion && !isHovering && !isViewing && !isText && speed > 2) {
          const targetAngle = Math.atan2(vy, vx) * (180 / Math.PI);
          // Angle smoothing
          currentAngle += (targetAngle - currentAngle) * 0.25;

          // Stretch along velocity vector, compress perpendicularly
          const stretch = Math.min(speed * 0.0035, 0.45);
          const targetScaleX = 1 + stretch;
          const targetScaleY = 1 - stretch * 0.7;

          currentScaleX += (targetScaleX - currentScaleX) * 0.2;
          currentScaleY += (targetScaleY - currentScaleY) * 0.2;

          glassEl.style.transform = `translate3d(${glassX}px, ${glassY}px, 0) rotate(${currentAngle.toFixed(1)}deg) scale(${currentScaleX.toFixed(3)}, ${currentScaleY.toFixed(3)})`;
        } else {
          // Smooth return or morph to target hover/viewing scale
          currentScaleX += (baseTargetScale - currentScaleX) * 0.22;
          currentScaleY += (baseTargetScale - currentScaleY) * 0.22;
          glassEl.style.transform = `translate3d(${glassX}px, ${glassY}px, 0) scale(${currentScaleX.toFixed(3)}, ${currentScaleY.toFixed(3)})`;
        }
      }

      animFrameId = requestAnimationFrame(render);
    }

    render();
  }

  function destroy() {
    if (animFrameId) cancelAnimationFrame(animFrameId);
    document.body.classList.remove('has-custom-cursor');
    if (cursorEl && cursorEl.parentNode) {
      cursorEl.parentNode.removeChild(cursorEl);
    }
  }

  return {
    init: init,
    destroy: destroy
  };
})();
