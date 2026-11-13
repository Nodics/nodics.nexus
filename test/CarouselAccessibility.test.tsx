import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  BannerCarouselRenderer,
  TestimonialsRenderer,
} from '../src/cms/renderers/CorporateRenderers';
import type { CmsComponentContract } from '../src/cms/cmsContract';
const base: CmsComponentContract = {
  code: 'carousel',
  typeCode: 'test',
  active: true,
  renderer: 'test',
  rendererContractVersion: 1,
  rendererChannels: ['web'],
  rendererDeprecated: false,
  slot: 'main',
  index: 0,
  properties: { rotationIntervalMs: 2000, fadeDurationMs: 400 },
  components: [],
};
const slides = ['First slide', 'Second slide'].map((heading, index) => ({
  ...base,
  code: 'slide' + index,
  renderer: 'nexus.component.banner-slide',
  properties: { heading },
}));
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});
describe('Carousel accessibility', () => {
  it('pauses on request and retains a keyboard manual route through every banner', () => {
    vi.useFakeTimers();
    render(
      <BannerCarouselRenderer component={{ ...base, components: slides }} />,
    );
    fireEvent.click(
      screen.getByRole('button', { name: 'Pause automatic rotation' }),
    );
    act(() => vi.advanceTimersByTime(20000));
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      'First slide',
    );
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      'Second slide',
    );
    fireEvent.click(screen.getByRole('button', { name: 'Previous' }));
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      'First slide',
    );
  });
  it('keeps reduced-motion banners and testimonials stationary while preserving manual controls', () => {
    vi.useFakeTimers();
    vi.stubGlobal('matchMedia', () => ({
      matches: true,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }));
    render(
      <>
        <BannerCarouselRenderer component={{ ...base, components: slides }} />
        <TestimonialsRenderer
          component={{
            ...base,
            properties: {
              items: [
                { quote: 'First quote', name: 'One' },
                { quote: 'Second quote', name: 'Two' },
              ],
            },
          }}
        />
      </>,
    );
    act(() => vi.advanceTimersByTime(60000));
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      'First slide',
    );
    expect(screen.getByText(/First quote/)).toBeVisible();
    expect(
      screen.queryByRole('button', { name: 'Pause automatic rotation' }),
    ).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Next testimonial' }));
    expect(screen.getByText(/Second quote/)).toBeVisible();
  });
});
