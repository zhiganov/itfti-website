import assert from 'node:assert/strict';
import test from 'node:test';
import { createAuth } from '../src/auth.js';
import { atprotoLoopbackClientMetadata } from '@atproto/oauth-types';

const DID = 'did:plc:abcdefghijklmnopqrstuvwx';
function fixture() {
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
    async init() { initCount++; return { session }; }
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
