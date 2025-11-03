import type { VercelRequest, VercelResponse } from '@vercel/node';
import { handleInterpret } from '../../src/http/interpret';

export const config = { runtime: 'nodejs' };

export default function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  return handleInterpret(req, res);
}
