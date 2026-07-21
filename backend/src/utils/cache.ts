/**
 * Caching Layer - Phase 4 Q21: Caching Layer
 *
 * Provides in-memory caching with TTL, memoization, and cache invalidation.
 *
 * Usage:
 *   import { cache, memoize } from './utils/cache';
 *
 *   // Simple cache
 *   const user = await cache.getOrSet('user:123', () => fetchUser(123), 60000);
 *
 *   // Memoized function
 *   const getProduct = memoize(fetchProduct, (id) => `product:${id}`, 300000);
 */

/**
 * Cache configuration interface
 */
export interface CacheConfig {
  /** Default TTL in milliseconds */
  defaultTTL: number;
  /** Maximum cache size (number of entries) */
  maxSize: number;
  /** Enable debug logging */
  debug: boolean;
}

/**
 * Default configuration
 */
const defaultConfig: CacheConfig = {
  defaultTTL: 300000, // 5 minutes
  maxSize: 1000,
  debug: false,
};

/**
 * Cache entry with metadata
 */
interface CacheEntry<T> {
  value: T;
  expiresAt: number;
  createdAt: number;
  hits: number;
  key: string;
}

/**
 * In-memory cache implementation
 */
export class Cache {
  private store: Map<string, CacheEntry<unknown>> = new Map();
  private config: CacheConfig;
  private hits = 0;
  private misses = 0;

  constructor(config: Partial<CacheConfig> = {}) {
    this.config = { ...defaultConfig, ...config };
  }

  /**
   * Get a value from cache
   */
  get<T>(key: string): T | undefined {
    const entry = this.store.get(key) as CacheEntry<T> | undefined;

    if (!entry) {
      this.misses++;
      return undefined;
    }

    // Check if expired
    if (Date.now() > entry.expiresAt) {
      this.delete(key);
      this.misses++;
      return undefined;
    }

    this.hits++;
    entry.hits++;
    return entry.value;
  }

  /**
   * Get a value from cache or set it using the provided function
   */
  async getOrSet<T>(
    key: string,
    fetchFn: () => Promise<T>,
    ttl?: number
  ): Promise<T> {
    const cached = this.get<T>(key);
    if (cached !== undefined) {
      return cached;
    }

    const value = await fetchFn();
    this.set(key, value, ttl);
    return value;
  }

  /**
   * Set a value in cache
   */
  set<T>(key: string, value: T, ttl?: number): void {
    // Evict oldest entries if at capacity
    if (this.store.size >= this.config.maxSize) {
      this.evictOldest(100);
    }

    const entry: CacheEntry<T> = {
      value,
      expiresAt: Date.now() + (ttl || this.config.defaultTTL),
      createdAt: Date.now(),
      hits: 0,
      key,
    };

    this.store.set(key, entry as CacheEntry<unknown>);

    if (this.config.debug) {
      console.log(`[CACHE] Set: ${key}`);
    }
  }

  /**
   * Delete a value from cache
   */
  delete(key: string): boolean {
    const result = this.store.delete(key);
    if (this.config.debug && result) {
      console.log(`[CACHE] Delete: ${key}`);
    }
    return result;
  }

  /**
   * Delete values matching a pattern
   */
  deletePattern(pattern: string | RegExp): number {
    const regex =
      typeof pattern === 'string'
        ? new RegExp(`^${pattern.replace(/\*/g, '.*')}$`)
        : pattern;

    let count = 0;
    for (const key of this.store.keys()) {
      if (regex.test(key)) {
        this.delete(key);
        count++;
      }
    }
    return count;
  }

  /**
   * Check if a key exists (and is not expired)
   */
  has(key: string): boolean {
    const entry = this.store.get(key);
    if (!entry) return false;
    if (Date.now() > entry.expiresAt) {
      this.delete(key);
      return false;
    }
    return true;
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.store.clear();
    if (this.config.debug) {
      console.log('[CACHE] Clear all');
    }
  }

  /**
   * Get cache statistics
   */
  getStats(): {
    size: number;
    hits: number;
    misses: number;
    hitRate: number;
    hitPercentage: number;
  } {
    const total = this.hits + this.misses;
    return {
      size: this.store.size,
      hits: this.hits,
      misses: this.misses,
      hitRate: total > 0 ? this.hits / total : 0,
      hitPercentage: total > 0 ? (this.hits / total) * 100 : 0,
    };
  }

  /**
   * Get all keys
   */
  keys(): string[] {
    return Array.from(this.store.keys());
  }

  /**
   * Evict oldest entries
   */
  private evictOldest(count: number): void {
    const entries = Array.from(this.store.entries())
      .sort((a, b) => a[1].createdAt - b[1].createdAt)
      .slice(0, count);

    for (const [key] of entries) {
      this.store.delete(key);
    }
  }

  /**
   * Cleanup expired entries
   */
  cleanup(): number {
    let removed = 0;
    const now = Date.now();
    for (const [key, entry] of this.store.entries()) {
      if (now > entry.expiresAt) {
        this.store.delete(key);
        removed++;
      }
    }
    return removed;
  }
}

/**
 * Global cache instance
 */
export const globalCache = new Cache({
  defaultTTL: 300000, // 5 minutes
  maxSize: 5000,
});

/**
 * Create a memoized version of a function
 */
export function memoize<Args extends unknown[], Result>(
  fn: (...args: Args) => Promise<Result>,
  getKey: (...args: Args) => string,
  ttl?: number
): (...args: Args) => Promise<Result> {
  const cache = new Cache();

  return async (...args: Args): Promise<Result> => {
    const key = getKey(...args);
    return cache.getOrSet(key, () => fn(...args), ttl);
  };
}

/**
 * Helper to create a namespaced cache
 */
export function createNamespaceCache(
  namespace: string,
  config?: Partial<CacheConfig>
): Cache {
  return new Cache({
    ...config,
    debug: config?.debug || false,
  });
}

export default Cache;
