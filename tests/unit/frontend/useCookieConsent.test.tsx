interface CookieConsent {
  essential: boolean;
  functional: boolean;
  analytics: boolean;
  marketing: boolean;
}

interface CookiePreferences extends CookieConsent {
  timestamp: string;
  version: string;
}

const COOKIE_CONSENT_KEY = 'cookie_consent';
const CONSENT_VERSION = '1.0';

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    localStorage: {
      getItem: (key: string) => string | null;
      setItem: (key: string, value: string) => void;
      removeItem: (key: string) => void;
    };
  }
}

export function getStoredConsent(): CookiePreferences | null {
  if (typeof window === 'undefined') return null;
  
  try {
    const stored = window.localStorage.getItem(COOKIE_CONSENT_KEY);
    if (!stored) return null;
    
    const parsed = JSON.parse(stored) as CookiePreferences;
    if (parsed.version !== CONSENT_VERSION) {
      window.localStorage.removeItem(COOKIE_CONSENT_KEY);
      return null;
    }
    
    return parsed;
  } catch {
    return null;
  }
}

export function saveConsent(consent: CookieConsent): void {
  if (typeof window === 'undefined') return;
  
  const preferences: CookiePreferences = {
    ...consent,
    timestamp: new Date().toISOString(),
    version: CONSENT_VERSION,
  };
  
  window.localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify(preferences));
  
  if (window.gtag) {
    window.gtag('consent', 'update', {
      analytics_storage: consent.analytics ? 'granted' : 'denied',
      ad_storage: consent.marketing ? 'granted' : 'denied',
      functionality_storage: consent.functional ? 'granted' : 'denied',
      personalization_storage: consent.marketing ? 'granted' : 'denied',
    });
  }
}

export function createCookieConsentState() {
  return {
    consent: {
      essential: true,
      functional: false,
      analytics: false,
      marketing: false,
    } as CookieConsent,
    showBanner: true,
    isLoading: true,
  };
}

export function acceptAllConsent(): CookieConsent {
  return {
    essential: true,
    functional: true,
    analytics: true,
    marketing: true,
  };
}

export function rejectAllConsent(): CookieConsent {
  return {
    essential: true,
    functional: false,
    analytics: false,
    marketing: false,
  };
}

export function hasConsented(consent: CookieConsent): boolean {
  return consent.functional || consent.analytics || consent.marketing;
}

