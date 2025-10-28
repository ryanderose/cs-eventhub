import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import './layout.css';

const DEMO_HOSTNAME = process.env.DEMO_HOSTNAME ?? 'demo.localhost';
const isLocalHostname = DEMO_HOSTNAME.endsWith('.localhost') || DEMO_HOSTNAME === 'localhost';
const metadataProtocol = isLocalHostname ? 'http' : 'https';

export const metadata: Metadata = {
  title: 'Events Hub Demo Host',
  description: 'Demo host application for Events Hub embed SDK.',
  metadataBase: new URL(`${metadataProtocol}://${DEMO_HOSTNAME}`),
  alternates: {
    canonical: '/'
  }
};

export default function RootLayout({ children }: { children: ReactNode }) {
  const planMode = process.env.NEXT_PUBLIC_PLAN_MODE ?? 'beta';

  return (
    <html lang="en" data-plan-mode={planMode}>
      <body>
        <main>{children}</main>
      </body>
    </html>
  );
}
