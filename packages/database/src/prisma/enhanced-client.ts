import { PrismaClient, Prisma } from '@prisma/client';
import { Pool, PoolConfig } from 'pg';
import { EventEmitter } from 'events';

export interface ConnectionPoolConfig {
  min?: number;
  max?: number;
  acquireTimeoutMillis?: number;
  idleTimeoutMillis?: number;
  reapIntervalMillis?: number;
  createRetryIntervalMillis?: number;
  createTimeoutMillis?: number;
  destroyTimeoutMillis?: number;
  autoCaption?: boolean;
  evictionRunIntervalMillis?: number;
}

export interface QueryOptions {
  timeout?: number;
  cache?: boolean;
  cacheTtl?: number;
  tags?: string[];
  signal?: AbortSignal;
}

export interface QueryResult<T> {
  data: T;
  cached: boolean;
  duration: number;
  tags: string[];
}

export interface PoolMetrics {
  totalConnections: number;
  idleConnections: number;
  waitingClients: number;
  maxConnections: number;
  minConnections: number;
  averageWaitTime: number;
  queryCount: number;
  errorCount: number;
}

export interface ConnectionHealth {
  isHealthy: boolean;
  latency: number;
  error?: string;
}

export class EnhancedPrismaClient {
  private client: PrismaClient;
  private poolConfig: ConnectionPoolConfig;
  private metrics: {
    queryCount: number;
    errorCount: number;
    totalWaitTime: number;
    queryTimes: number[];
  };
  private eventEmitter: EventEmitter;
  private queryCache: Map<string, { data: unknown; expiry: number }>;

  constructor(config: ConnectionPoolConfig = {}) {
    this.poolConfig = {
      min: 2,
      max: 20,
      acquireTimeoutMillis: 30000,
      idleTimeoutMillis: 30000,
      reapIntervalMillis: 1000,
      autoCaption: true,
      ...config,
    };

    this.metrics = {
      queryCount: 0,
      errorCount: 0,
      totalWaitTime: 0,
      queryTimes: [],
    };

    this.eventEmitter = new EventEmitter();
    this.queryCache = new Map();

    this.client = new PrismaClient({
      log: process.env.NODE_ENV === 'production' 
        ? ['error', 'warn'] 
        : ['query', 'error', 'warn', 'info'],
      datasources: {
        db: {
          url: process.env.DATABASE_URL,
        },
      },
    });

    this.setupQueryLogging();
  }

  private setupQueryLogging(): void {
    this.client.$on('query' as never, (e: Prisma.QueryEvent) => {
      const duration = e.duration;
      this.metrics.queryCount++;
      this.metrics.queryTimes.push(duration);
      
      if (this.metrics.queryTimes.length > 1000) {
        this.metrics.queryTimes.shift();
      }

      this.eventEmitter.emit('query', {
        query: e.query,
        duration,
        params: e.params,
        timestamp: Date.now(),
      });

      if (duration > 1000) {
        this.eventEmitter.emit('slowQuery', {
          query: e.query,
          duration,
          params: e.params,
        });
      }
    });

    this.client.$on('error' as never, (e: Prisma.LogEvent) => {
      this.metrics.errorCount++;
      this.eventEmitter.emit('error', e);
    });
  }

  async connect(): Promise<void> {
    await this.client.$connect();
    console.log('Enhanced Prisma client connected');
  }

  async disconnect(): Promise<void> {
    await this.client.$disconnect();
    this.queryCache.clear();
    console.log('Enhanced Prisma client disconnected');
  }

  getClient(): PrismaClient {
    return this.client;
  }

