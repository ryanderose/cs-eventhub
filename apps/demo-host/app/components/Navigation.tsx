'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

type NavLink = {
  href: string;
  label: string;
};

const NAV_LINKS: NavLink[] = [
  { href: '/', label: 'Default Embed' },
  { href: '/manual', label: 'Manual Suite' },
  { href: '/manual/routing', label: 'Query/Hash Routing' },
  { href: '/events', label: 'Path Routing' },
  { href: '/manual/lazy', label: 'Lazy Mount' },
  { href: '/manual/legacy', label: 'Legacy Mount' },
  { href: '/manual/trusted-types', label: 'Trusted Types' },
  { href: '/manual/multi', label: 'Multi Embed' }
];

function isActive(pathname: string, href: string): boolean {
  if (href === '/') {
    return pathname === '/';
  }
  if (pathname === href) return true;
  return pathname.startsWith(`${href}/`);
}

export function Navigation() {
  const pathname = usePathname() ?? '/';

  return (
    <nav className="site-nav" aria-label="Manual testing navigation">
      <div className="site-nav__inner">
        <span className="site-nav__brand">Events Hub Demo Host</span>
        <ul>
          {NAV_LINKS.map((link) => {
            const active = isActive(pathname, link.href);
            return (
              <li key={link.href}>
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
