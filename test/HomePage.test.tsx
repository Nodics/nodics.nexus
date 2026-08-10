import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { CmsComponentRenderer } from '../src/cms/RendererRegistry';
import type { CmsComponentContract } from '../src/cms/cmsContract';

describe('Nexus corporate homepage renderers', () => {
  it('renders a backend-composed banner carousel accessibly', () => {
    const slide: CmsComponentContract = {
      code: 'microservices-banner',
      typeCode: 'bannerSlideType',
      renderer: 'nexus.component.banner-slide',
      rendererContractVersion: 1,
      rendererChannels: ['web'],
      rendererDeprecated: false,
      slot: 'slides',
      index: 10,
      components: [],
      properties: {
        title: 'Microservices architecture',
        heading: 'Where enterprise capabilities connect.',
        subheading: 'Build durable platforms.',
        referenceImageCode: 'nodicsMicroservicesHero',
        buttons: [
          {
            label: 'Explore Nodics',
            href: '#platform',
            style: 'PRIMARY',
          },
          {
            label: 'Read documentation',
            href: 'https://docs.nodics.in',
            style: 'SECONDARY',
          },
        ],
      },
    };
    const carousel: CmsComponentContract = {
      code: 'banner-carousel',
      typeCode: 'bannerCarouselType',
      renderer: 'nexus.component.banner-carousel',
      rendererContractVersion: 1,
      rendererChannels: ['web'],
      rendererDeprecated: false,
      slot: 'main',
      index: 0,
      components: [slide],
      properties: {
        automaticRotation: false,
        rotationIntervalMs: 7000,
        fadeDurationMs: 1400,
      },
    };
    render(<CmsComponentRenderer component={carousel} channel="web" />);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      'Where enterprise capabilities connect.',
    );
    expect(
      screen.getByRole('link', { name: 'Read documentation' }),
    ).toHaveAttribute('href', 'https://docs.nodics.in/');
  });
});
