import { useEffect, useMemo, useState } from 'react';

import {
  getEditorialArticle,
  listEditorialArticles,
  type NexusEditorialArticle,
} from '../../api/editorialApi';
import { useOptionalNexusRuntimeConfig } from '../../runtime/NexusRuntimeConfigContext';
import { mediaImageSource } from '../referenceImages';
import type { CmsComponentContract } from '../cmsContract';
import { items, safeHref, strings, text } from './propertyReaders';

type Props = { readonly component: CmsComponentContract };
type Article = Record<string, unknown>;
type ViewMode = 'grid' | 'list';
type SortMode = 'latest' | 'oldest' | 'title';

const articleItems = (component: CmsComponentContract) =>
  items<Article>(component.properties, 'articles').slice(0, 48);

function listingHref(article: NexusEditorialArticle): string | undefined {
  if (!article.slug) return article.href;
  return article.contentTypeCode === 'BLOG'
    ? `/blog/${article.slug}`
    : `/news/${article.slug}`;
}

function articleSlug(article: Article): string {
  const href = text(article, 'href');
  return text(article, 'slug') || href.split('/').filter(Boolean).at(-1) || '';
}

function mergeLiveArticle(
  liveArticle: NexusEditorialArticle,
  staticArticles: readonly Article[],
): Article {
  const liveSlug = liveArticle.slug || '';
  const staticArticle =
    staticArticles.find(
      (article) =>
        (liveArticle.articleCode &&
          text(article, 'code') === liveArticle.articleCode) ||
        (liveSlug && articleSlug(article) === liveSlug) ||
        (liveArticle.title && text(article, 'title') === liveArticle.title),
    ) || {};

  return {
    ...staticArticle,
    code: liveArticle.articleCode || text(staticArticle, 'code'),
    contentTypeCode:
      liveArticle.contentTypeCode || text(staticArticle, 'contentTypeCode'),
    href: listingHref(liveArticle) || text(staticArticle, 'href'),
    imageAlt: liveArticle.imageAlt || text(staticArticle, 'imageAlt'),
    referenceImageCode:
      liveArticle.referenceImageCode ||
      text(staticArticle, 'referenceImageCode'),
    special: liveArticle.special === true,
    specialFrom: liveArticle.specialFrom || undefined,
    specialLabel:
      liveArticle.specialLabel || text(staticArticle, 'specialLabel'),
    specialRank:
      liveArticle.specialRank ?? numberValue(staticArticle, 'specialRank'),
    specialUntil: liveArticle.specialUntil || undefined,
    specialVariant:
      liveArticle.specialVariant || text(staticArticle, 'specialVariant'),
    slug: liveArticle.slug || text(staticArticle, 'slug'),
    summary: liveArticle.summary || text(staticArticle, 'summary'),
    title: liveArticle.title || text(staticArticle, 'title'),
  };
}

function mergeLiveDetail(
  staticArticle: Article,
  liveArticle: NexusEditorialArticle | undefined,
): Article {
  if (!liveArticle) return staticArticle;
  return {
    ...staticArticle,
    code: liveArticle.articleCode || text(staticArticle, 'code'),
    contentTypeCode:
      liveArticle.contentTypeCode || text(staticArticle, 'contentTypeCode'),
    href: text(staticArticle, 'href') || listingHref(liveArticle),
    imageAlt: liveArticle.imageAlt || text(staticArticle, 'imageAlt'),
    referenceImageCode:
      liveArticle.referenceImageCode ||
      text(staticArticle, 'referenceImageCode'),
    summary: liveArticle.summary || text(staticArticle, 'summary'),
    takeaways: liveArticle.takeaways?.length
      ? liveArticle.takeaways
      : strings(staticArticle, 'takeaways'),
    title: liveArticle.title || text(staticArticle, 'title'),
    ...(liveArticle.body ? { bodyText: liveArticle.body } : {}),
  };
}

function articleDate(article: Article): number {
  const value = text(article, 'date') || text(article, 'publishedAt');
  const time = Date.parse(value);
  return Number.isFinite(time) ? time : 0;
}

function articleTags(article: Article): readonly string[] {
  return strings(article, 'tags');
}

function numberValue(article: Article, key: string, fallback = 0): number {
  const value = article[key];
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
}

function booleanValue(article: Article, key: string): boolean {
  const value = article[key];
  return value === true || value === 'true';
}

function isWithinWindow(article: Article): boolean {
  const now = Date.now();
  const from = text(article, 'specialFrom');
  const until = text(article, 'specialUntil');
  const fromTime = from ? Date.parse(from) : Number.NaN;
  const untilTime = until ? Date.parse(until) : Number.NaN;
  return (
    (!from || (Number.isFinite(fromTime) && fromTime <= now)) &&
    (!until || (Number.isFinite(untilTime) && untilTime >= now))
  );
}

