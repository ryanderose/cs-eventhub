const DEMO_HOSTNAME = process.env.DEMO_HOSTNAME ?? 'demo.localhost';
const DEFAULT_REVALIDATE_SECONDS = Number.parseInt(process.env.FRAGMENT_REVALIDATE_SECONDS ?? '600', 10);

const nextConfig = {
  reactStrictMode: true,
  experimental: {
    typedRoutes: true
  },
  transpilePackages: ['@events-hub/embed-sdk'],
  eslint: {
    ignoreDuringBuilds: !!process.env.CI
  },
  env: {
    NEXT_PUBLIC_DEMO_HOSTNAME: DEMO_HOSTNAME,
    DEFAULT_REVALIDATE_SECONDS: `${Number.isFinite(DEFAULT_REVALIDATE_SECONDS) ? DEFAULT_REVALIDATE_SECONDS : 600}`
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: DEMO_HOSTNAME
      }
    ]
  }
};

export default nextConfig;
