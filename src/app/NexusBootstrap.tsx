import { lazy, Suspense, useEffect, useMemo, useState } from 'react';
import {
  loadNexusRuntimeConfig,
  resolveHostMapping,
  type NexusHostMapping,
  type NexusRuntimeConfig,
} from '../runtime/runtimeConfig';
import { nexusLocale, localeDirection } from '../runtime/nexusLocale';
import { nexusUi } from '../runtime/nexusUi';
import { CmsPage } from './CmsPage';
import { PublishedSiteShell } from './PublishedSiteShell';

const DocumentationPage = lazy(() =>
  import('../documentation/DocumentationPage').then((module) => ({
    default: module.DocumentationPage,
  })),
);

type State =
  | { status: 'loading' }
  | { status: 'ready'; config: NexusRuntimeConfig; mapping: NexusHostMapping }
  | { status: 'failed' };
/** Loads public configuration before CMS; explicit retry never bypasses bootstrap or host validation. */
export function NexusBootstrap() {
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState<State>({ status: 'loading' });
  const [path, setPath] = useState(
    () => window.location.pathname.replace(/\/+$/u, '') || '/',
  );
  const [search, setSearch] = useState(() => window.location.search);
  const selectedLocale =
    state.status === 'ready'
      ? nexusLocale(state.config.defaultLocale, search)
      : '';
  const effectiveConfig = useMemo(
    () =>
      state.status === 'ready'
        ? {
            ...state.config,
            defaultLocale: selectedLocale,
          }
        : undefined,
    [state, selectedLocale],
  );
  useEffect(() => {
    if (!effectiveConfig) return;
    document.documentElement.lang = effectiveConfig.defaultLocale;
    const skip = document.querySelector('.skip-link');
    if (skip)
      skip.textContent = nexusUi(effectiveConfig.defaultLocale).skipContent;
    document.documentElement.dir = localeDirection(
      effectiveConfig.defaultLocale,
    );
  }, [effectiveConfig]);
  useEffect(() => {
    const followHistory = () => {
      setPath(window.location.pathname.replace(/\/+$/u, '') || '/');
      setSearch(window.location.search);
    };
    const navigateDocumentation = (event: MouseEvent) => {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      )
        return;
      const anchor =
        event.target instanceof Element
          ? event.target.closest('a[href]')
          : null;
      if (
        !(anchor instanceof HTMLAnchorElement) ||
        anchor.hasAttribute('download') ||
        (anchor.target && anchor.target !== '_self')
      )
        return;
      const url = new URL(anchor.href);
      const isDocs = (pathname: string) =>
        pathname === '/docs' || pathname.startsWith('/docs/');
      if (
        url.origin !== window.location.origin ||
        !isDocs(window.location.pathname) ||
        !isDocs(url.pathname)
      )
        return;
      // Native hash navigation and modified clicks retain their browser behavior.
      if (
        url.pathname === window.location.pathname &&
        url.search === window.location.search
      ) {
        if (!url.hash && !window.location.hash) event.preventDefault();
        return;
      }
      event.preventDefault();
      window.history.pushState(null, '', url);
      window.dispatchEvent(new PopStateEvent('popstate'));
      window.scrollTo({ top: 0, behavior: 'instant' });
    };
    document.addEventListener('click', navigateDocumentation);
    window.addEventListener('popstate', followHistory);
    return () => {
      document.removeEventListener('click', navigateDocumentation);
      window.removeEventListener('popstate', followHistory);
    };
  }, []);
  useEffect(() => {
    const controller = new AbortController();
    void loadNexusRuntimeConfig(controller.signal)
      .then((config) => {
        if (controller.signal.aborted) return;
        setState({
          status: 'ready',
          config,
          mapping: resolveHostMapping(config, window.location.hostname),
        });
      })
      .catch(() => {
        if (!controller.signal.aborted) setState({ status: 'failed' });
      });
    return () => controller.abort();
  }, [attempt]);
  if (state.status === 'loading')
    return (
      <main id="main-content" className="page-state" tabIndex={-1}>
        <span role="status">Preparing Nodics Nexus…</span>
      </main>
    );
  if (state.status === 'failed')
    return (
      <main
        id="main-content"
        className="page-state page-state-service"
        tabIndex={-1}
      >
        <div className="service-state-panel" role="alert">
          <h1>Nexus is temporarily unavailable.</h1>
          <p>We cannot open the site right now. Please try again shortly.</p>
          <div className="service-state-actions">
            <button
              type="button"
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
  if (!effectiveConfig) return null;
  if (path === '/docs' || path.startsWith('/docs/'))
    return (
      <PublishedSiteShell config={effectiveConfig} mapping={state.mapping}>
        <Suspense
          fallback={
            <div className="page-state" role="status">
              Loading Nexus documentation.
            </div>
          }
        >
          <DocumentationPage config={effectiveConfig} path={path} />
        </Suspense>
      </PublishedSiteShell>
    );
  return (
    <CmsPage config={effectiveConfig} mapping={state.mapping} path={path} />
  );
}
