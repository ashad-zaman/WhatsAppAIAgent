import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '@whatsapp-ai/database';
import { hashPassword, verifyPassword, generateToken, generateId } from '@whatsapp-ai/common';
import { generateApiKey } from '@whatsapp-ai/common';
import { config } from '@whatsapp-ai/config';
import { authenticate, AuthenticatedRequest } from '../middleware/auth';

const router = Router();

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  fullName: z.string().min(2),
  phone: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

router.post('/register', async (req, res, next) => {
  try {
    const body = registerSchema.parse(req.body);
    
    const existingUser = await prisma.user.findFirst({
      where: { email: body.email },
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        error: { code: 'USER_EXISTS', message: 'User with this email already exists' },
      });
    }

    const { hash, salt } = hashPassword(body.password);
    
    const user = await prisma.user.create({
      data: {
        email: body.email,
        passwordHash: hash,
        salt,
        fullName: body.fullName,
        phone: body.phone,
      },
    });

    const apiKey = generateApiKey();
    
    await prisma.session.create({
      data: {
        id: generateId(),
        userId: user.id,
        channel: 'API',
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    });

    const token = generateToken(
      { sub: user.id, email: user.email },
      config.jwt.secret,
      config.jwt.expiresIn
    );

    const refreshToken = generateToken(
      { sub: user.id, type: 'refresh' },
      config.jwt.secret,
      config.jwt.refreshExpiresIn
    );

    res.status(201).json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          fullName: user.fullName,
          plan: user.plan,
        },
        token,
        refreshToken,
        apiKey,
      },
    });
  } catch (error) {
    next(error);
  }
});

router.post('/login', async (req, res, next) => {
  try {
    const body = loginSchema.parse(req.body);
    
    const user = await prisma.user.findFirst({
      where: { email: body.email },
    });

    if (!user || !user.passwordHash || !user.salt) {
      return res.status(401).json({
        success: false,
        error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' },
      });
    }

    const isValid = verifyPassword(body.password, user.passwordHash, user.salt);

    if (!isValid) {
      return res.status(401).json({
        success: false,
        error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' },
      });
    }

    const token = generateToken(
      { sub: user.id, email: user.email },
      config.jwt.secret,
      config.jwt.expiresIn
    );

    const refreshToken = generateToken(
      { sub: user.id, type: 'refresh' },
      config.jwt.secret,
      config.jwt.refreshExpiresIn
    );

    await prisma.user.update({
      where: { id: user.id },
      data: { lastActiveAt: new Date() },
    });

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          fullName: user.fullName,
          plan: user.plan,
        },
        token,
        refreshToken,
      },
    });
  } catch (error) {
    next(error);
  }
});

router.post('/refresh', async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        error: { code: 'MISSING_TOKEN', message: 'Refresh token required' },
      });
    }

    const result = verifyToken(refreshToken, config.jwt.secret);
    
    if (!result.valid || !result.payload) {
      return res.status(401).json({
        success: false,
        error: { code: 'INVALID_TOKEN', message: 'Invalid refresh token' },
      });
    }

    const payload = result.payload as { sub: string; type: string };
    
    if (payload.type !== 'refresh') {
      return res.status(401).json({
        success: false,
        error: { code: 'INVALID_TOKEN', message: 'Invalid token type' },
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        error: { code: 'USER_NOT_FOUND', message: 'User not found' },
      });
    }

    const token = generateToken(
      { sub: user.id, email: user.email },
      config.jwt.secret,
      config.jwt.expiresIn
    );

    res.json({
      success: true,
      data: { token },
    });
  } catch (error) {
    next(error);
  }
});

router.post('/logout', authenticate, async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    res.json({
      success: true,
      data: { message: 'Logged out successfully' },
    });
  } catch (error) {
    next(error);
  }
});

router.get('/me', authenticate, async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user?.id },
      select: {
        id: true,
        email: true,
        fullName: true,
        phone: true,
        plan: true,
        timezone: true,
        avatarUrl: true,
        createdAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: { code: 'USER_NOT_FOUND', message: 'User not found' },
      });
    }

    res.json({
      success: true,
      data: { user },
    });
  } catch (error) {
    next(error);
  }
});

router.post('/forgot-password', async (req, res, next) => {
  try {
    const { email } = req.body;
    
    const user = await prisma.user.findFirst({ where: { email } });
    
    res.json({
      success: true,
      data: { message: 'If an account exists with this email, a reset link has been sent' },
    });
  } catch (error) {
    next(error);
  }
});

router.post('/reset-password', async (req, res, next) => {
  try {
    const { token, password } = req.body;
    
    res.json({
      success: true,
      data: { message: 'Password reset successfully' },
    });
  } catch (error) {
    next(error);
  }
});

export { router };
