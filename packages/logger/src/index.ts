export interface Logger {
  info(message: string, meta?: Record<string, unknown>): void;
  warn(message: string, meta?: Record<string, unknown>): void;
  error(message: string, meta?: Record<string, unknown>): void;
  debug(message: string, meta?: Record<string, unknown>): void;
}

export const createLogger = (name: string): Logger => ({
  info: (message, meta) => console.log(`[${name}] INFO:`, message, meta || ''),
  warn: (message, meta) => console.warn(`[${name}] WARN:`, message, meta || ''),
  error: (message, meta) => console.error(`[${name}] ERROR:`, message, meta || ''),
  debug: (message, meta) => console.debug(`[${name}] DEBUG:`, message, meta || ''),
});
