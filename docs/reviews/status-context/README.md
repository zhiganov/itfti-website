# Status and context reconciliation

Website #14. Reviewed on 18 November 2026, based on main `a21901e`.

## Changes

- The homepage brief records the existing forms and email route.
- `PRODUCT.md`, the homepage and `/fti` separate the public CC0 format,
  schemas, publishing guide and fictional examples from private validator
  and server code.
- Import copy describes the experimental local adapter. Maintained live
  imports and current-call interpretation remain future work.
- The installed catalogue remains fictional. The site still states that
  there is no hosted service or funder adoption.
- Homepage metadata says “Two connected projects” rather than implying both
  implementations are open.

The publication and implementation claims were checked against current
project records. No private code or source-profile payloads are included.

## Checks

- `npm run build` passed: eight static pages.
- Headless Chrome rendered `/` and `/fti` at 1440 × 1000 and 390 × 844.
- All four views contained the revised status facts, with no horizontal
  overflow or browser page errors.
- The paired builder/funder hero destinations, install anchor, CIBC support
  link and `/fti` contact form were present.
- The four captures below were visually reviewed. Typography, palette,
  layout rules, seal and existing status-label treatment were preserved.
- The temporary preview server was stopped; port 4381 had no listener.

## Limits

No form was submitted. End-to-end submission and email delivery remain
unverified under #6. Status-label decision #8 remains separate.

The clean root install reported ten high-severity dependency entries.
Their assessment is tracked separately in #27; no dependencies changed here.

## Captures

These are local renders of the revised source, not production captures.

- [Homepage, desktop](home-desktop.png)
- [Homepage, mobile](home-mobile.png)
- [FtI status and contact form, desktop](fti-desktop.png)
- [FtI status and contact form, mobile](fti-mobile.png)
