import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { CmsComponentRenderer } from '../src/cms/RendererRegistry';
import type { CmsComponentContract } from '../src/cms/cmsContract';
const component = (
  renderer: string,
  properties: Record<string, unknown>,
): CmsComponentContract => ({
  code: 'portfolio',
  typeCode: 'productType',
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
const products = [
  {
    title: 'Waste Management',
    category: 'Waste & circularity',
    href: '/products/waste-management',
  },
  {
    title: 'Agora Apparel',
    category: 'Commerce',
    href: '/products/agora-apparel',
  },
];
describe('Product portfolio', () => {
  it('presents all homepage products and supports keyboard selection without navigating', async () => {
    const user = userEvent.setup();
    render(
      <CmsComponentRenderer
        channel="web"
        component={component('nexus.component.product-portfolio', {
          mode: 'compact',
          products,
        })}
      />,
    );
    const waste = screen.getByRole('tab', { name: /Waste Management/ });
    const apparel = screen.getByRole('tab', { name: /Agora Apparel/ });
    expect(waste).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tabpanel')).toHaveAccessibleName(
      /Waste Management/,
    );
    waste.focus();
    await user.keyboard('{ArrowRight}');
    expect(apparel).toHaveFocus();
    expect(apparel).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tabpanel')).toHaveAccessibleName(/Agora Apparel/);
    expect(
      screen.getByRole('link', { name: 'Explore Agora Apparel' }),
    ).toHaveAttribute('href', '/products/agora-apparel');
    await user.keyboard('{Home}');
    expect(waste).toHaveFocus();
    expect(screen.getByRole('tabpanel')).toHaveAccessibleName(
      /Waste Management/,
    );
  });
  it('filters the cards while preserving the complete comparison', async () => {
    const user = userEvent.setup();
    render(
      <CmsComponentRenderer
        channel="web"
        component={component('nexus.component.product-portfolio', { products })}
      />,
    );
    await user.click(screen.getByRole('button', { name: 'Commerce' }));
    expect(
      screen.queryByRole('heading', { name: 'Waste Management' }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: 'Agora Apparel' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('rowheader', { name: 'Waste Management' }),
    ).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'All products' }));
    expect(
      screen.getByRole('heading', { name: 'Waste Management' }),
    ).toBeInTheDocument();
  });
  it('rejects script and external navigation from managed product links', () => {
    render(
      <CmsComponentRenderer
        channel="web"
        component={component('nexus.component.product-portfolio', {
          mode: 'compact',
          products: [
            { title: 'Unsafe', href: 'javascript:alert(1)' },
            { title: 'External', href: '//example.com' },
            { title: 'Backslash', href: '/\\example.com' },
          ],
        })}
      />,
    );
    expect(
      screen.queryByRole('link', { name: /Explore/ }),
    ).not.toBeInTheDocument();
  });
});
describe('Product visual tour', () => {
  it('switches screen content and opens and closes the native modal', async () => {
    const user = userEvent.setup();
    const show = vi.fn(function (this: HTMLDialogElement) {
      this.setAttribute('open', '');
    });
    const close = vi.fn(function (this: HTMLDialogElement) {
      this.removeAttribute('open');
    });
    Object.defineProperty(HTMLDialogElement.prototype, 'showModal', {
      configurable: true,
      value: show,
    });
    Object.defineProperty(HTMLDialogElement.prototype, 'close', {
      configurable: true,
      value: close,
    });
    render(
      <CmsComponentRenderer
        channel="web"
        component={component('nexus.component.product-story', {
          gallery: [
            { label: 'Desktop', caption: 'Desktop view' },
            { label: 'Mobile', caption: 'Mobile view', format: 'mobile' },
          ],
        })}
      />,
    );
    const mobile = screen.getByRole('button', { name: 'Mobile' });
    mobile.focus();
    await user.keyboard('{Enter}');
    expect(mobile).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'Desktop' })).toHaveAttribute(
      'aria-pressed',
      'false',
    );
    await user.click(
      screen.getByRole('button', { name: 'Enlarge Mobile screen' }),
    );
    expect(show).toHaveBeenCalledOnce();
    expect(screen.getByRole('dialog', { name: 'Mobile' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Close screen ×' }));
    expect(close).toHaveBeenCalledOnce();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    Reflect.deleteProperty(HTMLDialogElement.prototype, 'showModal');
    Reflect.deleteProperty(HTMLDialogElement.prototype, 'close');
  });
});
