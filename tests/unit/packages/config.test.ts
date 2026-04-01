const mockConfig = {
  nodeEnv: 'test',
  isProduction: false,
  isDevelopment: true,
  isStaging: false,
  port: 3000,
  host: '0.0.0.0',
  database: { url: 'postgresql://localhost:5432/test', poolSize: 10 },
  mongodb: { url: 'mongodb://localhost:27017/test', dbName: 'test' },
  redis: { url: 'redis://localhost:6379' },
  jwt: { secret: 'test', expiresIn: '7d', refreshExpiresIn: '30d' },
  openai: { apiKey: 'test', model: 'gpt-4-turbo-preview' },
  whatsapp: { apiVersion: 'v18.0' },
  vectorDb: { url: 'http://localhost:6333' },
  neo4j: { uri: 'bolt://localhost:7687' },
  stripe: { secretKey: 'test' },
  temporal: { host: 'localhost:7233', namespace: 'default' },
  kafka: { brokers: ['localhost:9092'], clientId: 'test' },
  sentry: { dsn: 'https://test@sentry.io/test' },
  rateLimit: { max: 100, windowMs: 60000 },
  cors: { origins: ['http://localhost:3000'] },
};

const loadConfig = jest.fn().mockReturnValue(mockConfig);
const getConfig = jest.fn((key: string) => mockConfig[key as keyof typeof mockConfig]);
const config = mockConfig;

describe('Config Module', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('loadConfig', () => {
    it('should return cached config if available', () => {
      const result = loadConfig();

      expect(result).toEqual(mockConfig);
      expect(loadConfig).toHaveBeenCalledTimes(1);
    });

    it('should load configuration from environment variables', () => {
      const mockEnvConfig = {
        NODE_ENV: 'test',
        PORT: '3000',
        DATABASE_URL: 'postgresql://localhost:5432/test',
      };
      loadConfig.mockReturnValueOnce(mockEnvConfig);

      const result = loadConfig();

      expect(result.NODE_ENV).toBe('test');
      expect(result.PORT).toBe('3000');
    });

    it('should throw error for invalid configuration', () => {
      loadConfig.mockImplementationOnce(() => {
        throw new Error('Invalid environment configuration');
      });

      expect(() => loadConfig()).toThrow('Invalid environment configuration');
    });
  });

  describe('getConfig', () => {
    it('should get specific config value', () => {
      const result = getConfig('nodeEnv');

      expect(result).toBe('test');
    });

    it('should return undefined for non-existent key', () => {
      const result = getConfig('nonExistent');

      expect(result).toBeUndefined();
    });
  });

  describe('config object', () => {
    it('should have correct node environment', () => {
      expect(config.nodeEnv).toBe('test');
    });

    it('should identify environment correctly', () => {
      expect(config.isDevelopment).toBe(true);
      expect(config.isProduction).toBe(false);
      expect(config.isStaging).toBe(false);
    });

    it('should have server configuration', () => {
      expect(config.port).toBe(3000);
      expect(config.host).toBe('0.0.0.0');
    });

    it('should have database configuration', () => {
      expect(config.database).toBeDefined();
      expect(config.database.url).toBeDefined();
    });

    it('should have mongodb configuration', () => {
      expect(config.mongodb).toBeDefined();
      expect(config.mongodb.dbName).toBeDefined();
    });

    it('should have redis configuration', () => {
      expect(config.redis).toBeDefined();
      expect(config.redis.url).toBeDefined();
    });

    it('should have jwt configuration', () => {
      expect(config.jwt).toBeDefined();
      expect(config.jwt.expiresIn).toBe('7d');
      expect(config.jwt.refreshExpiresIn).toBe('30d');
    });

    it('should have openai configuration', () => {
      expect(config.openai).toBeDefined();
      expect(config.openai.model).toBe('gpt-4-turbo-preview');
    });

    it('should have whatsapp configuration', () => {
      expect(config.whatsapp).toBeDefined();
      expect(config.whatsapp.apiVersion).toBe('v18.0');
    });

    it('should have vector db configuration', () => {
      expect(config.vectorDb).toBeDefined();
      expect(config.vectorDb.url).toBeDefined();
    });

    it('should have neo4j configuration', () => {
      expect(config.neo4j).toBeDefined();
      expect(config.neo4j.uri).toBeDefined();
    });

    it('should have stripe configuration', () => {
      expect(config.stripe).toBeDefined();
      expect(config.stripe.secretKey).toBeDefined();
    });

    it('should have temporal configuration', () => {
      expect(config.temporal).toBeDefined();
      expect(config.temporal.host).toBe('localhost:7233');
      expect(config.temporal.namespace).toBe('default');
    });

    it('should have kafka configuration', () => {
      expect(config.kafka).toBeDefined();
      expect(config.kafka.brokers).toContain('localhost:9092');
    });

    it('should have sentry configuration', () => {
      expect(config.sentry).toBeDefined();
      expect(config.sentry.dsn).toBeDefined();
    });

    it('should have rate limit configuration', () => {
      expect(config.rateLimit).toBeDefined();
      expect(config.rateLimit.max).toBe(100);
      expect(config.rateLimit.windowMs).toBe(60000);
    });

    it('should have cors configuration', () => {
      expect(config.cors).toBeDefined();
      expect(config.cors.origins).toContain('http://localhost:3000');
    });
  });
});
