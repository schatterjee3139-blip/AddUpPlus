// localStorage-based storage system to replace Firestore
// This provides the same API as firestore.js but uses localStorage instead

// Get storage key for user data
const getUserStorageKey = (userId) => {
  if (!userId) return null;
  return `user_${userId}`;
};

// Get user data from localStorage
export const getUserData = async (userId) => {
  if (!userId) return null;
  try {
    const storageKey = getUserStorageKey(userId);
    const dataStr = localStorage.getItem(storageKey);
    if (dataStr) {
      return JSON.parse(dataStr);
    }
    return null;
  } catch (error) {
    console.error('Error getting user data from localStorage:', error);
    return null;
  }
};

// Initialize user document with default data
export const initializeUserData = async (userId, userData = {}) => {
  if (!userId) return;
  try {
    const storageKey = getUserStorageKey(userId);
    const existingDataStr = localStorage.getItem(storageKey);
    
    if (!existingDataStr) {
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
        role: userData.role || 'student',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      localStorage.setItem(storageKey, JSON.stringify(defaultData));
      console.log('Created new user document in localStorage for:', userId);
    } else {
      console.log('User document already exists in localStorage for:', userId);
    }
  } catch (error) {
    console.error('Error initializing user data in localStorage:', error);
    throw error;
  }
};

// Update user data (creates document if it doesn't exist)
export const updateUserData = async (userId, data, immediate = false) => {
  if (!userId) return;
  
  try {
    const storageKey = getUserStorageKey(userId);
    const existingDataStr = localStorage.getItem(storageKey);
    let existingData = {};
    
    if (existingDataStr) {
      existingData = JSON.parse(existingDataStr);
    }
    
    const updatedData = {
      ...existingData,
      ...data,
      updatedAt: new Date().toISOString(),
    };
    
    localStorage.setItem(storageKey, JSON.stringify(updatedData));
  } catch (error) {
    console.error('Error updating user data in localStorage:', error);
    throw error;
  }
};

// Subscribe to user data changes (simulate Firestore subscription with polling)
const subscriptionManager = new Map(); // userId -> { intervalId, callbacks }
const subscriptionCallbacks = new Map(); // userId -> Set of callbacks
const POLL_INTERVAL = 1000; // Poll every 1 second

export const subscribeToUserData = (userId, callback) => {
  if (!userId) {
    callback(null);
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
          const subscription = subscriptionManager.get(userId);
          if (subscription && subscription.intervalId) {
            clearInterval(subscription.intervalId);
          }
          subscriptionManager.delete(userId);
          subscriptionCallbacks.delete(userId);
        }
      }
    };
  }

  // Create new shared subscription with polling
  let lastData = null;
  
  const pollData = async () => {
    try {
      const data = await getUserData(userId);
      const dataStr = JSON.stringify(data);
      const lastDataStr = JSON.stringify(lastData);
      
      // Only call callbacks if data changed
      if (dataStr !== lastDataStr) {
        lastData = data;
        const callbacks = subscriptionCallbacks.get(userId);
        if (callbacks) {
          callbacks.forEach(cb => {
            try {
              cb(data);
            } catch (error) {
              console.error('Error in subscription callback:', error);
            }
          });
        }
      }
    } catch (error) {
      console.error('Error polling user data:', error);
    }
  };

  // Initial call
  pollData();
  
  // Set up polling interval
  const intervalId = setInterval(pollData, POLL_INTERVAL);
  subscriptionManager.set(userId, { intervalId });

  // Return unsubscribe function
  return () => {
    const callbacks = subscriptionCallbacks.get(userId);
    if (callbacks) {
      callbacks.delete(callback);
      // If no more callbacks, clean up the subscription
      if (callbacks.size === 0) {
        clearInterval(intervalId);
        subscriptionManager.delete(userId);
        subscriptionCallbacks.delete(userId);
      }
    }
  };
};

