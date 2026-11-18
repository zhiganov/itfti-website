import { authMetadata } from './config.js';
import { boundedFetch } from './transport.js';

export function createAuth({
  loadSdk = () => import('@atproto/oauth-client-browser'),
  location = () => window.location,
} = {}) {
  let clientPromise;
  let initPromise;
  let revision = 0;
  let activeSubject = null;
  const deletedSubjects = new Set();
  const subscribers = new Set();

  async function client() {
    clientPromise ||= loadSdk().then(async ({ BrowserOAuthClient }) => {
      const metadata = authMetadata(location());
      const options = {
        handleResolver: 'https://public.api.bsky.app',
        fetch: boundedFetch,
        // Lifecycle hooks are constructor options in the pinned SDK.
        onSessionDeleted(sub) {
          deletedSubjects.add(sub);
          if (sub === activeSubject) {
            activeSubject = null;
            revision++;
            initPromise = Promise.resolve(undefined);
          }
          for (const listener of subscribers) listener(sub);
        },
        onSessionUpdated(sub) {
          // A successful callback cleans up the old session before storing the
          // new one. Its later update supersedes that cleanup, not a later revoke.
          deletedSubjects.delete(sub);
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
      const session = result?.session || null;
      if (startedAt !== revision || (session && deletedSubjects.has(session.sub))) return null;
      activeSubject = session?.sub || null;
      return session;
    },
    async signIn(input) {
      const instance = await client();
      // Force a redirect, rather than depend on popup permissions.
      await instance.signInRedirect(input.trim().replace(/^@/, ''));
    },
    async signOut(session) {
      await session.signOut();
      revision++;
      activeSubject = null;
      deletedSubjects.add(session.sub);
      initPromise = Promise.resolve(undefined);
    },
    onDeleted(listener) {
      subscribers.add(listener);
      return () => subscribers.delete(listener);
    },
  };
}

export const auth = createAuth();
