import http from 'node:http';
import { defaultPlanResponse } from '../mocks/handlers';

export type MockApiServer = {
  close: () => Promise<void>;
};

export async function startMockApiServer(port: number): Promise<MockApiServer> {
  const server = http.createServer((req, res) => {
    if (!req.url) {
      res.statusCode = 400;
      res.end();
      return;
    }

    if (req.method === 'GET' && req.url.startsWith('/v1/plan/default')) {
      res.setHeader('content-type', 'application/json');
      res.end(JSON.stringify(defaultPlanResponse));
      return;
    }

    if (req.method === 'GET' && req.url.startsWith('/health')) {
      res.statusCode = 200;
      res.setHeader('content-type', 'text/plain');
      res.end('OK');
      return;
    }

    res.statusCode = 404;
    res.end();
  });

  await new Promise<void>((resolve, reject) => {
    server.listen(port, '127.0.0.1', () => resolve());
    server.on('error', reject);
  });

  return {
    close: () =>
      new Promise<void>((resolve, reject) => {
        server.close((error) => {
          if (error) reject(error);
          else resolve();
        });
      })
  };
}
