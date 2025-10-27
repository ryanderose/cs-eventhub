import { useEffect, useRef } from 'react';
import { createEmbed } from '@events-hub/embed-sdk';

const samplePage = {
  id: 'demo',
  title: 'Demo Page',
  path: '/demo',
  blocks: [],
  updatedAt: new Date().toISOString(),
  version: '1.5' as const,
  tenantId: 'demo-tenant',
  meta: { planHash: 'stub' }
};

export function App() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    const instance = createEmbed({ container: ref.current, page: samplePage });
    return () => instance.destroy();
  }, []);

  return (
    <div>
      <h1>Demo Host</h1>
      <div ref={ref}></div>
    </div>
  );
}
