const nextConfig = {
  images: {
    unoptimized: true,
  },

  // ✅ FIXED: 'serverExternalPackages' is Next.js 15+ only.
  // For Next.js 14.x it must live under experimental.serverComponentsExternalPackages
  experimental: {
    serverComponentsExternalPackages: ['mongodb', 'pdfkit'],
  },

  webpack(config, { dev }) {
    if (dev) {
      config.watchOptions = {
        poll: 2000,
        aggregateTimeout: 300,
        ignored: ['**/node_modules'],
      };
    }
    // ✅ FIXED: Stops webpack using eval-based source maps in production,
    // which was triggering the CSP eval block as a second vector.
    if (!dev) {
      config.devtool = 'source-map';
    }
    return config;
  },

  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          // ✅ FIXED: Full CSP that allows:
          //   - Google Fonts (googleapis.com + gstatic.com) — fixes the stylesheet error
          //   - 'unsafe-eval' for framer-motion and webpack chunks
          //   - 'unsafe-inline' for Tailwind/inline styles
          //   - blob: and data: for dynamic assets
          //   - All HTTPS for connect-src (API calls to Groq, MongoDB, etc.)
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' data: https://fonts.gstatic.com",
              "img-src 'self' data: blob: https:",
              "connect-src 'self' https:",
              "frame-src 'self'",
              "frame-ancestors *",
            ].join('; '),
          },
          // NOTE: X-Frame-Options ALLOWALL is non-standard and ignored by modern browsers.
          // frame-ancestors * in the CSP above is the correct modern replacement.
          {
            key: 'Access-Control-Allow-Origin',
            value: process.env.CORS_ORIGINS || '*',
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET, POST, PUT, DELETE, OPTIONS',
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: '*',
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
