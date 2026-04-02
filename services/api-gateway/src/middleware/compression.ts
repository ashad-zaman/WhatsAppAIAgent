import { Request, Response, NextFunction } from 'express';
import compression, { Filter } from 'compression';

export interface CompressionConfig {
  level?: number;
  threshold?: number;
  filter?: Filter;
  chunkSize?: number;
  windowBits?: number;
  memLevel?: number;
  strategy?: number;
}

export const defaultCompressionConfig: CompressionConfig = {
  level: 6,
  threshold: 1024,
  chunkSize: 16384,
  windowBits: 15,
  memLevel: 8,
  strategy: 2,
};

export function createCompressionMiddleware(config: CompressionConfig = {}) {
  const mergedConfig = { ...defaultCompressionConfig, ...config };

  return compression({
    level: mergedConfig.level,
    threshold: mergedConfig.threshold,
    filter: mergedConfig.filter,
    chunkSize: mergedConfig.chunkSize,
    windowBits: mergedConfig.windowBits,
    memLevel: mergedConfig.memLevel,
    strategy: mergedConfig.strategy,
  });
}

export function shouldCompress(req: Request, res: Response): boolean {
  if (req.headers['x-no-compression']) {
    return false;
  }

  const contentType = res.getHeader('Content-Type') as string;
  
  const skipCompressionTypes = [
    'image/',
    'audio/',
    'video/',
    'application/octet-stream',
    'font/',
  ];

  for (const type of skipCompressionTypes) {
    if (contentType?.includes(type)) {
      return false;
    }
  }

  const acceptEncoding = req.headers['accept-encoding'] || '';
  if (!acceptEncoding.includes('gzip') && !acceptEncoding.includes('deflate')) {
    return false;
  }

  return true;
}

export function compressionFilter(req: Request, res: Response): boolean {
  return shouldCompress(req, res);
}

export interface StreamCompressionOptions {
  highWaterMark?: number;
  flush?: number;
}

export async function compressStream(
  input: NodeJS.ReadableStream,
  output: NodeJS.WritableStream,
  options: StreamCompressionOptions = {}
): Promise<void> {
  const zlib = await import('zlib');
  const gzip = zlib.createGzip({ ...options });
  
  input.pipe(gzip).pipe(output);
}

export function setCompressionHeaders(res: Response): void {
  res.setHeader('Content-Encoding', 'gzip');
  res.setHeader('Vary', 'Accept-Encoding');
  res.setHeader('X-Content-Type-Options', 'nosniff');
}

export const compressionMiddleware = createCompressionMiddleware();
