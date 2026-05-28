import { logger } from '../utils/logger';

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
  private defaultTTL = 5 * 60 * 1000;

  async set<T>(key: string, data: T, ttl: number = this.defaultTTL): Promise<void> {
    try {
      const entry: CacheEntry<T> = {
        data,
        timestamp: Date.now(),
        expiresAt: Date.now() + ttl,
      };
      localStorage.setItem(key, JSON.stringify(entry));
    } catch (error) {
      logger.error('Cache set error:', error);
    }
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      const value = localStorage.getItem(key);
      if (!value) return null;

      const entry: CacheEntry<T> = JSON.parse(value);

      if (Date.now() > entry.expiresAt) {
        localStorage.removeItem(key);
        return null;
      }

      return entry.data;
    } catch (error) {
      logger.error('Cache get error:', error);
      return null;
    }
  }

  async remove(key: string): Promise<void> {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      logger.error('Cache remove error:', error);
    }
  }

  async clear(): Promise<void> {
    try {
      const cacheKeys = Object.values(CACHE_KEYS);
      cacheKeys.forEach(key => localStorage.removeItem(key));
    } catch (error) {
      logger.error('Cache clear error:', error);
    }
  }

  async getSize(): Promise<number> {
    try {
      const cacheKeys = Object.values(CACHE_KEYS);
      let totalSize = 0;
      for (const key of cacheKeys) {
        const value = localStorage.getItem(key);
        if (value) {
          totalSize += value.length;
        }
      }
      return totalSize;
    } catch (error) {
      logger.error('Cache size error:', error);
      return 0;
    }
  }

  async clearExpired(): Promise<void> {
    try {
      const cacheKeys = Object.values(CACHE_KEYS);
      for (const key of cacheKeys) {
        const value = localStorage.getItem(key);
        if (value) {
          const entry: CacheEntry<unknown> = JSON.parse(value);
          if (Date.now() > entry.expiresAt) {
            localStorage.removeItem(key);
          }
        }
      }
    } catch (error) {
      logger.error('Clear expired error:', error);
    }
  }
}

export const cacheService = new CacheService();
export { CACHE_KEYS };
