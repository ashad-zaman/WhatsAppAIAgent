import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '@whatsapp-ai/database';
import { generateId, getNextOccurrence } from '@whatsapp-ai/common';
import { authenticate, AuthenticatedRequest } from '../middleware/auth';
import { queueService } from '@whatsapp-ai/queue';
import { eventBus } from '@whatsapp-ai/events';

const router = Router();

const createReminderSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  scheduledAt: z.string().datetime(),
  timezone: z.string().default('UTC'),
  repeatType: z.enum(['none', 'daily', 'weekly', 'monthly', 'yearly']).default('none'),
  repeatInterval: z.number().min(1).default(1),
  repeatEndDate: z.string().datetime().optional(),
  metadata: z.record(z.unknown()).optional(),
});

router.get('/', authenticate, async (req: AuthenticatedRequest, res, next) => {
  try {
    const { status, from, to } = req.query;
    
    const reminders = await prisma.reminder.findMany({
      where: {
        userId: req.user?.id,
        ...(status && { status: status as string }),
        ...(from && to && {
          scheduledAt: {
            gte: new Date(from as string),
            lte: new Date(to as string),
          },
        }),
      },
      orderBy: { scheduledAt: 'asc' },
    });

    res.json({ success: true, data: { reminders } });
  } catch (error) {
    next(error);
  }
});

router.post('/', authenticate, async (req: AuthenticatedRequest, res, next) => {
  try {
    const body = createReminderSchema.parse(req.body);
    
    const reminder = await prisma.reminder.create({
      data: {
        id: generateId(),
        userId: req.user?.id!,
        title: body.title,
        description: body.description,
        scheduledAt: new Date(body.scheduledAt),
        timezone: body.timezone,
        repeatType: body.repeatType.toUpperCase() as 'NONE' | 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY',
        repeatInterval: body.repeatInterval,
        repeatEndDate: body.repeatEndDate ? new Date(body.repeatEndDate) : null,
        metadata: body.metadata || {},
        source: 'API',
      },
    });

    await queueService.addReminder({
      reminderId: reminder.id,
      userId: req.user?.id!,
      title: reminder.title,
      scheduledAt: reminder.scheduledAt.toISOString(),
      timezone: reminder.timezone,
      repeatType: reminder.repeatType.toLowerCase() as 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly',
    });

    res.status(201).json({ success: true, data: { reminder } });
  } catch (error) {
    next(error);
  }
});

router.get('/:id', authenticate, async (req: AuthenticatedRequest, res, next) => {
  try {
    const reminder = await prisma.reminder.findFirst({
      where: {
        id: req.params.id,
        userId: req.user?.id,
      },
    });

    if (!reminder) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Reminder not found' },
      });
    }

    res.json({ success: true, data: { reminder } });
  } catch (error) {
    next(error);
  }
});

const updateReminderSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  scheduledAt: z.string().datetime().optional(),
  timezone: z.string().optional(),
  repeatType: z.enum(['none', 'daily', 'weekly', 'monthly', 'yearly']).optional(),
  repeatInterval: z.number().min(1).optional(),
  repeatEndDate: z.string().datetime().optional(),
  status: z.enum(['pending', 'completed', 'cancelled']).optional(),
  metadata: z.record(z.unknown()).optional(),
});

