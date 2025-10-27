import React from 'react';
import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import HomePage from '../app/page';

describe('HomePage', () => {
  it('renders the admin landing copy', () => {
    const markup = renderToStaticMarkup(<HomePage />);

    expect(markup).toContain('Events Hub Admin');
    expect(markup).toContain('Manage blocks, tokens, and analytics budgets.');
  });
});
