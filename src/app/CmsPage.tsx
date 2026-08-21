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

type State =
  | { status: 'loading' }
  | { status: 'ready'; page: CmsResolvedPageContract }
  | {
      status: 'failed';
      kind: CmsPageDeliveryErrorKind;
      message: string;
    };

function fallbackContent(kind: CmsPageDeliveryErrorKind) {
  if (kind === 'not-found')
    return {
      eyebrow: 'Page not found',
      heading: 'This Nexus page does not exist.',
      body: 'The route you opened is not part of the current Nexus site. Please continue from the home page or use the main navigation.',
      showRetry: false,
    };
  return {
    eyebrow: 'Nodics Nexus',
    heading: 'Nexus services are temporarily unavailable.',
    body: 'The platform services behind Nexus are starting, being updated, or cannot be reached right now. Please try again in a moment.',
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
      <div className="page-state" aria-live="polite">
        <span className="loader" />
        Loading Nexus content…
      </div>
    );
  if (state.status === 'failed') {
    const fallback = fallbackContent(state.kind);
    return (
      <section className="page-state page-state-service" role="alert">
        <div className="service-state-panel">
          <p className="eyebrow">{fallback.eyebrow}</p>
          <h1>{fallback.heading}</h1>
          <p>{fallback.body}</p>
          {state.message ? (
            <p className="service-state-detail">Reference: {state.message}</p>
          ) : null}
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
          <h1>Published home content is missing.</h1>
          <p>
            Nexus reached WCMS Online, but the published home page did not include
            any visible components. Review Axis Publishing Requests, approval tasks,
            and Staged-to-Online Status, then publish the Nexus website content.
          </p>
          <p className="service-state-detail">
            Site: {mapping.siteCode} · Path: {path} · Channel: {config.channel}
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
            <a className="button button-secondary" href={config.axisBaseUrl}>
              Open Axis
            </a>
          </div>
        </div>
      </section>
    );
  }
  return (
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
        {[...page.components]
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
  );
}
