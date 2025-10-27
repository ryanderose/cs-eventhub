import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';

vi.mock('@events-hub/embed-sdk', () => ({
  createEmbed: vi.fn(() => ({
    destroy: vi.fn()
  }))
}));

import { App } from './App';

describe('App', () => {
  it('renders the demo host heading', () => {
    const markup = renderToStaticMarkup(<App />);

    expect(markup).toContain('Demo Host');
  });
});
