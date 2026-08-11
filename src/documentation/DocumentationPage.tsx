import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { resolveCmsPage } from '../cms/cmsClient';
import type {
  CmsComponentContract,
  CmsResolvedPageContract,
} from '../cms/cmsContract';
import type { NexusRuntimeConfig } from '../runtime/runtimeConfig';
import { ReadOnlyApiReference } from './ReadOnlyApiReference';

const sources = [
  {
    prefix: '/docs/framework/process',
    site: 'nodicsDocumentationSite',
    title: 'Nodics Framework',
    description:
      'Framework architecture, modules, contracts, security, and extension guidance.',
    href: '/docs/framework',
  },
  {
    prefix: '/docs/framework',
    site: 'nodicsDocumentationSite',
    title: 'Nodics Framework',
    description:
      'Framework architecture, modules, contracts, security, and extension guidance.',
    href: '/docs/framework',
  },
  {
    prefix: '/docs/nodics-axis',
    site: 'axisDocumentationSite',
    title: 'Nodics Axis',
    description:
      'BackOffice journeys, administration, content operations, and governance.',
    href: '/docs/nodics-axis',
  },
  {
    prefix: '/docs/nodics-kickoff',
    site: 'kickoffDocumentationSite',
    title: 'Nodics Kickoff',
    description:
      'Local setup, reference runtime composition, and customer customization.',
    href: '/docs/nodics-kickoff',
  },
] as const;

type State =
  | { status: 'loading' }
  | { status: 'ready'; page: CmsResolvedPageContract }
  | { status: 'failed'; message: string };

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
  if (kind === 'code' || kind === 'diagram')
    return (
      <pre>
        <code>{text}</code>
      </pre>
    );
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
    const audience = Array.isArray(candidate.audience)
      ? candidate.audience.map(safeText).filter(Boolean)
      : [];
    const searchText = safeText(candidate.searchText);
    return title && route.startsWith('/docs')
      ? [{ title, route, category, audience, searchText }]
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

