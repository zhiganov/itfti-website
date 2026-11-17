import { APPVIEW, COLLECTION, RECORD_KEY } from './config.js';
import { httpsUrl, validDid, recordUri, validateRecord } from './profile.js';
import { boundedFetch } from './transport.js';

export class ProfileError extends Error {
  constructor(message, { mustReload = false } = {}) {
    super(message);
    this.mustReload = mustReload;
  }
}

export function createApi(fetcher = boundedFetch) {
  async function read(url) {
    const response = await fetcher(url, { cache: 'no-store', credentials: 'omit' });
    let data;
    try { data = await response.json(); } catch { throw new Error('The account server returned unreadable data. Try loading again.'); }
    return { response, data };
  }

  async function resolveDid(input) {
    const value = input.trim().replace(/^@/, '');
    if (validDid(value)) return value;
    if (value.length > 253 || !/^(?=.{3,}$)[a-z0-9](?:[a-z0-9.-]*[a-z0-9])?\.[a-z]{2,}$/i.test(value)) {
      throw new Error('Enter a Bluesky handle, such as name.bsky.social, or an ATProto DID.');
    }
    const { response, data } = await read(`${APPVIEW}/xrpc/com.atproto.identity.resolveHandle?handle=${encodeURIComponent(value)}`);
    if (!response.ok || !validDid(data.did)) throw new Error('That handle could not be resolved. Check its spelling.');
    // Authenticate the reverse direction too: a handle must be listed by its DID.
    const doc = await didDocument(data.did);
    if (!(doc.alsoKnownAs || []).includes(`at://${value.toLowerCase()}`)) throw new Error('The handle and DID do not agree.');
    return data.did;
  }

  async function didDocument(did) {
    if (!validDid(did)) throw new Error('This profile URL does not contain a valid DID.');
    let url = `https://plc.directory/${encodeURIComponent(did)}`;
    if (did.startsWith('did:web:')) {
      const [host, ...path] = did.slice(8).split(':').map(decodeURIComponent);
      url = `https://${host}/${path.length ? path.map(encodeURIComponent).join('/') : '.well-known'}/did.json`;
    }
    const { response, data } = await read(url);
    if (!response.ok || data.id !== did) throw new Error('The account identity could not be verified. Try loading again.');
    return data;
  }

  async function pdsFor(did) {
    const doc = await didDocument(did);
    const service = (doc.service || []).find((entry) =>
      entry.type === 'AtprotoPersonalDataServer' && [ '#atproto_pds', `${did}#atproto_pds` ].includes(entry.id)
    );
    if (!service || typeof service.serviceEndpoint !== 'string') throw new Error('This account does not advertise a personal data server.');
    return httpsUrl(service.serviceEndpoint, 'Account server').replace(/\/$/, '');
  }

  async function readRecord(did) {
    const pds = await pdsFor(did);
    const query = new URLSearchParams({ repo: did, collection: COLLECTION, rkey: RECORD_KEY });
    const source = `${pds}/xrpc/com.atproto.repo.getRecord?${query}`;
    const { response, data } = await read(source);
    if ([400, 404].includes(response.status) && data.error === 'RecordNotFound') return { record: null, cid: null, source };
    if (!response.ok) throw new Error('The impact record could not be loaded. Try again before editing.');
    if (data.uri !== recordUri(did) || typeof data.cid !== 'string' || !data.cid) {
      throw new Error('The account server returned a different record. Editing is disabled.');
    }
    return { record: validateRecord(data.value), cid: data.cid, source };
  }

  async function readIdentity(did) {
    const { response, data } = await read(`${APPVIEW}/xrpc/app.bsky.actor.getProfile?actor=${encodeURIComponent(did)}`);
    if (!response.ok || data.did !== did) throw new Error('Bluesky details are unavailable. The impact record can still be read.');
    return {
      did, handle: typeof data.handle === 'string' ? data.handle : did,
      displayName: typeof data.displayName === 'string' ? data.displayName : '',
      description: typeof data.description === 'string' ? data.description : '',
      avatar: typeof data.avatar === 'string' && data.avatar.startsWith('https:') ? httpsUrl(data.avatar, 'Avatar') : null,
    };
  }

  async function write(session, action, body) {
    if (!validDid(session?.sub) || body.repo !== session.sub) throw new Error('The signed-in account does not match this profile.');
    let response;
    try {
      response = await session.fetchHandler(`/xrpc/com.atproto.repo.${action}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body), signal: AbortSignal.timeout(15000),
      });
    } catch {
      throw new ProfileError('The save outcome is unknown. Reload the record before trying again.', { mustReload: true });
    }
    let data;
    try { data = await response.json(); } catch {
      throw new ProfileError('The account server did not confirm the change. Reload the record before trying again.', { mustReload: true });
    }
    if (!response.ok) {
      if (data.error === 'InvalidSwap') throw new ProfileError('This profile changed elsewhere. Reload it before making another change.', { mustReload: true });
      throw new ProfileError('The account server refused the change. Reload the record and check your sign-in permissions.', { mustReload: true });
    }
    return data;
  }

  async function publish(session, record, previousCid) {
    validateRecord(record);
    const data = await write(session, 'putRecord', {
      repo: session.sub, collection: COLLECTION, rkey: RECORD_KEY,
      record, swapRecord: previousCid ?? null,
    });
    if (data.uri !== recordUri(session.sub) || typeof data.cid !== 'string' || !data.cid) {
      throw new ProfileError('The account server did not confirm the expected record. Reload before trying again.', { mustReload: true });
    }
    return data;
  }

  async function unpublish(session, previousCid) {
    if (!previousCid) throw new Error('Load the published record before deleting it.');
    return write(session, 'deleteRecord', {
      repo: session.sub, collection: COLLECTION, rkey: RECORD_KEY, swapRecord: previousCid,
    });
  }

  return { resolveDid, readRecord, readIdentity, publish, unpublish };
}
