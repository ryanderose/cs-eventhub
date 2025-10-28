import { trace } from '@opentelemetry/api';

export interface SpanLike {
  setAttribute(name: string, value: unknown): void;
  end(): void;
}

const noopSpan: SpanLike = {
  setAttribute() {
    // noop
  },
  end() {
    // noop
  }
};

export function startSpan(name: string): SpanLike {
  try {
    return trace.getTracer('api').startSpan(name);
  } catch {
    return noopSpan;
  }
}
