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
import { SiteShell, type SiteShellContent, type SiteShellFooterGroup, type SiteShellLink } from './SiteShell';

type State =
  | { status: 'loading' }
  | { status: 'ready'; page: CmsResolvedPageContract }
  | {
      status: 'failed';
      kind: CmsPageDeliveryErrorKind;
      message: string;
    };

function fallbackContent(kind: CmsPageDeliveryErrorKind, path: string) {
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

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function string(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value : undefined;
}

function records(value: unknown): readonly Record<string, unknown>[] {
  return Array.isArray(value) ? value.filter(isRecord) : Object.freeze([]);
}

function shellLink(value: unknown): SiteShellLink | undefined {
  if (!isRecord(value)) return undefined;
  const label = string(value.label);
  const href = string(value.href);
  if (!label || !href) return undefined;
  return Object.freeze({
    label,
    href,
    ...(string(value.id) ? { id: string(value.id) } : {}),
  });
}

function shellFooterGroup(value: unknown): SiteShellFooterGroup | undefined {
  if (!isRecord(value)) return undefined;
  const title = string(value.title);
  const links = Object.freeze(records(value.links).map(shellLink).filter((item): item is SiteShellLink => Boolean(item)));
  if (!title || !links.length) return undefined;
  return Object.freeze({ title, links });
}

function isSiteShellComponent(component: CmsComponentContract): boolean {
  return component.renderer === 'nexus.component.site-header' || component.renderer === 'nexus.component.site-footer';
}

function siteShellFromPage(page: CmsResolvedPageContract): SiteShellContent | undefined {
  const header = page.page.components.find((component) => component.active && component.renderer === 'nexus.component.site-header');
  const footer = page.page.components.find((component) => component.active && component.renderer === 'nexus.component.site-footer');
  if (!header && !footer) return undefined;
  return Object.freeze({
    ...(string(header?.properties.brandLabel) ? { brandLabel: string(header?.properties.brandLabel) } : {}),
    ...(string(header?.properties.brandSubtitle) ? { brandSubtitle: string(header?.properties.brandSubtitle) } : {}),
    ...(string(footer?.properties.brandSummary) ? { brandSummary: string(footer?.properties.brandSummary) } : {}),
    ...(string(footer?.properties.contactHeading) ? { contactHeading: string(footer?.properties.contactHeading) } : {}),
    ...(string(footer?.properties.contactEmail) ? { contactEmail: string(footer?.properties.contactEmail) } : {}),
    navigation: Object.freeze(records(header?.properties.navigation).map(shellLink).filter((item): item is SiteShellLink => Boolean(item))),
    footerGroups: Object.freeze(records(footer?.properties.groups).map(shellFooterGroup).filter((item): item is SiteShellFooterGroup => Boolean(item))),
    ...(string(footer?.properties.legalText) ? { legalText: string(footer?.properties.legalText) } : {}),
    legalLinks: Object.freeze(records(footer?.properties.legalLinks).map(shellLink).filter((item): item is SiteShellLink => Boolean(item))),
    socialLinks: Object.freeze(records(footer?.properties.socialLinks).map((item) => {
      const name = string(item.name);
      const href = string(item.href);
      return name && href ? Object.freeze({ name, href }) : undefined;
    }).filter((item): item is { readonly name: string; readonly href: string } => Boolean(item))),
  });
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
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState<State>({ status: 'loading' });
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
      .then((page) => setState({ status: 'ready', page }))
      .catch((error: unknown) => {
        if (!controller.signal.aborted)
          setState({
            status: 'failed',
            kind:
              error instanceof CmsPageDeliveryError
                ? error.kind
                : 'service-unavailable',
            message:
              error instanceof Error
                ? error.message
                : 'Nexus content is unavailable',
          });
      });
    return () => controller.abort();
  }, [attempt, config, mapping, path]);
  useEffect(() => {
    if (state.status !== 'ready' || !window.location.hash) return;
    const target = document.getElementById(window.location.hash.slice(1));
    target?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [state]);
  if (state.status === 'loading')
    return (
      <section className="page-state page-state-loading" aria-live="polite">
        <div className="cms-loading-panel">
          <p className="eyebrow">Nodics Nexus</p>
          <h1>Opening Nexus.</h1>
          <p>
            Thanks for your patience while the latest experience is being
            prepared.
          </p>
          <div className="cms-loading-grid" aria-hidden="true">
            <span />
            <span />
            <span />
          </div>
        </div>
      </section>
    );
  if (state.status === 'failed') {
    const fallback = fallbackContent(state.kind, path);
    return (
      <section className="page-state page-state-service" role="alert">
        <div className="service-state-panel">
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
                Try again
              </button>
            ) : null}
            <a className="button button-secondary" href="/">
              Go to home
            </a>
          </div>
        </div>
      </section>
    );
  }
  const page = state.page.page;
  const shell = siteShellFromPage(state.page);
  const bodyComponents = page.components.filter((component) => !isSiteShellComponent(component));
  const hasPageHero = page.components.some(
    (component) => component.renderer === 'nexus.component.page-hero',
  );
  if (
    page.rendererContractVersion !== 1 ||
    page.rendererDeprecated ||
    !page.rendererChannels.includes(config.channel) ||
    !['nexus.page.home', 'nexus.page.standard'].includes(page.renderer) ||
    page.templateContract.renderer !== 'nexus.template.corporate' ||
    page.templateContract.contractVersion !== 1
  )
    return (
      <section className="page-state" role="alert">
        <h1>Incompatible page contract</h1>
      </section>
    );
  if (page.renderer === 'nexus.page.home' && page.components.length === 0) {
    return (
      <section className="page-state page-state-service" role="alert">
        <div className="service-state-panel">
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
      </section>
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
