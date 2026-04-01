import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '@whatsapp-ai/database';
import { generateId } from '@whatsapp-ai/common';
import { authenticate, AuthenticatedRequest } from '../middleware/auth';

const router = Router();

const createAgentSchema = z.object({
  name: z.string().min(1),
  type: z.enum(['reminder', 'calendar', 'document', 'conversation', 'voice']),
  config: z.object({
    model: z.string().optional(),
    temperature: z.number().min(0).max(2).optional(),
    maxTokens: z.number().optional(),
    tools: z.array(z.object({
      name: z.string(),
      description: z.string(),
      parameters: z.record(z.unknown()),
    })).optional(),
  }).optional(),
  systemPrompt: z.string().optional(),
});

router.get('/', authenticate, async (req: AuthenticatedRequest, res, next) => {
  try {
    const { type, isActive } = req.query;
    
    const agents = await prisma.agent.findMany({
      where: {
        organization: { members: { some: { userId: req.user?.id } } },
        ...(type && { type: type as string }),
        ...(isActive !== undefined && { isActive: isActive === 'true' }),
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ success: true, data: { agents } });
  } catch (error) {
    next(error);
  }
});

router.post('/', authenticate, async (req: AuthenticatedRequest, res, next) => {
  try {
    const body = createAgentSchema.parse(req.body);
    
    let org = await prisma.organization.findFirst({
      where: { ownerId: req.user?.id },
    });

    if (!org) {
      org = await prisma.organization.create({
        data: {
          name: `${req.user?.email}'s Organization`,
          ownerId: req.user?.id!,
        },
      });

      await prisma.organizationMember.create({
        data: {
          orgId: org.id,
          userId: req.user?.id!,
          role: 'OWNER',
        },
      });
    }

    const agent = await prisma.agent.create({
      data: {
        id: generateId(),
        orgId: org.id,
        name: body.name,
        type: body.type,
        config: body.config || {},
        systemPrompt: body.systemPrompt,
      },
    });

    res.status(201).json({ success: true, data: { agent } });
  } catch (error) {
    next(error);
  }
});

router.get('/:id', authenticate, async (req: AuthenticatedRequest, res, next) => {
  try {
    const agent = await prisma.agent.findFirst({
      where: {
        id: req.params.id,
        organization: { members: { some: { userId: req.user?.id } } },
      },
    });

    if (!agent) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Agent not found' },
      });
    }

    res.json({ success: true, data: { agent } });
  } catch (error) {
    next(error);
  }
});

const updateAgentSchema = z.object({
  name: z.string().min(1).optional(),
  config: z.object({
    model: z.string().optional(),
    temperature: z.number().min(0).max(2).optional(),
    maxTokens: z.number().optional(),
    tools: z.array(z.object({
      name: z.string(),
      description: z.string(),
      parameters: z.record(z.unknown()),
    })).optional(),
  }).optional(),
  systemPrompt: z.string().optional(),
  isActive: z.boolean().optional(),
});

router.put('/:id', authenticate, async (req: AuthenticatedRequest, res, next) => {
  try {
    const body = updateAgentSchema.parse(req.body);
    
    const existingAgent = await prisma.agent.findFirst({
      where: {
        id: req.params.id,
        organization: { members: { some: { userId: req.user?.id } } },
      },
    });

    if (!existingAgent) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Agent not found' },
      });
    }

    const agent = await prisma.agent.update({
      where: { id: req.params.id },
      data: body,
    });

    res.json({ success: true, data: { agent } });
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', authenticate, async (req: AuthenticatedRequest, res, next) => {
  try {
    const existingAgent = await prisma.agent.findFirst({
      where: {
        id: req.params.id,
        organization: { members: { some: { userId: req.user?.id } } },
      },
    });

    if (!existingAgent) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Agent not found' },
      });
    }

    await prisma.agent.delete({
      where: { id: req.params.id },
    });

    res.json({ success: true, data: { message: 'Agent deleted successfully' } });
  } catch (error) {
    next(error);
  }
});

router.post('/:id/test', authenticate, async (req: AuthenticatedRequest, res, next) => {
  try {
    const { message } = req.body;
    
    res.json({
      success: true,
      data: {
        testResult: {
          message: 'Test message processed',
          response: `Echo: ${message}`,
          agent: req.params.id,
        },
      },
    });
  } catch (error) {
    next(error);
  }
});

export { router };
