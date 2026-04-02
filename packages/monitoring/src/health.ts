import { Request, Response } from 'express';

export interface HealthCheckResult {
  name: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  latencyMs?: number;
  error?: string;
  metadata?: Record<string, unknown>;
}

export interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  version: string;
  uptime: number;
  checks: HealthCheckResult[];
}

export interface ServiceHealthChecker {
  name: string;
  check: () => Promise<HealthCheckResult>;
}

export class HealthCheckService {
  private services: ServiceHealthChecker[] = [];
  private startTime: number;
  private version: string;

  constructor(version: string = '1.0.0') {
    this.startTime = Date.now();
    this.version = version;
  }

  register(name: string, check: () => Promise<HealthCheckResult>): void {
    this.services.push({ name, check });
  }

  registerService(service: ServiceHealthChecker): void {
    this.services.push(service);
  }

  async checkAll(): Promise<HealthStatus> {
    const results = await Promise.all(
      this.services.map(async (service) => {
        const start = Date.now();
        try {
          const result = await service.check();
          return {
            ...result,
            latencyMs: Date.now() - start,
          };
        } catch (error) {
          return {
            name: service.name,
            status: 'unhealthy' as const,
            latencyMs: Date.now() - start,
            error: error instanceof Error ? error.message : 'Unknown error',
          };
        }
      })
    );

    const overallStatus = this.calculateOverallStatus(results);

    return {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      version: this.version,
      uptime: Math.floor((Date.now() - this.startTime) / 1000),
      checks: results,
    };
  }

  private calculateOverallStatus(checks: HealthCheckResult[]): 'healthy' | 'degraded' | 'unhealthy' {
    if (checks.some((c) => c.status === 'unhealthy')) {
      return 'unhealthy';
    }
    if (checks.some((c) => c.status === 'degraded')) {
      return 'degraded';
    }
    return 'healthy';
  }
}

export function createHealthCheckRouter(healthService: HealthCheckService) {
  return async (req: Request, res: Response) => {
    const status = await healthService.checkAll();
    const httpStatus = status.status === 'unhealthy' ? 503 : 200;
    res.status(httpStatus).json(status);
  };
}

export function createReadinessRouter(healthService: HealthCheckService) {
  return async (req: Request, res: Response) => {
    const status = await healthService.checkAll();
    const isReady = status.checks.every((c) => c.status !== 'unhealthy');
    res.status(isReady ? 200 : 503).json({
      ready: isReady,
      status: status.status,
      timestamp: status.timestamp,
    });
  };
}

export function createLivenessRouter() {
  return (req: Request, res: Response) => {
    res.status(200).json({
      alive: true,
      timestamp: new Date().toISOString(),
    });
  };
}

export async function checkDatabaseHealth(prisma: { $queryRaw: unknown }): Promise<HealthCheckResult> {
  try {
    const start = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    return {
      name: 'database',
      status: 'healthy',
      latencyMs: Date.now() - start,
    };
  } catch (error) {
    return {
      name: 'database',
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Database unavailable',
    };
  }
}

export async function checkRedisHealth(redis: { ping: () => Promise<string> }): Promise<HealthCheckResult> {
  try {
    const start = Date.now();
    await redis.ping();
    return {
      name: 'redis',
      status: 'healthy',
      latencyMs: Date.now() - start,
    };
  } catch (error) {
    return {
      name: 'redis',
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Redis unavailable',
    };
  }
}

export async function checkKafkaHealth(kafka: { admin: () => { listTopics: () => Promise<string[]> } }): Promise<HealthCheckResult> {
  try {
    const start = Date.now();
    const admin = kafka.admin();
    await admin.listTopics();
    return {
      name: 'kafka',
      status: 'healthy',
      latencyMs: Date.now() - start,
    };
  } catch (error) {
    return {
      name: 'kafka',
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Kafka unavailable',
    };
  }
}

export async function checkExternalServiceHealth(
  name: string,
  url: string,
  timeout: number = 5000
): Promise<HealthCheckResult> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    const start = Date.now();
    const response = await fetch(url, {
      method: 'GET',
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    
    if (response.ok) {
      return {
        name,
        status: 'healthy',
        latencyMs: Date.now() - start,
      };
    } else {
      return {
        name,
        status: 'degraded',
        latencyMs: Date.now() - start,
        error: `HTTP ${response.status}`,
      };
    }
  } catch (error) {
    return {
      name,
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Service unavailable',
    };
  }
}
