/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ["mongoose"],
  images: {
    domains: ['images.unsplash.com'],
  },
  typescript: {
    // !! WARN !!
    // Dangerously allow production builds to successfully complete even if
    // your project has type errors.
    // !! WARN !!
    ignoreBuildErrors: true,
  },
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },
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
      // CDN paths for widget scripts
      {
        source: '/api/websites/:id/widget.js',
        destination: '/api/websites/:id/widget.js',
      },
      {
        source: '/api/websites/:id/pulse-widget.js',
        destination: '/api/websites/:id/pulse-widget.js',
      },
      // CDN paths
      {
        source: '/cdn/w/:id.js',
        destination: '/api/cdn/w/:id',
      },
      {
        source: '/cdn/w/:id/pulse.js',
        destination: '/public/cdn/w/pulse/loader.js',
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
      // Add CORS headers for public API endpoints
      {
        source: '/api/websites/:id/notifications/show',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: '*',
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET, POST, OPTIONS',
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'Content-Type',
          },
        ],
      },
      {
        source: '/api/notifications/:id/impression',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: '*',
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET, POST, OPTIONS',
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'Content-Type',
          },
        ],
      },
      {
        source: '/api/notifications/:id/click',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: '*',
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET, POST, OPTIONS',
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'Content-Type',
          },
        ],
      },
      {
        source: '/api/websites/:id/widget.js',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: '*',
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET, OPTIONS',
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'Content-Type',
          },
          {
            key: 'Content-Type',
            value: 'application/javascript',
          },
        ],
      },
      {
        source: '/api/cdn/w/:path*',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: '*',
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET, OPTIONS',
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'Content-Type',
          },
          {
            key: 'Content-Type',
            value: 'application/javascript',
          },
        ],
      },
    ];
  },
  // Configure webpack to ignore MongoDB native addons
  webpack: (config, { isServer }) => {
    // Prevent webpack from trying to bundle native modules
    config.resolve.fallback = {
      ...config.resolve.fallback,
      // MongoDB optional dependencies
      'mongodb-client-encryption': false,
      'kerberos': false,
      'aws4': false,
      '@mongodb-js/zstd': false,
      'snappy': false,
      'bson-ext': false,
    };

    // Tell webpack to completely ignore .node files
    config.module.rules.push({
      test: /\.node$/,
      use: 'ignore-loader',
    });

    // Add specific MongoDB native modules to externals
    const mongodbNativeModules = [
      '@mongodb-js/zstd',
      'kerberos',
      'aws4',
      'mongodb-client-encryption',
      'snappy',
      'bson-ext'
    ];

    // Add MongoDB native modules to the externals
    if (isServer) {
      config.externals = [
        ...(config.externals || []),
        ...mongodbNativeModules
      ];
    } else {
      // For the client-side, also handle these modules specifically
      mongodbNativeModules.forEach(mod => {
        config.resolve.alias[mod] = false;
      });
    }

    return config;
  },
};

module.exports = nextConfig; 