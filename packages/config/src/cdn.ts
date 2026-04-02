export const cdnConfig = {
  enabled: process.env.CDN_ENABLED === 'true',
  provider: process.env.CDN_PROVIDER || 'cloudfront',
  domain: process.env.CDN_DOMAIN || '',
  
  cloudfront: {
    domain: process.env.CLOUDFRONT_DOMAIN,
    distributionId: process.env.CLOUDFRONT_DISTRIBUTION_ID,
    bucket: process.env.S3_BUCKET,
    region: process.env.AWS_REGION || 'us-east-1',
  },
  
  cloudflare: {
    domain: process.env.CLOUDFLARE_DOMAIN,
    zoneId: process.env.CLOUDFLARE_ZONE_ID,
    apiKey: process.env.CLOUDFLARE_API_KEY,
  },
  
  cacheControl: {
    staticAssets: 'public, max-age=31536000, immutable',
    dynamicAssets: 'public, max-age=3600, stale-while-revalidate=60',
    apiResponses: 'public, max-age=60, stale-while-revalidate=300',
    images: 'public, max-age=86400, immutable',
  },
  
  paths: {
    static: '/_next/static',
    public: '/public',
    images: '/_next/image',
  },
  
  invalidateOnDeploy: process.env.CDN_INVALIDATE_ON_DEPLOY === 'true',
};

export function getCDNUrl(path: string): string {
  if (!cdnConfig.enabled || !cdnConfig.domain) {
    return path;
  }
  
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `https://${cdnConfig.domain}${normalizedPath}`;
}

export function getImageOptimizerUrl(path: string): string {
  if (!cdnConfig.enabled || !cdnConfig.domain) {
    return path;
  }
  
  return `https://${cdnConfig.domain}/_next/image${path}`;
}

export const assetPatterns = {
  immutable: [
    '/_next/static/chunks/**/*.js',
    '/_next/static/chunks/**/*.css',
    '/_next/static/media/**/*',
  ],
  cacheable: [
    '/_next/static/**/*',
    '/public/**/*',
  ],
};
