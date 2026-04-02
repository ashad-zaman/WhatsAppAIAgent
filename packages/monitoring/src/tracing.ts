import { NodeSDK } from "@opentelemetry/sdk-node";
import { getNodeAutoInstrumentations } from "@opentelemetry/auto-instrumentations-node";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http";
import { OTLPMetricExporter } from "@opentelemetry/exporter-metrics-otlp-http";
import { Resource } from "@opentelemetry/resources";
import {
  ATTR_SERVICE_NAME,
  ATTR_SERVICE_VERSION,
} from "@opentelemetry/semantic-conventions";
import { PeriodicExportingMetricReader } from "@opentelemetry/sdk-metrics";
import {
  trace,
  context,
  SpanStatusCode,
  Span,
  SpanKind,
} from "@opentelemetry/api";

export interface TracingConfig {
  serviceName: string;
  serviceVersion: string;
  environment: string;
  otlpEndpoint?: string;
  enabled?: boolean;
  samplingRate?: number;
}

export class TracingService {
  private sdk: NodeSDK | null = null;
  private serviceName: string;

  constructor(config: TracingConfig) {
    this.serviceName = config.serviceName;
  }

  async initialize(config: TracingConfig): Promise<void> {
    if (config.enabled === false) {
      console.log("Tracing disabled");
      return;
    }

    const resource = new Resource({
      [ATTR_SERVICE_NAME]: config.serviceName,
      [ATTR_SERVICE_VERSION]: config.serviceVersion,
      "deployment.environment": config.environment,
    });

    const traceExporter = config.otlpEndpoint
      ? new OTLPTraceExporter({
          url: `${config.otlpEndpoint}/v1/traces`,
        })
      : undefined;

    const metricExporter = config.otlpEndpoint
      ? new OTLPMetricExporter({
          url: `${config.otlpEndpoint}/v1/metrics`,
        })
      : undefined;

    const metricReader = metricExporter
      ? new PeriodicExportingMetricReader({
          exporter: metricExporter,
          exportIntervalMillis: 60000,
        })
      : undefined;

    this.sdk = new NodeSDK({
      resource,
      traceExporter,
      metricReader,
      instrumentations: [
        getNodeAutoInstrumentations({
          "@opentelemetry/instrumentation-fs": { enabled: false },
          "@opentelemetry/instrumentation-http": { enabled: true },
          "@opentelemetry/instrumentation-express": { enabled: true },
          "@opentelemetry/instrumentation-pg": { enabled: true },
          "@opentelemetry/instrumentation-redis-4": { enabled: true },
        }),
      ],
    });

    await this.sdk.start();
    console.log(`Tracing initialized for ${config.serviceName}`);
  }

  async shutdown(): Promise<void> {
    if (this.sdk) {
      await this.sdk.shutdown();
    }
  }

  getTracer(name: string = this.serviceName) {
    return trace.getTracer(name);
  }

  startSpan(
    name: string,
    options?: {
      kind?: SpanKind;
      attributes?: Record<string, string | number | boolean>;
      parent?: Span;
    },
  ): Span {
    const tracer = this.getTracer();
    const span = tracer.startSpan(name, {
      kind: options?.kind || SpanKind.INTERNAL,
      attributes: options?.attributes,
    });

    if (options?.parent) {
      return trace.setSpan(
        context.with(
          trace.setSpan(context.active(), options.parent),
          () => span,
        ),
      );
    }

    return span;
  }

  async withSpan<T>(
    name: string,
    fn: (span: Span) => Promise<T>,
    options?: {
      kind?: SpanKind;
      attributes?: Record<string, string | number | boolean>;
    },
  ): Promise<T> {
    const tracer = this.getTracer();

    return tracer.startActiveSpan(
      name,
      {
        kind: options?.kind || SpanKind.INTERNAL,
        attributes: options?.attributes,
      },
      async (span) => {
        try {
          const result = await fn(span);
          span.setStatus({ code: SpanStatusCode.OK });
          return result;
        } catch (error) {
          span.setStatus({
            code: SpanStatusCode.ERROR,
            message: error instanceof Error ? error.message : "Unknown error",
          });
          if (error instanceof Error) {
            span.recordException(error);
          }
          throw error;
        } finally {
          span.end();
        }
      },
    );
  }

  recordEvent(
    name: string,
    attributes?: Record<string, string | number | boolean>,
  ): void {
    const currentSpan = trace.getActiveSpan();
    if (currentSpan) {
      currentSpan.addEvent(name, attributes);
    }
  }

  setAttribute(key: string, value: string | number | boolean): void {
    const currentSpan = trace.getActiveSpan();
    if (currentSpan) {
      currentSpan.setAttribute(key, value);
    }
  }

  setAttributes(attributes: Record<string, string | number | boolean>): void {
    const currentSpan = trace.getActiveSpan();
    if (currentSpan) {
      currentSpan.setAttributes(attributes);
    }
  }

  getCurrentSpan(): Span | undefined {
    return trace.getActiveSpan();
  }

  getTraceId(): string | undefined {
    const span = this.getCurrentSpan();
    return span?.spanContext().traceId;
  }

  getSpanId(): string | undefined {
    const span = this.getCurrentSpan();
    return span?.spanContext().spanId;
  }
}

let tracingInstance: TracingService | null = null;

export function initTracing(config: TracingConfig): TracingService {
  tracingInstance = new TracingService(config);
  return tracingInstance;
}

export function getTracing(): TracingService {
  if (!tracingInstance) {
    throw new Error("Tracing not initialized. Call initTracing() first.");
  }
  return tracingInstance;
}

export { SpanStatusCode, SpanKind };
