'use client';

import { useState, useEffect, useCallback } from 'react';

export interface CookieConsent {
  essential: boolean;
  functional: boolean;
  analytics: boolean;
  marketing: boolean;
}

export interface CookiePreferences {
  consent: CookieConsent;
  timestamp: string;
  version: string;
}

const CONSENT_VERSION = '1.0';
const STORAGE_KEY = 'cookie_consent';

const defaultConsent: CookieConsent = {
  essential: true,
  functional: false,
  analytics: false,
  marketing: false,
};

export function useCookieConsent() {
  const [consent, setConsent] = useState<CookieConsent>(defaultConsent);
  const [showBanner, setShowBanner] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed: CookiePreferences = JSON.parse(stored);
        if (parsed.version === CONSENT_VERSION) {
          setConsent(parsed.consent);
        } else {
          setShowBanner(true);
        }
      } catch {
        setShowBanner(true);
      }
    } else {
      setShowBanner(true);
    }
    setIsLoading(false);
  }, []);

  const saveConsent = useCallback((newConsent: CookieConsent) => {
    const preferences: CookiePreferences = {
      consent: newConsent,
      timestamp: new Date().toISOString(),
      version: CONSENT_VERSION,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
    setConsent(newConsent);
    setShowBanner(false);

    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('consent', 'update', {
        analytics_storage: newConsent.analytics ? 'granted' : 'denied',
        ad_storage: newConsent.marketing ? 'granted' : 'denied',
        functionality_storage: newConsent.functional ? 'granted' : 'denied',
        personalization_storage: newConsent.functional ? 'granted' : 'denied',
      });
    }
  }, []);

  const acceptAll = useCallback(() => {
    saveConsent({
      essential: true,
      functional: true,
      analytics: true,
      marketing: true,
    });
  }, [saveConsent]);

  const rejectAll = useCallback(() => {
    saveConsent({
      essential: true,
      functional: false,
      analytics: false,
      marketing: false,
    });
  }, [saveConsent]);

  const acceptEssential = useCallback(() => {
    saveConsent(defaultConsent);
  }, [saveConsent]);

  const hasConsented = consent.analytics || consent.functional || consent.marketing;

  return {
    consent,
    showBanner,
    isLoading,
    hasConsented,
    acceptAll,
    rejectAll,
    acceptEssential,
    saveConsent,
    setShowBanner,
  };
}

declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
  }
}
