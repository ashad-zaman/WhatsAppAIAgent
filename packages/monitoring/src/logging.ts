import winston from 'winston';
import { LokiTransport } from 'winston-loki';

export interface LoggerConfig {
  serviceName: string;
  environment: string;
  lokiUrl?: string;
  lokiEnabled?: boolean;
  logLevel?: string;
  prettyPrint?: boolean;
}

export interface LogContext {
  [key: string]: unknown;
  userId?: string;
  sessionId?: string;
  conversationId?: string;
  agentId?: string;
  requestId?: string;
  traceId?: string;
  spanId?: string;
}

const httpFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

const prettyFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
  winston.format.colorize(),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    const metaStr = Object.keys(meta).length ? JSON.stringify(meta, null, 2) : '';
    return `${timestamp} [${level}]: ${message} ${metaStr}`;
  })
);

export class Logger {
  private logger: winston.Logger;
  private serviceName: string;
  private context: LogContext;

  constructor(config: LoggerConfig) {
    this.serviceName = config.serviceName;
    this.context = {};

    const transports: winston.transport[] = [
      new winston.transports.Console({
        format: config.prettyPrint ? prettyFormat : httpFormat,
      }),
    ];

    if (config.lokiEnabled && config.lokiUrl) {
      transports.push(
        new LokiTransport({
          host: config.lokiUrl,
          labels: {
            service: this.serviceName,
            environment: config.environment,
          },
          json: true,
          replaceTimestamp: false,
          onConnectionError: (err) => {
            console.error('Loki connection error:', err);
          },
        })
      );
    }

    this.logger = winston.createLogger({
      level: config.logLevel || 'info',
      defaultMeta: {
        service: this.serviceName,
        environment: config.environment,
      },
      transports,
    });
  }

  setContext(context: LogContext): void {
    this.context = { ...this.context, ...context };
  }

  clearContext(): void {
    this.context = {};
  }

  private formatMessage(message: string, context?: LogContext): object {
    return {
      message,
      ...this.context,
      ...context,
      timestamp: new Date().toISOString(),
    };
  }

  debug(message: string, context?: LogContext): void {
    this.logger.debug(this.formatMessage(message, context));
  }

  info(message: string, context?: LogContext): void {
    this.logger.info(this.formatMessage(message, context));
  }

  warn(message: string, context?: LogContext): void {
    this.logger.warn(this.formatMessage(message, context));
  }

  error(message: string, error?: Error | unknown, context?: LogContext): void {
    const errorMeta: LogContext = {};

    if (error instanceof Error) {
      errorMeta.error = {
        message: error.message,
        name: error.name,
        stack: error.stack,
      };
    } else if (error) {
      errorMeta.error = error;
    }

    this.logger.error(this.formatMessage(message, { ...errorMeta, ...context }));
  }

  child(context: LogContext): ChildLogger {
    return new ChildLogger(this.logger, this.serviceName, {
      ...this.context,
      ...context,
    });
  }

  logRequest(req: {
    method: string;
    url: string;
    ip?: string;
    headers?: Record<string, string>;
    body?: unknown;
  }, res: {
    statusCode: number;
  }, durationMs: number): void {
    this.info('HTTP Request', {
      type: 'http_request',
      http: {
        method: req.method,
        url: req.url,
        statusCode: res.statusCode,
        durationMs,
        ip: req.ip,
        userAgent: req.headers?.['user-agent'],
      },
    });
  }

  logAgentRequest(
    agentType: string,
    input: string,
    output: string,
    durationMs: number,
    success: boolean
  ): void {
    this.info('Agent Request', {
      type: 'agent_request',
      agent: {
        type: agentType,
        inputLength: input.length,
        outputLength: output.length,
        durationMs,
        success,
      },
    });
  }

  logRagQuery(
    query: string,
    resultsCount: number,
    durationMs: number,
    success: boolean
  ): void {
    this.info('RAG Query', {
      type: 'rag_query',
      rag: {
        queryLength: query.length,
        resultsCount,
        durationMs,
        success,
      },
    });
  }

  logWhatsappMessage(
    direction: 'inbound' | 'outbound',
    messageType: string,
    from: string,
    to: string,
    success: boolean
  ): void {
    this.info('WhatsApp Message', {
      type: 'whatsapp_message',
      whatsapp: {
        direction,
        messageType,
        from,
        to,
        success,
      },
    });
  }

  logDatabaseQuery(
    operation: string,
    table: string,
    durationMs: number,
    rowsAffected?: number
  ): void {
    this.debug('Database Query', {
      type: 'database_query',
      database: {
        operation,
        table,
        durationMs,
        rowsAffected,
      },
    });
  }

  logQueueJob(
    queueName: string,
    jobType: string,
    jobId: string,
    durationMs: number,
    success: boolean
  ): void {
    this.info('Queue Job', {
      type: 'queue_job',
      queue: {
        name: queueName,
        jobType,
        jobId,
        durationMs,
        success,
      },
    });
  }

  logWorkflowExecution(
    workflowType: string,
    workflowId: string,
    status: 'started' | 'completed' | 'failed',
    durationMs?: number
  ): void {
    this.info('Workflow Execution', {
      type: 'workflow_execution',
      workflow: {
        type: workflowType,
        id: workflowId,
        status,
        durationMs,
      },
    });
  }
}

class ChildLogger {
  private logger: winston.Logger;
  private serviceName: string;
  private context: LogContext;

  constructor(logger: winston.Logger, serviceName: string, context: LogContext) {
    this.logger = logger;
    this.serviceName = serviceName;
    this.context = context;
  }

  private formatMessage(message: string, context?: LogContext): object {
    return {
      message,
      ...this.context,
      ...context,
      timestamp: new Date().toISOString(),
    };
  }

  debug(message: string, context?: LogContext): void {
    this.logger.debug(this.formatMessage(message, context));
  }

  info(message: string, context?: LogContext): void {
    this.logger.info(this.formatMessage(message, context));
  }

  warn(message: string, context?: LogContext): void {
    this.logger.warn(this.formatMessage(message, context));
  }

  error(message: string, error?: Error | unknown, context?: LogContext): void {
    const errorMeta: LogContext = {};

    if (error instanceof Error) {
      errorMeta.error = {
        message: error.message,
        name: error.name,
        stack: error.stack,
      };
    }

    this.logger.error(this.formatMessage(message, { ...errorMeta, ...context }));
  }
}

let loggerInstance: Logger | null = null;

export function initLogger(config: LoggerConfig): Logger {
  loggerInstance = new Logger(config);
  return loggerInstance;
}

export function getLogger(): Logger {
  if (!loggerInstance) {
    throw new Error('Logger not initialized. Call initLogger() first.');
  }
  return loggerInstance;
}

export { Logger as WinstonLogger };
