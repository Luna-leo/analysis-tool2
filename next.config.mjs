/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // Production optimizations
  reactStrictMode: false, // Disable double rendering in development
  compiler: {
    // Remove console logs in production
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn'],
    } : false,
  },
  // Optimize bundle size
  experimental: {
    optimizeCss: false, // Disable due to critters error
    optimizePackageImports: ['d3', 'lodash'], // lucide-reactを除外
  },
}

export default nextConfig