// services/cacheService.ts
/**
 * React Native compatible cache service
 * Uses AsyncStorage for persistence and in-memory cache for performance
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
}

class ReactNativeCacheService {
  private memoryCache: Map<string, CacheEntry<any>> = new Map();
  private readonly DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes
  private readonly STORAGE_PREFIX = '@MeetBridge_cache_';
  private isInitialized = false;

  /**
   * Initialize the cache service
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Load persisted cache entries on startup
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter((key) =>
        key.startsWith(this.STORAGE_PREFIX)
      );

      for (const key of cacheKeys) {
        try {
          const serialized = await AsyncStorage.getItem(key);
          if (serialized) {
            const entry: CacheEntry<any> = JSON.parse(serialized);
            const now = Date.now();
            const age = now - entry.timestamp;

            // Only load if not expired
            if (age < entry.ttl) {
              const cleanKey = key.replace(this.STORAGE_PREFIX, '');
              this.memoryCache.set(cleanKey, entry);
            } else {
              // Clean up expired entry
              await AsyncStorage.removeItem(key);
            }
          }
        } catch (error) {
          console.warn(`Failed to load cache entry ${key}:`, error);
          // Remove corrupted entry
          await AsyncStorage.removeItem(key);
        }
      }

      this.isInitialized = true;
      console.log(
        `✅ Cache service initialized with ${this.memoryCache.size} entries`
      );
    } catch (error) {
      console.warn('Failed to initialize cache service:', error);
      // Continue without persistent cache
      this.isInitialized = true;
    }
  }

  /**
   * Set a cache entry with optional TTL
   */
  async set<T>(key: string, data: T, ttl?: number): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.DEFAULT_TTL,
    };

    // Store in memory for fast access
    this.memoryCache.set(key, entry);

    // Persist to AsyncStorage for durability
    try {
      const serialized = JSON.stringify(entry);
      await AsyncStorage.setItem(this.STORAGE_PREFIX + key, serialized);
    } catch (error) {
      console.warn(`Failed to persist cache entry ${key}:`, error);
      // Continue without persistence
    }
  }

  /**
   * Get a cache entry if it exists and hasn't expired
   */
  async get<T>(key: string): Promise<T | null> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    // Check memory cache first
    const entry = this.memoryCache.get(key);
    if (!entry) return null;

    const now = Date.now();
    const age = now - entry.timestamp;

    // Check if cache entry has expired
    if (age > entry.ttl) {
      this.memoryCache.delete(key);
      // Also remove from persistent storage
      try {
        await AsyncStorage.removeItem(this.STORAGE_PREFIX + key);
      } catch (error) {
        console.warn(`Failed to remove expired cache entry ${key}:`, error);
      }
      return null;
    }

    return entry.data as T;
  }

  /**
   * Check if a key exists and is valid
   */
  async has(key: string): Promise<boolean> {
    return (await this.get(key)) !== null;
  }

  /**
   * Delete a specific cache entry
   */
  async delete(key: string): Promise<boolean> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    const existed = this.memoryCache.delete(key);

    // Also remove from persistent storage
    try {
      await AsyncStorage.removeItem(this.STORAGE_PREFIX + key);
    } catch (error) {
      console.warn(`Failed to remove cache entry ${key}:`, error);
    }

    return existed;
  }

  /**
   * Clear all cache entries
   */
  async clear(): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    // Clear memory cache
    this.memoryCache.clear();

    // Clear persistent storage
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter((key) =>
        key.startsWith(this.STORAGE_PREFIX)
      );
      if (cacheKeys.length > 0) {
        await AsyncStorage.multiRemove(cacheKeys);
      }
    } catch (error) {
      console.warn('Failed to clear persistent cache:', error);
    }
  }

  /**
   * Clear expired cache entries
   */
  async clearExpired(): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    const now = Date.now();
    const expiredKeys: string[] = [];

    // Find expired entries
    for (const [key, entry] of this.memoryCache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        expiredKeys.push(key);
      }
    }

    // Remove expired entries
    expiredKeys.forEach((key) => {
      this.memoryCache.delete(key);
    });

    // Also clean up persistent storage
    try {
      const storageKeys = expiredKeys.map((key) => this.STORAGE_PREFIX + key);
      if (storageKeys.length > 0) {
        await AsyncStorage.multiRemove(storageKeys);
      }
    } catch (error) {
      console.warn('Failed to clear expired persistent cache entries:', error);
    }
  }

  /**
   * Get or set cache entry (lazy loading pattern)
   */
  async getOrSet<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttl?: number
  ): Promise<T> {
    const cached = await this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    const data = await fetcher();
    await this.set(key, data, ttl);
    return data;
  }

  /**
   * Cache discovery results by location/geohash
   */
  async cacheDiscoveryResults(
    locationKey: string,
    results: any[],
    ttl: number = 300
  ): Promise<void> {
    const key = `discovery:${locationKey}`;
    await this.set(key, results, ttl * 1000);
  }

  /**
   * Get cached discovery results
   */
  async getDiscoveryResults(locationKey: string): Promise<any[] | null> {
    const key = `discovery:${locationKey}`;
    return await this.get<any[]>(key);
  }

  /**
   * Cache user interactions (likes, dislikes)
   */
  async cacheUserInteractions(
    userId: string,
    interactions: string[],
    ttl: number = 3600
  ): Promise<void> {
    const key = `interactions:${userId}`;
    await this.set(key, interactions, ttl * 1000);
  }

  /**
   * Get cached user interactions
   */
  async getUserInteractions(userId: string): Promise<string[] | null> {
    const key = `interactions:${userId}`;
    return await this.get<string[]>(key);
  }

  /**
   * Invalidate cache entries by prefix
   */
  async invalidateByPrefix(prefix: string): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    // Remove from memory cache
    const keysToRemove: string[] = [];
    for (const key of this.memoryCache.keys()) {
      if (key.startsWith(prefix)) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach((key) => {
      this.memoryCache.delete(key);
    });

    // Remove from persistent storage
    try {
      const allKeys = await AsyncStorage.getAllKeys();
      const storageKeysToRemove = allKeys.filter(
        (key) =>
          key.startsWith(this.STORAGE_PREFIX) &&
          key.replace(this.STORAGE_PREFIX, '').startsWith(prefix)
      );
      if (storageKeysToRemove.length > 0) {
        await AsyncStorage.multiRemove(storageKeysToRemove);
      }
    } catch (error) {
      console.warn(
        `Failed to invalidate cache entries with prefix ${prefix}:`,
        error
      );
    }
  }

  /**
   * Get cache statistics
   */
  async getStats(): Promise<{
    memory: { size: number; keys: string[] };
    persistent: { estimatedSize: number };
  }> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    let persistentCount = 0;
    try {
      const keys = await AsyncStorage.getAllKeys();
      persistentCount = keys.filter((key) =>
        key.startsWith(this.STORAGE_PREFIX)
      ).length;
    } catch (error) {
      console.warn('Failed to get persistent cache stats:', error);
    }

    return {
      memory: {
        size: this.memoryCache.size,
        keys: Array.from(this.memoryCache.keys()),
      },
      persistent: {
        estimatedSize: persistentCount,
      },
    };
  }
}

export default new ReactNativeCacheService();
