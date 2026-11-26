import assert from 'node:assert/strict';
import test from 'node:test';
import { applyProfileDraft, DRAFT_FORMAT, DRAFT_MAX_BYTES, parseProfileDraft } from '../src/draft.js';
import { makeRecord } from '../src/profile.js';

const fields = () => ({
  summary: 'Original summary', areas: 'Original area', supportProfile: 'https://example.org/original', badge: '', reports: [{ id: 'old', url: 'https://example.org/old', revision: 'v1', provenance: 'self-report', state: 'current' }],
});

test('a versioned draft parses complete changes and applies only supplied fields', () => {
  const changes = parseProfileDraft(JSON.stringify({
    format: DRAFT_FORMAT,
    changes: { summary: 'Imported summary', areas: ['First', 'Second'], reports: [] },
  }));
  const next = applyProfileDraft(fields(), changes);
  assert.equal(next.summary, 'Imported summary');
  assert.equal(next.areas, 'First\nSecond');
  assert.deepEqual(next.reports, []);
  assert.equal(next.supportProfile, fields().supportProfile);
  assert.equal(next.badge, '');
});

test('drafts can clear optional links and preserve source-only state', () => {
  const changes = parseProfileDraft(JSON.stringify({ format: DRAFT_FORMAT, changes: { supportProfile: '', badge: '' } }));
  const next = applyProfileDraft(fields(), changes);
  assert.equal(next.supportProfile, '');
  assert.equal(next.badge, '');
  assert.equal(next.summary, fields().summary);
  assert.deepEqual(next.reports, fields().reports);
});

test('malformed JSON, unsupported versions, unknown fields and invalid types are rejected', () => {
  for (const input of [
    '{',
    'null',
    '[]',
    JSON.stringify({ format: 'itf.profile-draft/0.2-local', changes: { summary: 'New' } }),
    JSON.stringify({ format: DRAFT_FORMAT, changes: { summary: 'New' }, did: 'did:plc:abcdefghijklmnopqrstuvwx' }),
    JSON.stringify({ format: DRAFT_FORMAT, changes: {} }),
    JSON.stringify({ format: DRAFT_FORMAT, changes: { createdAt: '2026-01-01T00:00:00Z' } }),
    JSON.stringify({ format: DRAFT_FORMAT, changes: { summary: 42 } }),
    JSON.stringify({ format: DRAFT_FORMAT, changes: { areas: 'one per line' } }),
    JSON.stringify({ format: DRAFT_FORMAT, changes: { areas: [42] } }),
    JSON.stringify({ format: DRAFT_FORMAT, changes: { reports: {} } }),
    JSON.stringify({ format: DRAFT_FORMAT, changes: { reports: [{ id: 'report', token: 'secret' }] } }),
    JSON.stringify({ format: DRAFT_FORMAT, changes: { reports: [{ id: 42 }] } }),
  ]) assert.throws(() => parseProfileDraft(input));
});

test('draft size is bounded before record validation', () => {
  const input = JSON.stringify({ format: DRAFT_FORMAT, changes: { summary: 'x'.repeat(DRAFT_MAX_BYTES) } });
  assert.throws(() => parseProfileDraft(input), /too large/);
});

test('imported values use the existing record validation', () => {
  const changes = parseProfileDraft(JSON.stringify({ format: DRAFT_FORMAT, changes: { supportProfile: 'javascript:alert(1)' } }));
  assert.throws(() => makeRecord(applyProfileDraft(fields(), changes)), /HTTPS/);
});
