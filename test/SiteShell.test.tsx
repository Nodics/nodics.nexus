import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { SiteShell } from '../src/app/SiteShell';

describe('Nexus site shell navigation', () => {
  it('marks the matching second-level route as active', () => {
    window.history.pushState({}, '', '/about');
    render(
      <SiteShell axisBaseUrl="http://localhost:3100">
        <p>About page</p>
      </SiteShell>,
    );
    const primaryNavigation = screen.getByRole('navigation', {
      name: 'Primary navigation',
    });
    expect(
      within(primaryNavigation).getByRole('link', { name: 'About' }),
    ).toHaveAttribute('aria-current', 'page');
  });

  it('marks Wiki active for documentation routes', () => {
    window.history.pushState({}, '', '/docs');
    render(
      <SiteShell axisBaseUrl="http://localhost:3100">
        <p>Docs page</p>
      </SiteShell>,
    );
    const primaryNavigation = screen.getByRole('navigation', {
      name: 'Primary navigation',
    });
    expect(
      within(primaryNavigation).getByRole('link', { name: 'Wiki' }),
    ).toHaveAttribute('aria-current', 'page');
  });
});
