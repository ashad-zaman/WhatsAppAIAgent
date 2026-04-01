import { createClient, RedisClientType, RedisClusterType, ClusterNode } from 'redis';
import { config } from '@whatsapp-ai/config';
import { createQueryCache, QueryCache } from '../utils/query-cache';

export interface RedisPoolConfig {
  url?: string;
  socket?: {
    host?: string;
    port?: number;
    reconnectStrategy?: (retries: number) => number | Error;
    connectTimeout?: number;
    maxRetriesPerRequest?: number;
    enableReadyCheck?: boolean;
    lazyConnect?: boolean;
  };
  password?: string;
  database?: number;
  name?: string;
  family?: string;
  enableOfflineQueue?: boolean;
  retryStrategy?: (options: { attempt: number; total_retry_time: number; error: Error }) => number | void;
  maxRetriesPerRequest?: number;
  enableReadyCheck?: boolean;
  connectTimeout?: number;
  commandTimeout?: number;
  autoResubscribe?: boolean;
  enableAutoPipelining?: boolean;
  pipelineBufferSize?: number;
  useReplicas?: boolean;
}

export interface RedisClusterConfig {
  rootNodes: ClusterNode[];
  defaults?: {
    password?: string;
    useReplicas?: boolean;
    maxCommandRedirections?: number;
  };
}

export interface RedisMetrics {
  totalConnections: number;
  activeConnections: number;
  idleConnections: number;
  commandCount: number;
  errorCount: number;
  averageCommandTime: number;
  hitRate: number;
  memoryUsage: number;
}

export interface RedisHealth {
  isHealthy: boolean;
  latency: number;
  connectionState: string;
  error?: string;
}

let redisClient: RedisClientType | null = null;
let clusterClient: RedisClusterType | null = null;
let queryCache: QueryCache | null = null;

const metrics = {
  commandCount: 0,
  errorCount: 0,
  commandTimes: [] as number[],
};

const defaultConfig: RedisPoolConfig = {
  socket: {
    reconnectStrategy: (retries: number) => {
      if (retries > 20) {
        return new Error('Max reconnection attempts reached');
      }
      return Math.min(retries * 100, 3000);
    },
    connectTimeout: 10000,
    maxRetriesPerRequest: 3,
  },
  maxRetriesPerRequest: 3,
  enableReadyCheck: true,
  autoResubscribe: true,
  enableAutoPipelining: true,
};

export const connectRedis = async (clusterConfig?: RedisClusterConfig): Promise<RedisClientType | RedisClusterType> => {
  if (redisClient?.isOpen) {
    return redisClient;
  }

  if (clusterConfig) {
    return connectRedisCluster(clusterConfig);
  }

  try {
    const url = config.redis.url;
    redisClient = createClient({
      url,
      ...defaultConfig,
      socket: {
        ...defaultConfig.socket,
      },
    });

    setupEventHandlers(redisClient);
    await redisClient.connect();
    
    queryCache = createQueryCache({
      redisClient: redisClient as unknown as RedisClientType,
      useRedis: true,
      prefix: 'wa:cache',
      maxSize: 10000,
      defaultTtl: 300,
    });
    queryCache.startCleanup(60000);

    console.log('Redis connected successfully with connection pooling');
    return redisClient;
  } catch (error) {
    console.error('Failed to connect to Redis:', error);
    throw error;
  }
};

export const connectRedisCluster = async (clusterConfig: RedisClusterConfig): Promise<RedisClusterType> => {
  try {
    clusterClient = createClient({
      rootNodes: clusterConfig.rootNodes,
      defaults: clusterConfig.defaults,
      useReplicas: clusterConfig.defaults?.useReplicas ?? true,
      maxCommandRedirections: clusterConfig.defaults?.maxCommandRedirections ?? 3,
    });

    clusterClient.on('error', (err) => {
      console.error('Redis Cluster Error:', err);
      metrics.errorCount++;
    });

    clusterClient.on('connecting', () => {
      console.log('Redis Cluster connecting...');
    });

    clusterClient.on('connect', () => {
      console.log('Redis Cluster connected successfully');
    });

    clusterClient.on('ready', () => {
      console.log('Redis Cluster ready');
    });

    clusterClient.on('reconnecting', () => {
      console.log('Redis Cluster reconnecting...');
    });

    await clusterClient.connect();
    
    console.log('Redis Cluster connected successfully');
    return clusterClient;
  } catch (error) {
    console.error('Failed to connect to Redis Cluster:', error);
    throw error;
  }
};

