import { initializeApp, getApps } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import {
  initializeAuth,
  getAuth,
  getReactNativePersistence,
  browserLocalPersistence,
  browserSessionPersistence,
} from 'firebase/auth';
import { getStorage } from 'firebase/storage';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Firebase configuration
const firebaseConfig = {
  apiKey: 'AIzaSyBPdV1BiL67xJes80Gv_tozl1E1ZAqslbk',
  authDomain: 'meetbridge-b5cdc.firebaseapp.com',
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
let auth;
if (Platform.OS === 'web') {
  // For web, use getAuth() which automatically uses browser persistence
  auth = getAuth(app);
} else {
  // For React Native, use initializeAuth with AsyncStorage persistence
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
  });
}

export { auth };

export const storage = getStorage(app);
export default app;
