import { CloudFrontClient, CreateInvalidationCommand } from '@aws-sdk/client-cloudfront';
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { CDNConfig, CDNProvider, UploadOptions, InvalidationOptions } from './types';

export class CloudFrontProvider implements CDNProvider {
  private client: CloudFrontClient;
  private s3Client: S3Client;
  private config: CDNConfig;

  constructor(config: CDNConfig) {
    this.config = config;
    
    this.client = new CloudFrontClient({
      region: config.region || 'us-east-1',
    });

    this.s3Client = new S3Client({
      region: config.region || 'us-east-1',
    });
  }

  async upload(options: UploadOptions): Promise<string> {
    const key = options.path.replace(/^\//, '');
    
    const command = new PutObjectCommand({
      Bucket: this.config.bucket,
      Key: key,
      Body: options.content,
      ContentType: options.contentType,
      CacheControl: options.cacheControl || this.config.cacheControl.staticAssets,
      ContentEncoding: options.gzip ? 'gzip' : undefined,
    });

    await this.s3Client.send(command);
    
    return this.getUrl(key);
  }

  async invalidate(options: InvalidationOptions): Promise<void> {
    const command = new CreateInvalidationCommand({
      DistributionId: this.config.distributionId,
      InvalidationBatch: {
        CallerReference: options.callerReference,
        Paths: {
          Quantity: options.paths.length,
          Items: options.paths,
        },
      },
    });

    await this.client.send(command);
  }

  getUrl(path: string): string {
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    return `https://${this.config.domain}${normalizedPath}`;
  }
}

export class CloudflareProvider implements CDNProvider {
  private config: CDNConfig;

  constructor(config: CDNConfig) {
    this.config = config;
  }

  async upload(options: UploadOptions): Promise<string> {
    const key = options.path.replace(/^\//, '');
    
    const response = await fetch(
      `https://api.cloudflare.com/client/v4/zones/${this.config.zoneId}/assets/upload`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': options.contentType,
          'Cache-Control': options.cacheControl || this.config.cacheControl.staticAssets,
        },
        body: options.content,
      }
    );

    if (!response.ok) {
      throw new Error(`Cloudflare upload failed: ${response.statusText}`);
    }

    return this.getUrl(key);
  }

  async invalidate(options: InvalidationOptions): Promise<void> {
    await Promise.all(
      options.paths.map(path =>
        fetch(
          `https://api.cloudflare.com/client/v4/zones/${this.config.zoneId}/cache/purge`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${this.config.apiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ files: [this.getUrl(path)] }),
          }
        )
      )
    );
  }

  getUrl(path: string): string {
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    return `https://${this.config.domain}${normalizedPath}`;
  }
}

export class CustomCDNProvider implements CDNProvider {
  private config: CDNConfig;

  constructor(config: CDNConfig) {
    this.config = config;
  }

  async upload(_options: UploadOptions): Promise<string> {
    throw new Error('Custom CDN upload not implemented');
  }

  async invalidate(_options: InvalidationOptions): Promise<void> {
    console.log('Custom CDN invalidation called');
  }

  getUrl(path: string): string {
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    return `https://${this.config.domain}${normalizedPath}`;
  }
}
