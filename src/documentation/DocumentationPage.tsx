import mermaid from 'mermaid';
import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from 'react';
import { CmsPageDeliveryError, resolveCmsPage } from '../cms/cmsClient';
import type {
  CmsComponentContract,
  CmsResolvedPageContract,
} from '../cms/cmsContract';
import type { NexusRuntimeConfig } from '../runtime/runtimeConfig';
import { ReadOnlyApiReference } from './ReadOnlyApiReference';

interface DocumentationSource {
  readonly site: string;
  readonly title: string;
}

function documentationSourceForPath(
  path: string,
): DocumentationSource | undefined {
  if (path === '/docs' || path.startsWith('/docs/framework'))
    return { site: 'nodicsDocumentationSite', title: 'Nodics Documentation' };
  if (path.startsWith('/docs/nodics-axis'))
    return { site: 'axisDocumentationSite', title: 'Nodics Axis' };
  if (path.startsWith('/docs/nodics-kickoff'))
    return { site: 'kickoffDocumentationSite', title: 'Nodics Kickoff' };
  return undefined;
}

type State =
  | { status: 'loading' }
  | { status: 'ready'; page: CmsResolvedPageContract }
  | { status: 'failed'; message: string };

const navigationWidthStorageKey = 'nexus.documentation.navigationWidth';
const defaultNavigationWidth = 320;
const minNavigationWidth = 260;
const maxNavigationWidth = 560;

function clampNavigationWidth(width: number): number {
  return Math.min(
    maxNavigationWidth,
    Math.max(minNavigationWidth, Math.round(width)),
  );
}

function initialNavigationWidth(): number {
  if (typeof window === 'undefined') return defaultNavigationWidth;
  const storedValue = window.localStorage.getItem(navigationWidthStorageKey);
  if (!storedValue) return defaultNavigationWidth;
  const stored = Number(storedValue);
  return Number.isFinite(stored)
    ? clampNavigationWidth(stored)
    : defaultNavigationWidth;
}

function documentationFailureMessage(error: unknown): string {
  const isNotFound =
    error instanceof CmsPageDeliveryError
      ? error.kind === 'not-found'
      : Boolean(
          error &&
          typeof error === 'object' &&
          'kind' in error &&
          (error as { readonly kind?: unknown }).kind === 'not-found',
        );
  if (isNotFound)
    return 'This documentation page is not published for public Nexus readers yet.';
  return error instanceof Error
    ? error.message
    : 'Documentation is unavailable';
}

