/* ==========================================================================
   VisionX Web Technology — Three.js Scene Manager
   ========================================================================== */

'use strict';

const VisionXThree = (function () {

  let currentTheme = localStorage.getItem('visionx_theme') || 'light';
  let speedMultiplier = 1.0;

  // ---- Utilities ----

  function checkWebGL() {
    try {
      const canvas = document.createElement('canvas');
      return !!(window.WebGLRenderingContext &&
        (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')));
    } catch (e) {
      return false;
    }
  }

  function isMobile() {
    return window.innerWidth <= 768;
  }

  function showFallback(container, isDark) {
    container.innerHTML = `<div class="webgl-fallback"><p>${isDark ? 'WebGL / Three.js' : 'Interactive 3D'}</p></div>`;
  }

  // =========================================================================
  // HERO SCENE — Particle Network / Orb
  // =========================================================================

  let heroScene, heroCamera, heroRenderer, heroAnimId;
  let heroParticles, heroLines, heroCore;
  let heroCoreMesh, heroSphereMesh, heroTorusMesh, heroTorus2Mesh, heroParticleMat, heroLinesMat;
  let heroMouse = { x: 0, y: 0 };
  let heroTarget = { x: 0, y: 0 };
  let heroContainer = null;

  function initHeroScene(container) {
    heroContainer = container;
    if (!checkWebGL()) { showFallback(container, false); return; }

    const W = container.clientWidth;
    const H = container.clientHeight;
    const mobile = isMobile();

    // Scene
    heroScene = new THREE.Scene();
    heroScene.background = null;

    // Camera
    heroCamera = new THREE.PerspectiveCamera(55, W / H, 0.1, 1000);
    heroCamera.position.set(0, 0, 5);

    // Renderer
    heroRenderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    heroRenderer.setSize(W, H);
    heroRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    heroRenderer.setClearColor(0x000000, 0);
    container.appendChild(heroRenderer.domElement);
    heroRenderer.domElement.classList.add('hero__scene-canvas');

    _createHeroObjects(mobile);
    _setupHeroLights();
    _setupHeroInteraction(container);
    updateTheme(currentTheme);
    _animateHero();

    window.addEventListener('resize', _resizeHero);
  }

  function _createHeroObjects(mobile) {
    const group = new THREE.Group();
    heroScene.add(group);
    heroCore = group;

    // Central icosahedron wireframe
    const coreGeo = new THREE.IcosahedronGeometry(1.2, 1);
    const coreMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      wireframe: true,
      opacity: 0.45,
      transparent: true
    });
    heroCoreMesh = new THREE.Mesh(coreGeo, coreMat);
    group.add(heroCoreMesh);

    // Inner sphere
    const sphereGeo = new THREE.SphereGeometry(0.85, 32, 32);
    const sphereMat = new THREE.MeshPhongMaterial({
      color: 0x0a0f1d,
      emissive: 0x0284c7,
      emissiveIntensity: 0.05,
      shininess: 60,
      transparent: true,
      opacity: 0.35,
      wireframe: false
    });
    heroSphereMesh = new THREE.Mesh(sphereGeo, sphereMat);
    group.add(heroSphereMesh);

    // Outer ring
    const torusGeo = new THREE.TorusGeometry(1.8, 0.006, 4, 80);
    const torusMat = new THREE.MeshBasicMaterial({ color: 0xbbbbbb, opacity: 0.4, transparent: true });
    heroTorusMesh = new THREE.Mesh(torusGeo, torusMat);
    heroTorusMesh.rotation.x = Math.PI / 4;
    group.add(heroTorusMesh);

    const torus2Geo = new THREE.TorusGeometry(2.1, 0.004, 4, 80);
    const torus2Mat = new THREE.MeshBasicMaterial({ color: 0xcccccc, opacity: 0.25, transparent: true });
    heroTorus2Mesh = new THREE.Mesh(torus2Geo, torus2Mat);
    heroTorus2Mesh.rotation.x = -Math.PI / 6;
    heroTorus2Mesh.rotation.z = Math.PI / 5;
    group.add(heroTorus2Mesh);

    // Particles
    const particleCount = mobile ? 120 : 300;
    const positions = new Float32Array(particleCount * 3);
    const sizes = new Float32Array(particleCount);

    for (let i = 0; i < particleCount; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = 1.5 + Math.random() * 2.2;
      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = r * Math.cos(phi);
      sizes[i] = Math.random() * 2.5 + 0.5;
    }

    const particleGeo = new THREE.BufferGeometry();
    particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    particleGeo.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

    heroParticleMat = new THREE.PointsMaterial({
      color: 0x38bdf8,
      size: 0.028,
      transparent: true,
      opacity: 0.85,
      sizeAttenuation: true
    });

    heroParticles = new THREE.Points(particleGeo, heroParticleMat);
    group.add(heroParticles);

    // Connecting lines
    if (!mobile) {
      const lineCount = 35;
      heroLinesMat = new THREE.LineBasicMaterial({ color: 0xaaaaaa, opacity: 0.15, transparent: true });
      const linesGroup = new THREE.Group();

      const pts = [];
      for (let i = 0; i < particleCount; i++) {
        pts.push(new THREE.Vector3(
          positions[i * 3], positions[i * 3 + 1], positions[i * 3 + 2]
        ));
      }

      let added = 0;
      for (let i = 0; i < pts.length && added < lineCount; i++) {
        for (let j = i + 1; j < pts.length && added < lineCount; j++) {
          const d = pts[i].distanceTo(pts[j]);
          if (d < 1.5 && d > 0.6) {
            const lineGeo = new THREE.BufferGeometry().setFromPoints([pts[i], pts[j]]);
            linesGroup.add(new THREE.Line(lineGeo, heroLinesMat));
            added++;
          }
        }
      }
      group.add(linesGroup);
      heroLines = linesGroup;
    }
  }

  function _setupHeroLights() {
    const ambient = new THREE.AmbientLight(0xffffff, 0.7);
    heroScene.add(ambient);
    const dir1 = new THREE.DirectionalLight(0xffffff, 0.6);
    dir1.position.set(3, 4, 5);
    heroScene.add(dir1);
    const dir2 = new THREE.DirectionalLight(0xeeeeee, 0.3);
    dir2.position.set(-3, -2, 2);
    heroScene.add(dir2);
  }

  function _setupHeroInteraction(container) {
    container.addEventListener('mousemove', function (e) {
      const rect = container.getBoundingClientRect();
      heroMouse.x = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
      heroMouse.y = -((e.clientY - rect.top) / rect.height - 0.5) * 2;
    });
  }

  let heroTime = 0;
  function _animateHero() {
    if (document.hidden) {
      heroAnimId = requestAnimationFrame(_animateHero);
      return;
    }
    heroAnimId = requestAnimationFrame(_animateHero);
    heroTime += 0.005 * speedMultiplier;

    // Smooth inertia
    heroTarget.x += (heroMouse.x * 0.3 - heroTarget.x) * 0.04;
    heroTarget.y += (heroMouse.y * 0.3 - heroTarget.y) * 0.04;

    if (heroCore) {
      heroCore.rotation.y = heroTime * 0.15 + heroTarget.x;
      heroCore.rotation.x = heroTime * 0.08 + heroTarget.y * 0.5;
    }

    if (heroParticles) {
      heroParticles.rotation.y = -heroTime * 0.06;
    }

    if (heroRenderer && heroScene && heroCamera) {
      heroRenderer.render(heroScene, heroCamera);
    }
  }

  function _resizeHero() {
    if (!heroContainer || !heroCamera || !heroRenderer) return;
    const W = heroContainer.clientWidth;
    const H = heroContainer.clientHeight;
    heroCamera.aspect = W / H;
    heroCamera.updateProjectionMatrix();
    heroRenderer.setSize(W, H);
  }

  function disposeHeroScene() {
    cancelAnimationFrame(heroAnimId);
    window.removeEventListener('resize', _resizeHero);
    if (heroRenderer) {
      heroRenderer.dispose();
      if (heroRenderer.domElement && heroRenderer.domElement.parentNode) {
        heroRenderer.domElement.parentNode.removeChild(heroRenderer.domElement);
      }
    }
  }

  // =========================================================================
  // FEATURE 3D SECTION — Dark Torus / Floating Structure
  // =========================================================================

  let f3dScene, f3dCamera, f3dRenderer, f3dAnimId;
  let f3dGroup;
  let f3dMouse = { x: 0, y: 0 };
  let f3dTarget = { x: 0, y: 0 };
  let f3dContainer = null;
  let f3dDragging = false;
  let f3dDragStart = { x: 0, y: 0 };
  let f3dRotation = { x: 0, y: 0 };

  function initFeature3DScene(container) {
    f3dContainer = container;
    if (!checkWebGL()) { showFallback(container, true); return; }

    const W = container.clientWidth;
    const H = container.clientHeight;
    const mobile = isMobile();

    f3dScene = new THREE.Scene();
    f3dScene.background = new THREE.Color(0x0a0a0a);

    f3dCamera = new THREE.PerspectiveCamera(60, W / H, 0.1, 1000);
    f3dCamera.position.set(0, 0, 7);

    f3dRenderer = new THREE.WebGLRenderer({ antialias: true });
    f3dRenderer.setSize(W, H);
    f3dRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(f3dRenderer.domElement);

    _createFeature3DObjects(mobile);
    _setupFeature3DLights();
    _setupFeature3DInteraction(container);
    _animateFeature3D();

    window.addEventListener('resize', _resizeFeature3D);
  }

  function _createFeature3DObjects(mobile) {
    f3dGroup = new THREE.Group();
    f3dScene.add(f3dGroup);

    // Central torus knot
    const knotGeo = new THREE.TorusKnotGeometry(1.2, 0.32, mobile ? 80 : 160, mobile ? 12 : 20);
    const knotMat = new THREE.MeshPhongMaterial({
      color: 0x1a1a1a,
      emissive: 0x111111,
      specular: 0x444444,
      shininess: 80,
      wireframe: false
    });
    const knotMesh = new THREE.Mesh(knotGeo, knotMat);
    f3dGroup.add(knotMesh);

    // Wireframe overlay
    const knotWireMat = new THREE.MeshBasicMaterial({
      color: 0x333333,
      wireframe: true,
      opacity: 0.25,
      transparent: true
    });
    const knotWire = new THREE.Mesh(knotGeo, knotWireMat);
    f3dGroup.add(knotWire);

    // Icosahedron outline
    const icoGeo = new THREE.IcosahedronGeometry(2.5, 1);
    const icoMat = new THREE.MeshBasicMaterial({
      color: 0x222222,
      wireframe: true,
      opacity: 0.08,
      transparent: true
    });
    const icoMesh = new THREE.Mesh(icoGeo, icoMat);
    f3dGroup.add(icoMesh);

    // Particles
    const particleCount = mobile ? 80 : 200;
    const pPositions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = 2.8 + Math.random() * 2;
      pPositions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      pPositions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      pPositions[i * 3 + 2] = r * Math.cos(phi);
    }
    const pGeo = new THREE.BufferGeometry();
    pGeo.setAttribute('position', new THREE.BufferAttribute(pPositions, 3));
    const pMat = new THREE.PointsMaterial({
      color: 0x555555,
      size: 0.03,
      transparent: true,
      opacity: 0.7,
      sizeAttenuation: true
    });
    const particles = new THREE.Points(pGeo, pMat);
    f3dGroup.add(particles);
  }

  function _setupFeature3DLights() {
    const ambient = new THREE.AmbientLight(0x222222, 1);
    f3dScene.add(ambient);

    const point1 = new THREE.PointLight(0x4488ff, 0.8, 20);
    point1.position.set(4, 3, 4);
    f3dScene.add(point1);

    const point2 = new THREE.PointLight(0xffffff, 0.4, 15);
    point2.position.set(-4, -2, 2);
    f3dScene.add(point2);

    const point3 = new THREE.PointLight(0x8866ff, 0.3, 12);
    point3.position.set(0, -4, -3);
    f3dScene.add(point3);
  }

  function _setupFeature3DInteraction(container) {
    container.addEventListener('mousemove', function (e) {
      if (f3dDragging) {
        const dx = e.clientX - f3dDragStart.x;
        const dy = e.clientY - f3dDragStart.y;
        f3dRotation.y += dx * 0.005;
        f3dRotation.x += dy * 0.005;
        f3dDragStart.x = e.clientX;
        f3dDragStart.y = e.clientY;
      } else {
        const rect = container.getBoundingClientRect();
        f3dMouse.x = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
        f3dMouse.y = -((e.clientY - rect.top) / rect.height - 0.5) * 2;
      }
    });

    container.addEventListener('mousedown', function (e) {
      f3dDragging = true;
      f3dDragStart.x = e.clientX;
      f3dDragStart.y = e.clientY;
      container.style.cursor = 'grabbing';
    });

    window.addEventListener('mouseup', function () {
      f3dDragging = false;
      if (container) container.style.cursor = 'grab';
    });

    container.style.cursor = 'grab';

    // Touch support
    container.addEventListener('touchstart', function (e) {
      if (e.touches.length === 1) {
        f3dDragging = true;
        f3dDragStart.x = e.touches[0].clientX;
        f3dDragStart.y = e.touches[0].clientY;
      }
    }, { passive: true });

    container.addEventListener('touchmove', function (e) {
      if (f3dDragging && e.touches.length === 1) {
        const dx = e.touches[0].clientX - f3dDragStart.x;
        const dy = e.touches[0].clientY - f3dDragStart.y;
        f3dRotation.y += dx * 0.005;
        f3dRotation.x += dy * 0.005;
        f3dDragStart.x = e.touches[0].clientX;
        f3dDragStart.y = e.touches[0].clientY;
      }
    }, { passive: true });

    container.addEventListener('touchend', function () {
      f3dDragging = false;
    }, { passive: true });
  }

  let f3dTime = 0;
  function _animateFeature3D() {
    if (document.hidden) {
      f3dAnimId = requestAnimationFrame(_animateFeature3D);
      return;
    }
    f3dAnimId = requestAnimationFrame(_animateFeature3D);
    f3dTime += 0.005 * speedMultiplier;

    if (!f3dDragging) {
      f3dTarget.x += (f3dMouse.y * 0.25 - f3dTarget.x) * 0.04;
      f3dTarget.y += (f3dMouse.x * 0.25 - f3dTarget.y) * 0.04;
    }

    if (f3dGroup) {
      if (f3dDragging) {
        f3dGroup.rotation.y = f3dRotation.y;
        f3dGroup.rotation.x = f3dRotation.x;
      } else {
        f3dGroup.rotation.y = f3dTime * 0.18 + f3dTarget.y;
        f3dGroup.rotation.x = f3dTime * 0.08 + f3dTarget.x;
        f3dRotation.x = f3dGroup.rotation.x;
        f3dRotation.y = f3dGroup.rotation.y;
      }
    }

    if (f3dRenderer && f3dScene && f3dCamera) {
      f3dRenderer.render(f3dScene, f3dCamera);
    }
  }

  function _resizeFeature3D() {
    if (!f3dContainer || !f3dCamera || !f3dRenderer) return;
    const W = f3dContainer.clientWidth;
    const H = f3dContainer.clientHeight;
    f3dCamera.aspect = W / H;
    f3dCamera.updateProjectionMatrix();
    f3dRenderer.setSize(W, H);
  }

  // =========================================================================
  // ABOUT SECTION — Minimal Wireframe
  // =========================================================================

  let aboutScene, aboutCamera, aboutRenderer, aboutAnimId;
  let aboutMesh;
  let aboutContainer = null;

  function initAboutScene(container) {
    aboutContainer = container;
    if (!checkWebGL()) { showFallback(container, false); return; }

    const W = container.clientWidth;
    const H = container.clientHeight;

    aboutScene = new THREE.Scene();
    aboutScene.background = null;

    aboutCamera = new THREE.PerspectiveCamera(50, W / H, 0.1, 100);
    aboutCamera.position.set(0, 0, 4);

    aboutRenderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    aboutRenderer.setSize(W, H);
    aboutRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    aboutRenderer.setClearColor(0x000000, 0);
    container.appendChild(aboutRenderer.domElement);

    // Octahedron wireframe
    const octGeo = new THREE.OctahedronGeometry(1.2, 2);
    const octMat = new THREE.MeshBasicMaterial({
      color: 0x222222,
      wireframe: true,
      opacity: 0.18,
      transparent: true
    });
    aboutMesh = new THREE.Mesh(octGeo, octMat);
    aboutScene.add(aboutMesh);

    // Inner sphere
    const sGeo = new THREE.SphereGeometry(0.75, 24, 24);
    const sMat = new THREE.MeshBasicMaterial({
      color: 0xf0f0f0,
      wireframe: true,
      opacity: 0.12,
      transparent: true
    });
    aboutScene.add(new THREE.Mesh(sGeo, sMat));

    const aLight = new THREE.AmbientLight(0xffffff, 0.9);
    aboutScene.add(aLight);

    _animateAbout();
    window.addEventListener('resize', _resizeAbout);
  }

  let aboutTime = 0;
  function _animateAbout() {
    if (document.hidden) {
      aboutAnimId = requestAnimationFrame(_animateAbout);
      return;
    }
    aboutAnimId = requestAnimationFrame(_animateAbout);
    aboutTime += 0.004 * speedMultiplier;
    if (aboutMesh) {
      aboutMesh.rotation.y = aboutTime;
      aboutMesh.rotation.x = aboutTime * 0.5;
    }
    if (aboutRenderer && aboutScene && aboutCamera) {
      aboutRenderer.render(aboutScene, aboutCamera);
    }
  }

  function _resizeAbout() {
    if (!aboutContainer || !aboutCamera || !aboutRenderer) return;
    const W = aboutContainer.clientWidth;
    const H = aboutContainer.clientHeight;
    aboutCamera.aspect = W / H;
    aboutCamera.updateProjectionMatrix();
    aboutRenderer.setSize(W, H);
  }

  // =========================================================================
  // THEME DYNAMIC MORPHING
  // =========================================================================

  function updateTheme(theme) {
    currentTheme = theme;
    if (heroCoreMesh) {
      if (theme === 'dark') {
        // Obsidian Space (Deep space & sapphire glow)
        heroCoreMesh.material.color.setHex(0x38bdf8);
        heroCoreMesh.material.opacity = 0.45;
        if (heroSphereMesh) {
          heroSphereMesh.material.color.setHex(0x0a0f1d);
          heroSphereMesh.material.emissive.setHex(0x0284c7);
        }
        if (heroTorusMesh) heroTorusMesh.material.color.setHex(0x38bdf8);
        if (heroTorus2Mesh) heroTorus2Mesh.material.color.setHex(0x60a5fa);
        heroParticleMat.color.setHex(0x38bdf8);
        heroParticleMat.opacity = 0.85;
        if (heroLinesMat) heroLinesMat.color.setHex(0x38bdf8);
      } else {
        // Minimal Pure (Liquid crystalline white)
        heroCoreMesh.material.color.setHex(0x111111);
        heroCoreMesh.material.opacity = 0.12;
        if (heroSphereMesh) {
          heroSphereMesh.material.color.setHex(0xfafafa);
          heroSphereMesh.material.emissive.setHex(0xeeeeee);
        }
        if (heroTorusMesh) heroTorusMesh.material.color.setHex(0xbbbbbb);
        if (heroTorus2Mesh) heroTorus2Mesh.material.color.setHex(0xcccccc);
        heroParticleMat.color.setHex(0x888888);
        heroParticleMat.opacity = 0.55;
        if (heroLinesMat) heroLinesMat.color.setHex(0xaaaaaa);
      }
    }

    if (aboutMesh) {
      if (theme === 'dark') {
        aboutMesh.material.color.setHex(0x38bdf8);
        aboutMesh.material.opacity = 0.45;
      } else {
        aboutMesh.material.color.setHex(0x222222);
        aboutMesh.material.opacity = 0.18;
      }
    }
  }

  function setSpeed(val) {
    speedMultiplier = Math.max(0.2, Math.min(3.0, val));
  }

  // =========================================================================
  // PROJECT CARD VISUALS — CSS Gradient Placeholders
  // =========================================================================

  function initProjectVisuals() {
    const visuals = document.querySelectorAll('.project-card__visual-inner');
    const palettes = [
      { bg: '#111111', pattern: 'radial-gradient(circle at 30% 40%, #1e293b 0%, #0f172a 60%)' },
      { bg: '#1a1a2e', pattern: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0284c7 100%)' },
      { bg: '#0d0d0d', pattern: 'radial-gradient(ellipse at 70% 30%, #1e293b 0%, #030712 70%)' },
      { bg: '#111111', pattern: 'linear-gradient(160deg, #090d16 0%, #0284c7 100%)' },
    ];

    const projectNames = ['NOVA', 'ARC', 'LUMEN', 'NEXUS'];
    const projectSubs = ['Creative Technology', 'Business Platform', '3D Experience', 'SaaS Design'];

    visuals.forEach(function (visual, index) {
      const palette = palettes[index % palettes.length];
      visual.style.background = palette.pattern;
      visual.style.display = 'flex';
      visual.style.alignItems = 'center';
      visual.style.justifyContent = 'center';
      visual.style.flexDirection = 'column';
      visual.style.gap = '0.5rem';

      const nameEl = document.createElement('span');
      nameEl.style.cssText = 'font-size: clamp(1.8rem, 4vw, 3rem); font-weight: 800; letter-spacing: -0.04em; color: rgba(255,255,255,0.12); font-family: Inter, sans-serif; user-select: none;';
      nameEl.textContent = projectNames[index % projectNames.length];

      const subEl = document.createElement('span');
      subEl.style.cssText = 'font-size: 0.6rem; font-weight: 500; letter-spacing: 0.16em; text-transform: uppercase; color: rgba(255,255,255,0.25); font-family: Inter, sans-serif; user-select: none;';
      subEl.textContent = projectSubs[index % projectSubs.length];

      // Grid pattern overlay
      const overlayEl = document.createElement('div');
      overlayEl.style.cssText = 'position: absolute; inset: 0; background-image: linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px); background-size: 40px 40px; pointer-events: none;';

      visual.style.position = 'relative';
      visual.appendChild(overlayEl);
      visual.appendChild(nameEl);
      visual.appendChild(subEl);
    });
  }

  // =========================================================================
  // Public API
  // =========================================================================

  return {
    initHeroScene: initHeroScene,
    initFeature3DScene: initFeature3DScene,
    initAboutScene: initAboutScene,
    initProjectVisuals: initProjectVisuals,
    disposeHeroScene: disposeHeroScene,
    updateTheme: updateTheme,
    setSpeed: setSpeed,
    checkWebGL: checkWebGL
  };

})();