/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  trailingSlash: false,
  generateEtags: false,
  poweredByHeader: false,
  compress: true,
  
  // Disable problematic optimizations that might cause Html import issues
  experimental: {
    optimizePackageImports: [],
  },
  
  // Force specific webpack configuration to avoid Html imports
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Exclude problematic packages from server bundle
      config.externals = config.externals || []
      config.externals.push({
        'next/document': 'next/document'
      })
    }
    
    // Disable specific optimizations that might cause issues
    config.optimization = config.optimization || {}
    config.optimization.splitChunks = config.optimization.splitChunks || {}
    config.optimization.splitChunks.cacheGroups = config.optimization.splitChunks.cacheGroups || {}
    
    return config
  },
  
  async generateBuildId() {
    // Use timestamp to ensure fresh builds
    return Date.now().toString()
  }
}

module.exports = nextConfig