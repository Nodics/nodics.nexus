import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { CmsComponentRenderer } from '../src/cms/RendererRegistry';
import type { CmsComponentContract } from '../src/cms/cmsContract';

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
