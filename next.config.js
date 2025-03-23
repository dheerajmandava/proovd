/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ["mongoose"],
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