import React from 'react';
import SnippetGenerator from './SnippetGenerator';

export const revalidate = 0;

export default function SnippetsPage() {
  const defaultTenant = process.env.ADMIN_DEFAULT_TENANT ?? 'demo';
  const defaultBasePath = process.env.ADMIN_DEFAULT_BASE_PATH ?? '/events';

  return (
    <main>
      <header>
        <h1>Embed Snippet Generator</h1>
        <p>
          Validate published embed bundles before copying the production snippet. The generator refuses to emit tags when the manifest drifts from the
          local CDN assets or when bundle budgets are exceeded.
        </p>
      </header>
      <SnippetGenerator defaultTenant={defaultTenant} defaultBasePath={defaultBasePath} />
    </main>
  );
}
