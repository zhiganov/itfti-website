#!/usr/bin/env node
// Lists accounts that hold a published ItFtI profile record, using only public data.
// Usage: npm run published [-- --relay https://relay.example] [-- --json]
import { pathToFileURL } from 'node:url';
import { createApi } from '../src/api.js';
import { COLLECTION } from '../src/config.js';
import { profilePath, validDid } from '../src/profile.js';
import { boundedFetch } from '../src/transport.js';

export const DEFAULT_RELAY = 'https://relay1.us-east.bsky.network';
const APP = 'https://app.itfti.org';
const MAX_PAGES = 100;

// The relay's index of accounts that hold at least one record in the collection.
export async function listCandidates(relay = DEFAULT_RELAY, fetcher = boundedFetch) {
  const dids = [];
  let cursor;
  for (let page = 0; page < MAX_PAGES; page++) {
    const query = new URLSearchParams({ collection: COLLECTION, limit: '1000' });
    if (cursor) query.set('cursor', cursor);
    const response = await fetcher(`${relay}/xrpc/com.atproto.sync.listReposByCollection?${query}`, { cache: 'no-store', credentials: 'omit' });
    if (!response.ok) throw new Error(`The relay refused the request (HTTP ${response.status}).`);
    const data = await response.json();
    for (const repo of data.repos || []) if (validDid(repo?.did)) dids.push(repo.did);
    cursor = data.cursor;
    if (!cursor) return [...new Set(dids)];
  }
  throw new Error(`The relay returned more than ${MAX_PAGES} pages. Nothing is reported.`);
}

// Confirms each candidate against its own account, since the relay index can lag.
export async function listPublished({ relay = DEFAULT_RELAY, fetcher = boundedFetch } = {}) {
  const api = createApi(fetcher);
  const results = [];
  for (const did of await listCandidates(relay, fetcher)) {
    const entry = { did, url: APP + profilePath(did) };
    try {
      const { record } = await api.readRecord(did);
      entry.status = record ? 'published' : 'removed';
      if (record) entry.updated = record.updatedAt || record.createdAt;
    } catch (error) {
      entry.status = 'unreadable';
      entry.reason = error.message;
    }
    if (entry.status === 'published') {
      try { entry.handle = (await api.readIdentity(did)).handle; } catch { /* The handle is optional. */ }
    }
    results.push(entry);
  }
  return results;
}

export function summary(results) {
  const published = results.filter((entry) => entry.status === 'published');
  const lines = [`Published ItFtI profiles: ${published.length}`];
  for (const entry of published) lines.push(`- ${entry.handle || entry.did}  ${entry.url}  (updated ${entry.updated})`);
  const others = results.filter((entry) => entry.status !== 'published');
  if (others.length) {
    lines.push('', `Listed by the relay but not readable as a profile: ${others.length}`);
    for (const entry of others) lines.push(`- ${entry.did}: ${entry.status}${entry.reason ? ` (${entry.reason})` : ''}`);
  }
  return lines.join('\n');
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const args = process.argv.slice(2);
  const relayAt = args.indexOf('--relay');
  const relay = relayAt >= 0 ? args[relayAt + 1] : DEFAULT_RELAY;
  try {
    const results = await listPublished({ relay });
    console.log(args.includes('--json') ? JSON.stringify(results, null, 2) : summary(results));
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
