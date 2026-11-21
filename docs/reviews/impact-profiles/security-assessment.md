# Profile app: Zod advisory assessment

2026-11-17. Applies to the browser app in `app/`, implementation commit
`b702e54485391983f032874efddf996c0227266a`.
Tracking: [website #23](https://github.com/zhiganov/itfti-website/issues/23).

## Decision

The operator temporarily accepts the residual browser-tab resource-exhaustion
risk for the initial own-profile launch, with the existing response and record
limits. This is a scoped exception, not a dependency fix or a passing audit.

Keep #23 open for a compatible upstream update. Revisit the exception when a
compatible patched release becomes available or before expanding the launch.
Hosting, namespace and approved real-account verification remain release work.

## Advisory and compatible releases

[GHSA-mrhx-c7xc-m3w5](https://github.com/advisories/GHSA-mrhx-c7xc-m3w5)
describes excessive validation-error allocation for oversized failing arrays.
Its affected range is Zod `<4.6.6`; its severity is high and its stated impact
is availability.

The registry was checked on 2026-11-17:

| Package | Latest checked release | Constraint |
|---|---|---|
| `@atproto/oauth-client-browser` | 0.5.14 | Uses the official OAuth dependency chain below |
| `@atproto/oauth-client` | 0.9.3 | Zod `^3.23.8` |
| `@atproto/oauth-types` | 0.7.7 | Zod `^3.23.8` |
| `@atproto/lexicon` | 0.7.19 | Zod `^3.23.8` |
| Zod 3 | 3.25.76 | Still inside the advisory's affected range |

The existing ranges cannot admit the advisory's patched Zod 4 release.
A fresh install or ordinary lockfile refresh is not a compatible fix.
No forced major-version override or replacement authentication system is used.

The fresh audit reports **15 high package entries**, all deriving from this
one advisory. It reports zero critical entries. The vulnerable dependency is
in the profile app's browser bundle; it is not merely a test-tool dependency.

## Actual exposure and existing controls

Validation runs in the visitor's browser. This app has no application server
that validates all visitors' profiles. The existing root Astro landing site
has a separate dependency graph and build.

Two paths matter:

- Public impact records pass through the Lexicon validator. Their JSON is
  capped at 48,000 characters before validation.
- The OAuth SDK validates discovery and authorization metadata. The custom
  fetch is passed into the SDK, including its identity and metadata resolvers.
  A malicious metadata provider could supply failing collections.

Both paths use a response wrapper capped at 512 KiB and 15 seconds. The wrapper
checks declared length and bytes actually streamed. Oversized responses stop
before the SDK receives them. Tests cover both length paths.

The byte limit bounds input size, not validation's heap use. Zod can still
allocate many error objects within that bound. The remaining concern is a slow
or crashed visitor tab. Its worst case was measured on 2026-11-21 (below).
The advisory does not report credential disclosure or unauthorized writes;
this assessment is not a claim about every possible dependency defect.

## Measured worst case and array guard, 2026-11-21

A [measurement](zod-measurement/README.md) found that the worst input is a
hostile DID document during sign-in: about 1.3 GB and 10 seconds in one tab.
Public profile pages don't use Zod. The app's fetch wrapper now refuses JSON
responses with any list over 1,000 items. The worst input that passes it took
0.13 s and kept about 11 MB.

This exception still covers only the initial own-profile launch. Extending it
is a separate decision.

## Verification and limits

The existing 16 unit checks cover response bounds, record admission, identity,
conflicts and lifecycle behavior. All nine browser cases passed on 2026-11-17,
including the real SDK's signed-out initialization. Fictional writes were
intercepted locally. No real account, hosting or DNS was changed.

These checks establish compatibility of the current app paths. They are not an
exploit benchmark, a live OAuth/PDS check or proof of immunity to the advisory.
The initial-launch scope is an operating decision; the app does not technically
restrict visitors to one DID.
