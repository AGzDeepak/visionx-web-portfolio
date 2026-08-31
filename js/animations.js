/* ==========================================================================
   VisionX Web Technology — Animations
   ========================================================================== */

'use strict';

const VisionXAnimations = (function () {

  // ---- Scroll Reveal ----

  let observer;

  function initScrollReveal() {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (reducedMotion) {
      // Immediately reveal everything
      document.querySelectorAll('.reveal, .reveal-left, .reveal-right, .reveal-scale, .process-step, .tech-tag, .stagger-children').forEach(function (el) {
        el.classList.add('revealed');
      });
      return;
    }

    const observerOptions = {
      threshold: 0.12,
      rootMargin: '0px 0px -40px 0px'
    };

    observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('revealed');
          // Unobserve after reveal for performance
          observer.unobserve(entry.target);
        }
      });
    }, observerOptions);

    // Observe all reveal elements
    document.querySelectorAll(
      '.reveal, .reveal-left, .reveal-right, .reveal-scale, .process-step, .stagger-children'
    ).forEach(function (el) {
      observer.observe(el);
    });

    // Tech tags — trigger as group
    const techContainer = document.querySelector('.tech__tags');
    if (techContainer) {
      const tagObserver = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.querySelectorAll('.tech-tag').forEach(function (tag) {
              tag.classList.add('revealed');
            });
            tagObserver.unobserve(entry.target);
          }
        });
      }, { threshold: 0.1 });
      tagObserver.observe(techContainer);
    }
  }

  // ---- Scroll Progress Bar ----

  function initScrollProgress() {
    const bar = document.querySelector('.scroll-progress');
    if (!bar) return;

    window.addEventListener('scroll', function () {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = docHeight > 0 ? scrollTop / docHeight : 0;
      bar.style.transform = 'scaleX(' + progress + ')';
    }, { passive: true });
  }

  // ---- VisionX Frosted Glass Cursor (Spring Physics + Context-Aware) ----

  function initCursor() {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const hasCoarsePointer = window.matchMedia('(pointer: coarse)').matches;
    if (reducedMotion || hasCoarsePointer) return;

    const cursor = document.querySelector('.cursor');
    const follower = document.querySelector('.cursor-follower');
    const cursorLabel = document.querySelector('.cursor-label');
    if (!cursor || !follower) return;

    let mouseX = window.innerWidth / 2;
    let mouseY = window.innerHeight / 2;
    let followerX = mouseX, followerY = mouseY;
    let currentMode = '';

    // Start hidden, reveal on first real mousemove
    cursor.style.left = mouseX + 'px';
    cursor.style.top  = mouseY + 'px';
    follower.style.left = mouseX + 'px';
    follower.style.top  = mouseY + 'px';
    cursor.style.opacity = '0';
    follower.style.opacity = '0';

    document.addEventListener('mousemove', function (e) {
      mouseX = e.clientX;
      mouseY = e.clientY;
      cursor.style.left = mouseX + 'px';
      cursor.style.top  = mouseY + 'px';
      cursor.style.opacity = '1';
      follower.style.opacity = '1';
    }, { passive: true });

    // Smooth spring-physics follower
    (function animateFollower() {
      followerX += (mouseX - followerX) * 0.13;
      followerY += (mouseY - followerY) * 0.13;
      follower.style.left = followerX + 'px';
      follower.style.top  = followerY + 'px';
      requestAnimationFrame(animateFollower);
    })();

    // Set mode only when it changes — prevents redundant class churn
    function setMode(mode, label) {
      if (currentMode === mode) return;
      currentMode = mode;
      follower.className = 'cursor-follower' + (mode ? ' cursor-' + mode : '');
      cursor.className   = 'cursor'          + (mode ? ' cursor-' + mode : '');
      if (cursorLabel) cursorLabel.textContent = label || '';
    }

    // Event delegation — single listeners, no per-element binding
    document.addEventListener('mouseover', function (e) {
      const t = e.target;
      if (t.closest('canvas, .hero__scene, .feature3d__canvas, .about__visual')) {
        setMode('mode-3d', 'DRAG ⟲');
      } else if (t.closest('.project-card')) {
        setMode('mode-project', 'EXPLORE ↗');
      } else if (t.closest('.project-demo-btn, a[href*="github.com"], a[href*="instagram.com"], .profile-chip')) {
        setMode('mode-demo', 'OPEN ↗');
      } else if (t.closest('a, button, .btn, .nav__hamburger, input, textarea, select, .tech-tag, .about__profile-card, .review-card, .floating-quick-action, [role="button"], [tabindex="0"]')) {
        setMode('hover', '');
      }
    });

    document.addEventListener('mouseout', function (e) {
      const rel = e.relatedTarget;
      const stillOver = rel && rel.closest(
        'a, button, .btn, .project-card, canvas, .hero__scene, .feature3d__canvas, .tech-tag, .about__profile-card, .review-card, input, textarea, select, .profile-chip, [role="button"], [tabindex="0"]'
      );
      if (!stillOver) setMode('', '');
    });

    document.addEventListener('mousedown', function () {
      cursor.classList.add('cursor-active');
      follower.classList.add('cursor-active');
    });
    document.addEventListener('mouseup', function () {
      cursor.classList.remove('cursor-active');
      follower.classList.remove('cursor-active');
    });

    document.addEventListener('mouseleave', function () {
      cursor.style.opacity = '0';
      follower.style.opacity = '0';
    });
    document.addEventListener('mouseenter', function () {
      cursor.style.opacity = '1';
      follower.style.opacity = '1';
    });
  }

    // ---- Hero Entrance ----

  function initHeroEntrance() {
    const hero = document.querySelector('.hero');
    if (!hero) return;

    // Slight delay to ensure DOM is painted
    requestAnimationFrame(function () {
      setTimeout(function () {
        hero.classList.add('hero--loaded');
      }, 100);
    });
  }

  // ---- Button Magnetic Effect (subtle) ----

  function initMagneticButtons() {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const hasCoarsePointer = window.matchMedia('(pointer: coarse)').matches;
    if (reducedMotion || hasCoarsePointer) return;

    const buttons = document.querySelectorAll('.btn-primary, .nav__start-btn');

    buttons.forEach(function (btn) {
      btn.addEventListener('mousemove', function (e) {
        const rect = btn.getBoundingClientRect();
        const x = e.clientX - rect.left - rect.width / 2;
        const y = e.clientY - rect.top - rect.height / 2;
        btn.style.transform = 'translate(' + (x * 0.12) + 'px, ' + (y * 0.12 - 2) + 'px)';
      });

      btn.addEventListener('mouseleave', function () {
        btn.style.transform = '';
      });
    });
  }

  // ---- Counter Animation (for stats if added) ----

  function animateValue(el, from, to, duration) {
    const start = performance.now();
    requestAnimationFrame(function tick(time) {
      const elapsed = time - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      el.textContent = Math.round(from + (to - from) * eased);
      if (progress < 1) requestAnimationFrame(tick);
    });
  }

  function refreshReveals() {
    if (!observer) {
      initScrollReveal();
      return;
    }
    document.querySelectorAll(
      '.reveal:not(.revealed), .reveal-left:not(.revealed), .reveal-right:not(.revealed), .reveal-scale:not(.revealed), .process-step:not(.revealed), .stagger-children:not(.revealed)'
    ).forEach(function (el) {
      observer.observe(el);
    });
  }

  // ---- Init All ----

  function init() {
    initHeroEntrance();
    initScrollReveal();
    initScrollProgress();
    initCursor();
    initMagneticButtons();
  }

  return {
    init: init,
    initScrollReveal: initScrollReveal,
    refreshReveals: refreshReveals,
    animateValue: animateValue
  };

})();
