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
    _initFirebaseSync();
    _initFirebaseConfigTab();
    setupFounderModalEvents();
    renderCMSList();

    // Initialize Industry Portal Engines
    _initEstimator();
    _initSnapshotEngine();
    _updateLiveCardPreview();
    _updateOverviewStats();

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

    // =========================================================================
  // Executive Founders & Team Profile Data
  // =========================================================================

  const FOUNDERS_DATA = {
    deepak: {
      name: 'Deepak Kumar',
      status: 'CEO & Founder',
      spec: 'Chief Executive Officer • Web Development & Architecture',
      domain: 'Web Development & Full-Stack Architecture',
      emailText: 'deepakyuoyt@gmail.com',
      gitHandle: '@AGzDeepak',
      instaHandle: '@deepak_h4x_',
      image: 'assets/images/deepak-kumar.jpg',
      skills: ['Full-Stack Architecture', 'Three.js & 3D WebGL', 'System Engineering', 'Interactive UI Systems'],
      bio: 'Leading executive vision, full-stack architecture, and interactive Three.js 3D WebGL engineering. Dedicated to building high-performance digital platforms that push technological boundaries for visionary brands worldwide.',
      insta: 'https://www.instagram.com/deepak_h4x_?igsi=MWVmbGRyZGVvMWoxYg==',
      git: 'https://github.com/AGzDeepak',
      email: 'https://mail.google.com/mail/?view=cm&fs=1&to=deepakyuoyt@gmail.com&su=Inquiry%20for%20Deepak%20Kumar%20(CEO%20%26%20Founder)%20-%20VisionX&body=Hello%20Deepak,%0A%0AI%20would%20like%20to%20discuss%20a%20web%20technology%20project%20with%20VisionX.%0A%0ALooking%20forward%20to%20connecting.'
    },
    balaji: {
      name: 'Balaji',
      status: 'Co-Founder & CTO',
      spec: 'Chief Technology Officer • Lead Frontend Engineering',
      domain: 'Frontend Development & 60 FPS Performance',
      emailText: 'balajibalaji72863@gmail.com',
      gitHandle: '@balajibalaji72863-cyber',
      instaHandle: '@bala_zx_',
      image: 'assets/images/balaji.jpg',
      skills: ['60 FPS Frontend Performance', 'Micro-Interactions', 'Design Systems', 'Client Delivery Pipelines'],
      bio: 'Directing frontend performance, 60 FPS spatial interactions, responsive design systems, and client delivery pipelines. Focused on crafting silky-smooth, lag-free user experiences that delight clients.',
      insta: 'https://www.instagram.com/bala_zx_?igsi=MTZnZXJudWtreWxieA==',
      git: 'https://github.com/balajibalaji72863-cyber',
      email: 'https://mail.google.com/mail/?view=cm&fs=1&to=balajibalaji72863@gmail.com&su=Inquiry%20for%20Balaji%20(Co-Founder%20%26%20CTO)%20-%20VisionX&body=Hello%20Balaji,%0A%0AI%20would%20like%20to%20discuss%20frontend%20development%20and%20web%20experiences%20with%20VisionX.%0A%0ALooking%20forward%20to%20connecting.'
    },
    godwin: {
      name: 'Godwin Kumar',
      status: 'Co-Founder',
      spec: 'Co-Founder • Full Stack Developer & Designer',
      domain: 'Full Stack Development & UI/UX Design',
      emailText: 'godxsolutions369@gmail.com',
      gitHandle: '@AGzDeepak',
      instaHandle: '@godwin__kumar',
      image: 'assets/images/godwin.jpg',
      skills: ['Full-Stack Development', 'UI / UX Design', 'Modern Frontend Frameworks', 'Creative Prototyping'],
      bio: 'Co-founder directing modern full-stack web architectures, elegant user interfaces, and dynamic digital experiences. Dedicated to engineering robust web solutions with clean aesthetic clarity.',
      insta: 'https://www.instagram.com/godwin__kumar?igsi=MXg4YXkza2Z0ZjNyeQ==',
      git: 'https://github.com/AGzDeepak',
      email: 'https://mail.google.com/mail/?view=cm&fs=1&to=godxsolutions369@gmail.com&su=Inquiry%20for%20Godwin%20Kumar%20(Co-Founder)%20-%20VisionX&body=Hello%20Godwin,%0A%0AI%20would%20like%20to%20discuss%20a%20full%20stack%20development%20and%20design%20project%20with%20VisionX.%0A%0ALooking%20forward%20to%20connecting.'
    },
    sanjay: {
      name: 'Sanjay',
      status: 'Co-Founder & CDO',
      spec: 'Chief Design Officer • UI / UX Architecture',
      domain: 'UI / UX Design & Spatial Prototyping',
      emailText: 'sanjaysanju152006@gmail.com',
      gitHandle: '@sanjayv152006-cmyk',
      instaHandle: '@_.sanjuzz_x___',
      image: 'assets/images/sanjay.png',
      skills: ['UI / UX Architecture', 'Figma Prototyping', 'Spatial Hierarchy', 'Apple-grade Craftsmanship'],
      bio: 'Directing design philosophy, user journeys, spatial visual hierarchies, and Apple-grade interface craftsmanship. Translates complex product logic into effortless, visually stunning user experiences.',
      insta: 'https://www.instagram.com/_.sanjuzz_x___?igsi=dnF1aG1nMmZoMmdl',
      git: 'https://github.com/sanjayv152006-cmyk',
      email: 'https://mail.google.com/mail/?view=cm&fs=1&to=sanjaysanju152006@gmail.com&su=Inquiry%20for%20Sanjay%20(Co-Founder%20%26%20CDO)%20-%20VisionX&body=Hello%20Sanjay,%0A%0AI%20would%20like%20to%20discuss%20UI/UX%20design%20and%20creative%20direction%20with%20VisionX.%0A%0ALooking%20forward%20to%20connecting.'
    },
    inbaraj: {
      name: 'Inbaraj',
      status: 'Co-Founder & CSA',
      spec: 'Chief Solutions Architect • Database & Full Stack',
      domain: 'Database & Full Stack Development',
      emailText: 'enbarjenba21@gmail.com',
      gitHandle: '@enbarajenba21-Tech',
      instaHandle: '@itz_inba_007',
      image: 'assets/images/inbaraj.jpg',
      skills: ['Database Modeling', 'Cloud Infrastructure', 'Secure Backend APIs', 'Server Resilience'],
      bio: 'Architecting scalable database models, cloud infrastructure, secure backend APIs, and enterprise server resilience. Dedicated to building robust backends that scale effortlessly under heavy traffic.',
      insta: 'https://www.instagram.com/itz_inba_007/',
      git: 'https://github.com/enbarajenba21-Tech',
      email: 'https://mail.google.com/mail/?view=cm&fs=1&to=enbarjenba21@gmail.com&su=Inquiry%20for%20Inbaraj%20(Co-Founder%20%26%20CSA)%20-%20VisionX&body=Hello%20Inbaraj,%0A%0AI%20would%20like%20to%20discuss%20database%20architecture%20and%20full%20stack%20development%20with%20VisionX.%0A%0ALooking%20forward%20to%20connecting.'
    },
    sivanesan: {
      name: 'Sivanesan',
      status: 'Co-Founder',
      spec: 'Head of Product Design • UI / UX Strategy',
      domain: 'UI / UX Design & Component Systems',
      emailText: 'sivanesan010307@gmail.com',
      gitHandle: '@AGzDeepak',
      instaHandle: '@_x_o__mad__',
      image: 'assets/images/sivanesan.png',
      skills: ['Product UX Strategy', 'Component Libraries', 'User Flow Mapping', 'High-Fidelity Wireframes'],
      bio: 'Spearheading interaction design, component libraries, wireframing, and user-centric digital prototypes that convert. Focused on creating intuitive interfaces that feel natural and delightful from the first touch.',
      insta: 'https://www.instagram.com/_x_o__mad__?igsi=dnp5a2RseDNnb2tu',
      git: 'https://github.com/AGzDeepak',
      email: 'https://mail.google.com/mail/?view=cm&fs=1&to=sivanesan010307@gmail.com&su=Inquiry%20for%20Sivanesan%20(Co-Founder%20%26%20Product%20Design)%20-%20VisionX&body=Hello%20Sivanesan,%0A%0AI%20would%20like%20to%20discuss%20UI/UX%20design%20and%20interface%20development%20with%20VisionX.%0A%0ALooking%20forward%20to%20connecting.'
    },
    boopathi: {
      name: 'Boopathi',
      status: 'Co-Founder',
      spec: 'Creative Director • Graphic & Brand Identity',
      domain: 'Graphic & Brand Identity Designer',
      emailText: 'boopathi3332@gmail.com',
      gitHandle: '@AGzDeepak',
      instaHandle: '@b_o_o_p_a_t_h_i______',
      image: 'assets/images/boopathi.jpg',
      skills: ['Brand Identity Systems', 'Graphic Storytelling', 'Visual Compositions', 'Typography & Motion'],
      bio: 'Leading visual branding, graphic storytelling, motion assets, and high-impact digital collateral for modern tech products. Crafts iconic visual identities that elevate tech brands on the global stage.',
      insta: 'https://www.instagram.com/b_o_o_p_a_t_h_i______?igsi=MWZwYmpmaGRwandjNA==',
      git: 'https://github.com/AGzDeepak',
      email: 'https://mail.google.com/mail/?view=cm&fs=1&to=boopathi3332@gmail.com&su=Inquiry%20for%20Boopathi%20(Co-Founder%20%26%20Creative%20Director)%20-%20VisionX&body=Hello%20Boopathi,%0A%0AI%20would%20like%20to%20discuss%20graphic%20design%20and%20UI/UX%20branding%20with%20VisionX.%0A%0ALooking%20forward%20to%20connecting.'
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
    const modalSkills = document.getElementById('modal-founder-skills');
    const modalEmailText = document.getElementById('modal-founder-email-text');
    const modalGitText = document.getElementById('modal-founder-git-text');
    const modalInstaText = document.getElementById('modal-founder-insta-text');
    const modalDomainText = document.getElementById('modal-founder-domain-text');
    const modalInsta = document.getElementById('modal-founder-insta');
    const modalGit = document.getElementById('modal-founder-git');
    const modalEmail = document.getElementById('modal-founder-email');

    if (!modal) {
      console.warn('[VisionX] #founder-modal element not found in DOM.');
      return;
    }

    function openFounderDetails(key) {
      const data = FOUNDERS_DATA[key];
      if (!data) {
        console.warn(`[VisionX] No profile data found for key: ${key}`);
        return;
      }

      if (modalImg) {
        modalImg.src = data.image;
        modalImg.alt = `${data.name} - ${data.status}`;
      }
      if (modalStatus) modalStatus.textContent = data.status;
      if (modalName) modalName.textContent = data.name;
      if (modalSpec) modalSpec.textContent = data.spec;
      if (modalBio) modalBio.textContent = data.bio;

      if (modalEmailText) modalEmailText.textContent = data.emailText || '';
      if (modalGitText) modalGitText.textContent = data.gitHandle || '';
      if (modalInstaText) modalInstaText.textContent = data.instaHandle || '';
      if (modalDomainText) modalDomainText.textContent = data.domain || '';

      if (modalSkills && data.skills) {
        modalSkills.innerHTML = data.skills.map(s => `<span class="founder-modal-skill-chip">✦ ${s}</span>`).join('');
      }

      if (modalInsta) modalInsta.href = data.insta;
      if (modalGit) modalGit.href = data.git;
      if (modalEmail) modalEmail.href = data.email;

      modal.classList.add('active');
      modal.setAttribute('aria-hidden', 'false');
      modal.setAttribute('data-current-founder', key);
      document.body.classList.add('menu-open');
      playSound('open');
      console.log(`[VisionX] Opened profile details for: ${data.name} (${key})`);
    }

    function closeFounderDetails() {
      modal.classList.remove('active');
      modal.setAttribute('aria-hidden', 'true');
      document.body.classList.remove('menu-open');
      playSound('click');
    }

    if (closeBtn) closeBtn.addEventListener('click', (e) => {
      e.preventDefault();
      closeFounderDetails();
    });

    if (backdrop) backdrop.addEventListener('click', (e) => {
      e.preventDefault();
      closeFounderDetails();
    });

    // Attach click listeners to cards and image frames
    const founderCards = document.querySelectorAll('.js-founder-card, [data-founder]');
    founderCards.forEach(card => {
      card.style.cursor = 'pointer';
      
      card.addEventListener('click', (e) => {
        // If clicking directly on an external chip link (Instagram, GitHub, Email), don't block that link
        if (e.target.closest('.profile-chips, .profile-chip')) {
          return;
        }

        const key = card.dataset.founder || (card.closest('[data-founder]') ? card.closest('[data-founder]').dataset.founder : null);
        if (key) {
          e.preventDefault();
          e.stopPropagation();
          openFounderDetails(key);
        }
      });

      // Keyboard accessibility (Enter / Space)
      card.setAttribute('tabindex', '0');
      card.setAttribute('role', 'button');
      card.setAttribute('aria-label', `View full profile details for ${card.querySelector('.profile-name') ? card.querySelector('.profile-name').textContent : 'team member'}`);
      card.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          if (e.target.closest('.profile-chips, .profile-chip')) return;
          const key = card.dataset.founder;
          if (key) {
            e.preventDefault();
            openFounderDetails(key);
          }
        }
      });
    });

    // Also attach click directly to .about__image-frame as direct target
    document.querySelectorAll('.about__image-frame').forEach(frame => {
      frame.style.cursor = 'pointer';
      frame.addEventListener('click', (e) => {
        const card = frame.closest('[data-founder]');
        if (card && card.dataset.founder) {
          e.preventDefault();
          e.stopPropagation();
          openFounderDetails(card.dataset.founder);
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
        if (typeof VisionXFirebase !== 'undefined') {
          // Initial reviews seeded
        }
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
    const scoreLabel = document.querySelector('.rating-score');
    if (!grid) return;

    if (countLabel) {
      countLabel.textContent = clientReviews.length;
    }

    if (scoreLabel && clientReviews.length > 0) {
      const sum = clientReviews.reduce((acc, r) => acc + (Number(r.rating) || 5), 0);
      const avg = (sum / clientReviews.length).toFixed(1);
      scoreLabel.textContent = `${avg} / 5.0`;
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
        if (typeof VisionXFirebase !== 'undefined') {
          // Initial reviews seeded
        }

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

    // Push all works to Firebase
    const syncFbBtn = document.getElementById('cms-sync-firebase-btn');
    if (syncFbBtn) {
      syncFbBtn.addEventListener('click', async () => {
        if (typeof VisionXFirebase === 'undefined') return;
        syncFbBtn.disabled = true;
        syncFbBtn.textContent = '⏳ Syncing to Firebase...';

        const result = await VisionXFirebase.syncAllProjectsToFirestore(STATE.projects);
        if (result.success) {
          playSound('publish');
          alert(`✓ Successfully stored all ${result.count} existing works into Firebase Cloud Firestore!`);
          syncFbBtn.textContent = '✓ Works Synced to Firebase';
          setTimeout(() => {
            syncFbBtn.disabled = false;
            syncFbBtn.textContent = '🔥 Push All Works to Firebase';
          }, 3000);
        } else {
          alert(`Firebase Sync Notice:
${result.error}

To complete setup:
1. Open https://console.firebase.google.com/project/visionx-portfolio/firestore
2. Click 'Create database' and choose 'Start in test mode'
3. Click Enable!`);
          syncFbBtn.disabled = false;
          syncFbBtn.textContent = '🔥 Push All Works to Firebase';
        }
      });
    }

    if (!cmsProjectForm) return;

    // Real-time live card preview inputs
    const previewInputs = ['cms-title', 'cms-category', 'cms-layout', 'cms-theme', 'cms-image-url'];
    previewInputs.forEach(inputId => {
      const el = document.getElementById(inputId);
      if (el) {
        el.addEventListener('input', _updateLiveCardPreview);
        el.addEventListener('change', _updateLiveCardPreview);
      }
    });

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
          renderCMSList();
          _updateLiveCardPreview();
          _updateOverviewStats();
          playSound('publish');
          showPortalToast('Portfolio reset to default projects.', '🔄');
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
    let savedProject = null;

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
        savedProject = STATE.projects[idx];
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
      savedProject = newProj;
    }

    localStorage.setItem('visionx_projects', JSON.stringify(STATE.projects));
    // Cloud Firestore Sync
    if (typeof VisionXFirebase !== 'undefined' && savedProject) {
      VisionXFirebase.saveProject(savedProject);
    }
    renderPortfolioGrid();
    renderCMSList();
    _updateLiveCardPreview();
    _updateOverviewStats();
    _resetCMSForm();
    playSound('publish');
    showPortalToast(`Project "${title}" published live!`, '🚀');

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
    _updateLiveCardPreview();
    playSound('click');
  }

  function _deleteProject(id) {
    const proj = STATE.projects.find(p => p.id === id);
    if (!proj) return;

    if (confirm(`Remove "${proj.title}" from live portfolio?`)) {
      STATE.projects = STATE.projects.filter(p => p.id !== id);
      localStorage.setItem('visionx_projects', JSON.stringify(STATE.projects));
      // Cloud Firestore Sync
      if (typeof VisionXFirebase !== 'undefined' && typeof VisionXFirebase.deleteProject === 'function') {
        VisionXFirebase.deleteProject(id);
      }
      renderPortfolioGrid();
      renderCMSList();
      _updateLiveCardPreview();
      _updateOverviewStats();
      playSound('delete');
      showPortalToast(`Project "${proj.title}" removed.`, '🗑️');
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
    _updateLiveCardPreview();
  }

  // =========================================================================
  // Modal Logic & Tab Switching
  // =========================================================================

  function openPortal(tabName = 'overview') {
    if (!portalModal) return;
    initAudio();
    playSound('open');
    portalModal.classList.add('active');
    portalOverlay.classList.add('active');
    document.body.classList.add('portal-open');

    let target = tabName || 'overview';
    if (target === 'login' && STATE.isLoggedIn) {
      target = 'overview';
    }

    _switchTab(target);
    _updateOverviewStats();
    _updateLiveCardPreview();

    const firstInput = portalModal.querySelector('input');
    if (firstInput && target === 'login') {
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

  // =========================================================================
  // Firebase Cloud Real-Time Listeners & Config Tab
  // =========================================================================

  function _initFirebaseSync() {
    if (typeof VisionXFirebase === 'undefined') return;

    // Real-time Firestore Projects Listener
    try {
      VisionXFirebase.subscribeProjects((cloudProjects) => {
        if (cloudProjects && cloudProjects.length > 0) {
          STATE.projects = cloudProjects;
          localStorage.setItem('visionx_projects', JSON.stringify(STATE.projects));
          renderPortfolioGrid();
          renderCMSList();
        }
      });
    } catch (e) {}

    // Real-time Firestore Reviews Listener
    try {
      VisionXFirebase.subscribeReviews((cloudReviews) => {
        if (cloudReviews && cloudReviews.length > 0) {
          clientReviews = cloudReviews;
          localStorage.setItem('visionx_client_reviews', JSON.stringify(clientReviews));
          renderReviewsGrid();
        }
      });
    } catch (e) {}

    _updateFirebaseStatusUI();
  }

  function _updateFirebaseStatusUI() {
    const indicator = document.getElementById('firebase-status-indicator');
    const text = document.getElementById('firebase-status-text');
    if (!indicator || !text) return;

    if (typeof VisionXFirebase !== 'undefined' && VisionXFirebase.isLive()) {
      indicator.classList.add('live');
      text.textContent = '🟢 Cloud Firestore Live Connected';
    } else {
      indicator.classList.remove('live');
      text.textContent = '⚡ Cloud Firestore Ready (Local & Offline Fallback Active)';
    }
  }

  function _initFirebaseConfigTab() {
    const form = document.getElementById('firebase-config-form');
    if (!form || typeof VisionXFirebase === 'undefined') return;

    const config = VisionXFirebase.getConfig();
    if (config) {
      if (document.getElementById('fb-api-key')) document.getElementById('fb-api-key').value = config.apiKey || '';
      if (document.getElementById('fb-auth-domain')) document.getElementById('fb-auth-domain').value = config.authDomain || '';
      if (document.getElementById('fb-project-id')) document.getElementById('fb-project-id').value = config.projectId || '';
      if (document.getElementById('fb-storage-bucket')) document.getElementById('fb-storage-bucket').value = config.storageBucket || '';
      if (document.getElementById('fb-app-id')) document.getElementById('fb-app-id').value = config.appId || '';
    }

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const apiKey = (document.getElementById('fb-api-key') ? document.getElementById('fb-api-key').value : '').trim();
      const authDomain = (document.getElementById('fb-auth-domain') ? document.getElementById('fb-auth-domain').value : '').trim();
      const projectId = (document.getElementById('fb-project-id') ? document.getElementById('fb-project-id').value : '').trim();
      const storageBucket = (document.getElementById('fb-storage-bucket') ? document.getElementById('fb-storage-bucket').value : '').trim();
      const appId = (document.getElementById('fb-app-id') ? document.getElementById('fb-app-id').value : '').trim();

      if (!apiKey || !projectId) {
        alert('Please provide at least a valid Firebase API Key and Project ID.');
        return;
      }

      VisionXFirebase.saveConfig({
        apiKey,
        authDomain,
        projectId,
        storageBucket,
        appId
      });

      playSound('publish');
    });
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

    // Isolate scrolling inside modal containers so events are processed natively without bubbling to window
    if (portalModal) {
      portalModal.addEventListener('wheel', (e) => {
        e.stopPropagation();
      }, { passive: true });

      portalModal.addEventListener('touchmove', (e) => {
        e.stopPropagation();
      }, { passive: true });
    }

    // Escape Key to close all active modals & sheets
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        const pModal = document.getElementById('portal-modal');
        const rModal = document.getElementById('review-modal');

        if (pModal && pModal.classList.contains('active')) {
          closePortal();
        }

        if (rModal && rModal.classList.contains('active')) {
          rModal.classList.remove('active');
          rModal.setAttribute('aria-hidden', 'true');
          document.body.classList.remove('menu-open');
        }

        const fModal = document.getElementById('founder-modal');
        if (fModal && fModal.classList.contains('active')) {
          fModal.classList.remove('active');
          fModal.setAttribute('aria-hidden', 'true');
          document.body.classList.remove('menu-open');
        }
      }
    });
  }

  function _setupTabEvents() {
    const allTabBtns = document.querySelectorAll('.portal-tab-btn');
    if (allTabBtns) {
      allTabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
          playSound('click');
          const tab = btn.dataset.tab;
          _switchTab(tab);
        });
      });
    }

    // Quick switch triggers from overview dashboard
    const switchBtns = document.querySelectorAll('.js-portal-switch');
    switchBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const target = btn.dataset.tabTarget;
        if (target) {
          playSound('click');
          _switchTab(target);
        }
      });
    });
  }

  function _switchTab(tabName) {
    const allTabBtns = document.querySelectorAll('.portal-tab-btn');
    const allTabPanes = document.querySelectorAll('.portal-tab-pane');

    allTabBtns.forEach(b => {
      const isMatch = b.dataset.tab === tabName;
      b.classList.toggle('active', isMatch);
      b.setAttribute('aria-selected', isMatch ? 'true' : 'false');
    });

    allTabPanes.forEach(p => {
      const isMatch = p.id === `tab-${tabName}`;
      p.classList.toggle('active', isMatch);
    });

    if (tabName === 'cms') {
      _updateLiveCardPreview();
    } else if (tabName === 'overview') {
      _updateOverviewStats();
    }
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
  // Executive Authentication Engine (Founders & Client Partners)
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
          role: 'Co-Founder & CTO',
          id: 'VX-CTO-02',
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
          role: 'Co-Founder & CDO',
          id: 'VX-CDO-03',
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
          role: 'Co-Founder & CSA',
          id: 'VX-CSA-04',
          avatar: 'assets/images/inbaraj.jpg'
        });
      });
    }

    // 1-Click Executive Pass: Sivanesan
    const passSivanesanBtn = document.getElementById('pass-sivanesan-btn');
    if (passSivanesanBtn) {
      passSivanesanBtn.addEventListener('click', () => {
        _loginAs({
          name: 'Sivanesan',
          role: 'Co-Founder & Head of Product Design',
          id: 'VX-DES-05',
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
          role: 'Co-Founder & Creative Director',
          id: 'VX-DIR-06',
          avatar: 'assets/images/boopathi.jpg'
        });
      });
    }

    // 1-Click Executive Pass: Godwin Kumar
    const passGodwinBtn = document.getElementById('pass-godwin-btn');
    if (passGodwinBtn) {
      passGodwinBtn.addEventListener('click', () => {
        _loginAs({
          name: 'Godwin Kumar',
          role: 'Co-Founder & Full Stack Designer',
          id: 'VX-DEV-07',
          avatar: 'assets/images/godwin.jpg'
        });
      });
    }

    // 1-Click Pass: Client Partner
    const passClientBtn = document.getElementById('pass-client-btn');
    if (passClientBtn) {
      passClientBtn.addEventListener('click', () => {
        _loginAs({
          name: 'Enterprise Client Partner',
          role: 'Client Partner • Starlight Enterprise',
          id: 'VX-CLIENT-08',
          avatar: 'assets/images/visionx-logo.png'
        });
      });
    }

    // Manual Form Login
    if (loginForm) {
      loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const emailInput = document.getElementById('portal-email');
        const val = (emailInput ? emailInput.value : '').toLowerCase();

        if (val.includes('client') || val.includes('partner') || val.includes('enterprise')) {
          _loginAs({
            name: 'Enterprise Client Partner',
            role: 'Client Partner • Starlight Enterprise',
            id: 'VX-CLIENT-08',
            avatar: 'assets/images/visionx-logo.png'
          });
        } else if (val.includes('godwin') || val.includes('godxsolutions369') || val.includes('esec1712007')) {
          _loginAs({
            name: 'Godwin Kumar',
            role: 'Co-Founder & Full Stack Designer',
            id: 'VX-DEV-07',
            avatar: 'assets/images/godwin.jpg'
          });
        } else if (val.includes('balaji')) {
          _loginAs({
            name: 'Balaji',
            role: 'Co-Founder & CTO',
            id: 'VX-CTO-02',
            avatar: 'assets/images/balaji.jpg'
          });
        } else if (val.includes('sanjay')) {
          _loginAs({
            name: 'Sanjay',
            role: 'Co-Founder & CDO',
            id: 'VX-CDO-03',
            avatar: 'assets/images/sanjay.png'
          });
        } else if (val.includes('inbaraj')) {
          _loginAs({
            name: 'Inbaraj',
            role: 'Co-Founder & CSA',
            id: 'VX-CSA-04',
            avatar: 'assets/images/inbaraj.jpg'
          });
        } else if (val.includes('sivanesan')) {
          _loginAs({
            name: 'Sivanesan',
            role: 'Co-Founder & Head of Product Design',
            id: 'VX-DES-05',
            avatar: 'assets/images/sivanesan.png'
          });
        } else if (val.includes('boopathi')) {
          _loginAs({
            name: 'Boopathi',
            role: 'Co-Founder & Creative Director',
            id: 'VX-DIR-06',
            avatar: 'assets/images/boopathi.jpg'
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
    _updateOverviewStats();
    showPortalToast(`Signed in as ${userObj.name}`, '🔐');

    // Automatically switch to overview dashboard!
    _switchTab('overview');
  }

  function _logout() {
    STATE.isLoggedIn = false;
    localStorage.setItem('visionx_auth', 'false');
    playSound('logout');
    _updateAuthUI();
    _updateOverviewStats();
    showPortalToast('Logged out of workspace session.', '👋');
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
        if (textSpan) textSpan.textContent = STATE.user.name.split(' ')[0] + ' (Portal)';
      });

      if (portalAuthMsg) {
        portalAuthMsg.style.display = 'block';
        portalAuthMsg.className = 'portal-auth-message success';
        portalAuthMsg.innerHTML = `✓ Authenticated: <strong>${STATE.user.name}</strong> (${STATE.user.role}) — Full Portal Privileges Active.`;
      }
    } else {
      if (hudElement) hudElement.classList.remove('visible');
      navPortalBtns.forEach(btn => {
        btn.classList.remove('logged-in');
        const textSpan = btn.querySelector('.portal-btn-text');
        if (textSpan) textSpan.textContent = 'Portal';
      });

      if (portalAuthMsg) {
        portalAuthMsg.style.display = 'none';
      }
    }

    _updateOverviewStats();
  }

  // =========================================================================
  // Industry Portal Subsystems: Toast, Stats, Live Preview, Estimator, Snapshot
  // =========================================================================

  function showPortalToast(message, icon = '✓') {
    const toast = document.getElementById('portal-toast');
    if (!toast) return;
    toast.innerHTML = `<span style="color:#38bdf8; font-size:1.1rem;">${icon}</span> <span>${message}</span>`;
    toast.classList.add('show');
    clearTimeout(toast._timeout);
    toast._timeout = setTimeout(() => {
      toast.classList.remove('show');
    }, 2800);
  }

  function _updateOverviewStats() {
    const countEl = document.getElementById('kpi-projects-count');
    if (countEl) {
      countEl.textContent = STATE.projects.length;
    }
    const avatarEl = document.getElementById('overview-user-avatar');
    const nameEl = document.getElementById('overview-user-name');
    const roleEl = document.getElementById('overview-user-role');
    const statusEl = document.getElementById('overview-session-status');

    if (STATE.isLoggedIn && STATE.user) {
      if (avatarEl && STATE.user.avatar) avatarEl.src = STATE.user.avatar;
      if (nameEl && STATE.user.name) nameEl.textContent = STATE.user.name;
      if (roleEl && STATE.user.role) roleEl.textContent = STATE.user.role;
      if (statusEl) statusEl.textContent = 'Authenticated Session';
    } else {
      if (avatarEl) avatarEl.src = 'assets/images/deepak-kumar.jpg';
      if (nameEl) nameEl.textContent = 'Deepak Kumar';
      if (roleEl) roleEl.textContent = 'CEO & Founder • Architecture Lead';
      if (statusEl) statusEl.textContent = 'Enterprise Node Active';
    }
  }

  function _updateLiveCardPreview() {
    const previewContainer = document.getElementById('cms-card-preview');
    if (!previewContainer) return;

    const titleInput = document.getElementById('cms-title');
    const catInput = document.getElementById('cms-category');
    const layoutInput = document.getElementById('cms-layout');
    const themeInput = document.getElementById('cms-theme');
    const imgInput = document.getElementById('cms-image-url');

    const title = (titleInput && titleInput.value.trim()) || 'AETHER 3D';
    const category = (catInput && catInput.value.trim()) || 'Spatial Computing / 3D Web';
    const layout = layoutInput ? layoutInput.value : 'normal';
    const theme = themeInput ? themeInput.value : 'cosmic';
    const image = imgInput ? imgInput.value.trim() : '';

    const bgStyle = THEME_GRADIENTS[theme] || THEME_GRADIENTS.cosmic;
    const isLarge = layout === 'large';

    let visualContent = '';
    if (image.length > 0) {
      visualContent = `
        <div class="project-card__visual" style="height: 140px;">
          <div class="project-card__visual-inner">
            <img src="${image}" alt="${title}" class="project-card__img" style="width: 100%; height: 100%; object-fit: cover;" onerror="this.onerror=null; this.src=''; this.parentElement.style.background='${bgStyle}';" />
          </div>
        </div>
      `;
    } else {
      visualContent = `
        <div class="project-card__visual" style="height: 140px;">
          <div class="project-card__visual-inner" style="background: ${bgStyle};">
            <div class="project-card__grid-overlay"></div>
            <div class="project-card__watermark-wrap">
              <span class="project-card__watermark" style="font-size: 1.6rem;">${title}</span>
              <span class="project-card__watermark-sub" style="font-size: 0.65rem;">${category.split('/')[0].trim()}</span>
            </div>
          </div>
        </div>
      `;
    }

    previewContainer.innerHTML = `
      <article class="project-card ${isLarge ? 'project-card--large' : ''} revealed" style="margin: 0; pointer-events: none; border-color: rgba(56, 189, 248, 0.4); box-shadow: 0 10px 30px rgba(0,0,0,0.5);">
        ${visualContent}
        <div class="project-card__info" style="padding: 1rem;">
          <div class="project-card__meta">
            <p class="project-card__num">LIVE PREVIEW</p>
            <h3 class="project-card__title" style="font-size: 1.15rem;">${title}</h3>
            <p class="project-card__category" style="font-size: 0.76rem;">${category}</p>
          </div>
          <div class="project-card__actions" style="margin-top: 0.75rem;">
            <span class="project-demo-btn" style="padding: 0.35rem 0.75rem; font-size: 0.75rem;">
              <span>Live Demo</span> <span class="demo-arrow">&nearr;</span>
            </span>
          </div>
        </div>
      </article>
    `;
  }

  function _initEstimator() {
    const tiersContainer = document.getElementById('estimator-tiers');
    const addonCheckboxes = document.querySelectorAll('.estimator-addon-checkbox');
    const priceDisplay = document.getElementById('estimator-total-price');
    const daysDisplay = document.getElementById('estimator-total-days');
    const downloadBtn = document.getElementById('estimator-download-btn');
    const inquireBtn = document.getElementById('estimator-inquire-btn');

    if (!tiersContainer) return;

    let selectedTier = {
      id: '3d',
      name: 'Interactive 3D WebGL',
      price: 4500,
      days: 18
    };

    function recalculate() {
      let totalCost = selectedTier.price;
      let totalDays = selectedTier.days;
      const activeAddons = [];

      addonCheckboxes.forEach(cb => {
        if (cb.checked) {
          const price = parseInt(cb.dataset.price, 10) || 0;
          const days = parseInt(cb.dataset.days, 10) || 0;
          totalCost += price;
          totalDays += days;
          activeAddons.push({
            name: cb.dataset.name,
            price: price,
            days: days
          });
        }
      });

      if (priceDisplay) {
        priceDisplay.textContent = `$${totalCost.toLocaleString()}`;
      }

      if (daysDisplay) {
        const sprints = (totalDays / 7).toFixed(1);
        daysDisplay.textContent = `${totalDays} Days (~${sprints} Sprints)`;
      }

      // Update inquire mailto link
      if (inquireBtn) {
        const addonListStr = activeAddons.map(a => ` - ${a.name} (+$${a.price})`).join('%0A');
        const mailBody = `Hello VisionX Leadership,%0A%0AI have generated a project specification via the VisionX Executive Estimator:%0A%0A* Selected Tier: ${selectedTier.name} ($${selectedTier.price})%0A* Capabilities & Add-Ons:%0A${addonListStr}%0A%0A* Total Estimated Investment: $${totalCost.toLocaleString()}%0A* Estimated Timeline: ${totalDays} Days%0A%0APlease let us know the earliest availability for Sprint Zero kickoff.%0A%0ABest regards.`;
        inquireBtn.href = `https://mail.google.com/mail/?view=cm&fs=1&to=visionxwebtechnology@gmail.com&su=VisionX%20Project%20Scope%20(${encodeURIComponent(selectedTier.name)})&body=${mailBody}`;
      }

      return { totalCost, totalDays, activeAddons };
    }

    // Tier selection
    const tierCards = tiersContainer.querySelectorAll('.estimator-tier-card');
    tierCards.forEach(card => {
      card.addEventListener('click', () => {
        tierCards.forEach(c => c.classList.remove('selected'));
        card.classList.add('selected');
        selectedTier = {
          id: card.dataset.tier,
          name: card.dataset.name || card.querySelector('.estimator-tier-title').textContent.trim(),
          price: parseInt(card.dataset.basePrice, 10) || 4500,
          days: parseInt(card.dataset.baseDays, 10) || 18
        };
        playSound('click');
        recalculate();
      });
    });

    // Addon toggles
    addonCheckboxes.forEach(cb => {
      cb.addEventListener('change', () => {
        playSound('click');
        recalculate();
      });
    });

    // Download scope brief .txt
    if (downloadBtn) {
      downloadBtn.addEventListener('click', () => {
        const { totalCost, totalDays, activeAddons } = recalculate();
        const now = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
        
        let fileContent = `===============================================================\n`;
        fileContent += `   VISIONX WEB TECHNOLOGY — EXECUTIVE SCOPE & SOW BRIEF\n`;
        fileContent += `   Leadership: Deepak Kumar (CEO & Founder) & Balaji (CTO)\n`;
        fileContent += `   Date Generated: ${now}\n`;
        fileContent += `===============================================================\n\n`;
        fileContent += `1. SELECTED ARCHITECTURE TIER\n`;
        fileContent += `---------------------------------------------------------------\n`;
        fileContent += `Package:    ${selectedTier.name}\n`;
        fileContent += `Base Cost:  $${selectedTier.price.toLocaleString()}\n`;
        fileContent += `Base Time:  ${selectedTier.days} Days\n\n`;
        fileContent += `2. SELECTED ENTERPRISE CAPABILITIES & ADD-ONS\n`;
        fileContent += `---------------------------------------------------------------\n`;
        if (activeAddons.length === 0) {
          fileContent += `(None selected)\n`;
        } else {
          activeAddons.forEach((addon, idx) => {
            fileContent += `${idx + 1}. ${addon.name}\n`;
            fileContent += `   Investment: +$${addon.price} | SOW Timeline: +${addon.days} days\n`;
          });
        }
        fileContent += `\n3. TOTAL PROJECT INVESTMENT & SPRINT DURATION\n`;
        fileContent += `---------------------------------------------------------------\n`;
        fileContent += `Total Investment:       $${totalCost.toLocaleString()} USD\n`;
        fileContent += `Total Production Time:  ${totalDays} Days (~${(totalDays / 7).toFixed(1)} Sprints)\n`;
        fileContent += `SLA Guarantee:          99.98% Uptime & 60 FPS Fluid Hardware Acceleration\n\n`;
        fileContent += `4. VISIONX LEADERSHIP DIRECT CONTACT\n`;
        fileContent += `---------------------------------------------------------------\n`;
        fileContent += `Executive Team:   visionxwebtechnology@gmail.com\n`;
        fileContent += `Deepak Kumar:     deepakyuoyt@gmail.com (CEO & Architecture)\n`;
        fileContent += `Balaji:           balajibalaji72863@gmail.com (Co-Founder & CTO)\n`;
        fileContent += `\n===============================================================\n`;
        fileContent += `   VisionX Web Technology • End of Scope Specification\n`;
        fileContent += `===============================================================\n`;

        const blob = new Blob([fileContent], { type: 'text/plain;charset=utf-8' });
        const downloadUrl = URL.createObjectURL(blob);
        const tempLink = document.createElement('a');
        tempLink.href = downloadUrl;
        tempLink.download = `VisionX_SOW_Brief_${selectedTier.id}_${Date.now()}.txt`;
        document.body.appendChild(tempLink);
        tempLink.click();
        document.body.removeChild(tempLink);
        URL.revokeObjectURL(downloadUrl);

        showPortalToast('Scope brief downloaded successfully!', '📥');
      });
    }

    recalculate();
  }

  function _initSnapshotEngine() {
    const exportBtn = document.getElementById('export-json-btn');
    const importInput = document.getElementById('import-json-input');

    if (exportBtn) {
      exportBtn.addEventListener('click', () => {
        const snapshot = {
          version: '2.4.0',
          exportedAt: new Date().toISOString(),
          projects: STATE.projects,
          clientReviews: clientReviews
        };

        const jsonStr = JSON.stringify(snapshot, null, 2);
        const blob = new Blob([jsonStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `visionx_portfolio_snapshot_${Date.now()}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        showPortalToast('Portfolio state snapshot exported!', '📦');
      });
    }

    if (importInput) {
      importInput.addEventListener('change', (e) => {
        const file = e.target.files && e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
          try {
            const data = JSON.parse(event.target.result);
            if (Array.isArray(data.projects)) {
              STATE.projects = data.projects;
              localStorage.setItem('visionx_projects', JSON.stringify(STATE.projects));
              if (Array.isArray(data.clientReviews)) {
                clientReviews = data.clientReviews;
                localStorage.setItem('visionx_client_reviews', JSON.stringify(clientReviews));
                renderReviewsGrid();
              }
              renderPortfolioGrid();
              renderCMSList();
              _updateLiveCardPreview();
              _updateOverviewStats();
              showPortalToast('Portfolio snapshot restored successfully!', '✓');
            } else {
              alert('Invalid snapshot file format. Expected a VisionX JSON backup with a "projects" array.');
            }
          } catch (err) {
            alert('Error parsing JSON backup file: ' + err.message);
          }
          importInput.value = '';
        };
        reader.readAsText(file);
      });
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
    setupFounderModalEvents: setupFounderModalEvents,
    setTheme: setTheme,
    cycleTheme: cycleTheme,
    renderPortfolioGrid: renderPortfolioGrid,
    showToast: showPortalToast,
    switchTab: _switchTab
  };

})();

// VisionXPortal is initialized cleanly via js/main.js


// Standalone fallback: Ensure setupFounderModalEvents runs safely across all browser environments
if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      if (typeof VisionXPortal !== 'undefined' && typeof VisionXPortal.setupFounderModalEvents === 'function') {
        VisionXPortal.setupFounderModalEvents();
      }
    });
  } else {
    setTimeout(() => {
      if (typeof VisionXPortal !== 'undefined' && typeof VisionXPortal.setupFounderModalEvents === 'function') {
        VisionXPortal.setupFounderModalEvents();
      }
    }, 100);
  }
}
