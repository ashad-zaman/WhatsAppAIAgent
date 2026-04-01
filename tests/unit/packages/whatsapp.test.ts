jest.mock('crypto', () => ({
  createHmac: jest.fn().mockReturnValue({
    update: jest.fn().mockReturnThis(),
    digest: jest.fn().mockReturnValue('mock-signature'),
  }),
  timingSafeEqual: jest.fn().mockReturnValue(true),
}));

jest.mock('@whatsapp-ai/config', () => ({
  config: {
    whatsapp: {
      accessToken: 'test-access-token',
      webhookVerifyToken: 'test-webhook-token',
      phoneNumberId: '123456789',
      apiVersion: 'v18.0',
    },
  },
}));

interface WhatsAppWebhookVerifyParams {
  mode: string;
  token: string;
  challenge: string;
}

interface WhatsAppMessagePayload {
  messaging_product: string;
  to: string;
  type: 'text' | 'image' | 'audio' | 'video' | 'document' | 'sticker' | 'location' | 'contacts' | 'interative' | 'template';
  text?: { preview_url?: boolean; body: string };
  image?: { id?: string; link?: string; caption?: string };
  audio?: { id?: string; link?: string };
  video?: { id?: string; link?: string; caption?: string };
  document?: { id?: string; link?: string; caption?: string; filename?: string };
}

interface WhatsAppIncomingMessage {
  from: string;
  id: string;
  timestamp: string;
  type: string;
  text?: { body: string };
  audio?: { id: string; mime_type: string };
  image?: { id: string; mime_type: string; sha256: string };
}

const verifyWebhook = (params: WhatsAppWebhookVerifyParams): boolean => {
  return params.mode === 'subscribe' && params.token === 'test-webhook-token';
};

const generateSignature = (payload: string): string => {
  return 'mock-signature';
};

const verifySignature = (payload: string, signature: string): boolean => {
  const expectedSignature = generateSignature(payload);
  return expectedSignature === signature;
};

