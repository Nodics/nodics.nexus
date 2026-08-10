import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { CmsComponentRenderer } from '../src/cms/RendererRegistry';
import type { CmsComponentContract } from '../src/cms/cmsContract';

const component = (renderer: string): CmsComponentContract => ({
  code: 'test',
  typeCode: 'testType',
  renderer,
  rendererContractVersion: 1,
  rendererChannels: ['web'],
  rendererDeprecated: false,
  properties: {
    kicker: 'About',
    heading: 'A governed platform',
    body: 'Safe content.',
  },
  slot: 'main',
  index: 0,
  components: [],
});
describe('CMS renderer registry', () => {
  it('renders an allowlisted component', () => {
    render(
      <CmsComponentRenderer
        component={component('nexus.component.content')}
        channel="web"
      />,
    );
    expect(
      screen.getByRole('heading', { name: 'A governed platform' }),
    ).toBeInTheDocument();
  });
  it('rejects an unknown renderer without executing content', () => {
    render(
      <CmsComponentRenderer
        component={component('https://attacker.example/code.js')}
        channel="web"
      />,
    );
    expect(screen.getByRole('alert')).toHaveTextContent(
      'Unsupported content renderer',
    );
  });
  it('rejects an incompatible channel', () => {
    render(
      <CmsComponentRenderer
        component={component('nexus.component.content')}
        channel="mobile"
      />,
    );
    expect(screen.getByRole('alert')).toHaveTextContent('not compatible');
  });
});
