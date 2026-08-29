import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import {
  DEFAULT_NEXUS_SITE_SHELL,
  SiteShell,
  type SiteShellContent,
} from '../src/app/SiteShell';

const shell: SiteShellContent = {
  brandLabel: 'NODICS',
  brandSubtitle: 'NEXUS',
  brandSummary:
    'Where enterprise capabilities, technology, and knowledge connect.',
  contactHeading: 'Connect',
  contactEmail: 'nodics.framework@gmail.com',
  navigation: [
    { label: 'Home', href: '/', id: 'home' },
    { label: 'About', href: '/#aboutus', id: 'about' },
    { label: 'Blogs', href: '/blogs', id: 'blogs' },
    { label: 'Docs', href: '/docs', id: 'wiki' },
    { label: 'Axis', href: '{axisBaseUrl}', id: 'axis' },
  ],
  footerGroups: [
    {
      title: 'Developers',
      links: [
        { label: 'API Reference', href: '/docs?tab=api' },
        { label: 'Blogs', href: '/blogs' },
        { label: 'Axis', href: '{axisBaseUrl}' },
      ],
    },
  ],
  legalLinks: [],
  socialLinks: [],
};

describe('Nexus site shell navigation', () => {
  it('does not render corporate chrome when CMS shell content is absent', () => {
    window.history.pushState({}, '', '/');
    render(
      <SiteShell axisBaseUrl="http://localhost:3100">
        <p>Published content only</p>
      </SiteShell>,
    );
    expect(screen.getByText('Published content only')).toBeInTheDocument();
    expect(
      screen.queryByRole('navigation', { name: 'Primary navigation' }),
    ).toBeNull();
    expect(document.querySelector('.site-footer')).toBeNull();
  });

  it('marks the matching second-level route as active', () => {
    window.history.pushState({}, '', '/about');
    render(
      <SiteShell axisBaseUrl="http://localhost:3100" shell={shell}>
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
    window.history.pushState({}, '', '/docs/framework');
    render(
      <SiteShell axisBaseUrl="http://localhost:3100" shell={shell}>
        <p>Docs page</p>
      </SiteShell>,
    );
    const primaryNavigation = screen.getByRole('navigation', {
      name: 'Primary navigation',
    });
    expect(
      within(primaryNavigation).getByRole('link', { name: 'Docs' }),
    ).toHaveAttribute('aria-current', 'page');
  });

  it('opens the API reference through the documentation tab state', () => {
    window.history.pushState({}, '', '/');
    render(
      <SiteShell axisBaseUrl="http://localhost:3100" shell={shell}>
        <p>Home page</p>
      </SiteShell>,
    );
    expect(screen.getByRole('link', { name: 'API Reference' })).toHaveAttribute(
      'href',
      '/docs?tab=api',
    );
  });

  it('points default Blogs menu links to the homepage Blogs section', () => {
    const primaryBlogsLink = DEFAULT_NEXUS_SITE_SHELL.navigation.find(
      (item) => item.id === 'blogs',
    );
    const footerBlogsLink = DEFAULT_NEXUS_SITE_SHELL.footerGroups
      .flatMap((group) => group.links)
      .find((item) => item.label === 'Blogs');

    expect(primaryBlogsLink).toMatchObject({ href: '/#blogs' });
    expect(footerBlogsLink).toMatchObject({ href: '/#blogs' });
  });

  it('normalizes CMS Blogs shell links to the homepage Blogs section', () => {
    window.history.pushState({}, '', '/support');
    render(
      <SiteShell axisBaseUrl="http://localhost:3100" shell={shell}>
        <p>Support page</p>
      </SiteShell>,
    );

    const blogsLinks = screen.getAllByRole('link', { name: 'Blogs' });
    expect(blogsLinks).toHaveLength(2);
    blogsLinks.forEach((link) => {
      expect(link).toHaveAttribute('href', '/#blogs');
    });
  });

  it('opens Axis links in a new browser tab', () => {
    window.history.pushState({}, '', '/');
    render(
      <SiteShell axisBaseUrl="http://localhost:3100" shell={shell}>
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
