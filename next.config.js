/** @type {import('next').NextConfig} */
const nextConfig = {
  // Add support for static file serving under the cdn subdomain
  async rewrites() {
    return [
      // Handle cdn.proovd.in domain using public/cdn directory
      {
        source: '/:path*',
        has: [
          {
            type: 'host',
            value: 'cdn.proovd.in',
          },
        ],
        destination: '/cdn/:path*',
      },
    ];
  },
  // Make sure the CDN directory is accessible as static files
  async headers() {
    return [
      {
        source: '/cdn/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=86400', // Cache for 24 hours
          },
          {
            key: 'Access-Control-Allow-Origin',
            value: '*', // Allow CORS
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig; 