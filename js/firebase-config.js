/* ==========================================================================
   VisionX Web Technology — Live Firebase Cloud Database & Auth Engine
   ========================================================================== */

'use strict';

const VisionXFirebase = (function () {

  // Live VisionX Portfolio Firebase Config
  const DEFAULT_CONFIG = {
    apiKey: "AIzaSyDRRhbLeunrPdpX_RUBs7VenLuL-hSVgaE",
    authDomain: "visionx-portfolio.firebaseapp.com",
    projectId: "visionx-portfolio",
    storageBucket: "visionx-portfolio.firebasestorage.app",
    messagingSenderId: "407700229962",
    appId: "1:407700229962:web:beb53a4ab6dcaadf4b7bb3",
    measurementId: "G-FZRKKWG86B"
  };

  let app = null;
  let db = null;
  let auth = null;
  let analytics = null;
  let isConnected = false;
  let activeConfig = null;

  function init() {
    try {
      activeConfig = DEFAULT_CONFIG;
      // Overwrite localStorage with live config so old placeholder isn't cached
      localStorage.setItem('visionx_firebase_config', JSON.stringify(activeConfig));

      // Check if Firebase SDK is loaded
      if (typeof firebase !== 'undefined') {
        if (!firebase.apps.length) {
          app = firebase.initializeApp(activeConfig);
        } else {
          app = firebase.app();
        }

        db = firebase.firestore();
        auth = firebase.auth();

        // Ensure active authenticated session (Anonymous auth fallback)
        try {
          auth.onAuthStateChanged((user) => {
            if (!user) {
              auth.signInAnonymously().catch(() => {});
            }
          });
        } catch (e) {}

        if (typeof firebase.analytics === 'function') {
          try {
            analytics = firebase.analytics();
          } catch (e) {}
        }

        // Enable offline persistence if supported
        try {
          db.enablePersistence({ synchronizeTabs: true }).catch(() => {});
        } catch (e) {}

        isConnected = true;
        console.log('[VisionX Firebase] Live Firebase Firestore & Auth connected to project:', activeConfig.projectId);

        // Auto-seed initial flagship projects into Firestore if empty
        _checkAndSeedDatabase();
      } else {
        console.warn('[VisionX Firebase] Firebase SDK not loaded.');
      }
    } catch (err) {
      console.warn('[VisionX Firebase] Initialization note:', err.message);
      isConnected = false;
    }
  }

  function isLive() {
    return isConnected && db !== null;
  }

  function getConfig() {
    return activeConfig || DEFAULT_CONFIG;
  }

  function saveConfig(newConfig) {
    activeConfig = { ...newConfig };
    localStorage.setItem('visionx_firebase_config', JSON.stringify(activeConfig));
    window.location.reload();
  }

  // =========================================================================
  // Firestore Work & Projects Store (Cloud Database)
  // =========================================================================

  const SEED_PROJECTS = [
    {
      id: 'proj-1',
      title: 'NOVA',
      category: 'Creative Technology / Web Experience',
      layout: 'large',
      theme: 'cosmic',
      image: '',
      link: 'https://github.com/AGzDeepak/visionx-web-portfolio',
      order: 1,
      createdAt: new Date().toISOString()
    },
    {
      id: 'proj-2',
      title: 'ARC',
      category: 'Business / Web Platform',
      layout: 'normal',
      theme: 'sapphire',
      image: '',
      link: 'https://github.com/AGzDeepak/visionx-web-portfolio',
      order: 2,
      createdAt: new Date().toISOString()
    },
    {
      id: 'proj-3',
      title: 'LUMEN',
      category: '3D / Interactive Experience',
      layout: 'normal',
      theme: 'midnight',
      image: '',
      link: 'https://github.com/AGzDeepak/visionx-web-portfolio',
      order: 3,
      createdAt: new Date().toISOString()
    },
    {
      id: 'proj-4',
      title: 'NEXUS',
      category: 'SaaS / Product Design',
      layout: 'normal',
      theme: 'crimson',
      image: '',
      link: 'https://github.com/AGzDeepak/visionx-web-portfolio',
      order: 4,
      createdAt: new Date().toISOString()
    }
  ];

  async function _checkAndSeedDatabase() {
    if (!isLive() || !db) return;
    try {
      const snapshot = await db.collection('projects').get();
      if (snapshot.empty) {
        console.log('[VisionX Firebase] Seeding initial flagship projects into Firestore...');
        const batch = db.batch();
        SEED_PROJECTS.forEach(p => {
          const ref = db.collection('projects').doc(p.id);
          batch.set(ref, p);
        });
        await batch.commit();
        console.log('[VisionX Firebase] Flagship projects successfully seeded to Firestore database!');
      }
    } catch (err) {
      console.warn('[VisionX Firebase] Database check/seed note:', err.message);
    }
  }

  function subscribeProjects(onProjectsUpdate, onError) {
    if (isLive() && db) {
      try {
        return db.collection('projects').onSnapshot(
          (snapshot) => {
            if (!snapshot.empty) {
              const projects = [];
              snapshot.forEach(doc => {
                projects.push({ id: doc.id, ...doc.data() });
              });
              // Sort by order or createdAt
              projects.sort((a, b) => (a.order || 99) - (b.order || 99));
              onProjectsUpdate(projects);
            }
          },
          (err) => {
            console.warn('[VisionX Firebase] Firestore projects onSnapshot note:', err.message);
            if (onError) onError(err);
          }
        );
      } catch (e) {
        if (onError) onError(e);
      }
    }
    return null;
  }

  
  async function syncAllProjectsToFirestore(customProjects) {
    if (!isLive() || !db) return { success: false, error: 'Firebase Firestore is not initialized yet. Please make sure Firestore Database is created in Firebase Console.' };
    try {
      const list = (customProjects && customProjects.length > 0) ? customProjects : SEED_PROJECTS;
      const batch = db.batch();
      list.forEach((p, idx) => {
        const id = p.id || ('proj-' + (idx + 1));
        const ref = db.collection('projects').doc(id);
        batch.set(ref, {
          title: p.title,
          category: p.category,
          layout: p.layout || 'normal',
          theme: p.theme || 'cosmic',
          image: p.image || '',
          link: p.link || 'https://github.com/AGzDeepak/visionx-web-portfolio',
          order: idx + 1,
          updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
          createdAt: p.createdAt || firebase.firestore.FieldValue.serverTimestamp()
        }, { merge: true });
      });
      await batch.commit();
      console.log('[VisionX Firebase] All existing works synced to Firestore database!');
      return { success: true, count: list.length };
    } catch (err) {
      console.error('[VisionX Firebase] Sync works error:', err);
      return { success: false, error: err.message };
    }
  }

  async function saveProject(projectData) {
    if (isLive() && db) {
      try {
        const id = projectData.id || ('proj-' + Date.now());
        const dataToSave = {
          title: projectData.title,
          category: projectData.category,
          layout: projectData.layout || 'normal',
          theme: projectData.theme || 'cosmic',
          image: projectData.image || '',
          link: projectData.link || 'https://github.com/AGzDeepak/visionx-web-portfolio',
          order: projectData.order || Date.now(),
          updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
          createdAt: projectData.createdAt || firebase.firestore.FieldValue.serverTimestamp()
        };

        await db.collection('projects').doc(id).set(dataToSave, { merge: true });
        console.log('[VisionX Firebase] Project saved to Firestore database:', id);
        return { success: true, id };
      } catch (err) {
        console.warn('[VisionX Firebase] Save project error:', err.message);
        return { success: false, error: err.message };
      }
    }
    return { success: false, fallback: true };
  }

  async function deleteProject(projectId) {
    if (isLive() && db) {
      try {
        await db.collection('projects').doc(projectId).delete();
        console.log('[VisionX Firebase] Project deleted from Firestore database:', projectId);
        return { success: true };
      } catch (err) {
        console.warn('[VisionX Firebase] Delete project error:', err.message);
        return { success: false, error: err.message };
      }
    }
    return { success: false, fallback: true };
  }

  // =========================================================================
  // Firestore Client Reviews Management
  // =========================================================================

  function subscribeReviews(onReviewsUpdate, onError) {
    if (isLive() && db) {
      try {
        return db.collection('reviews').onSnapshot(
          (snapshot) => {
            if (!snapshot.empty) {
              const reviews = [];
              snapshot.forEach(doc => {
                reviews.push({ id: doc.id, ...doc.data() });
              });
              onReviewsUpdate(reviews);
            }
          },
          (err) => {
            console.warn('[VisionX Firebase] Reviews onSnapshot note:', err.message);
            if (onError) onError(err);
          }
        );
      } catch (e) {
        if (onError) onError(e);
      }
    }
    return null;
  }

  async function saveReview(reviewData) {
    if (isLive() && db) {
      try {
        const id = reviewData.id || ('rev-' + Date.now());
        const dataToSave = {
          name: reviewData.name,
          role: reviewData.role,
          rating: Number(reviewData.rating) || 5,
          text: reviewData.text,
          date: reviewData.date || 'Recent',
          verified: true,
          timestamp: firebase.firestore.FieldValue.serverTimestamp()
        };

        await db.collection('reviews').doc(id).set(dataToSave);
        console.log('[VisionX Firebase] Review saved to Firestore database:', id);
        return { success: true, id };
      } catch (err) {
        console.warn('[VisionX Firebase] Save review error:', err.message);
        return { success: false, error: err.message };
      }
    }
    return { success: false, fallback: true };
  }

  // =========================================================================
  // Firebase Authentication & Executive Admin Authorization
  // =========================================================================

  async function loginAdmin(email, password) {
    if (isLive() && auth) {
      try {
        const userCredential = await auth.signInWithEmailAndPassword(email, password);
        return { success: true, user: userCredential.user };
      } catch (err) {
        return { success: false, error: err.message };
      }
    }
    return { success: true, fallback: true };
  }

  async function logoutAdmin() {
    if (isLive() && auth) {
      try {
        await auth.signOut();
        return { success: true };
      } catch (err) {
        return { success: false, error: err.message };
      }
    }
    return { success: true, fallback: true };
  }

  // Auto-init on script load
  init();

  return {
    init: init,
    isLive: isLive,
    getConfig: getConfig,
    saveConfig: saveConfig,
    subscribeProjects: subscribeProjects,
    syncAllProjectsToFirestore: syncAllProjectsToFirestore,
    saveProject: saveProject,
    deleteProject: deleteProject,
    subscribeReviews: subscribeReviews,
    saveReview: saveReview,
    loginAdmin: loginAdmin,
    logoutAdmin: logoutAdmin
  };

})();
