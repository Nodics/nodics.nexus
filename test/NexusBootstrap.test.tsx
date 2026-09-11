import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { NexusBootstrap } from '../src/app/NexusBootstrap';
import { resolveCmsPage } from '../src/cms/cmsClient';
vi.mock('../src/cms/cmsClient', () => ({ resolveCmsPage: vi.fn() }));
import {
  loadNexusRuntimeConfig,
  resolveHostMapping,
  type NexusHostMapping,
  type NexusRuntimeConfig,
} from '../src/runtime/runtimeConfig';

vi.mock('../src/runtime/runtimeConfig', async (importOriginal) => {
  const actual =
    await importOriginal<typeof import('../src/runtime/runtimeConfig')>();
  return {
    ...actual,
    loadNexusRuntimeConfig: vi.fn(),
    resolveHostMapping: vi.fn(),
  };
});

vi.mock('../src/documentation/DocumentationPage', () => ({
  DocumentationPage: ({ path }: { readonly path: string }) => (
    <section aria-label="Documentation content">
      <h1>Documentation for {path}</h1>
    </section>
  ),
}));

const config: NexusRuntimeConfig = {
  axisBaseUrl: 'http://localhost:3100',
  platformBaseUrl: 'http://localhost:4300',
  endpoints: {
    cms: 'http://localhost:4310/nodics/cms',
  },
  enterpriseCode: 'default',
  defaultLocale: 'en',
  channel: 'web',
  clientContractVersion: 1,
  requestTimeoutMs: 5000,
  hostMappings: [],
};

const mapping: NexusHostMapping = {
  hosts: ['localhost'],
  siteCode: 'nexusCorporateSite',
  experience: 'corporate',
};

afterEach(() => {
  vi.resetAllMocks();
  window.history.replaceState({}, '', '/');
});

describe('Nexus bootstrap routing', () => {
  it('keeps published documentation available without inventing an unpublished host header', async () => {
    vi.mocked(resolveCmsPage).mockRejectedValueOnce(new Error('Not published'));
    window.history.pushState({}, '', '/docs/framework');
    vi.mocked(loadNexusRuntimeConfig).mockResolvedValueOnce(config);
    vi.mocked(resolveHostMapping).mockReturnValueOnce(mapping);

    render(<NexusBootstrap />);

    await screen.findByRole('heading', {
      name: 'Documentation for /docs/framework',
    });
    expect(
      screen.queryByRole('navigation', { name: 'Primary navigation' }),
    ).not.toBeInTheDocument();
    expect(screen.queryByRole('contentinfo')).not.toBeInTheDocument();
  });
  it('renders the published host header above documentation and marks Docs active', async () => {
    window.history.pushState({}, '', '/docs/nodics-kickoff');
    vi.mocked(loadNexusRuntimeConfig).mockResolvedValueOnce(config);
    vi.mocked(resolveHostMapping).mockReturnValueOnce(mapping);
    vi.mocked(resolveCmsPage).mockResolvedValueOnce({
      contractVersion: 0,
      site: mapping.siteCode,
      path: '/',
      locale: 'en',
      channel: 'web',
      page: {
        code: 'publishedHome',
        name: 'Published home',
        renderer: 'nexus.page.standard',
        rendererContractVersion: 1,
        rendererChannels: ['web'],
        rendererDeprecated: false,
        templateContract: {
          code: 'standard',
          renderer: 'nexus.template.standard',
          contractVersion: 0,
        },
        components: [
          {
            code: 'publishedHeader',
            typeCode: 'header',
            active: true,
            renderer: 'nexus.component.site-header',
            rendererContractVersion: 1,
            rendererChannels: ['web'],
            rendererDeprecated: false,
            slot: 'header',
            index: 0,
            components: [],
            properties: {
              brandLabel: 'Published Brand',
              brandSubtitle: 'Knowledge',
              navigation: [
                { id: 'home', label: 'Published Home', href: '/' },
                { id: 'wiki', label: 'Published Docs', href: '/docs' },
              ],
            },
          },
        ],
      },
    });
    render(<NexusBootstrap />);
    const navigation = await screen.findByRole('navigation', {
      name: 'Primary navigation',
    });
    expect(navigation).toBeVisible();
    expect(
      screen.getByRole('link', { name: 'Published Docs' }),
    ).toHaveAttribute('aria-current', 'page');
    expect(
      screen.getByRole('heading', {
        name: 'Documentation for /docs/nodics-kickoff',
      }),
    ).toBeVisible();
    expect(resolveCmsPage).toHaveBeenCalledWith(
      expect.objectContaining({
        site: mapping.siteCode,
        path: '/',
        enterpriseCode: config.enterpriseCode,
      }),
    );
    expect(
      screen.queryByRole('link', { name: 'Features' }),
    ).not.toBeInTheDocument();
  });
});
