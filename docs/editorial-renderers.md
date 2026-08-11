# Editorial renderer extension guide

Nexus provides nine allow-listed renderer keys: listing, card, detail, featured, latest, taxonomy, author, related, and series. They consume only sanitized properties delivered through CMS component contracts and never execute backend-provided markup, scripts, imports, or event handlers.

A customer adds a replacement by implementing a focused React component, registering a project-owned logical key in the local renderer registry, and contributing the matching CMS type-code and renderer-mapping records from the customer backend data pack. Editorial data, workflow, publication, permissions, and delivery filtering remain backend-owned.

The Kickoff `nexusData` module demonstrates standard listing and detail pages. Its structured source is authoritative; regenerate the content pack after changes.
