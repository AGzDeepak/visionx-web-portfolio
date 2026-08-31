/* ==========================================================================
   VisionX Web Technology — Firebase Cloud Database & Authentication Engine
   ========================================================================== */

'use strict';

const VisionXFirebase = (function () {

  // Default / Starter Firebase Config
  // (You can replace these keys or configure them live via the Executive Portal Cloud Settings tab)
  const DEFAULT_CONFIG = {
    apiKey: "AIzaSyVisionXDefaultApiKeyPlaceholder",
    authDomain: "visionx-web-portfolio.firebaseapp.com",
    projectId: "visionx-web-portfolio",
    storageBucket: "visionx-web-portfolio.appspot.com",
    messagingSenderId: "109876543210",
    appId: "1:109876543210:web:abcdef1234567890"
  };

  let app = null;
  let db = null;
  let auth = null;
  let isConnected = false;
  let activeConfig = null;

  function init() {
    try {
      const savedConfig = localStorage.getItem('visionx_firebase_config');
      activeConfig = savedConfig ? JSON.parse(savedConfig) : DEFAULT_CONFIG;

      // Check if Firebase SDK is loaded
      if (typeof firebase !== 'undefined' && activeConfig && activeConfig.apiKey) {
        if (!firebase.apps.length) {
          app = firebase.initializeApp(activeConfig);
        } else {
          app = firebase.app();
        }

        db = firebase.firestore();
        auth = firebase.auth();

        // Enable offline persistence if supported
        try {
          db.enablePersistence({ synchronizeTabs: true }).catch(() => {});
        } catch (e) {}

        isConnected = true;
        console.log('[VisionX Firebase] Cloud Firestore & Auth initialized successfully.');
      } else {
        console.warn('[VisionX Firebase] SDK not loaded or config missing. Running in local mode.');
      }
    } catch (err) {
      console.warn('[VisionX Firebase] Initialization note (running local mode):', err.message);
      isConnected = false;
    }
  }

  function isLive() {
    return isConnected && db !== null && activeConfig && !activeConfig.apiKey.includes('Placeholder');
  }

  function getConfig() {
    return activeConfig || DEFAULT_CONFIG;
  }

  function saveConfig(newConfig) {
    activeConfig = { ...newConfig };
    localStorage.setItem('visionx_firebase_config', JSON.stringify(activeConfig));
    localStorage.setItem('visionx_firebase_configured', 'true');
    // Reinitialize
    try {
      if (typeof firebase !== 'undefined') {
        if (firebase.apps.length) {
          firebase.app().delete().then(() => {
            init();
            window.location.reload();
          });
        } else {
          init();
          window.location.reload();
        }
      }
    } catch (e) {
      window.location.reload();
    }
  }

  // =========================================================================
  // Firestore Project Work Management
  // =========================================================================

  function subscribeProjects(onProjectsUpdate, onError) {
    if (isLive() && db) {
      try {
        return db.collection('projects').orderBy('createdAt', 'desc').onSnapshot(
          (snapshot) => {
            if (!snapshot.empty) {
              const projects = [];
              snapshot.forEach(doc => {
                projects.push({ id: doc.id, ...doc.data() });
              });
              onProjectsUpdate(projects);
            }
          },
          (err) => {
            console.warn('[VisionX Firebase] Projects onSnapshot note:', err.message);
            if (onError) onError(err);
          }
        );
      } catch (e) {
        if (onError) onError(e);
      }
    }
    return null;
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
          link: projectData.link || 'https://github.com/AGzDeepak',
          updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
          createdAt: projectData.createdAt || firebase.firestore.FieldValue.serverTimestamp()
        };

        await db.collection('projects').doc(id).set(dataToSave, { merge: true });
        console.log('[VisionX Firebase] Project saved to Firestore:', id);
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
        console.log('[VisionX Firebase] Project deleted from Firestore:', projectId);
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
        return db.collection('reviews').orderBy('timestamp', 'desc').onSnapshot(
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
        console.log('[VisionX Firebase] Review saved to Firestore:', id);
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
    saveProject: saveProject,
    deleteProject: deleteProject,
    subscribeReviews: subscribeReviews,
    saveReview: saveReview,
    loginAdmin: loginAdmin,
    logoutAdmin: logoutAdmin
  };

})();