// Update study metrics
export const updateStudyMetrics = async (userId, metrics) => {
  try {
    await updateUserData(userId, {
      studyMetrics: metrics,
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
      courses: courseData,
    });
  } catch (error) {
    console.error('Error updating course data:', error);
    throw error;
  }
};

// Update workspace data
export const updateWorkspaceData = async (userId, workspaceData) => {
  try {
    await updateUserData(userId, {
      workspace: workspaceData,
    });
  } catch (error) {
    console.error('Error updating workspace data:', error);
    throw error;
  }
};

// Update planner data
export const updatePlannerData = async (userId, plannerData, immediate = false) => {
  try {
    await updateUserData(userId, {
      planner: plannerData,
    }, immediate);
  } catch (error) {
    console.error('Error updating planner data:', error);
    throw error;
  }
};

// Update flashcards data
export const updateFlashcardsData = async (userId, flashcardsData) => {
  try {
    await updateUserData(userId, {
      flashcards: flashcardsData,
    });
  } catch (error) {
    console.error('Error updating flashcards data:', error);
    throw error;
  }
};

// Update AI chat data
export const updateAIChatData = async (userId, chatData) => {
  try {
    await updateUserData(userId, {
      aiChat: chatData,
    });
  } catch (error) {
    console.error('Error updating AI chat data:', error);
    throw error;
  }
};

