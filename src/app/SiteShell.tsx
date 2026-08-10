import { useEffect, useState, type ReactNode } from 'react';
import { Brand } from '../components/Brand';
import { SocialLinks } from '../components/SocialLinks';

const navigation = [
  ['Home', '/'],
  ['About', '/#aboutus'],
  ['Features', '/#features'],
  ['Products', '/#products'],
  ['Support', '/#support'],
  ['Blogs', '/#blogs'],
  ['Contact', '/contact'],
] as const;
export function SiteShell({
  axisBaseUrl,
  children,
}: {
  readonly axisBaseUrl: string;
  readonly children: ReactNode;
}) {
  const [headerIsScrolled, setHeaderIsScrolled] = useState(false);
  const wikiHref = '/docs';
  const documentationRoute = window.location.pathname.startsWith('/docs');
  const documentationLanding = window.location.pathname === '/docs';

  useEffect(() => {
    const updateHeader = () => setHeaderIsScrolled(window.scrollY > 48);
    updateHeader();
    window.addEventListener('scroll', updateHeader, { passive: true });
    return () => window.removeEventListener('scroll', updateHeader);
  }, []);

  return (
    <div className="site-shell">
      <header
        className={`site-header${headerIsScrolled ? ' is-scrolled' : ''}${documentationRoute ? ' docs-context' : ''}${documentationLanding ? ' docs-landing-context' : ''}`}
      >
        <Brand />
        <nav aria-label="Primary navigation">
          {navigation.map(([label, href]) => (
            <a href={href} key={href}>
              {label}
            </a>
          ))}
          <a href={axisBaseUrl}>Axis</a>
          <a className="nav-docs" href={wikiHref}>
            Wiki
          </a>
        </nav>
      </header>
      <main id="main-content">{children}</main>
      <footer className="site-footer">
        <div>
          <Brand />
          <p>
            Where enterprise capabilities, technology, and knowledge connect.
          </p>
        </div>
        <div>
          <h2>Explore</h2>
          {navigation.map(([label, href]) => (
            <a href={href} key={href}>
              {label}
            </a>
          ))}
          <a href={axisBaseUrl}>Axis</a>
        </div>
        <div>
          <h2>Connect</h2>
          <SocialLinks />
          <a href={wikiHref}>Wiki</a>
        </div>
        <div className="footer-legal">
          <span>© 2026 Nodics</span>
          <a href="/privacy">Privacy</a>
          <a href="/terms">Terms</a>
          <a href="/cookies">Cookies</a>
        </div>
      </footer>
    </div>
  );
}
