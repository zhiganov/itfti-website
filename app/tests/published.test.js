import assert from 'node:assert/strict';
import test from 'node:test';
import { listCandidates, listPublished, summary } from '../scripts/published-profiles.mjs';
import { makeRecord, recordUri } from '../src/profile.js';

const A = 'did:plc:abcdefghijklmnopqrstuvwx';
const B = 'did:plc:zyxwvutsrqponmlkjihgfedc';
const C = 'did:plc:bbbbbbbbbbbbbbbbbbbbbbbb';
const RELAY = 'https://relay.example.org';
const json = (data, status = 200) => new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } });
const record = makeRecord({ summary: 'Fictional repair guide work.', areas: '', reports: [] }, null, '2026-11-18T12:00:00.000Z');

function fakeNetwork({ pages, records, fail = new Set() }) {
  const requests = [];
  const fetcher = async (url) => {
    requests.push(url);
    const u = new URL(url);
    if (u.pathname.endsWith('listReposByCollection')) {
      assert.equal(u.searchParams.get('collection'), 'org.itfti.profile');
      return json(pages[u.searchParams.get('cursor') || '']);
    }
    if (u.hostname === 'plc.directory') {
      const did = decodeURIComponent(u.pathname.slice(1));
      return json({ id: did, service: [{ id: '#atproto_pds', type: 'AtprotoPersonalDataServer', serviceEndpoint: 'https://pds.example.org' }] });
    }
    if (u.pathname.endsWith('getRecord')) {
      const did = u.searchParams.get('repo');
      if (fail.has(did)) return json({ error: 'InternalError' }, 500);
      if (!records[did]) return json({ error: 'RecordNotFound' }, 400);
      return json({ uri: recordUri(did), cid: 'bafyreitest', value: records[did] });
    }
    if (u.pathname.endsWith('getProfile')) return json({ did: u.searchParams.get('actor'), handle: 'fictional.example.org' });
    throw new Error(`Unexpected request ${url}`);
  };
  return { fetcher, requests };
}

test('relay pages are followed and duplicate or invalid DIDs dropped', async () => {
  const { fetcher } = fakeNetwork({ pages: { '': { repos: [{ did: A }, { did: 'not-a-did' }], cursor: 'next' }, next: { repos: [{ did: A }, { did: B }] } } });
  assert.deepEqual(await listCandidates(RELAY, fetcher), [A, B]);
});

test('each candidate is confirmed against its own account', async () => {
  const { fetcher } = fakeNetwork({ pages: { '': { repos: [{ did: A }, { did: B }, { did: C }] } }, records: { [A]: record }, fail: new Set([C]) });
  const results = await listPublished({ relay: RELAY, fetcher });
  assert.deepEqual(results.map((entry) => entry.status), ['published', 'removed', 'unreadable']);
  assert.equal(results[0].handle, 'fictional.example.org');
  assert.equal(results[0].url, `https://app.itfti.org/profile/${encodeURIComponent(A)}`);
  const text = summary(results);
  assert.match(text, /^Published ItFtI profiles: 1$/m);
  assert.match(text, /Listed by the relay but not readable as a profile: 2/);
});

test('a relay error stops the run without a partial count', async () => {
  const fetcher = async () => json({ error: 'Unavailable' }, 503);
  await assert.rejects(listPublished({ relay: RELAY, fetcher }), /HTTP 503/);
});
