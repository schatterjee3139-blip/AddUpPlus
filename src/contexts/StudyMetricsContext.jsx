import React, { createContext, useContext, useState, useEffect, useMemo, useRef } from 'react';
import { useAuth } from './AuthContext';
import { subscribeToUserData, updateStudyMetrics, initializeUserData } from '../lib/firestore';

const defaultMetrics = {
  flashcardsReviewed: 0,
  flashcardsCorrect: 0,
  quizzesCompleted: 0,
  totalQuizQuestions: 0,
  totalQuizCorrect: 0,
  aiInteractions: 0,
  studyMinutes: 0,
  dailyStudyTime: {}, // { 'YYYY-MM-DD': minutes }
  weeklyStats: [], // Array of weekly totals
};

const StudyMetricsContext = createContext(null);

export const StudyMetricsProvider = ({ children }) => {
  const { currentUser } = useAuth();
  const isUpdatingRef = useRef(false); // Track if we're updating from our own save
  const lastSaveTimeRef = useRef(0); // Track when we last saved
  
  const [metrics, setMetrics] = useState(() => {
    // Fallback to localStorage if not logged in
    if (!currentUser) {
      try {
        const stored = localStorage.getItem('studyMetrics');
        return stored ? JSON.parse(stored) : defaultMetrics;
      } catch (error) {
        console.warn('Failed to load study metrics from storage', error);
        return defaultMetrics;
      }
    }
    return defaultMetrics;
  });

  // Track if this is the initial load
  const isInitialLoadRef = useRef(true);

  // Initialize user data and subscribe to Firebase when user logs in
  useEffect(() => {
    // Guest users always start with default metrics
    if (currentUser?.isGuest) {
      setMetrics(defaultMetrics);
      return;
    }

    if (!currentUser) {
      // For non-logged-in users, start fresh (no localStorage)
      setMetrics(defaultMetrics);
      return;
    }

    const initializeAndSubscribe = async () => {
      try {
        console.log('🔵 Starting initialization for user:', currentUser.uid);
        
        // Initialize user data if needed
        await initializeUserData(currentUser.uid, {
          email: currentUser.email,
          displayName: currentUser.displayName,
        });
        console.log('✅ Study metrics initialized for:', currentUser.uid);

        // Load data directly first (fallback if subscription doesn't fire immediately)
        try {
          const { getUserData } = await import('../lib/firestore');
          const userData = await getUserData(currentUser.uid);
          if (userData && userData.studyMetrics) {
            console.log('📥 Direct load from Firebase:', userData.studyMetrics);
            setMetrics(userData.studyMetrics);
            isInitialLoadRef.current = false;
          }
        } catch (err) {
          console.warn('⚠️ Direct load failed, will wait for subscription:', err);
        }

        // Subscribe to real-time updates
        console.log('🔵 Setting up Firebase subscription...');
        const unsubscribe = subscribeToUserData(currentUser.uid, (userData) => {
          console.log('🔔 Subscription callback fired!', userData ? 'Has data' : 'No data');
          
          if (!userData) {
            console.log('⚠️ No user data received from Firebase');
            return;
          }

          console.log('📦 Full user data received:', userData);
          console.log('📊 Study metrics in data:', userData.studyMetrics);

          // On initial load, always use Firebase data
          if (isInitialLoadRef.current) {
            console.log('🔄 This is the initial load');
            if (userData.studyMetrics) {
              console.log('✅ Initial load from Firebase - setting metrics:', userData.studyMetrics);
              setMetrics(userData.studyMetrics);
              isInitialLoadRef.current = false;
              console.log('✅ Initial load complete, isInitialLoadRef set to false');
            } else {
              console.warn('⚠️ No studyMetrics in Firebase data on initial load, using defaults');
              isInitialLoadRef.current = false; // Still mark as loaded even if no data
            }
            return;
          }

          // After initial load, don't overwrite if we just saved (within last 2 seconds)
          const timeSinceLastSave = Date.now() - lastSaveTimeRef.current;
          if (isUpdatingRef.current || timeSinceLastSave < 2000) {
            console.log('⏸️ Skipping subscription update - recent local save');
            return;
          }

          if (userData.studyMetrics) {
            console.log('🔄 Updating metrics from Firebase:', userData.studyMetrics);
            setMetrics(userData.studyMetrics);
          }
        });

        console.log('✅ Subscription set up successfully');
        return unsubscribe;
      } catch (error) {
        console.error('❌ Error initializing study metrics:', error);
        console.error('Error details:', error.message, error.stack);
        return () => {};
      }
    };

    let unsubscribe;
    initializeAndSubscribe().then((unsub) => {
      unsubscribe = unsub;
    });

    return () => {
      if (unsubscribe) unsubscribe();
      isInitialLoadRef.current = true; // Reset on unmount
    };
  }, [currentUser]);

  // Track study time when window is open
  useEffect(() => {
    let intervalId;
    let startTime = Date.now();
    let lastUpdateTime = startTime;

    const updateStudyTime = () => {
      const now = Date.now();
      const minutesElapsed = Math.floor((now - lastUpdateTime) / (1000 * 60));
      
      if (minutesElapsed > 0) {
        setMetrics((prev) => ({
          ...prev,
          studyMinutes: prev.studyMinutes + minutesElapsed,
        }));
        lastUpdateTime = now;
      }
    };

    // Update every minute
    intervalId = setInterval(updateStudyTime, 60000);

    // Update on visibility change (when user comes back to tab)
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        lastUpdateTime = Date.now();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Update on window focus
    const handleFocus = () => {
      lastUpdateTime = Date.now();
    };

    window.addEventListener('focus', handleFocus);

    // Cleanup on unmount
    return () => {
      clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
      // Final update
      updateStudyTime();
    };
  }, []);

  // Persist to Firebase or localStorage
  useEffect(() => {
    // Skip if this is the initial load from Firebase
    if (isInitialLoadRef.current && currentUser) {
      console.log('Skipping save - initial load in progress');
      return;
    }

    // Skip if metrics are still default (to avoid saving zeros on first render)
    if (metrics.aiInteractions === 0 && metrics.studyMinutes === 0 && 
        metrics.flashcardsReviewed === 0 && metrics.quizzesCompleted === 0) {
      console.log('Skipping save - metrics are all zeros (likely default state)');
      return;
    }

    // Guest users don't persist data
    if (currentUser?.isGuest) {
      return;
    }

    if (currentUser) {
      // Mark that we're updating
      isUpdatingRef.current = true;
      lastSaveTimeRef.current = Date.now();
      
      console.log('Saving metrics to Firebase:', metrics);
      
      // Update Firebase
      updateStudyMetrics(currentUser.uid, metrics)
        .then(() => {
          console.log('✅ Study metrics saved successfully to Firebase:', metrics);
          // Clear the flag after a short delay
          setTimeout(() => {
            isUpdatingRef.current = false;
          }, 1000);
        })
        .catch((error) => {
          console.error('❌ Failed to update study metrics in Firebase:', error);
          isUpdatingRef.current = false;
        });
    } else {
      // Fallback to localStorage (only for non-guest users)
      try {
        localStorage.setItem('studyMetrics', JSON.stringify(metrics));
        console.log('Study metrics saved to localStorage:', metrics);
      } catch (error) {
        console.warn('Failed to persist study metrics', error);
      }
    }
  }, [metrics, currentUser]);

  const recordFlashcardReview = (isCorrect) => {
    setMetrics((prev) => ({
      ...prev,
      flashcardsReviewed: prev.flashcardsReviewed + 1,
      flashcardsCorrect: prev.flashcardsCorrect + (isCorrect ? 1 : 0),
    }));
  };

  const recordQuizResult = (correctAnswers, totalQuestions) => {
    setMetrics((prev) => ({
      ...prev,
      quizzesCompleted: prev.quizzesCompleted + 1,
      totalQuizQuestions: prev.totalQuizQuestions + totalQuestions,
      totalQuizCorrect: prev.totalQuizCorrect + correctAnswers,
    }));
  };

  const recordAIInteraction = () => {
    setMetrics((prev) => ({
      ...prev,
      aiInteractions: prev.aiInteractions + 1,
    }));
  };

  const recordStudyMinutes = (minutes) => {
    if (!minutes) return;
    setMetrics((prev) => ({
      ...prev,
      studyMinutes: prev.studyMinutes + minutes,
    }));
  };

  const resetMetrics = () => {
    setMetrics(defaultMetrics);
  };

  const derived = useMemo(() => {
    const flashcardAccuracy = metrics.flashcardsReviewed
      ? Math.round((metrics.flashcardsCorrect / metrics.flashcardsReviewed) * 100)
      : 0;
    const averageQuizScore = metrics.totalQuizQuestions
      ? Math.round((metrics.totalQuizCorrect / metrics.totalQuizQuestions) * 100)
      : 0;

    return {
      flashcardAccuracy,
      averageQuizScore,
    };
  }, [metrics]);

  return (
    <StudyMetricsContext.Provider
      value={{
        metrics,
        derived,
        recordFlashcardReview,
        recordQuizResult,
        recordAIInteraction,
        recordStudyMinutes,
        resetMetrics,
      }}
    >
      {children}
    </StudyMetricsContext.Provider>
  );
};

export const useStudyMetrics = () => {
  const context = useContext(StudyMetricsContext);
  if (!context) {
    throw new Error('useStudyMetrics must be used within a StudyMetricsProvider');
  }
  return context;
};
