import { useEffect, useState } from 'react';
import {
  listEditorialArticles,
  type NexusEditorialArticle,
} from '../api/editorialApi';
import { nexusLocaleHref } from '../runtime/nexusUi';
import { editorialDetailRoute } from './editorialRoutes';
import type {
  NexusHostMapping,
  NexusRuntimeConfig,
} from '../runtime/runtimeConfig';

type Listing = { articles: readonly NexusEditorialArticle[] } | 'unavailable';

/** Opens the Online Editorial listing when the host has no CMS listing for this locale. */
export function EditorialListingPage({
  config,
  mapping,
  contentType,
}: {
  readonly config: NexusRuntimeConfig;
  readonly mapping: NexusHostMapping;
  readonly contentType: 'BLOG' | 'NEWS';
}) {
  const [result, setResult] = useState<{
    identity: string;
    listing: Listing;
  }>();
  const [attempt, setAttempt] = useState(0);
  const identity = JSON.stringify([
    config,
    mapping.siteCode,
    contentType,
    attempt,
  ]);
  const blog = contentType === 'BLOG';
  const arabic = config.defaultLocale.split('-')[0]?.toLowerCase() === 'ar';
  const base = blog ? '/blog/' : '/news/';
  const listing = result?.identity === identity ? result.listing : undefined;
  useEffect(() => {
    const controller = new AbortController();
    void listEditorialArticles({
      baseUrl: config.endpoints.editorial ?? '',
      enterpriseCode: config.enterpriseCode,
      timeoutMs: config.requestTimeoutMs,
      siteCode: mapping.siteCode,
      localeCode: config.defaultLocale,
      channel: config.channel,
      contentTypeCode: contentType,
      limit: 48,
      signal: controller.signal,
    })
      .then((articles) => {
        if (controller.signal.aborted) return;
        setResult({
          identity,
          listing: {
            articles: articles.filter(
              (article) =>
                article.siteCode === mapping.siteCode &&
                article.localeCode === config.defaultLocale &&
                article.contentTypeCode === contentType &&
                article.articleCode &&
                article.title &&
                article.slug &&
                editorialDetailRoute(base + encodeURIComponent(article.slug)),
            ),
          },
        });
      })
      .catch(() => {
        if (!controller.signal.aborted)
          setResult({ identity, listing: 'unavailable' });
      });
    return () => controller.abort();
  }, [base, config, contentType, identity, mapping.siteCode]);

  return (
    <section
      className="editorial-section editorial-index"
      lang={config.defaultLocale}
      dir={arabic ? 'rtl' : 'ltr'}
    >
      <div className="section-wrap">
        <h1>
          {arabic ? (blog ? 'المدونة' : 'الأخبار') : blog ? 'Blogs' : 'News'}
        </h1>
        {listing === undefined ? (
          <p role="status">
            {arabic ? 'جارٍ تحميل المقالات…' : 'Loading articles…'}
          </p>
        ) : listing === 'unavailable' ? (
          <div className="editorial-empty-state" role="alert">
            <p>
              {arabic
                ? 'المقالات غير متاحة مؤقتًا.'
                : 'Articles are temporarily unavailable.'}
            </p>
            <button
              type="button"
              className="button button-primary"
              onClick={() => setAttempt((value) => value + 1)}
            >
              {arabic ? 'حاول مرة أخرى' : 'Try again'}
            </button>
          </div>
        ) : listing.articles.length ? (
          <div className="editorial-grid editorial-grid-grid">
            {listing.articles.map((article) => (
              <article key={article.articleCode} className="editorial-card">
                <div className="editorial-card-copy">
                  <h2>
                    <a
                      href={nexusLocaleHref(
                        base + encodeURIComponent(article.slug!),
                        config.defaultLocale,
                      )}
                    >
                      {article.title}
                    </a>
                  </h2>
                  {article.summary ? <p>{article.summary}</p> : null}
                </div>
              </article>
            ))}
          </div>
        ) : (
          <p className="editorial-empty-state">
            {arabic
              ? 'لا توجد مقالات منشورة بهذه اللغة.'
              : 'No articles are published in this language.'}
          </p>
        )}
      </div>
    </section>
  );
}
