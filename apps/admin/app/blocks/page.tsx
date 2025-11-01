import React from 'react';
import { fetchDefaultPlan } from '../../lib/plan-client';
import BlocksClient from './BlocksClient';

export const revalidate = 0;

export default async function BlocksPage() {
  const result = await fetchDefaultPlan();

  return (
    <main>
      <header>
        <h1 id="default-plan-heading">Default Blocks</h1>
        <p>Reorder the default blocks to control the baseline experience for the demo tenant.</p>
      </header>
      <BlocksClient initialPlan={result} />
    </main>
  );
}
