// services/secureStorageService.ts
// [SECURITY FIX] Hybrid storage service that uses SecureStore for sensitive data
// and AsyncStorage for non-sensitive data
//
// NOTE: SecureStore only allows keys with alphanumeric, ".", "-", and "_" characters.
// Keys with invalid characters (like Firebase's "firebase:authUser:...") automatically
// fall back to AsyncStorage. This is safe because Firebase Auth tokens are already
// handled separately by our custom persistence adapter in firebase/config.ts

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

// [SECURITY] Define which keys should use encrypted storage
const SENSITIVE_KEY_PATTERNS = [
  '@auth_token',
  '@refresh_token',
  '@access_token',
  '@user_password',
  '@current_user_id', // User ID should be protected
  '@session',
  '@credentials',
];

/**
 * [SECURITY] Check if a key is valid for SecureStore
 * SecureStore only allows alphanumeric characters, ".", "-", and "_"
 */
function isValidSecureStoreKey(key: string): boolean {
  // Must not be empty
  if (!key || key.trim().length === 0) {
    return false;
  }
  // Only allow alphanumeric, dot, dash, underscore
  const validKeyPattern = /^[a-zA-Z0-9._-]+$/;
  return validKeyPattern.test(key);
}

/**
 * Determines if a key contains sensitive data that should be encrypted
 * Also ensures the key is valid for SecureStore
 */
function isSensitiveKey(key: string): boolean {
  const isSensitive = SENSITIVE_KEY_PATTERNS.some((pattern) =>
    key.includes(pattern)
  );
  // [SECURITY FIX] Only use SecureStore if key format is valid
  // Firebase auth keys like "firebase:authUser:..." contain colons which SecureStore doesn't allow
  return isSensitive && isValidSecureStoreKey(key);
}

/**
 * Secure Storage Service
 * Automatically routes sensitive keys to SecureStore and non-sensitive to AsyncStorage
 */
class SecureStorageService {
  /**
   * Store item securely (auto-routes based on key sensitivity)
   */
  async setItem(key: string, value: any): Promise<boolean> {
    try {
      const stringValue =
        typeof value === 'string' ? value : JSON.stringify(value);

      // [SECURITY FIX] Use SecureStore for sensitive keys with valid format on native platforms
      if (isSensitiveKey(key) && Platform.OS !== 'web') {
        await SecureStore.setItemAsync(key, stringValue);
        console.log(
          `🔒 [SECURE] Stored sensitive key: ${key.substring(0, 15)}...`
        );
      } else {
        // Use AsyncStorage for non-sensitive data or invalid SecureStore keys
        await AsyncStorage.setItem(key, stringValue);
      }

      return true;
    } catch (error) {
      // [SECURITY FIX] Fallback to AsyncStorage if SecureStore fails
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      if (errorMessage.includes('Invalid key provided')) {
        console.warn(
          `[SECURITY] Invalid SecureStore key format: ${key}, using AsyncStorage fallback`
        );
        try {
          await AsyncStorage.setItem(key, stringValue);
          return true;
        } catch (fallbackError) {
          console.error(`[SECURITY] Fallback storage failed:`, fallbackError);
          return false;
        }
      }
      console.error(
        `[SECURITY] Error setting item in storage (${key}):`,
        error
      );
      return false;
    }
  }

  /**
   * Retrieve item securely (auto-routes based on key sensitivity)
   */
  async getItem<T = any>(key: string): Promise<T | null> {
    try {
      let value: string | null = null;

      // [SECURITY FIX] Use SecureStore for sensitive keys with valid format on native platforms
      if (isSensitiveKey(key) && Platform.OS !== 'web') {
        value = await SecureStore.getItemAsync(key);
      } else {
        // Use AsyncStorage for non-sensitive data or invalid SecureStore keys
        value = await AsyncStorage.getItem(key);
      }

      if (!value) return null;

      // Try to parse JSON, return raw string if fails
      try {
        return JSON.parse(value) as T;
      } catch {
        return value as T;
      }
    } catch (error) {
      // [SECURITY FIX] Fallback to AsyncStorage if SecureStore fails
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      if (errorMessage.includes('Invalid key provided')) {
        console.warn(
          `[SECURITY] Invalid SecureStore key format: ${key}, using AsyncStorage fallback`
        );
        try {
          const value = await AsyncStorage.getItem(key);
          if (!value) return null;
          try {
            return JSON.parse(value) as T;
          } catch {
            return value as T;
          }
        } catch (fallbackError) {
          console.error(`[SECURITY] Fallback retrieval failed:`, fallbackError);
          return null;
        }
      }
      console.error(
        `[SECURITY] Error getting item from storage (${key}):`,
        error
      );
      return null;
    }
  }

