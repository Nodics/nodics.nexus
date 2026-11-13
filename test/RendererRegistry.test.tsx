import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { CmsComponentRenderer } from '../src/cms/RendererRegistry';
import type { CmsComponentContract } from '../src/cms/cmsContract';

const component = (
  renderer: string,
  overrides: Partial<CmsComponentContract> = {},
): CmsComponentContract => ({
  code: 'test',
  typeCode: 'testType',
  active: true,
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
  ...overrides,
});
describe('CMS renderer registry', () => {
  it.each(['nexus.hero', 'nexus.contentSection', 'nexus.cardGrid'])(
    'renders the declared authoring/localization title through %s',
    (renderer) => {
      render(
        <CmsComponentRenderer
          component={component(renderer, {
            properties: {
              title: 'عنوان الأعمال',
              heading: 'Legacy shared heading',
              body: 'Business content',
            },
          })}
          channel="web"
        />,
      );
      expect(
        screen.getByRole('heading', { name: 'عنوان الأعمال' }),
      ).toBeVisible();
      expect(
        screen.queryByRole('heading', { name: 'Legacy shared heading' }),
      ).not.toBeInTheDocument();
    },
  );

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
  it('does not render a component explicitly marked inactive by the backend', () => {
    render(
      <CmsComponentRenderer
        component={component('nexus.component.content', { active: false })}
        channel="web"
      />,
    );
    expect(
      screen.queryByRole('heading', { name: 'A governed platform' }),
    ).not.toBeInTheDocument();
  });
});

it('renders nested published content in order and retains child visibility and channel admission', () => {
  render(
    <CmsComponentRenderer
      channel="web"
      component={component('nexus.hero', {
        properties: { title: 'Approved parent' },
        components: [
          component('nexus.contentSection', {
            code: 'second',
            index: 1,
            properties: { heading: 'Second nested block' },
          }),
          component('nexus.contentSection', {
            code: 'first',
            index: 0,
            properties: { heading: 'First nested block' },
          }),
          component('nexus.contentSection', {
            code: 'hidden',
            active: false,
            properties: { heading: 'Hidden child' },
          }),
          component('nexus.contentSection', {
            code: 'wrong-channel',
            rendererChannels: ['mobile'],
            properties: { heading: 'Wrong channel' },
          }),
        ],
      })}
    />,
  );
  expect(
    screen.getAllByRole('heading').map((node) => node.textContent),
  ).toEqual(['Approved parent', 'First nested block', 'Second nested block']);
  expect(screen.getByRole('alert')).toHaveTextContent('not compatible');
  expect(screen.queryByText('Hidden child')).not.toBeInTheDocument();
  expect(screen.queryByText('Wrong channel')).not.toBeInTheDocument();
});
