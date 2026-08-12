import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Brand } from '../components/Brand';
import { SocialLinks } from '../components/SocialLinks';

const navigation = [
  ['Home', '/', 'home'],
  ['About', '/#aboutus', 'about'],
  ['Features', '/#features', 'features'],
  ['Products', '/#products', 'products'],
  ['Support', '/#support', 'support'],
  ['Blogs', '/#blogs', 'blogs'],
  ['Contact', '/#contact', 'contact'],
] as const;

const homeSectionNavigation = [
  ['aboutus', 'about'],
  ['features', 'features'],
  ['products', 'products'],
  ['support', 'support'],
  ['blogs', 'blogs'],
  ['contact', 'contact'],
] as const;

const footerGroups = [
  {
    title: 'Platform',
    links: [
      ['Features', '/#features'],
      ['Products', '/#products'],
      ['Technology Stack', '/#products'],
      ['Support', '/#support'],
    ],
  },
  {
    title: 'Developers',
    links: [
      ['Wiki', '/docs'],
      ['API Reference', '/docs?tab=api'],
      ['GitHub', 'https://github.com/Nodics'],
      ['Axis', ''],
    ],
  },
  {
    title: 'Company',
    links: [
      ['About', '/#aboutus'],
      ['Ecosystem', '/#ecosystem'],
      ['Contact', '/#contact'],
      ['Testimonials', '/#testimonials'],
    ],
  },
  {
    title: 'Resources',
    links: [
      ['Blogs', '/blogs'],
      ['News', '/news'],
      ['Documentation Gateway', '/docs'],
    ],
  },
  {
    title: 'Legal',
    links: [
      ['Privacy', '/privacy'],
      ['Terms', '/terms'],
      ['Cookies', '/cookies'],
    ],
  },
] as const;

function activeNavigationFromPath(pathname: string): string {
  if (pathname === '/') return 'home';
  if (pathname.startsWith('/docs')) return 'wiki';
  if (
    pathname.startsWith('/blog') ||
    pathname.startsWith('/news') ||
    pathname.startsWith('/editorial')
  )
    return 'blogs';
  const segment = pathname.split('/').filter(Boolean)[0];
  if (
    segment &&
    ['about', 'features', 'products', 'support', 'contact'].includes(segment)
  )
    return segment;
  return '';
}

export function SiteShell({
  axisBaseUrl,
  children,
}: {
  readonly axisBaseUrl: string;
  readonly children: ReactNode;
}) {
  const [headerIsScrolled, setHeaderIsScrolled] = useState(false);
  const [mobileNavigationOpen, setMobileNavigationOpen] = useState(false);
  const [activeNavigation, setActiveNavigation] = useState(() =>
    activeNavigationFromPath(window.location.pathname),
  );
  const wikiHref = '/docs';
  const documentationRoute = window.location.pathname.startsWith('/docs');
  const documentationLanding = window.location.pathname === '/docs';
  const axisUrl = useMemo(() => {
    try {
      return new URL(axisBaseUrl);
    } catch {
      return undefined;
    }
  }, [axisBaseUrl]);

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
  }, [headerIsScrolled]);

  return (
    <div className="site-shell">
      <header
        className={`site-header${headerIsScrolled ? ' is-scrolled' : ''}${documentationRoute ? ' docs-context' : ''}${documentationLanding ? ' docs-landing-context' : ''}${mobileNavigationOpen ? ' is-menu-open' : ''}`}
      >
        <Brand />
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
          {navigation.map(([label, href, id]) => (
            <a
              aria-current={activeNavigation === id ? 'page' : undefined}
              className={activeNavigation === id ? 'active' : undefined}
              href={href}
              key={href}
              onClick={() => setMobileNavigationOpen(false)}
            >
              {label}
            </a>
          ))}
          <a
            aria-current={
              axisUrl?.origin === window.location.origin ? 'page' : undefined
            }
            className={
              axisUrl?.origin === window.location.origin ? 'active' : undefined
            }
            href={axisBaseUrl}
            onClick={() => setMobileNavigationOpen(false)}
            rel="noreferrer"
            target="_blank"
          >
            Axis
          </a>
          <a
            aria-current={activeNavigation === 'wiki' ? 'page' : undefined}
            className={`nav-docs${activeNavigation === 'wiki' ? ' active' : ''}`}
            href={wikiHref}
            onClick={() => setMobileNavigationOpen(false)}
          >
            Wiki
          </a>
        </nav>
      </header>
      <main id="main-content">{children}</main>
      <footer className="site-footer">
        <div className="footer-brand-panel">
          <Brand />
          <p>
            Where enterprise capabilities, technology, and knowledge connect.
          </p>
          <div className="footer-connect">
            <h2>Connect</h2>
            <SocialLinks />
            <a href="mailto:nodics.framework@gmail.com">
              nodics.framework@gmail.com
            </a>
          </div>
        </div>
        <div className="footer-link-grid">
          {footerGroups.map((group) => (
            <div className="footer-link-column" key={group.title}>
              <h2>{group.title}</h2>
              {group.links.map(([label, href]) => (
                <a
                  href={label === 'Axis' ? axisBaseUrl : href}
                  key={`${group.title}-${label}`}
                  rel={
                    label === 'Axis' || href.startsWith('https://')
                      ? 'noreferrer'
                      : undefined
                  }
                  target={
                    label === 'Axis' || href.startsWith('https://')
                      ? '_blank'
                      : undefined
                  }
                >
                  {label}
                </a>
              ))}
            </div>
          ))}
        </div>
        <div className="footer-legal">
          <span>© 2026 Nodics. All rights reserved.</span>
          <span>Nodics Nexus</span>
          <a href="/privacy">Privacy</a>
          <a href="/terms">Terms</a>
          <a href="/cookies">Cookies</a>
        </div>
      </footer>
    </div>
  );
}
