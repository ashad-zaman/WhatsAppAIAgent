import { Request, Response, NextFunction } from 'express';
import { getMetrics } from './metrics.js';

export function metricsMiddleware() {
  const metrics = getMetrics();

  return (req: Request, res: Response, next: NextFunction) => {
    const startTime = Date.now();

    res.on('finish', () => {
      const duration = Date.now() - startTime;
      metrics.recordHttpRequest(req.method, req.path, res.statusCode, duration);
    });

    next();
  };
}

export function errorMetricsMiddleware() {
  const metrics = getMetrics();

  return (err: Error, req: Request, res: Response, next: NextFunction) => {
    metrics.recordError(err.name || 'Error', 'api-gateway');
    next(err);
  };
}
