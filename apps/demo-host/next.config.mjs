import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const packageJson = require('./package.json');

const DEFAULT_REVALIDATE_SECONDS = Number(process.env.SEO_FRAGMENT_REVALIDATE ?? 300);
const DEMO_HOSTNAME = process.env.DEMO_HOSTNAME ?? 'demo.localhost';

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  transpilePackages: ['@events-hub/embed-sdk'],
  experimental: {
    typedRoutes: true,
    optimizeCss: true,
    isrFlushToDisk: false,
    trustHostHeader: true,
    serverActions: {
      bodySizeLimit: '2mb'
    }
  },
  logging: {
    fetches: {
      fullUrl: true,
      h3: true
    }
  },
  env: {
    NEXT_PUBLIC_APP_VERSION: packageJson.version,
    DEMO_HOSTNAME,
    DEFAULT_ISR_REVALIDATE: String(DEFAULT_REVALIDATE_SECONDS)
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: DEMO_HOSTNAME
      }
    ]
  },
  eslint: {
    dirs: ['app']
  }
};

export default nextConfig;
