import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useAuth } from './AuthContext';
import { subscribeToUserData, updateUserData, initializeUserData } from '../lib/firestore';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';

const NotificationsContext = createContext(null);

export const NotificationsProvider = ({ children }) => {
  const { currentUser } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const lastGoalProgressRef = useRef({}); // Track last known progress for each goal

  // Calculate goal progress and generate notifications
  const checkGoalProgress = (goals, metrics) => {
    if (!goals || !Array.isArray(goals)) return [];

    const newNotifications = [];
    const currentProgress = {};

    goals.forEach((goal) => {
      if (goal.completed) return;

      let progress = 0;
      let current = 0;
      let target = 0;

      // Calculate progress based on goal type
      if (goal.type === 'study') {
        // Study time goal (in minutes)
        target = parseInt(goal.target) || 300;
        current = metrics.studyMinutes || 0;
        progress = Math.min(100, Math.round((current / target) * 100));
      } else if (goal.type === 'quiz') {
        // Quiz completion goal
        target = parseInt(goal.target) || 10;
        current = metrics.quizzesCompleted || 0;
        progress = Math.min(100, Math.round((current / target) * 100));
      } else if (goal.type === 'flashcard') {
        // Flashcard review goal
        target = parseInt(goal.target) || 50;
        current = metrics.flashcardsReviewed || 0;
        progress = Math.min(100, Math.round((current / target) * 100));
      } else {
        // Custom goal - try to parse target
        const targetMatch = goal.target?.match(/\d+/);
        if (targetMatch) {
          target = parseInt(targetMatch[0]);
          // For custom goals, use a combination of activities
          current = metrics.flashcardsReviewed + (metrics.quizzesCompleted * 5);
          progress = Math.min(100, Math.round((current / target) * 100));
        }
      }

      currentProgress[goal.id] = progress;
      const lastProgress = lastGoalProgressRef.current[goal.id] || 0;

      // Generate notifications at milestones (25%, 50%, 75%, 100%)
      const milestones = [25, 50, 75, 100];
      milestones.forEach((milestone) => {
        if (progress >= milestone && lastProgress < milestone) {
          newNotifications.push({
            id: `goal-${goal.id}-${milestone}-${Date.now()}`,
            type: 'goal',
            title: `Goal Progress: ${milestone}%`,
            message: `You're ${milestone}% of the way to completing "${goal.title}"! Keep it up!`,
            goalId: goal.id,
            progress: milestone,
            createdAt: new Date().toISOString(),
            read: false,
          });
        }
      });
    });

    lastGoalProgressRef.current = currentProgress;
    return newNotifications;
  };

  // Check for tutor messages
  const checkTutorMessages = async () => {
    if (!currentUser || currentUser.isGuest) return [];

    try {
      // Check for tutor requests that have responses
      const tutorRequestsRef = collection(db, 'tutorRequests');
      const q = query(tutorRequestsRef, where('studentEmail', '==', currentUser.email));
      
      // Use getDocs instead of onSnapshot for one-time read (more efficient)
      return new Promise(async (resolve) => {
        try {
          const snapshot = await getDocs(q);
          const messages = [];
          snapshot.forEach((doc) => {
            const data = doc.data();
            if (data.status === 'accepted' || data.response) {
              messages.push({
                id: `tutor-${doc.id}-${Date.now()}`,
                type: 'tutor',
                title: 'Tutor Response',
                message: data.response || `Your tutor request for ${data.tutorName} has been accepted!`,
                tutorId: data.tutorId,
                tutorName: data.tutorName,
                createdAt: data.updatedAt || data.createdAt || new Date().toISOString(),
                read: false,
              });
            }
          });
          resolve(messages);
        } catch (error) {
          // Handle quota exceeded gracefully
          if (error.code === 'resource-exhausted') {
            console.warn('⚠️ Firestore quota exceeded. Skipping tutor messages check.');
          } else {
            console.error('Error checking tutor messages:', error);
          }
          resolve([]);
        }
      });
    } catch (error) {
      console.error('Error checking tutor messages:', error);
      return [];
    }
  };

  // Load and subscribe to notifications
  useEffect(() => {
    if (!currentUser || currentUser.isGuest) {
      // For guests, use localStorage
      try {
        const stored = localStorage.getItem('notifications');
        if (stored) {
          const parsed = JSON.parse(stored);
          setNotifications(parsed);
          setUnreadCount(parsed.filter(n => !n.read).length);
        }
      } catch {
        // Ignore
      }
      return;
    }

    const initializeAndSubscribe = async () => {
      try {
        await initializeUserData(currentUser.uid, {
          email: currentUser.email,
          displayName: currentUser.displayName,
        });

        const unsubscribe = subscribeToUserData(currentUser.uid, (userData) => {
          if (userData) {
            // Get existing notifications
            const existingNotifications = userData.notifications || [];
            
            // Check for new goal progress notifications
            const goalNotifications = checkGoalProgress(userData.goals || [], userData.studyMetrics || {});
            
            // Combine all notifications (tutor messages will be checked separately)
            const allNotifications = [
              ...existingNotifications,
              ...goalNotifications,
            ];

            // Remove duplicates and sort by date
            const uniqueNotifications = Array.from(
              new Map(allNotifications.map(n => [n.id, n])).values()
            ).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

            // Limit to last 50 notifications
            const limitedNotifications = uniqueNotifications.slice(0, 50);

            setNotifications(limitedNotifications);
            setUnreadCount(limitedNotifications.filter(n => !n.read).length);

            // Check for tutor messages separately
            checkTutorMessages().then((tutorMessages) => {
              if (tutorMessages.length > 0) {
                setNotifications((prev) => {
                  const combined = [...prev, ...tutorMessages];
                  const unique = Array.from(
                    new Map(combined.map(n => [n.id, n])).values()
                  ).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
                  return unique.slice(0, 50);
                });
              }
            });

            // Save to Firebase
            if (goalNotifications.length > 0) {
              updateUserData(currentUser.uid, {
                notifications: limitedNotifications,
              }).catch(console.error);
            }
          }
        });

        return unsubscribe;
      } catch (error) {
        console.error('Error loading notifications:', error);
        return () => {};
      }
    };

    let unsubscribe;
    initializeAndSubscribe().then((unsub) => {
      unsubscribe = unsub;
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [currentUser]);

  // Save notifications to Firebase or localStorage
  useEffect(() => {
    if (currentUser && !currentUser.isGuest) {
      updateUserData(currentUser.uid, { notifications }).catch(console.error);
    } else {
      try {
        localStorage.setItem('notifications', JSON.stringify(notifications));
      } catch (error) {
        console.warn('Failed to persist notifications', error);
      }
    }
  }, [notifications, currentUser]);

  const markAsRead = (notificationId) => {
    setNotifications((prev) =>
      prev.map((n) =>
        n.id === notificationId ? { ...n, read: true } : n
      )
    );
  };

  const markAllAsRead = () => {
    setNotifications((prev) =>
      prev.map((n) => ({ ...n, read: true }))
    );
  };

  const deleteNotification = (notificationId) => {
    setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
  };

  const value = {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  };

  return (
    <NotificationsContext.Provider value={value}>
      {children}
    </NotificationsContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationsContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationsProvider');
  }
  return context;
};