router.put('/:id', authenticate, async (req: AuthenticatedRequest, res, next) => {
  try {
    const body = updateReminderSchema.parse(req.body);
    
    const existingReminder = await prisma.reminder.findFirst({
      where: {
        id: req.params.id,
        userId: req.user?.id,
      },
    });

    if (!existingReminder) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Reminder not found' },
      });
    }

    const updateData: Record<string, unknown> = {};
    if (body.title) updateData.title = body.title;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.scheduledAt) updateData.scheduledAt = new Date(body.scheduledAt);
    if (body.timezone) updateData.timezone = body.timezone;
    if (body.repeatType) updateData.repeatType = body.repeatType.toUpperCase();
    if (body.repeatInterval) updateData.repeatInterval = body.repeatInterval;
    if (body.repeatEndDate) updateData.repeatEndDate = new Date(body.repeatEndDate);
    if (body.status) updateData.status = body.status.toUpperCase();
    if (body.metadata) updateData.metadata = body.metadata;

    const reminder = await prisma.reminder.update({
      where: { id: req.params.id },
      data: updateData,
    });

    if (body.scheduledAt || body.repeatType) {
      await queueService.removeReminder(reminder.id);
      if (reminder.status === 'PENDING') {
        await queueService.addReminder({
          reminderId: reminder.id,
          userId: req.user?.id!,
          title: reminder.title,
          scheduledAt: reminder.scheduledAt.toISOString(),
          timezone: reminder.timezone,
          repeatType: reminder.repeatType.toLowerCase() as 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly',
        });
      }
    }

    res.json({ success: true, data: { reminder } });
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', authenticate, async (req: AuthenticatedRequest, res, next) => {
  try {
    const reminder = await prisma.reminder.findFirst({
      where: {
        id: req.params.id,
        userId: req.user?.id,
      },
    });

    if (!reminder) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Reminder not found' },
      });
    }

    await queueService.removeReminder(reminder.id);
    await prisma.reminder.delete({
      where: { id: req.params.id },
    });

    res.json({ success: true, data: { message: 'Reminder deleted successfully' } });
  } catch (error) {
    next(error);
  }
});

router.post('/:id/complete', authenticate, async (req: AuthenticatedRequest, res, next) => {
  try {
    const reminder = await prisma.reminder.findFirst({
      where: {
        id: req.params.id,
        userId: req.user?.id,
      },
    });

    if (!reminder) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Reminder not found' },
      });
    }

    const updatedReminder = await prisma.reminder.update({
      where: { id: req.params.id },
      data: { status: 'COMPLETED' },
    });

    if (reminder.repeatType !== 'NONE') {
      const nextOccurrence = getNextOccurrence(
        reminder.scheduledAt,
        reminder.repeatType.toLowerCase(),
        reminder.repeatInterval
      );

      if (!reminder.repeatEndDate || nextOccurrence <= reminder.repeatEndDate) {
        await prisma.reminder.create({
          data: {
            ...reminder,
            id: generateId(),
            scheduledAt: nextOccurrence,
            status: 'PENDING',
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        });
      }
    }

    res.json({ success: true, data: { reminder: updatedReminder } });
  } catch (error) {
    next(error);
  }
});

const shareReminderSchema = z.object({
  userId: z.string().uuid(),
  permission: z.enum(['view', 'edit']).default('view'),
});

router.post('/:id/share', authenticate, async (req: AuthenticatedRequest, res, next) => {
  try {
    const body = shareReminderSchema.parse(req.body);
    
    const reminder = await prisma.reminder.findFirst({
      where: {
        id: req.params.id,
        userId: req.user?.id,
      },
    });

    if (!reminder) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Reminder not found' },
      });
    }

    const sharedReminder = await prisma.sharedReminder.create({
      data: {
        id: generateId(),
        reminderId: reminder.id,
        sharedWithUserId: body.userId,
        permission: body.permission,
      },
    });

    res.status(201).json({ success: true, data: { sharedReminder } });
  } catch (error) {
    next(error);
  }
});

router.get('/shared/with-me', authenticate, async (req: AuthenticatedRequest, res, next) => {
  try {
    const sharedReminders = await prisma.sharedReminder.findMany({
      where: { sharedWithUserId: req.user?.id },
      include: {
        reminder: true,
      },
    });

    res.json({
      success: true,
      data: {
        reminders: sharedReminders.map((sr) => ({
          ...sr.reminder,
          permission: sr.permission,
          sharedAt: sr.createdAt,
        })),
      },
    });
  } catch (error) {
    next(error);
  }
});

export { router };