function isSpecialArticle(article: Article): boolean {
  return booleanValue(article, 'special') && isWithinWindow(article);
}

function specialRank(article: Article): number {
  return numberValue(article, 'specialRank', 9999);
}

function articleSearchText(article: Article): string {
  return [
    text(article, 'contentTypeCode'),
    text(article, 'category'),
    text(article, 'title'),
    text(article, 'summary'),
    text(article, 'author'),
    ...articleTags(article),
  ]
    .join(' ')
    .toLowerCase();
}

function displayDate(article: Article): string {
  const value = text(article, 'date') || text(article, 'publishedAt');
  const time = Date.parse(value);
  if (!Number.isFinite(time)) return value;
  return new Intl.DateTimeFormat('en', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(time));
}

const ArticleCard = ({
  cmsBaseUrl,
  article,
  viewMode = 'grid',
}: {
  readonly cmsBaseUrl?: string | undefined;
  readonly article: Article;
  readonly viewMode?: ViewMode;
}) => {
  const href = safeHref(text(article, 'href') || text(article, 'slug'));
  const source = mediaImageSource(
    text(article, 'referenceImageCode'),
    cmsBaseUrl,
  );
  const tags = articleTags(article).slice(0, 4);
  const label = text(article, 'contentTypeCode', 'Article');
  return (
    <article className={`editorial-card editorial-card-${viewMode}`}>
      {source ? (
        <a className="editorial-card-media" href={href || '#'}>
          <img src={source} alt={text(article, 'imageAlt')} loading="lazy" />
          <span>{text(article, 'category', label)}</span>
        </a>
      ) : null}
      <div className="editorial-card-copy">
        <div className="editorial-card-meta">
          <span>{label}</span>
          {displayDate(article) ? <span>{displayDate(article)}</span> : null}
        </div>
        <h3>{text(article, 'title')}</h3>
        <p>{text(article, 'summary')}</p>
        {tags.length ? (
          <div className="editorial-card-tags">
            {tags.map((tag) => (
              <span key={tag}>{tag}</span>
            ))}
          </div>
        ) : null}
        {href ? <a href={href}>Read article</a> : null}
      </div>
    </article>
  );
};

const SpecialBand = ({
  articles,
  cmsBaseUrl,
}: {
  readonly articles: readonly Article[];
  readonly cmsBaseUrl?: string | undefined;
}) =>
  articles.length ? (
    <div className="editorial-special-band" aria-label="Special highlights">
      <div className="editorial-special-intro">
        <span>Special</span>
        <h3>Highlighted by the Nodics team</h3>
        <p>
          Business users can mark important news or blog posts as special from
          Axis. Nexus reads that backend-managed flag and promotes the item
          here.
        </p>
      </div>
      <div className="editorial-special-grid">
        {articles.map((article, index) => (
          <div
            className={`editorial-special-card editorial-special-${text(
              article,
              'specialVariant',
              'gold',
            )}`}
            key={`${text(article, 'code')}-special-${index}`}
          >
            <span className="editorial-special-label">
              {text(article, 'specialLabel', 'Featured')}
            </span>
            <ArticleCard
              article={article}
              cmsBaseUrl={cmsBaseUrl}
              viewMode="list"
            />
          </div>
        ))}
      </div>
    </div>
  ) : null;

