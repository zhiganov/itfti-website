---
name: ItFtI
description: One red seal impression on near-white paper. Impact to Funding and Funding to Impact, joined.
colors:
  seal-red: "#890405"
  seal-red-deep: "#5e0203"
  red-wash: "#f0e4e2"
  paper: "#f7f5f2"
typography:
  display:
    fontFamily: "Zilla Slab, Rockwell, Roboto Slab, serif"
    fontSize: "clamp(2.2rem, 1.5rem + 3vw, 4.6rem)"
    fontWeight: 700
    lineHeight: 1
    letterSpacing: "-0.01em"
  headline:
    fontFamily: "Zilla Slab, Rockwell, Roboto Slab, serif"
    fontSize: "clamp(1.6rem, 1.3rem + 1.3vw, 2.4rem)"
    fontWeight: 700
    lineHeight: 1
    letterSpacing: "-0.01em"
  title:
    fontFamily: "Zilla Slab, Rockwell, Roboto Slab, serif"
    fontSize: "clamp(1.25rem, 1.1rem + 0.6vw, 1.6rem)"
    fontWeight: 700
    lineHeight: 1
    letterSpacing: "-0.01em"
  body:
    fontFamily: "Libre Franklin, system-ui, sans-serif"
    fontSize: "clamp(1rem, 0.96rem + 0.2vw, 1.125rem)"
    fontWeight: 400
    lineHeight: 1.55
  label:
    fontFamily: "Libre Franklin, system-ui, sans-serif"
    fontSize: "11px"
    fontWeight: 600
    letterSpacing: "0.06em"
  footer-display:
    fontFamily: "Zilla Slab, Rockwell, Roboto Slab, serif"
    fontSize: "clamp(3rem, 6.8vw, 6rem)"
    fontWeight: 700
    lineHeight: 1.02
  footer-display-phone:
    fontFamily: "Zilla Slab, Rockwell, Roboto Slab, serif"
    fontSize: "clamp(2.4rem, 9vw, 4rem)"
    fontWeight: 700
    lineHeight: 1.02
  footer-wordmark:
    fontFamily: "Zilla Slab, Rockwell, Roboto Slab, serif"
    fontSize: "4rem"
    fontWeight: 700
    lineHeight: 1
  footer-note:
    fontFamily: "Libre Franklin, system-ui, sans-serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.6
rounded:
  none: "0px"
spacing:
  page-gutter: "clamp(20px, 5vw, 88px)"
  grid-gap: "36px"
components:
  slab:
    backgroundColor: "{colors.seal-red}"
    textColor: "{colors.paper}"
    typography: "{typography.title}"
    rounded: "{rounded.none}"
    padding: "0.6em 1.05em 0.65em"
  slab-hover:
    backgroundColor: "{colors.seal-red-deep}"
    textColor: "{colors.paper}"
  slab-ghost:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.seal-red}"
    typography: "{typography.title}"
    rounded: "{rounded.none}"
  slab-ghost-hover:
    backgroundColor: "{colors.seal-red}"
    textColor: "{colors.paper}"
  letter-block:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.seal-red}"
    rounded: "{rounded.none}"
    size: "52px"
  letter-block-current:
    backgroundColor: "{colors.seal-red}"
    textColor: "{colors.paper}"
  inline-code:
    backgroundColor: "{colors.red-wash}"
    textColor: "{colors.seal-red}"
    rounded: "{rounded.none}"
---

# Design System: ItFtI

## Overview

**Creative North Star: "The Seal Walked"**

The site is one impression of the ItFtI seal. The seal itself is the only frame: it leads the home page at full size, and nothing else on the page is boxed in red. Its language carries through in thick red rules, framed letter blocks and filled slab buttons.

There is one ink and one paper. The page is red on near-white; the shared footer reverses that same pair into paper on red. Shape is square. Depth is flat. The real seal logo is the focal image on the home page.

Status is told by line form, not by colour or badges. A solid rule means it is built and usable today. A dashed rule means a draft not yet adopted, or something planned.

**Key Characteristics:**
- One ink, one paper, no second colour.
- The seal is the only frame; no border around the viewport.
- Slab serif headlines, plain sans body.
- Square corners, thick rules, no shadows for depth.
- One fixed 12-column grid on every page.
- Navigation is the name: I, t, F, t, I.

## Colors

One red on one paper. Tints are not used except for a code wash.

