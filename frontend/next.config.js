/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['three'],
  webpack: (config) => {
    // Fix for wallet connector module resolution
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
    }
    
    // Mock missing optional wallet connectors
    config.resolve.alias = {
      ...config.resolve.alias,
      '@gemini-wallet/core': false,
      'porto/internal': false,
    }
    
    config.externals.push('pino-pretty', 'lokijs', 'encoding')
    return config
  },
}

module.exports = nextConfig
