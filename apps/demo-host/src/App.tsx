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
    const markup = `\n      <section>
        <h2>${samplePage.title}</h2>
        <pre>${JSON.stringify(samplePage, null, 2)}</pre>
      </section>
    `;
    const instance = createEmbed({ container: ref.current, markup });
    return () => instance.destroy();
  }, []);

  return (
    <div>
      <h1>Demo Host</h1>
      <div ref={ref}></div>
    </div>
  );
}
