# Personal impact profiles: first implementation checks

2026-11-16. Work for [website #22](https://github.com/zhiganov/itfti-website/issues/22),
following the public-profile slice of [ItF #7](https://github.com/zhiganov/impact-to-funding/issues/7).

## What is implemented

A separate browser app in `app/`. It displays public Bluesky identity details,
reads a person's impact record from their PDS and provides a draft/review/
publish/edit/unpublish flow. Its collection and self key follow the profile
sketch, with a proposed `org.itfti.profile` namespace.

The root Astro build and Netlify configuration are unchanged.

## Checks and findings

| Check | Result | Coverage |
|---|---|---|
| Node unit tests | 16 passed | Record validation, safe links, identity binding, CAS writes, uncertain outcomes, bounded responses and auth lifecycle |
| App production build | Passed | Bundles, OAuth metadata, schema, seal and font licences |
| Existing Astro build | Passed | All eight existing static pages still build |
| Browser round 1 | Failed | Found a shared development-server JSON-module routing defect |
| Browser correction round | 6 passed, 1 failed | Fictional publish/edit/delete, read failures, conflicts, reports, sign-out, safe text and responsive rendering passed; actual SDK initialization failed |
| Independent source review | Four findings corrected | Pinned SDK callback API, history draft loss, unpublish-cancel draft loss and stale lookup navigation |
| Design detector | No findings | Changed JavaScript/CSS UI files |
| Dependency audit | 15 high package entries | One upstream Zod advisory; [website #23](https://github.com/zhiganov/itfti-website/issues/23) |

The real-SDK failure came from using an event API absent from the installed
SDK. The correction uses its constructor `onSessionDeleted` hook and clears
cached identity state. Three unit tests cover that integration seam. The
browser check has not been rerun after this correction.

Two browser regression cases were added for history/cancel preservation and
stale lookup completion. They have not been run. Source review does not
replace those runtime checks.

The tests replace remote accounts with fictional responses. They do not sign
in to a real account, publish records, provision a site or change DNS.

An independent follow-up verified the four source corrections. Its visual
review found no material changes needed in the six supplied captures. That
verdict covers those states, not untested account or browser behaviour.

## Screenshots

All content is fictional. Captures are 1440 × 1000 and 390 × 844 browser
viewports, with full-page output. They show the passing fixture-based states
before the final auth/state corrections. Layout and styling are unchanged by
those corrections; these images are visual evidence, not proof of the fixes.

| Surface | Desktop | Mobile |
|---|---|---|
| Editor | [View](editor-desktop.png) | [View](editor-mobile.png) |
| Publication review | [View](review-desktop.png) | [View](review-mobile.png) |
| Public profile | [View](profile-desktop.png) | [View](profile-mobile.png) |

## Before release

Resolve the advisory decision and the outstanding browser integration checks.
Then verify the intended HTTPS host, namespace/Lexicon publication and an
approved real-account write/read/edit/delete cycle. The app is not deployed,
and the current checks do not establish readiness to publish a real profile.
