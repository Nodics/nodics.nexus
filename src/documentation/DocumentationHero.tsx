/** Shared documentation shell; article titles and summaries remain CMS-owned. */
export function DocumentationHero({
  title,
  summary,
}: {
  readonly title: string;
  readonly summary: string;
}) {
  return (
    <section className="secondary-page-hero docs-detail-hero">
      <img
        src="/assets/nodics/docs-hero.png"
        alt="Nodics documentation workspace"
      />
      <div className="secondary-page-hero-shade" aria-hidden="true" />
      <div className="secondary-page-hero-copy">
        <p className="eyebrow">Nodics Wiki</p>
        <h1>{title}</h1>
        <nav className="secondary-page-breadcrumbs" aria-label="Breadcrumb">
          <a href="/">Home</a>
          <span>›</span>
          <a href="/docs">Wiki</a>
          <span>›</span>
          <strong>{title}</strong>
        </nav>
        <p>{summary}</p>
      </div>
    </section>
  );
}
