/* ==========================================================================
   VisionX Web Technology — Enhanced Animations & Smooth Scroll Engine
   Ultra-High Performance, Zero-Reflow Metrics Caching, Lenis Momentum
   ========================================================================== */

'use strict';

const VisionXAnimations = (function () {

  let lenisInstance = null;
  let observer = null;
  let scrollTicking = false;

  // Cached DOM elements & metrics to prevent layout thrashing (forced reflows)
  let navEl = null;
  let progressBarEl = null;
  let heroContentEl = null;
  let isNavScrolled = false;
  let cachedNavHeight = 70;
  let cachedSections = [];
  let currentActiveSectionId = '';

  const SPY_SECTIONS = ['work', 'services', 'about', 'reviews', 'contact'];

  function _cacheMetrics() {
    navEl = document.querySelector('.nav');
    progressBarEl = document.querySelector('.scroll-progress');
    heroContentEl = document.querySelector('.hero__content');
    cachedNavHeight = navEl ? navEl.offsetHeight : 70;

    cachedSections = SPY_SECTIONS.map(function (id) {
      const el = document.getElementById(id);
      return el ? { id: id, top: el.offsetTop, height: el.offsetHeight } : null;
    }).filter(Boolean);
  }

  // ---- Lenis Smooth Scroll Engine ----

  function initSmoothScroll() {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const isMobile = window.innerWidth <= 768 || window.matchMedia('(pointer: coarse)').matches;

    if (reducedMotion || isMobile) {
      _initNativeScrollListeners();
      return;
    }

    if (typeof Lenis !== 'undefined') {
      try {
        lenisInstance = new Lenis({
          duration: 0.82,
          easing: function (t) {
            return Math.min(1, 1.001 - Math.pow(2, -10 * t));
          },
          orientation: 'vertical',
          gestureOrientation: 'vertical',
          smoothWheel: true,
          wheelMultiplier: 1.0,
          touchMultiplier: 1.0,
          syncTouch: false,
          infinite: false,
          prevent: function (node) {
            if (!node) return false;
            return !!(
              (node.hasAttribute && node.hasAttribute('data-lenis-prevent')) ||
              (node.closest && (
                node.closest('.portal-modal') ||
                node.closest('#portal-modal') ||
                node.closest('#founder-modal') ||
                node.closest('#review-modal') ||
                node.closest('.mobile-menu') ||
                node.closest('[data-lenis-prevent]')
              ))
            );
          }
        });

        function raf(time) {
          if (lenisInstance) {
            lenisInstance.raf(time);
          }
          requestAnimationFrame(raf);
        }
        requestAnimationFrame(raf);

        lenisInstance.on('scroll', function () {
          _requestScrollTick();
        });

        // Intercept anchor clicks for Lenis smooth glide
        _bindLenisAnchors();

      } catch (err) {
        console.warn('Lenis init fallback:', err);
        _initNativeScrollListeners();
      }
    } else {
      _initNativeScrollListeners();
    }
  }

  function _bindLenisAnchors() {
    document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
      anchor.addEventListener('click', function (e) {
        const targetId = this.getAttribute('href');
        if (!targetId || targetId === '#') return;
        const target = document.querySelector(targetId);
        if (target && lenisInstance) {
          e.preventDefault();
          lenisInstance.scrollTo(target, {
            offset: -cachedNavHeight + 2,
            duration: 0.82
          });
        }
      });
    });

    document.querySelectorAll('[data-scroll]').forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        const targetId = this.getAttribute('data-scroll');
        if (!targetId) return;
        const target = document.querySelector('#' + targetId);
        if (target && lenisInstance) {
          e.preventDefault();
          lenisInstance.scrollTo(target, {
            offset: -cachedNavHeight + 2,
            duration: 0.82
          });
        }
      });
    });
  }

  function _initNativeScrollListeners() {
    window.addEventListener('scroll', function () {
      _requestScrollTick();
    }, { passive: true });
  }

  function _requestScrollTick() {
    if (!scrollTicking) {
      requestAnimationFrame(function () {
        _handleScrollTick();
        scrollTicking = false;
      });
      scrollTicking = true;
    }
  }

  function _handleScrollTick() {
    const scrollTop = window.scrollY || window.pageYOffset;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const progress = docHeight > 0 ? scrollTop / docHeight : 0;

    // 1. Scroll Progress Bar (Direct GPU transform)
    if (progressBarEl) {
      progressBarEl.style.transform = 'scaleX(' + Math.min(1, Math.max(0, progress)) + ')';
    }

    // 2. Navbar Compact / Glass Effect (State guard prevents repeated DOM class churn)
    if (navEl) {
      if (scrollTop > 50) {
        if (!isNavScrolled) {
          navEl.classList.add('scrolled');
          isNavScrolled = true;
        }
      } else {
        if (isNavScrolled) {
          navEl.classList.remove('scrolled');
          isNavScrolled = false;
        }
      }
    }

    // 3. Scrollspy — Active Nav Indicator (Using cached coordinates)
    _updateScrollspy(scrollTop);

    // 4. Parallax Depth on Hero Content (Zero layout querying)
    if (heroContentEl && scrollTop < 800) {
      const yOffset = scrollTop * 0.12;
      const opacity = Math.max(0, 1 - (scrollTop / 720));
      heroContentEl.style.transform = 'translate3d(0, ' + yOffset.toFixed(1) + 'px, 0)';
      heroContentEl.style.opacity = opacity.toFixed(2);
    }
  }

  // ---- Scrollspy (Active Section Navigation with State Guard) ----

  function _updateScrollspy(scrollTop) {
    const scrollPosition = scrollTop + cachedNavHeight + 100;
    let activeSectionId = '';

    for (let i = 0; i < cachedSections.length; i++) {
      const s = cachedSections[i];
      if (scrollPosition >= s.top && scrollPosition < s.top + s.height) {
        activeSectionId = s.id;
        break;
      }
    }

    // Only touch DOM if the active section actually changes
    if (activeSectionId === currentActiveSectionId) return;
    currentActiveSectionId = activeSectionId;

    const links = document.querySelectorAll('.nav__links a, .mobile-menu__links a');
    links.forEach(function (link) {
      const href = link.getAttribute('href');
      if (activeSectionId && href === '#' + activeSectionId) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });
  }

  // ---- 3D Card Interactive Tilt ----

  function initCardTilt() {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const hasCoarsePointer = window.matchMedia('(pointer: coarse)').matches;
    if (reducedMotion || hasCoarsePointer) return;

    const cards = document.querySelectorAll('.service-card, .project-card, .review-card');

    cards.forEach(function (card) {
      card.addEventListener('mousemove', function (e) {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        const rotateX = ((y - centerY) / centerY) * -4.5;
        const rotateY = ((x - centerX) / centerX) * 4.5;

        card.style.transform = 'perspective(900px) rotateX(' + rotateX.toFixed(2) + 'deg) rotateY(' + rotateY.toFixed(2) + 'deg) translateY(-6px)';
      });

      card.addEventListener('mouseleave', function () {
        card.style.transform = '';
      });
    });
  }

  // ---- Scroll Reveal with 3D Perspective & Stagger ----

  function initScrollReveal() {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const revealSelectors = [
      '.reveal',
      '.reveal-left',
      '.reveal-right',
      '.reveal-scale',
      '.reveal-perspective',
      '.process-step',
      '.service-card',
      '.project-card',
      '.review-card',
      '.faq-item',
      '.tech-tag',
      '.stagger-children'
    ].join(', ');

    if (reducedMotion) {
      document.querySelectorAll(revealSelectors).forEach(function (el) {
        el.classList.add('revealed');
      });
      return;
    }

    const observerOptions = {
      threshold: 0.08,
      rootMargin: '0px 0px -40px 0px'
    };

    observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('revealed');
          observer.unobserve(entry.target);
        }
      });
    }, observerOptions);

    // Observe all target elements
    document.querySelectorAll(
      '.reveal, .reveal-left, .reveal-right, .reveal-scale, .reveal-perspective, .process-step, .service-card, .project-card, .review-card, .faq-item, .stagger-children'
    ).forEach(function (el) {
      if (el.classList.contains('service-card') || el.classList.contains('review-card') || el.classList.contains('faq-item')) {
        const siblingIndex = Array.from(el.parentNode.children).indexOf(el);
        el.style.transitionDelay = (siblingIndex * 0.06) + 's';
      }
      observer.observe(el);
    });

    // Tech tags container
    const techContainer = document.querySelector('.tech__tags');
    if (techContainer) {
      const tagObserver = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.querySelectorAll('.tech-tag').forEach(function (tag, idx) {
              tag.style.transitionDelay = (idx * 0.03) + 's';
              tag.classList.add('revealed');
            });
            tagObserver.unobserve(entry.target);
          }
        });
      }, { threshold: 0.08 });
      tagObserver.observe(techContainer);
    }
  }

  // ---- Hero Entrance ----

  function initHeroEntrance() {
    const hero = document.querySelector('.hero');
    if (!hero) return;

    requestAnimationFrame(function () {
      setTimeout(function () {
        hero.classList.add('hero--loaded');
      }, 100);
    });
  }

  // ---- Button Magnetic Effect ----

  function initMagneticButtons() {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const hasCoarsePointer = window.matchMedia('(pointer: coarse)').matches;
    if (reducedMotion || hasCoarsePointer) return;

    const buttons = document.querySelectorAll('.btn-primary, .nav__start-btn, .nav__portal-btn, .floating-quick-action');

    buttons.forEach(function (btn) {
      btn.addEventListener('mousemove', function (e) {
        const rect = btn.getBoundingClientRect();
        const x = e.clientX - rect.left - rect.width / 2;
        const y = e.clientY - rect.top - rect.height / 2;
        btn.style.transform = 'translate3d(' + (x * 0.14).toFixed(1) + 'px, ' + (y * 0.14 - 2).toFixed(1) + 'px, 0)';
      });

      btn.addEventListener('mouseleave', function () {
        btn.style.transform = '';
      });
    });
  }

  // ---- Counter Animation ----

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
    _cacheMetrics();
    if (!observer) {
      initScrollReveal();
      return;
    }
    document.querySelectorAll(
      '.reveal:not(.revealed), .reveal-perspective:not(.revealed), .service-card:not(.revealed), .project-card:not(.revealed), .review-card:not(.revealed)'
    ).forEach(function (el) {
      observer.observe(el);
    });
  }

  // ---- Lenis External Controls (for Modals) ----

  function stopScroll() {
    if (lenisInstance) {
      lenisInstance.stop();
    }
  }

  function startScroll() {
    if (lenisInstance) {
      lenisInstance.start();
    }
  }

  function scrollTo(target, options) {
    if (lenisInstance) {
      lenisInstance.scrollTo(target, options);
    } else {
      const el = typeof target === 'string' ? document.querySelector(target) : target;
      if (el) {
        const top = el.getBoundingClientRect().top + window.scrollY - cachedNavHeight;
        window.scrollTo({ top: top, behavior: 'smooth' });
      }
    }
  }

  // ---- Init All ----

  function init() {
    _cacheMetrics();
    initHeroEntrance();
    initSmoothScroll();
    initScrollReveal();
    initCardTilt();
    initMagneticButtons();

    // Re-cache metrics on resize
    let resizeTimer = null;
    window.addEventListener('resize', function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(_cacheMetrics, 200);
    }, { passive: true });

    // Initial tick to set nav and scroll progress
    _handleScrollTick();
  }

  return {
    init: init,
    initScrollReveal: initScrollReveal,
    refreshReveals: refreshReveals,
    animateValue: animateValue,
    stopScroll: stopScroll,
    startScroll: startScroll,
    scrollTo: scrollTo,
    getLenis: function () { return lenisInstance; }
  };

})();
