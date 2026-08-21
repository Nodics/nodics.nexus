import { render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { CmsComponentRenderer } from '../src/cms/RendererRegistry';
import type { CmsComponentContract } from '../src/cms/cmsContract';
import { NexusRuntimeConfigContext } from '../src/runtime/NexusRuntimeConfigContext';
import type {
  NexusHostMapping,
  NexusRuntimeConfig,
} from '../src/runtime/runtimeConfig';

const component = (
  renderer: string,
  properties: Record<string, unknown>,
): CmsComponentContract => ({
  code: 'editorial',
  typeCode: 'editorialType',
  active: true,
  renderer,
  rendererContractVersion: 1,
  rendererChannels: ['web'],
  rendererDeprecated: false,
  properties,
  slot: 'main',
  index: 0,
  components: [],
});

const runtimeConfig: NexusRuntimeConfig = {
  axisBaseUrl: 'http://localhost:3100',
  platformBaseUrl: 'http://localhost:4300',
  endpoints: {
    cms: 'http://localhost:4314/nodics/cms',
    editorial: 'http://localhost:4314/nodics/editorial',
  },
  enterpriseCode: 'default',
  defaultLocale: 'en',
  channel: 'web',
  clientContractVersion: 1,
  requestTimeoutMs: 5000,
  hostMappings: [],
};

const runtimeMapping: NexusHostMapping = {
  hosts: ['localhost'],
  siteCode: 'nexusCorporateSite',
  experience: 'corporate',
};

afterEach(() => {
  vi.restoreAllMocks();
});

describe('Editorial renderers', () => {
  it('renders a bounded accessible article listing', () => {
    render(
      <CmsComponentRenderer
        channel="web"
        component={component('nexus.editorial.listing', {
          kicker: 'Insights',
          heading: 'Latest articles',
          articles: [
            {
              code: 'one',
              contentTypeCode: 'BLOG',
              title: 'Composable content',
              summary: 'A safe summary.',
              href: '/blog/composable-content',
            },
          ],
        })}
      />,
    );
    expect(
      screen.getByRole('heading', { name: 'Latest articles' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Read article' })).toHaveAttribute(
      'href',
      '/blog/composable-content',
    );
  });

  it('keeps home editorial slide links separate from the view-all listing link', () => {
    render(
      <CmsComponentRenderer
        channel="web"
        component={component('nexus.component.blog-carousel', {
          kicker: 'Blogs',
          heading: 'Latest insights',
          href: '/blogs',
          linkLabel: 'View all insights',
          items: [
            {
              label: 'Blog',
              title: 'Composable content',
              summary: 'A safe summary.',
              href: '/blog/composable-content',
              linkLabel: 'Read insight',
              referenceImageCode: 'nodicsFeaturesArchitecture',
              imageAlt: 'Composable content preview',
            },
            {
              label: 'Blog',
              title: 'Composable operations',
              summary: 'Another safe summary.',
              href: '/blog/composable-operations',
              linkLabel: 'Read insight',
              referenceImageCode: 'nodicsDeveloperExperience',
              imageAlt: 'Composable operations preview',
            },
          ],
        })}
      />,
    );

    expect(
      screen.getByRole('link', { name: 'Open Composable content' }),
    ).toHaveAttribute('href', '/blog/composable-content');
    expect(
      screen.getByRole('link', { name: 'Composable content' }),
    ).toHaveAttribute('href', '/blog/composable-content');
    expect(
      screen.getAllByRole('link', { name: /Read insight/ })[0],
    ).toHaveAttribute('href', '/blog/composable-content');
    expect(
      screen.getByRole('link', { name: 'Composable operations' }),
    ).toHaveAttribute('href', '/blog/composable-operations');
    expect(
      screen.getByRole('link', { name: 'View all insights' }),
    ).toHaveAttribute('href', '/blogs');
  });

  it('keeps CMS-authored home editorial items when live editorial returns no articles', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          result: { items: [], limit: 4 },
          responseCode: '200',
        }),
        { status: 200 },
      ),
    );

    render(
      <NexusRuntimeConfigContext.Provider
        value={{ config: runtimeConfig, mapping: runtimeMapping }}
      >
        <CmsComponentRenderer
          channel="web"
          component={component('nexus.component.news-carousel', {
            kicker: 'News',
            heading: 'Latest news',
            href: '/news',
            linkLabel: 'View all news',
            items: [
              {
                label: 'News',
                title: 'Backend-owned fallback news',
                summary: 'A safe fallback summary.',
                href: '/news/backend-owned-fallback-news',
                linkLabel: 'Read news',
              },
            ],
          })}
        />
      </NexusRuntimeConfigContext.Provider>,
    );

    expect(
      screen.getByRole('heading', { name: 'Latest news' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: 'Backend-owned fallback news' }),
    ).toHaveAttribute('href', '/news/backend-owned-fallback-news');
    await waitFor(() => expect(globalThis.fetch).toHaveBeenCalledTimes(1));
    expect(
      screen.getByRole('link', { name: 'Backend-owned fallback news' }),
    ).toBeInTheDocument();
  });

  it('renders long home testimonial quotes without truncating the configured text', () => {
    const longQuote =
      'Nodics gives enterprise teams a reusable foundation for platform capability, delivery governance, operational visibility, and AI-assisted implementation while still allowing each customer project to own its journey-specific extensions, integrations, content, and release decisions. The value is not only speed; it is the ability to keep architecture boundaries visible, make backend contracts inspectable, and move from prototype energy into a maintainable production platform without rebuilding the same controls every time.';

    expect(longQuote.length).toBeGreaterThan(500);

    render(
      <CmsComponentRenderer
        channel="web"
        component={component('nexus.component.testimonials', {
          anchor: 'testimonials',
          items: [
            {
              quote: longQuote,
              name: 'Aarohi Mehta',
              role: 'Director of Platform Engineering',
              avatarReferenceImageCode: 'nexusTestimonialAarohi',
              avatarAlt: 'Illustrative portrait of Aarohi Mehta',
            },
          ],
        })}
      />,
    );

    expect(screen.getByText(`“${longQuote}”`)).toBeInTheDocument();
  });

  it('renders detail without executing supplied markup', () => {
    render(
      <CmsComponentRenderer
        channel="web"
        component={component('nexus.editorial.detail', {
          contentTypeCode: 'NEWS',
          title: 'Release',
          summary: 'Summary',
          bodyText: '<script>alert(1)</script>',
        })}
      />,
    );
    expect(screen.getByText('<script>alert(1)</script>')).toBeInTheDocument();
    expect(document.querySelector('script')).toBeNull();
  });
});
