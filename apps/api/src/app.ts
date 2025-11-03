import express, { type Request, type Response, type RequestHandler } from 'express';
import { handleDefaultPlan } from './http/plan-default';
import { handlePlanById } from './http/plan-by-id';
import { handleCompose } from './http/compose';
import { handleInterpret } from './http/interpret';
import { handleTenantConfig } from './http/config-tenants';
import type { AsyncRouteHandler } from './http/types';
import fragmentHandler from '../api/v1/fragment';
import { createTelemetryClient, resolveTelemetryMode } from './config/telemetry';

function wrap(handler: AsyncRouteHandler): RequestHandler {
  return async (req, res, next) => {
    try {
      await handler(req as any, res as any);
    } catch (error) {
      next(error);
    }
  };
}

function isBodyAllowed(method: string): boolean {
  return !['GET', 'HEAD'].includes(method.toUpperCase());
}

async function proxyFragment(req: Request, res: Response): Promise<void> {
  const url = `${req.protocol}://${req.get('host')}${req.originalUrl}`;
  const headers = new Headers();
  for (const [key, value] of Object.entries(req.headers)) {
    if (Array.isArray(value)) {
      value.forEach((entry) => headers.append(key, entry));
    } else if (value) {
      headers.append(key, value);
    }
  }

  let body: BodyInit | undefined;
  if (isBodyAllowed(req.method)) {
    if (typeof req.body === 'string' || req.body instanceof Buffer) {
      body = req.body;
    } else if (req.body != null && typeof req.body === 'object') {
      body = JSON.stringify(req.body);
      if (!headers.has('content-type')) {
        headers.set('content-type', 'application/json; charset=utf-8');
      }
    }
  }

  const response = await fragmentHandler(
    new Request(url, {
      method: req.method,
      headers,
      body
    })
  );

  res.status(response.status);
  response.headers.forEach((value, key) => {
    res.setHeader(key, value);
  });

  const buffer = Buffer.from(await response.arrayBuffer());
  res.send(buffer);
}

export function createApp() {
  const app = express();
  app.disable('x-powered-by');
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true }));

  const telemetryMode = resolveTelemetryMode();
  const telemetry = createTelemetryClient(telemetryMode);
  app.locals.telemetry = telemetry;
  if (process.env.NODE_ENV !== 'test') {
    console.info(`[telemetry] mode=${telemetryMode}`);
  }

  app.get('/health', (_req, res) => {
    res.status(200).send('OK');
  });

  app.all('/api/v1/plan/default', wrap(handleDefaultPlan));
  app.get('/api/v1/plan/:id', wrap(handlePlanById));
  app.post('/api/v1/compose', wrap(handleCompose));
  app.post('/api/v1/interpret', wrap(handleInterpret));
  app.options('/api/config/tenants/:tenant', wrap(handleTenantConfig));
  app.get('/api/config/tenants/:tenant', wrap(handleTenantConfig));
  app.get('/api/v1/fragment', wrap(proxyFragment));

  return app;
}
