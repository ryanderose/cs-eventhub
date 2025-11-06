import React from 'react';
import { headers } from 'next/headers';
import { ApiError, fetchDefaultPlan } from '../../lib/plan-client';
import BlocksClient from './BlocksClient';

export const revalidate = 0;

export default async function BlocksPage() {
  try {
    const host = headers().get('host');
    const result = await fetchDefaultPlan(undefined, { serverHost: host });

    return (
      <main>
        <header>
          <h1 id="default-plan-heading">Default Blocks</h1>
          <p>Reorder the default blocks to control the baseline experience for the demo tenant.</p>
        </header>
        <BlocksClient initialPlan={result} />
      </main>
    );
  } catch (error) {
    const message =
      error instanceof ApiError
        ? `Failed to load default blocks (status ${error.status}).`
        : 'Failed to load default blocks.';
    return (
      <main>
        <header>
          <h1 id="default-plan-heading">Default Blocks</h1>
          <p>Reorder the default blocks to control the baseline experience for the demo tenant.</p>
        </header>
        <p className="callout error" role="alert">
          {message}
        </p>
        <p className="muted">Refresh the page to retry. If the problem persists, confirm the API is reachable.</p>
      </main>
    );
  }
}
