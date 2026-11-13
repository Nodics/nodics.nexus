import { useEffect, useState } from 'react';
import {
  CmsPageDeliveryError,
  type CmsPageDeliveryErrorKind,
  resolveCmsPage,
} from '../cms/cmsClient';
import type {
  CmsComponentContract,
  CmsResolvedPageContract,
} from '../cms/cmsContract';
import { CmsComponentRenderer } from '../cms/RendererRegistry';
import { NexusRuntimeConfigContext } from '../runtime/NexusRuntimeConfigContext';
import type {
  NexusHostMapping,
  NexusRuntimeConfig,
} from '../runtime/runtimeConfig';
import { SiteShell } from './SiteShell';
import { PublishedSiteShell } from './PublishedSiteShell';
import { EditorialArticlePage } from '../editorial/EditorialArticlePage';
import { EditorialListingPage } from '../editorial/EditorialListingPage';
import { editorialDetailRoute } from '../editorial/editorialRoutes';
import { siteShellFromPage } from './siteShellContent';

type State =
  | { status: 'loading' }
  | { status: 'ready'; identity: string; page: CmsResolvedPageContract }
  | {
      status: 'failed';
      identity: string;
      kind: CmsPageDeliveryErrorKind;
    };

function fallbackContent(
  kind: CmsPageDeliveryErrorKind,
  path: string,
  arabic = false,
) {
  if (arabic) {
    if (kind === 'service-unavailable')
      return {
        eyebrow: 'الخدمة غير متاحة',
        heading: 'Nexus غير متاح مؤقتًا.',
        body: 'تعذّر الاتصال بالخدمة. يرجى المحاولة بعد قليل.',
        showRetry: true,
      };
    if (kind === 'not-found' && path !== '/')
      return {
        eyebrow: 'الصفحة غير موجودة',
        heading: 'هذه الصفحة غير متاحة.',
        body: 'يمكنك المتابعة من الصفحة الرئيسية.',
        showRetry: false,
      };
    return {
      eyebrow: 'Nodics Nexus',
      heading: 'يجري تجهيز Nexus.',
      body: 'المحتوى غير متاح بهذه اللغة حاليًا. يمكنك العودة إلى الصفحة الرئيسية بالإنجليزية.',
      showRetry: true,
    };
  }
  if (kind === 'service-unavailable')
    return {
      eyebrow: 'Service unavailable',
      heading: 'Nexus is temporarily unavailable.',
      body: 'We cannot reach the service right now. Please try again shortly.',
      showRetry: true,
    };
  if (kind === 'not-found' && path !== '/')
    return {
      eyebrow: 'Page not found',
      heading: 'This Nexus page does not exist.',
      body: 'The page you opened is not available. Please continue from the home page.',
      showRetry: false,
    };
  return {
    eyebrow: 'Nodics Nexus',
    heading: 'We are getting Nexus ready.',
    body: 'The site is not available right now while we complete a content update. Please check back shortly.',
    showRetry: true,
  };
}

function fallbackPageHero(pageName: string): CmsComponentContract {
  const label = pageName.replace(/^Nodics\s+/u, '').trim() || pageName;
  return {
    code: 'nexusFallbackPageHero',
    typeCode: 'nexusPageHeroType',
    active: true,
    renderer: 'nexus.component.page-hero',
    rendererContractVersion: 1,
    rendererChannels: ['web'],
    rendererDeprecated: false,
    slot: 'main',
    index: -1,
    components: [],
    properties: {
      kicker: 'Nodics Nexus',
      heading: pageName,
      breadcrumbLabel: label,
      body: 'Explore this Nodics Nexus section through the same connected enterprise experience.',
      referenceImageCode: 'nodicsAboutArchitecture',
      imageAlt:
        'Enterprise architects shaping a connected modular Nodics platform',
    },
  };
}

function isSiteShellComponent(component: CmsComponentContract): boolean {
  return (
    component.renderer === 'nexus.component.site-header' ||
    component.renderer === 'nexus.component.site-footer'
  );
}

