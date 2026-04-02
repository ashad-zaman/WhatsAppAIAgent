import { Router } from 'express';
import { z } from 'zod';
import { authenticate, AuthenticatedRequest } from '../middleware/auth';

const router = Router();

router.get('/plans', async (req, res, next) => {
  try {
    res.json({
      success: true,
      data: {
        plans: [
          {
            id: 'free',
            name: 'Free',
            price: 0,
            features: ['5 reminders/day', '1 agent', '100 messages/month', 'Basic support'],
          },
          {
            id: 'pro',
            name: 'Pro',
            price: 29,
            features: ['Unlimited reminders', '5 agents', '5000 messages/month', 'Calendar sync', 'Priority support'],
          },
          {
            id: 'enterprise',
            name: 'Enterprise',
            price: 99,
            features: ['Unlimited everything', 'Unlimited agents', 'Custom integrations', 'Dedicated support'],
          },
        ],
      },
    });
  } catch (error) {
    next(error);
  }
});

router.post('/subscribe', authenticate, async (req: AuthenticatedRequest, res, next) => {
  try {
    const { planId } = req.body;
    
    res.json({
      success: true,
      data: {
        subscription: {
          id: 'sub_xxx',
          plan: planId,
          status: 'active',
        },
      },
    });
  } catch (error) {
    next(error);
  }
});

router.get('/subscription', authenticate, async (req: AuthenticatedRequest, res, next) => {
  try {
    res.json({
      success: true,
      data: {
        subscription: {
          plan: 'free',
          status: 'active',
          currentPeriodEnd: new Date().toISOString(),
        },
      },
    });
  } catch (error) {
    next(error);
  }
});

router.post('/cancel', authenticate, async (req: AuthenticatedRequest, res, next) => {
  try {
    res.json({
      success: true,
      data: { message: 'Subscription cancelled' },
    });
  } catch (error) {
    next(error);
  }
});

router.get('/invoices', authenticate, async (req: AuthenticatedRequest, res, next) => {
  try {
    res.json({
      success: true,
      data: { invoices: [] },
    });
  } catch (error) {
    next(error);
  }
});

router.post('/portal', authenticate, async (req: AuthenticatedRequest, res, next) => {
  try {
    res.json({
      success: true,
      data: {
        url: 'https://billing.stripe.com/session/xxx',
      },
    });
  } catch (error) {
    next(error);
  }
});

export { router };
