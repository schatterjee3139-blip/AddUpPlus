import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  signInWithPopup,
  GoogleAuthProvider,
} from 'firebase/auth';
import { auth } from '../lib/firebase';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const signup = async (email, password, firstName, lastName) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(userCredential.user, {
      displayName: `${firstName} ${lastName}`,
    });
    return userCredential;
  };

  const login = (email, password) => {
    return signInWithEmailAndPassword(auth, email, password);
  };

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    return signInWithPopup(auth, provider);
  };

  const logout = async () => {
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
    // For authenticated users, sign out from Firebase
    return signOut(auth);
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

