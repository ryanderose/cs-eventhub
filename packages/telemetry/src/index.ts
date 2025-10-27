import { context, trace, SpanStatusCode, SpanKind, Span } from "@opentelemetry/api";

export interface TelemetryOptions {
  serviceName: string;
}

export type Telemetry = {
  startSpan: (name: string, options?: { attributes?: Record<string, unknown> }) => Span;
};

export function createTelemetry(options: TelemetryOptions): Telemetry {
  const tracer = trace.getTracer(options.serviceName);
  return {
    startSpan(name, spanOptions) {
      const span = tracer.startSpan(name, { kind: SpanKind.INTERNAL, attributes: spanOptions?.attributes });
      const wrapped = new Proxy(span, {
        get(target, prop, receiver) {
          if (prop === "end") {
            return () => target.end();
          }
          if (prop === "recordException") {
            return (error: Error) => {
              target.recordException(error);
              target.setStatus({ code: SpanStatusCode.ERROR, message: error.message });
            };
          }
          return Reflect.get(target, prop, receiver);
        }
      });
      context.with(trace.setSpan(context.active(), span), () => {});
      return wrapped;
    }
  };
}
