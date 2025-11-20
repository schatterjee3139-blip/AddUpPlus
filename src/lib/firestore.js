// Firestore helper functions for user data
import {
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  collection,
  onSnapshot,
  query,
  where,
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
    quotaUsage.reads++;
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
        scheduledAppointments: [],
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

// Global quota state management (must be defined before use)
const globalQuotaState = {
  isExceeded: false,
  exceededAt: null,
  cooldownPeriod: 60000, // 60 seconds cooldown
};

// Check if we should allow operations
const shouldAllowOperation = () => {
  if (!globalQuotaState.isExceeded) return true;
  
  const timeSinceExceeded = Date.now() - (globalQuotaState.exceededAt || 0);
  if (timeSinceExceeded > globalQuotaState.cooldownPeriod) {
    globalQuotaState.isExceeded = false;
    globalQuotaState.exceededAt = null;
    return true;
  }
  
  return false;
};

// Mark quota as exceeded
const markQuotaExceeded = () => {
  globalQuotaState.isExceeded = true;
  globalQuotaState.exceededAt = Date.now();
  console.warn('⚠️ Global quota exceeded. Pausing non-critical operations for 60 seconds.');
};

// Debounce queue for writes to prevent excessive operations
const writeQueue = new Map(); // userId -> { data, timeout, resolve, reject }
const WRITE_DEBOUNCE_MS = 3000; // Wait 3 seconds before writing (increased to reduce quota usage)
const MIN_WRITE_INTERVAL_MS = 5000; // Minimum time between writes (5 seconds)
const lastWriteTime = new Map(); // userId -> timestamp of last write
const isQuotaExceeded = new Map(); // userId -> boolean (track quota state per user)

// Update user data (creates document if it doesn't exist) - with debouncing and rate limiting
export const updateUserData = async (userId, data, immediate = false) => {
  if (!userId) return;
  
  // Check global quota state
  if (!shouldAllowOperation()) {
    return Promise.resolve(); // Resolve silently to prevent errors
  }
  
  // Check if quota is exceeded for this user - if so, skip writes
  if (isQuotaExceeded.get(userId)) {
    return Promise.resolve(); // Resolve silently to prevent errors
  }
  
  // If immediate, check rate limit first
  if (immediate) {
    const lastWrite = lastWriteTime.get(userId) || 0;
    const timeSinceLastWrite = Date.now() - lastWrite;
    
    // If too soon since last write, queue it instead
    if (timeSinceLastWrite < MIN_WRITE_INTERVAL_MS) {
      console.log('⚠️ Rate limiting immediate write, queuing instead');
      immediate = false; // Fall through to debounced write
    } else {
      try {
        const userRef = getUserDocRef(userId);
        await setDoc(userRef, {
          ...data,
          updatedAt: new Date().toISOString(),
        }, { merge: true });
        lastWriteTime.set(userId, Date.now());
        isQuotaExceeded.set(userId, false); // Reset quota flag on success
        quotaUsage.writes++;
        return;
      } catch (error) {
        if (error.code === 'resource-exhausted') {
          markQuotaExceeded();
          isQuotaExceeded.set(userId, true);
          // Auto-reset after 60 seconds
          setTimeout(() => {
            isQuotaExceeded.set(userId, false);
          }, 60000);
        }
        throw error;
      }
    }
  }
  
  return new Promise((resolve, reject) => {
    // Clear existing timeout for this user
    const existing = writeQueue.get(userId);
    if (existing && existing.timeout) {
      clearTimeout(existing.timeout);
      // Resolve previous promise
      if (existing.resolve) existing.resolve();
    }

    // Merge new data with existing queued data
    const queuedData = existing?.data || {};
    const mergedData = { ...queuedData, ...data };

    // Set new timeout
    const timeout = setTimeout(async () => {
      writeQueue.delete(userId);
      
      // Check rate limit
      const lastWrite = lastWriteTime.get(userId) || 0;
      const timeSinceLastWrite = Date.now() - lastWrite;
      
      if (timeSinceLastWrite < MIN_WRITE_INTERVAL_MS) {
        // Too soon, reschedule
        const delay = MIN_WRITE_INTERVAL_MS - timeSinceLastWrite;
        const newTimeout = setTimeout(async () => {
          await performWrite(userId, mergedData, resolve, reject);
        }, delay);
        writeQueue.set(userId, { data: mergedData, timeout: newTimeout, resolve, reject });
        return;
      }
      
      await performWrite(userId, mergedData, resolve, reject);
    }, WRITE_DEBOUNCE_MS);

    writeQueue.set(userId, { data: mergedData, timeout, resolve, reject });
  });
};

// Quota usage tracking (for monitoring)
const quotaUsage = {
  reads: 0,
  writes: 0,
  deletes: 0,
  lastReset: Date.now(),
};

// Reset quota tracking daily
const resetQuotaTracking = () => {
  const now = Date.now();
  const oneDay = 24 * 60 * 60 * 1000;
  if (now - quotaUsage.lastReset > oneDay) {
    quotaUsage.reads = 0;
    quotaUsage.writes = 0;
    quotaUsage.deletes = 0;
    quotaUsage.lastReset = now;
  }
};

// Get current quota usage stats
export const getQuotaUsage = () => {
  resetQuotaTracking();
  return {
    reads: quotaUsage.reads,
    writes: quotaUsage.writes,
    deletes: quotaUsage.deletes,
    total: quotaUsage.reads + quotaUsage.writes + quotaUsage.deletes,
  };
};

// Helper function to perform the actual write
const performWrite = async (userId, data, resolve, reject) => {
  try {
    const userRef = getUserDocRef(userId);
    await setDoc(userRef, {
      ...data,
      updatedAt: new Date().toISOString(),
    }, { merge: true });
    lastWriteTime.set(userId, Date.now());
    isQuotaExceeded.set(userId, false); // Reset quota flag on success
    quotaUsage.writes++;
    resolve();
  } catch (error) {
    // Handle quota exceeded error gracefully
    if (error.code === 'resource-exhausted') {
      markQuotaExceeded();
      isQuotaExceeded.set(userId, true);
      // Auto-reset after 60 seconds
      setTimeout(() => {
        isQuotaExceeded.set(userId, false);
      }, 60000);
      resolve(); // Resolve instead of rejecting to prevent app errors
    } else {
      console.error('Error updating user data:', error);
      reject(error);
    }
  }
};

// Shared subscription manager to prevent multiple subscriptions to the same document
// This prevents quota exhaustion when multiple components subscribe to the same user data
// Instead of creating N subscriptions, we create 1 subscription and share it across all callbacks
const subscriptionManager = new Map(); // userId -> unsubscribe function
const subscriptionCallbacks = new Map(); // userId -> Set of callbacks

// Subscribe to user data changes (optimized with shared subscription)
export const subscribeToUserData = (userId, callback) => {
  if (!userId) {
    return () => {};
  }

  // Add callback to the list for this user
  if (!subscriptionCallbacks.has(userId)) {
    subscriptionCallbacks.set(userId, new Set());
  }
  subscriptionCallbacks.get(userId).add(callback);

  // If subscription already exists, just return unsubscribe function
  if (subscriptionManager.has(userId)) {
    return () => {
      const callbacks = subscriptionCallbacks.get(userId);
      if (callbacks) {
        callbacks.delete(callback);
        // If no more callbacks, clean up the subscription
        if (callbacks.size === 0) {
          const unsubscribe = subscriptionManager.get(userId);
          if (unsubscribe) {
            unsubscribe();
          }
          subscriptionManager.delete(userId);
          subscriptionCallbacks.delete(userId);
        }
      }
    };
  }

  // Create new shared subscription
  try {
    const userRef = getUserDocRef(userId);
    const isDev = import.meta.env.DEV;
    
    // Store subscription info for potential pausing
    let subscriptionActive = true;
    
    const unsubscribe = onSnapshot(
      userRef,
      (doc) => {
        // Skip if quota exceeded or subscription paused
        if (!shouldAllowOperation() || !subscriptionActive) {
          return;
        }
        
        const data = doc.exists() ? doc.data() : null;
        // Call all registered callbacks
        const callbacks = subscriptionCallbacks.get(userId);
        if (callbacks) {
          callbacks.forEach(cb => {
            try {
              cb(data);
            } catch (error) {
              if (isDev) {
                console.error('Error in subscription callback:', error);
              }
            }
          });
        }
      },
      (error) => {
        // Handle quota exceeded error gracefully
        if (error.code === 'resource-exhausted') {
          markQuotaExceeded();
          subscriptionActive = false; // Pause this subscription
          
          // Temporarily pause subscription updates
          const callbacks = subscriptionCallbacks.get(userId);
          if (callbacks) {
            // Notify callbacks that quota is exceeded
            callbacks.forEach(cb => {
              try {
                cb(null); // Pass null to indicate no data available
              } catch (err) {
                if (isDev) {
                  console.error('Error in subscription callback:', err);
                }
              }
            });
          }
          
          // Resume after cooldown
          setTimeout(() => {
            subscriptionActive = true;
          }, globalQuotaState.cooldownPeriod);
        } else if (isDev) {
          console.error('❌ onSnapshot error:', error);
        }
      }
    );

    subscriptionManager.set(userId, unsubscribe);

    // Return unsubscribe function
    return () => {
      const callbacks = subscriptionCallbacks.get(userId);
      if (callbacks) {
        callbacks.delete(callback);
        // If no more callbacks, clean up the subscription
        if (callbacks.size === 0) {
          unsubscribe();
          subscriptionManager.delete(userId);
          subscriptionCallbacks.delete(userId);
        }
      }
    };
  } catch (error) {
    console.error('❌ Error subscribing to user data:', error);
    // Clean up on error
    const callbacks = subscriptionCallbacks.get(userId);
    if (callbacks) {
      callbacks.delete(callback);
      if (callbacks.size === 0) {
        subscriptionCallbacks.delete(userId);
      }
    }
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
export const updatePlannerData = async (userId, plannerData, immediate = false) => {
  try {
    await updateUserData(userId, {
      'planner': plannerData,
    }, immediate);
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
    // Add timeout to prevent hanging
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Request timeout')), 10000); // 10 second timeout
    });

    const tutorRequestsRef = collection(db, 'tutorRequests');
    const newDocRef = doc(tutorRequestsRef);
    
    const writePromise = setDoc(newDocRef, {
      ...tutorRequest,
      createdAt: new Date().toISOString(),
      status: 'pending',
    });

    await Promise.race([writePromise, timeoutPromise]);
    console.log('Tutor request submitted successfully');
    return { success: true, id: newDocRef.id };
  } catch (error) {
    console.error('Error submitting tutor request:', error);
    // Don't throw - just log, since this is now non-critical
    // The appointment is already saved to localStorage
    return { success: false, error: error.message };
  }
};

// Add scheduled appointment to user data (optimized for speed)
export const addScheduledAppointment = async (userId, appointment) => {
  if (!userId) return;
  try {
    const userRef = getUserDocRef(userId);
    
    // Use updateDoc directly for faster writes (no read needed if we use arrayUnion)
    // But since we need to sort, we'll do a quick read-write
    // However, we can optimize by using updateDoc instead of setDoc
    const userSnap = await getDoc(userRef);
    
    let scheduledAppointments = [];
    if (userSnap.exists()) {
      const userData = userSnap.data();
      scheduledAppointments = userData.scheduledAppointments || [];
    }
    
    // Add new appointment
    const appointmentWithId = {
      ...appointment,
      id: appointment.id || Date.now().toString(),
      createdAt: new Date().toISOString(),
    };
    
    scheduledAppointments.push(appointmentWithId);
    
    // Sort by scheduled date/time (upcoming first)
    scheduledAppointments.sort((a, b) => {
      const dateA = new Date(a.scheduledDateTime || a.scheduledDate);
      const dateB = new Date(b.scheduledDateTime || b.scheduledDate);
      return dateA - dateB;
    });
    
    // Use updateDoc directly for faster writes (no merge overhead)
    await updateDoc(userRef, {
      scheduledAppointments,
      updatedAt: new Date().toISOString(),
    });
    console.log('Scheduled appointment added successfully');
  } catch (error) {
    // If document doesn't exist, fall back to setDoc
    if (error.code === 'not-found' || error.message?.includes('No document')) {
      const appointmentWithId = {
        ...appointment,
        id: appointment.id || Date.now().toString(),
        createdAt: new Date().toISOString(),
      };
      await setDoc(userRef, {
        scheduledAppointments: [appointmentWithId],
        updatedAt: new Date().toISOString(),
      }, { merge: true });
    } else {
      console.error('Error adding scheduled appointment:', error);
      throw error;
    }
  }
};

// Get scheduled appointments for a user
export const getScheduledAppointments = async (userId) => {
  if (!userId) return [];
  try {
    const userData = await getUserData(userId);
    if (userData && userData.scheduledAppointments) {
      // Filter out past appointments
      const now = new Date();
      return userData.scheduledAppointments.filter(apt => {
        const aptDate = new Date(apt.scheduledDateTime || apt.scheduledDate);
        return aptDate >= now;
      });
    }
    return [];
  } catch (error) {
    console.error('Error getting scheduled appointments:', error);
    return [];
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

// Shared subscription manager for tutor reviews (similar to user data)
const tutorReviewsSubscriptions = new Map(); // tutorId -> { unsubscribe, callbacks }
const tutorReviewsCallbacks = new Map(); // tutorId -> Set of callbacks

// Subscribe to tutor reviews (optimized with shared subscription and query)
export const subscribeToTutorReviews = (tutorId, callback) => {
  if (!tutorId) {
    callback([]);
    return () => {};
  }

  // Add callback to the list for this tutor
  if (!tutorReviewsCallbacks.has(tutorId)) {
    tutorReviewsCallbacks.set(tutorId, new Set());
  }
  tutorReviewsCallbacks.get(tutorId).add(callback);

  // If subscription already exists, just return unsubscribe function
  if (tutorReviewsSubscriptions.has(tutorId)) {
    return () => {
      const callbacks = tutorReviewsCallbacks.get(tutorId);
      if (callbacks) {
        callbacks.delete(callback);
        // If no more callbacks, clean up the subscription
        if (callbacks.size === 0) {
          const subscription = tutorReviewsSubscriptions.get(tutorId);
          if (subscription && subscription.unsubscribe) {
            subscription.unsubscribe();
          }
          tutorReviewsSubscriptions.delete(tutorId);
          tutorReviewsCallbacks.delete(tutorId);
        }
      }
    };
  }

  // Create new shared subscription with query (more efficient than filtering all reviews)
  try {
    const tutorReviewsRef = collection(db, 'tutorReviews');
    // Use query to only get reviews for this tutor (more efficient)
    const q = query(tutorReviewsRef, where('tutorId', '==', tutorId));
    const isDev = import.meta.env.DEV;
    
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const reviews = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));
        
        // Call all registered callbacks
        const callbacks = tutorReviewsCallbacks.get(tutorId);
        if (callbacks) {
          callbacks.forEach(cb => {
            try {
              cb(reviews);
            } catch (error) {
              if (isDev) {
                console.error('Error in tutor reviews callback:', error);
              }
            }
          });
        }
      },
      (error) => {
        // Handle quota exceeded and permission errors gracefully
        if (error.code === 'resource-exhausted') {
          console.warn('⚠️ Firestore quota exceeded for tutor reviews. Please wait before retrying.');
          const callbacks = tutorReviewsCallbacks.get(tutorId);
          if (callbacks) {
            callbacks.forEach(cb => cb([]));
          }
        } else if (error.code === 'permission-denied') {
          console.warn('Permission denied for tutor reviews subscription');
          const callbacks = tutorReviewsCallbacks.get(tutorId);
          if (callbacks) {
            callbacks.forEach(cb => cb([]));
          }
        } else if (isDev) {
          console.error('Error in tutor reviews subscription:', error);
        }
      }
    );

    tutorReviewsSubscriptions.set(tutorId, { unsubscribe });

    // Return unsubscribe function
    return () => {
      const callbacks = tutorReviewsCallbacks.get(tutorId);
      if (callbacks) {
        callbacks.delete(callback);
        // If no more callbacks, clean up the subscription
        if (callbacks.size === 0) {
          unsubscribe();
          tutorReviewsSubscriptions.delete(tutorId);
          tutorReviewsCallbacks.delete(tutorId);
        }
      }
    };
  } catch (error) {
    console.error('Error subscribing to tutor reviews:', error);
    // Clean up on error
    const callbacks = tutorReviewsCallbacks.get(tutorId);
    if (callbacks) {
      callbacks.delete(callback);
      if (callbacks.size === 0) {
        tutorReviewsCallbacks.delete(tutorId);
      }
    }
    callback([]);
    return () => {};
  }
};

