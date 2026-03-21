import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  transpilePackages: ['@coverguard/shared'],
  // Static export for Base44 hosting
  output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true, // required for static export
    remotePatterns: [
      { protocol: 'https', hostname: '*.supabase.co' },
      { protocol: 'https', hostname: 'api.mapbox.com' },
    ],
  },
}

export default nextConfig
