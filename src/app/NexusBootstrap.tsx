import { useEffect, useState } from 'react';
import {
  loadNexusRuntimeConfig,
  resolveHostMapping,
  type NexusHostMapping,
  type NexusRuntimeConfig,
} from '../runtime/runtimeConfig';
import { CmsPage } from './CmsPage';
import { SiteShell } from './SiteShell';
import { DocumentationPage } from '../documentation/DocumentationPage';

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
  return (
    <SiteShell axisBaseUrl={state.config.axisBaseUrl}>
      {path === '/docs' || path.startsWith('/docs/') ? (
        <DocumentationPage config={state.config} path={path} />
      ) : (
        <CmsPage config={state.config} mapping={state.mapping} path={path} />
      )}
    </SiteShell>
  );
}
