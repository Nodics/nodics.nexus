import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DocumentationSourceNavigation } from '../../src/documentation/DocumentationSourceNavigation';
import {
  documentationRoutes,
  documentationSourceForPath,
} from '../../src/documentation/documentationRoutes';
import { resolveCmsPage } from '../../src/cms/cmsClient';
import type { CmsResolvedPageContract } from '../../src/cms/cmsContract';
import type { NexusRuntimeConfig } from '../../src/runtime/runtimeConfig';

vi.mock('../../src/cms/cmsClient', () => ({ resolveCmsPage: vi.fn() }));
const config: NexusRuntimeConfig = {
  axisBaseUrl: 'http://localhost:3100',
  platformBaseUrl: 'http://localhost:4300',
  endpoints: { cms: 'http://localhost:4314/nodics/cms' },
  enterpriseCode: 'default',
  defaultLocale: 'en',
  channel: 'web',
  clientContractVersion: 1,
  requestTimeoutMs: 5000,
  hostMappings: [],
};
function page(site: string, path: string): CmsResolvedPageContract {
  return {
    site,
    path,
    contractVersion: 0,
    locale: 'en',
    channel: 'web',
    page: {
      code: 'article',
      renderer: 'documentation.page.article',
      rendererContractVersion: 1,
      rendererChannels: ['web'],
      rendererDeprecated: false,
      templateContract: {
        code: 'article',
        renderer: 'documentation.template.article',
        contractVersion: 1,
      },
      components: [
        {
          code: 'navigation',
          typeCode: 'navigation',
          active: true,
          renderer: 'documentation.component.navigation',
          rendererContractVersion: 1,
          rendererChannels: ['web'],
          rendererDeprecated: false,
          properties: { title: `${site} published title` },
          slot: 'navigation',
          index: 0,
          components: [],
        },
      ],
    },
  };
}
beforeEach(() => {
  vi.mocked(resolveCmsPage)
    .mockReset()
    .mockImplementation(async ({ site, path }) => page(site, path));
});
describe('documentation source strip', () => {
  it('uses Online titles and the existing route bindings, reusing the current page', async () => {
    const currentPage = page('nodicsDocumentationSite', '/docs');
    render(
      <DocumentationSourceNavigation
        config={config}
        path="/docs"
        currentPage={currentPage}
      />,
    );
    const nav = within(
      screen.getByRole('navigation', { name: 'Documentation areas' }),
    );
    expect(
      nav.getByRole('link', {
        name: 'nodicsDocumentationSite published title',
      }),
    ).toHaveAttribute('aria-current', 'page');
    for (const source of documentationRoutes) {
      expect(
        await nav.findByRole('link', {
          name: `${source.site} published title`,
        }),
      ).toHaveAttribute('href', source.path);
    }
    expect(nav.getByRole('link', { name: 'Swagger' })).toHaveAttribute(
      'href',
      '/docs/swaggers',
    );
    expect(resolveCmsPage).toHaveBeenCalledTimes(3);
    expect(resolveCmsPage).toHaveBeenCalledWith(
      expect.objectContaining({
        cmsBaseUrl: config.endpoints.cms,
        enterpriseCode: 'default',
        channel: 'web',
        locale: 'en',
      }),
    );
  });
  it('does not gate Swagger or other sources on an unavailable pack and supports retry', async () => {
    vi.mocked(resolveCmsPage).mockImplementation(async ({ site, path }) => {
      if (site === 'axisDocumentationSite') throw new Error('Not published');
      return page(site, path);
    });
    render(<DocumentationSourceNavigation config={config} path="/docs/api" />);
    expect(screen.getByRole('link', { name: 'Swagger' })).toHaveAttribute(
      'aria-current',
      'page',
    );
    await screen.findByRole('button', { name: 'Retry documentation links' });
    expect(
      screen.queryByRole('link', { name: /Axis/ }),
    ).not.toBeInTheDocument();
    expect(screen.getByText('Nodics Axis')).toHaveAttribute(
      'aria-disabled',
      'true',
    );
    expect(
      await screen.findByRole('link', {
        name: 'kickoffDocumentationSite published title',
      }),
    ).toBeInTheDocument();
    vi.mocked(resolveCmsPage).mockImplementation(async ({ site, path }) =>
      page(site, path),
    );
    fireEvent.click(
      screen.getByRole('button', { name: 'Retry documentation links' }),
    );
    expect(
      await screen.findByRole('link', {
        name: 'axisDocumentationSite published title',
      }),
    ).toBeInTheDocument();
    await waitFor(() =>
      expect(
        screen.queryByRole('button', { name: 'Retry documentation links' }),
      ).not.toBeInTheDocument(),
    );
  });
  it('rejects mismatched source responses and stale responses after configuration changes', async () => {
    let completeOld!: (value: CmsResolvedPageContract) => void;
    vi.mocked(resolveCmsPage).mockImplementation(
      ({ site, path, cmsBaseUrl }) =>
        cmsBaseUrl === config.endpoints.cms
          ? new Promise((resolve) => {
              if (site === 'axisDocumentationSite') completeOld = resolve;
            })
          : Promise.resolve(page('wrongSite', path)),
    );
    const view = render(
      <DocumentationSourceNavigation
        config={config}
        path="/docs/nodics-axis/guide"
      />,
    );
    view.rerender(
      <DocumentationSourceNavigation
        config={{
          ...config,
          endpoints: { cms: 'https://online.example/nodics/cms' },
        }}
        path="/docs/nodics-axis/guide"
      />,
    );
    completeOld(page('axisDocumentationSite', '/docs/nodics-axis'));
    await screen.findByRole('button', { name: 'Retry documentation links' });
    expect(
      screen.queryByRole('link', {
        name: 'axisDocumentationSite published title',
      }),
    ).not.toBeInTheDocument();
  });
  it('recognizes child pages but does not accept lookalike route prefixes', () => {
    expect(documentationSourceForPath('/docs/nodics-axis/guide')?.site).toBe(
      'axisDocumentationSite',
    );
    expect(
      documentationSourceForPath('/docs/nodics-axis-other'),
    ).toBeUndefined();
  });
});
