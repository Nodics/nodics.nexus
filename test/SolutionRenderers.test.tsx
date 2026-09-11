import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { CmsComponentRenderer } from '../src/cms/RendererRegistry';
import type { CmsComponentContract } from '../src/cms/cmsContract';

const fixture = (
  properties: Record<string, unknown>,
): CmsComponentContract => ({
  code: 'solutions',
  typeCode: 'nexusSolutionsType',
  active: true,
  renderer: 'nexus.component.solutions',
  rendererContractVersion: 1,
  rendererChannels: ['web'],
  rendererDeprecated: false,
  properties,
  slot: 'main',
  index: 0,
  components: [],
});
describe('Solutions content boundary', () => {
  it('omits unsafe links and treats content as text', () => {
    render(
      <CmsComponentRenderer
        channel="web"
        component={fixture({
          mode: 'overview',
          heading: '<script>unsafe</script>',
          href: '//untrusted.example',
          items: [
            {
              code: 'tasks',
              title: 'Tasks',
              href: 'javascript:alert(1)',
              tags: null,
            },
          ],
        })}
      />,
    );
    expect(screen.queryAllByRole('link')).toHaveLength(0);
    expect(
      screen.getByRole('heading', { name: '<script>unsafe</script>' }),
    ).toBeInTheDocument();
  });
  it('provides matching page anchors and a text alternative for conceptual flows', () => {
    render(
      <CmsComponentRenderer
        channel="web"
        component={fixture({
          mode: 'detail',
          heading: 'Solutions',
          items: [
            {
              code: 'tasks',
              title: 'Tasks',
              flow: ['Trigger', 'Run', 'Review'],
              useCases: [],
              scope: [],
            },
          ],
        })}
      />,
    );
    expect(screen.getByRole('link', { name: /Tasks/ })).toHaveAttribute(
      'href',
      '#tasks',
    );
    expect(document.getElementById('tasks')).toBeInTheDocument();
    expect(screen.getByText('Trigger → Run → Review')).toBeVisible();
  });
});
