# Mobile installation controls

Website #17. Reviewed on 18 November 2026, based on main `9088f46`.

## Changes

- Agent tabs and both shared copy-button styles have a minimum height of 44px.
- At 720px and below, agent tabs use three equal-width columns. Labels can
  wrap within their own column at narrow widths.
- Mobile code blocks reserve a 64px top gutter for the larger copy buttons.
- The generic code block has enough minimum height to contain its button.
- `DESIGN.md` records the control sizes and mobile layout.

Only component CSS changed. Command data, pinned revisions, destination guard,
HTML, keyboard handling and copy scripts are unchanged.

## Checks

The static build passed: eight pages. Headless Chrome checked 1440 × 1000,
390 × 844 and 320 × 844 viewports.

- Tabs and initial copy buttons measured at least 44px in both dimensions.
- Both phone widths showed equal-width agent choices on one row.
- Arrow-key switching, wraparound, selected-panel semantics and keyboard
  focus passed. The focus outline remained 3px.
- Touch selection was exercised on both phone widths.
- Nine installation copies and twelve shared code/JSON copies matched their
  displayed data through the real clipboard API.
- Mobile code scrolled inside its block and cleared the copy button by at
  least 8px. No horizontal page overflow occurred.
- With JavaScript disabled, the tablist stayed hidden and all three named
  installation panels and commands remained visible.
- A simulated clipboard denial showed “Select and copy” for both component
  types, with the larger button area retained.
- No browser page errors or non-GET requests occurred.
- The four captures below were visually reviewed.
- The temporary preview server was stopped and port 4383 was cleared.

## Limits

These are local browser checks. No installation command was executed,
model called or form submitted. The prior dimensions were a touch-comfort
finding, not an established WCAG 2.2 AA minimum-target failure.

## Captures

- [Installation, mobile with keyboard focus](install-mobile.png)
- [Installation, desktop with keyboard focus](install-desktop.png)
- [Copy JSON, mobile](json-mobile.png)
- [Copy JSON, desktop](json-desktop.png)
