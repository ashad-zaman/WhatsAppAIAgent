import crypto from 'crypto';
import { config } from '@whatsapp-ai/config';

export interface WhatsAppWebhookVerifyParams {
  mode: string;
  token: string;
  challenge: string;
}

export interface WhatsAppMessagePayload {
  messaging_product: string;
  to: string;
  type: 'text' | 'image' | 'audio' | 'video' | 'document' | 'sticker' | 'location' | 'contacts' | 'interative' | 'template';
  text?: {
    preview_url?: boolean;
    body: string;
  };
  image?: {
    id?: string;
    link?: string;
    caption?: string;
  };
  audio?: {
    id?: string;
    link?: string;
  };
  video?: {
    id?: string;
    link?: string;
    caption?: string;
  };
  document?: {
    id?: string;
    link?: string;
    caption?: string;
    filename?: string;
  };
  sticker?: {
    id: string;
  };
  location?: {
    latitude: number;
    longitude: number;
    name?: string;
    address?: string;
  };
  contacts?: {
    contacts: {
      name: { formatted_name: string };
      phones: { phone: string }[];
    }[];
  };
  interactive?: {
    type: 'button' | 'list' | 'product' | 'product_list';
    header?: { type: 'text' | 'image' | 'video' | 'document'; text?: string };
    body?: { text: string };
    footer?: { text: string };
    action: Record<string, unknown>;
  };
}

export interface WhatsAppIncomingMessage {
  from: string;
  id: string;
  timestamp: string;
  type: string;
  text?: { body: string };
  audio?: { id: string; mime_type: string };
  image?: { id: string; mime_type: string; sha256: string };
  video?: { id: string; mime_type: string; sha256: string };
  document?: { id: string; mime_type: string; filename: string };
  location?: { latitude: number; longitude: number; name?: string };
  context?: { id: string };
}

export const verifyWebhook = (params: WhatsAppWebhookVerifyParams): boolean => {
  return params.mode === 'subscribe' && params.token === config.whatsapp.webhookVerifyToken;
};

export const generateSignature = (payload: string): string => {
  return crypto
    .createHmac('sha256', config.whatsapp.accessToken)
    .update(payload)
    .digest('hex');
};

export const verifySignature = (payload: string, signature: string): boolean => {
  const expectedSignature = generateSignature(payload);
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(`sha256=${expectedSignature}`)
  );
};

export const whatsappApi = {
  baseUrl: `https://graph.facebook.com/${config.whatsapp.apiVersion}/${config.whatsapp.phoneNumberId}`,

  async sendMessage(message: WhatsAppMessagePayload): Promise<{ messaging_product: string; contacts: { wa_id: string }[]; messages: { id: string }[] }> {
    const url = `${this.baseUrl}/messages`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.whatsapp.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        ...message,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`WhatsApp API error: ${JSON.stringify(error)}`);
    }

    return response.json();
  },

  async sendTextMessage(to: string, text: string, options?: { previewUrl?: boolean }): Promise<string> {
    const result = await this.sendMessage({
      to,
      type: 'text',
      text: {
        preview_url: options?.previewUrl,
        body: text,
      },
    });
    return result.messages[0].id;
  },

  async sendImageMessage(to: string, imageIdOrUrl: string, options?: { caption?: string; asLink?: boolean }): Promise<string> {
    const result = await this.sendMessage({
      to,
      type: 'image',
      image: {
        ...(options?.asLink ? { link: imageIdOrUrl } : { id: imageIdOrUrl }),
        caption: options?.caption,
      },
    });
    return result.messages[0].id;
  },

  async sendAudioMessage(to: string, audioIdOrUrl: string, options?: { asLink?: boolean }): Promise<string> {
    const result = await this.sendMessage({
      to,
      type: 'audio',
      audio: options?.asLink ? { link: audioIdOrUrl } : { id: audioIdOrUrl },
    });
    return result.messages[0].id;
  },

  async sendDocumentMessage(to: string, documentIdOrUrl: string, filename: string, options?: { caption?: string; asLink?: boolean }): Promise<string> {
    const result = await this.sendMessage({
      to,
      type: 'document',
      document: {
        ...(options?.asLink ? { link: documentIdOrUrl } : { id: documentIdOrUrl }),
        filename,
        caption: options?.caption,
      },
    });
    return result.messages[0].id;
  },

  async sendTypingIndicator(to: string, isTyping: boolean): Promise<void> {
    await fetch(`${this.baseUrl}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.whatsapp.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to,
        typing_indicator: {
          type: isTyping ? 'typing_on' : 'typing_off',
        },
      }),
    });
  },

  async markAsRead(messageId: string): Promise<void> {
    await fetch(`${this.baseUrl}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.whatsapp.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        status: 'read',
        message_id: messageId,
      }),
    });
  },

  async uploadMedia(mediaUrl: string, mimeType: string): Promise<string> {
    const response = await fetch(mediaUrl);
    const buffer = await response.arrayBuffer();
    const mediaBuffer = Buffer.from(buffer);

    const uploadResponse = await fetch(`${this.baseUrl}/media`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.whatsapp.accessToken}`,
        'Content-Type': mimeType,
      },
      body: mediaBuffer,
    });

    if (!uploadResponse.ok) {
      throw new Error('Failed to upload media to WhatsApp');
    }

    const result = await uploadResponse.json();
    return result.id;
  },

  async downloadMedia(mediaId: string): Promise<ArrayBuffer> {
    const response = await fetch(`${this.baseUrl}/media/${mediaId}`, {
      headers: {
        'Authorization': `Bearer ${config.whatsapp.accessToken}`,
      },
    });

    const mediaUrl = response.headers.get('h');
    if (!mediaUrl) {
      throw new Error('No media URL returned');
    }

    const mediaResponse = await fetch(mediaUrl);
    return mediaResponse.arrayBuffer();
  },

  async getMediaUrl(mediaId: string): Promise<string> {
    const response = await fetch(`${this.baseUrl}/media/${mediaId}`, {
      headers: {
        'Authorization': `Bearer ${config.whatsapp.accessToken}`,
      },
    });

    const result = await response.json();
    return result.url;
  },
};

export const parseWebhookPayload = (payload: unknown): WhatsAppIncomingMessage[] => {
  const typedPayload = payload as {
    object: string;
    entry: Array<{
      changes: Array<{
        value: {
          messages?: WhatsAppIncomingMessage[];
          statuses?: Array<{ id: string; recipient_id: string; status: string }>;
        };
      }>;
    }>;
  };

  if (typedPayload.object !== 'whatsapp_business_account') {
    return [];
  }

  const messages: WhatsAppIncomingMessage[] = [];
  
  for (const entry of typedPayload.entry) {
    for (const change of entry.changes) {
      if (change.value.messages) {
        messages.push(...change.value.messages);
      }
    }
  }

  return messages;
};

export const formatPhoneNumber = (phone: string): string => {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.startsWith('1') && cleaned.length === 11) {
    return `+${cleaned}`;
  }
  if (!cleaned.startsWith('1') && !cleaned.startsWith('+')) {
    return `+${cleaned}`;
  }
  return cleaned.startsWith('+') ? cleaned : `+${cleaned}`;
};

export const isValidPhoneNumber = (phone: string): boolean => {
  const cleaned = phone.replace(/\D/g, '');
  return cleaned.length >= 10 && cleaned.length <= 15;
};

export default {
  verifyWebhook,
  generateSignature,
  verifySignature,
  api: whatsappApi,
  parseWebhookPayload,
  formatPhoneNumber,
  isValidPhoneNumber,
};
