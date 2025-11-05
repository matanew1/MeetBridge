# 🚀 Firebase Security Rules Deployment Guide

## ⚠️ CRITICAL: Deploy Updated Rules Immediately

Your local Firestore rules have been updated with enhanced security, but the **old rules are still active** in Firebase Console. You need to deploy the new rules to fix the permission errors.

---

## 📋 Steps to Deploy

### 1. Deploy Firestore Rules

**Option A: Firebase CLI (Recommended)**

```bash
# Install Firebase CLI if not already installed
npm install -g firebase-tools

# Login to Firebase
firebase login

# Deploy only Firestore rules
firebase deploy --only firestore:rules
```

**Option B: Firebase Console (Manual)**

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: **meetbridge-b5cdc**
3. Navigate to **Firestore Database** → **Rules**
4. Copy the contents of `firestore.rules` from your project
5. Paste into the Firebase Console editor
6. Click **Publish**

---

### 2. Deploy Realtime Database Rules

**Option A: Firebase CLI**

```bash
firebase deploy --only database
```

**Option B: Firebase Console**

1. Navigate to **Realtime Database** → **Rules**
2. Copy contents of `database.rules.json`
3. Paste and **Publish**

---

## ✅ What Changed in the Rules

### Before (Blocking Updates)

```javascript
// Too strict - blocked location and status updates
allow update: if isOwner(userId)
  && (!request.resource.data.diff(resource.data).affectedKeys().hasAny(['id', 'email', 'createdAt']))
  && (request.resource.data.age == null || ...);
```

### After (Allows System Updates)

```javascript
// [SECURITY FIX] Allows location, status, timestamp updates
allow update: if isOwner(userId)
  && (!request.resource.data.diff(resource.data).affectedKeys().hasAny(['id', 'email', 'createdAt']))
  && (
    // Age validation only if age is being changed
    !request.resource.data.diff(resource.data).affectedKeys().hasAny(['age'])
    || (request.resource.data.age >= 18 && request.resource.data.age <= 120)
  )
  && (
    // Display name validation only if name is being changed
    !request.resource.data.diff(resource.data).affectedKeys().hasAny(['displayName'])
    || isValidString(request.resource.data.displayName, 2, 50)
  );
```

**Key Improvements:**

- ✅ Allows `coordinates`, `geohash`, `lastLocationUpdate` updates
- ✅ Allows `isOnline`, `lastSeen` status updates
- ✅ Allows `updatedAt` timestamp updates
- ✅ Still validates `age` and `displayName` when they ARE being changed
- ✅ Still prevents changing `id`, `email`, `createdAt`

---

## 🧪 Testing After Deployment

After deploying the rules, test these operations:

1. **Login** - Should work without 400 errors
2. **Location Updates** - Check console for "✅ Location updated in Firebase"
3. **Online Status** - Should see "✅ User status set to online"
4. **Profile Updates** - Test editing profile, should work
5. **Logout** - Should cleanly update offline status

---

## 🔍 Verify Rules Are Active

1. Go to Firebase Console → Firestore → Rules
2. Check the **Published** timestamp - should be recent
3. Test an operation in your app
4. Check Firestore → Rules → **Requests** tab to see if rules are evaluating correctly

---

## 🆘 If Issues Persist

**Check Firebase Console Logs:**

1. Firebase Console → Firestore → Usage
2. Look for "Permission denied" errors
3. Click on an error to see which rule failed

**Common Issues:**

- Rules not published (old rules still active)
- Project ID mismatch in `.env`
- User not authenticated (check auth state)
- Missing required fields in update

---

## 📞 Support

If you see continued permission errors after deploying:

1. Check that `EXPO_PUBLIC_FIREBASE_PROJECT_ID` in `.env` matches your Firebase project
2. Verify user is authenticated before operations
3. Check Firebase Console → Authentication to ensure user exists
4. Review Firestore → Usage tab for specific error messages

---

**Status:** Rules are updated locally ✅ | **Need to deploy to Firebase Console** ⚠️
