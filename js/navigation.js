/* ==========================================================================
   VisionX Web Technology — Navigation
   ========================================================================== */

'use strict';

const VisionXNav = (function () {

  let nav, hamburger, mobileMenu, mobileLinks;
  let isMenuOpen = false;
  let lastScrollY = 0;

  
  function _setupFAQAccordion() {
    const faqItems = document.querySelectorAll('.faq-item');
    if (!faqItems.length) return;

    faqItems.forEach(item => {
      const btn = item.querySelector('.faq-question');
      if (!btn) return;

      btn.addEventListener('click', () => {
        const isOpen = item.classList.contains('active');
        
        // Close other items for single accordion behavior
        faqItems.forEach(other => {
          if (other !== item) {
            other.classList.remove('active');
            const otherBtn = other.querySelector('.faq-question');
            if (otherBtn) otherBtn.setAttribute('aria-expanded', 'false');
          }
        });

        if (isOpen) {
          item.classList.remove('active');
          btn.setAttribute('aria-expanded', 'false');
        } else {
          item.classList.add('active');
          btn.setAttribute('aria-expanded', 'true');
        }
      });
    });
  }

  function init() {
    nav = document.querySelector('.nav');
    hamburger = document.querySelector('.nav__hamburger');
    mobileMenu = document.querySelector('.mobile-menu');
    mobileLinks = document.querySelectorAll('.mobile-menu__links a');

    if (!nav) return;

    _setupScrollBehavior();
    _setupHamburger();
    _setupMobileLinks();
    _setupDesktopLinks();
    _setupFAQAccordion();
  }

  function _setupScrollBehavior() {
    const onScroll = function () {
      const scrollY = window.scrollY;

      if (scrollY > 60) {
        nav.classList.add('scrolled');
      } else {
        nav.classList.remove('scrolled');
      }

      lastScrollY = scrollY;
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll(); // run on init
  }

  function _setupHamburger() {
    if (!hamburger || !mobileMenu) return;

    hamburger.addEventListener('click', function () {
      isMenuOpen ? _closeMenu() : _openMenu();
    });

    hamburger.setAttribute('aria-label', 'Toggle navigation menu');
    hamburger.setAttribute('aria-expanded', 'false');
    hamburger.setAttribute('role', 'button');
    hamburger.setAttribute('tabindex', '0');

    hamburger.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        isMenuOpen ? _closeMenu() : _openMenu();
      }
    });
  }

  function _openMenu() {
    isMenuOpen = true;
    hamburger.classList.add('active');
    hamburger.setAttribute('aria-expanded', 'true');
    mobileMenu.classList.add('open');
    document.body.classList.add('menu-open');

    // Focus first link
    const firstLink = mobileMenu.querySelector('a');
    if (firstLink) setTimeout(function () { firstLink.focus(); }, 300);
  }

  function _closeMenu() {
    isMenuOpen = false;
    hamburger.classList.remove('active');
    hamburger.setAttribute('aria-expanded', 'false');
    mobileMenu.classList.remove('open');
    document.body.classList.remove('menu-open');
    hamburger.focus();
  }

  function _setupMobileLinks() {
    if (!mobileLinks) return;
    mobileLinks.forEach(function (link) {
      link.addEventListener('click', function () {
        _closeMenu();
      });
    });
  }

  function _setupDesktopLinks() {
    // Smooth scroll for all anchor links
    document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
      anchor.addEventListener('click', function (e) {
        const targetId = this.getAttribute('href');
        if (targetId === '#') return;
        const target = document.querySelector(targetId);
        if (target) {
          e.preventDefault();
          const navHeight = nav ? nav.offsetHeight : 0;
          const top = target.getBoundingClientRect().top + window.scrollY - navHeight;
          window.scrollTo({ top: top, behavior: 'smooth' });
        }
      });
    });
  }

  // Trap focus in mobile menu
  function _trapFocus(e) {
    if (!isMenuOpen) return;
    const focusable = mobileMenu.querySelectorAll('a, button, input, [tabindex]:not([tabindex="-1"])');
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (e.key === 'Tab') {
      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }
    if (e.key === 'Escape') {
      _closeMenu();
    }
  }

  document.addEventListener('keydown', _trapFocus);

  return {
    init: init
  };

})();