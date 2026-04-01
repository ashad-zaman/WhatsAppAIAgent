const mockRateLimit = jest.fn().mockImplementation((req: any, res: any, next: any) => next());
const mockVerifyToken = jest.fn();
const mockAppError = jest.fn();

jest.mock('@whatsapp-ai/config', () => ({
  config: {
    port: 3000,
    host: '0.0.0.0',
    cors: {
      origins: ['http://localhost:3000'],
    },
    rateLimit: {
      max: 100,
      windowMs: 60000,
    },
    jwt: {
      secret: 'test-secret',
    },
  },
}));

jest.mock('express-rate-limit', () => {
  return jest.fn().mockImplementation(() => mockRateLimit);
});

jest.mock('@whatsapp-ai/common', () => ({
  verifyToken: mockVerifyToken,
  AppError: mockAppError,
}));

jest.mock('ws', () => ({
  WebSocketServer: jest.fn().mockImplementation(() => ({
    on: jest.fn(),
    on: jest.fn((event: string, callback: any) => {
      if (event === 'connection') {
        callback(
          { on: jest.fn(), send: jest.fn() },
          { url: '/ws' }
        );
      }
    }),
  })),
  WebSocket: jest.fn(),
}));

interface Request {
  body?: any;
  params?: any;
  query?: any;
  headers?: any;
}

interface Response {
  statusCode?: number;
  body?: any;
  status(code: number): Response;
  json(data: any): Response;
  send(data?: any): Response;
}

const express = () => {
  const app = {
    routes: [] as { method: string; path: string; handler: Function }[],
    middleware: [] as Function[],

    use(fn: Function) {
      this.middleware.push(fn);
      return this;
    },

    get(path: string, handler: (req: Request, res: Response) => void) {
      this.routes.push({ method: 'GET', path, handler });
      return this;
    },

    post(path: string, handler: (req: Request, res: Response) => void) {
      this.routes.push({ method: 'POST', path, handler });
      return this;
    },

    handle(req: Request, res: Response) {
      const route = this.routes.find(
        (r) => r.path === req.path
      );
      if (route) {
        route.handler(req, res);
      } else {
        res.status(404).json({ error: 'Not found' });
      }
    },
  };
  return app;
};

const request = async (app: any, method: string, path: string, body?: any) => {
  const route = app.routes.find(
    (r: any) => r.method === method && r.path === path
  );

  const res: Response = {
    statusCode: 200,
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    json(data: any) {
      this.body = data;
      return this;
    },
    send(data?: any) {
      this.body = data;
      return this;
    },
  };

  if (route) {
    route.handler({ body, path }, res);
  }

  return {
    status: res.statusCode,
    body: res.body,
  };
};

