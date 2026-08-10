import { useEffect, useState } from 'react';
import { resolveCmsPage } from '../cms/cmsClient';
import type { CmsResolvedPageContract } from '../cms/cmsContract';
import { CmsComponentRenderer } from '../cms/RendererRegistry';
import type {
  NexusHostMapping,
  NexusRuntimeConfig,
} from '../runtime/runtimeConfig';

type State =
  | { status: 'loading' }
  | { status: 'ready'; page: CmsResolvedPageContract }
  | { status: 'failed'; message: string };
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
      cmsBaseUrl: config.cmsBaseUrl,
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
      <section className="page-state" role="alert">
        <p className="eyebrow">Content unavailable</p>
        <h1>We could not load this page.</h1>
        <p>{state.message}</p>
        <button
          className="button button-primary"
          onClick={() => {
            setState({ status: 'loading' });
            setAttempt((value) => value + 1);
          }}
        >
          Try again
        </button>
      </section>
    );
  const page = state.page.page;
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
    <div
      className={
        page.renderer === 'nexus.page.home' ? 'home-page' : 'standard-page'
      }
    >
      {page.renderer === 'nexus.page.standard' ? (
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
  );
}
