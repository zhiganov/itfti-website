# Profile app hosting requirements

2026-11-17. Work for [website #22](https://github.com/zhiganov/itfti-website/issues/22).

## Current state

The profile implementation merged through PR #24 as
`3612405ea9a8ee45530d3e8e42eaa6e63e5f04c8`. The existing landing site's
production publication at `itfti.org` was verified against that exact commit.

The profile app has no separate host yet. Authoritative Cloudflare DNS returns
NXDOMAIN for `app.itfti.org`. A name-filtered provider lookup for the proposed
`itfti-app` site returned no match. That lookup is not a complete inventory of
every possible app-site name.

## Netlify route

Use a separate site with `app/` as the base and `app/netlify.toml` as its
configuration. Keep the existing landing site and root build unchanged.
Netlify documents this [monorepo configuration pattern](https://docs.netlify.com/build/configure-builds/monorepos/).

The [Open Source plan policy](https://www.netlify.com/legal/open-source-policy/)
lists 10,000 monthly credits, free production deploys and eligibility
requirements. Additional credits are available at Pro-plan rates. Hosting
cost and billing behavior must be checked for the selected account before
provisioning; this note authorizes no purchases or plan changes.

This change prepares the source-side requirements:

- An MIT grant scoped to the original app package and its documentation.
- A short Code of Conduct linked from the app footer.
- The required “This site is powered by Netlify” acknowledgement.
- A downloadable copy of the app licence in the built output.

Personal records and linked reports retain their rights. Third-party packages,
fonts and the pre-existing seal are outside the new grant. The root landing
site is not relicensed.

These changes are preparation, not a certification of Netlify eligibility.
Confirm the hosted app's fit with the plan before relying on that route.

## Namespace

The proposed NSID `org.itfti.profile` uses the authority domain `itfti.org`.
Verify control of that domain and actual PDS acceptance of the profile record.
The app bundles its schema for local validation.

The [official publishing guide](https://atproto.com/guides/publishing-lexicons)
says network Lexicon publication is recommended, not required. It is not an
extra launch gate for the first profile.

If network publication is chosen, it uses an approved schema-owning ATProto
account and `_lexicon.itfti.org` pointing at its DID. That DNS name currently
returns authoritative NXDOMAIN. Schema-record and authority-DNS writes are
separate from writing a person's impact profile.

## Checks

The app builds with the distributed MIT licence. Two focused browser cases
passed: desktop/mobile rendering with the new footer links, and signed-out
access to the policy links and plain-text licence. They use fictional data.

The earlier nine-test profile browser run remains the baseline for the
unchanged authentication and record flows. The full suite was not repeated
for this footer-only change.

Current fictional public-profile captures: [desktop](../profile-hosting-requirements/desktop.png)
and [mobile](../profile-hosting-requirements/mobile.png).

## Remaining release work

Review and merge these requirements, then approve the separate site and DNS
setup. Verify the exact HTTPS origin, TLS, OAuth metadata/callback, routes and
security headers. Real sign-in, approved profile content and a real PDS
write/read/edit cycle remain necessary before claiming personal publication.
The existing scoped dependency exception in #23 is unchanged.
