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

// ...location service removed as requested...

// API client implementation
class ApiClient {
  async request<T>(request: any): Promise<any> {
    // Generic API request implementation
    throw new Error('Generic API requests not implemented for Firebase');
  }

  async get<T>(url: string, params?: any): Promise<any> {
    throw new Error('Generic GET requests not implemented for Firebase');
  }

  async post<T>(url: string, data?: any): Promise<any> {
    throw new Error('Generic POST requests not implemented for Firebase');
  }

  async put<T>(url: string, data?: any): Promise<any> {
    throw new Error('Generic PUT requests not implemented for Firebase');
  }

  async delete<T>(url: string): Promise<any> {
    throw new Error('Generic DELETE requests not implemented for Firebase');
  }

  async patch<T>(url: string, data?: any): Promise<any> {
    throw new Error('Generic PATCH requests not implemented for Firebase');
  }
}

// Export service container with Firebase implementations
export const services: IServiceContainer = {
  userProfile: new FirebaseUserProfileService(),
  discovery: new FirebaseDiscoveryService(),
  matching: new FirebaseMatchingService(),
  chat: new FirebaseChatService(),
  // location service removed
  auth: new FirebaseAuthService(),
  storage: new AsyncStorageService(),
  apiClient: new ApiClient(),
};

// Export individual services for direct access
export {
  FirebaseUserProfileService,
  FirebaseDiscoveryService,
  FirebaseMatchingService,
  FirebaseChatService,
  FirebaseAuthService,
};

// Export Firebase config
export { db, auth, storage } from './firebase/config';
