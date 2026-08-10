# Nodics Nexus

Nodics Nexus is the public React frontend for the Nodics corporate website and,
later, the demonstration commerce experience. The initial release serves only
`nexusCorporateSite` locally and renders backend-owned WCMS content through an
allowlisted component registry.

## Local startup

Start the Kickoff WCMS server, import the `nexusData` core content release, and
then run Nexus:

```bash
cd ../nodics.kickoff
npm run start:wcms

cd ../nodics.nexus
npm ci
npm run dev
```

Open <http://localhost:3200>. Public runtime configuration is generated as
`/nexus-config.json` and contains no secrets. Unknown hosts fail closed.

## Corporate scope

The homepage contains Hero, About, Why Nodics, Platform, Technology,
Developers, GitHub/Open Source, Ecosystem/Partners, Testimonials, and Contact.
Additional routes cover About, Platform, Developers, Ecosystem, Testimonials,
Contact, Privacy, Terms, and Cookies. Documentation is linked at
`docs.nodics.in`; Wiki, News, Blogs, and demo commerce are intentionally
excluded.

## Verify

```bash
npm run verify
```

CMS owns content and publication. Nexus owns only executable renderers and safe
browser behavior. Partners customize content through a later backend project
module and customize presentation through a new allowlisted renderer without
copying CMS authority into the browser.
