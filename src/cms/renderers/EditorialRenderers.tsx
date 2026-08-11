import type { CmsComponentContract } from '../cmsContract';
import { items, safeHref, text } from './propertyReaders';

type Props = { readonly component: CmsComponentContract };
type Article = Record<string, unknown>;
const articleItems = (component: CmsComponentContract) =>
  items<Article>(component.properties, 'articles').slice(0, 24);
const ArticleCard = ({ article }: { readonly article: Article }) => {
  const href = safeHref(text(article, 'href') || text(article, 'slug'));
  return (
    <article className="editorial-card">
      <p className="eyebrow">{text(article, 'contentTypeCode')}</p>
      <h3>{text(article, 'title')}</h3>
      <p>{text(article, 'summary')}</p>
      {href ? <a href={href}>Read article</a> : null}
    </article>
  );
};
const Listing = ({
  component,
  className = '',
}: Props & { className?: string }) => (
  <section
    className={`editorial-section ${className}`.trim()}
    aria-labelledby={`${component.code}-title`}
  >
    <header className="section-heading">
      <p className="eyebrow">{text(component.properties, 'kicker')}</p>
      <h2 id={`${component.code}-title`}>
        {text(component.properties, 'heading')}
      </h2>
    </header>
    <div className="editorial-grid">
      {articleItems(component).map((article, index) => (
        <ArticleCard
          article={article}
          key={`${text(article, 'code')}-${index}`}
        />
      ))}
    </div>
  </section>
);
export function EditorialListingRenderer(props: Props) {
  return <Listing {...props} />;
}
export function EditorialCardRenderer({ component }: Props) {
  return <ArticleCard article={component.properties} />;
}
export function EditorialFeaturedRenderer(props: Props) {
  return <Listing {...props} className="editorial-featured" />;
}
export function EditorialLatestRenderer(props: Props) {
  return <Listing {...props} className="editorial-latest" />;
}
export function EditorialTaxonomyRenderer(props: Props) {
  return <Listing {...props} className="editorial-taxonomy" />;
}
export function EditorialAuthorRenderer(props: Props) {
  return <Listing {...props} className="editorial-author" />;
}
export function EditorialRelatedRenderer(props: Props) {
  return <Listing {...props} className="editorial-related" />;
}
export function EditorialSeriesRenderer(props: Props) {
  return <Listing {...props} className="editorial-series" />;
}
export function EditorialDetailRenderer({ component }: Props) {
  const p = component.properties;
  return (
    <article className="editorial-detail">
      <p className="eyebrow">{text(p, 'contentTypeCode')}</p>
      <h1>{text(p, 'title')}</h1>
      <p className="editorial-summary">{text(p, 'summary')}</p>
      <div className="editorial-body">{text(p, 'bodyText')}</div>
    </article>
  );
}
