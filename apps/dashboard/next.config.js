/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: [
    "@whatsapp-ai/common",
    "@whatsapp-ai/config",
    "@whatsapp-ai/cdn",
  ],

  env: {
    NEXT_PUBLIC_API_URL:
      process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000",
    NEXT_PUBLIC_WS_URL: process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:3000",
    NEXT_PUBLIC_CDN_URL: process.env.CDN_DOMAIN || "",
    NEXT_PUBLIC_CDN_ENABLED: process.env.CDN_ENABLED || "false",
  },

  // Asset prefix for CDN
  assetPrefix:
    process.env.CDN_ENABLED === "true"
      ? `https://${process.env.CDN_DOMAIN}`
      : undefined,

  // Image optimization with CDN
  images: {
    loader: "default",
    loaderFile: "./src/lib/image-loader.ts",
    path:
      process.env.CDN_ENABLED === "true"
        ? `https://${process.env.CDN_DOMAIN}/_next/image`
        : "/_next/image",
    domains: process.env.CDN_IMAGE_DOMAINS?.split(",") || [
      "localhost",
      "wa.me",
      "whatsapp.com",
      "fb.com",
      "messenger.com",
    ],
    formats: ["image/avif", "image/webp"],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60,
    dangerouslyAllowSVG: true,
    contentDispositionType: "attachment",
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },

  // Compression
  compress: true,

  // Production optimizations
  productionBrowserSourceMaps: false,

  // Headers for caching and security
  async headers() {
    const cdnDomain = process.env.CDN_DOMAIN;
    const cspHeader = `
      default-src 'self';
      script-src 'self' 'unsafe-eval' 'unsafe-inline';
      style-src 'self' 'unsafe-inline';
      img-src 'self' data: https: blob:;
      font-src 'self';
      connect-src 'self' ${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000"} wss://localhost:*;
      frame-src 'none';
      object-src 'none';
      base-uri 'self';
      form-action 'self';
      frame-ancestors 'none';
      upgrade-insecure-requests;
    `
      .replace(/\s+/g, " ")
      .trim();

    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "Content-Security-Policy",
            value: cspHeader,
          },
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
      // Cache static assets
      {
        source: "/_next/static/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
          {
            key: "X-CDN-Cache",
            value: "HIT",
          },
        ],
      },
      // Cache public assets
      {
        source: "/public/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=86400, stale-while-revalidate=604800",
          },
        ],
      },
      // Cache API responses with short TTL
      {
        source: "/api/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=60, stale-while-revalidate=300",
          },
          {
            key: "X-CDN-Cache",
            value: "MISS",
          },
        ],
      },
      // Prefetch headers for service worker
      {
        source: "/_next/static/:path*",
        headers: [
          {
            key: "Link",
            value: "</_next/static/:path*>; rel=preload; as=script",
          },
        ],
      },
    ];
  },

  // Redirects
  async redirects() {
    return [];
  },

  // Rewrites for API proxy (disabled - causes infinite loop)
  async rewrites() {
    return [];
  },

  // Experimental features
  experimental: {
    optimizePackageImports: ["@tanstack/react-query", "zod", "date-fns"],
    scrollRestoration: true,
  },

  // Webpack configuration
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.optimization.splitChunks = {
        ...config.optimization.splitChunks,
        cacheGroups: {
          ...config.optimization.splitChunks?.cacheGroups,
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: "vendors",
            chunks: "all",
            priority: 10,
          },
          common: {
            minChunks: 2,
            priority: 5,
            reuseExistingChunk: true,
          },
        },
      };
    }

    return config;
  },
};

module.exports = nextConfig;
