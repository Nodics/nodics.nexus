import { useEffect, useState } from 'react';
import { resolveCmsPage } from '../cms/cmsClient';
import type { CmsResolvedPageContract } from '../cms/cmsContract';
import type { NexusRuntimeConfig } from '../runtime/runtimeConfig';
import {
  documentationRoutes,
  documentationSourceForPath,
  isApiDocumentationPath,
} from './documentationRoutes';

type SourceState = { title: string; available: boolean };

function publishedSource(page: CmsResolvedPageContract): SourceState {
  const navigation = page.page.components.find(
    (component) =>
      component.active &&
      component.renderer === 'documentation.component.navigation' &&
      component.rendererContractVersion === 1,
  );
  const title = navigation?.properties.title;
  return {
    title: typeof title === 'string' ? title.trim() : '',
    available:
      page.page.renderer === 'documentation.page.article' &&
      page.page.rendererContractVersion === 1 &&
      typeof title === 'string' &&
      !!title.trim(),
  };
}

/** Cross-pack navigation uses Online title/availability evidence, never Staged data.
 * Source checks belong to the persistent strip, not individual article loads.
 * Each source fails independently; the native API reader does not depend on CMS.
 */
export function DocumentationSourceNavigation({
  config,
  path,
  currentPage,
}: {
  readonly config: NexusRuntimeConfig;
  readonly path: string;
  readonly currentPage?: CmsResolvedPageContract;
}) {
  const activeSource = documentationSourceForPath(path);
  const [attempt, setAttempt] = useState(0);
  const [snapshot, setSnapshot] = useState<{
    config: NexusRuntimeConfig;
    attempt: number;
    sources: Record<string, SourceState>;
  }>();
  useEffect(() => {
    const controller = new AbortController();
    for (const source of documentationRoutes) {
      void (async () => {
        let result: SourceState;
        try {
          const page = await resolveCmsPage({
            cmsBaseUrl: config.endpoints.cms,
            enterpriseCode: config.enterpriseCode,
            site: source.site,
            path: source.path,
            locale: config.defaultLocale,
            channel: config.channel,
            timeoutMs: config.requestTimeoutMs,
            signal: controller.signal,
          });
          if (page.site !== source.site || page.path !== source.path)
            throw new Error(
              'Documentation source response did not match its route',
            );
          result = publishedSource(page);
        } catch {
          result = { title: '', available: false };
        }
        if (controller.signal.aborted) return;
        setSnapshot((previous) => ({
          config,
          attempt,
          sources: {
            ...(previous?.config === config && previous.attempt === attempt
              ? previous.sources
              : {}),
            [source.site]: result,
          },
        }));
      })();
    }
    return () => controller.abort();
  }, [config, attempt]);
  const sources =
    snapshot?.config === config && snapshot.attempt === attempt
      ? snapshot.sources
      : {};
  const unavailable = Object.values(sources).some(
    (source) => !source.available,
  );
  return (
    <div className="docs-source-navigation">
      <nav
        aria-label="Documentation areas"
        className="docs-source-navigation-links"
      >
        {documentationRoutes.map((source) => {
          const state =
            currentPage?.site === source.site
              ? publishedSource(currentPage)
              : sources[source.site];
          const title = state?.title || source.title;
          return state?.available ? (
            <a
              key={source.site}
              href={source.path}
              aria-current={
                activeSource?.site === source.site ? 'page' : undefined
              }
            >
              {title}
            </a>
          ) : (
            <span key={source.site} aria-disabled="true">
              {title}
              <small>{state ? 'Unavailable' : 'Checking publication…'}</small>
            </span>
          );
        })}
        <a
          href="/docs/swaggers"
          aria-current={isApiDocumentationPath(path) ? 'page' : undefined}
        >
          Swagger
        </a>
      </nav>
      {unavailable && (
        <div className="docs-source-navigation-status" role="status">
          <span>Some documentation could not be verified as published.</span>
          <button
            type="button"
            onClick={() => setAttempt((value) => value + 1)}
          >
            Retry documentation links
          </button>
        </div>
      )}
    </div>
  );
}