function setupEventHandlers(client: RedisClientType): void {
  client.on('error', (err) => {
    console.error('Redis Client Error:', err);
    metrics.errorCount++;
  });

  client.on('connect', () => {
    console.log('Redis connected successfully');
  });

  client.on('ready', () => {
    console.log('Redis ready');
  });

  client.on('reconnecting', () => {
    console.log('Redis reconnecting...');
  });

  client.on('end', () => {
    console.log('Redis connection ended');
  });
}

export const disconnectRedis = async () => {
  if (queryCache) {
    queryCache.stopCleanup();
    await queryCache.clear();
    queryCache = null;
  }

  if (clusterClient?.isOpen) {
    await clusterClient.quit();
    clusterClient = null;
  } else if (redisClient?.isOpen) {
    await redisClient.quit();
    redisClient = null;
  }
  
  console.log('Redis disconnected');
};

export const getRedisClient = (): RedisClientType => {
  if (!redisClient || !redisClient.isOpen) {
    throw new Error('Redis not connected. Call connectRedis() first.');
  }
  return redisClient;
};

export const getRedisCluster = (): RedisClusterType => {
  if (!clusterClient || !clusterClient.isOpen) {
    throw new Error('Redis Cluster not connected. Call connectRedis() with cluster config first.');
  }
  return clusterClient;
};

export const getQueryCache = (): QueryCache => {
  if (!queryCache) {
    queryCache = createQueryCache({
      redisClient: redisClient as unknown as RedisClientType,
      useRedis: true,
      prefix: 'wa:cache',
    });
  }
  return queryCache;
};

export const redisKeys = {
  session: (sessionId: string) => `wa:session:${sessionId}`,
  userPreferences: (userId: string) => `wa:user:${userId}:prefs`,
  agentState: (agentId: string) => `wa:agent:${agentId}:state`,
  rateLimit: (identifier: string) => `wa:rate:${identifier}`,
  cache: (key: string) => `wa:cache:${key}`,
  lock: (resource: string) => `wa:lock:${resource}`,
  queue: (queueName: string) => `wa:queue:${queueName}`,
  messageBuffer: (sessionId: string) => `wa:buffer:${sessionId}`,
  typingIndicator: (userId: string) => `wa:typing:${userId}`,
  agent: {
    memory: (agentId: string, memoryId: string) => `wa:agent:${agentId}:memory:${memoryId}`,
    context: (agentId: string, sessionId: string) => `wa:agent:${agentId}:context:${sessionId}`,
  },
  rag: {
    query: (queryHash: string) => `wa:rag:query:${queryHash}`,
    document: (docId: string) => `wa:rag:doc:${docId}`,
    embedding: (docId: string, chunkId: string) => `wa:rag:embed:${docId}:${chunkId}`,
  },
};

export async function acquireLock(
  resource: string,
  ttlSeconds: number = 30,
  retryCount: number = 3,
  retryDelayMs: number = 100
): Promise<string | null> {
  const client = getRedisClient();
  const lockKey = redisKeys.lock(resource);
  const lockValue = `${process.pid}:${Date.now()}:${Math.random()}`;

  for (let i = 0; i < retryCount; i++) {
    const acquired = await client.set(lockKey, lockValue, {
      NX: true,
      EX: ttlSeconds,
    });

    if (acquired === 'OK') {
      return lockValue;
    }

    if (i < retryCount - 1) {
      await new Promise(resolve => setTimeout(resolve, retryDelayMs * (i + 1)));
    }
  }

  return null;
}

export async function releaseLock(resource: string, lockValue: string): Promise<boolean> {
  const client = getRedisClient();
  const lockKey = redisKeys.lock(resource);

  const script = `
    if redis.call("get", KEYS[1]) == ARGV[1] then
      return redis.call("del", KEYS[1])
    else
      return 0
    end
  `;

  const result = await client.eval(script, {
    keys: [lockKey],
    arguments: [lockValue],
  });

  return result === 1;
}

