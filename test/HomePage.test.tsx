import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { CmsComponentRenderer } from '../src/cms/RendererRegistry';
import type { CmsComponentContract } from '../src/cms/cmsContract';

describe('Nexus corporate homepage renderers', () => {
  it('renders a backend-composed banner carousel accessibly', () => {
    const slide: CmsComponentContract = {
      code: 'microservices-banner',
      typeCode: 'bannerSlideType',
      active: true,
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
      active: true,
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

  it('renders GitHub organization copy without forcing repository-only CTAs', () => {
    const github: CmsComponentContract = {
      code: 'github',
      typeCode: 'githubType',
      active: true,
      renderer: 'nexus.component.github',
      rendererContractVersion: 1,
      rendererChannels: ['web'],
      rendererDeprecated: false,
      slot: 'main',
      index: 0,
      components: [],
      properties: {
        kicker: 'GitHub and open source',
        heading: 'Start from the Nodics GitHub organization.',
        body: 'Use the organization as the stable entry point.',
        organizationHref: 'https://github.com/Nodics',
        organizationLabel: 'Open github.com/Nodics',
        repositoryIntro:
          'Start with the installer before browsing repository families.',
        repositories: [
          {
            name: 'nodics.installer',
            role: 'Local setup entry point',
            description:
              'Bootstrap repository for initializing a local Nodics workspace.',
            href: 'https://github.com/Nodics/nodics.installer',
            linkLabel: 'Start local setup',
          },
        ],
      },
    };

    render(<CmsComponentRenderer component={github} channel="web" />);

    expect(
      screen.getByRole('heading', {
        name: 'Start from the Nodics GitHub organization.',
      }),
    ).toBeVisible();
    expect(
      screen.getByText(
        'Start with the installer before browsing repository families.',
      ),
    ).toBeVisible();
    expect(
      screen.getByRole('link', { name: /Start local setup/i }),
    ).toHaveAttribute('href', 'https://github.com/Nodics/nodics.installer');
    expect(screen.queryByRole('link', { name: /View repository/i })).toBeNull();
  });
});
