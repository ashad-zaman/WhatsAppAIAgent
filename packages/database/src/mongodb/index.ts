import { MongoClient, Db, Collection, Document as MongoDocument, MonitorInterval } from 'mongodb';
import { config } from '@whatsapp-ai/config';

export interface MongoConnectionPoolConfig {
  minPoolSize?: number;
  maxPoolSize?: number;
  maxIdleTimeMS?: number;
  waitQueueTimeoutMS?: number;
  connectTimeoutMS?: number;
  socketTimeoutMS?: number;
  serverSelectionTimeoutMS?: number;
  heartbeatFrequencyMS?: number;
}

export interface MongoMetrics {
  totalConnections: number;
  availableConnections: number;
  inUseConnections: number;
  operationCount: number;
  queryCount: number;
  insertCount: number;
  updateCount: number;
  deleteCount: number;
  errorCount: number;
  averageQueryTime: number;
}

export interface MongoHealth {
  isHealthy: boolean;
  latency: number;
  connectionState: string;
  error?: string;
}

interface MongoDocument_Extended {
  _id?: string;
  [key: string]: unknown;
}

let mongoClient: MongoClient | null = null;
let database: Db | null = null;

const metrics = {
  operationCount: 0,
  queryCount: 0,
  insertCount: 0,
  updateCount: 0,
  deleteCount: 0,
  errorCount: 0,
  queryTimes: [] as number[],
};

const poolConfig: MongoConnectionPoolConfig = {
  minPoolSize: 5,
  maxPoolSize: 50,
  maxIdleTimeMS: 30000,
  waitQueueTimeoutMS: 30000,
  connectTimeoutMS: 10000,
  socketTimeoutMS: 45000,
  serverSelectionTimeoutMS: 30000,
  heartbeatFrequencyMS: 10000,
};

export const connectMongoDB = async (): Promise<Db> => {
  if (database) return database;

  try {
    mongoClient = new MongoClient(config.database.mongoUrl || config.database.url, {
      minPoolSize: poolConfig.minPoolSize,
      maxPoolSize: poolConfig.maxPoolSize,
      maxIdleTimeMS: poolConfig.maxIdleTimeMS,
      waitQueueTimeoutMS: poolConfig.waitQueueTimeoutMS,
      connectTimeoutMS: poolConfig.connectTimeoutMS,
      socketTimeoutMS: poolConfig.socketTimeoutMS,
      serverSelectionTimeoutMS: poolConfig.serverSelectionTimeoutMS,
      heartbeatFrequencyMS: poolConfig.heartbeatFrequencyMS,
    });

    mongoClient.on('connectionPoolCreated', (event) => {
      console.log('MongoDB connection pool created:', {
        maxPoolSize: event.options.maxPoolSize,
        minPoolSize: event.options.minPoolSize,
      });
    });

    mongoClient.on('connectionPoolClosed', () => {
      console.log('MongoDB connection pool closed');
    });

    mongoClient.on('connectionCreated', (event) => {
      console.log('MongoDB connection created');
    });

    mongoClient.on('connectionClosed', () => {
      console.log('MongoDB connection closed');
    });

    mongoClient.on('connectionReady', () => {
      console.log('MongoDB connection ready');
    });

    mongoClient.on('connectionError', (event) => {
      console.error('MongoDB connection error:', event.error);
      metrics.errorCount++;
    });

    await mongoClient.connect();
    database = mongoClient.db(config.database.mongoDbName || 'whatsapp_ai_platform');
    
    console.log('MongoDB connected successfully with connection pooling');
    return database;
  } catch (error) {
    console.error('Failed to connect to MongoDB:', error);
    throw error;
  }
};

export const disconnectMongoDB = async () => {
  if (mongoClient) {
    await mongoClient.close(true);
    mongoClient = null;
    database = null;
    console.log('MongoDB disconnected');
  }
};

export const getDatabase = (): Db => {
  if (!database) {
    throw new Error('MongoDB not connected. Call connectMongoDB() first.');
  }
  return database;
};

export const getCollection = <T extends MongoDocument_Extended = MongoDocument_Extended>(
  name: string
): Collection<T> => {
  return getDatabase().collection<T>(name);
};

export async function withMongoSession<T>(
  fn: (session: MongoClient['startSession'] extends () => infer R ? R : never) => Promise<T>
): Promise<T> {
  const client = getMongoClient();
  const session = client.startSession();
  
  try {
    return await fn(session);
  } finally {
    await session.endSession();
  }
}

export async function withTransaction<T>(
  fn: (session: MongoClient['startSession'] extends () => infer R ? R : never) => Promise<T>
): Promise<T> {
  const client = getMongoClient();
  const session = client.startSession();
  
  try {
    let result: T;
    await session.withTransaction(async () => {
      result = await fn(session);
    });
    return result!;
  } finally {
    await session.endSession();
  }
}

export function getMongoClient(): MongoClient {
  if (!mongoClient) {
    throw new Error('MongoDB not connected. Call connectMongoDB() first.');
  }
  return mongoClient;
}

export async function executeWithMetrics<T>(
  operation: 'query' | 'insert' | 'update' | 'delete',
  fn: () => Promise<T>
): Promise<{ result: T; duration: number }> {
  const startTime = Date.now();
  metrics.operationCount++;
  
  try {
    const result = await fn();
    const duration = Date.now() - startTime;
    
    switch (operation) {
      case 'query':
        metrics.queryCount++;
        break;
      case 'insert':
        metrics.insertCount++;
        break;
      case 'update':
        metrics.updateCount++;
        break;
      case 'delete':
        metrics.deleteCount++;
        break;
    }
    
    metrics.queryTimes.push(duration);
    if (metrics.queryTimes.length > 1000) {
      metrics.queryTimes.shift();
    }
    
    return { result, duration };
  } catch (error) {
    metrics.errorCount++;
    throw error;
  }
}

