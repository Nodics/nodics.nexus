import { useEffect, useState, type ReactNode } from 'react';
import { resolveCmsPage } from '../cms/cmsClient';
import type {
  NexusHostMapping,
  NexusRuntimeConfig,
} from '../runtime/runtimeConfig';
import { siteShellFromPage } from './siteShellContent';
import { SiteShell, type SiteShellContent } from './SiteShell';

/** Documentation keeps its own publication while using the published host navigation. */
export function PublishedSiteShell({
  config,
  mapping,
  children,
}: {
  readonly config: NexusRuntimeConfig;
  readonly mapping: NexusHostMapping;
  readonly children: ReactNode;
}) {
  const [published, setPublished] = useState<{
    config: NexusRuntimeConfig;
    mapping: NexusHostMapping;
    shell: SiteShellContent | undefined;
  }>();
  useEffect(() => {
    const controller = new AbortController();
    void resolveCmsPage({
      cmsBaseUrl: config.endpoints.cms,
      enterpriseCode: config.enterpriseCode,
      site: mapping.siteCode,
      path: '/',
      locale: config.defaultLocale,
      channel: config.channel,
      timeoutMs: config.requestTimeoutMs,
      signal: controller.signal,
    })
      .then((page) => {
        if (!controller.signal.aborted)
          setPublished({ config, mapping, shell: siteShellFromPage(page) });
      })
      .catch(() => {
        // An unavailable host publication must not invent navigation or block published docs.
        if (!controller.signal.aborted)
          setPublished({ config, mapping, shell: undefined });
      });
    return () => controller.abort();
  }, [config, mapping]);
  return (
    <SiteShell
      axisBaseUrl={config.axisBaseUrl}
      shell={
        published?.config === config && published.mapping === mapping
          ? published.shell
          : undefined
      }
    >
      {children}
    </SiteShell>
  );
}
