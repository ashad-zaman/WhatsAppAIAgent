export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}

export function formatDate(date: Date | string, format: 'short' | 'long' | 'iso' = 'short'): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  
  switch (format) {
    case 'short':
      return d.toLocaleDateString();
    case 'long':
      return d.toLocaleDateString(undefined, { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
    case 'iso':
      return d.toISOString();
    default:
      return d.toLocaleDateString();
  }
}

export function formatTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleTimeString(undefined, { 
    hour: '2-digit', 
    minute: '2-digit' 
  });
}

export function formatDateTime(date: Date | string): string {
  return `${formatDate(date)} ${formatTime(date)}`;
}

export function truncate(text: string, maxLength: number, suffix: string = '...'): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - suffix.length) + suffix;
}

describe('Utility Functions', () => {
  describe('cn (classname utility)', () => {
    it('should combine class names', () => {
      expect(cn('foo', 'bar')).toBe('foo bar');
    });

    it('should filter out falsy values', () => {
      expect(cn('foo', undefined, 'bar', null, false)).toBe('foo bar');
    });

    it('should handle empty input', () => {
      expect(cn()).toBe('');
    });
  });

  describe('formatDate', () => {
    it('should format date in short format', () => {
      const date = new Date('2024-01-15T12:00:00Z');
      expect(formatDate(date, 'short')).toBeDefined();
    });

    it('should format date in long format', () => {
      const date = new Date('2024-01-15T12:00:00Z');
      expect(formatDate(date, 'long')).toContain('January');
    });

    it('should format date in ISO format', () => {
      const date = new Date('2024-01-15T12:00:00Z');
      expect(formatDate(date, 'iso')).toBe('2024-01-15T12:00:00.000Z');
    });

    it('should handle string dates', () => {
      const result = formatDate('2024-01-15');
      expect(result).toBeDefined();
    });
  });

  describe('formatTime', () => {
    it('should format time correctly', () => {
      const date = new Date('2024-01-15T14:30:00Z');
      const result = formatTime(date);
      expect(result).toContain(':');
    });
  });

  describe('formatDateTime', () => {
    it('should combine date and time', () => {
      const date = new Date('2024-01-15T14:30:00Z');
      const result = formatDateTime(date);
      expect(result).toContain(':');
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
});
