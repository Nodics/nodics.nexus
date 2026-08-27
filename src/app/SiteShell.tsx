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

function normalizedHref(href: string, axisBaseUrl: string): string {
  if (href === 'axis' || href === '{axisBaseUrl}') return axisBaseUrl;
  return href;
}

function hrefPath(href: string): string {
  try {
    return new URL(href, window.location.origin).pathname;
  } catch {
    return href.split('#')[0].split('?')[0] || '/';
  }
}

function activeNavigationFromPath(pathname: string, navigation: readonly SiteShellLink[]): string {
  const exactMatch = navigation.find((item) => hrefPath(item.href) === pathname);
  if (exactMatch) return exactMatch.id ?? exactMatch.label;
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
  return <SiteShellChrome axisBaseUrl={axisBaseUrl} shell={shell}>{children}</SiteShellChrome>;
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
          const hash = item.href.includes('#') ? item.href.split('#')[1] : '';
          return hash ? [hash, item.id ?? item.label] as const : undefined;
        })
        .filter((item): item is readonly [string, string] => Boolean(item)),
    [shell.navigation],
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
          {shell.navigation.map((item) => (
            <a
              aria-current={activeNavigation === (item.id ?? item.label) ? 'page' : undefined}
              className={activeNavigation === (item.id ?? item.label) ? 'active' : undefined}
              href={normalizedHref(item.href, axisBaseUrl)}
              key={`${item.label}-${item.href}`}
              onClick={() => setMobileNavigationOpen(false)}
              rel={normalizedHref(item.href, axisBaseUrl).startsWith('http') ? 'noreferrer' : undefined}
              target={normalizedHref(item.href, axisBaseUrl).startsWith('http') ? '_blank' : undefined}
            >
              {item.label}
            </a>
          ))}
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
            {shell.contactEmail ? <a href={`mailto:${shell.contactEmail}`}>{shell.contactEmail}</a> : null}
          </div>
        </div>
        <div className="footer-link-grid">
          {shell.footerGroups.map((group) => (
            <div className="footer-link-column" key={group.title}>
              <h2>{group.title}</h2>
              {group.links.map((item) => (
                <a
                  href={normalizedHref(item.href, axisBaseUrl)}
                  key={`${group.title}-${item.label}`}
                  rel={normalizedHref(item.href, axisBaseUrl).startsWith('http') ? 'noreferrer' : undefined}
                  target={normalizedHref(item.href, axisBaseUrl).startsWith('http') ? '_blank' : undefined}
                >
                  {item.label}
                </a>
              ))}
            </div>
          ))}
        </div>
        {(shell.legalText || shell.legalLinks.length) ? (
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
