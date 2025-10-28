import type { Metadata } from 'next';
import './layout.css';

export const metadata: Metadata = {
  title: 'Events Hub Demo Host',
  description: 'Demo host application for Events Hub embed SDK.',
  metadataBase: new URL('https://demo.localhost'),
  alternates: {
    canonical: '/'
  }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const planMode = process.env.NEXT_PUBLIC_PLAN_MODE ?? 'beta';

  return (
    <html lang="en" data-plan-mode={planMode}>
      <body>
        <main>{children}</main>
      </body>
    </html>
  );
}
