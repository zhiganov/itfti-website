import { Lexicons } from '@atproto/lexicon';
import schema from '../lexicons/org.itfti.profile.json' with { type: 'json' };
import { COLLECTION, RECORD_KEY } from './config.js';

const lexicons = new Lexicons([schema]);
export const PROVENANCE = ['self-report', 'ai-assisted', 'peer-review', 'independent-evaluation'];
export const REPORT_STATES = ['current', 'corrected', 'out-of-date', 'withdrawn'];
const segmenter = new Intl.Segmenter(undefined, { granularity: 'grapheme' });
export const graphemes = (text) => [...segmenter.segment(text)].length;

export function httpsUrl(value, label = 'Link') {
  if (typeof value !== 'string' || value.length > 2048) throw new Error(`${label} must be an HTTPS URL of at most 2,048 characters.`);
  let url;
  try { url = new URL(value); } catch { throw new Error(`${label} must be a complete HTTPS URL.`); }
  if (url.protocol !== 'https:' || url.username || url.password) throw new Error(`${label} must use HTTPS without a username or password.`);
  return url.href;
}

export function validDid(value) {
  if (typeof value !== 'string' || value.length > 2048) return false;
  if (/^did:plc:[a-z2-7]{24}$/.test(value)) return true;
  if (!value.startsWith('did:web:')) return false;
  try {
    const parts = value.slice(8).split(':').map(decodeURIComponent);
    const host = new URL(`https://${parts[0]}`);
    return host.origin === `https://${parts[0]}` && !host.username && !host.password &&
      parts.slice(1).every((part) => /^[a-zA-Z0-9._~-]+$/.test(part) && !['.', '..'].includes(part));
  } catch { return false; }
}

export function recordUri(did) {
  if (!validDid(did)) throw new Error('Use a valid ATProto DID.');
  return `at://${did}/${COLLECTION}/${RECORD_KEY}`;
}

export function profilePath(did) {
  if (!validDid(did)) throw new Error('Use a valid ATProto DID.');
  return `/profile/${encodeURIComponent(did)}`;
}

export function validateRecord(record) {
  if (!record || record.$type !== COLLECTION) throw new Error('This is not an ItFtI profile record.');
  // Bound inputs before sending untrusted content through a schema validator.
  if (JSON.stringify(record).length > 48000) throw new Error('The profile record is too large.');
  const checked = lexicons.validate(COLLECTION, record);
  if (!checked.success) throw new Error(`Check the profile fields: ${checked.error.message}`);
  if (!record.summary.trim()) throw new Error('Describe your work before publishing.');
  for (const [key, label] of [['supportProfile', 'Support profile'], ['badge', 'Impact card']]) {
    if (record[key] !== undefined) httpsUrl(record[key], label);
  }
  for (const report of record.reports || []) {
    httpsUrl(report.url, 'Report link');
    if (!report.id.trim() || !report.revision.trim()) throw new Error('Each report needs an ID and a revision.');
    if (report.statusUrl) httpsUrl(report.statusUrl, 'Report status');
    if (!PROVENANCE.includes(report.provenance) || !REPORT_STATES.includes(report.state)) {
      throw new Error('Choose a supported report basis and status.');
    }
  }
  return record;
}

export function makeRecord(fields, previous = null, now = new Date().toISOString()) {
  const record = {
    // Preserve fields written by compatible clients, rather than discard them on edit.
    ...(previous || {}),
    $type: COLLECTION,
    summary: fields.summary.trim(),
    createdAt: previous?.createdAt || now,
    ...(previous ? { updatedAt: now } : {}),
  };
  for (const name of ['supportProfile', 'badge']) {
    const value = fields[name]?.trim();
    if (value) record[name] = httpsUrl(value, name === 'badge' ? 'Impact card' : 'Support profile');
    else delete record[name];
  }
  const areas = fields.areas.split('\n').map((s) => s.trim()).filter(Boolean);
  if (areas.length) record.areas = areas;
  else delete record.areas;
  const reports = (fields.reports || []).map((report) =>
    Object.fromEntries(Object.entries(report).map(([key, val]) => [key, typeof val === 'string' ? val.trim() : val]).filter(([, val]) => val))
  );
  if (reports.length) record.reports = reports;
  else delete record.reports;
  return validateRecord(record);
}

export function recordsEqual(left, right) {
  const canonical = (value) => {
    if (Array.isArray(value)) return value.map(canonical);
    if (value && typeof value === 'object') {
      return Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonical(value[key])]));
    }
    return value;
  };
  return JSON.stringify(canonical(left)) === JSON.stringify(canonical(right));
}