export function CmsPage({
  config,
  mapping,
  path,
}: {
  readonly config: NexusRuntimeConfig;
  readonly mapping: NexusHostMapping;
  readonly path: string;
}) {
  const arabic = config.defaultLocale.toLowerCase().startsWith('ar');
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState<State>({ status: 'loading' });
  const identity = JSON.stringify([
    config.endpoints.cms,
    config.enterpriseCode,
    mapping.siteCode,
    config.defaultLocale,
    config.channel,
    path,
  ]);
  const currentState: State =
    state.status === 'loading' || state.identity === identity
      ? state
      : { status: 'loading' };
  useEffect(() => {
    const controller = new AbortController();
    void resolveCmsPage({
      cmsBaseUrl: config.endpoints.cms,
      enterpriseCode: config.enterpriseCode,
      site: mapping.siteCode,
      path,
      locale: config.defaultLocale,
      channel: config.channel,
      timeoutMs: config.requestTimeoutMs,
      signal: controller.signal,
    })
      .then((page) => {
        if (!controller.signal.aborted)
          setState({ status: 'ready', identity, page });
      })
      .catch((error: unknown) => {
        if (!controller.signal.aborted)
          setState({
            status: 'failed',
            identity,
            kind:
              error instanceof CmsPageDeliveryError
                ? error.kind
                : 'service-unavailable',
          });
      });
    return () => controller.abort();
  }, [attempt, config, mapping, path, identity]);
  useEffect(() => {
    if (
      state.status !== 'ready' ||
      state.identity !== identity ||
      !window.location.hash
    )
      return;
    const target = document.getElementById(window.location.hash.slice(1));
    target?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [state, identity]);
  if (currentState.status === 'loading')
    return (
      <main
        id="main-content"
        className="page-state page-state-loading"
        tabIndex={-1}
        aria-live="polite"
      >
        <div className="cms-loading-panel">
          <p className="eyebrow">Nodics Nexus</p>
          <h1>{arabic ? 'جارٍ فتح Nexus.' : 'Opening Nexus.'}</h1>
          <p>
            {arabic
              ? 'شكرًا لانتظارك بينما نجهّز أحدث تجربة.'
              : 'Thanks for your patience while the latest experience is being prepared.'}
          </p>
          <div className="cms-loading-grid" aria-hidden="true">
            <span />
            <span />
            <span />
          </div>
        </div>
      </main>
    );
  if (currentState.status === 'failed') {
    if (
      currentState.kind === 'not-found' &&
      mapping.experience === 'corporate' &&
      config.endpoints.editorial
    ) {
      const route = editorialDetailRoute(path);
      const listingType =
        path === '/blogs' ? 'BLOG' : path === '/news' ? 'NEWS' : undefined;
      if (route || listingType)
        return (
          <PublishedSiteShell config={config} mapping={mapping} solidHeader>
            {route ? (
              <EditorialArticlePage
                config={config}
                mapping={mapping}
                route={route}
              />
            ) : listingType ? (
              <EditorialListingPage
                config={config}
                mapping={mapping}
                contentType={listingType}
              />
            ) : null}
          </PublishedSiteShell>
        );
    }
    const fallback = fallbackContent(currentState.kind, path, arabic);
    return (
      <main
        id="main-content"
        className="page-state page-state-service"
        tabIndex={-1}
      >
        <div className="service-state-panel" role="alert">
          <p className="eyebrow">{fallback.eyebrow}</p>
          <h1>{fallback.heading}</h1>
          <p>{fallback.body}</p>
          <div className="service-state-actions">
            {fallback.showRetry ? (
              <button
                className="button button-primary"
                onClick={() => {
                  setState({ status: 'loading' });
                  setAttempt((value) => value + 1);
                }}
              >
                {arabic ? 'حاول مجددًا' : 'Try again'}
              </button>
            ) : null}
            <a className="button button-secondary" href="/">
              {arabic ? 'الرئيسية بالإنجليزية' : 'Go to home'}
            </a>
          </div>
        </div>
      </main>
    );
  }
  const page = currentState.page.page;
  const shell = siteShellFromPage(currentState.page);
  const bodyComponents = page.components.filter(
    (component) => !isSiteShellComponent(component),
  );
  const hasPageHero = page.components.some((component) =>
    ['nexus.component.page-hero', 'nexus.hero'].includes(component.renderer),
  );
  if (
    page.rendererContractVersion !== 1 ||
    page.rendererDeprecated ||
    !page.rendererChannels.includes(config.channel) ||
    !['nexus.page.home', 'nexus.page.standard'].includes(page.renderer) ||
    page.templateContract.renderer !== 'nexus.template.corporate' ||
    ![0, 1].includes(page.templateContract.contractVersion)
  )
    return (
      <main id="main-content" className="page-state" tabIndex={-1}>
        <div role="alert">
          <h1>Incompatible page contract</h1>
        </div>
      </main>
    );
  if (page.renderer === 'nexus.page.home' && page.components.length === 0) {
    return (
      <main
        id="main-content"
        className="page-state page-state-service"
        tabIndex={-1}
      >
        <div className="service-state-panel" role="alert">
          <p className="eyebrow">Nodics Nexus</p>
          <h1>We are getting Nexus ready.</h1>
          <p>
            The site is not available right now while we complete a content
            update. Please check back shortly.
          </p>
          <div className="service-state-actions">
            <button
              className="button button-primary"
              onClick={() => {
                setState({ status: 'loading' });
                setAttempt((value) => value + 1);
              }}
            >
              Try again
            </button>
          </div>
        </div>
      </main>
    );
  }
  return (
    <SiteShell axisBaseUrl={config.axisBaseUrl} shell={shell}>
      <NexusRuntimeConfigContext.Provider value={{ config, mapping }}>
        <div
          className={
            page.renderer === 'nexus.page.home' ? 'home-page' : 'standard-page'
          }
        >
          {page.renderer === 'nexus.page.standard' && !hasPageHero ? (
            <CmsComponentRenderer
              channel={config.channel}
              component={fallbackPageHero(page.name || page.code)}
            />
          ) : null}
          {[...bodyComponents]
            .sort((a, b) => a.index - b.index)
            .map((component) => (
              <CmsComponentRenderer
                key={component.code}
                component={component}
                channel={config.channel}
              />
            ))}
        </div>
      </NexusRuntimeConfigContext.Provider>
    </SiteShell>
  );
}
