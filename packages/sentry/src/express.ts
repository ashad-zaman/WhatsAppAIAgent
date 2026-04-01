import type { Request, Response, NextFunction, RequestHandler } from 'express';
import * as Sentry from '@sentry/node';
import type { Transaction, Span } from '@sentry/node';

declare global {
  namespace Express {
    interface Request {
      sentryTransaction?: Transaction;
      sentrySpan?: Span;
    }
  }
}

export interface ExpressMiddlewareOptions {
  withTransaction?: boolean;
  withUserContext?: boolean;
  userIdExtractor?: (req: Request) => string | undefined;
  emailExtractor?: (req: Request) => string | undefined;
  usernameExtractor?: (req: Request) => string | undefined;
  transactionNaming?: (req: Request) => string;
  ignoredRoutes?: string[];
}

const DEFAULT_OPTIONS: ExpressMiddlewareOptions = {
  withTransaction: true,
  withUserContext: true,
  ignoredRoutes: ['/health', '/ready', '/metrics', '/favicon.ico'],
  transactionNaming: (req: Request) => {
    const method = req.method.toUpperCase();
    const path = req.route?.path || req.path;
    return `${method} ${path}`;
  },
};

export function sentryExpressMiddleware(
  options: ExpressMiddlewareOptions = {}
): RequestHandler {
  const config = { ...DEFAULT_OPTIONS, ...options };

  return (req: Request, res: Response, next: NextFunction): void => {
    if (config.ignoredRoutes?.some(route => req.path.startsWith(route))) {
      return next();
    }

    if (config.withUserContext && req.user) {
      const userData: Record<string, unknown> = {
        id: req.user.id || req.user._id,
      };
      
      if (config.userIdExtractor) {
        const userId = config.userIdExtractor(req);
        if (userId) userData.id = userId;
      }
      if (config.emailExtractor) {
        const email = config.emailExtractor(req);
        if (email) userData.email = email;
      }
      if (config.usernameExtractor) {
        const username = config.usernameExtractor(req);
        if (username) userData.username = username;
      }

      Sentry.setUser(userData as Sentry.User);
    }

    if (config.withTransaction) {
      const transactionName = config.transactionNaming(req);
      
      req.sentryTransaction = Sentry.startTransaction({
        op: 'http',
        name: transactionName,
        tags: {
          method: req.method,
          path: req.path,
        },
        metadata: {
          request: {
            method: req.method,
            url: req.originalUrl,
            headers: {
              'user-agent': req.get('user-agent'),
              'content-type': req.get('content-type'),
            },
          },
        },
      });

      req.sentryTransaction.initSpanRecorder(20);

      const originalEnd = res.end;
      res.end = function(this: Response, ...args: Parameters<Response['end']>): ReturnType<typeof originalEnd> {
        req.sentryTransaction?.setHttpStatus(res.statusCode);

        if (res.statusCode >= 400) {
          req.sentryTransaction.setStatus(new Sentry.SpanStatus({
            code: res.statusCode >= 500 ? 2 : 1,
            description: `${res.statusCode} ${res.statusMessage}`,
          }));
        }

        req.sentryTransaction?.finish();
        return originalEnd.apply(this, args);
      };

      Sentry.getCurrentHub().configureScope((scope) => {
        scope.setSpan(req.sentryTransaction);
      });
    }

    next();
  };
}

export function sentryErrorHandler(): (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => void {
  return (err: Error, req: Request, res: Response, next: NextFunction): void => {
    if (req.sentryTransaction) {
      req.sentryTransaction.setStatus({
        code: 2,
        description: err.message,
      });
    }

    Sentry.captureException(err, {
      extra: {
        request: {
          method: req.method,
          url: req.originalUrl,
          path: req.path,
          query: req.query,
          params: req.params,
          body: req.body,
        },
        user: req.user ? {
          id: (req.user as { id?: string }).id,
          email: (req.user as { email?: string }).email,
        } : undefined,
      },
      contexts: {
        response: {
          status_code: res.statusCode,
          headers: res.getHeaders(),
        },
      },
    });

    next(err);
  };
}

export function createSentrySpan(
  name: string,
  fn: (span: Span) => Promise<unknown>
): (req: Request, res: Response, next: NextFunction) => void {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.sentryTransaction) {
      next();
      return;
    }

    req.sentryTransaction.startChild({
      op: 'middleware',
      description: name,
    }).then(async (span) => {
      try {
        await fn(span);
        span.setStatus({ code: Sentry.SpanStatus.Ok });
      } catch (error) {
        span.setStatus({ code: Sentry.SpanStatus.InternalError });
        throw error;
      } finally {
        span.finish();
      }
    }).catch(next);
  };
}

export { Sentry };
