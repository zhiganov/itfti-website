import { oauthProtectedResourceMetadataSchema, oauthAuthorizationServerMetadataValidator } from '@atproto/oauth-types';
import { didDocumentValidator } from '@atproto/did';
import { Lexicons } from '@atproto/lexicon';
import schema from '../../../../app/lexicons/org.itfti.profile.json';
import { boundedFetch } from '../../../../app/src/transport.js';
const lex = new Lexicons([schema]);
const LIMIT = 512 * 1024;
// Fill an array of failing items until the JSON reaches the byte cap.
function fill(base, key, item) {
  const empty = JSON.stringify({ ...base, [key]: [] }).length;
  const n = Math.floor((LIMIT - empty) / (JSON.stringify(item).length + 1));
  return { ...base, [key]: Array(n).fill(item) };
}
const cases = {
  protectedResource: () => [oauthProtectedResourceMetadataSchema, fill({ resource: 'https://pds.example.org' }, 'scopes_supported', 1)],
  authServer: () => [oauthAuthorizationServerMetadataValidator, fill({ issuer: 'https://auth.example.org' }, 'scopes_supported', 1)],
  didServices: () => [didDocumentValidator, fill({ id: 'did:plc:abcdefghijklmnopqrstuvwx' }, 'service', {})],
  authServerObjects: () => [oauthAuthorizationServerMetadataValidator, fill({ issuer: 'https://auth.example.org' }, 'scopes_supported', {})],
  didUnderGuard: () => [didDocumentValidator, { id: 'did:plc:abcdefghijklmnopqrstuvwx', service: Array(1000).fill({}), verificationMethod: Array(1000).fill({}), alsoKnownAs: Array(1000).fill(1), controller: Array(1000).fill(1) }],
  authUnderGuard: () => [oauthAuthorizationServerMetadataValidator, Object.fromEntries([['issuer', 'https://auth.example.org'], ...['scopes_supported','response_types_supported','grant_types_supported','code_challenge_methods_supported','token_endpoint_auth_methods_supported','token_endpoint_auth_signing_alg_values_supported','dpop_signing_alg_values_supported','ui_locales_supported','response_modes_supported','subject_types_supported'].map((k) => [k, Array(1000).fill({})])])],
  didDocument: () => [didDocumentValidator, fill({ id: 'did:plc:abcdefghijklmnopqrstuvwx' }, 'alsoKnownAs', 1)],
};
window.retained = [];
window.run = (name) => {
  if (name === 'lexicon') {
    const rec = { $type: 'org.itfti.profile', summary: 'x', createdAt: '2026-11-16T12:00:00.000Z', areas: [] };
    const n = Math.floor((48000 - JSON.stringify(rec).length) / 2);
    rec.areas = Array(n).fill(1);
    const t = performance.now(); const r = lex.validate('org.itfti.profile', rec); 
    window.retained.push(r);
    return { items: n, bytes: JSON.stringify(rec).length, ms: performance.now() - t, success: r.success };
  }
  const [schemaObj, input] = cases[name]();
  const json = JSON.stringify(input);
  const parsed = JSON.parse(json);
  const t = performance.now();
  const r = schemaObj.safeParse(parsed);
  const ms = performance.now() - t;
  let msgMs, msgMB;
  if (window.withMessage && r.error) { const t2 = performance.now(); const m = r.error.message; msgMs = performance.now() - t2; msgMB = (m.length * 2 / 1048576).toFixed(1); window.retained.push(m); }
  window.retained.push(r);
  return { items: Object.values(parsed).find(Array.isArray).length, bytes: json.length, ms, success: r.success, issues: r.error?.issues.length, msgMs, msgMB };
};
window.clear = () => { window.retained = []; };

window.runGuarded = async (name) => {
  const [schemaObj, input] = cases[name]();
  const json = JSON.stringify(input);
  const t = performance.now();
  try {
    const response = await boundedFetch('https://example.org', {}, async () => new Response(json));
    const r = schemaObj.safeParse(await response.json()); window.retained.push(r);
    return { bytes: json.length, ms: performance.now() - t, outcome: r.success ? 'parsed' : `validation failed (${r.error.issues.length} issues)` };
  } catch (e) {
    return { bytes: json.length, ms: performance.now() - t, outcome: `refused: ${e.message}` };
  }
};
