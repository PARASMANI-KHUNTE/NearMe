import AsyncStorage from '@react-native-async-storage/async-storage';
import { User } from './authService';

const CACHE_KEYS = {
  USER_PROFILE: 'cached_user_profile',
  FRIENDS_LIST: 'cached_friends_list',
  NOTIFICATIONS: 'cached_notifications',
  LOCATION_DATA: 'cached_location_data',
  SETTINGS: 'cached_settings',
};

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

class CacheService {
  private defaultTTL = 5 * 60 * 1000; // 5 minutes default

  /**
   * Store data in cache with optional TTL
   */
  async set<T>(key: string, data: T, ttl: number = this.defaultTTL): Promise<void> {
    try {
      const entry: CacheEntry<T> = {
        data,
        timestamp: Date.now(),
        expiresAt: Date.now() + ttl,
      };
      await AsyncStorage.setItem(key, JSON.stringify(entry));
    } catch (error) {
      console.error('Cache set error:', error);
    }
  }

  /**
   * Get data from cache if not expired
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      const value = await AsyncStorage.getItem(key);
      if (!value) return null;

      const entry: CacheEntry<T> = JSON.parse(value);

      // Check if expired
      if (Date.now() > entry.expiresAt) {
        await AsyncStorage.removeItem(key);
        return null;
      }

      return entry.data;
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  }

  /**
   * Remove specific cache entry
   */
  async remove(key: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(key);
    } catch (error) {
      console.error('Cache remove error:', error);
    }
  }

  /**
   * Clear all cache
   */
  async clear(): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(key => key.startsWith('cached_'));
      await AsyncStorage.multiRemove(cacheKeys);
    } catch (error) {
      console.error('Cache clear error:', error);
    }
  }

  /**
   * Get cache size in bytes
   */
  async getSize(): Promise<number> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(key => key.startsWith('cached_'));

      let totalSize = 0;
      for (const key of cacheKeys) {
        const value = await AsyncStorage.getItem(key);
        if (value) {
          totalSize += value.length;
        }
      }

      return totalSize;
    } catch (error) {
      console.error('Cache size error:', error);
      return 0;
    }
  }

  /**
   * Clear expired cache entries
   */
  async clearExpired(): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(key => key.startsWith('cached_'));

      for (const key of cacheKeys) {
        const value = await AsyncStorage.getItem(key);
        if (value) {
          const entry: CacheEntry<any> = JSON.parse(value);
          if (Date.now() > entry.expiresAt) {
            await AsyncStorage.removeItem(key);
          }
        }
      }
    } catch (error) {
      console.error('Clear expired error:', error);
    }
  }
}

export const cacheService = new CacheService();
export { CACHE_KEYS };