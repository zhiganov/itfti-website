const MAX_BODY = 512 * 1024;

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
