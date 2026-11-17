import assert from 'node:assert/strict';
import test from 'node:test';
import { makeRecord, validateRecord, httpsUrl, graphemes, recordUri, recordsEqual, validDid } from '../src/profile.js';
import { COLLECTION, SCOPE, authMetadata, clientMetadata } from '../src/config.js';

const DID = 'did:plc:abcdefghijklmnopqrstuvwx';
const now = '2026-11-16T12:00:00.000Z';
const fields = () => ({ summary: 'I help maintain a fictional community repair guide.', areas: '', reports: [] });
const record = () => makeRecord(fields(), null, now);

test('schema accepts the minimal profile and keeps a stable self key', () => {
  assert.equal(validateRecord(record()).summary, fields().summary);
  assert.equal(recordUri(DID), `at://${DID}/${COLLECTION}/self`);
  assert.equal(record().createdAt, now);
});

test('edits preserve creation date and compatible fields; empty optional fields are removed', () => {
  const old = { ...record(), supportProfile: 'https://example.org/old', areas: ['Old area'], futureField: 'keep' };
  const next = makeRecord(fields(), old, '2026-11-17T00:00:00.000Z');
  assert.equal(next.createdAt, now);
  assert.equal(next.updatedAt, '2026-11-17T00:00:00.000Z');
  assert.equal(next.futureField, 'keep');
  assert.ok(!('supportProfile' in next));
  assert.ok(!('areas' in next));
});

test('record validation rejects missing, blank, oversized and invalid data', () => {
  for (const bad of [
    { ...record(), summary: '' },
    { ...record(), summary: 'a'.repeat(301) },
    { ...record(), areas: Array(9).fill('area') },
    { ...record(), createdAt: 'next week' },
    { ...record(), $type: 'org.example.profile' },
    { ...record(), futureField: 'x'.repeat(48000) },
  ]) assert.throws(() => validateRecord(bad));
  const missing = record();
  delete missing.summary;
  assert.throws(() => validateRecord(missing));
  assert.equal(graphemes('e\u0301'), 1);
  assert.doesNotThrow(() => validateRecord({ ...record(), summary: 'e\u0301'.repeat(300) }));
});

test('report links preserve contract provenance and state, not impact certification', () => {
  const report = { id: 'learning-2026', url: 'https://example.org/report', revision: 'v1', provenance: 'ai-assisted', state: 'corrected' };
  assert.equal(makeRecord({ ...fields(), reports: [report] }, null, now).reports[0].state, 'corrected');
  for (const bad of [{ ...report, provenance: 'verified' }, { ...report, state: 'stale' }, { ...report, revision: '' }]) {
    assert.throws(() => makeRecord({ ...fields(), reports: [bad] }));
  }
});

test('links reject scripts, credentials, insecure URLs and oversized URLs', () => {
  for (const value of ['javascript:alert(1)', 'data:text/html,bad', 'http://example.org', 'https://user:secret@example.org', 'not-a-url', `https://example.org/${'x'.repeat(2048)}`]) {
    assert.throws(() => httpsUrl(value));
    assert.throws(() => validateRecord({ ...record(), badge: value }));
  }
  assert.equal(httpsUrl('https://example.org'), 'https://example.org/');
});

test('DIDs and read-back comparisons are structural', () => {
  assert.ok(validDid(DID));
  assert.ok(validDid('did:web:example.org:user'));
  assert.ok(!validDid('did:web:evil.example%2Fpath'));
  assert.ok(!validDid('name.bsky.social'));
  assert.ok(recordsEqual({ a: 1, b: [2, 3] }, { b: [2, 3], a: 1 }));
  assert.ok(!recordsEqual({ a: 1 }, { a: 2 }));
});

test('OAuth metadata grants only the app collection and binds to the exact host', () => {
  const metadata = clientMetadata('https://preview.example.org');
  assert.equal(metadata.scope, `atproto repo:${COLLECTION}`);
  assert.deepEqual(metadata.redirect_uris, ['https://preview.example.org/oauth/callback']);
  assert.equal(metadata.token_endpoint_auth_method, 'none');
  assert.throws(() => clientMetadata('http://example.org'));
  assert.throws(() => clientMetadata('https://example.org/path'));
  assert.throws(() => authMetadata(new URL('https://wrong.example.org/edit')));
  const local = new URL(authMetadata(new URL('http://127.0.0.1:4175/edit')));
  assert.equal(local.searchParams.get('scope'), SCOPE);
  assert.equal(local.searchParams.get('redirect_uri'), 'http://127.0.0.1:4175/oauth/callback');
});
