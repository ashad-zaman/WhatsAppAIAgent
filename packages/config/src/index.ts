import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'staging', 'production']).default('development'),
  PORT: z.string().default('3000'),
  HOST: z.string().default('0.0.0.0'),
  
  DATABASE_URL: z.string(),
  DATABASE_POOL_SIZE: z.string().optional(),
  DATABASE_SSL: z.string().optional(),
  DATABASE_MIN_POOL: z.string().optional(),
  DATABASE_MAX_POOL: z.string().optional(),
  
  MONGODB_URL: z.string().optional(),
  MONGODB_DB_NAME: z.string().default('whatsapp_ai_platform'),
  MONGODB_POOL_MIN: z.string().optional(),
  MONGODB_POOL_MAX: z.string().optional(),
  
  REDIS_URL: z.string(),
  REDIS_HOST: z.string().optional(),
  REDIS_PORT: z.string().optional(),
  REDIS_POOL_SIZE: z.string().optional(),
  
  JWT_SECRET: z.string(),
  JWT_EXPIRES_IN: z.string().default('7d'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('30d'),
  
  OPENAI_API_KEY: z.string(),
  OPENAI_MODEL: z.string().default('gpt-4-turbo-preview'),
  OPENAI_MAX_TOKENS: z.string().default('4096'),
  OPENAI_TEMPERATURE: z.string().default('0.7'),
  
  WHATSAPP_API_VERSION: z.string().default('v18.0'),
  WHATSAPP_PHONE_NUMBER_ID: z.string(),
  WHATSAPP_BUSINESS_ACCOUNT_ID: z.string(),
  WHATSAPP_ACCESS_TOKEN: z.string(),
  WHATSAPP_WEBHOOK_VERIFY_TOKEN: z.string(),
  
  VECTOR_DB_URL: z.string(),
  VECTOR_DB_API_KEY: z.string().optional(),
  VECTOR_DIMENSIONS: z.string().default('1536'),
  
  NEO4J_URI: z.string(),
  NEO4J_USER: z.string(),
  NEO4J_PASSWORD: z.string(),
  
  STRIPE_SECRET_KEY: z.string(),
  STRIPE_WEBHOOK_SECRET: z.string(),
  STRIPE_PRICE_FREE: z.string().optional(),
  STRIPE_PRICE_PRO: z.string().optional(),
  STRIPE_PRICE_ENTERPRISE: z.string().optional(),
  
  GOOGLE_CLIENT_ID: z.string(),
  GOOGLE_CLIENT_SECRET: z.string(),
  GOOGLE_REDIRECT_URI: z.string(),
  
  OUTLOOK_CLIENT_ID: z.string(),
  OUTLOOK_CLIENT_SECRET: z.string(),
  OUTLOOK_REDIRECT_URI: z.string(),
  
  AWS_ACCESS_KEY_ID: z.string(),
  AWS_SECRET_ACCESS_KEY: z.string(),
  AWS_REGION: z.string().default('us-east-1'),
  AWS_S3_BUCKET: z.string(),
  
  ELEVENLABS_API_KEY: z.string().optional(),
  
  TEMPORAL_HOST: z.string().default('localhost:7233'),
  TEMPORAL_NAMESPACE: z.string().default('default'),
  
  KAFKA_BROKERS: z.string().default('localhost:9092'),
  KAFKA_CLIENT_ID: z.string().default('whatsapp-ai-platform'),
  
  SENTRY_DSN: z.string().optional(),
  
  RATE_LIMIT_MAX: z.string().default('100'),
  RATE_LIMIT_WINDOW_MS: z.string().default('60000'),
  
  CORS_ORIGINS: z.string().default('http://localhost:3000'),
});

export type EnvConfig = z.infer<typeof envSchema>;

let cachedConfig: EnvConfig | null = null;

export function loadConfig(): EnvConfig {
  if (cachedConfig) return cachedConfig;
  
  const rawConfig: Record<string, string | undefined> = {};
  
  for (const key of Object.keys(process.env)) {
    rawConfig[key] = process.env[key];
  }
  
  const result = envSchema.safeParse(rawConfig);
  
  if (!result.success) {
    const errors = result.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
    throw new Error(`Invalid environment configuration: ${errors}`);
  }
  
  cachedConfig = result.data;
  return cachedConfig;
}

export function getConfig<K extends keyof EnvConfig>(key: K): EnvConfig[K] {
  const config = loadConfig();
  return config[key];
}