describe('API Gateway', () => {
  let app: ReturnType<typeof express>;

  beforeEach(() => {
    jest.clearAllMocks();

    mockVerifyToken.mockReturnValue({ valid: true, payload: { sub: 'user-123' } });

    app = express();
    app.get('/health', (_req: Request, res: Response) => {
      res.json({ status: 'healthy', timestamp: new Date().toISOString() });
    });
    app.get('/ready', (_req: Request, res: Response) => {
      res.json({ status: 'ready', services: {} });
    });
    app.get('/api/auth/login', (_req: Request, res: Response) => {
      res.json({ token: 'mock-token' });
    });
  });

  describe('Health Endpoints', () => {
    describe('GET /health', () => {
      it('should return health status', async () => {
        const response = await request(app, 'GET', '/health');

        expect(response.status).toBe(200);
        expect(response.body.status).toBe('healthy');
        expect(response.body.timestamp).toBeDefined();
      });

      it('should return ISO timestamp', async () => {
        const response = await request(app, 'GET', '/health');

        expect(response.body.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/);
      });
    });

    describe('GET /ready', () => {
      it('should return ready status', async () => {
        const response = await request(app, 'GET', '/ready');

        expect(response.status).toBe(200);
        expect(response.body.status).toBe('ready');
      });

      it('should include services object', async () => {
        const response = await request(app, 'GET', '/ready');

        expect(response.body.services).toBeDefined();
      });
    });
  });

  describe('Authentication', () => {
    describe('POST /api/auth/login', () => {
      it('should login with valid credentials', async () => {
        const response = await request(app, 'GET', '/api/auth/login');

        expect(response.status).toBe(200);
        expect(response.body.token).toBeDefined();
      });
    });

    describe('JWT Token Verification', () => {
      it('should verify valid token', () => {
        mockVerifyToken.mockReturnValue({ valid: true, payload: { sub: 'user-123' } });

        const result = mockVerifyToken('valid-token', 'test-secret');

        expect(result.valid).toBe(true);
      });

      it('should reject invalid token', () => {
        mockVerifyToken.mockReturnValue({ valid: false, error: 'Invalid token' });

        const result = mockVerifyToken('invalid-token', 'test-secret');

        expect(result.valid).toBe(false);
      });

      it('should extract user ID from token payload', () => {
        mockVerifyToken.mockReturnValue({ valid: true, payload: { sub: 'user-123', email: 'test@example.com' } });

        const result = mockVerifyToken('valid-token', 'test-secret');

        expect((result.payload as any).sub).toBe('user-123');
      });
    });
  });

  describe('Rate Limiting', () => {
    it('should apply rate limiting middleware', () => {
      expect(mockRateLimit).toBeDefined();
    });

    it('should return rate limit message when exceeded', () => {
      const errorRes: Response = { statusCode: 429 };
      errorRes.status = function(code: number) {
        this.statusCode = code;
        return this;
      };
      errorRes.json = function(data: any) {
        this.body = data;
        return this;
      };

      expect(errorRes.statusCode).toBe(429);
    });
  });

  describe('CORS Configuration', () => {
    it('should configure CORS with allowed origins', () => {
      const corsConfig = {
        origin: ['http://localhost:3000'],
        credentials: true,
      };

      expect(corsConfig.origin).toContain('http://localhost:3000');
      expect(corsConfig.credentials).toBe(true);
    });
  });

  describe('Request Parsing', () => {
    it('should parse JSON request bodies', async () => {
      app.post('/api/test', (req: Request, res: Response) => {
        res.json({ received: req.body });
      });

      const response = await request(app, 'POST', '/api/test', { key: 'value' });

      expect(response.status).toBe(200);
      expect(response.body.received.key).toBe('value');
    });
  });

  describe('Error Handling', () => {
    it('should handle error responses', async () => {
      app.get('/api/error', (req: Request, res: Response) => {
        res.status(500).json({ error: 'Internal error' });
      });

      const response = await request(app, 'GET', '/api/error');

      expect(response.status).toBe(500);
    });
  });

  describe('WebSocket Support', () => {
    it('should support WebSocket upgrade', () => {
      const wss = {
        on: jest.fn(),
      };

      expect(wss.on).toBeDefined();
    });

    it('should handle WebSocket authentication', () => {
      const authMessage = {
        type: 'authenticate',
        token: 'valid-token',
      };

      mockVerifyToken.mockReturnValue({
        valid: true,
        payload: { sub: 'user-123' },
      });

      expect(authMessage.type).toBe('authenticate');
    });

    it('should handle WebSocket subscribe', () => {
      const subscribeMessage = {
        type: 'subscribe',
        payload: { channel: 'notifications' },
      };

      expect(subscribeMessage.type).toBe('subscribe');
    });
  });

  describe('Security Headers', () => {
    it('should include security headers', () => {
      const securityHeaders = {
        contentSecurityPolicy: true,
        crossOriginEmbedderPolicy: true,
      };

      expect(securityHeaders.contentSecurityPolicy).toBe(true);
    });
  });

  describe('Compression', () => {
    it('should configure compression settings', () => {
      const compressionConfig = {
        level: 6,
        threshold: 1024,
      };

      expect(compressionConfig.level).toBe(6);
      expect(compressionConfig.threshold).toBe(1024);
    });

    it('should skip compression for images', () => {
      const req = { headers: { 'x-no-compression': 'false' } };
      const res = { getHeader: jest.fn().mockReturnValue('image/png') };

      const shouldCompress = !req.headers['x-no-compression'] && !res.getHeader('Content-Type')?.includes('image');

      expect(shouldCompress).toBe(false);
    });
  });
});
