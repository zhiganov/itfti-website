import { authMetadata } from './config.js';
import { boundedFetch } from './transport.js';

export function createAuth({
  loadSdk = () => import('@atproto/oauth-client-browser'),
  location = () => window.location,
} = {}) {
  let clientPromise;
  let initPromise;
  let revision = 0;
  const subscribers = new Set();

  async function client() {
    clientPromise ||= loadSdk().then(async ({ BrowserOAuthClient }) => {
      const metadata = authMetadata(location());
      const options = {
        handleResolver: 'https://public.api.bsky.app',
        fetch: boundedFetch,
        // Lifecycle hooks are constructor options in the pinned SDK.
        onSessionDeleted(sub) {
          revision++;
          initPromise = Promise.resolve(undefined);
          for (const listener of subscribers) listener(sub);
        },
      };
      return typeof metadata === 'string'
        ? BrowserOAuthClient.load({ ...options, clientId: metadata })
        : new BrowserOAuthClient({ ...options, clientMetadata: metadata, responseMode: 'fragment' });
    });
    return clientPromise;
  }

  return {
    async init() {
      const startedAt = revision;
      initPromise ||= client().then((instance) => instance.init());
      const result = await initPromise;
      return startedAt === revision ? result?.session || null : null;
    },
    async signIn(input) {
      const instance = await client();
      // Force a redirect, rather than depend on popup permissions.
      await instance.signInRedirect(input.trim().replace(/^@/, ''));
    },
    async signOut(session) {
      await session.signOut();
      revision++;
      initPromise = Promise.resolve(undefined);
    },
    onDeleted(listener) {
      subscribers.add(listener);
      return () => subscribers.delete(listener);
    },
  };
}

export const auth = createAuth();
