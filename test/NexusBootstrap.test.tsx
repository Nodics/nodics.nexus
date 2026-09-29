import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
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
      <a href="/docs/swaggers">Swagger</a>
      <a href="/docs/framework/guide?section=setup#installation">Guide</a>
      <a href="/docs/nodics-axis" target="_blank">
        New tab
      </a>
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
  it('navigates documentation in place and follows history without reloading bootstrap', async () => {
    window.history.replaceState({}, '', '/docs/framework');
    vi.mocked(loadNexusRuntimeConfig).mockResolvedValue(config);
    vi.mocked(resolveHostMapping).mockReturnValue(mapping);
    vi.mocked(resolveCmsPage).mockRejectedValue(new Error('Not published'));
    const scroll = vi
      .spyOn(window, 'scrollTo')
      .mockImplementation(() => undefined);
    render(<NexusBootstrap />);
    const reader = await screen.findByRole('region', {
      name: 'Documentation content',
    });
    fireEvent.click(screen.getByRole('link', { name: 'Swagger' }));
    expect(window.location.pathname).toBe('/docs/swaggers');
    expect(screen.getByRole('region', { name: 'Documentation content' })).toBe(
      reader,
    );
    expect(reader).toHaveTextContent('Documentation for /docs/swaggers');
    fireEvent.click(screen.getByRole('link', { name: 'Guide' }));
    expect(window.location.search).toBe('?section=setup');
    expect(window.location.hash).toBe('#installation');
    await act(async () => {
      window.history.back();
      await new Promise<void>((resolve) =>
        window.addEventListener('popstate', () => resolve(), { once: true }),
      );
    });
    expect(reader).toHaveTextContent('Documentation for /docs/swaggers');
    await act(async () => {
      window.history.forward();
      await new Promise<void>((resolve) =>
        window.addEventListener('popstate', () => resolve(), { once: true }),
      );
    });
    expect(reader).toHaveTextContent('Documentation for /docs/framework/guide');
    const modified = new MouseEvent('click', {
      bubbles: true,
      cancelable: true,
      ctrlKey: true,
    });
    screen.getByRole('link', { name: 'Swagger' }).dispatchEvent(modified);
    expect(modified.defaultPrevented).toBe(false);
    const newTab = new MouseEvent('click', { bubbles: true, cancelable: true });
    screen.getByRole('link', { name: 'New tab' }).dispatchEvent(newTab);
    expect(newTab.defaultPrevented).toBe(false);
    expect(loadNexusRuntimeConfig).toHaveBeenCalledTimes(1);
    expect(resolveCmsPage).toHaveBeenCalledTimes(1);
    scroll.mockRestore();
  });
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
    await waitFor(() =>
      expect(
        screen.getByRole('link', { name: 'Published Docs' }),
      ).toHaveAttribute('aria-current', 'page'),
    );
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
