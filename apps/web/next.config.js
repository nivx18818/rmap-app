/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  reactCompiler: true,
  experimental: {
    typedEnv: true,
  },
};

export default nextConfig;
