/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  trailingSlash: false,
  generateEtags: false,
  poweredByHeader: false,
  compress: true,
  
  // Disable static optimization completely
  experimental: {
    optimizePackageImports: [],
  },
  
  // Force dynamic rendering for error pages
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-cache, no-store, must-revalidate',
          },
        ],
      },
    ]
  },
  
  // Force specific webpack configuration to avoid Html imports
  webpack: (config, { isServer }) => {
    // Disable all problematic optimizations
    config.optimization.removeAvailableModules = false
    config.optimization.removeEmptyChunks = false
    config.optimization.splitChunks = false
    
    if (isServer) {
      // Exclude problematic packages from server bundle
      config.externals = config.externals || []
      config.externals.push({
        'next/document': 'next/document',
        'react-dom/server': 'react-dom/server'
      })
    }
    
    return config
  },
  
  async generateBuildId() {
    // Use timestamp to ensure fresh builds
    return Date.now().toString()
  }
}

module.exports = nextConfig