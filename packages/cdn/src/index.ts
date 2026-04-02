export * from './types';
export * from './providers';
export * from './manager';

import { createCDNManager, CDNManager } from './manager';
import { CDNConfig } from './types';

export { createCDNManager, CDNManager };

export function createCDNManagerFromEnv(): CDNManager | null {
  const provider = process.env.CDN_PROVIDER;
  
  if (!provider) {
    return null;
  }

  const configs: Record<string, CDNConfig> = {
    cloudfront: {
      provider: 'cloudfront',
      domain: process.env.CLOUDFRONT_DOMAIN || '',
      bucket: process.env.S3_BUCKET,
      region: process.env.AWS_REGION || 'us-east-1',
      distributionId: process.env.CLOUDFRONT_DISTRIBUTION_ID,
      invalidateOnDeploy: process.env.CDN_INVALIDATE_ON_DEPLOY === 'true',
      cacheControl: {
        staticAssets: 'public, max-age=31536000, immutable',
        dynamicAssets: 'public, max-age=3600, must-revalidate',
        immutable: 'public, max-age=31536000, immutable',
      },
    },
    cloudflare: {
      provider: 'cloudflare',
      domain: process.env.CLOUDFLARE_DOMAIN || '',
      apiKey: process.env.CLOUDFLARE_API_KEY,
      zoneId: process.env.CLOUDFLARE_ZONE_ID,
      invalidateOnDeploy: process.env.CDN_INVALIDATE_ON_DEPLOY === 'true',
      cacheControl: {
        staticAssets: 'public, max-age=31536000, immutable',
        dynamicAssets: 'public, max-age=3600, must-revalidate',
        immutable: 'public, max-age=31536000, immutable',
      },
    },
  };

  const config = configs[provider];
  if (!config) {
    return null;
  }

  return createCDNManager(config);
}
