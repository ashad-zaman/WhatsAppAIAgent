import {
  Registry,
  Counter,
  Histogram,
  Gauge,
  collectDefaultMetrics,
  register,
} from 'prom-client';

export interface MetricsConfig {
  serviceName: string;
  collectDefaultMetrics?: boolean;
  prefix?: string;
}

export class MetricsCollector {
  private registry: Registry;
  private serviceName: string;

  public httpRequestsTotal: Counter;
  public httpRequestDuration: Histogram;
  public activeConnections: Gauge;
  public queueSize: Gauge;
  public queueProcessingDuration: Histogram;
  public agentRequestsTotal: Counter;
  public agentResponseDuration: Histogram;
  public ragQueriesTotal: Counter;
  public ragQueryDuration: Histogram;
  public databaseQueryDuration: Histogram;
  public cacheHitTotal: Counter;
  public cacheMissTotal: Counter;
  public whatsappMessagesReceived: Counter;
  public whatsappMessagesSent: Counter;
  public reminderTriggersTotal: Counter;
  public errorTotal: Counter;

  constructor(config: MetricsConfig) {
    this.registry = new Registry();
    this.serviceName = config.serviceName;

    const prefix = config.prefix || 'whatsappai';

    if (config.collectDefaultMetrics !== false) {
      collectDefaultMetrics({
        register: this.registry,
        prefix: `${prefix}_`,
        labels: { service: this.serviceName },
      });
    }

    this.httpRequestsTotal = new Counter({
      name: `${prefix}_http_requests_total`,
      help: 'Total number of HTTP requests',
      labelNames: ['method', 'path', 'status_code'],
      registers: [this.registry],
    });

    this.httpRequestDuration = new Histogram({
      name: `${prefix}_http_request_duration_seconds`,
      help: 'Duration of HTTP requests in seconds',
      labelNames: ['method', 'path', 'status_code'],
      buckets: [0.001, 0.005, 0.015, 0.05, 0.1, 0.2, 0.5, 1, 2, 5],
      registers: [this.registry],
    });

    this.activeConnections = new Gauge({
      name: `${prefix}_active_connections`,
      help: 'Number of active connections',
      labelNames: ['type'],
      registers: [this.registry],
    });

    this.queueSize = new Gauge({
      name: `${prefix}_queue_size`,
      help: 'Current size of message queues',
      labelNames: ['queue_name'],
      registers: [this.registry],
    });

    this.queueProcessingDuration = new Histogram({
      name: `${prefix}_queue_processing_duration_seconds`,
      help: 'Duration of queue job processing in seconds',
      labelNames: ['queue_name', 'job_type'],
      buckets: [0.01, 0.05, 0.1, 0.5, 1, 5, 10, 30, 60],
      registers: [this.registry],
    });

    this.agentRequestsTotal = new Counter({
      name: `${prefix}_agent_requests_total`,
      help: 'Total number of agent requests',
      labelNames: ['agent_type', 'status'],
      registers: [this.registry],
    });

    this.agentResponseDuration = new Histogram({
      name: `${prefix}_agent_response_duration_seconds`,
      help: 'Duration of agent responses in seconds',
      labelNames: ['agent_type'],
      buckets: [0.1, 0.5, 1, 2, 5, 10, 30, 60],
      registers: [this.registry],
    });

    this.ragQueriesTotal = new Counter({
      name: `${prefix}_rag_queries_total`,
      help: 'Total number of RAG queries',
      labelNames: ['status'],
      registers: [this.registry],
    });

    this.ragQueryDuration = new Histogram({
      name: `${prefix}_rag_query_duration_seconds`,
      help: 'Duration of RAG queries in seconds',
      labelNames: ['query_type'],
      buckets: [0.5, 1, 2, 5, 10, 30, 60, 120],
      registers: [this.registry],
    });

    this.databaseQueryDuration = new Histogram({
      name: `${prefix}_database_query_duration_seconds`,
      help: 'Duration of database queries in seconds',
      labelNames: ['operation', 'table'],
      buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1, 5],
      registers: [this.registry],
    });

    this.cacheHitTotal = new Counter({
      name: `${prefix}_cache_hits_total`,
      help: 'Total number of cache hits',
      labelNames: ['cache_type'],
      registers: [this.registry],
    });

