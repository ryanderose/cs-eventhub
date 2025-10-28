import http from 'node:http';
import { createReadStream } from 'node:fs';
import { access, stat } from 'node:fs/promises';
import path from 'node:path';

const host = 'cdn.localhost';
const port = 5050;
const distDir = path.resolve('packages/embed-sdk/dist');

const mimeTypes: Record<string, string> = {
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.map': 'application/json; charset=utf-8'
};

async function fileExists(filePath: string) {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

function createCorsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,OPTIONS',
    'Access-Control-Allow-Headers': '*',
    'Cache-Control': 'no-store',
    'Timing-Allow-Origin': '*'
  } satisfies Record<string, string>;
}

function resolvePath(urlPath: string): string {
  const normalised = urlPath.startsWith('/') ? urlPath.slice(1) : urlPath;
  return path.resolve(distDir, normalised);
}

const server = http.createServer(async (req, res) => {
  const method = req.method ?? 'GET';
  if (method === 'OPTIONS') {
    const headers = createCorsHeaders();
    Object.entries(headers).forEach(([key, value]) => res.setHeader(key, value));
    res.writeHead(204);
    res.end();
    return;
  }

  if (method !== 'GET') {
    res.writeHead(405, { Allow: 'GET,OPTIONS' });
    res.end('Method Not Allowed');
    return;
  }

  const urlPath = req.url ? decodeURIComponent(req.url.split('?')[0]) : '/';
  const filePath = resolvePath(urlPath === '/' ? 'index.esm.js' : urlPath);

  if (!filePath.startsWith(distDir)) {
    res.writeHead(400, { 'Content-Type': 'text/plain' });
    res.end('Invalid path');
    return;
  }

  if (!(await fileExists(filePath))) {
    res.writeHead(404, { 'Content-Type': 'text/plain', ...createCorsHeaders() });
    res.end('Not found');
    return;
  }

  const headers = createCorsHeaders();
  const extension = path.extname(filePath);
  const contentType = mimeTypes[extension] ?? 'application/octet-stream';
  headers['Content-Type'] = contentType;

  const info = await stat(filePath);
  headers['Content-Length'] = info.size.toString();

  res.writeHead(200, headers);
  const stream = createReadStream(filePath);
  stream.pipe(res);
  stream.on('error', (error) => {
    console.error('Failed to stream embed asset', error);
    if (!res.headersSent) {
      res.writeHead(500, { 'Content-Type': 'text/plain', ...createCorsHeaders() });
    }
    res.end('Internal Server Error');
  });
});

server.listen(port, host, () => {
  console.log(`Embed assets available at http://${host}:${port}/`);
});
