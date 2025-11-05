import { initializeApp, getApps } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import {
  initializeAuth,
  getAuth,
  getReactNativePersistence,
  browserLocalPersistence,
  browserSessionPersistence,
  Auth,
} from 'firebase/auth';
import { getStorage } from 'firebase/storage';
import { getDatabase } from 'firebase/database';
import { Platform } from 'react-native';
// [SECURITY FIX] Replaced AsyncStorage with SecureStore for auth token persistence
import * as SecureStore from 'expo-secure-store';

// [SECURITY FIX] Moved Firebase config to environment variables
// Note: Firebase API keys in frontend are safe per Firebase documentation,
// but moving to env vars prevents accidental exposure and allows easy rotation
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.EXPO_PUBLIC_FIREBASE_DATABASE_URL,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

// [SECURITY] Validate required Firebase configuration
if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
  throw new Error(
    '[SECURITY] Missing required Firebase configuration. Check your .env file.'
  );
}

// [SECURITY FIX] Custom SecureStore persistence adapter for sensitive auth tokens
// This replaces AsyncStorage with expo-secure-store for encryption at rest
// NOTE: SecureStore only allows keys with alphanumeric, ".", "-", and "_" characters
// Firebase generates keys like "firebase:authUser:..." with colons, so we sanitize them

/**
 * Sanitize keys for SecureStore compatibility
 * Replace invalid characters with underscores while maintaining uniqueness
 */
function sanitizeSecureStoreKey(key: string): string {
  // Replace colons, slashes, and other invalid chars with underscores
  return key.replace(/[^a-zA-Z0-9._-]/g, '_');
}

const secureStoragePersistence = {
  async getItem(key: string): Promise<string | null> {
    try {
      // [SECURITY FIX] Sanitize key before SecureStore access
      const sanitizedKey = sanitizeSecureStoreKey(key);
      return await SecureStore.getItemAsync(sanitizedKey);
    } catch (error) {
      console.error('[SECURITY] Error reading from SecureStore:', error);
      return null;
    }
  },
  async setItem(key: string, value: string): Promise<void> {
    try {
      // [SECURITY FIX] Sanitize key before SecureStore access
      const sanitizedKey = sanitizeSecureStoreKey(key);
      await SecureStore.setItemAsync(sanitizedKey, value);
    } catch (error) {
      console.error('[SECURITY] Error writing to SecureStore:', error);
    }
  },
  async removeItem(key: string): Promise<void> {
    try {
      // [SECURITY FIX] Sanitize key before SecureStore access
      const sanitizedKey = sanitizeSecureStoreKey(key);
      await SecureStore.deleteItemAsync(sanitizedKey);
    } catch (error) {
      console.error('[SECURITY] Error removing from SecureStore:', error);
    }
  },
};

// Initialize Firebase only if no apps exist
const app =
  getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

// Initialize Firebase services
export const db = getFirestore(app);

// Initialize auth with platform-appropriate persistence
let auth: Auth;
if (Platform.OS === 'web') {
  // For web, use getAuth() which automatically uses browser persistence
  auth = getAuth(app);
} else {
  // [SECURITY FIX] For React Native, use SecureStore instead of AsyncStorage for auth tokens
  // SecureStore provides hardware-backed encryption on iOS (Keychain) and Android (Keystore)
  try {
    auth = initializeAuth(app, {
      persistence: getReactNativePersistence(secureStoragePersistence as any),
    });
  } catch (error: any) {
    // If auth is already initialized, get the existing instance
    if (error.code === 'auth/already-initialized') {
      auth = getAuth(app);
    } else {
      throw error;
    }
  }
}

export { auth };

export const storage = getStorage(app);
export const realtimeDb = getDatabase(app);
export default app;
