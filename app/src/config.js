export const COLLECTION = 'org.itfti.profile';
export const RECORD_KEY = 'self';
export const DEFAULT_ORIGIN = 'https://app.itfti.org';
export const APP_ORIGIN = import.meta.env?.VITE_APP_ORIGIN || DEFAULT_ORIGIN;
export const SCOPE = `atproto repo:${COLLECTION}`;
export const APPVIEW = 'https://public.api.bsky.app';

export function clientMetadata(origin) {
  const url = new URL(origin);
  if (url.protocol !== 'https:' || url.origin !== origin) {
    throw new Error('The app origin must be an HTTPS origin without a path.');
  }
  return {
    client_id: `${origin}/client-metadata.json`,
    client_name: 'ItFtI impact profiles',
    client_uri: origin,
    policy_uri: `${origin}/privacy`,
    redirect_uris: [`${origin}/oauth/callback`],
    scope: SCOPE,
    grant_types: ['authorization_code', 'refresh_token'],
    response_types: ['code'],
    token_endpoint_auth_method: 'none',
    application_type: 'web',
    dpop_bound_access_tokens: true,
  };
}

export function isLoopback(location) {
  return location.protocol === 'http:' && ['127.0.0.1', '[::1]'].includes(location.hostname);
}

export function authMetadata(location) {
  if (isLoopback(location)) {
    const query = new URLSearchParams({
      redirect_uri: `${location.origin}/oauth/callback`,
      scope: SCOPE,
    });
    return `http://localhost?${query}`;
  }
  if (location.origin !== APP_ORIGIN) {
    throw new Error('Sign-in is unavailable on this address. Use the configured app host, or configure this preview’s exact HTTPS origin.');
  }
  return clientMetadata(APP_ORIGIN);
}
