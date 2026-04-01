'use client';

import { useState } from 'react';
import { useCookieConsent, CookieConsent } from '@/hooks/useCookieConsent';

interface CookieCategoryProps {
  id: keyof CookieConsent;
  title: string;
  description: string;
  required?: boolean;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

function CookieCategory({ id, title, description, required, checked, onChange }: CookieCategoryProps) {
  return (
    <div className="flex items-start gap-4 py-4 border-b border-gray-200 last:border-0">
      <div className="flex items-center h-6 pt-1">
        <input
          id={`cookie-${id}`}
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          disabled={required}
          className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 disabled:opacity-50"
        />
      </div>
      <div className="flex-1">
        <label htmlFor={`cookie-${id}`} className="flex items-center gap-2">
          <span className="font-medium text-gray-900">{title}</span>
          {required && (
            <span className="px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-600 rounded">
              Required
            </span>
          )}
        </label>
        <p className="mt-1 text-sm text-gray-500">{description}</p>
      </div>
    </div>
  );
}

export function CookieConsentBanner() {
  const {
    consent,
    showBanner,
    acceptAll,
    rejectAll,
    acceptEssential,
    saveConsent,
    setShowBanner,
  } = useCookieConsent();

  const [showDetails, setShowDetails] = useState(false);
  const [localConsent, setLocalConsent] = useState<CookieConsent>(consent);

  if (!showBanner) return null;

  const handleSave = () => {
    saveConsent(localConsent);
  };

  const updateConsent = (key: keyof CookieConsent, value: boolean) => {
    setLocalConsent((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <div className="fixed inset-0 bg-black/50" onClick={() => setShowBanner(false)} />
      
      <div className="relative bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-2xl mx-4 mb-4 sm:mb-0 max-h-[90vh] overflow-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4">
          <h2 className="text-xl font-semibold text-gray-900">Cookie Preferences</h2>
          <p className="mt-1 text-sm text-gray-500">
            We use cookies to enhance your browsing experience and analyze our traffic.
          </p>
        </div>

        <div className="px-6">
          {!showDetails ? (
            <>
              <div className="py-6">
                <CookieCategory
                  id="essential"
                  title="Essential Cookies"
                  description="Required for the service to function. Cannot be disabled."
                  required
                  checked={localConsent.essential}
                  onChange={() => {}}
                />
                <CookieCategory
                  id="functional"
                  title="Functional Cookies"
                  description="Remember your preferences and settings for a better experience."
                  checked={localConsent.functional}
                  onChange={(checked) => updateConsent('functional', checked)}
                />
                <CookieCategory
                  id="analytics"
                  title="Analytics Cookies"
                  description="Help us understand how visitors interact with our service."
                  checked={localConsent.analytics}
                  onChange={(checked) => updateConsent('analytics', checked)}
                />
                <CookieCategory
                  id="marketing"
                  title="Marketing Cookies"
                  description="Used for promotional communications and ad targeting."
                  checked={localConsent.marketing}
                  onChange={(checked) => updateConsent('marketing', checked)}
                />
              </div>

              <div className="flex flex-col-reverse sm:flex-row gap-3 pb-6">
                <button
                  onClick={rejectAll}
                  className="flex-1 px-4 py-2.5 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  Reject All
                </button>
                <button
                  onClick={acceptAll}
                  className="flex-1 px-4 py-2.5 text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  Accept All
                </button>
                <button
                  onClick={() => setShowDetails(true)}
                  className="sm:hidden px-4 py-2.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors font-medium"
                >
                  Customize
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="py-6 space-y-4">
                <p className="text-sm text-gray-600">
                  Click the toggle below to customize your cookie preferences. Essential cookies 
                  are always enabled as they are required for the service to function.
                </p>
                
                <div className="space-y-3">
                  {(['functional', 'analytics', 'marketing'] as const).map((category) => (
                    <div key={category} className="flex items-center justify-between py-3 border-b border-gray-100">
                      <div>
                        <span className="font-medium text-gray-900 capitalize">{category} Cookies</span>
                        <span className="ml-2 text-xs text-gray-400">
                          {category === 'functional' && 'Remember settings, language preference'}
                          {category === 'analytics' && 'Usage patterns, popular features'}
                          {category === 'marketing' && 'Ad targeting, campaign measurement'}
                        </span>
                      </div>
                      <button
                        role="switch"
                        aria-checked={localConsent[category]}
                        onClick={() => updateConsent(category, !localConsent[category])}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          localConsent[category] ? 'bg-blue-600' : 'bg-gray-200'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            localConsent[category] ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pb-6">
                <button
                  onClick={() => {
                    setLocalConsent(consent);
                    setShowDetails(false);
                  }}
                  className="flex-1 px-4 py-2.5 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  className="flex-1 px-4 py-2.5 text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  Save Preferences
                </button>
              </div>
            </>
          )}
        </div>

        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
          <p className="text-xs text-gray-500">
            By clicking "Accept All", you consent to the use of all cookies. For more details, 
            see our{' '}
            <a href="/legal/cookie-policy" className="text-blue-600 hover:underline">
              Cookie Policy
            </a>{' '}
            and{' '}
            <a href="/legal/privacy-policy" className="text-blue-600 hover:underline">
              Privacy Policy
            </a>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
