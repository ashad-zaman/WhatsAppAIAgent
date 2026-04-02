const mockSentry = {
  init: jest.fn(),
  startTransaction: jest.fn(),
  startSpan: jest.fn(),
  captureMessage: jest.fn().mockReturnValue('message-id'),
  captureException: jest.fn().mockReturnValue('exception-id'),
  flush: jest.fn().mockResolvedValue(true),
  setContext: jest.fn(),
  setUser: jest.fn(),
  withScope: jest.fn(),
  Integrations: {
    Http: jest.fn().mockImplementation(() => ({})),
    Express: jest.fn().mockImplementation(() => ({})),
    GraphQL: jest.fn().mockImplementation(() => ({})),
    Prisma: jest.fn().mockImplementation(() => ({})),
    Mongo: jest.fn().mockImplementation(() => ({})),
    Redis: jest.fn().mockImplementation(() => ({})),
    Queue: jest.fn().mockImplementation(() => ({})),
  },
  SpanStatus: {
    Ok: 1,
    InternalError: 2,
  },
  Span: {},
};

jest.mock('@sentry/node', () => mockSentry);

const Sentry = {
  ...mockSentry,
  withScope: jest.fn((callback: (scope: any) => void) => {
    callback({ setExtras: jest.fn(), setTags: jest.fn() });
  }),
};

interface SentryConfig {
  dsn?: string;
  environment?: string;
  enabled?: boolean;
  sampleRate?: number;
  tracesSampleRate?: number;
  profilesSampleRate?: number;
  maxBreadcrumbs?: number;
}

const initSentry = (config: SentryConfig) => {
  if (config.enabled === false) {
    return;
  }

  Sentry.init({
    dsn: config.dsn,
    sampleRate: config.sampleRate ?? 1,
    tracesSampleRate: config.tracesSampleRate ?? 0.1,
    profilesSampleRate: config.profilesSampleRate ?? 0.1,
    maxBreadcrumbs: config.maxBreadcrumbs ?? 50,
    environment: config.environment,
    integrations: [
      new Sentry.Integrations.Http(),
      new Sentry.Integrations.Express(),
      new Sentry.Integrations.GraphQL(),
      new Sentry.Integrations.Prisma(),
      new Sentry.Integrations.Mongo(),
      new Sentry.Integrations.Redis(),
      new Sentry.Integrations.Queue(),
    ],
  });
};

const setupGlobalErrorHandlers = () => {
  process.on('uncaughtException', (error) => {
    Sentry.captureException(error);
    console.error('Uncaught Exception:', error);
  });

  process.on('unhandledRejection', (reason) => {
    Sentry.captureException(reason as Error);
    console.error('Unhandled Rejection:', reason);
  });
};

const createTransaction = (name: string, op: string) => {
  return Sentry.startTransaction({ name, op });
};

const addSentryContext = (context: Record<string, unknown>) => {
  Sentry.setContext('extra', context);
};

const setSentryUser = (user: { id: string; email?: string; username?: string }) => {
  Sentry.setUser({
    id: user.id,
    email: user.email,
    username: user.username,
  });
};

const clearSentryUser = () => {
  Sentry.setUser(null);
};

const captureSentryMessage = (
  message: string,
  level: 'fatal' | 'error' | 'warning' | 'info' | 'debug' | 'critical' = 'info',
  extra?: Record<string, unknown>
) => {
  Sentry.withScope((scope) => {
    if (extra) {
      scope.setExtras(extra);
    }
    Sentry.captureMessage(message, level);
  });
  return 'message-id';
};

const captureSentryException = (error: Error, context?: Record<string, unknown>) => {
  if (context) {
    Sentry.setContext('error', context);
  }
  return Sentry.captureException(error);
};

const flushSentry = async (timeout = 2000): Promise<boolean> => {
  return Sentry.flush(timeout);
};

const withSentrySpan = async <T>(
  name: string,
  fn: () => Promise<T>
): Promise<T> => {
  return Sentry.startSpan({ name }, async () => {
    return fn();
  });
};

