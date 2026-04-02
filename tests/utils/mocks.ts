export const mocks = {
  prisma: {
    user: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    session: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
    },
    auditLog: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
    subscription: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  },
  mongodb: {
    collection: jest.fn().mockReturnValue({
      findOne: jest.fn(),
      find: jest.fn().mockReturnValue({
        toArray: jest.fn(),
      }),
      insertOne: jest.fn(),
      updateOne: jest.fn(),
      deleteOne: jest.fn(),
      aggregate: jest.fn().mockReturnValue({
        toArray: jest.fn(),
      }),
    }),
  },
  redis: {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    expire: jest.fn(),
    exists: jest.fn(),
    incr: jest.fn(),
    decr: jest.fn(),
    keys: jest.fn().mockResolvedValue([]),
  },
  kafka: {
    producer: jest.fn().mockReturnValue({
      connect: jest.fn(),
      send: jest.fn(),
      disconnect: jest.fn(),
    }),
    consumer: jest.fn().mockReturnValue({
      connect: jest.fn(),
      subscribe: jest.fn(),
      run: jest.fn(),
      disconnect: jest.fn(),
    }),
  },
  openai: {
    chat: {
      completions: {
        create: jest.fn(),
      },
    },
    embeddings: {
      create: jest.fn(),
    },
  },
  whatsapp: {
    sendMessage: jest.fn(),
    sendTemplate: jest.fn(),
    markAsRead: jest.fn(),
    getMediaUrl: jest.fn(),
  },
};

export const testUsers = {
  validUser: {
    id: 'user-123',
    email: 'test@example.com',
    name: 'Test User',
    phone: '+1234567890',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  adminUser: {
    id: 'admin-123',
    email: 'admin@example.com',
    name: 'Admin User',
    role: 'admin',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
};

export const testMessages = {
  textMessage: {
    id: 'msg-123',
    from: '+1234567890',
    to: '+0987654321',
    type: 'text',
    content: 'Hello, this is a test message',
    timestamp: new Date(),
    userId: 'user-123',
  },
  imageMessage: {
    id: 'msg-456',
    from: '+1234567890',
    to: '+0987654321',
    type: 'image',
    mediaId: 'media-123',
    caption: 'Check out this image',
    timestamp: new Date(),
    userId: 'user-123',
  },
};

export const testTokens = {
  valid: {
    accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.valid',
    refreshToken: 'refresh-token-123',
  },
  expired: {
    accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.expired',
    refreshToken: 'refresh-token-expired',
  },
};

export const testConfig = {
  apiGateway: {
    port: 3000,
    rateLimitMax: 100,
    rateLimitWindow: 60000,
  },
  database: {
    poolSize: 10,
    connectionTimeout: 30000,
  },
  redis: {
    ttl: 3600,
    maxRetries: 3,
  },
};
