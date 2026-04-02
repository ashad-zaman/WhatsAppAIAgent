import { PrismaClient } from '@prisma/client';
import { config } from '@whatsapp-ai/config';
import { getEnhancedPrisma, EnhancedPrismaClient } from './enhanced-client';

const prismaClientSingleton = () => {
  return new PrismaClient({
    log: config.isProduction ? ['error'] : ['query', 'error', 'warn'],
    datasources: {
      db: {
        url: config.database.url,
      },
    },
  });
};

declare global {
  var prismaGlobal: undefined | ReturnType<typeof prismaClientSingleton>;
}

export const prisma = globalThis.prismaGlobal ?? prismaClientSingleton();

if (config.isDevelopment) {
  globalThis.prismaGlobal = prisma;
}

export const enhancedPrisma: EnhancedPrismaClient = getEnhancedPrisma({
  min: 2,
  max: 20,
  acquireTimeoutMillis: 30000,
  idleTimeoutMillis: 30000,
});

export const connectDatabase = async () => {
  try {
    await prisma.$connect();
    await enhancedPrisma.connect();
    console.log('PostgreSQL connected successfully with connection pooling');
  } catch (error) {
    console.error('Failed to connect to PostgreSQL:', error);
    throw error;
  }
};

export const disconnectDatabase = async () => {
  await enhancedPrisma.disconnect();
  await prisma.$disconnect();
  console.log('PostgreSQL disconnected');
};

export const getPrismaPoolMetrics = () => enhancedPrisma.getMetrics();

export const checkDatabaseHealth = () => enhancedPrisma.checkHealth();

export type { User, Organization, Agent, Reminder, Document, Message, Session } from '@prisma/client';
