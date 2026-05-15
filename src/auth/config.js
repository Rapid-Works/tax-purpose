// Zitadel OIDC Configuration
export const oidcConfig = {
  authority: process.env.REACT_APP_ZITADEL_AUTHORITY || 'https://zitadel.rapid-works.io',
  client_id: process.env.REACT_APP_ZITADEL_CLIENT_ID || '373087163203518799',
  redirect_uri: process.env.REACT_APP_ZITADEL_REDIRECT_URI || `${window.location.origin}/auth/callback`,
  post_logout_redirect_uri: process.env.REACT_APP_ZITADEL_POST_LOGOUT_URI || window.location.origin,
  scope: 'openid profile email',
  response_type: 'code',
  // PKCE is automatic with oidc-client-ts
};

// Directus URL for iframe embedding
export const DIRECTUS_URL = process.env.REACT_APP_DIRECTUS_URL || 'https://directus.rapid-works.io';
