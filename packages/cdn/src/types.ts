export interface CDNConfig {
  provider: 'cloudfront' | 'cloudflare' | 'fastly' | 'custom';
  domain: string;
  bucket?: string;
  region?: string;
  distributionId?: string;
  apiKey?: string;
  zoneId?: string;
  invalidateOnDeploy: boolean;
  cacheControl: {
    staticAssets: string;
    dynamicAssets: string;
    immutable: string;
  };
}

export interface UploadOptions {
  path: string;
  content: Buffer | string;
  contentType: string;
  cacheControl?: string;
  gzip?: boolean;
}

export interface InvalidationOptions {
  paths: string[];
  callerReference: string;
}

export interface CDNProvider {
  upload(options: UploadOptions): Promise<string>;
  invalidate(options: InvalidationOptions): Promise<void>;
  getUrl(path: string): string;
}
