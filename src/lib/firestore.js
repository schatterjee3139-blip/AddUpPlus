// Firestore helper functions for user data
import {
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  collection,
  onSnapshot,
} from 'firebase/firestore';
import { db } from './firebase';

// Get user document reference
const getUserDocRef = (userId) => {
  if (!userId) return null;
  return doc(db, 'users', userId);
};

// Get user data
export const getUserData = async (userId) => {
  if (!userId) return null;
  try {
    const userRef = getUserDocRef(userId);
    const userSnap = await getDoc(userRef);
    if (userSnap.exists()) {
      return userSnap.data();
    }
    return null;
  } catch (error) {
    console.error('Error getting user data:', error);
    return null;
  }
};

// Initialize user document with default data
export const initializeUserData = async (userId, userData = {}) => {
  if (!userId) return;
  try {
    const userRef = getUserDocRef(userId);
    const userSnap = await getDoc(userRef);
    
    if (!userSnap.exists()) {
      const defaultData = {
        studyMetrics: {
          flashcardsReviewed: 0,
          flashcardsCorrect: 0,
          quizzesCompleted: 0,
          totalQuizQuestions: 0,
          totalQuizCorrect: 0,
          aiInteractions: 0,
          studyMinutes: 0,
          dailyStudyTime: {},
          weeklyStats: [],
        },
        courses: {
          joinedCourseIds: [],
          courseBlueprints: {},
          courseWorkspaceData: {},
          courseYouTubeVideos: {},
        },
        workspace: {
          moduleDetailedContent: {},
          moduleVideos: {},
          expandedModules: {},
        },
        planner: {
          eventsByDate: {},
        },
        flashcards: {
          deck: [],
        },
        aiChat: {
          messages: [],
        },
        goals: [],
        profile: {
          firstName: userData.firstName || userData.displayName?.split(' ')[0] || '',
          lastName: userData.lastName || userData.displayName?.split(' ')[1] || '',
          email: userData.email || '',
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      await setDoc(userRef, defaultData);
      console.log('Created new user document for:', userId);
    } else {
      console.log('User document already exists for:', userId);
    }
  } catch (error) {
    console.error('Error initializing user data:', error);
    throw error;
  }
};

// Update user data (creates document if it doesn't exist)
export const updateUserData = async (userId, data) => {
  if (!userId) return;
  try {
    const userRef = getUserDocRef(userId);
    // Use setDoc with merge to create or update
    await setDoc(userRef, {
      ...data,
      updatedAt: new Date().toISOString(),
    }, { merge: true });
  } catch (error) {
    console.error('Error updating user data:', error);
    throw error; // Re-throw so callers can handle it
  }
};

// Subscribe to user data changes
export const subscribeToUserData = (userId, callback) => {
  if (!userId) {
    console.warn('⚠️ subscribeToUserData called without userId');
    return () => {};
  }
  try {
    console.log('🔵 Setting up onSnapshot for user:', userId);
    const userRef = getUserDocRef(userId);
    return onSnapshot(
      userRef,
      (doc) => {
        console.log('📡 onSnapshot fired for user:', userId, 'exists:', doc.exists());
        if (doc.exists()) {
          const data = doc.data();
          console.log('📦 Document data:', data);
          callback(data);
        } else {
          console.log('⚠️ Document does not exist');
          callback(null);
        }
      },
      (error) => {
        console.error('❌ onSnapshot error:', error);
      }
    );
  } catch (error) {
    console.error('❌ Error subscribing to user data:', error);
    return () => {};
  }
};

// Update study metrics
export const updateStudyMetrics = async (userId, metrics) => {
  try {
    await updateUserData(userId, {
      'studyMetrics': metrics,
    });
    console.log('Study metrics updated successfully for user:', userId);
  } catch (error) {
    console.error('Error updating study metrics:', error);
    throw error;
  }
};

// Update course data
export const updateCourseData = async (userId, courseData) => {
  try {
    await updateUserData(userId, {
      'courses': courseData,
    });
    // Only log on error to reduce console noise
  } catch (error) {
    console.error('Error updating course data:', error);
    throw error;
  }
};

// Update workspace data
export const updateWorkspaceData = async (userId, workspaceData) => {
  try {
    await updateUserData(userId, {
      'workspace': workspaceData,
    });
    // Only log on error to reduce console noise
  } catch (error) {
    console.error('Error updating workspace data:', error);
    throw error;
  }
};

// Update planner data
export const updatePlannerData = async (userId, plannerData) => {
  try {
    await updateUserData(userId, {
      'planner': plannerData,
    });
    // Only log on error to reduce console noise
  } catch (error) {
    console.error('Error updating planner data:', error);
    throw error;
  }
};

// Update flashcards data
export const updateFlashcardsData = async (userId, flashcardsData) => {
  try {
    await updateUserData(userId, {
      'flashcards': flashcardsData,
    });
    // Only log on error to reduce console noise
  } catch (error) {
    console.error('Error updating flashcards data:', error);
    throw error;
  }
};

// Update AI chat data
export const updateAIChatData = async (userId, chatData) => {
  try {
    await updateUserData(userId, {
      'aiChat': chatData,
    });
    // Only log on error to reduce console noise
  } catch (error) {
    console.error('Error updating AI chat data:', error);
    throw error;
  }
};

// Submit tutor request
export const submitTutorRequest = async (tutorRequest) => {
  try {
    const tutorRequestsRef = collection(db, 'tutorRequests');
    await setDoc(doc(tutorRequestsRef), {
      ...tutorRequest,
      createdAt: new Date().toISOString(),
      status: 'pending',
    });
    console.log('Tutor request submitted successfully');
  } catch (error) {
    console.error('Error submitting tutor request:', error);
    throw error;
  }
};

// Get all tutor requests (for admin view)
export const getTutorRequests = async () => {
  try {
    const tutorRequestsRef = collection(db, 'tutorRequests');
    const snapshot = await getDocs(tutorRequestsRef);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    console.error('Error getting tutor requests:', error);
    throw error;
  }
};

// Submit tutor review
export const submitTutorReview = async (review) => {
  try {
    const tutorReviewsRef = collection(db, 'tutorReviews');
    await setDoc(doc(tutorReviewsRef), {
      ...review,
      createdAt: new Date().toISOString(),
    });
    console.log('Tutor review submitted successfully');
  } catch (error) {
    // If permission denied, provide helpful error message
    if (error.code === 'permission-denied') {
      console.error('❌ Permission denied for tutor reviews. Please update Firebase security rules.');
      console.error('Go to Firebase Console > Firestore Database > Rules');
      console.error('Add this rule:');
      console.error(`
match /tutorReviews/{reviewId} {
  allow read: if true;
  allow write: if true;
}`);
      const permissionError = new Error('Permission denied. Please update Firebase security rules to allow tutor reviews. Check the console for instructions.');
      permissionError.code = 'permission-denied';
      throw permissionError;
    }
    console.error('Error submitting tutor review:', error);
    throw error;
  }
};

// Get all reviews for a tutor
export const getTutorReviews = async (tutorId) => {
  try {
    const tutorReviewsRef = collection(db, 'tutorReviews');
    const snapshot = await getDocs(tutorReviewsRef);
    const allReviews = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));
    // Filter reviews for this tutor
    return allReviews.filter(review => review.tutorId === tutorId);
  } catch (error) {
    // If permission denied, return empty array instead of throwing
    if (error.code === 'permission-denied') {
      console.warn('Permission denied for tutor reviews, returning empty array');
      return [];
    }
    console.error('Error getting tutor reviews:', error);
    return [];
  }
};

// Subscribe to tutor reviews (real-time)
export const subscribeToTutorReviews = (tutorId, callback) => {
  try {
    const tutorReviewsRef = collection(db, 'tutorReviews');
    return onSnapshot(
      tutorReviewsRef,
      (snapshot) => {
        const reviews = snapshot.docs
          .map(doc => ({
            id: doc.id,
            ...doc.data(),
          }))
          .filter(review => review.tutorId === tutorId);
        callback(reviews);
      },
      (error) => {
        // Handle permission errors gracefully
        if (error.code === 'permission-denied') {
          console.warn('Permission denied for tutor reviews subscription, returning empty array');
          callback([]);
        } else {
          console.error('Error in tutor reviews subscription:', error);
          callback([]);
        }
      }
    );
  } catch (error) {
    console.error('Error subscribing to tutor reviews:', error);
    // Return empty array on error
    callback([]);
    return () => {};
  }
};

