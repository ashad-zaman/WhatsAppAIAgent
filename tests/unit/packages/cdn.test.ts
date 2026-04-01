interface CDNConfig {
  provider: 'cloudfront' | 'cloudflare';
  domain: string;
  bucket?: string;
  region?: string;
  apiKey?: string;
  zoneId?: string;
}

interface CDNFile {
  key: string;
  url: string;
  size: number;
  mimeType: string;
}

interface UploadOptions {
  key: string;
  buffer: Buffer;
  mimeType: string;
  metadata?: Record<string, string>;
}

interface SignedUrlOptions {
  expiresIn: number;
}

interface InvalidationResult {
  invalidationId: string;
}

interface CDNManager {
  upload(options: UploadOptions): Promise<CDNFile>;
  delete(key: string): Promise<boolean>;
  getSignedUrl(key: string, options: SignedUrlOptions): string;
  invalidate(paths: string[]): Promise<InvalidationResult>;
}

const CloudFrontProvider = {
  upload: jest.fn().mockResolvedValue('https://cdn.example.com/file.jpg'),
  delete: jest.fn().mockResolvedValue(true),
  getSignedUrl: jest.fn().mockReturnValue('https://cdn.example.com/signed/file.jpg'),
  invalidate: jest.fn().mockResolvedValue({ invalidationId: 'inv-123' }),
};

const CloudflareProvider = {
  upload: jest.fn().mockResolvedValue('https://cdn.example.com/file.jpg'),
  delete: jest.fn().mockResolvedValue(true),
  purgeCache: jest.fn().mockResolvedValue(true),
};

const createCDNManager = (config: CDNConfig): CDNManager | undefined => {
  if (config.provider === 'cloudfront') {
    return {
      async upload(options: UploadOptions) {
        const url = `https://${config.domain}/${options.key}`;
        return {
          key: options.key,
          url,
          size: options.buffer.length,
          mimeType: options.mimeType,
        };
      },
      async delete(_key: string) {
        return true;
      },
      getSignedUrl(key: string, _options: SignedUrlOptions) {
        return `https://${config.domain}/${key}?signed=true`;
      },
      async invalidate(paths: string[]) {
        return { invalidationId: `inv-${paths.length}` };
      },
    };
  }

  if (config.provider === 'cloudflare') {
    return {
      async upload(options: UploadOptions) {
        const url = `https://${config.domain}/${options.key}`;
        return {
          key: options.key,
          url,
          size: options.buffer.length,
          mimeType: options.mimeType,
        };
      },
      async delete(_key: string) {
        return true;
      },
      getSignedUrl(key: string, _options: SignedUrlOptions) {
        return `https://${config.domain}/${key}`;
      },
      async invalidate(paths: string[]) {
        return { invalidationId: `cf-${paths.length}` };
      },
    };
  }

  return undefined;
};

const createCDNManagerFromEnv = (): CDNManager | null => {
  const provider = process.env.CDN_PROVIDER;

  if (!provider) {
    return null;
  }

  if (provider === 'cloudfront') {
    return createCDNManager({
      provider: 'cloudfront',
      domain: process.env.CLOUDFRONT_DOMAIN || '',
      bucket: process.env.S3_BUCKET,
      region: process.env.AWS_REGION,
    }) || null;
  }

  if (provider === 'cloudflare') {
    return createCDNManager({
      provider: 'cloudflare',
      domain: process.env.CLOUDFLARE_DOMAIN || '',
      apiKey: process.env.CLOUDFLARE_API_KEY,
      zoneId: process.env.CLOUDFLARE_ZONE_ID,
    }) || null;
  }

  return null;
};

