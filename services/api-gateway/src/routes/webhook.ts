import { Router, Request, Response } from 'express';
import { config } from '@whatsapp-ai/config';
import { verifyWebhook, parseWebhookPayload, whatsappApi } from '@whatsapp-ai/whatsapp';
import { eventBus } from '@whatsapp-ai/events';
import { prisma } from '@whatsapp-ai/database';
import { generateId } from '@whatsapp-ai/common';

const router = Router();

router.get('/whatsapp', (req: Request, res: Response) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (verifyWebhook({ mode: mode as string, token: token as string, challenge: challenge as string })) {
    console.log('Webhook verified');
    res.status(200).send(challenge);
  } else {
    console.log('Webhook verification failed');
    res.status(403).send('Forbidden');
  }
});

router.post('/whatsapp', async (req: Request, res: Response) => {
  try {
    const signature = req.headers['x-hub-signature-256'] as string;
    
    const body = req.body;
    const messages = parseWebhookPayload(body);

    for (const message of messages) {
      const userPhone = message.from;
      
      let user = await prisma.user.findFirst({
        where: { phone: userPhone },
      });

      if (!user) {
        user = await prisma.user.create({
          data: {
            email: `${userPhone}@whatsapp.local`,
            phone: userPhone,
            fullName: 'WhatsApp User',
            isPhoneVerified: true,
          },
        });
      }

      let session = await prisma.session.findFirst({
        where: {
          userId: user.id,
          channel: 'WHATSAPP',
          expiresAt: { gt: new Date() },
        },
        orderBy: { updatedAt: 'desc' },
      });

      if (!session) {
        session = await prisma.session.create({
          data: {
            id: generateId(),
            userId: user.id,
            channel: 'WHATSAPP',
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          },
        });
      }

      const dbMessage = await prisma.message.create({
        data: {
          id: generateId(),
          sessionId: session.id,
          userId: user.id,
          direction: 'INBOUND',
          channel: 'WHATSAPP',
          messageType: message.type.toUpperCase() as 'TEXT' | 'VOICE' | 'DOCUMENT' | 'IMAGE',
          content: {
            text: message.text?.body || '',
            mediaUrl: '',
            mediaType: '',
          },
          metadata: {
            whatsappMessageId: message.id,
          },
          context: {
            sessionId: session.id,
            turnCount: 1,
          },
        },
      });

      await eventBus.publishMessageInbound({
        messageId: dbMessage.id,
        userId: user.id,
        conversationId: session.id,
        content: message.text?.body || `[${message.type} message]`,
        messageType: message.type,
      });

      await whatsappApi.markAsRead(message.id);
    }

    res.status(200).json({ status: 'ok' });
  } catch (error) {
    console.error('Webhook processing error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/stripe', async (req: Request, res: Response) => {
  try {
    const sig = req.headers['stripe-signature'] as string;
    const event = req.body;

    switch (event.type) {
      case 'checkout.session.completed':
        console.log('Checkout completed:', event.data.object);
        break;
      case 'customer.subscription.updated':
        console.log('Subscription updated:', event.data.object);
        break;
      case 'customer.subscription.deleted':
        console.log('Subscription deleted:', event.data.object);
        break;
      case 'invoice.payment_succeeded':
        console.log('Invoice paid:', event.data.object);
        break;
      case 'invoice.payment_failed':
        console.log('Invoice payment failed:', event.data.object);
        break;
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Stripe webhook error:', error);
    res.status(400).json({ error: 'Webhook error' });
  }
});

export { router };
