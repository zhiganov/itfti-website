# ItFtI impact profiles

A browser app for public personal profiles stored in the author's ATProto
account. It reads Bluesky identity details separately. The existing Astro site
has its own build and stays unchanged.

**Status: first implementation, not deployed or real-account tested.**
The collection name is proposed. Before enabling publication on the public
host, verify control of its namespace and actual PDS write/read behavior.
Network Lexicon publication is a recommended interoperability step, not a
technical prerequisite for the first profile.

## Develop and check

Node.js 22.12+:

```sh
cd app
npm ci
npm test
npm run build
npm run dev
```

Open `http://127.0.0.1:4175`. Local OAuth uses the protocol's special loopback
client and the same collection-scoped permission as production.

```sh
npm run test:browser
```

Playwright uses installed Google Chrome on macOS, or its Chromium elsewhere.
In CI, install Chromium with `npx playwright install --with-deps chromium`.
All nine browser tests passed on 2026-11-17. They intercept account reads and
writes with fictional data. One initializes the real OAuth SDK signed out
without account requests. The suite covers the corrected SDK lifecycle hook,
history/cancel draft preservation and stale lookup completion.
Live OAuth and real PDS writes remain untested.

## App and record

- `/`: account lookup and the authoring entry point.
- `/edit`: sign in, load the existing record, draft, review and publish.
- `/profile/<encoded DID>`: anonymous public page, keyed by stable DID.
- `/oauth/callback`: the SDK's authorization callback.
- `/privacy`: storage, public disclosure, third parties and takedown contact.
- `/client-metadata.json`: generated OAuth metadata for the exact build origin.
- `/lexicons/org.itfti.profile.json`: proposed profile schema for inspection.

The record is `at://<DID>/org.itfti.profile/self`. It adapts the profile draft
in [ItF #102](https://github.com/zhiganov/impact-to-funding/issues/102), keeping
its report basis and state values. Source discussion:
[ItF #7](https://github.com/zhiganov/impact-to-funding/issues/7#issuecomment-6914571752).

The summary, areas and links are the impact content. Report bodies and support
manifests stay at their linked public URLs. Name, avatar, handle and bio come
from Bluesky's public API and are not duplicated in the impact record.

Creates use `swapRecord: null`; edits and deletes use the loaded CID. Failed
initial reads disable editing. An uncertain write locks further changes until
the source is reloaded. A successful write is followed by a public read-back.
Unpublishing deletes only this app's record.

## Security and privacy

The official `@atproto/oauth-client-browser` SDK handles discovery, PKCE, PAR,
DPoP, identity verification and refresh. The app requests
`atproto repo:org.itfti.profile`. It never requests access to Bluesky posts,
follows, profile edits or private messages.

Sessions and keys are stored by the SDK in this browser's IndexedDB. Drafts
exist only in tab memory. No application backend or central profile database
is required. This app cannot centrally invalidate every browser session;
the account provider controls its grants.

The app requests records without a persistent application cache, so a refresh
reads the current source. Other services may retain copies of public records.
The privacy page lists the third-party requests this browser makes.

Untrusted text is rendered as text nodes. Links must use HTTPS without embedded
credentials. Public response bodies and SDK fetch responses are bounded to
512 KiB and 15 seconds. Records are capped at 48,000 JSON characters before
Lexicon validation. These are app admission bounds, not protocol-wide limits.

### Dependency advisory

The pinned official OAuth SDK and Lexicon validator depend on Zod 3. npm audit
reports [GHSA-mrhx-c7xc-m3w5](https://github.com/advisories/GHSA-mrhx-c7xc-m3w5),
an oversized-array validation resource-exhaustion issue. The advisory's patched
release is Zod 4.6.6; the SDK requires Zod 3. A forced major-version override
has not been applied.

On 2026-11-17, the operator temporarily accepted the residual browser-tab
resource-exhaustion risk for the initial own-profile launch, with the existing
response and record limits. The audit still reports 15 high package entries
from this one advisory. See the [assessment and scoped exception](../docs/reviews/impact-profiles/security-assessment.md).
Website #23 stays open for a compatible upstream fix.

## Licence and conduct

The original app package is [MIT licensed](LICENSE). This covers its code and
associated documentation. Profile records, personal data, linked reports, the
root landing site and the pre-existing seal asset keep their own rights.
Dependencies and fonts retain their existing licences.

The [Code of Conduct](CODE_OF_CONDUCT.md) covers app collaboration and hosted
participation. The app footer links it, the distributed app licence and the
required Netlify acknowledgement.

## Host separately on Netlify

No site or DNS record is provisioned by this code. When hosting is approved:

1. Verify the intended Netlify account, site, costs and domain control.
   If using its Open Source plan, confirm that this hosted app qualifies under
   the [plan policy](https://www.netlify.com/legal/open-source-policy/).
   Licence, conduct and attribution requirements are included; provider
   acceptance is a separate check.
2. Create/select a separate site using this repository and `app/netlify.toml`.
   It sets base directory `app` and publishes `app/dist`. Leave the existing
   landing site's root configuration and domain untouched.
3. For production, build with `ITF_APP_ORIGIN=https://app.itfti.org`. This is
   a public origin, not a secret. Deploy previews use `DEPLOY_PRIME_URL` when
   Netlify sets `CONTEXT=deploy-preview`; other preview hosts need an explicit
   exact `ITF_APP_ORIGIN`. Rebuild when it changes.
4. Configure `app.itfti.org` and its certificate. Current project context says
   Cloudflare DNS should be DNS-only so Netlify owns TLS.
5. Verify that OAuth metadata and the callback share the exact origin, metadata
   returns JSON, deep links return the app, and the security headers apply.
   A different host is refused for sign-in.
6. Verify control of `itfti.org` before adopting `org.itfti.profile`.
   The app bundles its schema for validation. If network Lexicon publication
   is chosen, publish it to an approved ATProto account and point
   `_lexicon.itfti.org` at that DID. A static schema file alone is not
   network publication. See the [official guide](https://atproto.com/guides/publishing-lexicons).
7. Agree the operator/takedown contact and review this app's privacy page.
   `src/moderation.js` provides host-level suppression by DID; it cannot
   change a user's source record.
8. With permission for a real account write, test OAuth, the approved record's
   write/read, signed-out viewing, an edit and deletion. Do not use a person's
   published profile as a disposable fixture.

The site serves a generic social-link preview. Profile-specific previews
would require a rendering endpoint; they are outside this first version.
The seal is reused from the landing site. Fonts are bundled locally, with
their licence files emitted under `/licenses/`.

## Release gates

The local browser gate has passed. The initial-launch dependency exception
is recorded. Release still needs a verified host/namespace and an approved
real-account write/read/edit/delete check. The broader mentor and
community-module work in #7 remains separate.
