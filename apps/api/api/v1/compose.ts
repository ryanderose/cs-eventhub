import type { VercelRequest, VercelResponse } from '@vercel/node';
import { handleCompose } from '../../src/http/compose';

export const config = { runtime: 'nodejs', maxDuration: 15 };

export default function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  return handleCompose(req, res);
}
