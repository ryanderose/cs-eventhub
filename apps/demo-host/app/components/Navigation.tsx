'use client';

import type { Route } from 'next';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { UrlObject } from 'url';

type NavLink = {
  href: Route | UrlObject;
  label: string;
};

const NAV_LINKS: ReadonlyArray<NavLink> = [
  { href: '/', label: 'Default Embed' },
  { href: '/manual', label: 'Manual Suite' },
  { href: '/manual/routing', label: 'Query/Hash Routing' },
  { href: { pathname: '/events' }, label: 'Path Routing' },
  { href: '/manual/lazy', label: 'Lazy Mount' },
  { href: '/manual/legacy', label: 'Legacy Mount' },
  { href: '/manual/trusted-types', label: 'Trusted Types' },
  { href: '/manual/multi', label: 'Multi Embed' }
];

function resolveHrefPath(href: NavLink['href']): string {
  if (typeof href === 'string') {
    return href;
  }
  return href.pathname ?? '/';
}

function isActive(pathname: string, href: NavLink['href']): boolean {
  const targetPath = resolveHrefPath(href);
  if (targetPath === '/') {
    return pathname === '/';
  }
  if (pathname === targetPath) return true;
  return pathname.startsWith(`${targetPath}/`);
}

export function Navigation() {
  const pathname = usePathname() ?? '/';

  return (
    <nav className="site-nav" aria-label="Manual testing navigation">
      <div className="site-nav__inner">
        <span className="site-nav__brand">Events Hub Demo Host</span>
        <ul>
          {NAV_LINKS.map((link) => {
            const hrefPath = resolveHrefPath(link.href);
            const active = isActive(pathname, link.href);
            return (
              <li key={hrefPath}>
                <Link href={link.href} aria-current={active ? 'page' : undefined}>
                  {link.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}