// ==================== TEACHER PROFILES ====================

// Save teacher profile
export const saveTeacherProfile = async (userId, teacherProfile) => {
  if (!userId) return;
  try {
    const userRef = getUserDocRef(userId);
    const userSnap = await getDoc(userRef);
    
    let teacherProfiles = [];
    if (userSnap.exists()) {
      const userData = userSnap.data();
      teacherProfiles = userData.teacherProfiles || [];
    }
    
    // Check if teacher already exists
    const existingIndex = teacherProfiles.findIndex(t => t.id === teacherProfile.id);
    if (existingIndex >= 0) {
      teacherProfiles[existingIndex] = teacherProfile;
    } else {
      teacherProfiles.push(teacherProfile);
    }
    
    await updateUserData(userId, {
      teacherProfiles,
    }, true); // Immediate save for teacher profiles
  } catch (error) {
    console.error('Error saving teacher profile:', error);
    throw error;
  }
};

// Get teacher profiles
export const getTeacherProfiles = async (userId) => {
  if (!userId) return [];
  try {
    const userData = await getUserData(userId);
    return userData?.teacherProfiles || [];
  } catch (error) {
    console.error('Error getting teacher profiles:', error);
    return [];
  }
};

// Update teacher profile
export const updateTeacherProfile = async (userId, teacherId, updates) => {
  if (!userId || !teacherId) return;
  try {
    const userRef = getUserDocRef(userId);
    const userSnap = await getDoc(userRef);
    
    if (!userSnap.exists()) {
      throw new Error('User data not found');
    }
    
    const userData = userSnap.data();
    const teacherProfiles = userData.teacherProfiles || [];
    
    const index = teacherProfiles.findIndex(t => t.id === teacherId);
    if (index >= 0) {
      teacherProfiles[index] = {
        ...teacherProfiles[index],
        ...updates,
        updatedAt: new Date().toISOString(),
      };
      
      await updateUserData(userId, {
        teacherProfiles,
      }, false);
    }
  } catch (error) {
    console.error('Error updating teacher profile:', error);
    throw error;
  }
};

// Delete teacher profile
export const deleteTeacherProfile = async (userId, teacherId) => {
  if (!userId || !teacherId) return;
  try {
    const userRef = getUserDocRef(userId);
    const userSnap = await getDoc(userRef);
    
    if (!userSnap.exists()) {
      return;
    }
    
    const userData = userSnap.data();
    const teacherProfiles = (userData.teacherProfiles || []).filter(t => t.id !== teacherId);
    
    await updateUserData(userId, {
      teacherProfiles,
    }, true); // Immediate save for teacher profiles
  } catch (error) {
    console.error('Error deleting teacher profile:', error);
    throw error;
  }
};

