/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "dfc3matr71m6w.cloudfront.net",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },
  async headers() {
    return [
      {
        source: "/:all*(mp4|webm)",
        headers: [
          {
            key: "Content-Security-Policy",
            value:
              "default-src 'self' 'unsafe-inline' 'unsafe-eval' blob: data: https:; media-src 'self' 'unsafe-inline' 'unsafe-eval' blob: data: https: dfc3matr71m6w.cloudfront.net; script-src 'self' 'unsafe-inline' 'unsafe-eval'",
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
