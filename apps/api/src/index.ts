import express, {
  type Express,
  type NextFunction,
  type Request as ExpressRequest,
  type Response as ExpressResponse
} from 'express';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import composeHandler from '../api/v1/compose';
import fragmentHandler from '../api/v1/fragment';
import interpretHandler from '../api/v1/interpret';
import planDefaultHandler from '../api/v1/plan/default';
import planByIdHandler from '../api/v1/plan/[id]';
import tenantConfigHandler from '../api/config/tenants/[tenant]';
import { health } from './routes/health';

type BootstrapOptions = {
  port?: number;
  host?: string;
  telemetryMode?: string;
};

const JSON_BODY_LIMIT = process.env.API_JSON_LIMIT ?? '1mb';

export function createApiApp(): Express {
  const app = express();
  app.disable('x-powered-by');

  app.use(express.json({ limit: JSON_BODY_LIMIT }));
  app.use(express.urlencoded({ extended: true }));

  app.get('/health', health);

  app.post('/v1/compose', wrapNodeHandler(composeHandler));
  app.post('/v1/interpret', wrapNodeHandler(interpretHandler));

  const planDefaultRoute = wrapNodeHandler(planDefaultHandler);
  app.get('/v1/plan/default', planDefaultRoute);
  app.put('/v1/plan/default', planDefaultRoute);

  app.get(
    '/v1/plan/:id(*)',
    wrapNodeHandler(planByIdHandler, (req) => {
      if (!('id' in req.query) && req.params.id) {
        (req.query as Record<string, unknown>).id = req.params.id;
      }
    })
  );

  const tenantConfigRoute = wrapNodeHandler(tenantConfigHandler, (req) => {
    if (!('tenant' in req.query) && req.params.tenant) {
      (req.query as Record<string, unknown>).tenant = req.params.tenant;
    }
  });
  app.options('/config/tenants/:tenant.json', tenantConfigRoute);
  app.get('/config/tenants/:tenant.json', tenantConfigRoute);

  const fragmentRoute = wrapEdgeHandler(fragmentHandler);
  app.get('/v1/fragment', fragmentRoute);
  app.get('/v1/fragment/:tenant(*)', fragmentRoute);

  app.use((_req, res) => {
    res.status(404).json({ error: 'Not Found' });
  });

  app.use((error: unknown, _req: ExpressRequest, res: ExpressResponse, _next: NextFunction) => {
    void _next;
    // eslint-disable-next-line no-console
    console.error('[api] Unhandled error', error);
    res.status(500).json({ error: 'internal_error' });
  });

  return app;
}

export async function bootstrap(options: BootstrapOptions = {}) {
  if (options.telemetryMode && !process.env.TELEMETRY_MODE) {
    process.env.TELEMETRY_MODE = options.telemetryMode;
  }

  const port = options.port ?? Number.parseInt(process.env.PORT ?? '4000', 10);
  const host = options.host ?? process.env.HOST ?? '0.0.0.0';
  const app = createApiApp();
  await new Promise<void>((resolve) => {
    app.listen(port, host, () => resolve());
  });
  return { app, port, host };
}

function wrapNodeHandler(
  handler: (req: VercelRequest, res: VercelResponse) => unknown | Promise<unknown>,
  before?: (req: ExpressRequest) => void
) {
  return async (req: ExpressRequest, res: ExpressResponse, next: NextFunction) => {
    try {
      before?.(req);
      await handler(req as unknown as VercelRequest, res as unknown as VercelResponse);
    } catch (error) {
      next(error);
    }
  };
}

function wrapEdgeHandler(handler: (request: Request) => Response | Promise<Response>) {
  return async (req: ExpressRequest, res: ExpressResponse, next: NextFunction) => {
    try {
      const request = buildFetchRequest(req);
      const response = await handler(request);
      await sendFetchResponse(res, response);
    } catch (error) {
      next(error);
    }
  };
}

function buildFetchRequest(req: ExpressRequest): Request {
  const protocol = (req.protocol ?? 'http').replace(/:$/, '');
  const hostHeader = req.get('host') ?? 'localhost';
  const url = new URL(req.originalUrl || req.url, `${protocol}://${hostHeader}`);
  const headers = new Headers();
  for (const [key, value] of Object.entries(req.headers)) {
    if (Array.isArray(value)) {
      value.filter(Boolean).forEach((entry) => headers.append(key, entry));
    } else if (value) {
      headers.set(key, value);
    }
  }

  const method = req.method?.toUpperCase() ?? 'GET';
  const init: RequestInit = { method, headers };

  if (!['GET', 'HEAD'].includes(method)) {
    if (Buffer.isBuffer(req.body)) {
      init.body = req.body;
    } else if (typeof req.body === 'string') {
      init.body = req.body;
    } else if (req.body && typeof req.body === 'object') {
      if (!headers.has('content-type')) {
        headers.set('content-type', 'application/json; charset=utf-8');
      }
      init.body = JSON.stringify(req.body);
    }
  }

  return new Request(url, init);
}

async function sendFetchResponse(res: ExpressResponse, response: Response) {
  response.headers.forEach((value, key) => {
    res.setHeader(key, value);
  });
  res.status(response.status);
  if (response.body) {
    const arrayBuffer = await response.arrayBuffer();
    res.send(Buffer.from(arrayBuffer));
    return;
  }
  res.end();
}