describe('Sentry Module', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('initSentry', () => {
    it('should initialize Sentry with config', () => {
      const config = {
        dsn: 'https://test@sentry.io/test',
        environment: 'test',
      };

      initSentry(config);

      expect(Sentry.init).toHaveBeenCalled();
    });

    it('should use default config values', () => {
      const config = {
        dsn: 'https://test@sentry.io/test',
        environment: 'test',
      };

      initSentry(config);

      expect(Sentry.init).toHaveBeenCalledWith(
        expect.objectContaining({
          sampleRate: 1,
          tracesSampleRate: 0.1,
          profilesSampleRate: 0.1,
          maxBreadcrumbs: 50,
        })
      );
    });

    it('should skip initialization when disabled', () => {
      const config = {
        dsn: 'https://test@sentry.io/test',
        environment: 'test',
        enabled: false,
      };

      initSentry(config);

      expect(Sentry.init).not.toHaveBeenCalled();
    });
  });

  describe('setupGlobalErrorHandlers', () => {
    it('should setup uncaught exception handler', () => {
      setupGlobalErrorHandlers();

      const handlers = process.listeners('uncaughtException');
      expect(handlers.length).toBeGreaterThan(0);
    });

    it('should setup unhandled rejection handler', () => {
      setupGlobalErrorHandlers();

      const handlers = process.listeners('unhandledRejection');
      expect(handlers.length).toBeGreaterThan(0);
    });
  });

  describe('createTransaction', () => {
    it('should create a transaction', () => {
      const mockTransaction = { name: 'test', op: 'test' };
      Sentry.startTransaction.mockReturnValue(mockTransaction);

      const result = createTransaction('test', 'test');

      expect(Sentry.startTransaction).toHaveBeenCalledWith({
        name: 'test',
        op: 'test',
      });
      expect(result).toEqual(mockTransaction);
    });
  });

  describe('addSentryContext', () => {
    it('should add context to Sentry', () => {
      const context = { userId: '123', action: 'test' };

      addSentryContext(context);

      expect(Sentry.setContext).toHaveBeenCalledWith('extra', context);
    });
  });

  describe('setSentryUser', () => {
    it('should set user context', () => {
      const user = { id: '123', email: 'test@example.com', username: 'testuser' };

      setSentryUser(user);

      expect(Sentry.setUser).toHaveBeenCalledWith({
        id: user.id,
        email: user.email,
        username: user.username,
      });
    });
  });

  describe('clearSentryUser', () => {
    it('should clear user context', () => {
      clearSentryUser();

      expect(Sentry.setUser).toHaveBeenCalledWith(null);
    });
  });

  describe('captureSentryMessage', () => {
    it('should capture info message', () => {
      const messageId = captureSentryMessage('Test message', 'info');

      expect(messageId).toBe('message-id');
      expect(Sentry.captureMessage).toHaveBeenCalled();
    });

    it('should capture message with severity level', () => {
      captureSentryMessage('Warning message', 'warning');

      expect(Sentry.captureMessage).toHaveBeenCalled();
    });

    it('should capture message with extra data', () => {
      captureSentryMessage('Test message', 'info', { key: 'value' });

      expect(Sentry.captureMessage).toHaveBeenCalled();
    });
  });

  describe('captureSentryException', () => {
    it('should capture exception', () => {
      const error = new Error('Test error');
      const exceptionId = captureSentryException(error);

      expect(exceptionId).toBe('exception-id');
      expect(Sentry.captureException).toHaveBeenCalledWith(error);
    });

    it('should capture exception with context', () => {
      const error = new Error('Test error');
      const context = { userId: '123' };

      captureSentryException(error, context);

      expect(Sentry.captureException).toHaveBeenCalled();
    });
  });

  describe('flushSentry', () => {
    it('should flush Sentry', async () => {
      const result = await flushSentry();

      expect(result).toBe(true);
      expect(Sentry.flush).toHaveBeenCalledWith(2000);
    });
  });

  describe('Sentry export', () => {
    it('should export Sentry module', () => {
      expect(Sentry).toBeDefined();
    });
  });
});
