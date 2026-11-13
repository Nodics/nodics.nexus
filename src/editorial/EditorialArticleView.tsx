import { useState } from 'react';
import { nexusUi } from '../runtime/nexusUi';
import { mediaImageSource } from '../cms/referenceImages';
import {
  items,
  safeHref,
  strings,
  text,
} from '../cms/renderers/propertyReaders';

type Article = Record<string, unknown>;

function FeaturedImage({
  source,
  alt,
  arabic,
}: {
  readonly source: string;
  readonly alt: string;
  readonly arabic: boolean;
}) {
  const [failed, setFailed] = useState(false);
  return (
    <figure className="editorial-detail-media">
      {failed ? (
        <figcaption className="editorial-media-unavailable" role="status">
          {arabic ? 'الصورة المميزة غير متاحة.' : 'Featured image unavailable.'}
          {alt ? <span>{alt}</span> : null}
        </figcaption>
      ) : (
        <img
          src={source}
          alt={alt}
          loading="lazy"
          onError={() => setFailed(true)}
        />
      )}
    </figure>
  );
}

/** Safe public presentation shared by CMS detail components and Editorial route delivery. */
export function EditorialArticleView({
  article: p,
  cmsBaseUrl,
  locale = 'en',
}: {
  readonly article: Article;
  readonly cmsBaseUrl?: string | undefined;
  readonly locale?: string | undefined;
}) {
  const ui = nexusUi(locale);
  const kind = text(p, 'contentTypeCode');
  const kindLabel =
    kind === 'NEWS' ? ui.news : kind === 'BLOG' ? ui.blog : kind;
  const source = mediaImageSource(text(p, 'referenceImageCode'), cmsBaseUrl);
  const tags = strings(p, 'tags').slice(0, 6);
  const sections = items<Article>(p, 'sections');
  const takeaways = strings(p, 'takeaways');
  const href = safeHref(text(p, 'href'));
  const date = text(p, 'date') || text(p, 'publishedAt');
  const parsedDate = Date.parse(date);
  const dateLabel = Number.isFinite(parsedDate)
    ? new Intl.DateTimeFormat(locale, {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }).format(new Date(parsedDate))
    : date;
  const bodyParagraphs = text(p, 'bodyText')
    .split(/\n{2,}/u)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
  return (
    <article
      className="editorial-detail editorial-detail-page"
      lang={locale}
      dir={
        ['ar', 'fa', 'he', 'ur'].includes(locale.split('-')[0]!) ? 'rtl' : 'ltr'
      }
    >
      <div className="editorial-detail-shell">
        <div className="editorial-detail-main">
          <div className="editorial-card-meta">
            <span>{kindLabel}</span>
            {text(p, 'category') ? <span>{text(p, 'category')}</span> : null}
            {dateLabel ? <span>{dateLabel}</span> : null}
          </div>
          <h1>{text(p, 'title')}</h1>
          <p className="editorial-summary">{text(p, 'summary')}</p>
          {source ? (
            <FeaturedImage
              key={source}
              source={source}
              alt={text(p, 'imageAlt')}
              arabic={locale.split('-')[0]?.toLowerCase() === 'ar'}
            />
          ) : null}
          {bodyParagraphs.length ? (
            <div className="editorial-body">
              {bodyParagraphs.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>
          ) : null}
          {sections.length ? (
            <div className="editorial-detail-sections">
              {sections.map((section, index) => (
                <section key={`${text(section, 'title')}-${index}`}>
                  <span>{String(index + 1).padStart(2, '0')}</span>
                  <div>
                    <h2>{text(section, 'title')}</h2>
                    <p>{text(section, 'body')}</p>
                  </div>
                </section>
              ))}
            </div>
          ) : null}
          {tags.length ? (
            <div className="editorial-card-tags editorial-detail-tags">
              {tags.map((tag) => (
                <span key={tag}>{tag}</span>
              ))}
            </div>
          ) : null}
          {href ? (
            <a className="editorial-detail-back" href={href}>
              {text(p, 'linkLabel', 'Back to listing')}
            </a>
          ) : null}
        </div>
        <aside className="editorial-detail-meta-panel">
          <p className="eyebrow">{kindLabel}</p>
          <dl>
            {text(p, 'category') ? (
              <div>
                <dt>{ui.rtl ? 'الفئة' : 'Category'}</dt>
                <dd>{text(p, 'category')}</dd>
              </div>
            ) : null}
            {dateLabel ? (
              <div>
                <dt>{ui.rtl ? 'تاريخ النشر' : 'Published'}</dt>
                <dd>{dateLabel}</dd>
              </div>
            ) : null}
            {text(p, 'author') ? (
              <div>
                <dt>{ui.rtl ? 'الكاتب' : 'Owner'}</dt>
                <dd>{text(p, 'author')}</dd>
              </div>
            ) : null}
          </dl>
          {takeaways.length ? (
            <div className="editorial-takeaways">
              <b>{ui.rtl ? 'أهم النقاط' : 'Key takeaways'}</b>
              <ul>
                {takeaways.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          ) : null}
        </aside>
      </div>
    </article>
  );
}
