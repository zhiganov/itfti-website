# Impact profile editor and public page

Primary target: `app/src/main.js`
Related targets: `app/src/styles.css`, `app/index.html`
Mode: Operate (editor); Read (public profile).

The first user wants to publish their own impact profile, using their ATProto
account and public Bluesky identity. Publication always follows an explicit
review of the public content.

## Direction contract

THESIS: Put the person and their work first. Editing leads to a separate,
explicit public-content review; a draft is never mistaken for a saved record.
OWN-WORLD: Inherit ItFtI's seal-red ink, paper ground, slab heads, square
controls and ruled sections. The public profile reads like a short personal
account, not a ranking dashboard.
STORY: Sign in, describe work, review the exact public record, publish, and
return to edit or unpublish. Visitors read without an account.
FIRST VIEWPORT: Compact site header; one task heading; identity and ownership
context next to the editor on desktop, stacked before it on mobile. The public
page leads with the person's name and work summary.
FORM: A constrained extension of the existing publishing surfaces, using the
approved editor/preview flow and established visual system. No identity change.
No concept roll was run. This records the implementation's actual provenance;
it does not claim a generated seed or a user-pinned composition.
FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
