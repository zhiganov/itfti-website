# Illustrative starting experience

Website #13. Reviewed on 18 November 2026, based on main `f224eb4`.

## Changes

The homepage's repeated four-item benefit list is replaced by one compact,
explicitly labelled example that appears before the installation decision.

- A two-panel bordered example in the site's existing slab language:
  a short starting situation and what ItF helps develop, drawn from the
  existing "find a useful contribution" prompt and "a useful result"
  wording on `/itf`.
- A fine-print line labels it "An illustrative example, not a real
  conversation" and keeps the audience sentence.
- Optional MCP/reference setup is removed from the homepage entry flow;
  it remains documented on `/itf#mcp`.
- The install guard, pinned revisions, disclosures and limits link are
  unchanged.

No testimonial, funding result, matching service or impact proof is
introduced. This tests a comprehension hypothesis; no user data was
collected.

## Checks

- `npm run build` passed: eight static pages.
- Headless Chrome checked 1440 × 1000, 390 × 844 and 320 × 844.
- The builder hero action reached `#install`; the example precedes the
  installation controls in the DOM at every width.
- Both example panels were present with the starting situation and the
  kinds of results ItF can help develop; the illustrative label was visible.
- Desktop showed two columns; phones stacked the panels with the
  existing 8px red rule between them.
- The guarded installation command with pinned revision
  `4566892ad990131fb36f760e14c73e5f275600cc` remained intact.
- The replaced benefit list and the homepage MCP link were absent.
- No page errors, non-GET requests or horizontal page overflow occurred.
- The captures below were visually reviewed.
- The temporary preview server was stopped and port 4384 was cleared.

## Limits

These are local browser checks. No installation command was executed,
model called or form submitted. Form/email verification remains in #6.

## Captures

- [Homepage ItF section, desktop](desktop.png)
- [Homepage ItF section, mobile](mobile.png)
