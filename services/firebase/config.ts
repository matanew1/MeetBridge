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
import AsyncStorage from '@react-native-async-storage/async-storage';

// Firebase configuration
const firebaseConfig = {
  apiKey: 'AIzaSyBPdV1BiL67xJes80Gv_tozl1E1ZAqslbk',
  authDomain: 'meetbridge-b5cdc.firebaseapp.com',
  databaseURL: 'https://meetbridge-b5cdc-default-rtdb.firebaseio.com', // Add Realtime Database URL
  projectId: 'meetbridge-b5cdc',
  storageBucket: 'meetbridge-b5cdc.firebasestorage.app',
  messagingSenderId: '331612362377',
  appId: '1:331612362377:web:6ad392ab246120d4461858',
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
  // For React Native, use initializeAuth with AsyncStorage persistence
  // Handle case where auth might already be initialized (e.g., during hot reload)
  try {
    auth = initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage),
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
