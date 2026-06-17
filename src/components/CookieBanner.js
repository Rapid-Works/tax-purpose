import { createContext, useContext, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { X } from 'lucide-react';
import {
  acceptAllCookies,
  acceptNecessaryCookies,
  DEFAULT_CONSENT,
  getStoredConsent,
  saveConsent,
} from '../utils/cookieConsent';

const CookieConsentContext = createContext(null);

export function useCookieConsent() {
  const context = useContext(CookieConsentContext);
  if (!context) {
    throw new Error('useCookieConsent must be used within CookieConsentProvider');
  }
  return context;
}

function Toggle({ checked, disabled, onChange, label }) {
  return (
    <label className={`flex items-start justify-between gap-4 ${disabled ? 'opacity-70' : ''}`}>
      <span className="text-sm text-text/80 leading-relaxed">{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => !disabled && onChange(!checked)}
        className={`relative inline-flex h-6 w-11 flex-shrink-0 rounded-full transition-colors duration-200 ${
          checked ? 'bg-accent' : 'bg-text/20'
        } ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}
      >
        <span
          className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform duration-200 mt-0.5 ${
            checked ? 'translate-x-5' : 'translate-x-0.5'
          }`}
        />
      </button>
    </label>
  );
}

function CookieBannerPanel({
  t,
  preferences,
  setPreferences,
  onClose,
  onSave,
  onAcceptAll,
  onAcceptNecessary,
  showClose,
}) {
  const [showSettings, setShowSettings] = useState(false);

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-[70] p-4 sm:p-6"
      role="dialog"
      aria-labelledby="cookie-banner-title"
      aria-describedby="cookie-banner-description"
      aria-modal="true"
    >
      <div className="mx-auto max-w-4xl rounded-2xl border border-primary/20 bg-white shadow-2xl">
        <div className="p-6 sm:p-8">
          <div className="flex items-start justify-between gap-4 mb-4">
            <h2 id="cookie-banner-title" className="text-xl font-semibold text-text font-serif">
              {t.cookies.title}
            </h2>
            {showClose && (
              <button
                type="button"
                onClick={onClose}
                className="p-1 rounded-full text-text/50 hover:text-text hover:bg-primary/10 transition-colors"
                aria-label={t.cookies.close}
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          <p id="cookie-banner-description" className="text-sm text-text/70 leading-relaxed mb-4">
            {t.cookies.description}{' '}
            <Link to="/privacy-policy" className="text-accent hover:underline">
              {t.cookies.privacyLink}
            </Link>
          </p>

          {showSettings && (
            <div className="mb-6 space-y-4 rounded-xl border border-primary/10 bg-background/60 p-4">
              <div>
                <p className="text-sm font-medium text-text mb-1">{t.cookies.categories.necessary.title}</p>
                <p className="text-xs text-text/60 mb-2">{t.cookies.categories.necessary.description}</p>
                <Toggle checked disabled label={t.cookies.alwaysActive} />
              </div>
              <div>
                <p className="text-sm font-medium text-text mb-1">{t.cookies.categories.external.title}</p>
                <p className="text-xs text-text/60 mb-2">{t.cookies.categories.external.description}</p>
                <Toggle
                  checked={preferences.external}
                  onChange={(value) => setPreferences((prev) => ({ ...prev, external: value }))}
                  label={t.cookies.categories.external.label}
                />
              </div>
              <div>
                <p className="text-sm font-medium text-text mb-1">{t.cookies.categories.analytics.title}</p>
                <p className="text-xs text-text/60 mb-2">{t.cookies.categories.analytics.description}</p>
                <Toggle
                  checked={preferences.analytics}
                  onChange={(value) => setPreferences((prev) => ({ ...prev, analytics: value }))}
                  label={t.cookies.categories.analytics.label}
                />
              </div>
            </div>
          )}

          <div className="flex flex-col-reverse sm:flex-row sm:flex-wrap gap-3">
            <button
              type="button"
              onClick={onAcceptNecessary}
              className="inline-flex items-center justify-center rounded-lg border border-primary/20 px-5 py-2.5 text-sm font-medium text-text hover:bg-primary/5 transition-colors"
            >
              {t.cookies.acceptNecessary}
            </button>
            <button
              type="button"
              onClick={() => setShowSettings((value) => !value)}
              className="inline-flex items-center justify-center rounded-lg border border-primary/20 px-5 py-2.5 text-sm font-medium text-text hover:bg-primary/5 transition-colors"
            >
              {showSettings ? t.cookies.hideSettings : t.cookies.settings}
            </button>
            {showSettings ? (
              <button
                type="button"
                onClick={onSave}
                className="inline-flex items-center justify-center rounded-lg bg-accent px-5 py-2.5 text-sm font-medium text-white hover:bg-accent/90 transition-colors"
              >
                {t.cookies.saveSettings}
              </button>
            ) : (
              <button
                type="button"
                onClick={onAcceptAll}
                className="inline-flex items-center justify-center rounded-lg bg-accent px-5 py-2.5 text-sm font-medium text-white hover:bg-accent/90 transition-colors"
              >
                {t.cookies.acceptAll}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export function CookieConsentProvider({ children, t }) {
  const [consent, setConsent] = useState(() => getStoredConsent());
  const [isEditingSettings, setIsEditingSettings] = useState(false);
  const [preferences, setPreferences] = useState(() => {
    const stored = getStoredConsent();
    return stored || DEFAULT_CONSENT;
  });

  const needsConsent = consent === null;
  const isBannerOpen = needsConsent || isEditingSettings;

  useEffect(() => {
    const handleUpdate = (event) => {
      setConsent(event.detail);
      setPreferences({
        necessary: true,
        external: Boolean(event.detail.external),
        analytics: Boolean(event.detail.analytics),
      });
      setIsEditingSettings(false);
    };

    window.addEventListener('cookie-consent-updated', handleUpdate);
    return () => window.removeEventListener('cookie-consent-updated', handleUpdate);
  }, []);

  const applyConsent = (nextConsent) => {
    setConsent(nextConsent);
    setIsEditingSettings(false);
  };

  const openSettings = () => {
    const stored = getStoredConsent();
    if (stored) {
      setPreferences({
        necessary: true,
        external: stored.external,
        analytics: stored.analytics,
      });
    }
    setIsEditingSettings(true);
  };

  const handleAcceptAll = () => applyConsent(acceptAllCookies());
  const handleAcceptNecessary = () => applyConsent(acceptNecessaryCookies());
  const handleSave = () => applyConsent(saveConsent(preferences));
  const handleClose = () => setIsEditingSettings(false);

  return (
    <CookieConsentContext.Provider
      value={{
        consent,
        hasConsent: (category) => {
          if (!consent) return category === 'necessary';
          return Boolean(consent[category]);
        },
        openSettings,
      }}
    >
      {children}
      {isBannerOpen && (
        <CookieBannerPanel
          t={t}
          preferences={preferences}
          setPreferences={setPreferences}
          onClose={handleClose}
          onSave={handleSave}
          onAcceptAll={handleAcceptAll}
          onAcceptNecessary={handleAcceptNecessary}
          showClose={!needsConsent}
        />
      )}
    </CookieConsentContext.Provider>
  );
}

export default CookieConsentProvider;

export function CookieSettingsLink({ label, className }) {
  const { openSettings } = useCookieConsent();

  return (
    <button type="button" onClick={openSettings} className={className}>
      {label}
    </button>
  );
}
