/** @type {import('next').NextConfig} */
const nextConfig = {
  // Environment variables
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
    NEXT_PUBLIC_APP_NAME: 'NextCRM',
    NEXT_PUBLIC_APP_VERSION: '1.0.0',
  },
  
  // Image optimization
  images: {
    domains: ['localhost'],
  },
  
  // TypeScript configuration
  typescript: {
    ignoreBuildErrors: false,
  },
  
  // ESLint configuration
  eslint: {
    ignoreDuringBuilds: false,
  },
  
  // Compression
  compress: true,
};

module.exports = nextConfig;