/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  trailingSlash: true,
  generateEtags: false,
  poweredByHeader: false,
  compress: true,
  images: {
    unoptimized: true
  },
  async rewrites() {
    return [
      {
        source: '/register',
        destination: '/signup',
      },
    ];
  },
}

module.exports = nextConfig
