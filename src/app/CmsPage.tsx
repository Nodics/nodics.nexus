import { useEffect, useState } from 'react';
import { resolveCmsPage } from '../cms/cmsClient';
import type { CmsResolvedPageContract } from '../cms/cmsContract';
import { CmsComponentRenderer } from '../cms/RendererRegistry';
import { NexusRuntimeConfigContext } from '../runtime/NexusRuntimeConfigContext';
import type {
  NexusHostMapping,
  NexusRuntimeConfig,
} from '../runtime/runtimeConfig';

type State =
  | { status: 'loading' }
  | { status: 'ready'; page: CmsResolvedPageContract }
  | { status: 'failed'; message: string };

function customerFriendlyFallbackMessage(message: string) {
  if (
    message.includes('timed out') ||
    message.includes('Failed to fetch') ||
    message.includes('NetworkError') ||
    message.includes('CMS delivery returned HTTP 5')
  )
    return 'The platform services behind Nexus are starting or being updated. Please try again in a moment.';
  if (message.includes('not available'))
    return 'This page is not available right now. Please continue from the Nexus home page or try again shortly.';
  return 'Nexus content is temporarily unavailable. Please try again in a moment.';
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
  if (state.status === 'failed')
    return (
      <section className="page-state page-state-service" role="alert">
        <div className="service-state-panel">
          <p className="eyebrow">Nodics Nexus</p>
          <h1>We are getting Nexus ready for you.</h1>
          <p>{customerFriendlyFallbackMessage(state.message)}</p>
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
  return (
    <NexusRuntimeConfigContext.Provider value={{ config, mapping }}>
      <div
        className={
          page.renderer === 'nexus.page.home' ? 'home-page' : 'standard-page'
        }
      >
        {page.renderer === 'nexus.page.standard' && !hasPageHero ? (
          <div className="page-title">
            <p className="eyebrow">Nodics Nexus</p>
            <h1>{page.name}</h1>
          </div>
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