describe('Cookie Consent Utilities', () => {
  describe('getStoredConsent', () => {
    it('should return null when localStorage is empty', () => {
      const mockLocalStorage = {
        getItem: jest.fn().mockReturnValue(null),
        setItem: jest.fn(),
        removeItem: jest.fn(),
      };
      Object.defineProperty(window, 'localStorage', { value: mockLocalStorage });
      
      const result = getStoredConsent();
      
      expect(result).toBeNull();
      expect(mockLocalStorage.getItem).toHaveBeenCalledWith(COOKIE_CONSENT_KEY);
    });

    it('should return parsed consent when valid', () => {
      const storedConsent = {
        consent: { essential: true, functional: true, analytics: false, marketing: false },
        timestamp: '2024-01-01T00:00:00.000Z',
        version: '1.0',
      };
      
      const mockLocalStorage = {
        getItem: jest.fn().mockReturnValue(JSON.stringify(storedConsent)),
        setItem: jest.fn(),
        removeItem: jest.fn(),
      };
      Object.defineProperty(window, 'localStorage', { value: mockLocalStorage });
      
      const result = getStoredConsent();
      
      expect(result).toEqual(storedConsent);
    });

    it('should clear storage and return null for outdated version', () => {
      const mockLocalStorage = {
        getItem: jest.fn().mockReturnValue(JSON.stringify({
          consent: { essential: true, functional: true, analytics: false, marketing: false },
          timestamp: '2024-01-01T00:00:00.000Z',
          version: '0.9',
        })),
        setItem: jest.fn(),
        removeItem: jest.fn(),
      };
      Object.defineProperty(window, 'localStorage', { value: mockLocalStorage });
      
      const result = getStoredConsent();
      
      expect(result).toBeNull();
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith(COOKIE_CONSENT_KEY);
    });

    it('should return null for corrupted JSON', () => {
      const mockLocalStorage = {
        getItem: jest.fn().mockReturnValue('invalid json'),
        setItem: jest.fn(),
        removeItem: jest.fn(),
      };
      Object.defineProperty(window, 'localStorage', { value: mockLocalStorage });
      
      const result = getStoredConsent();
      
      expect(result).toBeNull();
    });
  });

  describe('saveConsent', () => {
    it('should save consent to localStorage', () => {
      const mockLocalStorage = {
        getItem: jest.fn(),
        setItem: jest.fn(),
        removeItem: jest.fn(),
      };
      Object.defineProperty(window, 'localStorage', { value: mockLocalStorage });
      
      const consent: CookieConsent = {
        essential: true,
        functional: true,
        analytics: false,
        marketing: false,
      };
      
      saveConsent(consent);
      
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        COOKIE_CONSENT_KEY,
        expect.stringContaining('"functional":true')
      );
    });

    it('should include timestamp and version', () => {
      const mockLocalStorage = {
        getItem: jest.fn(),
        setItem: jest.fn(),
        removeItem: jest.fn(),
      };
      Object.defineProperty(window, 'localStorage', { value: mockLocalStorage });
      
      const consent: CookieConsent = {
        essential: true,
        functional: true,
        analytics: true,
        marketing: true,
      };
      
      saveConsent(consent);
      
      const savedData = JSON.parse(mockLocalStorage.setItem.mock.calls[0][1]);
      expect(savedData.version).toBe('1.0');
      expect(savedData.timestamp).toBeDefined();
    });

    it('should call gtag with consent update', () => {
      const mockLocalStorage = {
        getItem: jest.fn(),
        setItem: jest.fn(),
        removeItem: jest.fn(),
      };
      const mockGtag = jest.fn();
      Object.defineProperty(window, 'localStorage', { value: mockLocalStorage });
      Object.defineProperty(window, 'gtag', { value: mockGtag });
      
      const consent: CookieConsent = {
        essential: true,
        functional: true,
        analytics: true,
        marketing: false,
      };
      
      saveConsent(consent);
      
      expect(mockGtag).toHaveBeenCalledWith('consent', 'update', {
        analytics_storage: 'granted',
        ad_storage: 'denied',
        functionality_storage: 'granted',
        personalization_storage: 'denied',
      });
    });
  });

  describe('createCookieConsentState', () => {
    it('should create initial state', () => {
      const state = createCookieConsentState();
      
      expect(state.consent.essential).toBe(true);
      expect(state.consent.functional).toBe(false);
      expect(state.consent.analytics).toBe(false);
      expect(state.consent.marketing).toBe(false);
      expect(state.showBanner).toBe(true);
      expect(state.isLoading).toBe(true);
    });
  });

  describe('acceptAllConsent', () => {
    it('should return consent with all enabled', () => {
      const consent = acceptAllConsent();
      
      expect(consent.essential).toBe(true);
      expect(consent.functional).toBe(true);
      expect(consent.analytics).toBe(true);
      expect(consent.marketing).toBe(true);
    });
  });

  describe('rejectAllConsent', () => {
    it('should return consent with only essential enabled', () => {
      const consent = rejectAllConsent();
      
      expect(consent.essential).toBe(true);
      expect(consent.functional).toBe(false);
      expect(consent.analytics).toBe(false);
      expect(consent.marketing).toBe(false);
    });
  });

  describe('hasConsented', () => {
    it('should return true when functional consent is given', () => {
      const consent: CookieConsent = {
        essential: true,
        functional: true,
        analytics: false,
        marketing: false,
      };
      
      expect(hasConsented(consent)).toBe(true);
    });

    it('should return true when analytics consent is given', () => {
      const consent: CookieConsent = {
        essential: true,
        functional: false,
        analytics: true,
        marketing: false,
      };
      
      expect(hasConsented(consent)).toBe(true);
    });

    it('should return true when marketing consent is given', () => {
      const consent: CookieConsent = {
        essential: true,
        functional: false,
        analytics: false,
        marketing: true,
      };
      
      expect(hasConsented(consent)).toBe(true);
    });

    it('should return false when only essential consent is given', () => {
      const consent: CookieConsent = {
        essential: true,
        functional: false,
        analytics: false,
        marketing: false,
      };
      
      expect(hasConsented(consent)).toBe(false);
    });
  });
});