export async function executeWithRedisMetrics<T>(
  fn: () => Promise<T>
): Promise<{ result: T; duration: number }> {
  const startTime = Date.now();
  metrics.commandCount++;

  try {
    const result = await fn();
    const duration = Date.now() - startTime;
    metrics.commandTimes.push(duration);
    
    if (metrics.commandTimes.length > 1000) {
      metrics.commandTimes.shift();
    }
    
    return { result, duration };
  } catch (error) {
    metrics.errorCount++;
    throw error;
  }
}

export function getRedisMetrics(): RedisMetrics {
  return {
    totalConnections: 1,
    activeConnections: redisClient?.isOpen ? 1 : 0,
    idleConnections: 0,
    commandCount: metrics.commandCount,
    errorCount: metrics.errorCount,
    averageCommandTime: metrics.commandTimes.length > 0
      ? metrics.commandTimes.reduce((a, b) => a + b, 0) / metrics.commandTimes.length
      : 0,
    hitRate: queryCache?.getStats().hitRate || 0,
    memoryUsage: 0,
  };
}

export async function checkRedisHealth(): Promise<RedisHealth> {
  const start = Date.now();
  const client = redisClient || clusterClient;

  if (!client) {
    return {
      isHealthy: false,
      latency: 0,
      connectionState: 'not_connected',
      error: 'Redis client not initialized',
    };
  }

  try {
    if (clusterClient) {
      await clusterClient.ping();
    } else if (redisClient) {
      await redisClient.ping();
    }
    
    return {
      isHealthy: true,
      latency: Date.now() - start,
      connectionState: 'connected',
    };
  } catch (error) {
    return {
      isHealthy: false,
      latency: Date.now() - start,
      connectionState: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

export const redisCache = {
  async get<T>(key: string): Promise<T | null> {
    const cache = getQueryCache();
    return cache.get(key) as Promise<T | null>;
  },

  async set(key: string, value: unknown, ttlSeconds?: number): Promise<void> {
    const cache = getQueryCache();
    await cache.set(key, value, { ttl: ttlSeconds });
  },

  async del(key: string): Promise<void> {
    const cache = getQueryCache();
    await cache.delete(key);
  },

  async delPattern(pattern: string): Promise<number> {
    const cache = getQueryCache();
    return cache.invalidatePattern(pattern);
  },

  async exists(key: string): Promise<boolean> {
    const client = getRedisClient();
    return (await client.exists(key)) === 1;
  },

  async expire(key: string, ttlSeconds: number): Promise<void> {
    const client = getRedisClient();
    await client.expire(key, ttlSeconds);
  },

  async getOrSet<T>(
    key: string,
    fn: () => Promise<T>,
    ttlSeconds?: number
  ): Promise<T> {
    const cached = await this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    const value = await fn();
    await this.set(key, value, ttlSeconds);
    return value;
  },
};

export const redisSession = {
  async create(sessionId: string, data: Record<string, unknown>, ttlSeconds: number = 86400): Promise<void> {
    const key = redisKeys.session(sessionId);
    await redisCache.set(key, data, ttlSeconds);
  },

  async get(sessionId: string): Promise<Record<string, unknown> | null> {
    const key = redisKeys.session(sessionId);
    return redisCache.get(key);
  },

  async update(sessionId: string, data: Partial<Record<string, unknown>>): Promise<void> {
    const key = redisKeys.session(sessionId);
    const existing = await redisCache.get<Record<string, unknown>>(key);
    const updated = { ...existing, ...data };
    await redisCache.set(key, updated);
  },

  async delete(sessionId: string): Promise<void> {
    const key = redisKeys.session(sessionId);
    await redisCache.del(key);
  },

  async touch(sessionId: string, ttlSeconds: number = 86400): Promise<void> {
    const key = redisKeys.session(sessionId);
    await redisCache.expire(key, ttlSeconds);
  },
};

export const redisRateLimit = {
  async check(
    identifier: string,
    limit: number,
    windowSeconds: number
  ): Promise<{ allowed: boolean; remaining: number; resetAt: number }> {
    const client = getRedisClient();
    const key = redisKeys.rateLimit(identifier);
    const now = Date.now();
    const windowStart = now - windowSeconds * 1000;

    await client.zRemRangeByScore(key, 0, windowStart);

    const count = await client.zCard(key);

    if (count >= limit) {
      const oldest = await client.zRangeWithScores(key, 0, 0, { REV: false });
      const resetAt = oldest.length > 0
        ? Math.ceil((oldest[0].score + windowSeconds * 1000 - now) / 1000)
        : windowSeconds;
      return { allowed: false, remaining: 0, resetAt };
    }

    await client.zAdd(key, { score: now, value: `${now}` });
    await client.expire(key, windowSeconds);

    return { allowed: true, remaining: limit - count - 1, resetAt: windowSeconds };
  },

  async slidingWindow(
    identifier: string,
    limit: number,
    windowSeconds: number
  ): Promise<{ allowed: boolean; remaining: number; resetAt: number }> {
    const client = getRedisClient();
    const key = redisKeys.rateLimit(identifier);
    const now = Date.now();
    const windowStart = now - windowSeconds * 1000;

    const pipeline = client.multi();
    pipeline.zRemRangeByScore(key, 0, windowStart);
    pipeline.zCard(key);
    pipeline.zAdd(key, { score: now, value: `${now}:${Math.random()}` });
    pipeline.expire(key, windowSeconds);
    const results = await pipeline.exec();

    const count = (results?.[1] as number) || 0;

    if (count >= limit) {
      return { allowed: false, remaining: 0, resetAt: windowSeconds };
    }

    return { allowed: true, remaining: limit - count - 1, resetAt: windowSeconds };
  },

  async fixedWindow(
    identifier: string,
    limit: number,
    windowSeconds: number
  ): Promise<{ allowed: boolean; remaining: number; resetAt: number }> {
    const client = getRedisClient();
    const key = redisKeys.rateLimit(identifier);
    const now = Date.now();
    const windowStart = Math.floor(now / (windowSeconds * 1000)) * windowSeconds * 1000;
    const windowEnd = windowStart + windowSeconds * 1000;

    const count = await client.incr(key);
    
    if (count === 1) {
      await client.pexpireAt(key, windowEnd);
    }

    const remaining = Math.max(0, limit - count);
    const resetAt = Math.ceil((windowEnd - now) / 1000);

    return {
      allowed: count <= limit,
      remaining,
      resetAt,
    };
  },
};

export const redisPubSub = {
  async publish(channel: string, message: unknown): Promise<number> {
    const client = getRedisClient();
    return client.publish(channel, JSON.stringify(message));
  },

  async subscribe(
    channel: string,
    callback: (message: unknown) => void
  ): Promise<() => void> {
    const subscriber = createClient({
      url: config.redis.url,
    });
    await subscriber.connect();

    await subscriber.subscribe(channel, (message) => {
      try {
        callback(JSON.parse(message));
      } catch {
        callback(message);
      }
    });

    return async () => {
      await subscriber.unsubscribe(channel);
      await subscriber.quit();
    };
  },

  async patternSubscribe(
    pattern: string,
    callback: (channel: string, message: unknown) => void
  ): Promise<() => void> {
    const subscriber = createClient({
      url: config.redis.url,
    });
    await subscriber.connect();

    await subscriber.pSubscribe(pattern, (channel, message) => {
      try {
        callback(channel, JSON.parse(message));
      } catch {
        callback(channel, message);
      }
    });

    return async () => {
      await subscriber.pUnsubscribe(pattern);
      await subscriber.quit();
    };
  },
};

export default {
  connect: connectRedis,
  disconnect: disconnectRedis,
  getClient: getRedisClient,
  getCluster: getRedisCluster,
  getCache: getQueryCache,
  keys: redisKeys,
  cache: redisCache,
  session: redisSession,
  rateLimit: redisRateLimit,
  pubSub: redisPubSub,
  acquireLock,
  releaseLock,
  executeWithMetrics: executeWithRedisMetrics,
  getMetrics: getRedisMetrics,
  checkHealth: checkRedisHealth,
};
