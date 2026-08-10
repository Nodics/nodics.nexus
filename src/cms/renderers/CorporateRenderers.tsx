import { useEffect, useState, type CSSProperties } from 'react';

import type { CmsComponentContract } from '../cmsContract';
import { referenceImageSource } from '../referenceImages';
import { items, safeHref, strings, text } from './propertyReaders';

type Props = { readonly component: CmsComponentContract };
const Link = ({
  href,
  label,
  primary = false,
}: {
  href: string;
  label: string;
  primary?: boolean;
}) => {
  const safe = safeHref(href);
  return safe ? (
    <a className={`button${primary ? ' button-primary' : ''}`} href={safe}>
      {label}
    </a>
  ) : null;
};
const Header = ({ component }: Props) => (
  <header className="section-heading">
    <p className="eyebrow">{text(component.properties, 'kicker')}</p>
    <h2>{text(component.properties, 'heading')}</h2>
  </header>
);
const ReferenceImage = ({
  component,
  className = '',
}: Props & { className?: string }) => {
  const source = referenceImageSource(
    text(component.properties, 'referenceImageCode'),
  );
  return source ? (
    <img
      className={`reference-image ${className}`.trim()}
      src={source}
      alt={text(component.properties, 'imageAlt')}
      loading="lazy"
    />
  ) : null;
};

const BannerImages = ({
  slides,
  activeSlide,
  transitionEffect,
}: {
  readonly slides: readonly CmsComponentContract[];
  readonly activeSlide: number;
  readonly transitionEffect: number;
}) => {
  return (
    <div className="hero-slideshow" aria-hidden="true">
      {slides.map((slide, index) => {
        const source = referenceImageSource(
          text(slide.properties, 'referenceImageCode'),
        );
        return source ? (
          <img
            className={`hero-reference-image${index === activeSlide ? ` is-active effect-${transitionEffect}` : ''}`}
            src={source}
            alt=""
            loading="eager"
            decoding="async"
            fetchPriority={index === 0 ? 'high' : 'auto'}
            key={slide.code}
          />
        ) : null;
      })}
    </div>
  );
};

function BannerSlideContent({
  component,
  headingId,
}: Props & { readonly headingId: string }) {
  const p = component.properties;
  return (
    <>
      <p className="eyebrow">{text(p, 'title')}</p>
      <h1 id={headingId}>{text(p, 'heading')}</h1>
      <p className="hero-summary">{text(p, 'subheading')}</p>
      <div className="actions">
        {items(p, 'buttons').map((button, index) => (
          <Link
            primary={text(button, 'style') === 'PRIMARY'}
            href={text(button, 'href')}
            label={text(button, 'label')}
            key={`${text(button, 'label')}-${index}`}
          />
        ))}
      </div>
    </>
  );
}

export function BannerSlideRenderer({ component }: Props) {
  const source = referenceImageSource(
    text(component.properties, 'referenceImageCode'),
  );
  return (
    <section
      className="hero"
      aria-labelledby={`${component.code}-title`}
      style={
        {
          '--hero-image-duration': '1800ms',
          '--hero-text-duration': '1400ms',
        } as CSSProperties
      }
    >
      {source ? (
        <div className="hero-slideshow" aria-hidden="true">
          <img
            className="hero-reference-image is-active effect-0"
            src={source}
            alt=""
          />
        </div>
      ) : null}
      <div className="hero-content effect-0 is-visible">
        <BannerSlideContent
          component={component}
          headingId={`${component.code}-title`}
        />
      </div>
    </section>
  );
}

