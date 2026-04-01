import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import { WebSocketServer, WebSocket } from 'ws';
import { createServer } from 'http';
import { config } from '@whatsapp-ai/config';
import { rateLimit } from 'express-rate-limit';
import { verifyToken } from '@whatsapp-ai/common';
import { AppError } from '@whatsapp-ai/common';
import { router as authRoutes } from './routes/auth';
import { router as userRoutes } from './routes/user';
import { router as agentRoutes } from './routes/agent';
import { router as reminderRoutes } from './routes/reminder';
import { router as documentRoutes } from './routes/document';
import { router as calendarRoutes } from './routes/calendar';
import { router as ragRoutes } from './routes/rag';
import { router as billingRoutes } from './routes/billing';
import { router as webhookRoutes } from './routes/webhook';
import { router as docsRoutes } from './routes/docs';
import { errorHandler, notFoundHandler } from './middleware/error';
import { requestLogger } from './middleware/logger';

const app: Express = express();
const server = createServer(app);

const wss = new WebSocketServer({ server, path: '/ws' });

wss.on('connection', (ws: WebSocket, req: Request) => {
  console.log('WebSocket client connected');

  ws.on('message', (message: Buffer) => {
    try {
      const data = JSON.parse(message.toString());
      handleWebSocketMessage(ws, data);
    } catch (error) {
      ws.send(JSON.stringify({ error: 'Invalid message format' }));
    }
  });

  ws.on('close', () => {
    console.log('WebSocket client disconnected');
  });

  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
  });
});

const handleWebSocketMessage = (ws: WebSocket, data: { type: string; payload: unknown; token?: string }) => {
  switch (data.type) {
    case 'authenticate':
      const authResult = verifyToken(data.token as string, config.jwt.secret);
      if (authResult.valid) {
        ws.send(JSON.stringify({ type: 'authenticated', payload: { userId: (authResult.payload as { sub: string }).sub } }));
      } else {
        ws.send(JSON.stringify({ type: 'auth_error', payload: { error: authResult.error } }));
      }
      break;
    case 'subscribe':
      ws.send(JSON.stringify({ type: 'subscribed', payload: data.payload }));
      break;
    default:
      ws.send(JSON.stringify({ error: 'Unknown message type' }));
  }
};

app.use(helmet({
  contentSecurityPolicy: true,
  crossOriginEmbedderPolicy: true,
}));
app.use(cors({
  origin: config.cors.origins,
  credentials: true,
}));
app.use(compression({
  level: 6,
  threshold: 1024,
  filter: (req, res) => {
    if (req.headers['x-no-compression']) {
      return false;
    }
    const contentType = res.getHeader('Content-Type') as string;
    if (contentType && contentType.includes('image')) {
      return false;
    }
    return compression.filter(req, res);
  },
  chunkSize: 16384,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan('combined'));
app.use(requestLogger);

const limiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.max,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
});

app.use('/api/', limiter);

app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

app.get('/ready', async (req: Request, res: Response) => {
  res.json({ status: 'ready', services: {} });
});

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/agents', agentRoutes);
app.use('/api/reminders', reminderRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/calendar', calendarRoutes);
app.use('/api/rag', ragRoutes);
app.use('/api/billing', billingRoutes);
app.use('/api/webhooks', webhookRoutes);
app.use('/api/docs', docsRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json(err.toJSON());
  }
  console.error('Unhandled error:', err);
  res.status(500).json({
    code: 'INTERNAL_ERROR',
    message: 'An unexpected error occurred',
    statusCode: 500,
  });
});

const PORT = config.port;
const HOST = config.host;

server.listen(PORT, HOST, () => {
  console.log(`API Gateway running on http://${HOST}:${PORT}`);
  console.log(`WebSocket server running on ws://${HOST}:${PORT}/ws`);
});

process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

export { app, server };
