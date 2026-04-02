import type { RedisClientType } from 'redis';

export interface CacheOptions {
  ttl?: number;
  prefix?: string;
  skip?: boolean;
}

export interface QueryCacheEntry<T> {
  value: T;
  createdAt: number;
  ttl: number;
  hitCount: number;
}

export interface QueryCacheStats {
  hits: number;
  misses: number;
  size: number;
  hitRate: number;
  memoryUsage: number;
}

export class QueryCache<T = unknown> {
  private cache: Map<string, QueryCacheEntry<T>>;
  private hits: number = 0;
  private misses: number = 0;
  private maxSize: number;
  private defaultTtl: number;
  private cleanupInterval: NodeJS.Timeout | null = null;
  private redisClient?: RedisClientType;
  private useRedis: boolean;
  private keyPrefix: string;

  constructor(options: {
    maxSize?: number;
    defaultTtl?: number;
    redisClient?: RedisClientType;
    useRedis?: boolean;
    prefix?: string;
  } = {}) {
    this.cache = new Map();
    this.maxSize = options.maxSize || 1000;
    this.defaultTtl = options.defaultTtl || 300;
    this.redisClient = options.redisClient;
    this.useRedis = options.useRedis || false;
    this.keyPrefix = options.prefix || 'query_cache';
  }

  private generateKey(key: string): string {
    return `${this.keyPrefix}:${key}`;
  }

  async get(key: string): Promise<T | null> {
    const cacheKey = this.generateKey(key);

    if (this.useRedis && this.redisClient) {
      try {
        const cached = await this.redisClient.get(cacheKey);
        if (cached) {
          this.hits++;
          const parsed = JSON.parse(cached) as QueryCacheEntry<T>;
          await this.redisClient.hIncrBy(`${cacheKey}:stats`, 'hits', 1);
          return parsed.value;
        }
      } catch (error) {
        console.error('Redis cache get error:', error);
      }
    }

    const entry = this.cache.get(cacheKey);
    if (!entry) {
      this.misses++;
      return null;
    }

    if (Date.now() > entry.createdAt + entry.ttl * 1000) {
      this.cache.delete(cacheKey);
      this.misses++;
      return null;
    }

    entry.hitCount++;
    this.hits++;
    return entry.value;
  }

  async set(key: string, value: T, options: CacheOptions = {}): Promise<void> {
    const cacheKey = this.generateKey(key);
    const ttl = options.ttl || this.defaultTtl;

    if (this.useRedis && this.redisClient) {
      try {
        const entry: QueryCacheEntry<T> = {
          value,
          createdAt: Date.now(),
          ttl,
          hitCount: 0,
        };
        await this.redisClient.setEx(cacheKey, ttl, JSON.stringify(entry));
        return;
      } catch (error) {
        console.error('Redis cache set error:', error);
      }
    }

    if (this.cache.size >= this.maxSize) {
      this.evictOldest();
    }

    const entry: QueryCacheEntry<T> = {
      value,
      createdAt: Date.now(),
      ttl,
      hitCount: 0,
    };

    this.cache.set(cacheKey, entry);
  }

  async delete(key: string): Promise<void> {
    const cacheKey = this.generateKey(key);

    if (this.useRedis && this.redisClient) {
      try {
        await this.redisClient.del(cacheKey);
        await this.redisClient.del(`${cacheKey}:stats`);
      } catch (error) {
        console.error('Redis cache delete error:', error);
      }
    }

    this.cache.delete(cacheKey);
  }

  async clear(): Promise<void> {
    if (this.useRedis && this.redisClient) {
      try {
        const keys = await this.redisClient.keys(`${this.keyPrefix}:*`);
        if (keys.length > 0) {
          await this.redisClient.del(keys);
        }
      } catch (error) {
        console.error('Redis cache clear error:', error);
      }
    }

    this.cache.clear();
    this.hits = 0;
    this.misses = 0;
  }

  async invalidatePattern(pattern: string): Promise<number> {
    const regex = new RegExp(pattern.replace(/\*/g, '.*'));
    let count = 0;

    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
        count++;
      }
    }

    if (this.useRedis && this.redisClient) {
      try {
        const keys = await this.redisClient.keys(this.generateKey(pattern));
        if (keys.length > 0) {
          await this.redisClient.del(keys);
          count += keys.length;
        }
      } catch (error) {
        console.error('Redis pattern invalidate error:', error);
      }
    }

    return count;
  }

  private evictOldest(): void {
    let oldestKey: string | null = null;
    let oldestTime = Date.now();

    for (const [key, entry] of this.cache.entries()) {
      if (entry.createdAt < oldestTime) {
        oldestTime = entry.createdAt;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
    }
  }

  startCleanup(intervalMs: number = 60000): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }

    this.cleanupInterval = setInterval(() => {
      const now = Date.now();
      for (const [key, entry] of this.cache.entries()) {
        if (now > entry.createdAt + entry.ttl * 1000) {
          this.cache.delete(key);
        }
      }
    }, intervalMs);
  }

  stopCleanup(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }

  getStats(): QueryCacheStats {
    const total = this.hits + this.misses;
    const hitRate = total > 0 ? (this.hits / total) * 100 : 0;

    let memoryUsage = 0;
    for (const entry of this.cache.values()) {
      memoryUsage += JSON.stringify(entry.value).length;
    }

    return {
      hits: this.hits,
      misses: this.misses,
      size: this.cache.size,
      hitRate,
      memoryUsage,
    };
  }
}

export const createQueryCache = <T = unknown>(options?: {
  maxSize?: number;
  defaultTtl?: number;
  redisClient?: RedisClientType;
  useRedis?: boolean;
  prefix?: string;
}): QueryCache<T> => {
  return new QueryCache<T>(options);
};

export function withCache<T extends (...args: unknown[]) => Promise<unknown>>(
  cache: QueryCache,
  keyFn: (...args: Parameters<T>) => string,
  options: { ttl?: number; skip?: boolean } = {}
): (fn: T) => (...args: Parameters<T>) => Promise<unknown> {
  return (fn: T) => {
    return async (...args: Parameters<T>) => {
      if (options.skip) {
        return fn(...args);
      }

      const key = keyFn(...args);
      const cached = await cache.get(key);
      
      if (cached !== null) {
        return cached;
      }

      const result = await fn(...args);
      await cache.set(key, result, { ttl: options.ttl });
      return result;
    };
  };
}
