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
