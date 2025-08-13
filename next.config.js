/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  async generateBuildId() {
    // Use timestamp to ensure fresh builds
    return Date.now().toString()
  }
}

module.exports = nextConfig