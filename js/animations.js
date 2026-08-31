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

    // ---- Custom Cursor (Fluid Spring Physics & Delegation) ----

  function initCursor() {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const hasCoarsePointer = window.matchMedia('(pointer: coarse)').matches;
    if (reducedMotion || hasCoarsePointer) return;

    const cursor = document.querySelector('.cursor');
    const follower = document.querySelector('.cursor-follower');
    if (!cursor || !follower) return;

    let mouseX = window.innerWidth / 2, mouseY = window.innerHeight / 2;
    let followerX = mouseX, followerY = mouseY;
    let rafId = null;

    cursor.style.left = mouseX + 'px';
    cursor.style.top = mouseY + 'px';
    follower.style.left = mouseX + 'px';
    follower.style.top = mouseY + 'px';

    document.addEventListener('mousemove', function (e) {
      mouseX = e.clientX;
      mouseY = e.clientY;
      cursor.style.left = mouseX + 'px';
      cursor.style.top = mouseY + 'px';
    });

    function animateFollower() {
      followerX += (mouseX - followerX) * 0.15;
      followerY += (mouseY - followerY) * 0.15;
      follower.style.left = followerX + 'px';
      follower.style.top = followerY + 'px';
      rafId = requestAnimationFrame(animateFollower);
    }
    animateFollower();

    // Event delegation for interactive elements (works on all dynamic DOM elements)
    const interactiveSelectors = 'a, button, .btn, .service-card, .project-card, .nav__hamburger, input, textarea, select, .tech-tag, .about__profile-card, .profile-chip, .review-card, .floating-quick-action, .portal-trigger-btn, .portal-tab-btn, [tabindex="0"], [role="button"]';

    document.addEventListener('mouseover', function (e) {
      if (e.target.closest(interactiveSelectors)) {
        cursor.classList.add('cursor-hover');
        follower.classList.add('cursor-hover');
      }
    });

    document.addEventListener('mouseout', function (e) {
      if (e.target.closest(interactiveSelectors)) {
        cursor.classList.remove('cursor-hover');
        follower.classList.remove('cursor-hover');
      }
    });

    document.addEventListener('mousedown', function () {
      cursor.classList.add('cursor-active');
      follower.classList.add('cursor-active');
    });

    document.addEventListener('mouseup', function () {
      cursor.classList.remove('cursor-active');
      follower.classList.remove('cursor-active');
    });

    // Hide/show cursor on window boundary
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
