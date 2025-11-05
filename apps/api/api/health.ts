import type { VercelRequest, VercelResponse } from '@vercel/node';

export const config = { runtime: 'nodejs' };

export default function handler(_req: VercelRequest, res: VercelResponse): void {
  res.status(200).json({
    status: 'ok',
    updatedAt: new Date().toISOString()
  });
}