export function BannerCarouselRenderer({ component }: Props) {
  const p = component.properties;
  const slides = component.components.filter(
    (child) => child.renderer === 'nexus.component.banner-slide',
  );
  const [activeSlide, setActiveSlide] = useState(0);
  const [transitionEffect, setTransitionEffect] = useState(0);
  const [textVisible, setTextVisible] = useState(true);
  const configuredInterval = p.rotationIntervalMs;
  const intervalMs =
    typeof configuredInterval === 'number'
      ? Math.min(15000, Math.max(2000, configuredInterval))
      : 10000;
  const configuredFade = p.fadeDurationMs;
  const fadeDurationMs =
    typeof configuredFade === 'number'
      ? Math.min(3000, Math.max(400, configuredFade))
      : 1400;
  const configuredImageTransition = p.imageTransitionMs;
  const imageTransitionMs =
    typeof configuredImageTransition === 'number'
      ? Math.min(4000, Math.max(600, configuredImageTransition))
      : 1800;
  const automaticRotation = p.automaticRotation !== false;
  const randomTransitions = text(p, 'transitionStrategy') === 'RANDOM';

  useEffect(() => {
    const reducedMotion =
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reducedMotion || !automaticRotation || slides.length < 2)
      return undefined;
    let slideTimeout: number | undefined;
    let revealTimeout: number | undefined;
    const interval = window.setInterval(() => {
      setTextVisible(false);
      slideTimeout = window.setTimeout(() => {
        setTransitionEffect((current) =>
          randomTransitions
            ? (current + 1 + Math.floor(Math.random() * 2)) % 3
            : (current + 1) % 3,
        );
        setActiveSlide((current) => (current + 1) % slides.length);
        revealTimeout = window.setTimeout(() => setTextVisible(true), 80);
      }, fadeDurationMs);
    }, intervalMs);
    return () => {
      window.clearInterval(interval);
      if (slideTimeout !== undefined) window.clearTimeout(slideTimeout);
      if (revealTimeout !== undefined) window.clearTimeout(revealTimeout);
    };
  }, [
    automaticRotation,
    fadeDurationMs,
    intervalMs,
    randomTransitions,
    slides.length,
  ]);

  if (!slides.length)
    return (
      <section className="contract-error" role="alert">
        This banner carousel has no compatible slides.
      </section>
    );
  const activeComponent = slides[activeSlide] ?? slides[0];

  return (
    <section
      className="hero"
      aria-labelledby={`${activeComponent.code}-title`}
      style={
        {
          '--hero-image-duration': `${imageTransitionMs}ms`,
          '--hero-text-duration': `${fadeDurationMs}ms`,
        } as CSSProperties
      }
    >
      <BannerImages
        slides={slides}
        activeSlide={activeSlide}
        transitionEffect={transitionEffect}
      />
      <div className="hero-grid" aria-hidden="true">
        <i />
        <i />
        <i />
      </div>
      <div
        className={`hero-content effect-${transitionEffect}${textVisible ? ' is-visible' : ' is-hidden'}`}
        key={activeSlide}
      >
        <BannerSlideContent
          component={activeComponent}
          headingId={`${activeComponent.code}-title`}
        />
      </div>
    </section>
  );
}

export function ContentRenderer({ component }: Props) {
  const p = component.properties;
  const href = text(p, 'href');
  const anchor = text(p, 'anchor');
  const metrics = items<{ value?: unknown; label?: unknown }>(p, 'metrics');
  const isAboutSection = anchor === 'aboutus';
  return (
    <section
      className={`content-section${isAboutSection ? ' about-section' : ''}`}
      id={anchor || undefined}
    >
      <div className={isAboutSection ? 'about-visual' : undefined}>
        <ReferenceImage
          component={component}
          className="content-reference-image"
        />
        {isAboutSection ? (
          <div className="about-visual-mark" aria-hidden="true">
            <div className="about-mark-meta">
              <span>01</span>
              <small>Platform DNA</small>
            </div>
            <div className="about-mark-symbol">
              <svg viewBox="0 0 64 64">
                <path
                  d="M24 6H14l-4 4v14l-6 6v4l6 6v14l4 4h10M40 6h10l4 4v14l6 6v4l-6 6v14l-4 4H40"
                  fill="none"
                  stroke="currentColor"
                  strokeLinecap="square"
                  strokeLinejoin="miter"
                  strokeWidth="4"
                />
                <text
                  x="32"
                  y="48"
                  fill="#FFFFFF"
                  fontFamily="Times New Roman, Times, serif"
                  fontSize="45"
                  fontWeight="400"
                  textAnchor="middle"
                  transform="translate(32 0) scale(.84 1) translate(-32 0)"
                >
                  N
                </text>
              </svg>
            </div>
            <div className="about-mark-caption">
              <strong>Built for evolution</strong>
              <small>Modular · Secure · Composable</small>
            </div>
          </div>
        ) : null}
      </div>
      <div className={isAboutSection ? 'about-copy' : undefined}>
        <Header component={component} />
        <p className="section-body">{text(p, 'body')}</p>
        {metrics.length ? (
          <div className="about-metrics" aria-label="Nodics principles">
            {metrics.map((metric, index) => (
              <div key={`${component.code}-metric-${index}`}>
                <strong>
                  {typeof metric.value === 'string' ? metric.value : ''}
                </strong>
                <span>
                  {typeof metric.label === 'string' ? metric.label : ''}
                </span>
              </div>
            ))}
          </div>
        ) : null}
        {href ? (
          <Link href={href} label={text(p, 'linkLabel', 'Learn more')} />
        ) : null}
      </div>
    </section>
  );
}

