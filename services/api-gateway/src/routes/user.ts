import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '@whatsapp-ai/database';
import { authenticate, AuthenticatedRequest } from '../middleware/auth';

const router = Router();

router.get('/profile', authenticate, async (req: AuthenticatedRequest, res, next) => {
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
        isEmailVerified: true,
        isPhoneVerified: true,
        lastActiveAt: true,
        createdAt: true,
      },
    });

    res.json({ success: true, data: { user } });
  } catch (error) {
    next(error);
  }
});

const updateProfileSchema = z.object({
  fullName: z.string().min(2).optional(),
  phone: z.string().optional(),
  timezone: z.string().optional(),
  avatarUrl: z.string().url().optional(),
});

router.put('/profile', authenticate, async (req: AuthenticatedRequest, res, next) => {
  try {
    const body = updateProfileSchema.parse(req.body);
    
    const user = await prisma.user.update({
      where: { id: req.user?.id },
      data: body,
      select: {
        id: true,
        email: true,
        fullName: true,
        phone: true,
        timezone: true,
        avatarUrl: true,
      },
    });

    res.json({ success: true, data: { user } });
  } catch (error) {
    next(error);
  }
});

router.delete('/account', authenticate, async (req: AuthenticatedRequest, res, next) => {
  try {
    await prisma.user.delete({
      where: { id: req.user?.id },
    });

    res.json({ success: true, data: { message: 'Account deleted successfully' } });
  } catch (error) {
    next(error);
  }
});

router.get('/preferences', authenticate, async (req: AuthenticatedRequest, res, next) => {
  try {
    res.json({
      success: true,
      data: {
        preferences: {
          language: 'en',
          notifications: true,
          timezone: 'UTC',
          tone: 'friendly',
        },
      },
    });
  } catch (error) {
    next(error);
  }
});

const preferencesSchema = z.object({
  language: z.string().optional(),
  notifications: z.boolean().optional(),
  timezone: z.string().optional(),
  tone: z.enum(['formal', 'friendly', 'casual']).optional(),
});

router.put('/preferences', authenticate, async (req: AuthenticatedRequest, res, next) => {
  try {
    const body = preferencesSchema.parse(req.body);
    
    res.json({
      success: true,
      data: { preferences: body },
    });
  } catch (error) {
    next(error);
  }
});

router.post('/avatar', authenticate, async (req: AuthenticatedRequest, res, next) => {
  try {
    const { avatarUrl } = req.body;
    
    const user = await prisma.user.update({
      where: { id: req.user?.id },
      data: { avatarUrl },
      select: { id: true, avatarUrl: true },
    });

    res.json({ success: true, data: { user } });
  } catch (error) {
    next(error);
  }
});

export { router };
