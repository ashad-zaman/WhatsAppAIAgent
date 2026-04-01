import { CDNConfig, CDNProvider } from './types';
import { CloudFrontProvider, CloudflareProvider, CustomCDNProvider } from './providers';

export class CDNManager {
  private provider: CDNProvider;
  private config: CDNConfig;

  constructor(config: CDNConfig) {
    this.config = config;
    this.provider = this.createProvider(config);
  }

  private createProvider(config: CDNConfig): CDNProvider {
    switch (config.provider) {
      case 'cloudfront':
        return new CloudFrontProvider(config);
      case 'cloudflare':
        return new CloudflareProvider(config);
      case 'fastly':
      case 'custom':
        return new CustomCDNProvider(config);
      default:
        throw new Error(`Unknown CDN provider: ${config.provider}`);
    }
  }

  async uploadStaticAsset(
    path: string,
    content: Buffer | string,
    contentType: string,
    options?: { gzip?: boolean }
  ): Promise<string> {
    return this.provider.upload({
      path,
      content,
      contentType,
      cacheControl: this.config.cacheControl.staticAssets,
      gzip: options?.gzip,
    });
  }

  async uploadDynamicAsset(
    path: string,
    content: Buffer | string,
    contentType: string
  ): Promise<string> {
    return this.provider.upload({
      path,
      content,
      contentType,
      cacheControl: this.config.cacheControl.dynamicAssets,
    });
  }

  async invalidate(paths: string[]): Promise<void> {
    if (this.config.invalidateOnDeploy) {
      await this.provider.invalidate({
        paths,
        callerReference: `deploy-${Date.now()}`,
      });
    }
  }

  getUrl(path: string): string {
    return this.provider.getUrl(path);
  }

  async invalidateAll(): Promise<void> {
    await this.invalidate(['/*']);
  }
}

export function createCDNManager(config: CDNConfig): CDNManager {
  return new CDNManager(config);
}
