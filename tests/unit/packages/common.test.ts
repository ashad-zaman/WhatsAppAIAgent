import {
  generateId,
  generateApiKey,
  hashPassword,
  verifyPassword,
  generateToken,
  verifyToken,
  slugify,
  truncate,
  maskEmail,
  maskPhone,
  parseTimezone,
  formatDate,
  addDays,
  addHours,
  startOfDay,
  endOfDay,
  getNextOccurrence,
  chunk,
  sleep,
  retry,
  pick,
  omit,
  deepMerge,
  sanitizeHtml,
  parsePhoneNumber,
  isValidEmail,
  isValidUrl,
  calculateTokens,
  formatBytes,
} from '@whatsapp-ai/common';

import { AppError } from '@whatsapp-ai/common';

jest.mock('@whatsapp-ai/common', () => ({
  ...jest.requireActual('@whatsapp-ai/common'),
  AppError: jest.requireActual('@whatsapp-ai/common').AppError,
}));

describe('Common Utilities', () => {
  describe('generateId', () => {
    it('should generate a valid UUID', () => {
      const id = generateId();
      expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
    });

    it('should generate unique IDs', () => {
      const ids = new Set(Array.from({ length: 100 }, () => generateId()));
      expect(ids.size).toBe(100);
    });
  });

  describe('generateApiKey', () => {
    it('should generate API key with correct prefix', () => {
      const key = generateApiKey();
      expect(key).toMatch(/^wa_[a-f0-9]{64}$/);
    });
  });

  describe('hashPassword and verifyPassword', () => {
    it('should hash and verify password correctly', () => {
      const password = 'testPassword123';
      const { hash, salt } = hashPassword(password);
      
      expect(hash).toBeDefined();
      expect(salt).toBeDefined();
      expect(verifyPassword(password, hash, salt)).toBe(true);
      expect(verifyPassword('wrongPassword', hash, salt)).toBe(false);
    });

    it('should use provided salt', () => {
      const password = 'testPassword123';
      const salt = 'fixed-salt-value';
      const { hash } = hashPassword(password, salt);
      
      const { hash: hash2 } = hashPassword(password, salt);
      expect(hash).toBe(hash2);
    });
  });

  describe('generateToken and verifyToken', () => {
    const secret = 'test-secret-key';
    
    it('should generate and verify valid token', () => {
      const payload = { userId: '123', role: 'admin' };
      const token = generateToken(payload, secret);
      
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3);
      
      const result = verifyToken(token, secret);
      expect(result.valid).toBe(true);
      expect(result.payload).toEqual(payload);
    });

    it('should reject invalid token', () => {
      const result = verifyToken('invalid.token.here', secret);
      expect(result.valid).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should reject token with wrong secret', () => {
      const token = generateToken({ userId: '123' }, secret);
      const result = verifyToken(token, 'wrong-secret');
      expect(result.valid).toBe(false);
    });
  });

  describe('slugify', () => {
    it('should convert text to slug', () => {
      expect(slugify('Hello World')).toBe('hello-world');
      expect(slugify('This is a TEST')).toBe('this-is-a-test');
      expect(slugify('special!@#$chars')).toBe('specialchars');
    });

    it('should handle multiple separators', () => {
      expect(slugify('foo  bar')).toBe('foo-bar');
      expect(slugify('foo--bar')).toBe('foo-bar');
    });

    it('should trim whitespace', () => {
      expect(slugify('  hello  ')).toBe('hello');
    });
  });

  describe('truncate', () => {
    it('should truncate long text', () => {
      expect(truncate('This is a very long text', 10)).toBe('This is...');
    });

    it('should not truncate short text', () => {
      expect(truncate('Short', 10)).toBe('Short');
    });

    it('should use custom suffix', () => {
      const result = truncate('This is a very long text', 10, '>>>');
      expect(result.length).toBe(10);
      expect(result.endsWith('>>>')).toBe(true);
    });
  });

  describe('maskEmail', () => {
    it('should mask email address', () => {
      const result = maskEmail('test@example.com');
      expect(result).toBe('te***t@example.com');
    });

    it('should handle short local parts', () => {
      expect(maskEmail('ab@example.com')).toBe('ab***b@example.com');
    });
  });

  describe('maskPhone', () => {
    it('should mask phone number', () => {
      const result = maskPhone('+1234567890');
      expect(result.startsWith('+')).toBe(true);
      expect(result.length).toBeGreaterThan(5);
      expect(result).toContain('*');
    });

    it('should handle short numbers', () => {
      const result = maskPhone('12345');
      expect(result).toContain('*');
    });
  });

  describe('parseTimezone', () => {
    it('should parse timezone', () => {
      const result = parseTimezone('America/New_York');
      expect(result.offset).toBeDefined();
      expect(typeof result.offset).toBe('number');
    });
  });

  describe('formatDate', () => {
    it('should format date in different formats', () => {
      const date = new Date('2024-01-15T12:30:00Z');
      expect(formatDate(date, 'ISO')).toBe('2024-01-15T12:30:00.000Z');
    });
  });

  describe('addDays', () => {
    it('should add days to date', () => {
      const date = new Date('2024-01-15');
      const result = addDays(date, 5);
      expect(result.getDate()).toBe(20);
    });
  });

  describe('addHours', () => {
    it('should add hours to date', () => {
      const date = new Date('2024-01-15T10:00:00Z');
      const result = addHours(date, 5);
      const hoursDiff = (result.getTime() - date.getTime()) / (1000 * 60 * 60);
      expect(hoursDiff).toBe(5);
    });
  });

  describe('startOfDay', () => {
    it('should set time to start of day', () => {
      const date = new Date('2024-01-15T15:30:00');
      const result = startOfDay(date);
      expect(result.getHours()).toBe(0);
      expect(result.getMinutes()).toBe(0);
    });
  });

  describe('endOfDay', () => {
    it('should set time to end of day', () => {
      const date = new Date('2024-01-15T10:00:00');
      const result = endOfDay(date);
      expect(result.getHours()).toBe(23);
      expect(result.getMinutes()).toBe(59);
    });
  });

  describe('getNextOccurrence', () => {
    it('should calculate next daily occurrence', () => {
      const date = new Date('2024-01-15');
      const result = getNextOccurrence(date, 'daily');
      expect(result.getDate()).toBe(16);
    });

    it('should calculate next weekly occurrence', () => {
      const date = new Date('2024-01-15');
      const result = getNextOccurrence(date, 'weekly');
      expect(result.getDate()).toBe(22);
    });
  });

  describe('chunk', () => {
    it('should split array into chunks', () => {
      const result = chunk([1, 2, 3, 4, 5], 2);
      expect(result).toEqual([[1, 2], [3, 4], [5]]);
    });
  });

  describe('sleep', () => {
    it('should delay execution', async () => {
      const start = Date.now();
      await sleep(50);
      const elapsed = Date.now() - start;
      expect(elapsed).toBeGreaterThanOrEqual(40);
    }, 5000);
  });

  describe('retry', () => {
    it('should retry failed operations', async () => {
      let attempts = 0;
      const fn = async () => {
        attempts++;
        if (attempts < 3) throw new Error('Fail');
        return 'success';
      };

      const result = await retry(fn, { maxRetries: 3, delay: 10 });
      expect(result).toBe('success');
      expect(attempts).toBe(3);
    });

    it('should throw after max attempts', async () => {
      const fn = async () => { throw new Error('Always fails'); };

      await expect(
        retry(fn, { maxRetries: 1, delay: 10 })
      ).rejects.toThrow('Always fails');
    });
  });

  describe('pick', () => {
    it('should pick specified keys', () => {
      const obj = { a: 1, b: 2, c: 3 };
      const result = pick(obj, ['a', 'c']);
      expect(result).toEqual({ a: 1, c: 3 });
    });
  });

  describe('omit', () => {
    it('should omit specified keys', () => {
      const obj = { a: 1, b: 2, c: 3 };
      const result = omit(obj, ['b']);
      expect(result).toEqual({ a: 1, c: 3 });
    });
  });

  describe('deepMerge', () => {
    it('should deep merge objects', () => {
      const target = { a: 1, b: { c: 2 } };
      const source = { b: { d: 3 }, e: 4 };
      const result = deepMerge(target, source);
      expect(result).toEqual({ a: 1, b: { c: 2, d: 3 }, e: 4 });
    });
  });

  describe('sanitizeHtml', () => {
    it('should sanitize HTML', () => {
      expect(sanitizeHtml('<script>alert("xss")</script>')).toBe(
        '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;'
      );
    });
  });

  describe('parsePhoneNumber', () => {
    it('should parse phone number', () => {
      expect(parsePhoneNumber('2345678900', '+1')).toBe('+12345678900');
      expect(parsePhoneNumber('+1234567890')).toBe('+1234567890');
    });
  });

  describe('isValidEmail', () => {
    it('should validate correct emails', () => {
      expect(isValidEmail('test@example.com')).toBe(true);
      expect(isValidEmail('user.name@domain.co.uk')).toBe(true);
    });

    it('should reject invalid emails', () => {
      expect(isValidEmail('invalid')).toBe(false);
      expect(isValidEmail('test@')).toBe(false);
      expect(isValidEmail('@domain.com')).toBe(false);
    });
  });

  describe('isValidUrl', () => {
    it('should validate correct URLs', () => {
      expect(isValidUrl('https://example.com')).toBe(true);
      expect(isValidUrl('http://test.org/path')).toBe(true);
    });

    it('should reject invalid URLs', () => {
      expect(isValidUrl('not-a-url')).toBe(false);
    });
  });

  describe('calculateTokens', () => {
    it('should calculate tokens approximately', () => {
      expect(calculateTokens('hello')).toBe(2);
      expect(calculateTokens('hello world')).toBe(3);
    });
  });

  describe('formatBytes', () => {
    it('should format bytes correctly', () => {
      expect(formatBytes(0)).toBe('0 Bytes');
      expect(formatBytes(1024)).toBe('1 KB');
      expect(formatBytes(1048576)).toBe('1 MB');
    });
  });

  describe('AppError', () => {
    it('should create error with correct properties', () => {
      const error = new AppError('Test error', 400, 'TEST_ERROR');
      
      expect(error.message).toBe('Test error');
      expect(error.statusCode).toBe(400);
      expect(error.code).toBe('TEST_ERROR');
      expect(error.isOperational).toBe(true);
    });

    it('should serialize to JSON', () => {
      const error = new AppError('Test error', 400, 'TEST_ERROR');
      const json = error.toJSON();
      
      expect(json.message).toBe('Test error');
      expect(json.statusCode).toBe(400);
    });

    it('should default code to ERROR', () => {
      const error = new AppError('Test error', 500);
      expect(error.code).toBe('INTERNAL_ERROR');
    });
  });
});
