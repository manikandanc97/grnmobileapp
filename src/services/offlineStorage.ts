import AsyncStorage from '@react-native-async-storage/async-storage';

export interface CachedRecord<T> {
  data: T;
  cachedAt: string; // ISO string
  ownerId: string;
}

const CACHE_KEY_PREFIX = '@grn_cache_';

/**
 * Returns a secure, account-isolated storage key
 */
function buildKey(userId: string, cacheKey: string): string {
  const safeUserId = userId && userId.trim() ? userId.trim() : 'anonymous';
  return `${CACHE_KEY_PREFIX}${safeUserId}_${cacheKey}`;
}

export const offlineStorage = {
  /**
   * Save data into durable local storage partitioned by user ID
   */
  async set<T>(userId: string, key: string, data: T): Promise<void> {
    try {
      const record: CachedRecord<T> = {
        data,
        cachedAt: new Date().toISOString(),
        ownerId: userId,
      };
      const storageKey = buildKey(userId, key);
      await AsyncStorage.setItem(storageKey, JSON.stringify(record));
    } catch (err) {
      if (__DEV__) {
        console.warn(`[offlineStorage] Failed to set cache for key ${key}:`, err);
      }
    }
  },

  /**
   * Retrieve cached data. Returns null if not found, invalid, or belonging to another user.
   */
  async get<T>(userId: string, key: string): Promise<CachedRecord<T> | null> {
    try {
      const storageKey = buildKey(userId, key);
      const raw = await AsyncStorage.getItem(storageKey);
      if (!raw) return null;

      const record = JSON.parse(raw) as CachedRecord<T>;
      // Strict account boundary check
      if (record.ownerId !== userId) {
        if (__DEV__) {
          console.warn(`[offlineStorage] Cross-account access blocked for key ${key}`);
        }
        return null;
      }

      return record;
    } catch (err) {
      if (__DEV__) {
        console.warn(`[offlineStorage] Failed to read cache for key ${key}:`, err);
      }
      return null;
    }
  },

  /**
   * Remove a specific cached key for a user
   */
  async remove(userId: string, key: string): Promise<void> {
    try {
      const storageKey = buildKey(userId, key);
      await AsyncStorage.removeItem(storageKey);
    } catch (err) {
      if (__DEV__) {
        console.warn(`[offlineStorage] Failed to remove cache for key ${key}:`, err);
      }
    }
  },

  /**
   * Purge all cached data associated with a specific user (e.g. upon user request or data reset)
   */
  async clearUser(userId: string): Promise<void> {
    try {
      const allKeys = await AsyncStorage.getAllKeys();
      const userPrefix = `${CACHE_KEY_PREFIX}${userId}_`;
      const userKeys = allKeys.filter((k) => k.startsWith(userPrefix));
      if (userKeys.length > 0) {
        await AsyncStorage.multiRemove(userKeys);
      }
    } catch (err) {
      if (__DEV__) {
        console.warn(`[offlineStorage] Failed to clear user cache for ${userId}:`, err);
      }
    }
  },
};
