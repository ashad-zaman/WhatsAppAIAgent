import { prisma, collections } from '@whatsapp-ai/database';
import { whatsappApi } from '@whatsapp-ai/whatsapp';
import { eventBus, TOPICS } from '@whatsapp-ai/events';
import { queueService, MessageJob } from '@whatsapp-ai/queue';
import { embeddingService } from '@whatsapp-ai/ai';
import { generateId } from '@whatsapp-ai/common';

export interface ProcessMessageParams {
  userId: string;
  conversationId: string;
  messageId: string;
  content: string;
  messageType: 'text' | 'voice' | 'document';
  metadata?: Record<string, unknown>;
}

export const processInboundMessage = async (params: ProcessMessageParams): Promise<void> => {
  const { userId, conversationId, messageId, content, messageType, metadata } = params;

  const session = await prisma.session.findFirst({
    where: {
      userId,
      channel: 'WHATSAPP',
      expiresAt: { gt: new Date() },
    },
    orderBy: { updatedAt: 'desc' },
  });

  if (!session) {
    throw new Error('No active session found');
  }

  await prisma.message.create({
    data: {
      id: messageId,
      sessionId: session.id,
      userId,
      direction: 'INBOUND',
      channel: 'WHATSAPP',
      messageType: messageType.toUpperCase() as 'TEXT' | 'VOICE' | 'DOCUMENT',
      content: {
        text: content,
        ...(metadata || {}),
      },
      metadata: {
        whatsappMessageId: metadata?.whatsappMessageId,
      },
      context: {
        sessionId: session.id,
        turnCount: (session.context as { turnCount?: number }).turnCount || 1,
      },
    },
  });

  await eventBus.publishMessageInbound({
    messageId,
    userId,
    conversationId,
    content,
    messageType,
  });
};

export const sendOutboundMessage = async (params: {
  userId: string;
  conversationId: string;
  content: string;
  messageType?: 'text' | 'image' | 'audio' | 'document';
  mediaUrl?: string;
  options?: {
    typingIndicator?: boolean;
    replyTo?: string;
  };
}): Promise<string> => {
  const user = await prisma.user.findUnique({
    where: { id: params.userId },
    select: { phone: true },
  });

  if (!user?.phone) {
    throw new Error('User phone number not found');
  }

  const phone = user.phone.startsWith('+') ? user.phone : `+${user.phone}`;
  let messageId: string;

  switch (params.messageType) {
    case 'image':
      messageId = await whatsappApi.sendImageMessage(phone, params.mediaUrl || '', {
        caption: params.content,
      });
      break;
    case 'audio':
      messageId = await whatsappApi.sendAudioMessage(phone, params.mediaUrl || '');
      break;
    case 'document':
      messageId = await whatsappApi.sendDocumentMessage(phone, params.mediaUrl || '', params.content);
      break;
    default:
      messageId = await whatsappApi.sendTextMessage(phone, params.content, {
        previewUrl: params.content.includes('http'),
      });
  }

  const session = await prisma.session.findFirst({
    where: {
      userId: params.userId,
      channel: 'WHATSAPP',
    },
    orderBy: { updatedAt: 'desc' },
  });

  if (session) {
    await prisma.message.create({
      data: {
        id: generateId(),
        sessionId: session.id,
        userId: params.userId,
        direction: 'OUTBOUND',
        channel: 'WHATSAPP',
        messageType: (params.messageType || 'text').toUpperCase() as 'TEXT' | 'IMAGE' | 'AUDIO' | 'DOCUMENT',
        content: {
          text: params.content,
          mediaUrl: params.mediaUrl,
        },
        metadata: {
          whatsappMessageId: messageId,
        },
        context: {
          sessionId: session.id,
          turnCount: ((session.context as { turnCount?: number })?.turnCount || 1) + 1,
          replyTo: params.options?.replyTo,
        },
      },
    });
  }

  await eventBus.publishMessageOutbound({
    messageId,
    userId: params.userId,
    conversationId: params.conversationId,
    content: params.content,
    messageType: params.messageType || 'text',
  });

  return messageId;
};

export const processVoiceMessage = async (params: {
  messageId: string;
  userId: string;
  audioUrl: string;
}): Promise<string> => {
  await queueService.addVoice({
    jobId: generateId(),
    userId: params.userId,
    messageId: params.messageId,
    audioUrl: params.audioUrl,
    action: 'transcribe',
  });

  return 'Voice message queued for transcription';
};

export const getConversationHistory = async (
  userId: string,
  options?: {
    limit?: number;
    before?: string;
    messageType?: string;
  }
): Promise<{
  messages: Array<{
    id: string;
    content: string;
    direction: string;
    createdAt: Date;
  }>;
  hasMore: boolean;
}> => {
  const session = await prisma.session.findFirst({
    where: {
      userId,
      channel: 'WHATSAPP',
    },
    orderBy: { updatedAt: 'desc' },
  });

  if (!session) {
    return { messages: [], hasMore: false };
  }

  const messages = await prisma.message.findMany({
    where: {
      sessionId: session.id,
      ...(options?.before && { createdAt: { lt: new Date(options.before) } }),
    },
    orderBy: { createdAt: 'desc' },
    take: (options?.limit || 50) + 1,
  });

  const hasMore = messages.length > (options?.limit || 50);
  const results = hasMore ? messages.slice(0, -1) : messages;

  return {
    messages: results.map((m) => ({
      id: m.id,
      content: (m.content as { text?: string }).text || '',
      direction: m.direction,
      createdAt: m.createdAt,
    })),
    hasMore,
  };
};

export const startTypingIndicator = async (userId: string): Promise<void> => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { phone: true },
  });

  if (user?.phone) {
    await whatsappApi.sendTypingIndicator(user.phone, true);
  }
};

export const stopTypingIndicator = async (userId: string): Promise<void> => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { phone: true },
  });

  if (user?.phone) {
    await whatsappApi.sendTypingIndicator(user.phone, false);
  }
};

export const markMessageAsRead = async (whatsappMessageId: string): Promise<void> => {
  await whatsappApi.markAsRead(whatsappMessageId);
};

export default {
  processInboundMessage,
  sendOutboundMessage,
  processVoiceMessage,
  getConversationHistory,
  startTypingIndicator,
  stopTypingIndicator,
  markMessageAsRead,
};
