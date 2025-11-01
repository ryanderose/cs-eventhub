import { createServer } from 'node:http';
import { parse } from 'node:url';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import handler from './api/v1/plan/default';

const port = Number(process.env.PORT ?? '3000');

createServer((req, res) => {
  const parsed = parse(req.url ?? '/', true);
  const chunks: Buffer[] = [];
  req.on('data', (chunk) => {
    if (Buffer.isBuffer(chunk)) {
      chunks.push(chunk);
    } else {
      chunks.push(Buffer.from(chunk));
    }
  });
  req.on('end', () => {
    (req as VercelRequest).query = parsed.query as any;
    (req as VercelRequest).body = chunks.length ? Buffer.concat(chunks) : undefined;
    void handler(req as VercelRequest, res as VercelResponse);
  });
  req.on('error', (error) => {
    res.statusCode = 500;
    res.end(`Request failed: ${error instanceof Error ? error.message : String(error)}`);
  });
}).listen(port, () => {
  console.log(`Default plan handler listening on http://localhost:${port}`);
});
