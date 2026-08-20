interface CachePayload<T> {
  data: T;
  timestamp: number;
  ttlMs: number;
}

const memoryCache = new Map<string, CachePayload<any>>();

export const cacheService = {
  /**
   * Get cached item by key (checks memory cache first, then localStorage)
   */
  get<T>(key: string): T | null {
    const now = Date.now();

    // 1. Memory Cache check (Ultra Fast 0ms)
    if (memoryCache.has(key)) {
      const payload = memoryCache.get(key)!;
      if (now - payload.timestamp < payload.ttlMs) {
        return payload.data as T;
      }
      memoryCache.delete(key);
    }

    // 2. LocalStorage Fallback check
    try {
      const raw = localStorage.getItem(`cache_${key}`);
      if (raw) {
        const payload: CachePayload<T> = JSON.parse(raw);
        if (now - payload.timestamp < payload.ttlMs) {
          // Re-hydrate memory cache
          memoryCache.set(key, payload);
          return payload.data;
        }
        localStorage.removeItem(`cache_${key}`);
      }
    } catch (err) {
      console.warn('Cache read error:', err);
    }

    return null;
  },

  /**
   * Store item in memory and localStorage with TTL (Time To Live) in milliseconds
   */
  set<T>(key: string, data: T, ttlMs: number = 3600000): void {
    const payload: CachePayload<T> = {
      data,
      timestamp: Date.now(),
      ttlMs,
    };

    // Store in memory
    memoryCache.set(key, payload);

    // Store in persistent localStorage
    try {
      localStorage.setItem(`cache_${key}`, JSON.stringify(payload));
    } catch (err) {
      console.warn('Cache write error (storage quota or restricted):', err);
    }
  },

  /**
   * Remove cached item
   */
  remove(key: string): void {
    memoryCache.delete(key);
    try {
      localStorage.removeItem(`cache_${key}`);
    } catch (err) {
      // ignore
    }
  },

  /**
   * Clear all app caches
   */
  clearAll(): void {
    memoryCache.clear();
    try {
      Object.keys(localStorage).forEach((k) => {
        if (k.startsWith('cache_')) {
          localStorage.removeItem(k);
        }
      });
    } catch (err) {
      // ignore
    }
  },
};