export function CardsRenderer({ component }: Props) {
  const p = component.properties;
  const anchor = text(p, 'anchor');
  const isFeaturesSection = anchor === 'features';
  const isProductsSection = anchor === 'products';
  const isSupportSection = anchor === 'support';
  const isEcosystemSection = anchor === 'ecosystem';
  const cards = items<{
    title?: unknown;
    text?: unknown;
    symbol?: unknown;
  }>(p, 'items');
  return (
    <section
      className={`band${isFeaturesSection ? ' features-section' : ''}${isProductsSection ? ' products-section' : ''}${isSupportSection ? ' support-section' : ''}${isEcosystemSection ? ' ecosystem-section' : ''}`}
      id={anchor || undefined}
    >
      <div className="section-wrap">
        <div
          className={
            isFeaturesSection
              ? 'features-intro'
              : isEcosystemSection
                ? 'ecosystem-intro'
                : undefined
          }
        >
          <Header component={component} />
          {isEcosystemSection ? (
            <div className="ecosystem-statement">
              <p>{text(p, 'body')}</p>
              <span>Open foundation</span>
              <span>Project ownership</span>
              <span>Shared evolution</span>
            </div>
          ) : isFeaturesSection ? (
            <div className="features-visual">
              <ReferenceImage
                component={component}
                className="band-reference-image"
              />
            </div>
          ) : (
            <ReferenceImage
              component={component}
              className="band-reference-image"
            />
          )}
        </div>
        {(isProductsSection || isSupportSection) && text(p, 'body') ? (
          <p
            className={
              isProductsSection ? 'products-intro-copy' : 'support-intro-copy'
            }
          >
            {text(p, 'body')}
          </p>
        ) : null}
        <div
          className={`card-grid${isFeaturesSection ? ' features-grid' : ''}${isProductsSection ? ' products-grid' : ''}${isSupportSection ? ' support-grid' : ''}${isEcosystemSection ? ' ecosystem-grid' : ''}`}
        >
          {cards.map((card, index) => (
            <article
              className={`feature-card${isEcosystemSection ? ' ecosystem-card' : ''}`}
              key={`${component.code}-${index}`}
              tabIndex={isSupportSection ? 0 : undefined}
            >
              <span>{String(index + 1).padStart(2, '0')}</span>
              {isFeaturesSection || isProductsSection || isSupportSection ? (
                <strong className="feature-symbol" aria-hidden="true">
                  {typeof card.symbol === 'string' ? card.symbol : 'N'}
                </strong>
              ) : null}
              <h3>{typeof card.title === 'string' ? card.title : ''}</h3>
              <p>{typeof card.text === 'string' ? card.text : ''}</p>
            </article>
          ))}
        </div>
        {text(p, 'href') ? (
          <Link
            href={text(p, 'href')}
            label={text(p, 'linkLabel', 'Learn more')}
          />
        ) : null}
      </div>
    </section>
  );
}

