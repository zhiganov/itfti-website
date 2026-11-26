const MAX_BODY = 512 * 1024;
// Real identity documents, OAuth metadata and profile records have short lists.
// Long failing lists make the SDK's Zod 3 validation allocate heavily (website #23).
export const MAX_ARRAY_ITEMS = 1000;

// Returns true when any array inside a parsed JSON value is longer than the limit.
export function hasLongArray(value, limit = MAX_ARRAY_ITEMS) {
  const stack = [value];
  while (stack.length) {
    const item = stack.pop();
    if (item === null || typeof item !== 'object') continue;
    if (Array.isArray(item)) {
      if (item.length > limit) return true;
      stack.push(...item);
    } else {
      stack.push(...Object.values(item));
    }
  }
  return false;
}

function rejectLongArrays(body) {
  let start = 0;
  while (start < body.length && [0x20, 0x09, 0x0a, 0x0d].includes(body[start])) start++;
  if (body[start] !== 0x7b && body[start] !== 0x5b) return; // Only JSON objects and arrays can hold lists.
  let parsed;
  try { parsed = JSON.parse(new TextDecoder().decode(body)); } catch { return; }
  if (hasLongArray(parsed)) throw new Error('The server response has an unexpectedly long list. Nothing was retried.');
}

// Used for public reads and the OAuth SDK's fetches. No response logging.
export async function boundedFetch(input, init = {}, fetcher = globalThis.fetch) {
  const timeout = AbortSignal.timeout(15000);
  const signal = init.signal ? AbortSignal.any([init.signal, timeout]) : timeout;
  const response = await fetcher(input, { ...init, signal, referrerPolicy: 'no-referrer' });
  if (Number(response.headers.get('content-length')) > MAX_BODY) {
    await response.body?.cancel();
    throw new Error('The server response is too large. Nothing was retried.');
  }
  if (!response.body) return response;
  const reader = response.body.getReader();
  const chunks = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > MAX_BODY) throw new Error('The server response is too large. Nothing was retried.');
      chunks.push(value);
    }
  } catch (error) {
    await reader.cancel().catch(() => {});
    throw error;
  } finally {
    reader.releaseLock();
  }
  const body = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) { body.set(chunk, offset); offset += chunk.byteLength; }
  rejectLongArrays(body);
  const bounded = new Response([204, 205, 304].includes(response.status) ? null : body, {
    status: response.status, statusText: response.statusText, headers: response.headers,
  });
  // OAuth discovery uses the final URL when checking redirects and issuers.
  Object.defineProperties(bounded, {
    url: { value: response.url },
    redirected: { value: response.redirected },
    type: { value: response.type },
  });
  return bounded;
}
