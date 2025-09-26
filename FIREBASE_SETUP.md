# MeetBridge - Complete Dating App Setup Guide

A React Native Expo dating app with Firebase authentication (Email/Password + Google OAuth) and Firestore database.

## Features Implemented ✅

- **Authentication System**

  - Email/Password registration and login
  - Google OAuth authentication
  - Password reset functionality
  - Email verification
  - Persistent authentication state

- **Database Integration**

  - Firebase Firestore for real-time data
  - User profiles with photos, interests, location
  - Matching system with likes/dislikes
  - Real-time chat functionality
  - Conversation management

- **Cross-Platform Support**
  - React Native Expo Go (iOS/Android)
  - Web browser support
  - Responsive design

## Firebase Setup Instructions

### 1. Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project" or select existing project
3. Enable Google Analytics (optional)
4. Complete project creation

### 2. Configure Authentication

#### Enable Email/Password Authentication

1. Go to **Authentication** > **Sign-in method**
2. Enable **Email/Password** provider
3. Click **Save**

#### Enable Google Authentication

1. In **Authentication** > **Sign-in method**
2. Enable **Google** provider
3. Add your app's package name (com.meetbridge.app)
4. Add SHA-1/SHA-256 certificates for Android if needed
5. **Important**: Copy the **Web client ID** - you'll need this for `.env`

### 3. Configure Firestore Database

1. Go to **Firestore Database**
2. Click **Create database**
3. Choose **Start in test mode** for development
4. Select your preferred location

#### Apply Security Rules

Go to **Firestore** > **Rules** and replace with:

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

### 4. Configure Storage

1. Go to **Storage**
2. Click **Get started**
3. Choose **Start in test mode** for development

#### Apply Storage Rules

Go to **Storage** > **Rules** and replace with:

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

EXPO_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
EXPO_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abcdef123456

# Google OAuth (get from Authentication > Sign-in method > Google)

EXPO_PUBLIC_GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com

````

### 5. Get Firebase Configuration

1. Go to **Project Settings** (gear icon)
2. Scroll to **Your apps** section
3. Click **Add app** > **Web** (</>)
4. Register your app with nickname "MeetBridge Web"
5. Copy the Firebase configuration values and update your `.env` file

### 6. Configure Environment Variables

Create or update the `.env` file in your project root with your actual Firebase values:

