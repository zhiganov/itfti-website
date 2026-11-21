# Zod advisory: worst-case measurement

2026-11-21, for [website #23](https://github.com/zhiganov/itfti-website/issues/23).
It measures how much time and memory the app's pinned validators use on the
largest hostile inputs the app's caps allow.

## Method

`entry.js` builds inputs up to the caps: 48,000 characters for a profile record
and 512 KiB for anything else. Every array item fails validation. The page runs
in Chromium. `run.cjs` records parse time and the heap that the failed result
keeps, after garbage collection. Each case ran at least twice; runs agreed
closely.

Packages: `@atproto/oauth-client-browser` 0.5.14, `@atproto/oauth-types` 0.7.7,
`@atproto/did`, `@atproto/lexicon` 0.7.19 and Zod 3, as pinned in
`app/package-lock.json`.

## Without the guard

| Input | Where the app checks it | Time | Memory kept |
|---|---|---|---|
| Profile record, about 24,000 failing items | Public profile pages | under 1 ms | none measurable |
| OAuth server metadata, about 262,000 failing items | Sign-in only | 0.13–0.18 s | about 37 MB |
| The same, plus reading the error message | Sign-in only | +0.3 s | about 87 MB |
| DID document, about 175,000 empty `service` entries | Sign-in only | 9.5–13.4 s | about 1.3 GB; 1.8 GB with the message |

Profile records go through the Lexicon validator, which doesn't use Zod.
Public pages read accounts with the app's own code. The OAuth SDK, which does
use Zod, loads only on the editor and sign-in pages.

Only a `did:web` account can serve a DID document like the last one, because
its owner hosts the file. Someone would have to type that account into the
sign-in form. It harms that one tab.

## With the guard

`app/src/transport.js` now refuses any JSON response with a list longer than
1,000 items, before the SDK sees it.

| Input | Outcome | Time | Memory kept |
|---|---|---|---|
| Every input above | Refused | 5–30 ms | none measurable |
| DID document with four lists of 1,000 failing items | Validation fails | 0.11–0.13 s | about 11 MB |
| OAuth metadata with ten lists of 1,000 failing items | Validation fails | 13–15 ms | about 2 MB |

## Run it

From `app/`, after `npm ci`:

```sh
node node_modules/vite/bin/vite.js build --config ../docs/reviews/impact-profiles/zod-measurement/vite.config.mjs
node ../docs/reviews/impact-profiles/zod-measurement/run.cjs
node ../docs/reviews/impact-profiles/zod-measurement/run.cjs protectedResource,didServices --message
node ../docs/reviews/impact-profiles/zod-measurement/run.cjs didServices,didUnderGuard,authUnderGuard --guarded
```

`run.cjs` needs Playwright's Chromium.

## Limits

This measures memory the failed result keeps, not the peak during parsing.
Desktop Chromium only; phones have less memory.
