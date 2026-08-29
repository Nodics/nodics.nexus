import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Brand } from '../components/Brand';
import { SocialLinks, type SocialChannel } from '../components/SocialLinks';

export interface SiteShellLink {
  readonly label: string;
  readonly href: string;
  readonly id?: string;
}

export interface SiteShellFooterGroup {
  readonly title: string;
  readonly links: readonly SiteShellLink[];
}

export interface SiteShellContent {
  readonly brandLabel?: string;
  readonly brandSubtitle?: string;
  readonly brandSummary?: string;
  readonly contactHeading?: string;
  readonly contactEmail?: string;
  readonly navigation: readonly SiteShellLink[];
  readonly footerGroups: readonly SiteShellFooterGroup[];
  readonly legalText?: string;
  readonly legalLinks: readonly SiteShellLink[];
  readonly socialLinks: readonly SocialChannel[];
}

export const DEFAULT_NEXUS_SITE_SHELL: SiteShellContent = Object.freeze({
  brandLabel: 'NODICS',
  brandSubtitle: 'NEXUS',
  brandSummary:
    'Where enterprise capabilities, technology, and knowledge connect.',
  contactHeading: 'Connect',
  contactEmail: 'nodics.framework@gmail.com',
  navigation: Object.freeze([
    Object.freeze({ label: 'Home', href: '/', id: 'home' }),
    Object.freeze({ label: 'About', href: '/#aboutus', id: 'about' }),
    Object.freeze({ label: 'Features', href: '/#features', id: 'features' }),
    Object.freeze({ label: 'Solutions', href: '/#products', id: 'products' }),
    Object.freeze({ label: 'Support', href: '/#support', id: 'support' }),
    Object.freeze({ label: 'Blogs', href: '/#blogs', id: 'blogs' }),
    Object.freeze({ label: 'Docs', href: '/docs', id: 'wiki' }),
    Object.freeze({ label: 'Axis', href: '{axisBaseUrl}', id: 'axis' }),
  ]),
  footerGroups: Object.freeze([
    Object.freeze({
      title: 'Platform',
      links: Object.freeze([
        Object.freeze({ label: 'Features', href: '/#features' }),
        Object.freeze({ label: 'Solutions', href: '/#products' }),
        Object.freeze({ label: 'Technology Stack', href: '/#products' }),
        Object.freeze({ label: 'Support', href: '/#support' }),
      ]),
    }),
    Object.freeze({
      title: 'Developers',
      links: Object.freeze([
        Object.freeze({ label: 'Docs', href: '/docs' }),
        Object.freeze({ label: 'API Reference', href: '/docs?tab=api' }),
        Object.freeze({ label: 'GitHub', href: 'https://github.com/Nodics' }),
        Object.freeze({ label: 'Axis', href: '{axisBaseUrl}' }),
      ]),
    }),
    Object.freeze({
      title: 'Company',
      links: Object.freeze([
        Object.freeze({ label: 'About', href: '/#aboutus' }),
        Object.freeze({ label: 'Ecosystem', href: '/#ecosystem' }),
        Object.freeze({ label: 'Contact', href: '/#contact' }),
        Object.freeze({ label: 'Testimonials', href: '/#testimonials' }),
      ]),
    }),
    Object.freeze({
      title: 'Resources',
      links: Object.freeze([
        Object.freeze({ label: 'Blogs', href: '/#blogs' }),
        Object.freeze({ label: 'News', href: '/news' }),
        Object.freeze({ label: 'Documentation Gateway', href: '/docs' }),
      ]),
    }),
  ]),
  legalText: '(c) 2026 Nodics. All rights reserved.',
  legalLinks: Object.freeze([
    Object.freeze({ label: 'Privacy', href: '/privacy' }),
    Object.freeze({ label: 'Terms', href: '/terms' }),
    Object.freeze({ label: 'Cookies', href: '/cookies' }),
  ]),
  socialLinks: Object.freeze([
    Object.freeze({ name: 'GitHub', href: 'https://github.com/Nodics' }),
    Object.freeze({
      name: 'LinkedIn',
      href: 'https://www.linkedin.com/company/nodics',
    }),
  ]),
});