const Listing = ({
  component,
  className = '',
}: Props & { className?: string }) => {
  const runtime = useOptionalNexusRuntimeConfig();
  const p = component.properties;
  const staticArticles = useMemo(() => articleItems(component), [component]);
  const contentTypeCode = text(p, 'contentTypeCode');
  const [liveArticles, setLiveArticles] = useState<readonly Article[]>([]);
  const [liveStatus, setLiveStatus] = useState<'idle' | 'ready' | 'failed'>(
    'idle',
  );
  const configuredDefaultView =
    text(p, 'defaultView') === 'list' ? 'list' : 'grid';
  const [viewMode, setViewMode] = useState<ViewMode>(configuredDefaultView);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('all');
  const [sortMode, setSortMode] = useState<SortMode>('latest');
  const cmsBaseUrl = runtime?.config.endpoints.cms;
  const liveListingAvailable = Boolean(
    runtime?.config.endpoints.editorial &&
    runtime.mapping.siteCode &&
    runtime.config.defaultLocale &&
    runtime.config.channel &&
    runtime.config.enterpriseCode &&
    runtime.config.requestTimeoutMs &&
    contentTypeCode,
  );
  useEffect(() => {
    const editorialBaseUrl = runtime?.config.endpoints.editorial;
    const siteCode = runtime?.mapping.siteCode;
    const localeCode = runtime?.config.defaultLocale;
    const channel = runtime?.config.channel;
    const enterpriseCode = runtime?.config.enterpriseCode;
    const requestTimeoutMs = runtime?.config.requestTimeoutMs;
    if (!liveListingAvailable) return undefined;
    const controller = new AbortController();
    listEditorialArticles({
      baseUrl: editorialBaseUrl ?? '',
      channel: channel ?? '',
      contentTypeCode,
      enterpriseCode: enterpriseCode ?? '',
      limit: 48,
      localeCode: localeCode ?? '',
      signal: controller.signal,
      siteCode: siteCode ?? '',
      timeoutMs: requestTimeoutMs ?? 10_000,
    })
      .then((articles) => {
        if (!controller.signal.aborted) {
          setLiveArticles(
            articles.map((article) =>
              mergeLiveArticle(article, staticArticles),
            ),
          );
          setLiveStatus('ready');
        }
      })
      .catch(() => {
        if (!controller.signal.aborted) {
          setLiveArticles([]);
          setLiveStatus('failed');
        }
      });
    return () => controller.abort();
  }, [contentTypeCode, liveListingAvailable, runtime, staticArticles]);
  const articles = useMemo(
    () =>
      liveListingAvailable && liveStatus === 'ready' && liveArticles.length > 0
        ? liveArticles
        : staticArticles,
    [liveArticles, liveListingAvailable, liveStatus, staticArticles],
  );
  const categories = useMemo(
    () =>
      Array.from(
        new Set(
          articles.map((article) => text(article, 'category')).filter(Boolean),
        ),
      ).sort((first, second) => first.localeCompare(second)),
    [articles],
  );
  const visibleArticles = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return articles
      .filter((article) =>
        category === 'all' ? true : text(article, 'category') === category,
      )
      .filter((article) =>
        normalizedQuery
          ? articleSearchText(article).includes(normalizedQuery)
          : true,
      )
      .sort((first, second) => {
        if (sortMode === 'title')
          return text(first, 'title').localeCompare(text(second, 'title'));
        const direction = sortMode === 'oldest' ? 1 : -1;
        return (articleDate(first) - articleDate(second)) * direction;
      });
  }, [articles, category, query, sortMode]);
  const specialArticles = visibleArticles
    .filter(isSpecialArticle)
    .sort((first, second) => {
      const rankDelta = specialRank(first) - specialRank(second);
      return rankDelta || articleDate(second) - articleDate(first);
    });
  const regularArticles = visibleArticles.filter(
    (article) => !isSpecialArticle(article),
  );
  const featuredArticle = regularArticles[0];
  const remainingArticles = regularArticles.slice(1);

  return (
    <section
      className={`editorial-section editorial-index ${className}`.trim()}
      aria-labelledby={`${component.code}-title`}
    >
      <div className="section-wrap">
        <div className="editorial-index-heading">
          <header className="section-heading">
            <p className="eyebrow">{text(p, 'kicker')}</p>
            <h2 id={`${component.code}-title`}>{text(p, 'heading')}</h2>
          </header>
          {text(p, 'body') ? <p>{text(p, 'body')}</p> : null}
        </div>

        <div className="editorial-index-toolbar">
          <label className="editorial-search">
            <span>Search</span>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={text(p, 'searchPlaceholder', 'Search articles')}
              type="search"
            />
          </label>
          <label>
            <span>Category</span>
            <select
              value={category}
              onChange={(event) => setCategory(event.target.value)}
            >
              <option value="all">All categories</option>
              {categories.map((item) => (
                <option value={item} key={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>Sort</span>
            <select
              value={sortMode}
              onChange={(event) => setSortMode(event.target.value as SortMode)}
            >
              <option value="latest">Latest first</option>
              <option value="oldest">Oldest first</option>
              <option value="title">Title A-Z</option>
            </select>
          </label>
          <div className="editorial-view-toggle" aria-label="View mode">
            <button
              className={viewMode === 'grid' ? 'is-active' : ''}
              type="button"
              onClick={() => setViewMode('grid')}
            >
              Grid
            </button>
            <button
              className={viewMode === 'list' ? 'is-active' : ''}
              type="button"
              onClick={() => setViewMode('list')}
            >
              List
            </button>
          </div>
        </div>

        <div className="editorial-index-summary">
          <span>
            {visibleArticles.length}{' '}
            {visibleArticles.length === 1 ? 'item' : 'items'}
          </span>
          <span>{text(p, 'contentTypeCode', 'EDITORIAL')}</span>
        </div>

        <SpecialBand articles={specialArticles} cmsBaseUrl={cmsBaseUrl} />

        {featuredArticle ? (
          <div className="editorial-featured-panel">
            <ArticleCard
              article={featuredArticle}
              cmsBaseUrl={cmsBaseUrl}
              viewMode="list"
            />
          </div>
        ) : (
          <div className="editorial-empty-state">
            <p>
              {text(p, 'emptyMessage', 'No articles matched your filters.')}
            </p>
          </div>
        )}

        {remainingArticles.length ? (
          <div className={`editorial-grid editorial-grid-${viewMode}`}>
            {remainingArticles.map((article, index) => (
              <ArticleCard
                cmsBaseUrl={cmsBaseUrl}
                article={article}
                viewMode={viewMode}
                key={`${text(article, 'code')}-${index}`}
              />
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
};

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
  const runtime = useOptionalNexusRuntimeConfig();
  const [liveArticle, setLiveArticle] = useState<NexusEditorialArticle>();
  const p = mergeLiveDetail(component.properties, liveArticle);
  const source = mediaImageSource(
    text(p, 'referenceImageCode'),
    runtime?.config.endpoints.cms,
  );
  const tags = articleTags(p).slice(0, 6);
  const sections = items<Article>(p, 'sections');
  const takeaways = strings(p, 'takeaways');
  const href = safeHref(text(p, 'href'));
  const bodyParagraphs = text(p, 'bodyText')
    .split(/\n{2,}/u)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
  const liveDetailAvailable = Boolean(
    runtime?.config.endpoints.editorial &&
    runtime.mapping.siteCode &&
    runtime.config.defaultLocale &&
    runtime.config.channel &&
    runtime.config.enterpriseCode &&
    runtime.config.requestTimeoutMs &&
    window.location.pathname.split('/').filter(Boolean).at(-1),
  );
  useEffect(() => {
    const editorialBaseUrl = runtime?.config.endpoints.editorial;
    const siteCode = runtime?.mapping.siteCode;
    const localeCode = runtime?.config.defaultLocale;
    const channel = runtime?.config.channel;
    const enterpriseCode = runtime?.config.enterpriseCode;
    const requestTimeoutMs = runtime?.config.requestTimeoutMs;
    const slug = window.location.pathname.split('/').filter(Boolean).at(-1);
    if (!liveDetailAvailable) return undefined;
    const controller = new AbortController();
    getEditorialArticle({
      baseUrl: editorialBaseUrl ?? '',
      channel: channel ?? '',
      enterpriseCode: enterpriseCode ?? '',
      localeCode: localeCode ?? '',
      signal: controller.signal,
      siteCode: siteCode ?? '',
      slug: slug ?? '',
      timeoutMs: requestTimeoutMs ?? 10_000,
    })
      .then((article) => {
        if (!controller.signal.aborted) setLiveArticle(article);
      })
      .catch(() => {
        if (!controller.signal.aborted) setLiveArticle(undefined);
      });
    return () => controller.abort();
  }, [liveDetailAvailable, runtime]);
  return (
    <article className="editorial-detail editorial-detail-page">
      <div className="editorial-detail-shell">
        <aside className="editorial-detail-meta-panel">
          <p className="eyebrow">{text(p, 'contentTypeCode')}</p>
          <dl>
            {text(p, 'category') ? (
              <div>
                <dt>Category</dt>
                <dd>{text(p, 'category')}</dd>
              </div>
            ) : null}
            {displayDate(p) ? (
              <div>
                <dt>Published</dt>
                <dd>{displayDate(p)}</dd>
              </div>
            ) : null}
            {text(p, 'author') ? (
              <div>
                <dt>Owner</dt>
                <dd>{text(p, 'author')}</dd>
              </div>
            ) : null}
          </dl>
          {takeaways.length ? (
            <div className="editorial-takeaways">
              <b>Key takeaways</b>
              <ul>
                {takeaways.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          ) : null}
        </aside>
        <div className="editorial-detail-main">
          <div className="editorial-card-meta">
            <span>{text(p, 'contentTypeCode', 'Article')}</span>
            {text(p, 'category') ? <span>{text(p, 'category')}</span> : null}
            {displayDate(p) ? <span>{displayDate(p)}</span> : null}
          </div>
          <h1>{text(p, 'title')}</h1>
          <p className="editorial-summary">{text(p, 'summary')}</p>
          {source ? (
            <figure className="editorial-detail-media">
              <img src={source} alt={text(p, 'imageAlt')} loading="lazy" />
            </figure>
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
      </div>
    </article>
  );
}
