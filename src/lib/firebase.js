// Firebase configuration and initialization
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Firebase configuration - Replace with your Firebase project config
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "your-api-key",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "your-project.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "your-project-id",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "your-project.appspot.com",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "123456789",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "your-app-id"
};

// Validate configuration
const missingConfig = [];
if (!firebaseConfig.apiKey || firebaseConfig.apiKey === "your-api-key") missingConfig.push("VITE_FIREBASE_API_KEY");
if (!firebaseConfig.authDomain || firebaseConfig.authDomain.includes("your-project")) missingConfig.push("VITE_FIREBASE_AUTH_DOMAIN");
if (!firebaseConfig.projectId || firebaseConfig.projectId === "your-project-id") missingConfig.push("VITE_FIREBASE_PROJECT_ID");
if (!firebaseConfig.appId || firebaseConfig.appId === "your-app-id") missingConfig.push("VITE_FIREBASE_APP_ID");

if (missingConfig.length > 0) {
  console.error('❌ Missing Firebase configuration:', missingConfig);
  console.error('Please check your .env file');
}

// Initialize Firebase
let app;
try {
  app = initializeApp(firebaseConfig);
  console.log('✅ Firebase initialized successfully');
  console.log('📋 Project ID:', firebaseConfig.projectId);
} catch (error) {
  console.error('❌ Firebase initialization failed:', error);
  throw error;
}

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Test Firestore connection (only in development, and only once)
if (import.meta.env.DEV) {
  let connectionTested = false;
  const testConnection = async () => {
    if (connectionTested) return;
    connectionTested = true;
    
    try {
      // Just check if Firestore is initialized, don't make actual queries
      if (db) {
        console.log('✅ Firestore initialized successfully');
      }
    } catch (error) {
      if (error.code === 'permission-denied') {
        console.warn('⚠️ Firestore permission denied. Check your security rules!');
        console.warn('Go to Firebase Console > Firestore Database > Rules');
      } else if (error.code === 'failed-precondition') {
        console.warn('⚠️ Firestore database not created!');
        console.warn('Go to Firebase Console > Firestore Database > Create database');
      }
    }
  };
  
  // Test connection after a delay (only in dev)
  setTimeout(testConnection, 2000);
}

export default app;

