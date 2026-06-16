const STORAGE_KEY = 'taxandpurpose_cookie_consent';
const CONSENT_VERSION = 1;

export const DEFAULT_CONSENT = {
  necessary: true,
  external: false,
  analytics: false,
};

export function getStoredConsent() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw);
    if (parsed.version !== CONSENT_VERSION) return null;

    return {
      necessary: true,
      external: Boolean(parsed.external),
      analytics: Boolean(parsed.analytics),
      timestamp: parsed.timestamp,
    };
  } catch {
    return null;
  }
}

export function saveConsent(consent) {
  const payload = {
    version: CONSENT_VERSION,
    necessary: true,
    external: Boolean(consent.external),
    analytics: Boolean(consent.analytics),
    timestamp: new Date().toISOString(),
  };

  localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  window.dispatchEvent(new CustomEvent('cookie-consent-updated', { detail: payload }));

  return payload;
}

export function acceptAllCookies() {
  return saveConsent({ external: true, analytics: true });
}

export function acceptNecessaryCookies() {
  return saveConsent({ external: false, analytics: false });
}

export function hasConsent(category) {
  const consent = getStoredConsent();
  if (!consent) return category === 'necessary';
  return Boolean(consent[category]);
}
