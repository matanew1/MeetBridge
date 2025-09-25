# MeetBridge - Dating App with Firebase Backend

A React Native Expo dating app powered by Firebase Firestore for real-time data synchronization.

## Firebase Setup Instructions

### 1. Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project" or select existing project
3. Enable Google Analytics (optional)
4. Complete project creation

### 2. Configure Firebase Services

#### Authentication

1. Go to **Authentication** > **Sign-in method**
2. Enable **Email/Password** provider
3. (Optional) Enable other providers like Google, Facebook, etc.

#### Firestore Database

1. Go to **Firestore Database**
2. Click **Create database**
3. Choose **Start in test mode** for development
4. Select your preferred location
5. Apply the security rules from `.env` file comments

#### Storage

1. Go to **Storage**
2. Click **Get started**
3. Choose **Start in test mode** for development
4. Apply the security rules from `.env` file comments

### 3. Get Firebase Configuration

1. Go to **Project Settings** (gear icon)
2. Scroll to **Your apps** section
3. Click **Add app** > **Web** (</>)
4. Register your app with a nickname
5. Copy the Firebase configuration object

### 4. Configure Environment Variables

1. Copy the Firebase config values to `.env` file:
   ```
   EXPO_PUBLIC_FIREBASE_API_KEY=your-api-key-here
   EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
   EXPO_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
   EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
   EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
   EXPO_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abcdef123456
   ```

### 5. Apply Security Rules

#### Firestore Rules

Go to **Firestore Database** > **Rules** and apply:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can read/write their own profile
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
      allow read: if request.auth != null; // Others can read profiles for matching
    }

    // Matches, likes, conversations require authentication
    match /matches/{matchId} {
      allow read, write: if request.auth != null;
    }

    match /likes/{likeId} {
      allow read, write: if request.auth != null;
    }

    match /conversations/{conversationId} {
      allow read, write: if request.auth != null &&
        request.auth.uid in resource.data.participants;

      match /messages/{messageId} {
        allow read, write: if request.auth != null &&
          request.auth.uid in get(/databases/$(database)/documents/conversations/$(conversationId)).data.participants;
      }
    }

    match /reports/{reportId} {
      allow create: if request.auth != null && request.auth.uid == request.resource.data.reporterId;
      allow read: if false; // Only admins should read reports
    }
  }
}
```

#### Storage Rules

Go to **Storage** > **Rules** and apply:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /profile_images/{userId}/{allPaths=**} {
      allow read: if true; // Public read for profile images
      allow write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

## Running the App

1. Install dependencies:

   ```bash
   npm install
   ```

2. Start the Expo development server:

   ```bash
   npm run start
   ```

3. Use Expo Go app on your mobile device to scan the QR code

## Features

- ✅ User authentication (signup/login)
- ✅ Real-time user profiles
- ✅ Discovery/matching system
- ✅ Like/dislike profiles
- ✅ Super likes
- ✅ Real-time chat
- ✅ Match notifications
- ✅ Profile image upload
- ✅ Cross-platform (iOS, Android, Web) via Expo Go
- ✅ Offline-capable with Firestore caching

## Database Schema

### Collections:

#### `users`

- User profiles with preferences, images, and location data

#### `likes`

- User like/dislike/super-like actions

#### `matches`

- Mutual like records between users

#### `conversations`

- Chat conversations between matched users

#### `conversations/{id}/messages`

- Messages within each conversation

#### `reports`

- User reports for moderation

## Architecture

- **Frontend**: React Native with Expo
- **State Management**: Zustand
- **Backend**: Firebase Firestore
- **Authentication**: Firebase Auth
- **Storage**: Firebase Storage
- **Real-time**: Firestore real-time listeners

## Free Tier Limits

Firebase offers generous free tiers:

- **Firestore**: 50,000 reads, 20,000 writes, 20,000 deletes per day
- **Authentication**: Unlimited
- **Storage**: 5GB, 1GB downloads per day
- **Functions**: 125K invocations per month

Perfect for development and small-scale production apps!
