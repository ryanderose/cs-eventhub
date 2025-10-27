import { useEffect, useRef } from 'react';
import { create } from '@events-hub/embed-sdk';
import type { PageDoc } from '@events-hub/page-schema';

const samplePage: PageDoc = {
  id: 'demo',
  title: 'Demo Page',
  path: '/demo',
  description: 'Sample plan rendered by the embed SDK',
  blocks: [],
  updatedAt: new Date().toISOString(),
  version: '1.5' as const,
  tenantId: 'demo-tenant',
  meta: {
    planHash: 'stub',
    composerVersion: 'demo',
    generatedAt: new Date().toISOString(),
    locale: 'en-US',
    cacheTags: [],
    flags: {}
  },
  planCursors: []
};

export function App() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    const instance = create({
      container: ref.current,
      tenantId: samplePage.tenantId,
      initialPlan: samplePage,
      theme: {
        '--eh-color-bg': '#020617',
        '--eh-color-text': '#e2e8f0'
      }
    });
    return () => instance.destroy();
  }, []);

  return (
    <div>
      <h1>Demo Host</h1>
      <div ref={ref}></div>
    </div>
  );
}
