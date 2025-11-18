# Firebase Setup Instructions

## 1. Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project" or select an existing project
3. Follow the setup wizard

## 2. Enable Authentication

1. In Firebase Console, go to **Authentication**
2. Click **Get Started**
3. Enable **Email/Password** authentication
4. Click **Save**

## 3. Create Firestore Database

1. In Firebase Console, go to **Firestore Database**
2. Click **Create database**
3. Start in **test mode** (for development) or **production mode** (with security rules)
4. Choose a location for your database
5. Click **Enable**

## 4. Get Firebase Configuration

1. In Firebase Console, go to **Project Settings** (gear icon)
2. Scroll down to **Your apps** section
3. Click the **Web** icon (`</>`) to add a web app
4. Register your app with a nickname
5. Copy the Firebase configuration object

## 5. Add Configuration to .env

Add your Firebase configuration to the `.env` file:

```env
VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=your-app-id
```

## 6. Firestore Security Rules (Required)

Update your Firestore security rules to allow access to all collections:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only read/write their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Tutor reviews - anyone can read, anyone can write
    match /tutorReviews/{reviewId} {
      allow read: if true;
      allow write: if true;
    }
    
    // Tutor requests - anyone can read, authenticated users can write
    match /tutorRequests/{requestId} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}
```

**Important:** After updating the rules, click **Publish** in the Firebase Console to apply them.

## 7. Data Structure

The app stores user data in Firestore with the following structure:

```
users/
  {userId}/
    studyMetrics: {
      flashcardsReviewed: number,
      flashcardsCorrect: number,
      quizzesCompleted: number,
      totalQuizQuestions: number,
      totalQuizCorrect: number,
      aiInteractions: number,
      studyMinutes: number,
      dailyStudyTime: object,
      weeklyStats: array
    },
    courses: {
      joinedCourseIds: array,
      courseBlueprints: object,
      courseWorkspaceData: object,
      courseYouTubeVideos: object
    },
    workspace: {
      moduleDetailedContent: object,
      moduleVideos: object,
      expandedModules: object
    },
    profile: {
      firstName: string,
      lastName: string,
      email: string
    },
    createdAt: timestamp,
    updatedAt: timestamp
}
```

## Notes

- The app will automatically create user documents when a user signs up
- Data syncs in real-time when users are logged in
- When not logged in, the app falls back to localStorage
- All user data is stored per user ID in Firestore

