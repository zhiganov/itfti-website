import assert from 'node:assert/strict';
import test from 'node:test';
import { createAuth } from '../src/auth.js';
import { atprotoLoopbackClientMetadata } from '@atproto/oauth-types';
import { OAuthClient } from '@atproto/oauth-client';

const DID = 'did:plc:abcdefghijklmnopqrstuvwx';
function fixture({ initialize } = {}) {
  let options;
  let initCount = 0;
  let redirectInput;
  const session = { sub: DID, async signOut() {} };
  // Deliberately no EventTarget API: the pinned SDK uses constructor callbacks.
  class Client {
    static async load(settings) {
      atprotoLoopbackClientMetadata(settings.clientId);
      return new Client(settings);
    }
    constructor(settings) { options = settings; }
    async init() {
      initCount++;
      return initialize ? initialize({ options, session }) : { session };
    }
    async signInRedirect(input) { redirectInput = input; }
  }
  return {
    auth: createAuth({ loadSdk: async () => ({ BrowserOAuthClient: Client }), location: () => new URL('http://127.0.0.1:4175/edit') }),
    session, options: () => options, initCount: () => initCount, redirectInput: () => redirectInput,
  };
}

test('auth uses the pinned SDK callback surface and initializes only once', async () => {
  const state = fixture();
  assert.equal(await state.auth.init(), state.session);
  assert.equal(await state.auth.init(), state.session);
  assert.equal(state.initCount(), 1);
  assert.equal(typeof state.options().onSessionDeleted, 'function');
  assert.equal(typeof state.options().onSessionUpdated, 'function');
  await state.auth.signIn('@fictional.example.org');
  assert.equal(state.redirectInput(), 'fictional.example.org');
});

test('session deletion clears cached identity and notifies subscribers', async () => {
  const state = fixture();
  const deleted = [];
  const unsubscribe = state.auth.onDeleted((did) => deleted.push(did));
  await state.auth.init();
  state.options().onSessionDeleted(DID);
  assert.equal(await state.auth.init(), null);
  assert.deepEqual(deleted, [DID]);
  unsubscribe();
  state.options().onSessionDeleted(DID);
  assert.equal(deleted.length, 1);
});

test('explicit sign-out cannot restore the cached account', async () => {
  const state = fixture();
  await state.auth.init();
  await state.auth.signOut(state.session);
  assert.equal(await state.auth.init(), null);
});

test('the real SDK callback can delete an old session before installing a successful login', async () => {
  const state = fixture({
    async initialize({ options, session }) {
      const server = {
        issuer: 'https://auth.example.org',
        serverMetadata: {},
        clientMetadata: { redirect_uris: ['https://app.example.org/oauth/callback'] },
        async exchangeCode() { return { sub: DID }; },
      };
      // Exercise the pinned SDK's actual callback order, without real credentials
      // or network requests. Its cleanup calls revoke() before setStored().
      return OAuthClient.prototype.callback.call({
        stateStore: {
          async get() { return { iss: server.issuer }; },
          async del() {},
        },
        serverFactory: { async fromIssuer() { return server; } },
        async revoke(sub) { options.onSessionDeleted(sub); },
        sessionGetter: {
          async setStored(sub, stored) { options.onSessionUpdated?.(sub, stored); },
        },
        createSession() { return session; },
      }, new URLSearchParams({ state: 'synthetic-state', code: 'synthetic-code' }));
    },
  });
  assert.equal(await state.auth.init(), state.session);
  assert.equal(await state.auth.init(), state.session);
  assert.equal(state.initCount(), 1);
});

test('a deletion during initialization still rejects a session that was not replaced', async () => {
  const started = Promise.withResolvers();
  const finish = Promise.withResolvers();
  const state = fixture({
    async initialize({ session }) {
      started.resolve();
      await finish.promise;
      return { session };
    },
  });
  const pending = state.auth.init();
  await started.promise;
  state.options().onSessionDeleted(DID);
  finish.resolve();
  assert.equal(await pending, null);
  assert.equal(await state.auth.init(), null);
});

test('deleting a different account does not discard the current session', async () => {
  const state = fixture();
  await state.auth.init();
  state.options().onSessionDeleted('did:plc:zyxwvutsrqponmlkjihgfedc');
  assert.equal(await state.auth.init(), state.session);
  assert.equal(state.initCount(), 1);
});

test('a genuine deletion after the replacement update still rejects initialization', async () => {
  const state = fixture({
    async initialize({ options, session }) {
      options.onSessionDeleted(DID);
      options.onSessionUpdated(DID, {});
      options.onSessionDeleted(DID);
      return { session };
    },
  });
  assert.equal(await state.auth.init(), null);
  assert.equal(await state.auth.init(), null);
});
