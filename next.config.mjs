/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  trailingSlash: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true
  },
  assetPrefix: process.env.NODE_ENV === 'production' ? '/inventory-dashboard' : '',
  basePath: process.env.NODE_ENV === 'production' ? '/inventory-dashboard' : '',
}

export default nextConfig