export function getMongoMetrics(): MongoMetrics {
  const poolStats = mongoClient?.topology ? {
    totalConnections: 0,
    availableConnections: 0,
    inUseConnections: 0,
  } : { totalConnections: 0, availableConnections: 0, inUseConnections: 0 };

  return {
    ...poolStats,
    operationCount: metrics.operationCount,
    queryCount: metrics.queryCount,
    insertCount: metrics.insertCount,
    updateCount: metrics.updateCount,
    deleteCount: metrics.deleteCount,
    errorCount: metrics.errorCount,
    averageQueryTime: metrics.queryTimes.length > 0
      ? metrics.queryTimes.reduce((a, b) => a + b, 0) / metrics.queryTimes.length
      : 0,
  };
}

export async function checkMongoHealth(): Promise<MongoHealth> {
  const start = Date.now();
  
  try {
    await getDatabase().command({ ping: 1 });
    return {
      isHealthy: true,
      latency: Date.now() - start,
      connectionState: mongoClient?.topology ? 'connected' : 'disconnected',
    };
  } catch (error) {
    return {
      isHealthy: false,
      latency: Date.now() - start,
      connectionState: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

export async function createIndexes(): Promise<void> {
  const messages = getCollection('messages');
  const sessions = getCollection('sessions');
  const conversations = getCollection('conversations');

  await messages.createIndexes([
    { key: { conversationId: 1, createdAt: -1 } },
    { key: { userId: 1, createdAt: -1 } },
    { key: { agentId: 1, createdAt: -1 } },
    { key: { 'metadata.whatsappMessageId': 1 }, unique: true, sparse: true },
    { key: { createdAt: 1 }, expireAfterSeconds: 2592000 },
  ]);

  await sessions.createIndexes([
    { key: { sessionId: 1 }, unique: true },
    { key: { userId: 1, updatedAt: -1 } },
    { key: { expiresAt: 1 }, expireAfterSeconds: 0 },
  ]);

  await conversations.createIndexes([
    { key: { conversationId: 1 }, unique: true },
    { key: { userId: 1, updatedAt: -1 } },
    { key: { lastMessageAt: -1 } },
  ]);

  console.log('MongoDB indexes created successfully');
}

export const collections = {
  messages: () => getCollection<MessageDocument>('messages'),
  sessions: () => getCollection<SessionDocument>('sessions'),
  conversations: () => getCollection<ConversationDocument>('conversations'),
  embeddings: () => getCollection<EmbeddingDocument>('embeddings'),
};

export interface MessageDocument extends MongoDocument_Extended {
  conversationId: string;
  userId: string;
  agentId?: string;
  direction: 'inbound' | 'outbound';
  channel: 'whatsapp' | 'dashboard' | 'voice' | 'api';
  messageType: 'text' | 'voice' | 'document' | 'image' | 'video' | 'location' | 'contact';
  content: {
    text?: string;
    mediaUrl?: string;
    mediaType?: string;
    transcription?: string;
  };
  metadata: {
    whatsappMessageId?: string;
    typingIndicator?: boolean;
    read?: boolean;
    deliveryStatus?: 'sent' | 'delivered' | 'read' | 'failed';
  };
  context: {
    sessionId: string;
    turnCount: number;
    parentMessageId?: string;
    intent?: string;
    entities?: Record<string, unknown>;
  };
  embeddings?: number[];
  createdAt: Date;
  updatedAt: Date;
}

export interface SessionDocument extends MongoDocument_Extended {
  sessionId: string;
  userId: string;
  agentId?: string;
  channel: 'whatsapp' | 'dashboard' | 'voice' | 'api';
  state: {
    currentNode: string;
    variables: Record<string, unknown>;
    memory: Record<string, unknown>;
  };
  context: {
    lastIntent?: string;
    entities: Record<string, unknown>;
    slotsFilled: string[];
  };
  preferences: {
    language: string;
    tone: 'formal' | 'friendly' | 'casual';
    notifications: boolean;
  };
  createdAt: Date;
  updatedAt: Date;
  expiresAt: Date;
}

export interface ConversationDocument extends MongoDocument_Extended {
  conversationId: string;
  userId: string;
  agentId?: string;
  channel: 'whatsapp' | 'dashboard' | 'voice' | 'api';
  participants: string[];
  metadata: {
    startedWith?: string;
    lastIntent?: string;
  };
  createdAt: Date;
  updatedAt: Date;
  lastMessageAt: Date;
}

export interface EmbeddingDocument extends MongoDocument_Extended {
  collection: string;
  documentId: string;
  chunkId: string;
  userId: string;
  orgId?: string;
  text: string;
  vector: number[];
  metadata: Record<string, unknown>;
  createdAt: Date;
}

export default {
  connect: connectMongoDB,
  disconnect: disconnectMongoDB,
  getDatabase,
  getCollection,
  getClient: getMongoClient,
  collections,
  withSession: withMongoSession,
  withTransaction,
  executeWithMetrics,
  getMetrics: getMongoMetrics,
  checkHealth: checkMongoHealth,
  createIndexes,
};