  async execute<T>(
    operation: string,
    fn: (prisma: PrismaClient) => Promise<T>,
    options: QueryOptions = {}
  ): Promise<QueryResult<T>> {
    const startTime = Date.now();
    const cacheKey = options.cache ? `${operation}:${JSON.stringify(options.tags || [])}` : null;
    
    if (cacheKey && this.queryCache.has(cacheKey)) {
      const cached = this.queryCache.get(cacheKey)!;
      if (cached.expiry > Date.now()) {
        return {
          data: cached.data as T,
          cached: true,
          duration: Date.now() - startTime,
          tags: options.tags || [],
        };
      }
      this.queryCache.delete(cacheKey);
    }

    try {
      const data = await fn(this.client);
      const duration = Date.now() - startTime;

      if (cacheKey && options.cacheTtl) {
        this.queryCache.set(cacheKey, {
          data,
          expiry: Date.now() + options.cacheTtl * 1000,
        });
      }

      return {
        data,
        cached: false,
        duration,
        tags: options.tags || [],
      };
    } catch (error) {
      this.metrics.errorCount++;
      throw error;
    }
  }

  async findManyPaginated<T>(
    model: keyof PrismaClient,
    findOptions: Record<string, unknown>,
    options: {
      page?: number;
      limit?: number;
      sortBy?: string;
      sortOrder?: 'asc' | 'desc';
      cache?: boolean;
      cacheTtl?: number;
    } = {}
  ): Promise<{
    data: T[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
      hasNext: boolean;
      hasPrev: boolean;
    };
    cached: boolean;
    duration: number;
  }> {
    const {
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      cache = false,
      cacheTtl = 60,
    } = options;

    const cacheKey = `paginated:${model}:${JSON.stringify(findOptions)}:${page}:${limit}:${sortBy}:${sortOrder}`;

    if (cache && this.queryCache.has(cacheKey)) {
      const cached = this.queryCache.get(cacheKey)!;
      if (cached.expiry > Date.now()) {
        return {
          ...(cached.data as { pagination: unknown; data: T[] }),
          cached: true,
          duration: 0,
        };
      }
    }

    const startTime = Date.now();
    const skip = (page - 1) * limit;

    const [data, count] = await Promise.all([
      (this.client[model] as unknown as { findMany: (options: unknown) => Promise<T[]> }).findMany({
        where: findOptions,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
      }),
      (this.client[model] as unknown as { count: (options: unknown) => Promise<number> }).count({
        where: findOptions,
      }),
    ]);

    const duration = Date.now() - startTime;
    const totalPages = Math.ceil(count / limit);

    const result = {
      data,
      pagination: {
        page,
        limit,
        total: count,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
      cached: false,
      duration,
    };

    if (cache && cacheTtl) {
      this.queryCache.set(cacheKey, {
        data: result,
        expiry: Date.now() + cacheTtl * 1000,
      });
    }

    return result;
  }

  getMetrics(): PoolMetrics {
    return {
      totalConnections: this.metrics.queryCount,
      idleConnections: this.queryCache.size,
      waitingClients: 0,
      maxConnections: this.poolConfig.max || 20,
      minConnections: this.poolConfig.min || 2,
      averageWaitTime: this.metrics.queryTimes.length > 0
        ? this.metrics.queryTimes.reduce((a, b) => a + b, 0) / this.metrics.queryTimes.length
        : 0,
      queryCount: this.metrics.queryCount,
      errorCount: this.metrics.errorCount,
    };
  }

  async checkHealth(): Promise<ConnectionHealth> {
    const start = Date.now();
    try {
      await this.client.$queryRaw`SELECT 1`;
      return {
        isHealthy: true,
        latency: Date.now() - start,
      };
    } catch (error) {
      return {
        isHealthy: false,
        latency: Date.now() - start,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  clearCache(): void {
    this.queryCache.clear();
  }

  on(event: string, listener: (...args: unknown[]) => void): void {
    this.eventEmitter.on(event, listener);
  }

  off(event: string, listener: (...args: unknown[]) => void): void {
    this.eventEmitter.off(event, listener);
  }
}

let enhancedPrismaInstance: EnhancedPrismaClient | null = null;

export const getEnhancedPrisma = (config?: ConnectionPoolConfig): EnhancedPrismaClient => {
  if (!enhancedPrismaInstance) {
    enhancedPrismaInstance = new EnhancedPrismaClient(config);
  }
  return enhancedPrismaInstance;
};

export const enhancedPrisma = getEnhancedPrisma();
