import { lazy, Suspense, useEffect, useState } from 'react';
import {
  loadNexusRuntimeConfig,
  resolveHostMapping,
  type NexusHostMapping,
  type NexusRuntimeConfig,
} from '../runtime/runtimeConfig';
import { CmsPage } from './CmsPage';

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
  const path = window.location.pathname.replace(/\/+$/u, '') || '/';
  if (path === '/docs' || path.startsWith('/docs/'))
    return (
      <Suspense
        fallback={
          <main className="page-state" aria-live="polite">
            Loading Nexus documentation.
          </main>
        }
      >
        <DocumentationPage config={state.config} path={path} />
      </Suspense>
    );
  return <CmsPage config={state.config} mapping={state.mapping} path={path} />;
}