```bash
# Firebase Configuration (replace with your actual values from Firebase Console)
EXPO_PUBLIC_FIREBASE_API_KEY=AIzaSyC...
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=meetbridge-12345.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=meetbridge-12345
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=meetbridge-12345.appspot.com
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
EXPO_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abcdef123456

# Google OAuth (get the WEB client ID from Authentication > Sign-in method > Google)
EXPO_PUBLIC_GOOGLE_CLIENT_ID=123456789-abcdef.apps.googleusercontent.com
````

## Installation & Testing

### 1. Install Dependencies

```bash
npm install
```

### 2. Start Development Server

```bash
npm start
```

### 3. Testing the App

#### On Mobile (Expo Go)

1. Install Expo Go app on your device
2. Scan the QR code from terminal
3. Test authentication features

#### On Web Browser

1. Press 'w' in terminal to open web version
2. Test all authentication flows

## Authentication Features

### Email/Password Authentication

- User registration with profile information
- Email verification
- Login with validation and error handling
- Password reset via email
- Automatic user profile creation in Firestore

### Google OAuth Authentication

- One-tap Google sign-in
- Automatic profile creation from Google account
- Cross-platform support (iOS, Android, Web)
- Seamless integration with Expo Go

### Security Features

- Form validation with user-friendly error messages
- Secure authentication state management
- Automatic token refresh
- Protected routes and navigation

## Troubleshooting

### Common Issues

1. **Google Sign-In Not Working**

   - Verify `EXPO_PUBLIC_GOOGLE_CLIENT_ID` is the **Web client ID** (not Android/iOS)
   - Check that Google provider is enabled in Firebase Auth console
   - Ensure OAuth redirect schemes are properly configured in `app.json`

2. **Expo Go Authentication Issues**

   - Restart Expo development server after changing `.env`
   - Make sure you're testing in Expo Go app, not a web browser for mobile-specific features
   - Verify all environment variables are properly prefixed with `EXPO_PUBLIC_`

3. **Firestore Permission Denied**

   - Check that security rules are applied in Firebase Console
   - Verify user is authenticated before making database requests
   - Ensure user document exists in Firestore after registration

4. **Environment Variables Not Loading**
   - Restart Expo development server after changing `.env`
   - Verify `.env` file is in project root directory
   - Check that all variable names start with `EXPO_PUBLIC_`

### Testing Checklist

1. **Test Registration**

   - ✅ Create account with valid email/password
   - ✅ Verify user profile is created in Firestore
   - ✅ Check form validation for invalid inputs

2. **Test Login**

   - ✅ Login with registered credentials
   - ✅ Test wrong password/email validation
   - ✅ Verify user state persists after app restart

3. **Test Google Authentication**

   - ✅ Complete Google sign-in flow
   - ✅ Verify profile is created/updated in Firestore
   - ✅ Test on different platforms (mobile/web)

4. **Test Password Reset**
   - ✅ Request password reset email
   - ✅ Verify email is received
   - ✅ Test form validation

## Next Steps

After Firebase setup is complete, you can enhance the app with:

1. **Advanced Matching**: Implement location-based matching algorithms
2. **Push Notifications**: Add Firebase Cloud Messaging for match/message notifications
3. **Photo Upload**: Implement multiple photo upload with Firebase Storage
4. **Real-time Features**: Add typing indicators and online status
5. **Video Calls**: Integration with WebRTC or similar service
6. **Premium Features**: In-app purchases and subscription management

## Database Schema Details

### Users Collection

```typescript
{
  id: string;              // Firebase Auth UID
  name: string;            // Full name
  email: string;           // User email
  age?: number;            // User age
  gender?: "male" | "female" | "other";
  bio?: string;            // Profile bio
  interests?: string[];    // User interests
  location?: string;       // Location string
  image?: string;          // Profile image URL
  preferences?: {          // Matching preferences
    ageRange: [number, number];
    maxDistance: number;
    interestedIn: "male" | "female" | "both";
  };
  createdAt: Timestamp;    // Account creation
  lastSeen: Timestamp;     // Last activity
  isOnline?: boolean;      // Online status
}
```

### Matches Collection

```typescript
{
  users: [string, string]; // [user1_uid, user2_uid]
  createdAt: Timestamp; // Match timestamp
}
```

### Conversations Collection

```typescript
{
  participants: [string, string]; // [user1_uid, user2_uid]
  createdAt: Timestamp; // Conversation start
  updatedAt: Timestamp; // Last message time
  unreadCount: number; // Unread message count
}
```

### Messages Subcollection

```typescript
{
  senderId: string; // Message sender UID
  text: string; // Message content
  timestamp: Timestamp; // Message timestamp
  isRead: boolean; // Read status
}
```

## Support

If you encounter issues during setup:

1. **Check Firebase Console**: Look for error logs and authentication events
2. **Review Expo Logs**: Monitor development server output for errors
3. **Verify Configuration**: Double-check all environment variables and Firebase settings
4. **Test Step by Step**: Test each authentication method individually

The MeetBridge app now includes a complete authentication system with Firebase integration, supporting both email/password and Google OAuth authentication across iOS, Android, and web platforms with a shared Firestore database.

## Free Tier Compatibility ✅

This implementation is designed to work within Firebase's generous free tier limits:

- **Firestore**: 50,000 reads, 20,000 writes, 20,000 deletes per day
- **Authentication**: Unlimited users and sign-ins
- **Storage**: 5GB storage, 1GB downloads per day
- **Hosting**: 10GB storage, 10GB/month transfer

Perfect for development, testing, and small-scale production applications!

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
