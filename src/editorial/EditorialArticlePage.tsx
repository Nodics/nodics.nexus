import { useEffect, useState } from 'react';
import {
  getEditorialArticle,
  type NexusEditorialArticle,
} from '../api/editorialApi';
import { NodicsApiError } from '../api/nodicsClient';
import type {
  NexusHostMapping,
  NexusRuntimeConfig,
} from '../runtime/runtimeConfig';
import { nexusLocaleHref } from '../runtime/nexusUi';
import { EditorialArticleView } from './EditorialArticleView';
import type { editorialDetailRoute } from './editorialRoutes';

const messages = {
  en: {
    blogs: 'Back to blogs',
    news: 'Back to news',
    opening: 'Opening article…',
    missing: 'This article is not available.',
    invalid: 'This article cannot be opened.',
    unavailable: 'Articles are temporarily unavailable.',
    missingDetail:
      'It may have been withdrawn or may not be published for this website and language.',
    retryDetail: 'Please try again shortly.',
    retry: 'Try again',
  },
  ar: {
    blogs: 'العودة إلى المدونة',
    news: 'العودة إلى الأخبار',
    opening: 'جارٍ فتح المقال…',
    missing: 'هذا المقال غير متاح.',
    invalid: 'يتعذر فتح هذا المقال.',
    unavailable: 'المقالات غير متاحة مؤقتًا.',
    missingDetail: 'ربما تم سحب المقال أو لم يُنشر لهذا الموقع وبهذه اللغة.',
    retryDetail: 'يرجى المحاولة مرة أخرى بعد قليل.',
    retry: 'حاول مرة أخرى',
  },
} as const;

type Route = NonNullable<ReturnType<typeof editorialDetailRoute>>;
type State = { identity: string } & (
  | { status: 'ready'; article: NexusEditorialArticle }
  | { status: 'missing' | 'unavailable' | 'invalid' }
);

/** Reads only the published Editorial owner for a host-bound public article route. */
export function EditorialArticlePage({
  config,
  mapping,
  route,
}: {
  readonly config: NexusRuntimeConfig;
  readonly mapping: NexusHostMapping;
  readonly route: Route;
}) {
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState<State>();
  const { slug, contentTypeCode, listingPath } = route;
  const identity = JSON.stringify([
    config.endpoints.editorial,
    config.enterpriseCode,
    mapping.siteCode,
    config.defaultLocale,
    config.channel,
    slug,
    contentTypeCode,
    attempt,
  ]);
  useEffect(() => {
    const controller = new AbortController();
    void getEditorialArticle({
      baseUrl: config.endpoints.editorial ?? '',
      enterpriseCode: config.enterpriseCode,
      timeoutMs: config.requestTimeoutMs,
      siteCode: mapping.siteCode,
      localeCode: config.defaultLocale,
      channel: config.channel,
      slug,
      signal: controller.signal,
    })
      .then((article) => {
        if (controller.signal.aborted) return;
        if (
          !article?.articleCode ||
          article.siteCode !== mapping.siteCode ||
          article.localeCode !== config.defaultLocale ||
          article.slug !== slug ||
          article.contentTypeCode !== contentTypeCode ||
          !article.title ||
          !article.body
        ) {
          setState({ identity, status: 'invalid' });
          return;
        }
        setState({ identity, status: 'ready', article });
      })
      .catch((error: unknown) => {
        if (!controller.signal.aborted)
          setState({
            identity,
            status:
              error instanceof NodicsApiError && error.status === 404
                ? 'missing'
                : 'unavailable',
          });
      });
    return () => controller.abort();
  }, [config, mapping, slug, contentTypeCode, identity]);
  const current = state?.identity === identity ? state : undefined;
  const arabic = config.defaultLocale.split('-')[0]?.toLowerCase() === 'ar';
  const copy = arabic ? messages.ar : messages.en;
  const direction = arabic ? 'rtl' : 'ltr';
  const backLabel = contentTypeCode === 'BLOG' ? copy.blogs : copy.news;
  if (!current)
    return (
      <section
        className="page-state"
        role="status"
        lang={config.defaultLocale}
        dir={direction}
      >
        {copy.opening}
      </section>
    );
  if (current.status !== 'ready')
    return (
      <section
        className="page-state page-state-service"
        role="alert"
        lang={config.defaultLocale}
        dir={direction}
      >
        <div className="service-state-panel">
          <h1>{copy[current.status]}</h1>
          <p>
            {current.status === 'missing'
              ? copy.missingDetail
              : copy.retryDetail}
          </p>
          {current.status !== 'missing' ? (
            <button
              className="button button-primary"
              onClick={() => setAttempt((value) => value + 1)}
            >
              {copy.retry}
            </button>
          ) : null}
          <a
            className="button button-secondary"
            href={nexusLocaleHref(listingPath, config.defaultLocale)}
          >
            {backLabel}
          </a>
        </div>
      </section>
    );
  return (
    <EditorialArticleView
      locale={config.defaultLocale}
      cmsBaseUrl={config.endpoints.cms}
      article={{
        ...current.article,
        bodyText: current.article.body,
        href: nexusLocaleHref(listingPath, config.defaultLocale),
        linkLabel: backLabel,
      }}
    />
  );
}
