/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  reactCompiler: true,
  typedRoutes: true,
  experimental: {
    typedEnv: true,
  },
};

export default nextConfig;
