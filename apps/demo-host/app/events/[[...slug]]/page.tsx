import type { Metadata } from 'next';
import { ManualEmbed } from '../../manual/components/ManualEmbed';

type Params = { slug?: string[] };

export const metadata: Metadata = {
  title: 'Path routing harness — Events Hub Demo Host'
};

export default function EventsPathPage({ params }: { params: Params }) {
  const activeSlug = params.slug?.join('/') ?? null;
  return (
    <main>
      <h1>Path Routing Harness</h1>
      <p>
        This page lives under <code>/events</code> so you can validate <code>historyMode=&quot;path&quot;</code>, custom route templates, and host rewrites.
        Load <code>/events</code> for the list view, navigate into a detail card, copy the URL, and hard refresh to confirm hydration works without a
        server 404.
      </p>
      <p className="status">Current detail slug: {activeSlug ?? 'list view'}</p>
      <ManualEmbed
        embedId="manual-path"
        config={{
          historyMode: 'path',
          basePath: '/events',
          routes: { list: '/events', detail: '/events/:slug' },
          routeTakeover: 'container'
        }}
      />
    </main>
  );
}
