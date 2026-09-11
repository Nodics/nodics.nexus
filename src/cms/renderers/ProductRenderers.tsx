import { useId, useRef, useState } from 'react';
import type { CmsComponentContract } from '../cmsContract';
import { referenceImageSource } from '../referenceImages';
import { useOptionalNexusRuntimeConfig } from '../../runtime/NexusRuntimeConfigContext';
import { items, strings, text, type Properties } from './propertyReaders';
import '../../styles/productPortfolio.css';

type Props = { readonly component: CmsComponentContract };
const localHref = (value: string) =>
  /^\/(?!\/)[^\\\s]*$/u.test(value) ? value : undefined;
function ProductImage({
  value,
  className = '',
}: {
  readonly value: Properties;
  readonly className?: string;
}) {
  const runtime = useOptionalNexusRuntimeConfig();
  const src = referenceImageSource(
    text(value, 'referenceImageCode'),
    runtime?.config.endpoints.cms,
  );
  return src ? (
    <img
      className={className}
      src={src}
      alt={text(value, 'imageAlt')}
      loading="lazy"
    />
  ) : null;
}
function ProductPortfolioEntry({
  product,
  index,
}: {
  readonly product: Properties;
  readonly index: number;
}) {
  const href = localHref(text(product, 'href'));
  const mobile =
    product.mobileScreen &&
    typeof product.mobileScreen === 'object' &&
    !Array.isArray(product.mobileScreen)
      ? (product.mobileScreen as Properties)
      : undefined;
  return (
    <article className="product-entry">
      <div className="product-entry-copy">
        <div className="product-entry-topline">
          <span className="product-entry-number">
            {String(index + 1).padStart(2, '0')}
          </span>
          <span>{text(product, 'category')}</span>
        </div>
        <p className="eyebrow">{text(product, 'edition')}</p>
        <h3>{text(product, 'title')}</h3>
        <p className="product-entry-summary">{text(product, 'summary')}</p>
        <ul className="product-entry-capabilities">
          {strings(product, 'highlights').map((item) => (
            <li key={item}>
              <span aria-hidden="true">✓</span>
              {item}
            </li>
          ))}
        </ul>
        <div className="product-entry-audience">
          <span>Built for</span>
          <p>{text(product, 'audience')}</p>
        </div>
        {href && (
          <a className="product-entry-link" href={href}>
            Explore {text(product, 'title')} <span aria-hidden="true">↗</span>
          </a>
        )}
      </div>
      <div className="product-entry-visual">
        <div className="product-entry-preview-label">
          <span>{text(product, 'title')}</span>
          <span>Experience preview</span>
        </div>
        <a
          className="product-entry-preview"
          href={href}
          aria-label={`View ${text(product, 'title')} product`}
        >
          <div className="product-entry-desktop">
            <div className="product-entry-browser" aria-hidden="true">
              <i />
              <i />
              <i />
            </div>
            <ProductImage value={product} />
          </div>
          {mobile && (
            <div className="product-entry-phone">
              <ProductImage value={mobile} />
            </div>
          )}
          <span className="product-entry-preview-action" aria-hidden="true">
            Explore the experience ↗
          </span>
        </a>
      </div>
    </article>
  );
}
export function ProductPortfolioRenderer({ component }: Props) {
  return text(component.properties, 'mode') === 'compact' ? (
    <ProductShowcaseRenderer component={component} />
  ) : (
    <ProductDashboardRenderer component={component} />
  );
}
function ProductShowcaseRenderer({ component }: Props) {
  const p = component.properties;
  const products = items(p, 'products');
  const [selected, setSelected] = useState(0);
  const id = useId();
  const active = Math.min(selected, Math.max(0, products.length - 1));
  return (
    <section
      className="product-showcase"
      id={text(p, 'anchor', 'products')}
      aria-labelledby={`${id}-heading`}
    >
      <div className="product-wrap">
        <header className="product-showcase-heading">
          <div>
            <p className="eyebrow">{text(p, 'kicker')}</p>
            <h2 id={`${id}-heading`}>{text(p, 'heading')}</h2>
          </div>
          <div className="product-showcase-intro">
            <p>{text(p, 'body')}</p>
            <a href={localHref(text(p, 'href'))}>
              {text(p, 'linkLabel')} <span aria-hidden="true">↗</span>
            </a>
          </div>
        </header>
        <div
          className="product-showcase-tabs"
          role="tablist"
          aria-label="Explore Nodics products"
        >
          {products.map((product, index) => (
            <button
              key={text(product, 'title')}
              id={`${id}-tab-${index}`}
              role="tab"
              type="button"
              aria-selected={active === index}
              aria-controls={`${id}-panel-${index}`}
              tabIndex={active === index ? 0 : -1}
              onClick={() => setSelected(index)}
              onKeyDown={(event) => {
                let next = index;
                if (event.key === 'ArrowRight')
                  next = (index + 1) % products.length;
                else if (event.key === 'ArrowLeft')
                  next = (index - 1 + products.length) % products.length;
                else if (event.key === 'Home') next = 0;
                else if (event.key === 'End') next = products.length - 1;
                else return;
                event.preventDefault();
                setSelected(next);
                const tabs =
                  event.currentTarget.parentElement?.querySelectorAll<HTMLButtonElement>(
                    '[role="tab"]',
                  );
                tabs?.item(next)?.focus();
              }}
            >
              <span className="product-showcase-tab-number" aria-hidden="true">
                {String(index + 1).padStart(2, '0')}
              </span>
              <span>
                <strong>{text(product, 'title')}</strong>
                <small>{text(product, 'edition')}</small>
              </span>
              <span className="product-showcase-tab-arrow" aria-hidden="true">
                ↗
              </span>
            </button>
          ))}
        </div>
        {products.map((product, index) => {
          const mobile =
            product.mobileScreen &&
            typeof product.mobileScreen === 'object' &&
            !Array.isArray(product.mobileScreen)
              ? (product.mobileScreen as Properties)
              : undefined;
          const href = localHref(text(product, 'href'));
          return (
            <div
              className="product-showcase-panel"
              key={text(product, 'title')}
              id={`${id}-panel-${index}`}
              role="tabpanel"
              aria-labelledby={`${id}-tab-${index}`}
              hidden={active !== index}
            >
              <div className="product-showcase-copy">
                <p className="eyebrow">{text(product, 'category')}</p>
                <h3>{text(product, 'title')}</h3>
                <p className="product-showcase-summary">
                  {text(product, 'summary')}
                </p>
                <ul>
                  {strings(product, 'highlights').map((item) => (
                    <li key={item}>
                      <span aria-hidden="true">✓</span>
                      {item}
                    </li>
                  ))}
                </ul>
                <p className="product-showcase-audience">
                  {text(product, 'audience')}
                </p>
                {href && (
                  <a className="product-showcase-detail" href={href}>
                    Explore {text(product, 'title')}
                    <span aria-hidden="true">↗</span>
                  </a>
                )}
              </div>
              <div className="product-showcase-visual">
                <div className="product-showcase-visual-label">
                  <span>{text(product, 'edition')}</span>
                  <span aria-hidden="true">
                    {String(index + 1).padStart(2, '0')} /{' '}
                    {String(products.length).padStart(2, '0')}
                  </span>
                </div>
                <div className="product-showcase-desktop">
                  <div className="product-showcase-browser" aria-hidden="true">
                    <i />
                    <i />
                    <i />
                    <span>{text(product, 'title')}</span>
                  </div>
                  <ProductImage value={product} />
                </div>
                {mobile && (
                  <div className="product-showcase-phone">
                    <ProductImage value={mobile} />
                  </div>
                )}
                <p className="product-showcase-screen-note">
                  {text(p, 'previewLabel')}
                </p>
              </div>
            </div>
          );
        })}
        <footer className="product-showcase-footer">
          <p>{text(p, 'showcaseNote')}</p>
          <a href="/contact">
            {text(p, 'contactLabel')} <span aria-hidden="true">→</span>
          </a>
        </footer>
      </div>
    </section>
  );
}
function ProductDashboardRenderer({ component }: Props) {
  const p = component.properties;
  const products = items(p, 'products');
  const [category, setCategory] = useState('All products');
  const categories = [
    'All products',
    ...new Set(
      products.map((product) => text(product, 'category')).filter(Boolean),
    ),
  ];
  const visible =
    category === 'All products'
      ? products
      : products.filter((product) => text(product, 'category') === category);
  const comparisonId = useId();
  return (
    <section
      id={text(p, 'anchor', 'products')}
      className="product-portfolio product-dashboard"
    >
      <div className="product-wrap">
        <header className="product-dashboard-heading">
          <div>
            <p className="eyebrow">{text(p, 'kicker')}</p>
            <h2>{text(p, 'heading')}</h2>
          </div>
          <div>
            <p>{text(p, 'body')}</p>
            <a href={`#${comparisonId}`}>
              Compare the products <span aria-hidden="true">↓</span>
            </a>
          </div>
        </header>
        <div className="product-dashboard-toolbar">
          <div
            className="product-filters"
            role="group"
            aria-label="Filter products by industry"
          >
            {categories.map((item) => (
              <button
                key={item}
                type="button"
                aria-pressed={category === item}
                onClick={() => setCategory(item)}
              >
                {item}
              </button>
            ))}
          </div>
          <p aria-live="polite">
            <strong>{String(visible.length).padStart(2, '0')}</strong>{' '}
            {visible.length === 1 ? 'product' : 'products'} to explore
          </p>
        </div>
        <div className="product-entries">
          {visible.map((product) => (
            <ProductPortfolioEntry
              key={text(product, 'title')}
              product={product}
              index={products.indexOf(product)}
            />
          ))}
        </div>
        <section
          className="product-comparison product-dashboard-comparison"
          id={comparisonId}
          aria-labelledby={`${comparisonId}-heading`}
        >
          <div className="product-comparison-heading">
            <div>
              <p className="eyebrow">{text(p, 'comparisonKicker')}</p>
              <h2 id={`${comparisonId}-heading`}>
                {text(p, 'comparisonHeading')}
              </h2>
            </div>
            <span aria-hidden="true">↙</span>
          </div>
          <p className="product-comparison-scroll-hint">
            Scroll horizontally to compare <span aria-hidden="true">→</span>
          </p>
          <div
            className="product-table-scroll"
            role="region"
            aria-label="Product comparison"
            tabIndex={0}
          >
            <table>
              <thead>
                <tr>
                  <th scope="col">Product</th>
                  <th scope="col">Business use</th>
                  <th scope="col">Included experience</th>
                  <th scope="col">Adoption focus</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product, index) => (
                  <tr key={text(product, 'title')}>
                    <th scope="row">
                      <span
                        className="product-comparison-number"
                        aria-hidden="true"
                      >
                        {String(index + 1).padStart(2, '0')}
                      </span>
                      <a href={localHref(text(product, 'href'))}>
                        {text(product, 'title')}
                      </a>
                    </th>
                    <td>{text(product, 'audience')}</td>
                    <td>
                      <ul>
                        {strings(product, 'highlights').map((item) => (
                          <li key={item}>{item}</li>
                        ))}
                      </ul>
                    </td>
                    <td>{text(product, 'adoption')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
        <div className="product-dashboard-adoption">
          <div>
            <p className="eyebrow">{text(p, 'adoptionKicker')}</p>
            <h2>{text(p, 'adoptionHeading')}</h2>
            <p>{text(p, 'adoptionBody')}</p>
          </div>
          <a href="/contact">
            Discuss your product <span aria-hidden="true">↗</span>
          </a>
        </div>
        <div className="product-dashboard-footnote">
          <p>{text(p, 'readinessNote')}</p>
          <a href="/solutions">
            Explore solution directions <span aria-hidden="true">→</span>
          </a>
        </div>
      </div>
    </section>
  );
}
function ProductTour({ p }: { readonly p: Properties }) {
  const gallery = items(p, 'gallery');
  const [selected, setSelected] = useState(0);
  const current = gallery[selected] ?? gallery[0];
  const dialog = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const panelId = useId();
  if (!current) return null;
  return (
    <section id="product-tour" className="product-tour">
      <div className="product-tour-heading">
        <div>
          <p className="eyebrow">{text(p, 'tourKicker')}</p>
          <h2>{text(p, 'tourHeading')}</h2>
        </div>
        <p>{text(p, 'tourBody')}</p>
      </div>
      <div
        className="product-tour-controls"
        role="group"
        aria-label="Choose a product screen"
      >
        {gallery.map((entry, index) => (
          <button
            key={text(entry, 'label')}
            type="button"
            aria-pressed={selected === index}
            aria-controls={panelId}
            onClick={() => setSelected(index)}
          >
            {text(entry, 'label')}
          </button>
        ))}
      </div>
      <figure
        id={panelId}
        className={`product-screen-stage${text(current, 'format') === 'mobile' ? ' product-screen-mobile' : ''}`}
      >
        <button
          className="product-screen-open"
          type="button"
          onClick={() => dialog.current?.showModal()}
          aria-label={`Enlarge ${text(current, 'label')} screen`}
        >
          <ProductImage value={current} />
          <span>
            View full screen <span aria-hidden="true">↗</span>
          </span>
        </button>
        <figcaption>{text(current, 'caption')}</figcaption>
      </figure>
      <dialog
        ref={dialog}
        className="product-screen-dialog"
        aria-labelledby={titleId}
      >
        <div className="product-dialog-bar">
          <h3 id={titleId}>{text(current, 'label')}</h3>
          <button
            type="button"
            onClick={() => dialog.current?.close()}
            autoFocus
          >
            Close screen ×
          </button>
        </div>
        <ProductImage value={current} />
        <p>{text(current, 'caption')}</p>
      </dialog>
    </section>
  );
}
export function ProductStoryRenderer({ component }: Props) {
  const p = component.properties;
  return (
    <div className="product-story">
      <div className="product-wrap">
        <nav className="product-subnav" aria-label="Product page">
          <a href="/products">← All products</a>
          <a href="#product-tour">Visual tour</a>
          <a href="#product-capabilities">Capabilities</a>
          <a href="#product-adoption">Adoption</a>
        </nav>
        <section className="product-introduction">
          <div>
            <p className="eyebrow">{text(p, 'kicker')}</p>
            <h2>{text(p, 'heading')}</h2>
            <p className="product-lead">{text(p, 'body')}</p>
            <p className="product-audience">
              <strong>Built for</strong> {text(p, 'audience')}
            </p>
            <a className="button button-primary" href="#product-tour">
              Take the visual tour
            </a>
          </div>
          <div className="product-outcomes">
            {items(p, 'outcomes').map((item, i) => (
              <article key={text(item, 'title')}>
                <span>{String(i + 1).padStart(2, '0')}</span>
                <div>
                  <h3>{text(item, 'title')}</h3>
                  <p>{text(item, 'body')}</p>
                </div>
              </article>
            ))}
          </div>
        </section>
        <ProductTour p={p} />
        <section id="product-capabilities" className="product-capabilities">
          <p className="eyebrow">{text(p, 'capabilitiesKicker')}</p>
          <h2>{text(p, 'capabilitiesHeading')}</h2>
          <div className="product-feature-grid">
            {items(p, 'capabilities').map((item) => (
              <article key={text(item, 'title')}>
                <h3>{text(item, 'title')}</h3>
                <p>{text(item, 'body')}</p>
              </article>
            ))}
          </div>
        </section>
        <section className="product-workflow">
          <p className="eyebrow">{text(p, 'workflowKicker')}</p>
          <h2>{text(p, 'workflowHeading')}</h2>
          <ol>
            {items(p, 'workflow').map((item, i) => (
              <li key={text(item, 'title')}>
                <span>{String(i + 1).padStart(2, '0')}</span>
                <h3>{text(item, 'title')}</h3>
                <p>{text(item, 'body')}</p>
              </li>
            ))}
          </ol>
        </section>
        <section id="product-adoption" className="product-readiness">
          <div>
            <p className="eyebrow">{text(p, 'adoptionKicker')}</p>
            <h2>{text(p, 'adoptionHeading')}</h2>
            <p>{text(p, 'adoptionBody')}</p>
            <a className="button button-primary" href="/contact">
              Discuss this product
            </a>
          </div>
          <div>
            {items(p, 'adoption').map((item) => (
              <article key={text(item, 'title')}>
                <h3>{text(item, 'title')}</h3>
                <p>{text(item, 'body')}</p>
              </article>
            ))}
          </div>
        </section>
        <section className="product-faq">
          <p className="eyebrow">{text(p, 'faqKicker')}</p>
          <h2>{text(p, 'faqHeading')}</h2>
          {items(p, 'faq').map((item) => (
            <details key={text(item, 'question')}>
              <summary>{text(item, 'question')}</summary>
              <p>{text(item, 'answer')}</p>
            </details>
          ))}
        </section>
        <div className="product-bottom-links">
          <a href="/products">← Compare all products</a>
          <a href="/contact">Plan your product journey →</a>
        </div>
      </div>
    </div>
  );
}