function normalizedHref(href: string, axisBaseUrl: string): string {
  if (href === 'axis' || href === '{axisBaseUrl}') return axisBaseUrl;
  return href;
}

function normalizedShellHref(item: SiteShellLink, axisBaseUrl: string): string {
  if (item.id === 'blogs' || item.label.toLowerCase() === 'blogs')
    return '/#blogs';
  return normalizedHref(item.href, axisBaseUrl);
}

function hrefPath(href: string): string {
  try {
    return new URL(href, window.location.origin).pathname;
  } catch {
    return href.split('#')[0].split('?')[0] || '/';
  }
}

function activeNavigationFromPath(
  pathname: string,
  navigation: readonly SiteShellLink[],
): string {
  const exactMatch = navigation.find(
    (item) => hrefPath(item.href) === pathname,
  );
  if (exactMatch) return exactMatch.id ?? exactMatch.label;
  if (pathname.startsWith('/docs/')) {
    const docsMatch = navigation.find(
      (item) => hrefPath(item.href) === '/docs',
    );
    if (docsMatch) return docsMatch.id ?? docsMatch.label;
  }
  const segment = pathname.split('/').filter(Boolean)[0];
  const segmentMatch = navigation.find((item) => item.id === segment);
  if (segmentMatch) return segmentMatch.id ?? segmentMatch.label;
  if (
    pathname.startsWith('/blog') ||
    pathname.startsWith('/news') ||
    pathname.startsWith('/editorial')
  )
    return 'blogs';
  return '';
}

export function SiteShell({
  axisBaseUrl,
  children,
  shell,
}: {
  readonly axisBaseUrl: string;
  readonly children: ReactNode;
  readonly shell?: SiteShellContent;
}) {
  if (!shell)
    return (
      <main className="site-shell-content-only" id="main-content">
        {children}
      </main>
    );
  return (
    <SiteShellChrome axisBaseUrl={axisBaseUrl} shell={shell}>
      {children}
    </SiteShellChrome>
  );
}

