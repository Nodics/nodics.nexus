import { lazy, Suspense, useEffect, useState } from 'react';
import {
  loadNexusRuntimeConfig,
  resolveHostMapping,
  type NexusHostMapping,
  type NexusRuntimeConfig,
} from '../runtime/runtimeConfig';
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
  | { status: 'failed'; message: string };
export function NexusBootstrap() {
  const [state, setState] = useState<State>({ status: 'loading' });
  const [path, setPath] = useState(
    () => window.location.pathname.replace(/\/+$/u, '') || '/',
  );
  useEffect(() => {
    const followHistory = () =>
      setPath(window.location.pathname.replace(/\/+$/u, '') || '/');
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
      .then((config) =>
        setState({
          status: 'ready',
          config,
          mapping: resolveHostMapping(config, window.location.hostname),
        }),
      )
      .catch((error: unknown) => {
        if (!controller.signal.aborted)
          setState({
            status: 'failed',
            message:
              error instanceof Error
                ? error.message
                : 'Nexus configuration failed',
          });
      });
    return () => controller.abort();
  }, []);
  if (state.status === 'loading')
    return <main className="page-state">Preparing Nodics Nexus…</main>;
  if (state.status === 'failed')
    return (
      <main className="page-state" role="alert">
        <h1>Nodics Nexus is unavailable.</h1>
        <p>{state.message}</p>
      </main>
    );
  if (path === '/docs' || path.startsWith('/docs/'))
    return (
      <PublishedSiteShell config={state.config} mapping={state.mapping}>
        <Suspense
          fallback={
            <div className="page-state" role="status">
              Loading Nexus documentation.
            </div>
          }
        >
          <DocumentationPage config={state.config} path={path} />
        </Suspense>
      </PublishedSiteShell>
    );
  return <CmsPage config={state.config} mapping={state.mapping} path={path} />;
}
