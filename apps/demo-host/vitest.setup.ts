import '@testing-library/jest-dom';

beforeEach(() => {
  vi.resetModules();
  if ('unstubAllGlobals' in vi && typeof vi.unstubAllGlobals === 'function') {
    vi.unstubAllGlobals();
  }
  process.env.NEXT_PUBLIC_EMBED_MODE = 'linked';
  process.env.NEXT_PUBLIC_CONFIG_URL = 'https://beta.api.events-hub.dev/v1/demo/config';
  process.env.NEXT_PUBLIC_EMBED_SRC = 'https://cdn.events-hub.dev/embed/sdk/latest/index.umd.js';
  process.env.NEXT_PUBLIC_API_BASE = 'https://beta.api.events-hub.dev';
  process.env.NEXT_PUBLIC_PLAN_MODE = 'beta';
  window.EventsHubEmbed = undefined;
});

afterEach(() => {
  vi.clearAllMocks();
  if ('unstubAllGlobals' in vi && typeof vi.unstubAllGlobals === 'function') {
    vi.unstubAllGlobals();
  }
  window.EventsHubEmbed = undefined;
});