  /**
   * Remove item from storage
   */
  async removeItem(key: string): Promise<boolean> {
    try {
      // [SECURITY FIX] Validate key format before attempting SecureStore operations
      if (isSensitiveKey(key) && Platform.OS !== 'web') {
        // Key is valid for SecureStore
        await SecureStore.deleteItemAsync(key);
      } else {
        // Use AsyncStorage for non-sensitive or invalid SecureStore keys
        await AsyncStorage.removeItem(key);
      }

      return true;
    } catch (error) {
      // [SECURITY FIX] Better error handling - don't fail if key doesn't exist
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      if (errorMessage.includes('Invalid key provided')) {
        console.warn(
          `[SECURITY] Invalid SecureStore key format: ${key}, using AsyncStorage fallback`
        );
        try {
          await AsyncStorage.removeItem(key);
          return true;
        } catch (fallbackError) {
          console.error(`[SECURITY] Fallback removal failed:`, fallbackError);
          return false;
        }
      }
      console.error(
        `[SECURITY] Error removing item from storage (${key}):`,
        error
      );
      return false;
    }
  }

  /**
   * Clear all storage (DANGER: use with caution)
   */
  async clear(): Promise<boolean> {
    try {
      // Clear AsyncStorage
      await AsyncStorage.clear();

      // [SECURITY] Cannot clear all SecureStore items at once
      // Must manually clear known sensitive keys
      if (Platform.OS !== 'web') {
        for (const pattern of SENSITIVE_KEY_PATTERNS) {
          try {
            // [SECURITY FIX] Only attempt to delete if key format is valid
            if (isValidSecureStoreKey(pattern)) {
              await SecureStore.deleteItemAsync(pattern);
            }
          } catch (error) {
            // Key may not exist or other error, ignore and continue
            console.debug(
              `[SECURITY] Could not clear SecureStore key ${pattern}:`,
              error
            );
          }
        }
      }

      return true;
    } catch (error) {
      console.error('[SECURITY] Error clearing storage:', error);
      return false;
    }
  }

  /**
   * Get all keys from AsyncStorage only (SecureStore doesn't support listing keys)
   */
  async getAllKeys(): Promise<string[]> {
    try {
      return await AsyncStorage.getAllKeys();
    } catch (error) {
      console.error('[SECURITY] Error getting all keys from storage:', error);
      return [];
    }
  }

  /**
   * Check if a key exists
   */
  async hasItem(key: string): Promise<boolean> {
    const value = await this.getItem(key);
    return value !== null;
  }

  /**
   * Get multiple items at once
   */
  async multiGet(keys: string[]): Promise<Record<string, any>> {
    const result: Record<string, any> = {};

    await Promise.all(
      keys.map(async (key) => {
        const value = await this.getItem(key);
        if (value !== null) {
          result[key] = value;
        }
      })
    );

    return result;
  }

  /**
   * Set multiple items at once
   */
  async multiSet(items: Record<string, any>): Promise<boolean> {
    try {
      await Promise.all(
        Object.entries(items).map(([key, value]) => this.setItem(key, value))
      );
      return true;
    } catch (error) {
      console.error('[SECURITY] Error setting multiple items:', error);
      return false;
    }
  }
}

// Export singleton instance
export const secureStorageService = new SecureStorageService();
export default secureStorageService;
