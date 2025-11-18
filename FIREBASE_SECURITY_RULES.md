# Firebase Security Rules - Quick Setup

## ⚠️ IMPORTANT: Update Your Firebase Security Rules

To fix the "Missing or insufficient permissions" errors, you need to update your Firestore security rules.

## Steps:

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Click on **Firestore Database** in the left sidebar
4. Click on the **Rules** tab
5. Replace the existing rules with the following:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only read/write their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Tutor reviews - anyone can read, anyone can write (for public reviews)
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

6. Click **Publish** to save the rules
7. Wait a few seconds for the rules to propagate
8. Refresh your app - the errors should be gone!

## Note:
- These rules allow public access to tutor reviews (anyone can read/write)
- Tutor requests require authentication to write
- User data is still protected (users can only access their own data)

If you want more restrictive rules later, you can modify them, but these will work for now.

