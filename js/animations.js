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

  // ---- Custom Cursor (Luminous Quantum Beacon & Frosted Glass Ring) ----

  function initCursor() {
    // Only disable on pure touch devices without hover capabilities
    const isPureTouch = window.matchMedia('(hover: none) and (pointer: coarse)').matches;
    if (isPureTouch) return;

    const cursor = document.querySelector('.cursor');
    const follower = document.querySelector('.cursor-follower');
    if (!cursor || !follower) return;

    let mouseX = window.innerWidth / 2;
    let mouseY = window.innerHeight / 2;
    let followerX = mouseX;
    let followerY = mouseY;
    let hasMoved = false;

    // Make elements visible and positioned
    cursor.style.opacity = '1';
    follower.style.opacity = '1';
    cursor.style.left = mouseX + 'px';
    cursor.style.top = mouseY + 'px';
    follower.style.left = mouseX + 'px';
    follower.style.top = mouseY + 'px';

    function updatePosition(e) {
      mouseX = e.clientX;
      mouseY = e.clientY;
      cursor.style.left = mouseX + 'px';
      cursor.style.top = mouseY + 'px';
      cursor.style.opacity = '1';
      follower.style.opacity = '1';

      if (!hasMoved) {
        hasMoved = true;
        followerX = mouseX;
        followerY = mouseY;
      }
    }

    window.addEventListener('mousemove', updatePosition, { passive: true });
    window.addEventListener('pointermove', updatePosition, { passive: true });

    function animateFollower() {
      const dx = mouseX - followerX;
      const dy = mouseY - followerY;
      followerX += dx * 0.15;
      followerY += dy * 0.15;

      follower.style.left = followerX + 'px';
      follower.style.top = followerY + 'px';

      requestAnimationFrame(animateFollower);
    }
    requestAnimationFrame(animateFollower);

    // Event delegation for smooth hover states
    document.addEventListener('mouseover', function (e) {
      const target = e.target;
      if (!target) return;

      const interactive = target.closest('a, button, .btn, .service-card, .project-card, .nav__hamburger, input, textarea, select, .tech-tag, .about__profile-card, .review-card, .floating-quick-action, .portal-trigger-btn, .portal-tab-btn, [role="button"], [tabindex="0"]');
      if (interactive) {
        cursor.classList.add('cursor-hover');
        follower.classList.add('cursor-hover');
      }
    }, { passive: true });

    document.addEventListener('mouseout', function (e) {
      const related = e.relatedTarget;
      if (!related || !related.closest('a, button, .btn, .service-card, .project-card, .nav__hamburger, input, textarea, select, .tech-tag, .about__profile-card, .review-card, .floating-quick-action, .portal-trigger-btn, .portal-tab-btn, [role="button"], [tabindex="0"]')) {
        cursor.classList.remove('cursor-hover');
        follower.classList.remove('cursor-hover');
      }
    }, { passive: true });

    document.addEventListener('mousedown', function () {
      cursor.classList.add('cursor-active');
      follower.classList.add('cursor-active');
    }, { passive: true });

    document.addEventListener('mouseup', function () {
      cursor.classList.remove('cursor-active');
      follower.classList.remove('cursor-active');
    }, { passive: true });

    document.addEventListener('mouseleave', function () {
      cursor.style.opacity = '0';
      follower.style.opacity = '0';
    }, { passive: true });

    document.addEventListener('mouseenter', function () {
      cursor.style.opacity = '1';
      follower.style.opacity = '1';
    }, { passive: true });
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
