/* ==========================================================================
   VisionX Web Technology — Executive Portal & Real-Time Project CMS
   Leadership: Deepak Kumar (CEO & Founder) & Balaji (Founder)
   ========================================================================== */

'use strict';

const VisionXPortal = (function () {

  // ---- Audio Synthesizer (Native Web Audio API — No External Files) ----
  let audioCtx = null;
  let soundEnabled = true;

  function initAudio() {
    if (!audioCtx && (window.AudioContext || window.webkitAudioContext)) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      audioCtx = new AudioContextClass();
    }
  }

  function playTone(freq, type, duration, vol = 0.05) {
    if (!soundEnabled) return;
    try {
      initAudio();
      if (!audioCtx) return;
      if (audioCtx.state === 'suspended') {
        audioCtx.resume();
      }

      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, audioCtx.currentTime);

      gain.gain.setValueAtTime(vol, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + duration);

      osc.connect(gain);
      gain.connect(audioCtx.destination);

      osc.start();
      osc.stop(audioCtx.currentTime + duration);
    } catch (e) {
      // Audio autoplay policy or unsupported
    }
  }

  function playSound(action) {
    switch (action) {
      case 'click':
        playTone(620, 'sine', 0.08, 0.04);
        break;
      case 'theme':
        playTone(440, 'triangle', 0.15, 0.05);
        setTimeout(() => playTone(880, 'sine', 0.25, 0.04), 80);
        break;
      case 'login':
        playTone(523.25, 'sine', 0.12, 0.06); // C5
        setTimeout(() => playTone(659.25, 'sine', 0.14, 0.06), 100); // E5
        setTimeout(() => playTone(783.99, 'sine', 0.16, 0.06), 200); // G5
        setTimeout(() => playTone(1046.50, 'sine', 0.35, 0.08), 300); // C6
        break;
      case 'publish':
        playTone(587.33, 'sine', 0.1, 0.06); // D5
        setTimeout(() => playTone(739.99, 'sine', 0.12, 0.06), 90); // F#5
        setTimeout(() => playTone(880.00, 'sine', 0.14, 0.06), 180); // A5
        setTimeout(() => playTone(1174.66, 'sine', 0.3, 0.08), 270); // D6
        break;
      case 'delete':
        playTone(400, 'sawtooth', 0.12, 0.04);
        setTimeout(() => playTone(250, 'sawtooth', 0.2, 0.04), 80);
        break;
      case 'logout':
        playTone(600, 'sine', 0.1, 0.04);
        setTimeout(() => playTone(350, 'triangle', 0.2, 0.04), 100);
        break;
      case 'open':
        playTone(320, 'sine', 0.15, 0.04);
        setTimeout(() => playTone(540, 'sine', 0.2, 0.04), 70);
        break;
    }
  }

    // ---- Default Portfolio Projects ----
  const DEFAULT_PROJECTS = [
    {
      id: 'proj-1',
      title: 'NOVA',
      category: 'Creative Technology / Web Experience',
      layout: 'large',
      theme: 'cosmic',
      image: '',
      link: 'https://visionxwebtechnology.com/nova-demo'
    },
    {
      id: 'proj-2',
      title: 'ARC',
      category: 'Business / Web Platform',
      layout: 'normal',
      theme: 'sapphire',
      image: '',
      link: 'https://visionxwebtechnology.com/arc-demo'
    },
    {
      id: 'proj-3',
      title: 'LUMEN',
      category: '3D / Interactive Experience',
      layout: 'normal',
      theme: 'midnight',
      image: '',
      link: 'https://visionxwebtechnology.com/lumen-3d'
    },
    {
      id: 'proj-4',
      title: 'NEXUS',
      category: 'SaaS / Product Design',
      layout: 'normal',
      theme: 'crimson',
      image: '',
      link: 'https://visionxwebtechnology.com/nexus-saas'
    }
  ];

  // ---- State Management ----
  const STATE = {
    theme: 'dark',
    isLoggedIn: localStorage.getItem('visionx_auth') === 'true',
    user: JSON.parse(localStorage.getItem('visionx_user') || '{"name":"Deepak Kumar","id":"VX-CEO-01","role":"CEO & Founder","avatar":"assets/images/deepak-kumar.jpg"}'),
    projects: JSON.parse(localStorage.getItem('visionx_projects') || JSON.stringify(DEFAULT_PROJECTS)),
    particleSpeed: 1.0
  };

  // ---- Elements ----
  let portalModal, portalOverlay, closeBtn, openBtns, quickThemeBtns;
  let loginForm, logoutBtn;
  let tabButtons, tabPanes;
  let themeCards;
  let hudElement;
  let passDeepakBtn, passBalajiBtn;
  let cmsProjectForm, cmsProjectList, cmsResetBtn, cmsCancelBtn, cmsSaveBtn;
  let cmsActiveUserLabel, cmsProjectCountLabel;

  function init() {
    portalModal = document.getElementById('portal-modal');
    portalOverlay = document.getElementById('portal-overlay');
    closeBtn = document.getElementById('portal-close-btn');
    openBtns = document.querySelectorAll('.js-open-portal');
    quickThemeBtns = document.querySelectorAll('.js-theme-toggle');
    loginForm = document.getElementById('portal-login-form');
    logoutBtn = document.getElementById('hud-logout-btn');
    tabButtons = document.querySelectorAll('.portal-tab-btn');
    tabPanes = document.querySelectorAll('.portal-tab-pane');
    themeCards = document.querySelectorAll('.theme-card');
    hudElement = document.getElementById('visionx-hud');

    passDeepakBtn = document.getElementById('pass-deepak-btn');
    passBalajiBtn = document.getElementById('pass-balaji-btn');
    
    cmsProjectForm = document.getElementById('cms-project-form');
    cmsProjectList = document.getElementById('cms-project-list');
    cmsResetBtn = document.getElementById('cms-reset-btn');
    cmsCancelBtn = document.getElementById('cms-cancel-btn');
    cmsSaveBtn = document.getElementById('cms-save-btn');
    cmsActiveUserLabel = document.getElementById('cms-active-user');
    cmsProjectCountLabel = document.getElementById('cms-project-count');

    // Apply saved theme immediately
    setTheme(STATE.theme, false);

    // Setup Event Listeners
    _setupModalEvents();
    _setupTabEvents();
    _setupThemeEvents();
    _setupAuthEvents();
    _setupCMSEvents();
    _setupBadgeHover();

    // Render Dynamic Live Portfolio & CMS List
    renderPortfolioGrid();
    initReviews();
    setupFounderModalEvents();
    renderCMSList();

    // Render Auth status
    _updateAuthUI();
  }

  // ---- Theme Engine ----
    function setTheme(themeName = 'dark', triggerSound = false) {
    STATE.theme = 'dark';
    document.documentElement.setAttribute('data-theme', 'dark');
    localStorage.setItem('visionx_theme', 'dark');

    if (typeof VisionXThree !== 'undefined' && typeof VisionXThree.updateTheme === 'function') {
      VisionXThree.updateTheme('dark');
    }
  }

  function cycleTheme() {
    setTheme('dark', false);
  }

  // =========================================================================
  // Real-Time Portfolio Grid Renderer
  // =========================================================================

  const THEME_GRADIENTS = {
    cosmic: 'radial-gradient(circle at 30% 40%, #1e293b 0%, #0f172a 60%)',
    sapphire: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0284c7 100%)',
    midnight: 'radial-gradient(ellipse at 70% 30%, #064e3b 0%, #030712 70%)',
    crimson: 'linear-gradient(160deg, #3b0764 0%, #0284c7 100%)',
    platinum: 'linear-gradient(135deg, #334155 0%, #64748b 100%)'
  };

        function renderPortfolioGrid() {
    const grid = document.getElementById('portfolio-grid');
    if (!grid) return;

    grid.innerHTML = '';

    STATE.projects.forEach((proj, index) => {
      const padNum = String(index + 1).padStart(2, '0');
      const isLarge = proj.layout === 'large';
      const bgStyle = THEME_GRADIENTS[proj.theme] || THEME_GRADIENTS.cosmic;
      const demoUrl = (proj.link && proj.link.trim().length > 0) ? proj.link.trim() : '#';

      const card = document.createElement('article');
      card.className = `project-card ${isLarge ? 'project-card--large' : ''} revealed`;
      card.setAttribute('aria-label', `Project: ${proj.title}`);
      card.setAttribute('tabindex', '0');

      let visualContent = '';
      if (proj.image && proj.image.trim().length > 0) {
        visualContent = `
          <div class="project-card__visual">
            <div class="project-card__visual-inner">
              <img src="${proj.image}" alt="${proj.title}" class="project-card__img" />
            </div>
          </div>
        `;
      } else {
        visualContent = `
          <div class="project-card__visual">
            <div class="project-card__visual-inner" style="background: ${bgStyle};">
              <div class="project-card__grid-overlay"></div>
              <div class="project-card__watermark-wrap">
                <span class="project-card__watermark">${proj.title}</span>
                <span class="project-card__watermark-sub">${proj.category.split('/')[0].trim()}</span>
              </div>
            </div>
          </div>
        `;
      }

      card.innerHTML = `
        ${visualContent}
        <div class="project-card__info">
          <div class="project-card__meta">
            <p class="project-card__num">PROJECT ${padNum}</p>
            <h3 class="project-card__title">${proj.title}</h3>
            <p class="project-card__category">${proj.category}</p>
          </div>
          <div class="project-card__actions">
            <a href="${demoUrl}" target="_blank" rel="noopener noreferrer" class="project-demo-btn" aria-label="Open Live Demo for ${proj.title}">
              <span>Live Demo</span> <span class="demo-arrow">&nearr;</span>
            </a>
          </div>
        </div>
      `;

      // Live Demo Button click handler
      const demoBtn = card.querySelector('.project-demo-btn');
      if (demoBtn) {
        demoBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          playSound('click');
          if (demoUrl && demoUrl !== '#') {
            window.open(demoUrl, '_blank', 'noopener,noreferrer');
          } else {
            alert(`Live demo link for ${proj.title} is not configured yet. You can set it via the Executive CMS.`);
          }
        });
      }

      card.addEventListener('click', (e) => {
        if (e.target.closest('.project-demo-btn')) return;
        playSound('click');
        if (STATE.isLoggedIn) {
          openPortal('cms');
          _editProject(proj.id);
        } else if (demoUrl && demoUrl !== '#') {
          window.open(demoUrl, '_blank', 'noopener,noreferrer');
        }
      });

      grid.appendChild(card);
    });

    if (typeof VisionXAnimations !== 'undefined' && typeof VisionXAnimations.refreshReveals === 'function') {
      VisionXAnimations.refreshReveals();
    }
  }

  
  // =========================================================================
  // Founder Profile Details Modal System
  // =========================================================================

  const FOUNDERS_DATA = {
    deepak: {
      name: 'Deepak Kumar',
      status: 'CEO & Founder',
      spec: 'Web Development',
      company: 'VisionX Web Technology',
      image: 'assets/images/deepak-kumar.jpg',
      bio: 'Leading overall technical strategy, spatial computing concepts, and interactive WebGL experiences. Specializes in modern JavaScript, Three.js 3D shaders, and high-performance full-stack web applications.',
      insta: 'https://www.instagram.com/deepak_h4x_?igsi=MWVmbGRyZGVvMWoxYg==',
      git: 'https://github.com/AGzDeepak',
      email: 'https://mail.google.com/mail/?view=cm&fs=1&to=deepakyuoyt@gmail.com&su=Inquiry%20for%20Deepak%20Kumar%20(CEO%20%26%20Founder)%20-%20VisionX&body=Hello%20Deepak,%0A%0AI%20would%20like%20to%20discuss%20a%20web%20technology%20project%20with%20VisionX.%0A%0ALooking%20forward%20to%20connecting.'
    },
    balaji: {
      name: 'Balaji',
      status: 'Founder',
      spec: 'Frontend Developer',
      company: 'VisionX Web Technology',
      image: 'assets/images/balaji.jpg',
      bio: 'Crafting responsive, pixel-perfect user interfaces, fluid scroll interactions, and high-speed frontend architectures. Dedicated to seamless user experience across all devices.',
      insta: 'https://www.instagram.com/bala_zx_?igsi=MTZnZXJudWtreWxieA==',
      git: 'https://github.com/balajibalaji72863-cyber',
      email: 'https://mail.google.com/mail/?view=cm&fs=1&to=balajibalaji72863@gmail.com&su=Inquiry%20for%20Balaji%20(Founder%20%26%20Frontend)%20-%20VisionX&body=Hello%20Balaji,%0A%0AI%20would%20like%20to%20discuss%20frontend%20development%20and%20web%20experiences%20with%20VisionX.%0A%0ALooking%20forward%20to%20connecting.'
    },
    sanjay: {
      name: 'Sanjay',
      status: 'Founder',
      spec: 'UI / UX Designer',
      company: 'VisionX Web Technology',
      image: 'assets/images/sanjay.png',
      bio: 'Designing modern Apple-inspired digital interfaces, user flows, and aesthetic hierarchies. Focused on elevating client products through thoughtful layout and motion design.',
      insta: 'https://www.instagram.com/_.sanjuzz_x___?igsi=dnF1aG1nMmZoMmdl',
      git: 'https://github.com/sanjayv152006-cmyk',
      email: 'https://mail.google.com/mail/?view=cm&fs=1&to=sanjaysanju152006@gmail.com&su=Inquiry%20for%20Sanjay%20(Founder%20%26%20UI%2FUX)%20-%20VisionX&body=Hello%20Sanjay,%0A%0AI%20would%20like%20to%20discuss%20UI/UX%20design%20and%20creative%20direction%20with%20VisionX.%0A%0ALooking%20forward%20to%20connecting.'
    },
    inbaraj: {
      name: 'Inbaraj',
      status: 'Founder',
      spec: 'Database, Full Stack Development',
      company: 'VisionX Web Technology',
      image: 'assets/images/inbaraj.jpg',
      bio: 'Engineering scalable database architectures, resilient backend endpoints, and enterprise-grade cloud integrations. Ensures security, speed, and 99.9% uptime for digital platforms.',
      insta: 'https://www.instagram.com/itz_inba_007/',
      git: 'https://github.com/enbarajenba21-Tech',
      email: 'https://mail.google.com/mail/?view=cm&fs=1&to=enbarjenba21@gmail.com&su=Inquiry%20for%20Inbaraj%20(Founder%20%26%20Full%20Stack)%20-%20VisionX&body=Hello%20Inbaraj,%0A%0AI%20would%20like%20to%20discuss%20database%20architecture%20and%20full%20stack%20development%20with%20VisionX.%0A%0ALooking%20forward%20to%20connecting.'
    },
    sivanesan: {
      name: 'Sivanesan',
      status: 'Founder',
      spec: 'UI / UX Designer',
      company: 'VisionX Web Technology',
      image: 'assets/images/sivanesan.png',
      bio: 'Specializing in UI/UX wireframing, component libraries, and spatial product prototyping. Passionate about creating interfaces that feel natural and delightful from the very first touch.',
      insta: 'https://www.instagram.com/_x_o__mad__?igsi=dnp5a2RseDNnb2tu',
      git: 'https://github.com/AGzDeepak',
      email: 'https://mail.google.com/mail/?view=cm&fs=1&to=sivanesan010307@gmail.com&su=Inquiry%20for%20Sivanesan%20(Founder%20%26%20UI%2FUX)%20-%20VisionX&body=Hello%20Sivanesan,%0A%0AI%20would%20like%20to%20discuss%20UI/UX%20design%20and%20interface%20development%20with%20VisionX.%0A%0ALooking%20forward%20to%20connecting.'
    },
    boopathi: {
      name: 'Boopathi',
      status: 'Founder',
      spec: 'Graphic, UI / UX Designer',
      company: 'VisionX Web Technology',
      image: 'assets/images/boopathi.jpg',
      bio: 'Creating distinctive visual branding, graphic storytelling, typography assets, and creative UI compositions. Transforms complex concepts into striking visual identities.',
      insta: 'https://www.instagram.com/b_o_o_p_a_t_h_i______?igsi=MWZwYmpmaGRwandjNA==',
      git: 'https://github.com/AGzDeepak',
      email: 'https://mail.google.com/mail/?view=cm&fs=1&to=boopathi3332@gmail.com&su=Inquiry%20for%20Boopathi%20(Founder%20%26%20Graphic%20UI%2FUX)%20-%20VisionX&body=Hello%20Boopathi,%0A%0AI%20would%20like%20to%20discuss%20graphic%20design%20and%20UI/UX%20branding%20with%20VisionX.%0A%0ALooking%20forward%20to%20connecting.'
    }
  };

  function setupFounderModalEvents() {
    const modal = document.getElementById('founder-modal');
    const backdrop = document.getElementById('founder-modal-backdrop');
    const closeBtn = document.getElementById('founder-modal-close-btn');

    const modalImg = document.getElementById('modal-founder-img');
    const modalStatus = document.getElementById('modal-founder-status');
    const modalName = document.getElementById('modal-founder-name');
    const modalSpec = document.getElementById('modal-founder-spec');
    const modalBio = document.getElementById('modal-founder-bio');
    const modalInsta = document.getElementById('modal-founder-insta');
    const modalGit = document.getElementById('modal-founder-git');
    const modalEmail = document.getElementById('modal-founder-email');

    if (!modal) return;

    function openFounderDetails(key) {
      const data = FOUNDERS_DATA[key];
      if (!data) return;

      if (modalImg) {
        modalImg.src = data.image;
        modalImg.alt = data.name;
      }
      if (modalStatus) modalStatus.textContent = data.status;
      if (modalName) modalName.textContent = data.name;
      if (modalSpec) modalSpec.textContent = data.spec;
      if (modalBio) modalBio.textContent = data.bio;

      if (modalInsta) modalInsta.href = data.insta;
      if (modalGit) modalGit.href = data.git;
      if (modalEmail) modalEmail.href = data.email;

      modal.classList.add('active');
      modal.setAttribute('aria-hidden', 'false');
      document.body.classList.add('menu-open');
      playSound('open');
    }

    function closeFounderDetails() {
      modal.classList.remove('active');
      modal.setAttribute('aria-hidden', 'true');
      document.body.classList.remove('menu-open');
    }

    if (closeBtn) closeBtn.addEventListener('click', closeFounderDetails);
    if (backdrop) backdrop.addEventListener('click', closeFounderDetails);

    // Attach click listeners to all founder cards
    document.querySelectorAll('.js-founder-card').forEach(card => {
      card.style.cursor = 'pointer';
      card.addEventListener('click', (e) => {
        // If user clicks a direct chip link, let that link follow
        if (e.target.closest('.profile-chip')) return;
        const key = card.dataset.founder;
        if (key) {
          openFounderDetails(key);
        }
      });

      card.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          if (e.target.closest('.profile-chip')) return;
          e.preventDefault();
          const key = card.dataset.founder;
          if (key) openFounderDetails(key);
        }
      });
    });
  }


  // =========================================================================
  // Client Reviews System (Interactive & Persistent)
  // =========================================================================

  const DEFAULT_REVIEWS = [
    {
      id: 'rev-1',
      name: 'Alexander Vance',
      role: 'Founder & CEO, Nova Capital',
      rating: 5,
      date: 'Aug 2026',
      text: 'VisionX built our product platform with absolute technical excellence. Deepak and Balaji handled the architecture and frontend flawlessly, delivering silky-smooth 3D interactions that boosted our conversions.'
    },
    {
      id: 'rev-2',
      name: 'Elena Rostova',
      role: 'Creative Director, Studio Aether',
      rating: 5,
      date: 'Aug 2026',
      text: 'The UI/UX crafted by Sanjay and Sivanesan combined with Inbaraj’s full-stack and database engineering made the collaboration completely seamless. High-end Apple-level design quality.'
    },
    {
      id: 'rev-3',
      name: 'Marcus Chen',
      role: 'VP of Product, Nexus Global',
      rating: 5,
      date: 'Jul 2026',
      text: 'Boopathi and the design team delivered stunning visual assets and graphic precision. The site feels alive with Three.js WebGL and loads at blistering 60 FPS speeds.'
    },
    {
      id: 'rev-4',
      name: 'David Reynolds',
      role: 'Co-Founder, Prism AI Labs',
      rating: 5,
      date: 'Jul 2026',
      text: 'Working directly with the six founders gave our team immense confidence. Rapid turnaround, clear milestones, and zero friction. Truly a world-class technology partner.'
    }
  ];

  let clientReviews = [];

  function initReviews() {
    try {
      const saved = localStorage.getItem('visionx_client_reviews');
      if (saved) {
        clientReviews = JSON.parse(saved);
      } else {
        clientReviews = [...DEFAULT_REVIEWS];
        localStorage.setItem('visionx_client_reviews', JSON.stringify(clientReviews));
      }
    } catch (e) {
      clientReviews = [...DEFAULT_REVIEWS];
    }

    renderReviewsGrid();
    setupReviewModalEvents();
  }

  function renderReviewsGrid() {
    const grid = document.getElementById('reviews-grid');
    const countLabel = document.getElementById('reviews-count-label');
    if (!grid) return;

    if (countLabel) {
      countLabel.textContent = clientReviews.length;
    }

    grid.innerHTML = '';

    clientReviews.forEach((rev, index) => {
      const starsStr = '★'.repeat(rev.rating) + '☆'.repeat(5 - rev.rating);
      const card = document.createElement('div');
      card.className = `review-card reveal ${index > 0 ? 'reveal-delay-' + Math.min(index, 3) : ''}`;
      
      card.innerHTML = `
        <div class="review-card__top">
          <div class="review-card__stars">${starsStr}</div>
          <div class="review-card__badge">
            <span class="review-verified-dot"></span>
            <span>Verified Client</span>
          </div>
        </div>
        <p class="review-card__text">&ldquo;${rev.text}&rdquo;</p>
        <div class="review-card__footer">
          <div class="review-author-avatar">
            <span>${rev.name.charAt(0)}</span>
          </div>
          <div class="review-author-meta">
            <h4 class="review-author-name">${rev.name}</h4>
            <p class="review-author-role">${rev.role}</p>
          </div>
          <span class="review-date">${rev.date || 'Recent'}</span>
        </div>
      `;

      grid.appendChild(card);
    });

    if (typeof VisionXAnimations !== 'undefined' && typeof VisionXAnimations.refreshReveals === 'function') {
      VisionXAnimations.refreshReveals();
    }
  }

  function setupReviewModalEvents() {
    const openBtn = document.getElementById('open-review-modal-btn');
    const closeBtn = document.getElementById('close-review-modal-btn');
    const modal = document.getElementById('review-modal');
    const backdrop = document.getElementById('review-modal-backdrop');
    const form = document.getElementById('client-review-form');
    const starPicker = document.getElementById('star-rating-picker');
    const ratingInput = document.getElementById('rev-rating-value');
    const ratingText = document.getElementById('star-rating-text');

    if (!modal) return;

    function openModal() {
      modal.classList.add('active');
      modal.setAttribute('aria-hidden', 'false');
      document.body.classList.add('menu-open');
      playSound('open');
    }

    function closeModal() {
      modal.classList.remove('active');
      modal.setAttribute('aria-hidden', 'true');
      document.body.classList.remove('menu-open');
    }

    if (openBtn) openBtn.addEventListener('click', openModal);
    if (closeBtn) closeBtn.addEventListener('click', closeModal);
    if (backdrop) backdrop.addEventListener('click', closeModal);

    // Star Picker Interaction
    if (starPicker) {
      const starBtns = starPicker.querySelectorAll('.star-btn');
      starBtns.forEach(btn => {
        btn.addEventListener('click', () => {
          const val = parseInt(btn.dataset.rating, 10);
          ratingInput.value = val;
          starBtns.forEach((s, idx) => {
            if (idx < val) {
              s.classList.add('active');
            } else {
              s.classList.remove('active');
            }
          });

          const ratingsMap = {
            5: '5.0 - Exceptional',
            4: '4.0 - Great Experience',
            3: '3.0 - Good',
            2: '2.0 - Fair',
            1: '1.0 - Needs Improvement'
          };
          if (ratingText) ratingText.textContent = ratingsMap[val] || '5.0';
          playSound('click');
        });
      });
    }

    // Form Submit
    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const name = document.getElementById('rev-name').value.trim();
        const role = document.getElementById('rev-role').value.trim();
        const text = document.getElementById('rev-text').value.trim();
        const rating = parseInt(ratingInput.value, 10) || 5;

        if (!name || !role || !text) return;

        const newRev = {
          id: 'rev-' + Date.now(),
          name: name,
          role: role,
          rating: rating,
          date: 'Just now',
          text: text
        };

        clientReviews.unshift(newRev);
        localStorage.setItem('visionx_client_reviews', JSON.stringify(clientReviews));

        renderReviewsGrid();
        playSound('publish');
        form.reset();
        closeModal();

        // Smooth scroll to reviews
        const revSec = document.getElementById('reviews');
        if (revSec) revSec.scrollIntoView({ behavior: 'smooth' });
      });
    }
  }


  // =========================================================================
  // Executive CMS Manager Logic
  // =========================================================================

  function renderCMSList() {
    if (!cmsProjectList) return;

    cmsProjectList.innerHTML = '';
    if (cmsProjectCountLabel) {
      cmsProjectCountLabel.textContent = STATE.projects.length;
    }

    if (STATE.projects.length === 0) {
      cmsProjectList.innerHTML = `<p class="cms-empty">No projects published yet. Use the form above to add your first project.</p>`;
      return;
    }

    STATE.projects.forEach((proj, index) => {
      const padNum = String(index + 1).padStart(2, '0');
      const item = document.createElement('div');
      item.className = 'cms-project-item';
      
      item.innerHTML = `
        <div class="cms-item-left">
          <span class="cms-item-num">${padNum}</span>
          <div class="cms-item-info">
            <h5 class="cms-item-title">${proj.title}</h5>
            <span class="cms-item-cat">${proj.category}</span>
          </div>
          <span class="cms-item-tag ${proj.layout === 'large' ? 'cms-tag--large' : ''}">${proj.layout === 'large' ? 'Featured Full-Width' : 'Standard'}</span>
        </div>
        <div class="cms-item-actions">
          <button type="button" class="cms-action-btn cms-edit-btn" data-id="${proj.id}" title="Edit Project">✏️ Edit</button>
          <button type="button" class="cms-action-btn cms-del-btn" data-id="${proj.id}" title="Delete Project">🗑️</button>
        </div>
      `;

      cmsProjectList.appendChild(item);
    });

    // Attach Edit & Delete handlers
    cmsProjectList.querySelectorAll('.cms-edit-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const projId = btn.dataset.id;
        _editProject(projId);
      });
    });

    cmsProjectList.querySelectorAll('.cms-del-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const projId = btn.dataset.id;
        _deleteProject(projId);
      });
    });
  }

  function _setupCMSEvents() {
    if (!cmsProjectForm) return;

    cmsProjectForm.addEventListener('submit', (e) => {
      e.preventDefault();
      _saveProjectFromForm();
    });

    if (cmsCancelBtn) {
      cmsCancelBtn.addEventListener('click', () => {
        _resetCMSForm();
      });
    }

    if (cmsResetBtn) {
      cmsResetBtn.addEventListener('click', () => {
        if (confirm('Reset portfolio to the default VisionX projects?')) {
          STATE.projects = JSON.parse(JSON.stringify(DEFAULT_PROJECTS));
          localStorage.setItem('visionx_projects', JSON.stringify(STATE.projects));
          renderPortfolioGrid();
    initReviews();
    setupFounderModalEvents();
          renderCMSList();
          playSound('publish');
        }
      });
    }
  }

    function _saveProjectFromForm() {
    const idInput = document.getElementById('cms-project-id');
    const titleInput = document.getElementById('cms-title');
    const catInput = document.getElementById('cms-category');
    const layoutInput = document.getElementById('cms-layout');
    const themeInput = document.getElementById('cms-theme');
    const imgInput = document.getElementById('cms-image-url');
    const linkInput = document.getElementById('cms-link');

    const title = titleInput.value.trim();
    const category = catInput.value.trim();
    const layout = layoutInput.value;
    const theme = themeInput.value;
    const image = imgInput ? imgInput.value.trim() : '';
    const link = linkInput ? linkInput.value.trim() : '';

    if (!title || !category) return;

    const existingId = idInput.value;

    if (existingId) {
      // Update existing
      const idx = STATE.projects.findIndex(p => p.id === existingId);
      if (idx !== -1) {
        STATE.projects[idx] = {
          ...STATE.projects[idx],
          title,
          category,
          layout,
          theme,
          image,
          link
        };
      }
    } else {
      // Add new
      const newProj = {
        id: 'proj-' + Date.now(),
        title,
        category,
        layout,
        theme,
        image,
        link
      };
      STATE.projects.push(newProj);
    }

    localStorage.setItem('visionx_projects', JSON.stringify(STATE.projects));
    renderPortfolioGrid();
    renderCMSList();
    _resetCMSForm();
    playSound('publish');

    const saveBtn = document.getElementById('cms-save-btn');
    if (saveBtn) {
      const origText = saveBtn.textContent;
      saveBtn.textContent = '✓ Live Site Updated!';
      saveBtn.style.background = '#10b981';
      saveBtn.style.borderColor = '#10b981';
      setTimeout(() => {
        saveBtn.textContent = origText;
        saveBtn.style.background = '';
        saveBtn.style.borderColor = '';
      }, 1800);
    }
  }

  function _editProject(id) {
    const proj = STATE.projects.find(p => p.id === id);
    if (!proj) return;

    document.getElementById('cms-project-id').value = proj.id;
    document.getElementById('cms-title').value = proj.title;
    document.getElementById('cms-category').value = proj.category;
    document.getElementById('cms-layout').value = proj.layout || 'normal';
    document.getElementById('cms-theme').value = proj.theme || 'cosmic';
    if (document.getElementById('cms-image-url')) {
      document.getElementById('cms-image-url').value = proj.image || '';
    }
    if (document.getElementById('cms-link')) {
      document.getElementById('cms-link').value = proj.link || '';
    }

    if (cmsSaveBtn) cmsSaveBtn.textContent = '✓ Update Project';
    if (cmsCancelBtn) cmsCancelBtn.style.display = 'inline-flex';

    document.getElementById('cms-title').focus();
    playSound('click');
  }

  function _deleteProject(id) {
    const proj = STATE.projects.find(p => p.id === id);
    if (!proj) return;

    if (confirm(`Remove "${proj.title}" from live portfolio?`)) {
      STATE.projects = STATE.projects.filter(p => p.id !== id);
      localStorage.setItem('visionx_projects', JSON.stringify(STATE.projects));
      renderPortfolioGrid();
      renderCMSList();
      playSound('delete');
    }
  }

  function _resetCMSForm() {
    if (!cmsProjectForm) return;
    cmsProjectForm.reset();
    document.getElementById('cms-project-id').value = '';
    if (document.getElementById('cms-link')) {
      document.getElementById('cms-link').value = '';
    }
    if (document.getElementById('cms-image-url')) {
      document.getElementById('cms-image-url').value = '';
    }
    if (cmsSaveBtn) cmsSaveBtn.textContent = '+ Publish to Live Site';
    if (cmsCancelBtn) cmsCancelBtn.style.display = 'none';
  }

  // =========================================================================
  // Modal Logic & Tab Switching
  // =========================================================================

  function openPortal(tabName = 'login') {
    if (!portalModal) return;
    initAudio();
    playSound('open');
    portalModal.classList.add('active');
    portalOverlay.classList.add('active');
    document.body.classList.add('portal-open');

    if (tabName) {
      _switchTab(tabName);
    }

    const firstInput = portalModal.querySelector('input');
    if (firstInput && tabName === 'login') {
      setTimeout(() => firstInput.focus(), 250);
    }
  }

  function closePortal() {
    if (!portalModal) return;
    playSound('click');
    portalModal.classList.remove('active');
    portalOverlay.classList.remove('active');
    document.body.classList.remove('portal-open');
  }

  function _setupModalEvents() {
    if (openBtns) {
      openBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.preventDefault();
          const targetTab = btn.dataset.tab || 'login';
          openPortal(targetTab);
        });
      });
    }

    if (quickThemeBtns) {
      quickThemeBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.preventDefault();
          cycleTheme();
        });
      });
    }

    if (closeBtn) closeBtn.addEventListener('click', closePortal);
    if (portalOverlay) portalOverlay.addEventListener('click', closePortal);

    // Escape Key to close
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && portalModal && portalModal.classList.contains('active')) {
        closePortal();
      }
    });
  }

  function _setupTabEvents() {
    if (!tabButtons) return;
    tabButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        playSound('click');
        const tab = btn.dataset.tab;
        _switchTab(tab);
      });
    });
  }

  function _switchTab(tabName) {
    tabButtons.forEach(b => b.classList.toggle('active', b.dataset.tab === tabName));
    tabPanes.forEach(p => p.classList.toggle('active', p.id === `tab-${tabName}`));
  }

  function _setupThemeEvents() {
    if (!themeCards) return;
    themeCards.forEach(card => {
      card.addEventListener('click', () => {
        const theme = card.dataset.theme;
        setTheme(theme);
      });
    });

    const speedSlider = document.getElementById('particle-speed-slider');
    if (speedSlider) {
      speedSlider.addEventListener('input', (e) => {
        const val = parseFloat(e.target.value);
        STATE.particleSpeed = val;
        if (typeof VisionXThree !== 'undefined' && typeof VisionXThree.setSpeed === 'function') {
          VisionXThree.setSpeed(val);
        }
      });
    }
  }

  // =========================================================================
  // Executive Authentication Engine (Deepak Kumar & Balaji)
  // =========================================================================

  function _setupAuthEvents() {
            // 1-Click Executive Pass: Deepak Kumar
    if (passDeepakBtn) {
      passDeepakBtn.addEventListener('click', () => {
        _loginAs({
          name: 'Deepak Kumar',
          role: 'CEO & Founder',
          id: 'VX-CEO-01',
          avatar: 'assets/images/deepak-kumar.jpg'
        });
      });
    }

    // 1-Click Executive Pass: Balaji
    if (passBalajiBtn) {
      passBalajiBtn.addEventListener('click', () => {
        _loginAs({
          name: 'Balaji',
          role: 'Founder',
          id: 'VX-FND-02',
          avatar: 'assets/images/balaji.jpg'
        });
      });
    }

    // 1-Click Executive Pass: Sanjay
    const passSanjayBtn = document.getElementById('pass-sanjay-btn');
    if (passSanjayBtn) {
      passSanjayBtn.addEventListener('click', () => {
        _loginAs({
          name: 'Sanjay',
          role: 'Founder',
          id: 'VX-FND-03',
          avatar: 'assets/images/sanjay.png'
        });
      });
    }

    // 1-Click Executive Pass: Inbaraj
    const passInbarajBtn = document.getElementById('pass-inbaraj-btn');
    if (passInbarajBtn) {
      passInbarajBtn.addEventListener('click', () => {
        _loginAs({
          name: 'Inbaraj',
          role: 'Founder',
          id: 'VX-FND-04',
          avatar: 'assets/images/inbaraj.png'
        });
      });
    }

    // 1-Click Executive Pass: Sivanesan
    const passSivanesanBtn = document.getElementById('pass-sivanesan-btn');
    if (passSivanesanBtn) {
      passSivanesanBtn.addEventListener('click', () => {
        _loginAs({
          name: 'Sivanesan',
          role: 'Founder',
          id: 'VX-FND-05',
          avatar: 'assets/images/sivanesan.png'
        });
      });
    }

    // 1-Click Executive Pass: Boopathi
    const passBoopathiBtn = document.getElementById('pass-boopathi-btn');
    if (passBoopathiBtn) {
      passBoopathiBtn.addEventListener('click', () => {
        _loginAs({
          name: 'Boopathi',
          role: 'Founder',
          id: 'VX-FND-06',
          avatar: 'assets/images/boopathi.jpg'
        });
      });
    }

    // Manual Form Login
    if (loginForm) {
      loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const emailInput = document.getElementById('portal-email');
        const val = (emailInput ? emailInput.value : '').toLowerCase();

        if (val.includes('balaji')) {
          _loginAs({
            name: 'Balaji',
            role: 'Founder',
            id: 'VX-FND-02',
            avatar: 'assets/images/balaji.jpg'
          });
        } else {
          _loginAs({
            name: 'Deepak Kumar',
            role: 'CEO & Founder',
            id: 'VX-CEO-01',
            avatar: 'assets/images/deepak-kumar.jpg'
          });
        }
      });
    }

    // Logout
    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => {
        _logout();
      });
    }
  }

  function _loginAs(userObj) {
    STATE.isLoggedIn = true;
    STATE.user = userObj;
    localStorage.setItem('visionx_auth', 'true');
    localStorage.setItem('visionx_user', JSON.stringify(userObj));

    playSound('login');
    _updateAuthUI();

    // Automatically switch to the CMS tab so they can immediately edit projects!
    _switchTab('cms');
  }

  function _logout() {
    STATE.isLoggedIn = false;
    localStorage.setItem('visionx_auth', 'false');
    playSound('logout');
    _updateAuthUI();
    _switchTab('login');
  }

  function _updateAuthUI() {
    const hudUserName = document.getElementById('hud-user-name');
    const hudUserId = document.getElementById('hud-user-id');
    const portalAuthMsg = document.getElementById('portal-auth-message');
    const navPortalBtns = document.querySelectorAll('.nav__portal-btn');

    if (STATE.isLoggedIn) {
      if (hudElement) hudElement.classList.add('visible');
      if (hudUserName) hudUserName.textContent = STATE.user.name;
      if (hudUserId) hudUserId.textContent = STATE.user.role;
      if (cmsActiveUserLabel) cmsActiveUserLabel.textContent = `${STATE.user.name} (${STATE.user.role})`;

      navPortalBtns.forEach(btn => {
        btn.classList.add('logged-in');
        const textSpan = btn.querySelector('.portal-btn-text');
        if (textSpan) textSpan.textContent = STATE.user.name.split(' ')[0] + ' (CEO/Founder)';
      });

      if (portalAuthMsg) {
        portalAuthMsg.style.display = 'block';
        portalAuthMsg.className = 'portal-auth-message success';
        portalAuthMsg.innerHTML = `✓ Authenticated: <strong>${STATE.user.name}</strong> (${STATE.user.role}) — Full CMS Privileges Active.`;
      }
    } else {
      if (hudElement) hudElement.classList.remove('visible');
      navPortalBtns.forEach(btn => {
        btn.classList.remove('logged-in');
        const textSpan = btn.querySelector('.portal-btn-text');
        if (textSpan) textSpan.textContent = 'Gateway';
      });

      if (portalAuthMsg) {
        portalAuthMsg.style.display = 'none';
      }
    }
  }

  // 3D Spatial Holographic Badge tilt
  function _setupBadgeHover() {
    const badge = document.querySelector('.portal-badge');
    const img = document.querySelector('.portal-badge__img');
    if (!badge || !img) return;

    badge.addEventListener('mousemove', (e) => {
      const rect = badge.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      img.style.transform = `rotateY(${x * 35}deg) rotateX(${-y * 35}deg) scale(1.12)`;
    });

    badge.addEventListener('mouseleave', () => {
      img.style.transform = 'rotateY(0deg) rotateX(0deg) scale(1)';
    });
  }

  // =========================================================================
  // Public API
  // =========================================================================

  return {
    init: init,
    openPortal: openPortal,
    closePortal: closePortal,
    setTheme: setTheme,
    cycleTheme: cycleTheme,
    renderPortfolioGrid: renderPortfolioGrid
  };

})();

// Initialize portal engine on DOM load
document.addEventListener('DOMContentLoaded', function () {
  VisionXPortal.init();
});
