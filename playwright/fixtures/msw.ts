import { test as base } from '@playwright/test';
import type { SetupServer } from 'msw/node';
import { server } from '../mocks/node';

type Fixtures = {
  msw: SetupServer;
};

export const test = base.extend<Fixtures>({
  msw: [
    async ({}, use) => {
      server.listen({ onUnhandledRequest: 'bypass' });
      try {
        await use(server);
      } finally {
        server.resetHandlers();
        server.close();
      }
    },
    { auto: true }
  ]
});

export const expect = test.expect;
