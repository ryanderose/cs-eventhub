import type { Route } from 'next';
import Link from 'next/link';
import type { UrlObject } from 'url';

type ManualPage = {
  href: Route | UrlObject;
  title: string;
  summary: string;
};

const PAGES: ReadonlyArray<ManualPage> = [
  {
    href: '/manual/routing',
    title: 'Query & Hash Routing',
    summary: 'Validate query/hash persistence and URL mutation without rewriting.'
  },
  {
    href: { pathname: '/events' },
    title: 'Path Routing Harness',
    summary: 'Mounts at /events to exercise basePath-aware routing, deep links, and hard reloads.'
  },
  {
    href: '/manual/lazy',
    title: 'Lazy Mount',
    summary: 'Verifies `data-lazy` gating with IntersectionObserver + optional HEAD preflight.'
  },
  {
    href: '/manual/legacy',
    title: 'Legacy Mount',
    summary: 'Simulates `data-mount-before` script injection with no container.'
  },
  {
    href: '/manual/trusted-types',
    title: 'Trusted Types Enforcement',
    summary: 'Stubs Trusted Types so the embed aborts safely when policy creation fails.'
  },
  {
    href: '/manual/multi',
    title: 'Multi-Embed Ownership',
    summary: 'Two embeds sharing the page to test router ownership + analytics isolation.'
  }
];

function resolveHrefPath(href: ManualPage['href']): string {
  if (typeof href === 'string') {
    return href;
  }
  return href.pathname ?? '/';
}

export default function ManualIndexPage() {
  return (
    <main>
      <h1>Manual Embed Harness</h1>
      <p>
        These routes mirror the manual verification steps from the v1.6 plan so you can run <code>pnpm dev:stack</code>, open{' '}
        <code>localhost:3000</code>, and exercise each scenario without editing scratch HTML. Use the navigation bar to jump between pages or start
        with the index below.
      </p>
      <div className="manual-grid">
        {PAGES.map((page) => {
          const hrefPath = resolveHrefPath(page.href);
          return (
            <article key={hrefPath}>
              <h2>
                <Link href={page.href}>{page.title}</Link>
              </h2>
              <p>{page.summary}</p>
              <Link href={page.href} className="manual-link">
                Open {page.title}
              </Link>
            </article>
          );
        })}
      </div>
    </main>
  );
}