export function TechnologyRenderer({ component }: Props) {
  return (
    <section className="technology">
      <div className="section-wrap">
        <div className="technology-grid">
          <div className="technology-visual">
            <ReferenceImage
              component={component}
              className="technology-reference-image"
            />
            <div className="technology-visual-code" aria-hidden="true">
              <span>01</span>
              <i />
              <small>Architecture in motion</small>
            </div>
          </div>
          <div>
            <Header component={component} />
            <div className="technology-list">
              {strings(component.properties, 'items').map((item) => (
                <span key={item}>{item}</span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export function GithubRenderer({ component }: Props) {
  const p = component.properties;
  const repositories = items<{
    name?: unknown;
    description?: unknown;
    href?: unknown;
    role?: unknown;
  }>(p, 'repositories');
  return (
    <section className="github-section" id="github">
      <div className="section-wrap">
        <div className="github-heading-grid">
          <Header component={component} />
          <div className="github-intro-copy">
            <p>{text(p, 'body')}</p>
            {safeHref(text(p, 'organizationHref')) ? (
              <a
                className="github-organization-link"
                href={safeHref(text(p, 'organizationHref'))}
                target="_blank"
                rel="noreferrer"
              >
                {text(p, 'organizationLabel', 'Explore GitHub')}
                <span aria-hidden="true">↗</span>
              </a>
            ) : null}
          </div>
        </div>
        {text(p, 'developerHeading') ? (
          <div className="github-developer-journey">
            <ReferenceImage
              component={component}
              className="github-developer-image"
            />
            <div className="github-developer-copy">
              <p className="eyebrow">
                {text(p, 'developerKicker', 'Developer experience')}
              </p>
              <h3>{text(p, 'developerHeading')}</h3>
              <p>{text(p, 'developerBody')}</p>
              {text(p, 'developerHref') ? (
                <Link
                  href={text(p, 'developerHref')}
                  label={text(p, 'developerLinkLabel', 'Developer journey')}
                />
              ) : null}
            </div>
          </div>
        ) : null}
        <div className="repository-grid">
          {repositories.map((repository, index) => {
            const name =
              typeof repository.name === 'string' ? repository.name : '';
            const href =
              typeof repository.href === 'string'
                ? safeHref(repository.href)
                : undefined;
            return (
              <article key={name}>
                <div className="repository-meta">
                  <span>{String(index + 1).padStart(2, '0')}</span>
                  <small>
                    {typeof repository.role === 'string'
                      ? repository.role
                      : 'Open source'}
                  </small>
                </div>
                <h3>{name}</h3>
                <p>
                  {typeof repository.description === 'string'
                    ? repository.description
                    : ''}
                </p>
                {href ? (
                  <a href={href} target="_blank" rel="noreferrer">
                    View repository <b aria-hidden="true">↗</b>
                  </a>
                ) : null}
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export function TestimonialsRenderer({ component }: Props) {
  const p = component.properties;
  const testimonials = items<{
    quote?: unknown;
    name?: unknown;
    role?: unknown;
    avatarReferenceImageCode?: unknown;
    avatarAlt?: unknown;
  }>(p, 'items');
  const [active, setActive] = useState(0);
  useEffect(() => {
    if (testimonials.length < 2) return undefined;
    const timer = window.setInterval(
      () => setActive((value) => (value + 1) % testimonials.length),
      7000,
    );
    return () => window.clearInterval(timer);
  }, [testimonials.length]);
  return (
    <section className="testimonials carousel-section" id="testimonials">
      <div className="section-wrap">
        <Header component={component} />
        {text(p, 'body') ? (
          <p className="testimonial-intro">{text(p, 'body')}</p>
        ) : null}
        {testimonials.length ? (
          <div className="testimonial-carousel" aria-live="polite">
            <div className="testimonial-slides">
              {testimonials.map((testimonial, index) => {
                const source =
                  typeof testimonial.avatarReferenceImageCode === 'string'
                    ? referenceImageSource(testimonial.avatarReferenceImageCode)
                    : '';
                return (
                  <figure
                    className={index === active ? 'is-active' : ''}
                    aria-hidden={index === active ? undefined : 'true'}
                    key={`${String(testimonial.name)}-${index}`}
                  >
                    <span className="testimonial-signal-label">
                      Voice / {String(index + 1).padStart(2, '0')}
                    </span>
                    <blockquote>
                      “
                      {typeof testimonial.quote === 'string'
                        ? testimonial.quote
                        : ''}
                      ”
                    </blockquote>
                    {source ? (
                      <img
                        className="testimonial-avatar"
                        src={source}
                        alt={
                          typeof testimonial.avatarAlt === 'string'
                            ? testimonial.avatarAlt
                            : ''
                        }
                        loading="lazy"
                      />
                    ) : (
                      <span
                        className="testimonial-avatar-placeholder"
                        aria-hidden="true"
                      >
                        N
                      </span>
                    )}
                    <figcaption>
                      <small>
                        {typeof testimonial.role === 'string'
                          ? testimonial.role
                          : ''}
                      </small>
                      <strong>
                        {typeof testimonial.name === 'string'
                          ? testimonial.name
                          : ''}
                      </strong>
                    </figcaption>
                  </figure>
                );
              })}
            </div>
            <div className="testimonial-dots" aria-label="Choose testimonial">
              {testimonials.map((testimonial, index) => (
                <button
                  className={index === active ? 'is-active' : ''}
                  type="button"
                  onClick={() => setActive(index)}
                  aria-label={`Show testimonial ${index + 1}`}
                  aria-current={index === active ? 'true' : undefined}
                  key={`${String(testimonial.name)}-${index}`}
                />
              ))}
            </div>
          </div>
        ) : (
          <div className="testimonial-empty">
            <span className="testimonial-signal-label">Voices / Nexus</span>
            <p>{text(p, 'emptyMessage')}</p>
            <div className="testimonial-identity">
              <span
                className="testimonial-avatar-placeholder"
                aria-hidden="true"
              >
                N
              </span>
              <span>
                <small>Evidence review</small>
                <strong>Nodics Nexus</strong>
              </span>
            </div>
            <div className="testimonial-status">
              <span>Verified voices only</span>
              <div className="testimonial-dots" aria-hidden="true">
                <i className="is-active" />
                <i />
                <i />
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

function CarouselControls({
  active,
  count,
  label,
  onMove,
}: {
  readonly active: number;
  readonly count: number;
  readonly label: string;
  readonly onMove: (direction: number) => void;
}) {
  return (
    <div className="carousel-controls">
      <span>{`${String(active + 1).padStart(2, '0')} / ${String(count).padStart(2, '0')}`}</span>
      <button
        type="button"
        onClick={() => onMove(-1)}
        aria-label={`Previous ${label}`}
      >
        ←
      </button>
      <button
        type="button"
        onClick={() => onMove(1)}
        aria-label={`Next ${label}`}
      >
        →
      </button>
    </div>
  );
}

function EditorialCarousel({
  component,
  variant,
}: Props & { readonly variant: 'news' | 'blogs' }) {
  const entries = items<{
    label?: unknown;
    title?: unknown;
    summary?: unknown;
    href?: unknown;
    linkLabel?: unknown;
    referenceImageCode?: unknown;
    imageAlt?: unknown;
  }>(component.properties, 'items');
  const [active, setActive] = useState(0);
  const entry = entries[active];
  const move = (direction: number) =>
    setActive((value) => (value + direction + entries.length) % entries.length);
  const source =
    entry && typeof entry.referenceImageCode === 'string'
      ? referenceImageSource(entry.referenceImageCode)
      : undefined;
  const href =
    entry && typeof entry.href === 'string' ? safeHref(entry.href) : undefined;
  return (
    <section className={`editorial-carousel ${variant}-carousel`} id={variant}>
      <div className="section-wrap">
        <div className="carousel-heading-row">
          <Header component={component} />
          {entries.length > 1 ? (
            <CarouselControls
              active={active}
              count={entries.length}
              label={variant === 'news' ? 'news item' : 'blog'}
              onMove={move}
            />
          ) : null}
        </div>
        {entry ? (
          <article
            className="editorial-slide"
            key={`${component.code}-${active}`}
            aria-live="polite"
          >
            <div className="editorial-image-wrap">
              {source ? (
                <img
                  src={source}
                  alt={typeof entry.imageAlt === 'string' ? entry.imageAlt : ''}
                  loading="lazy"
                />
              ) : null}
              <span>{typeof entry.label === 'string' ? entry.label : ''}</span>
            </div>
            <div className="editorial-copy">
              <small>{`${String(active + 1).padStart(2, '0')} — ${String(entries.length).padStart(2, '0')}`}</small>
              <h3>{typeof entry.title === 'string' ? entry.title : ''}</h3>
              <p>{typeof entry.summary === 'string' ? entry.summary : ''}</p>
              {href ? (
                <a href={href}>
                  {typeof entry.linkLabel === 'string'
                    ? entry.linkLabel
                    : 'Read more'}{' '}
                  <b aria-hidden="true">↗</b>
                </a>
              ) : null}
            </div>
          </article>
        ) : (
          <p className="empty-note">
            {text(component.properties, 'emptyMessage')}
          </p>
        )}
      </div>
    </section>
  );
}

export function NewsCarouselRenderer({ component }: Props) {
  return <EditorialCarousel component={component} variant="news" />;
}

export function BlogCarouselRenderer({ component }: Props) {
  return <EditorialCarousel component={component} variant="blogs" />;
}

export function ContactRenderer({ component }: Props) {
  const p = component.properties;
  const href = text(p, 'emailHref') || text(p, 'href');
  const label = text(p, 'emailLabel') || text(p, 'linkLabel');
  const conversationItems = items<{
    title?: unknown;
    text?: unknown;
  }>(p, 'items');
  const formFields = items<{
    name?: unknown;
    label?: unknown;
    type?: unknown;
    multiline?: unknown;
  }>(p, 'formFields');
  return (
    <section className="contact-section" id={text(p, 'anchor') || undefined}>
      <div className="section-wrap">
        <div className="contact-heading-grid">
          <Header component={component} />
          <div className="contact-intro">
            <p>{text(p, 'body')}</p>
            {href ? <Link primary href={href} label={label} /> : null}
          </div>
        </div>
        {conversationItems.length ? (
          <div className="conversation-grid">
            {conversationItems.map((item, index) => (
              <article key={`${component.code}-conversation-${index}`}>
                <span>{String(index + 1).padStart(2, '0')}</span>
                <h3>{typeof item.title === 'string' ? item.title : ''}</h3>
                <p>{typeof item.text === 'string' ? item.text : ''}</p>
              </article>
            ))}
          </div>
        ) : null}
        {formFields.length ? (
          <div className="contact-form-panel">
            <div className="contact-form-visual">
              <ReferenceImage
                component={component}
                className="contact-form-image"
              />
              <span>Connect · Compose · Evolve</span>
            </div>
            <div className="contact-form-content">
              <p className="contact-form-kicker">
                {text(p, 'formKicker', 'Contact Nodics')}
              </p>
              <h3>{text(p, 'formHeading', "Let's start working")}</h3>
              <p className="contact-form-body">{text(p, 'formBody')}</p>
              <form
                className="contact-form"
                onSubmit={(event) => event.preventDefault()}
              >
                {formFields.map((field, index) => {
                  const name =
                    typeof field.name === 'string'
                      ? field.name
                      : `field-${index}`;
                  const fieldLabel =
                    typeof field.label === 'string' ? field.label : '';
                  return (
                    <label
                      className={field.multiline ? 'is-message' : undefined}
                      key={`${component.code}-field-${name}`}
                    >
                      <span>{fieldLabel}</span>
                      {field.multiline ? (
                        <textarea name={name} rows={3} />
                      ) : (
                        <input
                          name={name}
                          type={
                            typeof field.type === 'string' ? field.type : 'text'
                          }
                        />
                      )}
                    </label>
                  );
                })}
                <div className="contact-form-action">
                  <button type="submit" disabled>
                    {text(p, 'formSubmitLabel', 'Send enquiry')}
                  </button>
                  <small>
                    {text(
                      p,
                      'formStatus',
                      'Online submission will be enabled with the approved contact service.',
                    )}
                  </small>
                </div>
              </form>
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}
