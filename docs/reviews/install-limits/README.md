# Homepage installation disclosures

Website #16. Reviewed on 18 November 2026, based on main `8ff5420`.

## Outcome

Two short paragraphs immediately before the copyable installation controls
explain that ItF is free, requires an existing supported agent setup, and
uses that agent's model costs and privacy terms.

They also explain that ItF supports exploration rather than providing
funding, finding collaborators or certifying impact. “Read the limits”
links to `/itf#limits`.

The installation component, commands, revisions, destination guard and
page styles are unchanged. This copy concerns ItF, not FtI access terms.

## Checks

- `npm run build` passed: eight static pages.
- Headless Chrome checked 1440 × 1000 and 390 × 844 viewports.
- Clicking the builder hero action reached `#install`. The cost/privacy
  note was visible, and both disclosures preceded the controls.
- All three agent tabs were exercised at both sizes. Six actual clipboard
  copies matched the original commands, including their pinned revisions
  and existing-destination guard.
- The limits link opened `/itf#limits`, including its remote-model
  privacy explanation, at both sizes.
- No page errors or horizontal page overflow occurred.
- The [desktop](desktop.png) and [mobile](mobile.png) captures were visually
  reviewed. They show the existing installation styling with the added copy.
- The temporary preview server was stopped and port 4382 was cleared.

## Limits

These are local browser checks. No installation command was executed,
model called or form submitted. Form/email verification remains in #6;
mobile installation refinements remain in #17.