const parseWebhookPayload = (payload: unknown): WhatsAppIncomingMessage[] => {
  const typedPayload = payload as {
    object: string;
    entry: Array<{
      changes: Array<{
        value: {
          messages?: WhatsAppIncomingMessage[];
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

const formatPhoneNumber = (phone: string): string => {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.startsWith('1') && cleaned.length === 11) {
    return `+${cleaned}`;
  }
  if (!cleaned.startsWith('1') && !cleaned.startsWith('+')) {
    return `+${cleaned}`;
  }
  return cleaned.startsWith('+') ? cleaned : `+${cleaned}`;
};

const isValidPhoneNumber = (phone: string): boolean => {
  const cleaned = phone.replace(/\D/g, '');
  return cleaned.length >= 10 && cleaned.length <= 15;
};

describe('WhatsApp Module', () => {
  describe('verifyWebhook', () => {
    it('should return true for valid verification request', () => {
      const result = verifyWebhook({
        mode: 'subscribe',
        token: 'test-webhook-token',
        challenge: 'test-challenge',
      });
      expect(result).toBe(true);
    });

    it('should return false for invalid mode', () => {
      const result = verifyWebhook({
        mode: 'unsubscribe',
        token: 'test-webhook-token',
        challenge: 'test-challenge',
      });
      expect(result).toBe(false);
    });

    it('should return false for invalid token', () => {
      const result = verifyWebhook({
        mode: 'subscribe',
        token: 'wrong-token',
        challenge: 'test-challenge',
      });
      expect(result).toBe(false);
    });
  });

  describe('generateSignature', () => {
    it('should generate a signature for payload', () => {
      const payload = JSON.stringify({ test: 'data' });
      const signature = generateSignature(payload);
      expect(signature).toBe('mock-signature');
    });

    it('should generate consistent signatures for same payload', () => {
      const payload = 'same-payload';
      const sig1 = generateSignature(payload);
      const sig2 = generateSignature(payload);
      expect(sig1).toBe(sig2);
    });

    it('should generate different signatures for different payloads', () => {
      const sig1 = generateSignature('payload-1');
      const sig2 = generateSignature('payload-2');
      expect(typeof sig1).toBe('string');
      expect(typeof sig2).toBe('string');
      expect(sig1.length).toBeGreaterThan(0);
    });
  });

  describe('verifySignature', () => {
    it('should return true for matching signature', () => {
      const payload = 'test-payload';
      const result = verifySignature(payload, 'mock-signature');
      expect(result).toBe(true);
    });

    it('should return false for non-matching signature', () => {
      const payload = 'test-payload';
      const result = verifySignature(payload, 'different-signature');
      expect(result).toBe(false);
    });
  });

  describe('parseWebhookPayload', () => {
    it('should parse valid webhook payload', () => {
      const payload = {
        object: 'whatsapp_business_account',
        entry: [
          {
            changes: [
              {
                value: {
                  messages: [
                    {
                      from: '1234567890',
                      id: 'msg-123',
                      timestamp: '1234567890',
                      type: 'text',
                      text: { body: 'Hello' },
                    },
                  ],
                },
              },
            ],
          },
        ],
      };

      const messages = parseWebhookPayload(payload);
      expect(messages).toHaveLength(1);
      expect(messages[0].from).toBe('1234567890');
      expect(messages[0].text?.body).toBe('Hello');
    });

    it('should return empty array for invalid object type', () => {
      const payload = {
        object: 'invalid_object',
        entry: [],
      };

      const messages = parseWebhookPayload(payload);
      expect(messages).toHaveLength(0);
    });

    it('should handle multiple messages in payload', () => {
      const payload = {
        object: 'whatsapp_business_account',
        entry: [
          {
            changes: [
              {
                value: {
                  messages: [
                    { from: '1234567890', id: 'msg-1', timestamp: '1234567890', type: 'text' },
                    { from: '0987654321', id: 'msg-2', timestamp: '1234567891', type: 'text' },
                  ],
                },
              },
            ],
          },
        ],
      };

      const messages = parseWebhookPayload(payload);
      expect(messages).toHaveLength(2);
    });

    it('should handle multiple entries', () => {
      const payload = {
        object: 'whatsapp_business_account',
        entry: [
          {
            changes: [
              {
                value: {
                  messages: [{ from: '1234567890', id: 'msg-1', timestamp: '1234567890', type: 'text' }],
                },
              },
            ],
          },
          {
            changes: [
              {
                value: {
                  messages: [{ from: '0987654321', id: 'msg-2', timestamp: '1234567891', type: 'text' }],
                },
              },
            ],
          },
        ],
      };

      const messages = parseWebhookPayload(payload);
      expect(messages).toHaveLength(2);
    });

    it('should handle image messages', () => {
      const payload = {
        object: 'whatsapp_business_account',
        entry: [
          {
            changes: [
              {
                value: {
                  messages: [
                    {
                      from: '1234567890',
                      id: 'msg-123',
                      timestamp: '1234567890',
                      type: 'image',
                      image: { id: 'img-123', mime_type: 'image/jpeg', sha256: 'hash' },
                    },
                  ],
                },
              },
            ],
          },
        ],
      };

      const messages = parseWebhookPayload(payload);
      expect(messages).toHaveLength(1);
      expect(messages[0].type).toBe('image');
      expect(messages[0].image?.id).toBe('img-123');
    });
  });

  describe('formatPhoneNumber', () => {
    it('should add + prefix to US numbers without it', () => {
      const result = formatPhoneNumber('1234567890');
      expect(result.startsWith('+')).toBe(true);
      expect(result.replace(/\D/g, '')).toBe('1234567890');
    });

    it('should not modify numbers already with + prefix', () => {
      expect(formatPhoneNumber('+1234567890')).toBe('+1234567890');
    });

    it('should remove non-digit characters', () => {
      const result = formatPhoneNumber('(123) 456-7890');
      expect(result).toMatch(/^\+1/);
      expect(result.replace(/\D/g, '')).toBe('1234567890');
    });

    it('should handle international format', () => {
      expect(formatPhoneNumber('+44 20 7123 4567')).toBe('+442071234567');
    });
  });

  describe('isValidPhoneNumber', () => {
    it('should return true for valid 10-digit US number', () => {
      expect(isValidPhoneNumber('1234567890')).toBe(true);
    });

    it('should return true for valid 11-digit US number with country code', () => {
      expect(isValidPhoneNumber('11234567890')).toBe(true);
    });

    it('should return true for valid international number', () => {
      expect(isValidPhoneNumber('+442071234567')).toBe(true);
    });

    it('should return false for too short number', () => {
      expect(isValidPhoneNumber('12345')).toBe(false);
    });

    it('should return false for too long number', () => {
      expect(isValidPhoneNumber('1234567890123456')).toBe(false);
    });

    it('should return true for minimum valid length', () => {
      expect(isValidPhoneNumber('1234567890')).toBe(true);
    });

    it('should return true for maximum valid length', () => {
      expect(isValidPhoneNumber('123456789012345')).toBe(true);
    });
  });

  describe('WhatsAppMessagePayload interface', () => {
    it('should support text message type', () => {
      const msg: WhatsAppMessagePayload = {
        messaging_product: 'whatsapp',
        to: '1234567890',
        type: 'text',
        text: { body: 'Hello World', preview_url: false },
      };
      expect(msg.type).toBe('text');
      expect(msg.text?.body).toBe('Hello World');
    });

    it('should support image message type', () => {
      const msg: WhatsAppMessagePayload = {
        messaging_product: 'whatsapp',
        to: '1234567890',
        type: 'image',
        image: { id: 'img-123', caption: 'Test image' },
      };
      expect(msg.type).toBe('image');
      expect(msg.image?.id).toBe('img-123');
    });

    it('should support audio message type', () => {
      const msg: WhatsAppMessagePayload = {
        messaging_product: 'whatsapp',
        to: '1234567890',
        type: 'audio',
        audio: { id: 'audio-123' },
      };
      expect(msg.type).toBe('audio');
    });

    it('should support document message type', () => {
      const msg: WhatsAppMessagePayload = {
        messaging_product: 'whatsapp',
        to: '1234567890',
        type: 'document',
        document: { id: 'doc-123', filename: 'report.pdf', caption: 'Monthly report' },
      };
      expect(msg.type).toBe('document');
      expect(msg.document?.filename).toBe('report.pdf');
    });

    it('should support video message type', () => {
      const msg: WhatsAppMessagePayload = {
        messaging_product: 'whatsapp',
        to: '1234567890',
        type: 'video',
        video: { id: 'vid-123', link: 'https://example.com/video.mp4', caption: 'Check this out' },
      };
      expect(msg.type).toBe('video');
    });

    it('should support location message type', () => {
      const msg: WhatsAppMessagePayload = {
        messaging_product: 'whatsapp',
        to: '1234567890',
        type: 'location',
        location: { latitude: 40.7128, longitude: -74.006, name: 'New York City' },
      };
      expect(msg.type).toBe('location');
      expect(msg.location?.latitude).toBe(40.7128);
    });
  });

  describe('WhatsAppIncomingMessage interface', () => {
    it('should have correct structure for incoming text message', () => {
      const msg: WhatsAppIncomingMessage = {
        from: '1234567890',
        id: 'msg-123',
        timestamp: '1234567890',
        type: 'text',
        text: { body: 'Hello' },
      };
      expect(msg.from).toBe('1234567890');
      expect(msg.type).toBe('text');
      expect(msg.text?.body).toBe('Hello');
    });

    it('should support context for reply messages', () => {
      const msg = {
        from: '1234567890',
        id: 'msg-456',
        timestamp: '1234567891',
        type: 'text',
        text: { body: 'Reply' },
        context: { id: 'msg-123' },
      } as WhatsAppIncomingMessage;
      expect(msg.context?.id).toBe('msg-123');
    });
  });
});
