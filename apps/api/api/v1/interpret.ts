import type { VercelRequest, VercelResponse } from '@vercel/node';
import { interpret } from '@events-hub/ai-interpreter';
import { startSpan } from '../../src/lib/telemetry';

export const config = { runtime: 'nodejs' };

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method Not Allowed' });
    return;
  }

  const payload = (req.body as { query?: string }) ?? {};
  const span = startSpan('interpreter.call');
  const result = interpret(payload.query ?? '');
  span.setAttribute('filters.count', Object.keys(result.filters).length);
  span.end();

  res.setHeader('Cache-Control', 'no-store');
  res.status(200).json({ ...result, latencyMs: 5, spans: ['interpreter.stub'] });
}
