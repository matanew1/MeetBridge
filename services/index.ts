import {
  FirebaseUserProfileService,
  FirebaseDiscoveryService,
  FirebaseMatchingService,
  FirebaseChatService,
  FirebaseAuthService,
} from './firebase/firebaseServices';
import { IServiceContainer } from './interfaces';

// Storage service implementation using AsyncStorage
import AsyncStorage from '@react-native-async-storage/async-storage';

class AsyncStorageService {
  async setItem(key: string, value: any): Promise<boolean> {
    try {
      await AsyncStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error('Error setting item in storage:', error);
      return false;
    }
  }

  async getItem<T>(key: string): Promise<T | null> {
    try {
      const value = await AsyncStorage.getItem(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error('Error getting item from storage:', error);
      return null;
    }
  }

  async removeItem(key: string): Promise<boolean> {
    try {
      await AsyncStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error('Error removing item from storage:', error);
      return false;
    }
  }

  async clear(): Promise<boolean> {
    try {
      await AsyncStorage.clear();
      return true;
    } catch (error) {
      console.error('Error clearing storage:', error);
      return false;
    }
  }

  async getAllKeys(): Promise<string[]> {
    try {
      return await AsyncStorage.getAllKeys();
    } catch (error) {
      console.error('Error getting all keys from storage:', error);
      return [];
    }
  }
}

// Export service container with Firebase implementations
export const services: IServiceContainer = {
  userProfile: new FirebaseUserProfileService(),
  discovery: new FirebaseDiscoveryService(),
  matching: new FirebaseMatchingService(),
  chat: new FirebaseChatService(),
  auth: new FirebaseAuthService(),
  storage: new AsyncStorageService(),
};

// Export individual services for direct access
export {
  FirebaseUserProfileService,
  FirebaseDiscoveryService,
  FirebaseMatchingService,
  FirebaseChatService,
  FirebaseAuthService,
};

// Export singleton instances for direct use
export const discoveryService = services.discovery;
export const matchingService = services.matching;
export const chatService = services.chat;
export const authService = services.auth;
export const userProfileService = services.userProfile;

// Export Firebase config
export { db, auth, storage } from './firebase/config';
