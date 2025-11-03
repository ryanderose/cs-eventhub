import { interpret } from '@events-hub/ai-interpreter';
import { startSpan } from '../lib/telemetry';
import type { ApiRequest, ApiResponse } from './types';

export async function handleInterpret(req: ApiRequest, res: ApiResponse): Promise<void> {
  if ((req.method ?? 'GET').toUpperCase() !== 'POST') {
    res.status(405).json({ error: 'Method Not Allowed' });
    return;
  }

  const body = (req as any).body as { query?: string } | undefined;
  const span = startSpan('interpreter.call');
  const result = interpret(body?.query ?? '');
  span.setAttribute('filters.count', Object.keys(result.filters).length);
  span.end();

  res.setHeader('Cache-Control', 'no-store');
  res.status(200).json({ ...result, latencyMs: 5, spans: ['interpreter.stub'] });
}
