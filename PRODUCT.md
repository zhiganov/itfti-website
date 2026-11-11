# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Astro, static output. Deployed to Netlify (the workspace default for non-Harmonica static sites); the domain `itfti.org` has its DNS on Cloudflare, so the site record there must be DNS-only, not proxied, so Netlify owns the certificate.

## Users

Two audiences, equally weighted (confirmed by Artem, 2026-11-10):

- **Builders:** developers, maintainers and independent builders who already use AI agents, plus community organisers, small teams and facilitators. Their job: find where their skills could be useful, develop shared work, learn what difference it makes, and explain what would help it continue. Many projects stall before they work out how to reach funding.
- **Funders:** grant programmes and funders who want fewer unsuitable applications and clearer communication of what they support.

## Product Purpose

ItFtI joins two projects by Artem Zhiganov:

- **Impact to Funding (ItF):** an open-source skill for your AI agent (Codex CLI, Claude Code, OpenCode). It helps people explore where their skills could be useful, develop shared work, learn what difference the work makes, and explain what would help it continue. Start from your situation; no theory of change, project, evidence or fundraising goal is needed. Repo: https://github.com/zhiganov/impact-to-funding
- **Funding to Impact (FtI):** a file format for funders (`fti-manifest.json`, draft 0.1) plus an MCP server. Funders publish their priorities, eligibility, support, availability, process, evidence expectations and freshness in a file that people and agents can read, before anyone spends time applying. Inspired by llms.txt; each opportunity is a CommonGrants record inside the file. The goal is funder adoption (Artem, 2026-11-11).

The site exists to explain both halves and how they meet: builders describe their work and needs; funders describe what they support.

## Positioning

One loop from both ends. ItF works from the builder's side (impact → funding); FtI works from the funder's side (funding → impact). The name ItFtI is the two joined.

## Operating Context

- ItF is installed into the agent the person already uses and invoked there (`$impact-to-funding` in Codex, `/impact-to-funding` in Claude Code, `@impact-to-funding` in OpenCode). Installation guide: `docs/install.md` in the ItF repo.
- ItF releases are prereleases; updates are announced on its GitHub releases page.

## Capabilities and Constraints

- **ItF is experimental v0.** It offers conversation, optional templates and reference material. It does not find collaborators, provide funding or certify impact. Its usefulness and its effect on raising money have not been tested. The site must not claim otherwise.
- **FtI is at draft 0.1.** The file format has executable schemas and a validator; the MCP server has four read-only tools (`find_funders`, `search_opportunities`, `get_entry`, `registry_info`). Both run locally and were tested with fictional data. Import adapters are planned. No hosted service, and no funder has adopted it yet. Describe FtI as a format looking for its first funders, never as just an idea (Artem, 2026-11-11), and never claim adoption.
- **ItF has an optional local MCP server** over its reference library: `search_references`, `get_reference`, `library_info`; Node.js 22+.
- ItF code is MIT; ItF's original written content is CC BY-SA 4.0.
- Undecided: whether the site covers the guilds concept (draft note in the ItF repo); any contact or sign-up route; analytics.

## Brand Commitments

- Name: **ItFtI** (I-t-F-t-I). Domain: itfti.org.
- Logo: `logo/itfti-seal.svg` (and `logo/itfti-seal-2048.png`): a hand-stamped red seal whose letters I, t, F, t, I form the walls of a maze, with an entrance at the bottom and an exit at the top. Ink red `#890405`. Binding style reference for the site (Artem, 2026-11-10).
- The maze is the metaphor: the search for support is a maze, and many projects get lost before they find their way to funding.
- Voice: short, plain sentences; state limits honestly; no hype.

## Evidence on Hand

- The two READMEs above, the ItF install guide and examples (synthetic and illustrative only, never evidence about real people).
- No users, testimonials, metrics, funder partners or case studies exist. Do not fabricate any.

## Product Principles

1. Honest about status: experimental and draft work is labelled as such, everywhere.
2. Start from the person's situation, not a funding goal.
3. Both sides of the loop get equal standing.
4. Reuse existing standards before inventing new ones.
5. No action without the person's say-so.
