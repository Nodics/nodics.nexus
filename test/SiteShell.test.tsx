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

  it('opens the API reference through the documentation tab state', () => {
    window.history.pushState({}, '', '/');
    render(
      <SiteShell axisBaseUrl="http://localhost:3100">
        <p>Home page</p>
      </SiteShell>,
    );
    expect(screen.getByRole('link', { name: 'API Reference' })).toHaveAttribute(
      'href',
      '/docs?tab=api',
    );
  });

  it('opens Axis links in a new browser tab', () => {
    window.history.pushState({}, '', '/');
    render(
      <SiteShell axisBaseUrl="http://localhost:3100">
        <p>Home page</p>
      </SiteShell>,
    );
    for (const link of screen.getAllByRole('link', { name: 'Axis' })) {
      expect(link).toHaveAttribute('href', 'http://localhost:3100');
      expect(link).toHaveAttribute('target', '_blank');
      expect(link).toHaveAttribute('rel', 'noreferrer');
    }
  });
});