function safeText(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

function inlineText(value: string): ReactNode {
  const parts = value.split(/(`[^`]+`|\*\*[^*]+\*\*)/u);
  return parts.map((part, index) => {
    if (part.startsWith('`') && part.endsWith('`'))
      return <code key={index}>{part.slice(1, -1)}</code>;
    if (part.startsWith('**') && part.endsWith('**'))
      return <strong key={index}>{part.slice(2, -2)}</strong>;
    return part;
  });
}

const MAX_DIAGRAM_LENGTH = 20_000;

function stringList(value: unknown, limit = 50): readonly string[] {
  return Array.isArray(value)
    ? value.slice(0, limit).map(safeText).filter(Boolean)
    : [];
}

function DocumentationDiagram({
  block,
}: {
  readonly block: Record<string, unknown>;
}) {
  const diagramId = useId().replace(/:/g, '');
  const diagramText = safeText(block.text).slice(0, MAX_DIAGRAM_LENGTH);
  const title = safeText(block.title) || 'Documentation diagram';
  const [svg, setSvg] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    mermaid.initialize({
      startOnLoad: false,
      securityLevel: 'strict',
      theme: 'base',
      themeVariables: {
        background: '#ffffff',
        fontFamily: 'Inter, system-ui, sans-serif',
        primaryColor: '#fff7dc',
        primaryBorderColor: '#f7c600',
        primaryTextColor: '#17191c',
        lineColor: '#6b7280',
        secondaryColor: '#ecfdf5',
        tertiaryColor: '#eff6ff',
      },
    });
    mermaid
      .render(`nexusDocsDiagram${diagramId}`, diagramText)
      .then((result) => {
        if (!active) return;
        setSvg(result.svg);
        setError('');
      })
      .catch(() => {
        if (!active) return;
        setSvg('');
        setError(
          'Diagram could not be rendered. The source is shown below for troubleshooting.',
        );
      });
    return () => {
      active = false;
    };
  }, [diagramId, diagramText]);

  return (
    <figure className="docs-diagram">
      <figcaption>{title}</figcaption>
      {svg ? (
        <div
          className="docs-diagram-canvas"
          dangerouslySetInnerHTML={{ __html: svg }}
        />
      ) : null}
      {error ? (
        <div className="docs-diagram-fallback" role="alert">
          <p>{error}</p>
          <pre>
            <code>{diagramText}</code>
          </pre>
        </div>
      ) : null}
    </figure>
  );
}

function DocumentationBlock({
  block,
}: {
  readonly block: Record<string, unknown>;
}) {
  const kind = safeText(block.kind);
  const text = safeText(block.text);
  if (kind === 'heading') {
    const level = Number(block.level);
    const Tag = level <= 2 ? 'h2' : level === 3 ? 'h3' : 'h4';
    return <Tag id={safeText(block.anchor) || undefined}>{text}</Tag>;
  }
  if (kind === 'paragraph') return <p>{inlineText(text)}</p>;
  if (kind === 'blockquote') return <blockquote>{inlineText(text)}</blockquote>;
  if (kind === 'code')
    return (
      <pre>
        <code>{text}</code>
      </pre>
    );
  if (kind === 'diagram') return <DocumentationDiagram block={block} />;
  if (kind === 'unordered-list' || kind === 'ordered-list') {
    const items = Array.isArray(block.items) ? block.items.map(safeText) : [];
    const Tag = kind === 'ordered-list' ? 'ol' : 'ul';
    return (
      <Tag>
        {items.map((item) => (
          <li key={item}>{inlineText(item)}</li>
        ))}
      </Tag>
    );
  }
  if (kind === 'table') {
    const headers = Array.isArray(block.headers)
      ? block.headers.map(safeText)
      : [];
    const rows = Array.isArray(block.rows) ? block.rows : [];
    return (
      <div className="docs-table-wrap">
        <table>
          <thead>
            <tr>
              {headers.map((item) => (
                <th key={item}>{item}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr key={index}>
                {(Array.isArray(row) ? row : []).map((item, cellIndex) => (
                  <td key={cellIndex}>{inlineText(safeText(item))}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }
  return text ? <p>{inlineText(text)}</p> : null;
}

function navigationItems(component: CmsComponentContract) {
  const items = component.properties.items;
  if (!Array.isArray(items)) return [];
  return items.flatMap((item) => {
    if (!item || typeof item !== 'object' || Array.isArray(item)) return [];
    const candidate = item as Record<string, unknown>;
    const title = safeText(candidate.title);
    const route = safeText(candidate.route);
    const category =
      safeText(candidate.sectionTitle) || safeText(candidate.section);
    const section = category || 'Documentation';
    const sectionOrder =
      typeof candidate.sectionOrder === 'number' ? candidate.sectionOrder : 100;
    const group = section;
    const groupOrder = sectionOrder;
    const audience = Array.isArray(candidate.audience)
      ? candidate.audience.map(safeText).filter(Boolean)
      : [];
    const searchText = safeText(candidate.searchText);
    const order = typeof candidate.order === 'number' ? candidate.order : 100;
    return title && route.startsWith('/docs')
      ? [
          {
            title,
            route,
            category,
            section,
            sectionOrder,
            group,
            groupOrder,
            audience,
            searchText,
            order,
          },
        ]
      : [];
  });
}

function documentationLink(value: unknown) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return;
  const record = value as Record<string, unknown>;
  const title = safeText(record.title);
  const route = safeText(record.route);
  return title && route.startsWith('/docs') ? { title, route } : undefined;
}

export function DocumentationPage({
  config,
  embedded = false,
  path,
}: {
  readonly config: NexusRuntimeConfig;
  readonly embedded?: boolean;
  readonly path: string;
}) {
  const source = useMemo(() => documentationSourceForPath(path), [path]);
  const [state, setState] = useState<State>({ status: 'loading' });
  const [query, setQuery] = useState('');
  const [audience, setAudience] = useState('');
  const [navigationWidth, setNavigationWidth] = useState(
    initialNavigationWidth,
  );
  const resizeStartRef = useRef<Readonly<{ x: number; width: number }> | null>(
    null,
  );
  const stopResizeRef = useRef<() => void>(() => undefined);

  const handleNavigationResize = useCallback((event: PointerEvent) => {
    if (!resizeStartRef.current) return;
    setNavigationWidth(
      clampNavigationWidth(
        resizeStartRef.current.width + event.clientX - resizeStartRef.current.x,
      ),
    );
  }, []);

  const stopNavigationResize = useCallback(() => {
    resizeStartRef.current = null;
    document.removeEventListener('pointermove', handleNavigationResize);
    document.removeEventListener('pointerup', stopResizeRef.current);
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
  }, [handleNavigationResize]);

  useEffect(() => {
    window.localStorage.setItem(
      navigationWidthStorageKey,
      String(navigationWidth),
    );
  }, [navigationWidth]);

  useEffect(() => {
    stopResizeRef.current = stopNavigationResize;
  }, [stopNavigationResize]);

  useEffect(() => () => stopResizeRef.current(), []);

  useEffect(() => {
    if (!source) return;
    const controller = new AbortController();
    void resolveCmsPage({
      cmsBaseUrl: config.endpoints.cms,
      enterpriseCode: config.enterpriseCode,
      site: source.site,
      path,
      locale: config.defaultLocale,
      channel: config.channel,
      timeoutMs: config.requestTimeoutMs,
      signal: controller.signal,
    })
      .then((page) => setState({ status: 'ready', page }))
      .catch((error: unknown) => {
        if (!controller.signal.aborted)
          setState({
            status: 'failed',
            message: documentationFailureMessage(error),
          });
      });
    return () => controller.abort();
  }, [config, path, source]);
  if (path === '/docs/api')
    return (
      <main className="docs-api-page">
        <ReadOnlyApiReference config={config} />
      </main>
    );
  if (!source)
    return (
      <section className="page-state">
        <h1>Documentation page not found</h1>
        <a className="button button-primary" href="/docs">
          Back to Wiki
        </a>
      </section>
    );
  if (state.status === 'loading')
    return (
      <div className="page-state">
        <span className="loader" />
        Loading documentation…
      </div>
    );
  if (state.status === 'failed')
    return (
      <section className="page-state" role="alert">
        <h1>Documentation unavailable</h1>
        <p>{state.message}</p>
        <a className="button button-primary" href="/docs">
          Back to Wiki
        </a>
      </section>
    );
  const page = state.page.page;
  if (
    page.renderer !== 'documentation.page.article' ||
    page.templateContract.renderer !== 'documentation.template.article'
  )
    return (
      <section className="page-state" role="alert">
        <h1>Incompatible documentation contract</h1>
      </section>
    );
  const navigation = page.components.find(
    (item) => item.renderer === 'documentation.component.navigation',
  );
  const article = page.components.find(
    (item) => item.renderer === 'documentation.component.article',
  );
  const items = navigation ? navigationItems(navigation) : [];
  const audiences = [...new Set(items.flatMap((item) => item.audience))].sort();
  const normalizedQuery = query.trim().toLocaleLowerCase();
  const filteredItems = items.filter((item) => {
    const searchable = [
      item.title,
      item.category,
      item.searchText,
      ...item.audience,
    ]
      .join(' ')
      .toLocaleLowerCase();
    return (
      (!normalizedQuery || searchable.includes(normalizedQuery)) &&
      (!audience || item.audience.includes(audience))
    );
  });
  const groupedItems = filteredItems.reduce((result, item) => {
    const section = item.section || item.category || 'Documentation';
    const sectionEntry = result.get(section) ?? {
      order: item.sectionOrder,
      items: [] as typeof filteredItems,
    };
    sectionEntry.order = Math.min(sectionEntry.order, item.sectionOrder);
    sectionEntry.items.push(item);
    result.set(section, sectionEntry);
    return result;
  }, new Map<string, { order: number; items: typeof filteredItems }>());
  const blocks =
    article && Array.isArray(article.properties.blocks)
      ? article.properties.blocks
      : [];
  const headings =
    article && Array.isArray(article.properties.headings)
      ? article.properties.headings.flatMap((item) => {
          if (!item || typeof item !== 'object' || Array.isArray(item))
            return [];
          const heading = item as Record<string, unknown>;
          const label = safeText(heading.text);
          const anchor = safeText(heading.anchor);
          const level = Number(heading.level) || 2;
          return label && anchor && level > 1 ? [{ label, anchor, level }] : [];
        })
      : [];
  const previous = documentationLink(article?.properties.previous);
  const next = documentationLink(article?.properties.next);
  const sectionTitle =
    safeText(article?.properties.sectionTitle) || source.title;
  const articleTitle = safeText(article?.properties.title) || page.name;
  const visualRequirements = stringList(article?.properties.visualRequirements);
  const maturityState = safeText(article?.properties.maturityState);
  const accessMode = safeText(article?.properties.accessMode);
  const lifecycleState = safeText(article?.properties.lifecycleState);
  const audienceItems = Array.isArray(article?.properties.audience)
    ? article.properties.audience.map(safeText).filter(Boolean)
    : [];
  const articleSummary = safeText(article?.properties.summary);
  const renderNavigationLinks = (groupItems: typeof filteredItems) =>
    [...groupItems]
      .sort(
        (left, right) =>
          left.order - right.order || left.title.localeCompare(right.title),
      )
      .map((item) => (
        <a
          className={item.route === path ? 'active' : ''}
          href={item.route}
          key={item.route}
        >
          {item.title}
        </a>
      ));
  const layout = (
    <div
      className={`docs-layout${embedded ? ' docs-layout-embedded' : ''}`}
      style={
        {
          '--docs-navigation-width': `${navigationWidth}px`,
        } as CSSProperties
      }
    >
      <aside className="docs-sidebar">
        <a className="docs-back" href="/docs">
          ← Wiki home
        </a>
        <h2>{safeText(navigation?.properties.title) || source.title}</h2>
        <label className="docs-search">
          <span>
            {safeText(navigation?.properties.searchLabel) ||
              'Search documentation'}
          </span>
          <input
            placeholder={
              safeText(navigation?.properties.searchPlaceholder) ||
              'Search documentation'
            }
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>
        <div
          className="docs-audiences"
          aria-label="Documentation audience filters"
        >
          {audiences.map((item) => (
            <button
              className={audience === item ? 'active' : ''}
              key={item}
              type="button"
              onClick={() =>
                setAudience((current) => (current === item ? '' : item))
              }
            >
              {item}
            </button>
          ))}
        </div>
        <nav className="docs-nav-tree">
          {[...groupedItems.entries()]
            .sort(
              (left, right) =>
                left[1].order - right[1].order ||
                left[0].localeCompare(right[0]),
            )
            .map(([section, sectionEntry]) => (
              <details key={section} open>
                <summary>{section}</summary>
                <div className="docs-nav-links">
                  {renderNavigationLinks(sectionEntry.items)}
                </div>
              </details>
            ))}
        </nav>
        {filteredItems.length === 0 ? (
          <p className="docs-empty">
            {safeText(navigation?.properties.emptyMessage) ||
              'No documentation matches your search.'}
          </p>
        ) : null}
      </aside>
      <div
        aria-label="Resize documentation navigation"
        aria-valuemax={maxNavigationWidth}
        aria-valuemin={minNavigationWidth}
        aria-valuenow={navigationWidth}
        className="docs-layout-resizer"
        onDoubleClick={() => setNavigationWidth(defaultNavigationWidth)}
        onPointerDown={(event) => {
          event.preventDefault();
          resizeStartRef.current = {
            x: event.clientX,
            width: navigationWidth,
          };
          document.body.style.cursor = 'col-resize';
          document.body.style.userSelect = 'none';
          document.addEventListener('pointermove', handleNavigationResize);
          document.addEventListener('pointerup', stopResizeRef.current);
        }}
        role="separator"
        tabIndex={0}
      />
      <article className="docs-article">
        <nav className="docs-breadcrumbs" aria-label="Documentation breadcrumb">
          <a href="/docs">Wiki</a>
          <span>/</span>
          <span>{sectionTitle}</span>
          <span>/</span>
          <strong>{articleTitle}</strong>
        </nav>
        <div className="docs-meta">
          <span>{sectionTitle}</span>
          {audienceItems.map((item) => (
            <span key={item}>{item}</span>
          ))}
          {maturityState ? <span>{maturityState}</span> : null}
          {accessMode ? <span>{accessMode}</span> : null}
          {lifecycleState ? <span>{lifecycleState}</span> : null}
        </div>
        <h1>{articleTitle}</h1>
        {articleSummary ? (
          <p className="docs-summary">{articleSummary}</p>
        ) : null}
        {visualRequirements.length > 0 ? (
          <div
            className="docs-visual-contract"
            aria-label="Visual requirements"
          >
            <strong>Visual contract</strong>
            {visualRequirements.map((requirement) => (
              <span key={requirement}>{requirement}</span>
            ))}
          </div>
        ) : null}
        {headings.length > 0 ? (
          <nav className="docs-toc" aria-label="On this page">
            <strong>On this page</strong>
            {headings.map((heading) => (
              <a
                href={`#${heading.anchor}`}
                key={heading.anchor}
                style={{
                  paddingLeft: `${String(Math.max(0, heading.level - 2) * 14)}px`,
                }}
              >
                {heading.label}
              </a>
            ))}
          </nav>
        ) : null}
        {blocks.map((block, index) =>
          block && typeof block === 'object' && !Array.isArray(block) ? (
            <DocumentationBlock
              block={block as Record<string, unknown>}
              key={index}
            />
          ) : null,
        )}
        {previous || next ? (
          <nav className="docs-adjacent" aria-label="Adjacent documentation">
            <div>
              {previous ? (
                <a href={previous.route}>← {previous.title}</a>
              ) : null}
            </div>
            <div>{next ? <a href={next.route}>{next.title} →</a> : null}</div>
          </nav>
        ) : null}
      </article>
    </div>
  );
  if (embedded) return layout;
  return (
    <div className="docs-detail-page">
      <section className="docs-detail-hero">
        <div
          aria-label="Nodics documentation workspace"
          className="docs-detail-hero-media"
          role="img"
        />
        <div className="docs-detail-hero-shade" />
        <div className="docs-detail-hero-copy">
          <p className="eyebrow">Nodics Wiki</p>
          <nav className="docs-landing-breadcrumbs" aria-label="Breadcrumb">
            <a href="/">Home</a>
            <span>›</span>
            <a href="/docs">Wiki</a>
            <span>›</span>
            <strong>{sectionTitle}</strong>
          </nav>
          <h1>{sectionTitle}</h1>
          <p>{articleSummary || articleTitle}</p>
          <div className="docs-detail-hero-meta" aria-label="Page context">
            <span>{articleTitle}</span>
            {audienceItems.slice(0, 3).map((item) => (
              <span key={item}>{item}</span>
            ))}
          </div>
        </div>
      </section>
      {layout}
    </div>
  );
}
