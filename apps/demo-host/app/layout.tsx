import type { ReactNode } from 'react';
import type { Metadata } from 'next';
import './globals.css';
import { defaultRevalidateSeconds } from '../lib/cache';
import { Navigation } from './components/Navigation';

export const metadata: Metadata = {
  title: 'Events Hub Demo Host',
  description: 'Preview the Events Hub embed SDK inside a Next.js App Router host.'
};

export const revalidate = defaultRevalidateSeconds;

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" data-hostname={process.env.NEXT_PUBLIC_DEMO_HOSTNAME ?? 'demo.localhost'}>
      <body>
        <Navigation />
        {children}
      </body>
    </html>
  );
}
