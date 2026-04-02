import '@testing-library/jest-dom';

process.env.NODE_ENV = 'test';

declare global {
  /* eslint-disable @typescript-eslint/no-explicit-any */
  const window: any;
  /* eslint-enable */
}

if (typeof window !== 'undefined') {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: jest.fn().mockImplementation(query => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    })),
  });

  class IntersectionObserverMock {
    readonly root: Element | null = null;
    readonly rootMargin: string = '';
    readonly thresholds: ReadonlyArray<number> = [];
    observe = jest.fn();
    unobserve = jest.fn();
    disconnect = jest.fn();
    takeRecords = jest.fn().mockReturnValue([]);
  }

  Object.defineProperty(window, 'IntersectionObserver', {
    writable: true,
    value: IntersectionObserverMock,
  });

  class ResizeObserverMock {
    observe = jest.fn();
    unobserve = jest.fn();
    disconnect = jest.fn();
  }

  Object.defineProperty(window, 'ResizeObserver', {
    writable: true,
    value: ResizeObserverMock,
  });
}

process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test_db';
process.env.MONGODB_URL = 'mongodb://localhost:27017/test_db';
process.env.REDIS_URL = 'redis://localhost:6379';
process.env.JWT_SECRET = 'test-jwt-secret-key-256-bits-minimum';
process.env.JWT_EXPIRES_IN = '1h';
process.env.OPENAI_API_KEY = 'sk-test-key';
process.env.WHATSAPP_ACCESS_TOKEN = 'test-whatsapp-token';
process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN = 'test-verify-token';
process.env.KAFKA_BROKERS = 'localhost:9092';
process.env.TEMPORAL_HOST = 'localhost:7233';
process.env.SENTRY_DSN = 'https://test@sentry.io/test';
process.env.SENTRY_ENABLED = 'false';

jest.setTimeout(10000);

global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};