// Add scheduled appointment to user data
export const addScheduledAppointment = async (userId, appointment) => {
  if (!userId) return;
  try {
    const userData = await getUserData(userId);
    let scheduledAppointments = userData?.scheduledAppointments || [];
    
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
    
    await updateUserData(userId, {
      scheduledAppointments,
    });
    console.log('Scheduled appointment added successfully');
  } catch (error) {
    console.error('Error adding scheduled appointment:', error);
    throw error;
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

// Tutor-specific functions

/**
 * Get all students' data (for tutors)
 * Note: This searches localStorage for all user data
 */
export const getAllStudentsData = async () => {
  try {
    const students = [];
    const keys = Object.keys(localStorage);
    
    for (const key of keys) {
      if (key.startsWith('user_')) {
        try {
          const dataStr = localStorage.getItem(key);
          if (dataStr) {
            const data = JSON.parse(dataStr);
            // Only include users who are not tutors
            if (!data.role || data.role !== 'tutor') {
              const userId = key.replace('user_', '');
              students.push({
                id: userId,
                ...data,
              });
            }
          }
        } catch (error) {
          console.error(`Error parsing data for key ${key}:`, error);
        }
      }
    }
    
    return students;
  } catch (error) {
    console.error('Error getting all students data:', error);
    return [];
  }
};

/**
 * Get students scheduled with a specific tutor
 */
export const getStudentsScheduledWithTutor = async (tutorName) => {
  try {
    const allStudents = await getAllStudentsData();
    const studentsWithTutor = [];
    
    for (const student of allStudents) {
      const appointments = student.scheduledAppointments || [];
      const hasAppointmentWithTutor = appointments.some(apt => 
        apt.tutorName === tutorName || apt.tutor === tutorName
      );
      
      if (hasAppointmentWithTutor) {
        studentsWithTutor.push(student);
      }
    }
    
    return studentsWithTutor;
  } catch (error) {
    console.error('Error getting students scheduled with tutor:', error);
    return [];
  }
};

/**
 * Get tutor materials (stored in localStorage)
 */
export const getTutorMaterials = async (tutorId) => {
  if (!tutorId) return [];
  try {
    const userData = await getUserData(tutorId);
    return userData?.tutorMaterials || [];
  } catch (error) {
    console.error('Error getting tutor materials:', error);
    return [];
  }
};

/**
 * Save tutor material
 */
export const saveTutorMaterial = async (tutorId, material) => {
  if (!tutorId) return;
  try {
    const userData = await getUserData(tutorId);
    let tutorMaterials = userData?.tutorMaterials || [];
    
    // Add new material
    tutorMaterials.push({
      ...material,
      id: `material_${Date.now()}`,
    });
    
    await updateUserData(tutorId, {
      tutorMaterials,
    }, true);
  } catch (error) {
    console.error('Error saving tutor material:', error);
    throw error;
  }
};

/**
 * Update user role in localStorage
 */
export const updateUserRole = async (userId, role) => {
  if (!userId || !role) return;
  try {
    await updateUserData(userId, {
      role: role, // 'tutor' or 'student'
    }, true);
  } catch (error) {
    console.error('Error updating user role:', error);
    throw error;
  }
};

// Teacher profiles
export const saveTeacherProfile = async (userId, teacherProfile) => {
  if (!userId) return;
  try {
    const userData = await getUserData(userId);
    let teacherProfiles = userData?.teacherProfiles || [];
    
    // Check if teacher already exists
    const existingIndex = teacherProfiles.findIndex(t => t.id === teacherProfile.id);
    if (existingIndex >= 0) {
      teacherProfiles[existingIndex] = teacherProfile;
    } else {
      teacherProfiles.push(teacherProfile);
    }
    
    await updateUserData(userId, {
      teacherProfiles,
    }, true);
  } catch (error) {
    console.error('Error saving teacher profile:', error);
    throw error;
  }
};

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

export const updateTeacherProfile = async (userId, teacherId, updates) => {
  if (!userId || !teacherId) return;
  try {
    const userData = await getUserData(userId);
    const teacherProfiles = userData?.teacherProfiles || [];
    
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

export const deleteTeacherProfile = async (userId, teacherId) => {
  if (!userId || !teacherId) return;
  try {
    const userData = await getUserData(userId);
    const teacherProfiles = (userData?.teacherProfiles || []).filter(t => t.id !== teacherId);
    
    await updateUserData(userId, {
      teacherProfiles,
    }, true);
  } catch (error) {
    console.error('Error deleting teacher profile:', error);
    throw error;
  }
};

// Tutor reviews - keep using Firestore for sharing across users
// But provide localStorage fallback
import {
  doc,
  getDoc,
  getDocs,
  setDoc,
  collection,
  onSnapshot,
  query,
  where,
} from 'firebase/firestore';
import { db } from './firebase';

// Submit tutor review (use Firestore for sharing)
export const submitTutorReview = async (review) => {
  try {
    // Try Firestore first (for sharing across users)
    const tutorReviewsRef = collection(db, 'tutorReviews');
    await setDoc(doc(tutorReviewsRef), {
      ...review,
      createdAt: new Date().toISOString(),
    });
    console.log('Tutor review submitted successfully to Firestore');
  } catch (error) {
    // Fallback to localStorage if Firestore fails
    console.warn('Firestore failed, using localStorage fallback for tutor review');
    try {
      const reviewsKey = 'tutorReviews';
      const existingReviews = JSON.parse(localStorage.getItem(reviewsKey) || '[]');
      existingReviews.push({
        ...review,
        id: `review_${Date.now()}`,
        createdAt: new Date().toISOString(),
      });
      localStorage.setItem(reviewsKey, JSON.stringify(existingReviews));
    } catch (localError) {
      console.error('Error saving tutor review to localStorage:', localError);
      throw error; // Throw original Firestore error
    }
  }
};

// Get all reviews for a tutor
export const getTutorReviews = async (tutorId) => {
  try {
    // Try Firestore first
    const tutorReviewsRef = collection(db, 'tutorReviews');
    const snapshot = await getDocs(tutorReviewsRef);
    const allReviews = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));
    // Filter reviews for this tutor
    return allReviews.filter(review => review.tutorId === tutorId);
  } catch (error) {
    // Fallback to localStorage
    console.warn('Firestore failed, using localStorage fallback for tutor reviews');
    try {
      const reviewsKey = 'tutorReviews';
      const allReviews = JSON.parse(localStorage.getItem(reviewsKey) || '[]');
      return allReviews.filter(review => review.tutorId === tutorId);
    } catch (localError) {
      console.error('Error getting tutor reviews from localStorage:', localError);
      return [];
    }
  }
};

// Subscribe to tutor reviews (use Firestore for real-time updates)
const tutorReviewsSubscriptions = new Map();
const tutorReviewsCallbacks = new Map();

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

  // Try Firestore first
  try {
    const tutorReviewsRef = collection(db, 'tutorReviews');
    const q = query(tutorReviewsRef, where('tutorId', '==', tutorId));
    
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const reviews = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));
        
        const callbacks = tutorReviewsCallbacks.get(tutorId);
        if (callbacks) {
          callbacks.forEach(cb => {
            try {
              cb(reviews);
            } catch (error) {
              console.error('Error in tutor reviews callback:', error);
            }
          });
        }
      },
      (error) => {
        console.warn('Firestore subscription failed, using localStorage polling');
        // Fallback to localStorage polling
        const reviewsKey = 'tutorReviews';
        let lastReviews = [];
        
        const pollReviews = () => {
          try {
            const allReviews = JSON.parse(localStorage.getItem(reviewsKey) || '[]');
            const filteredReviews = allReviews.filter(review => review.tutorId === tutorId);
            const reviewsStr = JSON.stringify(filteredReviews);
            const lastReviewsStr = JSON.stringify(lastReviews);
            
            if (reviewsStr !== lastReviewsStr) {
              lastReviews = filteredReviews;
              const callbacks = tutorReviewsCallbacks.get(tutorId);
              if (callbacks) {
                callbacks.forEach(cb => {
                  try {
                    cb(filteredReviews);
                  } catch (err) {
                    console.error('Error in tutor reviews callback:', err);
                  }
                });
              }
            }
          } catch (err) {
            console.error('Error polling tutor reviews:', err);
          }
        };
        
        pollReviews();
        const intervalId = setInterval(pollReviews, POLL_INTERVAL);
        tutorReviewsSubscriptions.set(tutorId, { intervalId });
      }
    );

    tutorReviewsSubscriptions.set(tutorId, { unsubscribe });

    return () => {
      const callbacks = tutorReviewsCallbacks.get(tutorId);
      if (callbacks) {
        callbacks.delete(callback);
        if (callbacks.size === 0) {
          unsubscribe();
          tutorReviewsSubscriptions.delete(tutorId);
          tutorReviewsCallbacks.delete(tutorId);
        }
      }
    };
  } catch (error) {
    console.error('Error subscribing to tutor reviews:', error);
    callback([]);
    return () => {};
  }
};

// Tutor requests - use localStorage
export const submitTutorRequest = async (tutorRequest) => {
  try {
    const requestsKey = 'tutorRequests';
    const existingRequests = JSON.parse(localStorage.getItem(requestsKey) || '[]');
    existingRequests.push({
      ...tutorRequest,
      id: `request_${Date.now()}`,
      createdAt: new Date().toISOString(),
      status: 'pending',
    });
    localStorage.setItem(requestsKey, JSON.stringify(existingRequests));
    console.log('Tutor request submitted successfully');
    return { success: true, id: existingRequests[existingRequests.length - 1].id };
  } catch (error) {
    console.error('Error submitting tutor request:', error);
    return { success: false, error: error.message };
  }
};

export const getTutorRequests = async () => {
  try {
    const requestsKey = 'tutorRequests';
    return JSON.parse(localStorage.getItem(requestsKey) || '[]');
  } catch (error) {
    console.error('Error getting tutor requests:', error);
    return [];
  }
};

// Quota usage (not applicable for localStorage, but keep for compatibility)
export const getQuotaUsage = () => {
  return {
    reads: 0,
    writes: 0,
    deletes: 0,
    total: 0,
  };
};

