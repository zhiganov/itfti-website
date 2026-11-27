import tlds from 'tlds/index.json' with { type: 'json' };

// Detects links in free text the way Bluesky's app does for profile bios: full
// http(s) addresses, bare domains with a known top-level domain, and @handles.
// It only returns plain segments; rendering builds elements from them. Unlike
// Bluesky, an opening square bracket or quote also starts a link.

const OPEN = String.raw`(^|\s|[(\["'‘“])`;
const TLDS = new Set(tlds);
const LINK = new RegExp(String.raw`${OPEN}((https?://\S+)|([a-z][a-z0-9]*(?:\.[a-z0-9]+)+)\S*)`, 'gim');
const MENTION = new RegExp(String.raw`${OPEN}@([a-z0-9][a-z0-9.-]*[a-z0-9])`, 'gim');
const LABEL = /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$/i;
const TRAILING = /[.,;:!?"'’”]$/;
const CLOSERS = { ')': '(', ']': '[' };

const knownTld = (domain) => TLDS.has(domain.slice(domain.lastIndexOf('.') + 1).toLowerCase());

function validHandle(handle) {
  const labels = handle.split('.');
  return handle.length <= 253 && labels.length >= 2 && labels.every((label) => LABEL.test(label))
    && /^[a-z]/i.test(labels.at(-1)) && knownTld(handle);
}

// Drops trailing punctuation and closing brackets that the address doesn't open.
function trimEnd(text) {
  let end = text;
  for (;;) {
    const last = end.at(-1);
    if (TRAILING.test(end)) end = end.slice(0, -1);
    else if (CLOSERS[last] && count(end, last) > count(end, CLOSERS[last])) end = end.slice(0, -1);
    else return end;
  }
}

const count = (text, char) => text.split(char).length - 1;

function webHref(text, bareDomain) {
  if (bareDomain && !knownTld(bareDomain)) return null;
  let url;
  try { url = new URL(bareDomain ? `https://${text}` : text); } catch { return null; }
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) return null;
  return url.href;
}

function findLinks(text) {
  const found = [];
  for (const match of text.matchAll(LINK)) {
    const start = match.index + match[1].length;
    const raw = trimEnd(match[2]);
    const bareDomain = match[3] ? null : match[4];
    if (bareDomain && raw.length < bareDomain.length) continue;
    const href = webHref(raw, bareDomain);
    if (href) found.push({ start, end: start + raw.length, href });
  }
  for (const match of text.matchAll(MENTION)) {
    const start = match.index + match[1].length;
    const handle = match[2];
    if (!validHandle(handle)) continue;
    found.push({ start, end: start + handle.length + 1, href: `https://bsky.app/profile/${handle.toLowerCase()}` });
  }
  return found.sort((a, b) => a.start - b.start);
}

// Returns [{ text }, { text, href }, ...] covering the whole input in order.
export function linkSegments(text) {
  if (typeof text !== 'string' || !text) return [];
  const segments = [];
  let at = 0;
  for (const found of findLinks(text)) {
    if (found.start < at) continue;
    if (found.start > at) segments.push({ text: text.slice(at, found.start) });
    segments.push({ text: text.slice(found.start, found.end), href: found.href });
    at = found.end;
  }
  if (at < text.length) segments.push({ text: text.slice(at) });
  return segments;
}