export const config = {
  get nodeEnv() { return getConfig('NODE_ENV'); },
  get isProduction() { return this.nodeEnv === 'production'; },
  get isDevelopment() { return this.nodeEnv === 'development'; },
  get isStaging() { return this.nodeEnv === 'staging'; },
  
  get port() { return parseInt(getConfig('PORT'), 10); },
  get host() { return getConfig('HOST'); },
  
  get database() {
    return {
      url: getConfig('DATABASE_URL'),
      poolSize: parseInt(getConfig('DATABASE_POOL_SIZE') || '10', 10),
      minPool: parseInt(getConfig('DATABASE_MIN_POOL') || '2', 10),
      maxPool: parseInt(getConfig('DATABASE_MAX_POOL') || '20', 10),
      ssl: getConfig('DATABASE_SSL') === 'true',
    };
  },
  
  get mongodb() {
    return {
      url: getConfig('MONGODB_URL') || getConfig('DATABASE_URL'),
      dbName: getConfig('MONGODB_DB_NAME'),
      poolMin: parseInt(getConfig('MONGODB_POOL_MIN') || '5', 10),
      poolMax: parseInt(getConfig('MONGODB_POOL_MAX') || '50', 10),
    };
  },
  
  get redis() {
    return {
      url: getConfig('REDIS_URL'),
      host: getConfig('REDIS_HOST'),
      port: parseInt(getConfig('REDIS_PORT') || '6379', 10),
      poolSize: parseInt(getConfig('REDIS_POOL_SIZE') || '10', 10),
    };
  },
  
  get jwt() {
    return {
      secret: getConfig('JWT_SECRET'),
      expiresIn: getConfig('JWT_EXPIRES_IN'),
      refreshExpiresIn: getConfig('JWT_REFRESH_EXPIRES_IN'),
    };
  },
  
  get openai() {
    return {
      apiKey: getConfig('OPENAI_API_KEY'),
      model: getConfig('OPENAI_MODEL'),
      maxTokens: parseInt(getConfig('OPENAI_MAX_TOKENS'), 10),
      temperature: parseFloat(getConfig('OPENAI_TEMPERATURE')),
    };
  },
  
  get whatsapp() {
    return {
      apiVersion: getConfig('WHATSAPP_API_VERSION'),
      phoneNumberId: getConfig('WHATSAPP_PHONE_NUMBER_ID'),
      businessAccountId: getConfig('WHATSAPP_BUSINESS_ACCOUNT_ID'),
      accessToken: getConfig('WHATSAPP_ACCESS_TOKEN'),
      webhookVerifyToken: getConfig('WHATSAPP_WEBHOOK_VERIFY_TOKEN'),
    };
  },
  
  get vectorDb() {
    return {
      url: getConfig('VECTOR_DB_URL'),
      apiKey: getConfig('VECTOR_DB_API_KEY'),
      dimensions: parseInt(getConfig('VECTOR_DIMENSIONS'), 10),
    };
  },
  
  get neo4j() {
    return {
      uri: getConfig('NEO4J_URI'),
      user: getConfig('NEO4J_USER'),
      password: getConfig('NEO4J_PASSWORD'),
    };
  },
  
  get stripe() {
    return {
      secretKey: getConfig('STRIPE_SECRET_KEY'),
      webhookSecret: getConfig('STRIPE_WEBHOOK_SECRET'),
      priceFree: getConfig('STRIPE_PRICE_FREE'),
      pricePro: getConfig('STRIPE_PRICE_PRO'),
      priceEnterprise: getConfig('STRIPE_PRICE_ENTERPRISE'),
    };
  },
  
  get googleCalendar() {
    return {
      clientId: getConfig('GOOGLE_CLIENT_ID'),
      clientSecret: getConfig('GOOGLE_CLIENT_SECRET'),
      redirectUri: getConfig('GOOGLE_REDIRECT_URI'),
    };
  },
  
  get outlookCalendar() {
    return {
      clientId: getConfig('OUTLOOK_CLIENT_ID'),
      clientSecret: getConfig('OUTLOOK_CLIENT_SECRET'),
      redirectUri: getConfig('OUTLOOK_REDIRECT_URI'),
    };
  },
  
  get aws() {
    return {
      accessKeyId: getConfig('AWS_ACCESS_KEY_ID'),
      secretAccessKey: getConfig('AWS_SECRET_ACCESS_KEY'),
      region: getConfig('AWS_REGION'),
      s3Bucket: getConfig('AWS_S3_BUCKET'),
    };
  },
  
  get elevenLabs() {
    return {
      apiKey: getConfig('ELEVENLABS_API_KEY'),
    };
  },
  
  get temporal() {
    return {
      host: getConfig('TEMPORAL_HOST'),
      namespace: getConfig('TEMPORAL_NAMESPACE'),
    };
  },
  
  get kafka() {
    return {
      brokers: getConfig('KAFKA_BROKERS').split(','),
      clientId: getConfig('KAFKA_CLIENT_ID'),
    };
  },
  
  get sentry() {
    return {
      dsn: getConfig('SENTRY_DSN'),
    };
  },
  
  get rateLimit() {
    return {
      max: parseInt(getConfig('RATE_LIMIT_MAX'), 10),
      windowMs: parseInt(getConfig('RATE_LIMIT_WINDOW_MS'), 10),
    };
  },
  
  get cors() {
    return {
      origins: getConfig('CORS_ORIGINS').split(','),
    };
  },
};

export default config;
