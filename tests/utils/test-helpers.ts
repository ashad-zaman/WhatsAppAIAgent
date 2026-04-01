export function createMockRequest(overrides = {}) {
  return {
    headers: {
      authorization: 'Bearer test-token',
      'content-type': 'application/json',
      'x-request-id': 'req-123',
    },
    method: 'GET',
    url: '/api/test',
    query: {},
    params: {},
    body: {},
    user: null,
    ip: '127.0.0.1',
    ...overrides,
  };
}

export function createMockResponse() {
  const res = {
    statusCode: 200,
    body: null,
    headers: {},
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    send: jest.fn().mockReturnThis(),
    set: jest.fn().mockReturnThis(),
    setHeader: jest.fn().mockReturnThis(),
    statusMessage: '',
  };
  return res;
}

export function createMockNext() {
  return jest.fn();
}

export function createMockRequestHandler() {
  const req = createMockRequest();
  const res = createMockResponse();
  const next = createMockNext();
  return { req, res, next };
}

export function generateTestId(prefix = 'test'): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export function generateTestEmail(): string {
  return `test-${Date.now()}@example.com`;
}

export function generateTestPhone(): string {
  return `+1${Date.now().toString().slice(-10)}`;
}

export async function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export function createMockLogger() {
  return {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  };
}

export function createMockConfig(overrides = {}) {
  return {
    port: 3000,
    nodeEnv: 'test',
    databaseUrl: 'postgresql://test:test@localhost:5432/test',
    redisUrl: 'redis://localhost:6379',
    jwtSecret: 'test-secret',
    jwtExpiresIn: '1h',
    openaiApiKey: 'sk-test',
    ...overrides,
  };
}
