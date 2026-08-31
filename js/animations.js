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

      // ---- VisionX Spatial Tech Cursor System (Context-Aware & Physics) ----

  function initCursor() {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const hasCoarsePointer = window.matchMedia('(pointer: coarse)').matches;
    if (reducedMotion || hasCoarsePointer) return;

    const cursor = document.querySelector('.cursor');
    const follower = document.querySelector('.cursor-follower');
    const cursorLabel = document.querySelector('.cursor-label');
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
      const dx = mouseX - followerX;
      const dy = mouseY - followerY;
      followerX += dx * 0.15;
      followerY += dy * 0.15;

      follower.style.left = followerX + 'px';
      follower.style.top = followerY + 'px';

      rafId = requestAnimationFrame(animateFollower);
    }
    animateFollower();

    // Context-Aware Interactive Cursor Delegation
    document.addEventListener('mouseover', function (e) {
      const target = e.target;
      
      // 1. 3D WebGL Canvas Scene Hover -> DRAG label
      const sceneEl = target.closest('.hero__scene, .feature3d__canvas, #hero-canvas, #feature-canvas, .about__visual');
      if (sceneEl) {
        follower.className = 'cursor-follower cursor-mode-3d';
        cursor.className = 'cursor cursor-mode-3d';
        if (cursorLabel) cursorLabel.textContent = 'DRAG ⟲';
        return;
      }

      // 2. Project Portfolio Card Hover -> EXPLORE label
      const projectCard = target.closest('.project-card');
      if (projectCard) {
        follower.className = 'cursor-follower cursor-mode-project';
        cursor.className = 'cursor cursor-mode-project';
        if (cursorLabel) cursorLabel.textContent = 'EXPLORE ↗';
        return;
      }

      // 3. Direct Live Demo & Action Buttons -> OPEN label
      const demoBtn = target.closest('.project-demo-btn, a[href*="github.com"], a[href*="instagram.com"], .profile-chip');
      if (demoBtn) {
        follower.className = 'cursor-follower cursor-mode-demo';
        cursor.className = 'cursor cursor-mode-demo';
        if (cursorLabel) cursorLabel.textContent = 'OPEN ↗';
        return;
      }

      // 4. Standard Interactive Elements -> Fluid Magnetic Expansion
      const interactive = target.closest('a, button, .btn, .nav__hamburger, input, textarea, select, .tech-tag, .about__profile-card, .review-card, .floating-quick-action, .portal-trigger-btn, .portal-tab-btn, [role="button"], [tabindex="0"]');
      if (interactive) {
        follower.className = 'cursor-follower cursor-hover';
        cursor.className = 'cursor cursor-hover';
        if (cursorLabel) cursorLabel.textContent = '';
        return;
      }
    });

    document.addEventListener('mouseout', function (e) {
      const related = e.relatedTarget;
      if (!related || !related.closest('a, button, .btn, .project-card, .hero__scene, .feature3d__canvas, .tech-tag, .about__profile-card, .review-card, input, textarea, select, .profile-chip')) {
        follower.className = 'cursor-follower';
        cursor.className = 'cursor';
        if (cursorLabel) cursorLabel.textContent = '';
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