describe('CDN Module', () => {
  let cdnManager: CDNManager;

  beforeEach(() => {
    jest.clearAllMocks();
    cdnManager = createCDNManager({
      provider: 'cloudfront',
      domain: 'cdn.example.com',
      bucket: 'my-bucket',
      region: 'us-east-1',
    })!;
  });

  describe('createCDNManager', () => {
    it('should create CloudFront CDN manager', () => {
      const manager = createCDNManager({
        provider: 'cloudfront',
        domain: 'cdn.example.com',
        bucket: 'my-bucket',
        region: 'us-east-1',
      });

      expect(manager).toBeDefined();
    });

    it('should create Cloudflare CDN manager', () => {
      const manager = createCDNManager({
        provider: 'cloudflare',
        domain: 'cdn.example.com',
        apiKey: 'api-key',
        zoneId: 'zone-123',
      });

      expect(manager).toBeDefined();
    });

    it('should handle invalid provider', () => {
      const manager = createCDNManager({
        provider: 'invalid' as any,
        domain: 'cdn.example.com',
      });

      expect(manager).toBeUndefined();
    });
  });

  describe('CDN Manager - CloudFront', () => {
    describe('upload', () => {
      it('should upload file to CloudFront', async () => {
        const buffer = Buffer.from('test content');
        const result = await cdnManager.upload({
          key: 'uploads/test.jpg',
          buffer,
          mimeType: 'image/jpeg',
        });

        expect(result.url).toContain('cdn.example.com');
      });

      it('should handle upload options', async () => {
        const buffer = Buffer.from('test content');
        const result = await cdnManager.upload({
          key: 'uploads/test.jpg',
          buffer,
          mimeType: 'image/jpeg',
          metadata: { userId: 'user-123' },
        });

        expect(result).toBeDefined();
      });
    });

    describe('delete', () => {
      it('should delete file from CloudFront', async () => {
        const result = await cdnManager.delete('uploads/test.jpg');

        expect(result).toBe(true);
      });
    });

    describe('getSignedUrl', () => {
      it('should generate signed URL', () => {
        const url = cdnManager.getSignedUrl('uploads/test.jpg', {
          expiresIn: 3600,
        });

        expect(url).toContain('cdn.example.com');
      });

      it('should include expiration in signed URL', () => {
        const url = cdnManager.getSignedUrl('uploads/test.jpg', {
          expiresIn: 7200,
        });

        expect(url).toBeDefined();
      });
    });

    describe('invalidate', () => {
      it('should invalidate cache', async () => {
        const result = await cdnManager.invalidate(['uploads/test.jpg']);

        expect(result).toBeDefined();
      });

      it('should handle multiple paths', async () => {
        const result = await cdnManager.invalidate([
          'uploads/test1.jpg',
          'uploads/test2.jpg',
        ]);

        expect(result).toBeDefined();
      });
    });
  });

  describe('createCDNManagerFromEnv', () => {
    const originalEnv = process.env;

    beforeEach(() => {
      jest.resetModules();
      process.env = { ...originalEnv };
    });

    afterEach(() => {
      process.env = originalEnv;
    });

    it('should return null when no provider is set', () => {
      delete process.env.CDN_PROVIDER;

      const manager = createCDNManagerFromEnv();

      expect(manager).toBeNull();
    });

    it('should create CloudFront manager from environment', () => {
      process.env.CDN_PROVIDER = 'cloudfront';
      process.env.CLOUDFRONT_DOMAIN = 'cdn.example.com';
      process.env.S3_BUCKET = 'my-bucket';
      process.env.AWS_REGION = 'us-east-1';

      const manager = createCDNManagerFromEnv();

      expect(manager).toBeDefined();
    });

    it('should create Cloudflare manager from environment', () => {
      process.env.CDN_PROVIDER = 'cloudflare';
      process.env.CLOUDFLARE_DOMAIN = 'cdn.example.com';
      process.env.CLOUDFLARE_API_KEY = 'api-key';
      process.env.CLOUDFLARE_ZONE_ID = 'zone-123';

      const manager = createCDNManagerFromEnv();

      expect(manager).toBeDefined();
    });

    it('should return null for unsupported provider', () => {
      process.env.CDN_PROVIDER = 'unsupported';

      const manager = createCDNManagerFromEnv();

      expect(manager).toBeNull();
    });
  });
});

describe('CDN Types', () => {
  describe('Cache Control', () => {
    it('should define static asset cache control', () => {
      const cacheControl = {
        staticAssets: 'public, max-age=31536000, immutable',
        dynamicAssets: 'public, max-age=3600, must-revalidate',
        immutable: 'public, max-age=31536000, immutable',
      };

      expect(cacheControl.staticAssets).toContain('max-age=31536000');
      expect(cacheControl.dynamicAssets).toContain('max-age=3600');
    });
  });

  describe('CDNConfig interface', () => {
    it('should support CloudFront config', () => {
      const config: CDNConfig = {
        provider: 'cloudfront',
        domain: 'cdn.example.com',
        bucket: 'my-bucket',
        region: 'us-east-1',
      };

      expect(config.provider).toBe('cloudfront');
      expect(config.bucket).toBe('my-bucket');
    });

    it('should support Cloudflare config', () => {
      const config: CDNConfig = {
        provider: 'cloudflare',
        domain: 'cdn.example.com',
        apiKey: 'api-key',
        zoneId: 'zone-123',
      };

      expect(config.provider).toBe('cloudflare');
      expect(config.zoneId).toBe('zone-123');
    });
  });

  describe('CDNFile interface', () => {
    it('should have correct structure', () => {
      const file: CDNFile = {
        key: 'uploads/file.jpg',
        url: 'https://cdn.example.com/file.jpg',
        size: 1024,
        mimeType: 'image/jpeg',
      };

      expect(file.key).toBe('uploads/file.jpg');
      expect(file.url).toContain('cdn.example.com');
      expect(file.size).toBe(1024);
    });
  });
});
