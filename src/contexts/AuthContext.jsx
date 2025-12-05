import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  signOut,
  onAuthStateChanged,
  signInWithPopup,
  GoogleAuthProvider,
} from 'firebase/auth';
import { auth } from '../lib/firebase';
import { initializeUserData } from '../lib/localStorage';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for tutor user in sessionStorage first (no Firebase)
    const tutorUserStr = sessionStorage.getItem('tutorUser');
    if (tutorUserStr) {
      try {
        const tutorUser = JSON.parse(tutorUserStr);
        setCurrentUser(tutorUser);
        setLoading(false);
        return;
      } catch (e) {
        console.error('Error parsing tutor user:', e);
      }
    }

    // Check for localStorage-based user (email/password login)
    const localUserStr = localStorage.getItem('localUser');
    if (localUserStr) {
      try {
        const localUser = JSON.parse(localUserStr);
        setCurrentUser(localUser);
        setLoading(false);
        // Don't return - also check Firebase for Google sign-in users
      } catch (e) {
        console.error('Error parsing local user:', e);
      }
    }

    // For Google sign-in users, use Firebase auth
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      // Only set Firebase user if it's a Google sign-in (has providerData)
      if (user && user.providerData && user.providerData.some(provider => provider.providerId === 'google.com')) {
        setCurrentUser(user);
        // Initialize user data in localStorage for Google users too
        if (user.uid) {
          initializeUserData(user.uid, {
            email: user.email,
            displayName: user.displayName,
          }).catch(err => console.error('Error initializing Google user data:', err));
        }
      } else if (!localStorage.getItem('localUser')) {
        // Only clear if there's no local user
        setCurrentUser(null);
      }
      setLoading(false);
    });

    // Listen for tutor login events
    const handleTutorLogin = (event) => {
      setCurrentUser(event.detail);
    };
    window.addEventListener('tutor-login', handleTutorLogin);

    // Listen for local user login events
    const handleLocalLogin = (event) => {
      setCurrentUser(event.detail);
    };
    window.addEventListener('local-login', handleLocalLogin);

    return () => {
      unsubscribe();
      window.removeEventListener('tutor-login', handleTutorLogin);
      window.removeEventListener('local-login', handleLocalLogin);
    };
  }, []);

  const signup = async (email, password, firstName, lastName) => {
    // Use localStorage instead of Firebase
    // Check if user already exists
    const usersKey = 'localUsers';
    const existingUsers = JSON.parse(localStorage.getItem(usersKey) || '{}');
    
    if (existingUsers[email]) {
      throw new Error('Email already registered. Please sign in instead.');
    }
    
    // Create new user
    const userId = `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newUser = {
      uid: userId,
      email: email,
      displayName: `${firstName} ${lastName}`,
      photoURL: null,
      isLocal: true,
    };
    
    // Store user credentials (in a real app, you'd hash the password)
    existingUsers[email] = {
      password: password, // In production, hash this!
      userId: userId,
    };
    localStorage.setItem(usersKey, JSON.stringify(existingUsers));
    
    // Initialize user data
    await initializeUserData(userId, {
      email: email,
      firstName: firstName,
      lastName: lastName,
      displayName: `${firstName} ${lastName}`,
      role: 'student',
    });
    
    // Store user in localStorage
    localStorage.setItem('localUser', JSON.stringify(newUser));
    
    // Dispatch event
    window.dispatchEvent(new CustomEvent('local-login', { detail: newUser }));
    
    return { user: newUser };
  };

  const login = async (email, password) => {
    // Use localStorage instead of Firebase
    const usersKey = 'localUsers';
    const existingUsers = JSON.parse(localStorage.getItem(usersKey) || '{}');
    
    const userCreds = existingUsers[email];
    if (!userCreds || userCreds.password !== password) {
      throw new Error('Invalid email or password.');
    }
    
    // Get user data
    const userData = await import('../lib/localStorage').then(m => m.getUserData(userCreds.userId));
    
    const user = {
      uid: userCreds.userId,
      email: email,
      displayName: userData?.profile?.firstName && userData?.profile?.lastName 
        ? `${userData.profile.firstName} ${userData.profile.lastName}`
        : email.split('@')[0],
      photoURL: null,
      isLocal: true,
    };
    
    // Store user in localStorage
    localStorage.setItem('localUser', JSON.stringify(user));
    
    // Dispatch event
    window.dispatchEvent(new CustomEvent('local-login', { detail: user }));
    
    return { user };
  };

  const signInWithGoogle = async () => {
    // Use Firebase for Google sign-in only
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);
    // Initialize user data in localStorage for Google users too
    if (result.user?.uid) {
      await initializeUserData(result.user.uid, {
        email: result.user.email,
        displayName: result.user.displayName,
        role: 'student',
      }).catch(err => console.error('Error initializing Google user data:', err));
    }
    return result;
  };

  const logout = async () => {
    // Check if current user is a tutor (no Firebase)
    if (currentUser?.isTutor) {
      setCurrentUser(null);
      sessionStorage.removeItem('tutorUser');
      sessionStorage.removeItem('isTutor');
      return;
    }
    
    // Check if current user is a local user (email/password)
    if (currentUser?.isLocal) {
      setCurrentUser(null);
      localStorage.removeItem('localUser');
      return;
    }
    
    // Check if current user is a guest
    if (currentUser?.isGuest) {
      // For guest users, just clear the state
      setCurrentUser(null);
      // Clear all localStorage data for guest
      try {
        const keys = Object.keys(localStorage);
        keys.forEach(key => {
          if (key.startsWith('guest_') || key.includes('flashcard') || key.includes('quiz') || key.includes('workspace') || key.includes('course') || key.includes('study') || key.includes('planner') || key.includes('aiChat')) {
            localStorage.removeItem(key);
          }
        });
      } catch (error) {
        console.error('Error clearing localStorage:', error);
      }
      return;
    }
    
    // For Google sign-in users, sign out from Firebase
    if (currentUser && currentUser.providerData && currentUser.providerData.some(provider => provider.providerId === 'google.com')) {
      return signOut(auth);
    }
    
    // Fallback: just clear the state
    setCurrentUser(null);
  };

  const signInAsGuest = async () => {
    // Clear any existing localStorage data to ensure fresh start
    try {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.includes('flashcard') || key.includes('quiz') || key.includes('workspace') || key.includes('course') || key.includes('study') || key.includes('planner') || key.includes('aiChat') || key.includes('joinedCourse') || key.includes('module') || key.includes('expanded')) {
          localStorage.removeItem(key);
        }
      });
    } catch (error) {
      console.error('Error clearing localStorage:', error);
    }

    // Create an anonymous user for guest mode
    const guestUser = {
      uid: `guest_${Date.now()}`,
      email: null,
      displayName: 'Guest',
      photoURL: null,
      isGuest: true,
    };
    setCurrentUser(guestUser);
    return guestUser;
  };

  const value = {
    currentUser,
    signup,
    login,
    signInWithGoogle,
    logout,
    signInAsGuest,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

