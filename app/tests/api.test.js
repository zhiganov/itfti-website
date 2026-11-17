import assert from 'node:assert/strict';
import test from 'node:test';
import { createApi } from '../src/api.js';
import { makeRecord, recordUri } from '../src/profile.js';
import { boundedFetch } from '../src/transport.js';

const DID = 'did:plc:abcdefghijklmnopqrstuvwx';
const other = 'did:plc:zyxwvutsrqponmlkjihgfedc';
const record = makeRecord({ summary: 'Fictional work.', areas: '', reports: [] });
const json = (data, status = 200) => new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } });
const doc = { id: DID, alsoKnownAs: ['at://fictional.example.org'], service: [{ id: '#atproto_pds', type: 'AtprotoPersonalDataServer', serviceEndpoint: 'https://pds.example.org' }] };
function reader(value = { uri: recordUri(DID), cid: 'bafyreitest', value: record }) {
  const calls = [];
  const api = createApi(async (url, options) => {
    calls.push({ url, options });
    if (url.includes('plc.directory')) return json(doc);
    if (url.includes('resolveHandle')) return json({ did: DID });
    return json(value, value.error ? 400 : 200);
  });
  return { api, calls };
}

test('anonymous reads resolve the current PDS and omit credentials and caches', async () => {
  const { api, calls } = reader();
  const loaded = await api.readRecord(DID);
  assert.equal(loaded.cid, 'bafyreitest');
  assert.equal(calls.length, 2);
  assert.match(calls[1].url, /^https:\/\/pds.example.org\/xrpc\/com.atproto.repo.getRecord/);
  assert.ok(calls.every((c) => c.options.credentials === 'omit' && c.options.cache === 'no-store'));
});

test('missing records are distinct from connection errors and wrong identities', async () => {
  assert.equal((await reader({ error: 'RecordNotFound' }).api.readRecord(DID)).record, null);
  await assert.rejects(reader({ error: 'InternalError' }).api.readRecord(DID), /could not be loaded/);
  await assert.rejects(reader({ uri: recordUri(other), cid: 'abc', value: record }).api.readRecord(DID), /different record/);
  await assert.rejects(createApi(async () => json({ ...doc, id: other })).readRecord(DID), /identity could not be verified/);
});

test('handle resolution verifies the reverse DID binding', async () => {
  assert.equal(await reader().api.resolveDid('@fictional.example.org'), DID);
  await assert.rejects(reader().api.resolveDid('unbound.example.org'), /do not agree/);
  await assert.rejects(reader().api.resolveDid('https://example.org'), /Enter a Bluesky handle/);
});

test('creates, edits and deletes use the authenticated DID, self key and CAS', async () => {
  const calls = [];
  const session = { sub: DID, fetchHandler: async (url, options) => {
    calls.push({ url, body: JSON.parse(options.body) });
    return json(url.endsWith('putRecord') ? { uri: recordUri(DID), cid: 'new-cid' } : {});
  } };
  const api = createApi();
  await api.publish(session, record, null);
  await api.publish(session, record, 'old-cid');
  await api.unpublish(session, 'new-cid');
  assert.equal(calls[0].body.swapRecord, null);
  assert.equal(calls[1].body.swapRecord, 'old-cid');
  assert.equal(calls[2].body.swapRecord, 'new-cid');
  assert.ok(calls.every((call) => call.body.repo === DID && call.body.rkey === 'self'));
  await assert.rejects(api.publish({ ...session, sub: 'not-a-did' }, record, null), /does not match/);
  await assert.rejects(api.unpublish(session, null), /Load the published record/);
});

test('conflicts, malformed success and uncertain writes lock further changes without replay', async () => {
  for (const response of [() => json({ error: 'InvalidSwap' }, 400), () => json({ uri: 'wrong', cid: 'bad' }), () => { throw new Error('network'); }]) {
    let count = 0;
    const session = { sub: DID, fetchHandler: async () => { count++; return response(); } };
    await assert.rejects(createApi().publish(session, record, null), (error) => error.mustReload === true);
    assert.equal(count, 1);
  }
});

test('bounded transport rejects declared and streamed oversize bodies and preserves discovery URLs', async () => {
  await assert.rejects(boundedFetch('https://example.org', {}, async () => new Response('x', { headers: { 'content-length': '524289' } })), /too large/);
  await assert.rejects(boundedFetch('https://example.org', {}, async () => new Response('x'.repeat(524289))), /too large/);
  const source = json({ okay: true });
  Object.defineProperties(source, { url: { value: 'https://final.example.org/metadata' }, redirected: { value: true } });
  const bounded = await boundedFetch('https://example.org', {}, async () => source);
  assert.equal(bounded.url, source.url);
  assert.equal(bounded.redirected, true);
  assert.deepEqual(await bounded.json(), { okay: true });
});
