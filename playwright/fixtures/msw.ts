import { afterAll, afterEach, beforeAll } from '@playwright/test';
import { server } from '../mocks/node';

const shouldBypassMsw = () => process.env.PLAYWRIGHT_MSW === 'off';

/**
 * Spins up the shared MSW server so local E2E runs have deterministic
 * network behaviour while still allowing real calls when desired.
 * Opt out by running with `PLAYWRIGHT_MSW=off`.
 */
export function setupMsw(): void {
  if (shouldBypassMsw()) {
    return;
  }

  beforeAll(() => {
    server.listen({ onUnhandledRequest: 'bypass' });
  });

  afterEach(() => {
    server.resetHandlers();
  });

  afterAll(() => {
    server.close();
  });
}
