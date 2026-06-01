import process from 'node:process';

const apiBasePath = process.env.NEXT_PUBLIC_API_BASE_PATH ?? '/api/v1';
const apiProxyOrigin = process.env.API_PROXY_ORIGIN ?? 'http://localhost:3001';

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  reactCompiler: true,
  typedRoutes: true,
  async rewrites() {
    return [
      {
        source: `${apiBasePath}/:path*`,
        destination: `${apiProxyOrigin}${apiBasePath}/:path*`,
      },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'api.dicebear.com',
      },
    ],
  },
  experimental: {
    typedEnv: true,
  },
};

export default nextConfig;
