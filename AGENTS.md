# Nodics Nexus Frontend Contract

- `nodics.nexus` is an independent public frontend. It owns executable React
  renderers, routing presentation, design tokens, accessibility, responsive
  behavior, SEO projection, public runtime configuration, and frontend tests.
- Kickoff `nexusData` owns backend-importable corporate Sites, catalogs, pages,
  components, routes, navigation, and renderer mappings. Do not place those
  records here.
- Consume only trusted, versioned CMS delivery contracts. Renderer keys are
  allowlisted logical identifiers; never execute CMS-provided HTML, CSS,
  JavaScript, URLs, imports, expressions, or event handlers.
- Resolve the Site from a deployment-owned host allowlist. Query parameters,
  paths, storage, or caller content must never select another Site or catalog.
- Keep secrets, credentials, provider paths, signed URLs, business authority,
  and authorization policy out of the browser.
- Preserve the Nodics Axis Gold/Charcoal brand foundation. Motion must respect
  `prefers-reduced-motion`; all interactive controls require keyboard focus and
  accessible names.
- Add a renderer as one focused component and register it in the typed local
  registry. Document its CMS owner, properties, failure behavior, and safe
  customization path.
- News, Blogs, Wiki content, and commerce-demo routes are outside the initial
  corporate release.
