# Firebase Connection Troubleshooting Guide

## Common Issues and Fixes

### 1. **Firestore Security Rules Blocking Access**

**Symptoms:**
- Console shows "permission-denied" errors
- Data doesn't load or save
- Subscription callbacks don't fire

**Fix:**
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: `addup-c78db`
3. Go to **Firestore Database** > **Rules**
4. Update your rules to:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only read/write their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

5. Click **Publish**

### 2. **Firestore Database Not Created**

**Symptoms:**
- Console shows "failed-precondition" errors
- "Database does not exist" errors

**Fix:**
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: `addup-c78db`
3. Go to **Firestore Database**
4. Click **Create database** if you haven't already
5. Choose **Start in test mode** (for development) or **Production mode**
6. Select a location (choose closest to your users)
7. Click **Enable**

### 3. **Authentication Not Enabled**

**Symptoms:**
- Can't sign in
- "auth/operation-not-allowed" errors

**Fix:**
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: `addup-c78db`
3. Go to **Authentication** > **Sign-in method**
4. Enable **Email/Password**
5. Enable **Google** (if using Google sign-in)
6. Click **Save**

### 4. **Environment Variables Not Loaded**

**Symptoms:**
- Console shows "Missing Firebase configuration"
- Using default/placeholder values

**Fix:**
1. Make sure `.env` file exists in the project root
2. Check that all variables start with `VITE_`
3. Restart the dev server after changing `.env`:
   ```bash
   # Stop the server (Ctrl+C)
   npm run dev
   ```

### 5. **Network/CORS Issues**

**Symptoms:**
- Connection timeouts
- Network errors in console

**Fix:**
1. Check your internet connection
2. Check if Firebase is blocked by firewall/proxy
3. Try accessing Firebase Console in browser to verify connectivity

### 6. **Check Current Configuration**

Your current Firebase config:
- **Project ID:** `addup-c78db`
- **Auth Domain:** `addup-c78db.firebaseapp.com`

To verify:
1. Go to Firebase Console > Project Settings
2. Scroll to "Your apps" section
3. Verify the config matches your `.env` file

## Testing the Connection

After fixing issues, check the browser console for:
- ✅ `Firebase initialized successfully`
- ✅ `Firestore connection test passed`
- ✅ `Study metrics initialized for: [userId]`
- ✅ `Subscription callback fired!`

If you see ❌ errors, follow the fixes above.

## Quick Checklist

- [ ] Firestore database created
- [ ] Firestore security rules allow authenticated users
- [ ] Authentication enabled (Email/Password and/or Google)
- [ ] `.env` file has all required variables
- [ ] Dev server restarted after `.env` changes
- [ ] No console errors related to Firebase

