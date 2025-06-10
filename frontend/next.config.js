/** @type {import('next').NextConfig} */
const nextConfig = {
  // Environment variables
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
    NEXT_PUBLIC_APP_NAME: 'NextCRM',
    NEXT_PUBLIC_APP_VERSION: '1.0.0',
  },
  
  // Development configuration for Docker
  ...(process.env.NODE_ENV === 'development' && {
    // Fix for Docker file watching
    webpack: (config, { isServer }) => {
      if (!isServer) {
        config.watchOptions = {
          poll: 1000,
          aggregateTimeout: 300,
        }
      }
      return config
    },
  }),
  
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