function DocsLanding({ config }: { readonly config: NexusRuntimeConfig }) {
  const areas = [
    {
      id: 'framework',
      label: 'Framework',
      eyebrow: 'Nodics Framework',
      heading: 'Understand the foundation before composing the journey.',
      description:
        'Explore architecture, runtime contracts, modular ownership, security, content, commerce, and business automation across the unified Nodics framework.',
      href: '/docs/framework',
      linkLabel: 'Start with the Framework overview',
      topics: [
        {
          code: '01',
          title: 'Architecture',
          text: 'Core principles, module boundaries, runtime composition, and extension contracts.',
          href: '/docs/framework',
        },
        {
          code: '02',
          title: 'Process & Automation',
          text: 'Workflow definitions, runtime instances, tasks, recovery, scheduling, and visual design.',
          href: '/docs/framework/process',
        },
        {
          code: '03',
          title: 'Capability guides',
          text: 'Implementation guidance for platform, content, commerce, security, and operations.',
          href: '/docs/framework',
        },
      ],
    },
    {
      id: 'axis',
      label: 'Axis',
      eyebrow: 'Nodics Axis',
      heading: 'Operate the framework through one governed workspace.',
      description:
        'Learn the BackOffice navigation, administrative journeys, content operations, schema tools, governance, and AI-assisted operational workflows.',
      href: '/docs/nodics-axis',
      linkLabel: 'Open the Axis guide',
      topics: [
        {
          code: '01',
          title: 'Workspace',
          text: 'Understand navigation, perspectives, capability discovery, and contextual help.',
          href: '/docs/nodics-axis',
        },
        {
          code: '02',
          title: 'Administration',
          text: 'Operate content, media, schemas, imports, configurations, and business capabilities.',
          href: '/docs/nodics-axis',
        },
        {
          code: '03',
          title: 'Governed AI',
          text: 'Use AI assistance while preserving permissions, human authority, and audit evidence.',
          href: '/docs/nodics-axis',
        },
      ],
    },
    {
      id: 'kickoff',
      label: 'Kickoff',
      eyebrow: 'Nodics Kickoff',
      heading: 'Move from checkout to a working local reference solution.',
      description:
        'Follow environment setup, server composition, local acceptance, deployment qualification, and customer-owned customization guidance.',
      href: '/docs/nodics-kickoff',
      linkLabel: 'Begin the Kickoff journey',
      topics: [
        {
          code: '01',
          title: 'Local setup',
          text: 'Prepare the framework, project runtime, Axis, and Nexus applications.',
          href: '/docs/nodics-kickoff',
        },
        {
          code: '02',
          title: 'Runtime topology',
          text: 'Understand server responsibilities, ports, dependencies, and startup order.',
          href: '/docs/nodics-kickoff/kickoff-local-runtime',
        },
        {
          code: '03',
          title: 'Customization',
          text: 'Extend project-owned code and data without copying framework authority.',
          href: '/docs/nodics-kickoff/kickoff-customization',
        },
      ],
    },
    {
      id: 'api',
      label: 'API Reference',
      eyebrow: 'Live OpenAPI',
      heading: 'Explore the backend contract safely.',
      description:
        'Browse operations, parameters, responses, and schemas without authentication or request execution.',
      href: '/docs/api',
      linkLabel: 'Browse the API reference',
      topics: [],
    },
  ] as const;
  const [activeArea, setActiveArea] =
    useState<(typeof areas)[number]['id']>('framework');
  const selected = areas.find((area) => area.id === activeArea) ?? areas[0];
  return (
    <div className="docs-landing">
      <section className="docs-landing-hero">
        <img
          alt="Nodics enterprise architecture and documentation workspace"
          src="/assets/nodics/about-architecture-workshop-v2.png"
        />
        <div className="docs-landing-hero-shade" />
        <div className="docs-landing-hero-copy">
          <p className="eyebrow">Nodics Wiki</p>
          <h1>Documentation</h1>
          <nav className="docs-landing-breadcrumbs" aria-label="Breadcrumb">
            <a href="/">Home</a>
            <span>›</span>
            <strong>Wiki</strong>
          </nav>
          <p>
            Build, operate, and evolve Nodics through one connected knowledge
            experience.
          </p>
        </div>
      </section>
      <section className="docs-explorer">
        <div
          className="docs-tabs"
          role="tablist"
          aria-label="Documentation areas"
        >
          {areas.map((area, index) => (
            <button
              aria-controls={`docs-panel-${area.id}`}
              aria-selected={activeArea === area.id}
              className={activeArea === area.id ? 'active' : ''}
              id={`docs-tab-${area.id}`}
              key={area.id}
              role="tab"
              type="button"
              onClick={() => setActiveArea(area.id)}
            >
              <span>0{index + 1}</span>
              {area.label}
            </button>
          ))}
        </div>
        <div
          aria-labelledby={`docs-tab-${selected.id}`}
          className="docs-tab-panel"
          id={`docs-panel-${selected.id}`}
          role="tabpanel"
        >
          {selected.id === 'api' ? (
            <ReadOnlyApiReference config={config} />
          ) : (
            <DocumentationPage
              config={config}
              embedded
              key={selected.id}
              path={selected.href}
            />
          )}
        </div>
      </section>
    </div>
  );
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
  const source = useMemo(
    () =>
      sources.find(
        (item) => path === item.prefix || path.startsWith(`${item.prefix}/`),
      ),
    [path],
  );
  const [state, setState] = useState<State>({ status: 'loading' });
  const [query, setQuery] = useState('');
  const [audience, setAudience] = useState('');
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
            message:
              error instanceof Error
                ? error.message
                : 'Documentation is unavailable',
          });
      });
    return () => controller.abort();
  }, [config, path, source]);
  if (path === '/docs') return <DocsLanding config={config} />;
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
  return (
    <div className={`docs-layout${embedded ? ' docs-layout-embedded' : ''}`}>
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
        <nav>
          {filteredItems.map((item) => (
            <a
              className={item.route === path ? 'active' : ''}
              href={item.route}
              key={item.route}
            >
              {item.title}
            </a>
          ))}
        </nav>
        {filteredItems.length === 0 ? (
          <p className="docs-empty">
            {safeText(navigation?.properties.emptyMessage) ||
              'No documentation matches your search.'}
          </p>
        ) : null}
      </aside>
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
          {(Array.isArray(article?.properties.audience)
            ? article.properties.audience.map(safeText).filter(Boolean)
            : []
          ).map((item) => (
            <span key={item}>{item}</span>
          ))}
        </div>
        <h1>{articleTitle}</h1>
        {safeText(article?.properties.summary) ? (
          <p className="docs-summary">
            {safeText(article?.properties.summary)}
          </p>
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
}
