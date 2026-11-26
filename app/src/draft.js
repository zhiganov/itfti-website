export const DRAFT_FORMAT = 'itf.profile-draft/0.1-local';
export const DRAFT_MAX_BYTES = 48000;

const CHANGE_FIELDS = ['summary', 'areas', 'supportProfile', 'badge', 'reports'];
const REPORT_FIELDS = ['id', 'title', 'url', 'revision', 'period', 'published', 'provenance', 'state', 'statusUrl'];
const textEncoder = new TextEncoder();

function object(value, label) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error(`${label} must be an object.`);
  return value;
}

function keys(value, allowed, label) {
  for (const key of Object.keys(value)) {
    if (!allowed.includes(key)) throw new Error(`${label} contains an unsupported field: ${key}.`);
  }
}

function string(value, label) {
  if (typeof value !== 'string') throw new Error(`${label} must be a string.`);
  return value;
}

export function parseProfileDraft(text) {
  if (typeof text !== 'string') throw new Error('Choose a JSON profile draft.');
  if (textEncoder.encode(text).length > DRAFT_MAX_BYTES) throw new Error(`The profile draft is too large. Keep it under ${DRAFT_MAX_BYTES.toLocaleString('en')} bytes.`);
  let draft;
  try { draft = JSON.parse(text); } catch { throw new Error('The profile draft is not valid JSON.'); }
  object(draft, 'The profile draft');
  keys(draft, ['format', 'changes'], 'The profile draft');
  if (draft.format !== DRAFT_FORMAT) throw new Error(`Unsupported profile draft format. Use ${DRAFT_FORMAT}.`);
  object(draft.changes, 'The profile draft changes');
  keys(draft.changes, CHANGE_FIELDS, 'The profile draft changes');
  if (Object.keys(draft.changes).length === 0) throw new Error('The profile draft contains no changes.');
  const changes = {};
  if ('summary' in draft.changes) changes.summary = string(draft.changes.summary, 'The summary');
  if ('areas' in draft.changes) {
    if (!Array.isArray(draft.changes.areas)) throw new Error('Areas of work must be an array of strings.');
    changes.areas = draft.changes.areas.map((area, index) => string(area, `Area ${index + 1}`));
  }
  for (const [name, label] of [['supportProfile', 'Support profile'], ['badge', 'Impact card']]) {
    if (name in draft.changes) changes[name] = string(draft.changes[name], label);
  }
  if ('reports' in draft.changes) {
    if (!Array.isArray(draft.changes.reports)) throw new Error('Reports must be an array.');
    changes.reports = draft.changes.reports.map((report, index) => {
      object(report, `Report ${index + 1}`);
      keys(report, REPORT_FIELDS, `Report ${index + 1}`);
      return Object.fromEntries(Object.entries(report).map(([key, value]) => [key, string(value, `Report ${index + 1} field ${key}`)]));
    });
  }
  return changes;
}

export function applyProfileDraft(fields, changes) {
  const next = { ...fields, reports: structuredClone(fields.reports || []) };
  if ('summary' in changes) next.summary = changes.summary;
  if ('areas' in changes) next.areas = changes.areas.join('\n');
  for (const name of ['supportProfile', 'badge']) {
    if (name in changes) next[name] = changes[name];
  }
  if ('reports' in changes) next.reports = structuredClone(changes.reports);
  return next;
}