    this.cacheMissTotal = new Counter({
      name: `${prefix}_cache_misses_total`,
      help: 'Total number of cache misses',
      labelNames: ['cache_type'],
      registers: [this.registry],
    });

    this.whatsappMessagesReceived = new Counter({
      name: `${prefix}_whatsapp_messages_received_total`,
      help: 'Total number of WhatsApp messages received',
      labelNames: ['message_type'],
      registers: [this.registry],
    });

    this.whatsappMessagesSent = new Counter({
      name: `${prefix}_whatsapp_messages_sent_total`,
      help: 'Total number of WhatsApp messages sent',
      labelNames: ['message_type', 'status'],
      registers: [this.registry],
    });

    this.reminderTriggersTotal = new Counter({
      name: `${prefix}_reminder_triggers_total`,
      help: 'Total number of reminder triggers',
      labelNames: ['reminder_type', 'status'],
      registers: [this.registry],
    });

    this.errorTotal = new Counter({
      name: `${prefix}_errors_total`,
      help: 'Total number of errors',
      labelNames: ['error_type', 'service'],
      registers: [this.registry],
    });
  }

  getRegistry(): Registry {
    return this.registry;
  }

  async getMetrics(): Promise<string> {
    return this.registry.metrics();
  }

  getContentType(): string {
    return this.registry.contentType;
  }

  recordHttpRequest(
    method: string,
    path: string,
    statusCode: number,
    durationMs: number
  ): void {
    this.httpRequestsTotal.inc({
      method,
      path: this.normalizePath(path),
      status_code: statusCode.toString(),
    });
    this.httpRequestDuration.observe(
      {
        method,
        path: this.normalizePath(path),
        status_code: statusCode.toString(),
      },
      durationMs / 1000
    );
  }

  recordAgentRequest(agentType: string, status: 'success' | 'error'): void {
    this.agentRequestsTotal.inc({ agent_type: agentType, status });
  }

  recordAgentDuration(agentType: string, durationMs: number): void {
    this.agentResponseDuration.observe({ agent_type: agentType }, durationMs / 1000);
  }

  recordRagQuery(status: 'success' | 'error'): void {
    this.ragQueriesTotal.inc({ status });
  }

  recordRagDuration(queryType: string, durationMs: number): void {
    this.ragQueryDuration.observe({ query_type: queryType }, durationMs / 1000);
  }

  recordDatabaseQuery(operation: string, table: string, durationMs: number): void {
    this.databaseQueryDuration.observe({ operation, table }, durationMs / 1000);
  }

  recordCacheHit(cacheType: string): void {
    this.cacheHitTotal.inc({ cache_type: cacheType });
  }

  recordCacheMiss(cacheType: string): void {
    this.cacheMissTotal.inc({ cache_type: cacheType });
  }

  recordWhatsappReceived(messageType: string): void {
    this.whatsappMessagesReceived.inc({ message_type: messageType });
  }

  recordWhatsappSent(messageType: string, status: 'success' | 'error'): void {
    this.whatsappMessagesSent.inc({ message_type: messageType, status });
  }

  recordReminderTrigger(reminderType: string, status: 'success' | 'error'): void {
    this.reminderTriggersTotal.inc({ reminder_type: reminderType, status });
  }

  recordError(errorType: string, service: string): void {
    this.errorTotal.inc({ error_type: errorType, service });
  }

  private normalizePath(path: string): string {
    return path
      .replace(/\/api\/agents\/[^/]+/g, '/api/agents/:id')
      .replace(/\/api\/reminders\/[^/]+/g, '/api/reminders/:id')
      .replace(/\/api\/documents\/[^/]+/g, '/api/documents/:id')
      .replace(/\/[0-9a-f-]{36}/gi, '/:id');
  }
}

let metricsInstance: MetricsCollector | null = null;

export function initMetrics(config: MetricsConfig): MetricsCollector {
  metricsInstance = new MetricsCollector(config);
  return metricsInstance;
}

export function getMetrics(): MetricsCollector {
  if (!metricsInstance) {
    throw new Error('Metrics not initialized. Call initMetrics() first.');
  }
  return metricsInstance;
}

export { register };
