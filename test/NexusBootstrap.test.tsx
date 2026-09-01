import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { NexusBootstrap } from '../src/app/NexusBootstrap';
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
  vi.clearAllMocks();
});

describe('Nexus bootstrap routing', () => {
  it('renders documentation routes without the hardcoded Nexus site shell', async () => {
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
});
