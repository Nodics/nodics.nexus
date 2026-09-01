import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DocumentationPage } from '../../src/documentation/DocumentationPage';
import type { NexusRuntimeConfig } from '../../src/runtime/runtimeConfig';
import { resolveCmsPage } from '../../src/cms/cmsClient';

vi.mock('mermaid', () => ({
  default: {
    initialize: vi.fn(),
    render: vi.fn(async () => ({
      svg: '<svg data-testid="rendered-docs-diagram" viewBox="0 0 120 40"><text>Rendered diagram</text></svg>',
    })),
  },
}));

vi.mock('../../src/cms/cmsClient', () => ({
  resolveCmsPage: vi.fn(),
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

describe('Nexus documentation page', () => {
  beforeEach(() => {
    window.localStorage.clear();
    vi.mocked(resolveCmsPage).mockReset();
  });

  it('loads the documentation gateway from CMS', async () => {
    vi.mocked(resolveCmsPage).mockResolvedValueOnce({
      contractVersion: 0,
      site: 'nodicsDocumentationSite',
      path: '/docs',
      locale: 'en',
      channel: 'web',
      page: {
        code: 'nodicsDocsGatewayPage',
        name: 'Nodics Documentation',
        renderer: 'documentation.page.article',
        rendererContractVersion: 1,
        rendererChannels: ['web'],
        rendererDeprecated: false,
        templateContract: {
          code: 'nodicsDocumentationArticleTemplate',
          renderer: 'documentation.template.article',
          contractVersion: 1,
        },
        components: [
          {
            code: 'nodicsDocumentationNavigation',
            typeCode: 'nodicsDocumentationNavigationComponentType',
            active: true,
            renderer: 'documentation.component.navigation',
            rendererContractVersion: 1,
            rendererChannels: ['web'],
            rendererDeprecated: false,
            properties: {
              title: 'Nodics Documentation',
              searchLabel: 'Search documentation',
              searchPlaceholder: 'Search topics',
              items: [
                {
                  title: 'Nodics Documentation',
                  route: '/docs',
                  sectionTitle: 'Start Here',
                  groupTitle: 'Legacy group should not render',
                  subgroupTitle: 'Legacy subgroup should not render',
                  sectionOrder: 1,
                  audience: ['administrator'],
                  searchText: 'setup publication',
                  order: 10,
                },
              ],
            },
            slot: 'navigation',
            index: 5,
            components: [],
          },
          {
            code: 'nodicsDocsGatewayArticle',
            typeCode: 'nodicsDocumentationArticleComponentType',
            active: true,
            renderer: 'documentation.component.article',
            rendererContractVersion: 1,
            rendererChannels: ['web'],
            rendererDeprecated: false,
            properties: {
              title: 'Nodics Documentation',
              sectionTitle: 'Start Here',
              summary:
                'Choose the correct documentation entry point and setup path.',
              audience: ['administrator'],
              maturityState: 'operational',
              accessMode: 'PUBLIC',
              lifecycleState: 'ONLINE',
              blocks: [
                {
                  kind: 'paragraph',
                  text: 'Documentation is delivered from CMS content.',
                },
              ],
            },
            slot: 'article',
            index: 10,
            components: [],
          },
        ],
      },
    });

    render(<DocumentationPage config={config} path="/docs" />);

    expect(
      await screen.findByRole('heading', {
        level: 1,
        name: 'Nodics Documentation',
      }),
    ).toBeInTheDocument();
    expect(resolveCmsPage).toHaveBeenCalledWith(
      expect.objectContaining({
        site: 'nodicsDocumentationSite',
        path: '/docs',
      }),
    );
    expect(
      screen.getByText('Documentation is delivered from CMS content.'),
    ).toBeInTheDocument();
    expect(
      screen.queryByText('Legacy group should not render'),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText('Legacy subgroup should not render'),
    ).not.toBeInTheDocument();
    const resizer = screen.getByRole('separator', {
      name: 'Resize documentation navigation',
    });
    expect(resizer).toHaveAttribute('aria-valuenow', '320');
    fireEvent.pointerDown(resizer, { clientX: 320 });
    fireEvent.pointerMove(document, { clientX: 420 });
    fireEvent.pointerUp(document);
    expect(resizer).toHaveAttribute('aria-valuenow', '420');
  });

  it('renders enterprise page anatomy and visual documentation blocks from CMS', async () => {
    vi.mocked(resolveCmsPage).mockResolvedValueOnce({
      contractVersion: 0,
      site: 'nodicsDocumentationSite',
      path: '/docs/framework/runtime-governance',
      locale: 'en',
      channel: 'web',
      page: {
        code: 'nodicsDocsRuntimeGovernancePage',
        name: 'Runtime Governance',
        renderer: 'documentation.page.article',
        rendererContractVersion: 1,
        rendererChannels: ['web'],
        rendererDeprecated: false,
        templateContract: {
          code: 'nodicsDocumentationArticleTemplate',
          renderer: 'documentation.template.article',
          contractVersion: 1,
        },
        components: [
          {
            code: 'nodicsDocumentationNavigation',
            typeCode: 'nodicsDocumentationNavigationComponentType',
            active: true,
            renderer: 'documentation.component.navigation',
            rendererContractVersion: 1,
            rendererChannels: ['web'],
            rendererDeprecated: false,
            properties: {
              title: 'Nodics Documentation',
              searchLabel: 'Search documentation',
              searchPlaceholder: 'Search topics',
              items: [
                {
                  title: 'Runtime Governance',
                  route: '/docs/framework/runtime-governance',
                  sectionTitle:
                    'Runtime Governance and Dynamic Change Management',
                  audience: ['business', 'developer'],
                  searchText: 'runtime governance visualRequirements',
                },
              ],
            },
            slot: 'navigation',
            index: 5,
            components: [],
          },
          {
            code: 'nodicsDocsRuntimeGovernanceArticle',
            typeCode: 'nodicsDocumentationArticleComponentType',
            active: true,
            renderer: 'documentation.component.article',
            rendererContractVersion: 1,
            rendererChannels: ['web'],
            rendererDeprecated: false,
            properties: {
              title: 'Runtime Governance',
              sectionTitle: 'Runtime Governance and Dynamic Change Management',
              summary:
                'How runtime changes are governed, visualized, and published.',
              audience: ['business', 'developer'],
              maturityState: 'operational',
              accessMode: 'PUBLIC',
              lifecycleState: 'ONLINE',
              visualRequirements: ['data-flow', 'configuration-table'],
              headings: [
                { level: 2, text: 'Runtime flow', anchor: 'runtime-flow' },
              ],
              blocks: [
                {
                  kind: 'heading',
                  level: 2,
                  text: 'Runtime flow',
                  anchor: 'runtime-flow',
                },
                {
                  kind: 'diagram',
                  title: 'Runtime change propagation',
                  text: 'flowchart LR\\nAxis --> Platform\\nPlatform --> Nodes',
                },
                {
                  kind: 'table',
                  headers: ['Decision', 'Evidence'],
                  rows: [['Runtime change', 'Approved and published']],
                },
              ],
            },
            slot: 'article',
            index: 10,
            components: [],
          },
        ],
      },
    });

    const { container } = render(
      <DocumentationPage
        config={config}
        path="/docs/framework/runtime-governance"
      />,
    );

    expect(
      await screen.findByRole('heading', { name: 'Runtime Governance' }),
    ).toBeInTheDocument();
    expect(screen.getByText('operational')).toBeInTheDocument();
    expect(screen.getByText('PUBLIC')).toBeInTheDocument();
    expect(screen.getByText('ONLINE')).toBeInTheDocument();
    expect(screen.getByText('Visual contract')).toBeInTheDocument();
    expect(screen.getByText('data-flow')).toBeInTheDocument();
    expect(screen.getByText('configuration-table')).toBeInTheDocument();
    expect(resolveCmsPage).toHaveBeenCalledWith(
      expect.objectContaining({
        site: 'nodicsDocumentationSite',
        path: '/docs/framework/runtime-governance',
      }),
    );
    expect(screen.getByText('Runtime change propagation')).toBeInTheDocument();
    await waitFor(() =>
      expect(
        container.querySelector('[data-testid="rendered-docs-diagram"]'),
      ).toBeInTheDocument(),
    );
    expect(screen.getByRole('table')).toBeInTheDocument();
  });
});