### Primary
- **Seal Red** (#890405): all text, rules, borders and button fills. The only ink.
- **Deep Seal Red** (#5e0203): hover state for links and filled slabs only.

### Neutral
- **Seal Paper** (#f7f5f2): page ground, and text on red fills.
- **Red Wash** (#f0e4e2): background of inline `code` only.

### Named Rules
**The One Ink Rule.** Seal red and paper are the whole palette. The shared footer reverses them into paper on red. Do not add a second colour, a grey, or a gradient.

**The No Texture Rule.** Do not imitate ink bleed, stamp grain or paper texture. The seal is the real asset; the page does not fake its material.

**The Line Form Rule.** Status is carried by rule style. Solid 8px rule: built and usable today. Dashed 8px rule: draft not yet adopted, or planned. Never use colour or a badge for status.

## Typography

**Display Font:** Zilla Slab 500 and 700 (with Rockwell, Roboto Slab, serif)
**Body Font:** Libre Franklin 400, 500, 600 (with system-ui, sans-serif)
**Label/Mono Font:** system monospace stack, only for code.

**Character:** A sturdy slab like a stamped block, set against a calm grotesque. The slab carries the seal's weight.

### Hierarchy
- **Display** (700, 2.2rem to 4.6rem fluid, 1): the h1 only.
- **Headline** (700, 1.6rem to 2.4rem fluid, 1): h2 section heads.
- **Title** (700, 1.25rem to 1.6rem fluid, 1): h3, lane heads, button text, lead lines. Zilla Slab 500 at 1.3 line height is used for the large pull sentence.
- **Body** (400, 1rem to 1.125rem fluid, 1.55): paragraphs and lists, capped at 68ch.
- **Label** (600, 11px, 0.06em, uppercase): always-visible letter-navigation captions. On phones, use 14px sentence-case destination labels with no added tracking.

### Named Rules
**The Slab Heads Rule.** Headings are Zilla Slab 700, tight at line-height 1, balanced wrap. Body is never slab.

**The No Kicker Rule.** No small caps label above a heading.

## Layout

A fixed 12-column grid with a fluid gap (16px to 36px) is shared by all pages. Only content changes. The home hero places the seal in columns 1 to 6 and copy in 7 to 12. Section heads sit in columns 1 to 4 (sticky) with the body in 5 to 12. At 900px and below, everything stacks to one column with a 28px row gap.

Pages are laid out as courses: stacked bands with 48px to 88px vertical padding, divided by a 4px red rule. The page gutter is 20px to 88px (5vw). Content stops at 1600px wide and centres.

Tables and definition lists use 2px red row rules and tabular numerals.

## Elevation & Depth

Flat. No box-shadows at all. Depth comes from thick rules and filled blocks. Hover changes fill, not elevation. Active slabs move 1px down.

### Named Rules
**The Flat Slab Rule.** Surfaces never lift. Weight is shown with rule thickness (2px, 4px, 8px).

## Shapes

Square. Radius is 0 everywhere. Borders are 2px (rows), 3px to 4px (blocks, frames, ghost buttons) and 8px (status rules, two-sided panels). Dashed is used only for draft or planned status.

## Components

### Buttons
- **Slab:** filled seal red, paper text, Zilla Slab 700 at title size, padding 0.6em 1.05em 0.65em, no radius. Hover fills deep red. Active moves down 1px. One primary slab per view.
- **Slab ghost:** paper ground, 4px red border, red text. Hover inverts to a red fill with paper text. Used for the second action.
- Transitions are 0.25s with an ease-out curve (cubic-bezier(0.16, 1, 0.3, 1)).

### Links
Red, 2px underline, 0.2em offset. Hover is deep red. Focus is a 3px red outline with a 4px offset.

### Inline code
Red Wash ground, monospace at 0.9em, small padding, no radius.

### Navigation (Letter Nav)
Five framed blocks spell I, t, F, t, I. Each is 52px square, with a 4px red border and Zilla Slab 700 at 30px. The current page is filled red with paper text. Hover fills too. Destination captions are always visible below the blocks. The site name "itfti.org" sits at the opposite end. On phones the blocks are 44px with a 3px border, and five equal columns show the concise labels Home, Builders, The loop, Funders and Status. Every anchor has a persistent accessible name containing both its concise label and full destination name where these differ; hiding a responsive caption must not remove that name. Navigation uses ordinary links and works without JavaScript.

### Install Commands
A tab per agent (Claude Code, Codex CLI, OpenCode) as 4px-bordered slab tabs, the selected one filled. Each panel shows the exact shell command from the ItF installation guide on the Red Wash ground with a filled Copy button, then the command to type in the agent. Without JavaScript all three panels show in sequence. Code scrolls sideways on phones rather than wrapping.

### Status Lane
A heading link over a short line, topped by an 8px rule: solid for ItF, dashed for FtI.

### Shared Footer
The close is a full-width seal-red field, outside the inset page wrapper, with paper text and generous spacing. A seven-column oversized statement sits opposite CIBC's four-column introduction; the same 12-column grid and gutters remain. At 900px and below, these stack in reading order. A lower ruled course carries the ItFtI wordmark and the builder, funder and organisation-needs links. Licence notes and the seal explanation close the section; there is no personal byline.

Footer display type uses its own local roles above, not a larger global heading scale: 3–6rem on desktop and 2.4–4rem on phones, with 14px secondary notes. The support action is a square paper slab with red text; paper focus outlines remain visible against the field. All ordinary footer links inherit paper, including hover, and selection reverses to red on paper. No new colour, shadow, texture, raster asset or client script is introduced.

## Do's and Don'ts

### Do:
- **Do** use only #890405 on #f7f5f2, with #5e0203 for hover.
- **Do** mark what is built with a solid 8px rule, and drafts or planned work with a dashed 8px rule.
- **Do** use the real seal logo asset as the focal image.
- **Do** keep every page on the shared 12-column grid.
- **Do** keep corners square and depth flat.
- **Do** let the seal be the only frame on the page.
- **Do** keep copy honest about status: ItF is experimental; FtI is draft 0.1 with no funder adoption yet.

### Don't:
- **Don't** add a second colour, grey ramp, tint or gradient.
- **Don't** imitate ink texture, bleed or paper grain.
- **Don't** put a kicker or eyebrow label above a heading.
- **Don't** use cards, rounded corners or soft shadows.
- **Don't** use colour or badges to show status.
- **Don't** redraw the seal by hand. Use the traced asset.
