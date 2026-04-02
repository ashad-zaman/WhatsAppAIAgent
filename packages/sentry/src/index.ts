import * as Sentry from '@sentry/node';
import { ProfilingIntegration } from '@sentry/profiling-node';
import type { NodeOptions } from '@sentry/node';

export interface SentryConfig {
  dsn: string;
  environment: string;
  release?: string;
  sampleRate?: number;
  tracesSampleRate?: number;
  profilesSampleRate?: number;
  enabled?: boolean;
  ignoreErrors?: string[];
  ignorePaths?: string[];
  includeLocalVariables?: boolean;
  maxBreadcrumbs?: number;
}

const DEFAULT_CONFIG: Partial<SentryConfig> = {
  sampleRate: 1,
  tracesSampleRate: 0.1,
  profilesSampleRate: 0.1,
  enabled: true,
  maxBreadcrumbs: 50,
  includeLocalVariables: true,
  ignoreErrors: [
    'NetworkError',
    'Network request failed',
    'timeout',
    'ECONNRESET',
    'ETIMEDOUT',
    'AbortError',
  ],
  ignorePaths: [
    /node_modules/,
    /webpack/,
    /node:internal/,
    /vm\.js/,
    /main\.js/,
  ],
};

export function initSentry(config: SentryConfig): void {
  if (!config.enabled) {
    console.log('Sentry is disabled');
    return;
  }

  const mergedConfig: NodeOptions = {
    dsn: config.dsn,
    environment: config.environment,
    release: config.release,
    sampleRate: config.sampleRate,
    tracesSampleRate: config.tracesSampleRate,
    profilesSampleRate: config.profilesSampleRate,
    maxBreadcrumbs: config.maxBreadcrumbs,
    includeLocalVariables: config.includeLocalVariables,
    ignoreErrors: config.ignoreErrors,
    ignoreUrls: config.ignorePaths,
    integrations: [
      new ProfilingIntegration(),
      new Sentry.Integrations.Http({ tracing: true }),
      new Sentry.Integrations.Express(),
      new Sentry.Integrations.GraphQL(),
      new Sentry.Integrations.Prisma({ traceQL: true }),
      new Sentry.Integrations.Mongo({ traceMongodbQueries: true }),
      new Sentry.Integrations.Redis({ traceRedisCalls: true }),
      new Sentry.Integrations.GraphQL({ enableTracedResolve: true }),
      new Sentry.Integrations.Queue({ heartbeatInterval: 5000 }),
    ],
    beforeSend: (event, hint) => {
      const error = hint?.originalException as Error | undefined;
      if (error) {
        event.tags = {
          ...event.tags,
          errorName: error.name,
          errorMessage: error.message,
        };
        if (error.stack) {
          event.extra = {
            ...event.extra,
            stack: error.stack,
          };
        }
      }
      return event;
    },
    beforeSendTransaction: (transaction) => {
      if (transaction.contexts?.trace?.op === 'middleware') {
        return null;
      }
      return transaction;
    },
  };

  Sentry.init(mergedConfig);

  console.log(`Sentry initialized for environment: ${config.environment}`);
}

export function setupGlobalErrorHandlers(): void {
  process.on('uncaughtException', (error: Error) => {
    Sentry.captureException(error, {
      level: 'fatal',
      extra: {
        type: 'uncaughtException',
      },
    });
    Sentry.flush().then(() => {
      console.error('Uncaught Exception:', error);
      process.exit(1);
    });
  });

  process.on('unhandledRejection', (reason: unknown) => {
    Sentry.captureException(reason as Error, {
      level: 'error',
      extra: {
        type: 'unhandledRejection',
      },
    });
    console.error('Unhandled Rejection:', reason);
  });
}

export function createTransaction(name: string, op: string = 'manual'): Sentry.Transaction | undefined {
  return Sentry.startTransaction({
    op,
    name,
  });
}

export function withSentrySpan<T>(
  name: string,
  fn: (span: Sentry.Span) => Promise<T>
): Promise<T> {
  return Sentry.startSpan({ name, op: 'function' }, async (span) => {
    try {
      const result = await fn(span);
      span.setStatus({ code: Sentry.SpanStatus.Ok });
      return result;
    } catch (error) {
      span.setStatus({ code: Sentry.SpanStatus.InternalError });
      throw error;
    }
  });
}

export function addSentryContext(context: Record<string, unknown>): void {
  Sentry.setContext('extra', context);
}

export function setSentryUser(user: {
  id: string;
  email?: string;
  username?: string;
  [key: string]: unknown;
}): void {
  Sentry.setUser({
    id: user.id,
    email: user.email,
    username: user.username,
  });
}

export function clearSentryUser(): void {
  Sentry.setUser(null);
}

export function captureSentryMessage(
  message: string,
  level: Sentry.SeverityLevel = 'info',
  extra?: Record<string, unknown>
): string | undefined {
  return Sentry.captureMessage(message, level, {
    extra,
  });
}

export function captureSentryException(
  error: Error,
  context?: Record<string, unknown>
): string | undefined {
  return Sentry.captureException(error, {
    contexts: context ? { custom: context } : undefined,
  });
}

export async function flushSentry(timeout: number = 2000): Promise<boolean> {
  return Sentry.flush(timeout);
}

export { Sentry };
export default {
  init: initSentry,
  setupGlobalErrorHandlers,
  createTransaction,
  withSentrySpan,
  addSentryContext,
  setSentryUser,
  clearSentryUser,
  captureMessage: captureSentryMessage,
  captureException: captureSentryException,
  flush: flushSentry,
};