function SiteShellChrome({
  axisBaseUrl,
  children,
  shell,
}: {
  readonly axisBaseUrl: string;
  readonly children: ReactNode;
  readonly shell: SiteShellContent;
}) {
  const [headerIsScrolled, setHeaderIsScrolled] = useState(false);
  const [mobileNavigationOpen, setMobileNavigationOpen] = useState(false);
  const [activeNavigation, setActiveNavigation] = useState(() =>
    activeNavigationFromPath(window.location.pathname, shell.navigation),
  );
  const documentationRoute = window.location.pathname.startsWith('/docs');
  const documentationLanding = window.location.pathname === '/docs';
  const homeSectionNavigation = useMemo(
    () =>
      shell.navigation
        .map((item) => {
          const href = normalizedShellHref(item, axisBaseUrl);
          const hash = href.includes('#') ? href.split('#')[1] : '';
          return hash ? ([hash, item.id ?? item.label] as const) : undefined;
        })
        .filter((item): item is readonly [string, string] => Boolean(item)),
    [axisBaseUrl, shell.navigation],
  );
  useEffect(() => {
    const updateHeader = () => setHeaderIsScrolled(window.scrollY > 48);
    updateHeader();
    window.addEventListener('scroll', updateHeader, { passive: true });
    return () => window.removeEventListener('scroll', updateHeader);
  }, []);

  useEffect(() => {
    const closeMobileNavigation = () => {
      if (window.innerWidth > 850) setMobileNavigationOpen(false);
    };
    window.addEventListener('resize', closeMobileNavigation);
    return () => window.removeEventListener('resize', closeMobileNavigation);
  }, []);

  useEffect(() => {
    const updateActiveNavigation = () => {
      const pathActiveNavigation = activeNavigationFromPath(
        window.location.pathname,
        shell.navigation,
      );
      if (window.location.pathname !== '/') {
        setActiveNavigation(pathActiveNavigation);
        return;
      }
      const headerOffset = headerIsScrolled ? 100 : 120;
      const activeSection = homeSectionNavigation.reduce<string>(
        (current, [sectionId, navigationId]) => {
          const section = document.getElementById(sectionId);
          if (!section) return current;
          return section.getBoundingClientRect().top <= headerOffset
            ? navigationId
            : current;
        },
        'home',
      );
      setActiveNavigation(activeSection);
    };
    updateActiveNavigation();
    window.addEventListener('scroll', updateActiveNavigation, {
      passive: true,
    });
    window.addEventListener('hashchange', updateActiveNavigation);
    window.addEventListener('popstate', updateActiveNavigation);
    return () => {
      window.removeEventListener('scroll', updateActiveNavigation);
      window.removeEventListener('hashchange', updateActiveNavigation);
      window.removeEventListener('popstate', updateActiveNavigation);
    };
  }, [headerIsScrolled, homeSectionNavigation, shell.navigation]);

  return (
    <div className="site-shell">
      <header
        className={`site-header${headerIsScrolled ? ' is-scrolled' : ''}${documentationRoute ? ' docs-context' : ''}${documentationLanding ? ' docs-landing-context' : ''}${mobileNavigationOpen ? ' is-menu-open' : ''}`}
      >
        <Brand label={shell.brandLabel} subtitle={shell.brandSubtitle} />
        <button
          aria-controls="primary-navigation"
          aria-expanded={mobileNavigationOpen}
          aria-label="Toggle primary navigation"
          className="mobile-navigation-toggle"
          onClick={() => setMobileNavigationOpen((open) => !open)}
          type="button"
        >
          <span />
          <span />
          <span />
        </button>
        <nav
          aria-label="Primary navigation"
          className={mobileNavigationOpen ? 'is-open' : undefined}
          id="primary-navigation"
        >
          {shell.navigation.map((item) => {
            const href = normalizedShellHref(item, axisBaseUrl);
            return (
              <a
                aria-current={
                  activeNavigation === (item.id ?? item.label)
                    ? 'page'
                    : undefined
                }
                className={
                  activeNavigation === (item.id ?? item.label)
                    ? 'active'
                    : undefined
                }
                href={href}
                key={`${item.label}-${item.href}`}
                onClick={() => setMobileNavigationOpen(false)}
                rel={href.startsWith('http') ? 'noreferrer' : undefined}
                target={href.startsWith('http') ? '_blank' : undefined}
              >
                {item.label}
              </a>
            );
          })}
        </nav>
      </header>
      <main id="main-content">{children}</main>
      <footer className="site-footer">
        <div className="footer-brand-panel">
          <Brand label={shell.brandLabel} subtitle={shell.brandSubtitle} />
          {shell.brandSummary ? <p>{shell.brandSummary}</p> : null}
          <div className="footer-connect">
            {shell.contactHeading ? <h2>{shell.contactHeading}</h2> : null}
            <SocialLinks channels={shell.socialLinks} />
            {shell.contactEmail ? (
              <a href={`mailto:${shell.contactEmail}`}>{shell.contactEmail}</a>
            ) : null}
          </div>
        </div>
        <div className="footer-link-grid">
          {shell.footerGroups.map((group) => (
            <div className="footer-link-column" key={group.title}>
              <h2>{group.title}</h2>
              {group.links.map((item) => (
                <a
                  href={normalizedShellHref(item, axisBaseUrl)}
                  key={`${group.title}-${item.label}`}
                  rel={
                    normalizedShellHref(item, axisBaseUrl).startsWith('http')
                      ? 'noreferrer'
                      : undefined
                  }
                  target={
                    normalizedShellHref(item, axisBaseUrl).startsWith('http')
                      ? '_blank'
                      : undefined
                  }
                >
                  {item.label}
                </a>
              ))}
            </div>
          ))}
        </div>
        {shell.legalText || shell.legalLinks.length ? (
          <div className="footer-legal">
            {shell.legalText ? <span>{shell.legalText}</span> : null}
            {shell.legalLinks.map((item) => (
              <a href={normalizedHref(item.href, axisBaseUrl)} key={item.label}>
                {item.label}
              </a>
            ))}
          </div>
        ) : null}
      </footer>
    </div>
  );
}
