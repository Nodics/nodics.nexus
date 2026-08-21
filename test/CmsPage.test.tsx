import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { CmsPage } from '../src/app/CmsPage';
import type {
  NexusHostMapping,
  NexusRuntimeConfig,
} from '../src/runtime/runtimeConfig';

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
  vi.restoreAllMocks();
});

describe('Nexus CMS page', () => {
  it('shows a page-not-found state for unknown CMS routes', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify({}), { status: 404 }),
    );

    render(<CmsPage config={config} mapping={mapping} path="/missing-page" />);

    expect(
      await screen.findByRole('heading', {
        name: 'This Nexus page does not exist.',
      }),
    ).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Try again' })).toBeNull();
    expect(screen.getByRole('link', { name: 'Go to home' })).toHaveAttribute(
      'href',
      '/',
    );
  });

  it('shows a service-unavailable state when CMS cannot serve content', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify({}), { status: 503 }),
    );

    render(<CmsPage config={config} mapping={mapping} path="/support" />);

    expect(
      await screen.findByRole('heading', {
        name: 'Nexus services are temporarily unavailable.',
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/platform services behind Nexus are starting/i),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Try again' })).toBeEnabled();
  });

  it('uses the shared second-level banner fallback when a standard page has no delivered hero', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          result: {
            contractVersion: 1,
            site: 'nexusCorporateSite',
            path: '/support',
            locale: 'en',
            channel: 'web',
            page: {
              code: 'nexusSupportPage',
              name: 'Nodics Support',
              renderer: 'nexus.page.standard',
              rendererContractVersion: 1,
              rendererChannels: ['web'],
              rendererDeprecated: false,
              templateContract: {
                code: 'nexusCorporatePageTemplate',
                renderer: 'nexus.template.corporate',
                contractVersion: 1,
              },
              components: [],
            },
          },
        }),
        { status: 200 },
      ),
    );

    const { container } = render(
      <CmsPage config={config} mapping={mapping} path="/support" />,
    );

    expect(
      await screen.findByRole('heading', { name: 'Nodics Support' }),
    ).toBeInTheDocument();
    expect(container.querySelector('.secondary-page-hero')).toBeInTheDocument();
    expect(container.querySelector('.page-title')).not.toBeInTheDocument();
  });

  it('shows an actionable publishing state when the home page has no delivered components', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          result: {
            contractVersion: 1,
            site: 'nexusCorporateSite',
            path: '/',
            locale: 'en',
            channel: 'web',
            page: {
              code: 'nexusHomePage',
              name: 'Nodics Nexus',
              renderer: 'nexus.page.home',
              rendererContractVersion: 1,
              rendererChannels: ['web'],
              rendererDeprecated: false,
              templateContract: {
                code: 'nexusCorporatePageTemplate',
                renderer: 'nexus.template.corporate',
                contractVersion: 1,
              },
              components: [],
            },
          },
        }),
        { status: 200 },
      ),
    );

    render(<CmsPage config={config} mapping={mapping} path="/" />);

    expect(
      await screen.findByRole('heading', {
        name: 'Published home content is missing.',
      }),
    ).toBeInTheDocument();
    expect(screen.getByText(/Review Axis Publishing Requests/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Open Axis' })).toHaveAttribute(
      'href',
      'http://localhost:3100',
    );
  });
});
