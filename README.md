# Nodics Nexus

Nodics Nexus is the public React frontend for the Nodics corporate website and
approved public documentation. It serves `nexusCorporateSite` locally and
renders backend-owned WCMS content through an allowlisted component registry.

## AI tool entry

A beginner user can start from Codex, Claude Code, GitHub Copilot, or another
repository-aware AI coding tool by providing the Nexus GitHub repository URL
directly. The user does not need to run `nodics.installer` first for repository
analysis or source work. The AI tool must read root `AGENTS.md`, then this
README, then the nearest feature README/AGENTS or focused tests before changing
files. Use `nodics.installer` only when creating, repairing, or operating a
local customer workspace that includes Nexus or a customer-named corporate site
derived from Nexus.

## Local startup

Run `npm ci` and `npm run dev` in this repository. Nexus starts independently
of backend services and displays its own service-unavailable/retry state when
Online CMS cannot be reached. Its tests run here with `npm test`.

Start the backend separately. In Axis, initialize Nexus through **Setup &
Accelerators** and approve its immutable Staged publication. Nexus reads only
approved Online content. See [independent Docker startup](docker/README.md).

Open <http://localhost:3200>. Public runtime configuration is generated as
`/nexus-config.json` and contains no secrets. Unknown hosts fail closed.

## Corporate scope

The homepage contains Hero, About, Features, Products, Solutions, Technology,
Support, Testimonials, Blogs, News, GitHub, Ecosystem, and Contact. Products and
Solutions menu links target homepage sections; section calls to action open the
detailed `/products` dashboard and `/solutions` page.
Additional routes cover About, Platform, Developers, Ecosystem, Testimonials,
Contact, Privacy, Terms, and Cookies. Public documentation links resolve to
the approved Online documentation catalogue. Its renderer supports safe inline
links, images, tables and diagrams; source-file links are resolved by the owning
content-pack generator. Authoring-only visual requirements stay in the delivery
metadata. Wiki, News, Blogs, and commerce
accelerator storefronts remain separate journeys.

## Verify

```bash
npm run verify
```

Documentation routes reuse the host site's published CMS header and footer.
Wiki and article banners use the same 390px page-hero styling, image treatment,
typography, and transparent-at-top header as About and Features.
If that host publication is unavailable, published documentation stays readable
without substituting hardcoded navigation. Desktop documentation uses equal-height
navigation and article panels with independent, keyboard-accessible scrolling,
similar to Axis. On narrow screens the article follows the page flow and the
navigation has a bounded scroll area.

CMS owns content and publication. Nexus owns only executable renderers and safe
browser behavior. Partners customize content through backend project modules
and customize presentation through allowlisted renderers without copying CMS
authority into the browser.

The corporate renderer accepts template contracts 0 (current reference data)
and 1 (the earlier frontend contract). Page/component renderers still require
their allowlisted version 1; other template versions remain unsupported.

## Product presentation

`nexus.component.product-portfolio` presents the homepage showcase in compact mode and the `/products` editorial catalogue in dashboard mode. Managed `products` supply titles, descriptions, audiences, capabilities, adoption guidance, safe local detail links, and desktop/mobile Media references. The dashboard filters product entries while retaining the full comparison.

`nexus.component.product-story` renders individual product outcomes, galleries, capabilities, workflows, adoption guidance and FAQs. Both renderers consume WCMS content owned by Kickoff `modules/nexus.web`; they do not load product data from a frontend registry. Unavailable media references render no image, and invalid product destinations do not become navigable links. Customize copy and screenshots in the governed CMS release; customize layout here. Product selectors and galleries support keyboard interaction, and motion respects reduced-motion preferences.

### Solutions presentation

`nexus.component.solutions` renders a visual homepage overview (`mode: overview`)
and an expanded solution page (`mode: detail`). Kickoff `nexus.web` owns the
component copy, entries, flow labels, use cases, scope, delivery steps and links.
The local renderer owns layout and decorative workflow illustrations; these are
concept diagrams, not application screenshots. The expanded view includes the
same workflow labels as readable text. Only `data` selects the data visual;
other values use the operations visual. Entries accept validated anchor IDs and
local links only. Missing arrays render empty, invalid links are omitted, and CMS
values never execute as markup or code. Content customization follows WCMS
Staged publication; presentation changes stay in this focused renderer and CSS.

About links directly to the homepage About section. Features follows it in the
homepage flow and retains its detail page and footer link, without a separate
header item or submenu. About remains active for the Features section/page.
