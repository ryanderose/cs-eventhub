import React, { Suspense } from 'react';
import { EmbedHost } from './components/EmbedHost';

export const dynamic = 'force-static';
export const revalidate = Number(process.env.DEFAULT_ISR_REVALIDATE ?? 300);

export default async function Page() {
  return (
    <Suspense fallback={<p>Loading embed…</p>}>
      <EmbedHost />
    </Suspense>
  );
}
