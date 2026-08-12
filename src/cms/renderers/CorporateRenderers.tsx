import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type FormEvent,
} from 'react';

import {
  getContactForm,
  listTestimonials,
  submitContact,
  submitTestimonialCandidate,
  type NexusContactFormField,
} from '../../api/engagementApi';
import { listEditorialArticles } from '../../api/editorialApi';
import { useOptionalNexusRuntimeConfig } from '../../runtime/NexusRuntimeConfigContext';
import { componentIsVisible } from '../componentVisibility';
import type { CmsComponentContract } from '../cmsContract';
import { mediaImageSource, referenceImageSource } from '../referenceImages';
import { items, safeHref, strings, text } from './propertyReaders';

type Props = { readonly component: CmsComponentContract };
type TestimonialCard = {
  quote?: unknown;
  name?: unknown;
  role?: unknown;
  avatarReferenceImageCode?: unknown;
  avatarAlt?: unknown;
};
type EditorialCard = {
  label?: unknown;
  title?: unknown;
  summary?: unknown;
  href?: unknown;
  linkLabel?: unknown;
  referenceImageCode?: unknown;
  imageAlt?: unknown;
};

const slugFromHref = (value: unknown): string | undefined => {
  if (typeof value !== 'string') return undefined;
  const parts = value.split('/').filter(Boolean);
  return parts.length ? parts[parts.length - 1] : undefined;
};

const staticEditorialMedia = (
  article: { readonly slug?: string; readonly title?: string },
  staticEntries: readonly EditorialCard[],
): Pick<EditorialCard, 'referenceImageCode' | 'imageAlt'> => {
  const match = staticEntries.find((entry) => {
    if (article.slug && slugFromHref(entry.href) === article.slug) return true;
    return (
      typeof article.title === 'string' &&
      typeof entry.title === 'string' &&
      entry.title === article.title
    );
  });
  return {
    imageAlt: match?.imageAlt,
    referenceImageCode: match?.referenceImageCode,
  };
};
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

export function PageHeroRenderer({ component }: Props) {
  const p = component.properties;
  const source = referenceImageSource(text(p, 'referenceImageCode'));
  const currentLabel = text(p, 'breadcrumbLabel', text(p, 'heading'));
  return (
    <section
      className="secondary-page-hero"
      aria-labelledby={`${component.code}-title`}
    >
      {source ? <img src={source} alt={text(p, 'imageAlt')} /> : null}
      <div className="secondary-page-hero-shade" aria-hidden="true" />
      <div className="secondary-page-hero-copy">
        <p className="eyebrow">{text(p, 'kicker', 'Nodics Nexus')}</p>
        <h1 id={`${component.code}-title`}>{text(p, 'heading')}</h1>
        <nav className="secondary-page-breadcrumbs" aria-label="Breadcrumb">
          <a href="/">Home</a>
          <span aria-hidden="true">›</span>
          <strong>{currentLabel}</strong>
        </nav>
        <p>{text(p, 'body')}</p>
      </div>
    </section>
  );
}

export function BannerCarouselRenderer({ component }: Props) {
  const p = component.properties;
  const slides = component.components.filter(
    (child) =>
      child.renderer === 'nexus.component.banner-slide' &&
      componentIsVisible(child),
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
  const detailItems = items<{
    title?: unknown;
    text?: unknown;
    eyebrow?: unknown;
  }>(p, 'detailItems');
  const policySections = items<{
    title?: unknown;
    body?: unknown;
    items?: unknown;
  }>(p, 'policySections');
  const policyHighlights = items<{ label?: unknown; value?: unknown }>(
    p,
    'policyHighlights',
  );
  const isAboutSection = anchor === 'aboutus';
  const isAboutStorySection = anchor === 'about-story';
  const isAboutPromiseSection = anchor === 'about-promise';
  const isFeatureArchitectureSection = anchor === 'feature-architecture';
  const isFeatureJourneySection = anchor === 'feature-journey';
  const isProductOperatingSection = anchor === 'product-operating-model';
  const isSupportRequestSection = anchor === 'support-request-checklist';
  const isDeveloperOverviewSection = anchor === 'developer-overview';
  const isPolicySection = policySections.length > 0;
  if (isDeveloperOverviewSection) {
    const developerOverviewKicker = 'Developer foundation';
    const developerOverviewHeading =
      'Build faster without losing engineering control.';
    const developerOverviewBody =
      'Nodics gives developers a governed starting point for enterprise delivery: reusable capabilities, visible contracts, AI-assisted workflows, and clear project boundaries that stay understandable as teams customize.';
    return (
      <section className="developer-overview-section" id={anchor || undefined}>
        <div className="developer-overview-heading">
          <div className="developer-overview-title">
            <header className="section-heading">
              <p className="eyebrow">{developerOverviewKicker}</p>
              <h2>{developerOverviewHeading}</h2>
            </header>
          </div>
          <div className="developer-overview-statement">
            <p>{developerOverviewBody}</p>
          </div>
        </div>
        <div className="developer-overview-body">
          <div className="developer-overview-image-frame">
            <ReferenceImage
              component={component}
              className="content-reference-image"
            />
          </div>
          <div className="developer-overview-panel">
            {detailItems.length ? (
              <div className="content-detail-grid">
                {detailItems.map((item, index) => (
                  <article key={`${component.code}-detail-${index}`}>
                    <small>
                      {typeof item.eyebrow === 'string'
                        ? item.eyebrow
                        : String(index + 1).padStart(2, '0')}
                    </small>
                    <h3>{typeof item.title === 'string' ? item.title : ''}</h3>
                    <p>{typeof item.text === 'string' ? item.text : ''}</p>
                  </article>
                ))}
              </div>
            ) : null}
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
        </div>
      </section>
    );
  }
  return (
    <section
      className={`content-section${isAboutSection ? ' about-section' : ''}${isAboutStorySection ? ' about-detail-section' : ''}${isAboutPromiseSection ? ' about-promise-section' : ''}${isFeatureArchitectureSection ? ' feature-architecture-section' : ''}${isFeatureJourneySection ? ' feature-journey-section' : ''}${isProductOperatingSection ? ' product-operating-section' : ''}${isSupportRequestSection ? ' support-request-section' : ''}${isDeveloperOverviewSection ? ' developer-overview-section' : ''}${isPolicySection ? ' policy-section' : ''}`}
      id={anchor || undefined}
    >
      <div
        className={
          isAboutSection
            ? 'about-visual'
            : isAboutStorySection ||
                isAboutPromiseSection ||
                isFeatureArchitectureSection ||
                isFeatureJourneySection ||
                isProductOperatingSection ||
                isSupportRequestSection ||
                isDeveloperOverviewSection
              ? 'about-page-visual'
              : isPolicySection
                ? 'policy-aside'
                : undefined
        }
      >
        <ReferenceImage
          component={component}
          className="content-reference-image"
        />
        {isPolicySection ? (
          <div className="policy-summary-card">
            <span>{text(p, 'effectiveLabel', 'Current local preview')}</span>
            <strong>
              {text(p, 'effectiveDate', 'Effective in local preview')}
            </strong>
            <p>{text(p, 'summary')}</p>
            {policyHighlights.length ? (
              <div className="policy-highlights">
                {policyHighlights.map((highlight, index) => (
                  <div key={`${component.code}-highlight-${index}`}>
                    <small>
                      {typeof highlight.label === 'string'
                        ? highlight.label
                        : ''}
                    </small>
                    <b>
                      {typeof highlight.value === 'string'
                        ? highlight.value
                        : ''}
                    </b>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        ) : null}
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
      <div
        className={
          isAboutSection
            ? 'about-copy'
            : isAboutStorySection ||
                isAboutPromiseSection ||
                isFeatureArchitectureSection ||
                isFeatureJourneySection ||
                isProductOperatingSection ||
                isSupportRequestSection ||
                isDeveloperOverviewSection
              ? 'about-page-copy'
              : isPolicySection
                ? 'policy-copy'
                : undefined
        }
      >
        <Header component={component} />
        <p className="section-body">{text(p, 'body')}</p>
        {detailItems.length ? (
          <div className="content-detail-grid">
            {detailItems.map((item, index) => (
              <article key={`${component.code}-detail-${index}`}>
                <small>
                  {typeof item.eyebrow === 'string'
                    ? item.eyebrow
                    : String(index + 1).padStart(2, '0')}
                </small>
                <h3>{typeof item.title === 'string' ? item.title : ''}</h3>
                <p>{typeof item.text === 'string' ? item.text : ''}</p>
              </article>
            ))}
          </div>
        ) : null}
        {policySections.length ? (
          <div className="policy-section-list">
            {policySections.map((section, index) => {
              const sectionItems = Array.isArray(section.items)
                ? section.items.filter(
                    (item): item is string => typeof item === 'string',
                  )
                : [];
              return (
                <article key={`${component.code}-policy-${index}`}>
                  <span>{String(index + 1).padStart(2, '0')}</span>
                  <div>
                    <h3>
                      {typeof section.title === 'string' ? section.title : ''}
                    </h3>
                    {typeof section.body === 'string' ? (
                      <p>{section.body}</p>
                    ) : null}
                    {sectionItems.length ? (
                      <ul>
                        {sectionItems.map((item) => (
                          <li key={item}>{item}</li>
                        ))}
                      </ul>
                    ) : null}
                  </div>
                </article>
              );
            })}
          </div>
        ) : null}
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
  const isAboutPrinciplesSection = anchor === 'about-principles';
  const isAboutMvpSection = anchor === 'about-mvp-scale';
  const isFeatureOverviewSection = anchor === 'feature-overview';
  const isFeaturePillarsSection = anchor === 'feature-pillars';
  const isFeatureCapabilitiesSection = anchor === 'feature-capabilities';
  const isFeatureMvpSection = anchor === 'feature-mvp-scale';
  const isProductOverviewSection = anchor === 'product-overview';
  const isProductSuiteSection = anchor === 'product-suite';
  const isProductReadinessSection = anchor === 'product-readiness';
  const isSupportOverviewSection = anchor === 'support-overview';
  const isSupportPathsSection = anchor === 'support-paths';
  const isSupportResponseSection = anchor === 'support-response-model';
  const isSupportBoundariesSection = anchor === 'support-boundaries';
  const isDeveloperLocalSection = anchor === 'developer-local-journey';
  const isDeveloperAiSection = anchor === 'developer-ai-assisted';
  const isDeveloperOwnershipSection = anchor === 'developer-ownership';
  const isEcosystemOverviewSection = anchor === 'ecosystem-overview';
  const isEcosystemRolesSection = anchor === 'ecosystem-roles';
  const isEcosystemContributionSection = anchor === 'ecosystem-contribution';
  const isEcosystemJourneySection = anchor === 'ecosystem-journey';
  const isFeaturePageSection =
    isFeatureOverviewSection ||
    isFeaturePillarsSection ||
    isFeatureCapabilitiesSection ||
    isFeatureMvpSection;
  const isProductPageSection =
    isProductOverviewSection ||
    isProductSuiteSection ||
    isProductReadinessSection;
  const isSupportPageSection =
    isSupportOverviewSection ||
    isSupportPathsSection ||
    isSupportResponseSection ||
    isSupportBoundariesSection;
  const isDeveloperPageSection =
    isDeveloperLocalSection ||
    isDeveloperAiSection ||
    isDeveloperOwnershipSection;
  const isEcosystemPageSection =
    isEcosystemOverviewSection ||
    isEcosystemRolesSection ||
    isEcosystemContributionSection ||
    isEcosystemJourneySection;
  const cards = items<{
    title?: unknown;
    text?: unknown;
    symbol?: unknown;
  }>(p, 'items');
  return (
    <section
      className={`band${isFeaturesSection ? ' features-section' : ''}${isProductsSection ? ' products-section' : ''}${isSupportSection ? ' support-section' : ''}${isEcosystemSection ? ' ecosystem-section' : ''}${isAboutPrinciplesSection ? ' about-principles-section' : ''}${isAboutMvpSection ? ' about-mvp-section' : ''}${isFeatureOverviewSection ? ' feature-overview-section' : ''}${isFeaturePillarsSection ? ' feature-pillars-section' : ''}${isFeatureCapabilitiesSection ? ' feature-capabilities-section' : ''}${isFeatureMvpSection ? ' feature-mvp-section' : ''}${isProductOverviewSection ? ' product-overview-section' : ''}${isProductSuiteSection ? ' product-suite-section' : ''}${isProductReadinessSection ? ' product-readiness-section' : ''}${isSupportOverviewSection ? ' support-overview-section' : ''}${isSupportPathsSection ? ' support-paths-section' : ''}${isSupportResponseSection ? ' support-response-section' : ''}${isSupportBoundariesSection ? ' support-boundaries-section' : ''}${isDeveloperLocalSection ? ' developer-local-section' : ''}${isDeveloperAiSection ? ' developer-ai-section' : ''}${isDeveloperOwnershipSection ? ' developer-ownership-section' : ''}${isEcosystemOverviewSection ? ' ecosystem-overview-section' : ''}${isEcosystemRolesSection ? ' ecosystem-roles-section' : ''}${isEcosystemContributionSection ? ' ecosystem-contribution-section' : ''}${isEcosystemJourneySection ? ' ecosystem-journey-section' : ''}`}
      id={anchor || undefined}
    >
      <div className="section-wrap">
        <div
          className={
            isFeaturesSection
              ? 'features-intro'
              : isEcosystemSection ||
                  isAboutMvpSection ||
                  isFeaturePageSection ||
                  isProductPageSection ||
                  isSupportPageSection ||
                  isDeveloperPageSection ||
                  isEcosystemPageSection
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
          ) : isAboutMvpSection ? (
            <div className="mvp-scale-statement">
              <p>{text(p, 'body')}</p>
              <span>Fast prototype</span>
              <span>Governed foundation</span>
              <span>Scalable product</span>
            </div>
          ) : isFeaturePageSection ||
            isProductPageSection ||
            isSupportPageSection ||
            isDeveloperPageSection ||
            isEcosystemPageSection ? (
            <div className="feature-page-statement">
              <p>{text(p, 'body')}</p>
              {!isFeatureOverviewSection &&
              !isProductOverviewSection &&
              !isSupportOverviewSection &&
              !isDeveloperLocalSection &&
              !isEcosystemOverviewSection ? (
                <>
                  <span>
                    {isSupportPageSection
                      ? 'Evidence-led'
                      : isDeveloperPageSection
                        ? 'AI-assisted'
                        : isEcosystemPageSection
                          ? 'Shared'
                          : 'Reusable'}
                  </span>
                  <span>
                    {isSupportPageSection
                      ? 'Impact-based'
                      : isDeveloperPageSection
                        ? 'Contract-aware'
                        : isEcosystemPageSection
                          ? 'Owned'
                          : 'Governed'}
                  </span>
                  <span>
                    {isSupportPageSection
                      ? 'Contract-aware'
                      : isDeveloperPageSection
                        ? 'Project-owned'
                        : isEcosystemPageSection
                          ? 'Evolving'
                          : 'Extensible'}
                  </span>
                </>
              ) : null}
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
          className={`card-grid${isFeaturesSection ? ' features-grid' : ''}${isProductsSection ? ' products-grid' : ''}${isSupportSection ? ' support-grid' : ''}${isEcosystemSection ? ' ecosystem-grid' : ''}${isAboutPrinciplesSection ? ' about-principles-grid' : ''}${isAboutMvpSection ? ' mvp-scale-grid' : ''}${isFeatureOverviewSection ? ' feature-overview-grid' : ''}${isFeaturePillarsSection ? ' feature-pillars-grid' : ''}${isFeatureCapabilitiesSection ? ' feature-capabilities-grid' : ''}${isFeatureMvpSection ? ' feature-mvp-grid' : ''}${isProductOverviewSection ? ' product-overview-grid' : ''}${isProductSuiteSection ? ' product-suite-grid' : ''}${isProductReadinessSection ? ' product-readiness-grid' : ''}${isSupportOverviewSection ? ' support-overview-grid' : ''}${isSupportPathsSection ? ' support-paths-grid' : ''}${isSupportResponseSection ? ' support-response-grid' : ''}${isSupportBoundariesSection ? ' support-boundaries-grid' : ''}${isDeveloperLocalSection ? ' developer-local-grid' : ''}${isDeveloperAiSection ? ' developer-ai-grid' : ''}${isDeveloperOwnershipSection ? ' developer-ownership-grid' : ''}${isEcosystemOverviewSection ? ' ecosystem-overview-grid' : ''}${isEcosystemRolesSection ? ' ecosystem-roles-grid' : ''}${isEcosystemContributionSection ? ' ecosystem-contribution-grid' : ''}${isEcosystemJourneySection ? ' ecosystem-journey-grid' : ''}`}
        >
          {cards.map((card, index) => (
            <article
              className={`feature-card${isEcosystemSection ? ' ecosystem-card' : ''}${isAboutMvpSection ? ' mvp-scale-card' : ''}${isFeaturePageSection || isProductPageSection || isSupportPageSection || isDeveloperPageSection || isEcosystemPageSection ? ' feature-page-card' : ''}`}
              key={`${component.code}-${index}`}
              tabIndex={isSupportSection ? 0 : undefined}
            >
              <span>{String(index + 1).padStart(2, '0')}</span>
              {isFeaturesSection ||
              isProductsSection ||
              isSupportSection ||
              isAboutPrinciplesSection ||
              isAboutMvpSection ||
              isFeaturePageSection ||
              isProductPageSection ||
              isSupportPageSection ||
              isDeveloperPageSection ||
              isEcosystemPageSection ? (
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
  const runtime = useOptionalNexusRuntimeConfig();
  const staticTestimonials = items<TestimonialCard>(p, 'items');
  const [liveTestimonials, setLiveTestimonials] = useState<
    readonly TestimonialCard[]
  >([]);
  const [liveStatus, setLiveStatus] = useState<'idle' | 'ready' | 'failed'>(
    'idle',
  );
  const [active, setActive] = useState(0);
  const region = text(p, 'region', 'global');
  const limit = Number(text(p, 'limit', '8')) || 8;
  const engagementBaseUrl = runtime?.config.endpoints.engagement;
  const channel = runtime?.config.channel;
  const enterpriseCode = runtime?.config.enterpriseCode;
  const locale = runtime?.config.defaultLocale;
  const requestTimeoutMs = runtime?.config.requestTimeoutMs;
  const testimonials =
    liveStatus === 'ready' && liveTestimonials.length
      ? liveTestimonials
      : staticTestimonials;

  useEffect(() => {
    if (
      !engagementBaseUrl ||
      !channel ||
      !enterpriseCode ||
      !locale ||
      !requestTimeoutMs
    )
      return undefined;
    const controller = new AbortController();
    listTestimonials({
      baseUrl: engagementBaseUrl,
      channel,
      enterpriseCode,
      limit,
      locale,
      region,
      signal: controller.signal,
      timeoutMs: requestTimeoutMs,
    })
      .then((response) => {
        if (!controller.signal.aborted) {
          setLiveTestimonials(response);
          setLiveStatus('ready');
          setActive(0);
        }
      })
      .catch(() => {
        if (!controller.signal.aborted) setLiveStatus('failed');
      });
    return () => controller.abort();
  }, [
    channel,
    engagementBaseUrl,
    enterpriseCode,
    limit,
    locale,
    requestTimeoutMs,
    region,
  ]);

  useEffect(() => {
    if (testimonials.length < 2) return undefined;
    const timer = window.setInterval(
      () => setActive((value) => (value + 1) % testimonials.length),
      11000,
    );
    return () => window.clearInterval(timer);
  }, [testimonials.length]);

  const activeTestimonial = testimonials[active] || testimonials[0];
  const activeAvatar =
    activeTestimonial &&
    typeof activeTestimonial.avatarReferenceImageCode === 'string'
      ? referenceImageSource(activeTestimonial.avatarReferenceImageCode)
      : '';
  const move = (direction: number) => {
    if (!testimonials.length) return;
    setActive(
      (value) =>
        (value + direction + testimonials.length) % testimonials.length,
    );
  };
  const mosaicItems = testimonials.length
    ? Array.from(
        { length: 18 },
        (_, index) => testimonials[index % testimonials.length],
      )
    : [];

  return (
    <section className="testimonials testimonial-showcase" id="testimonials">
      {mosaicItems.length ? (
        <div className="testimonial-mosaic" aria-hidden="true">
          {mosaicItems.map((testimonial, index) => {
            const source =
              typeof testimonial.avatarReferenceImageCode === 'string'
                ? referenceImageSource(testimonial.avatarReferenceImageCode)
                : '';
            return source ? (
              <img
                src={source}
                alt=""
                loading="lazy"
                key={`${String(testimonial.name)}-mosaic-${index}`}
              />
            ) : (
              <span key={`testimonial-mosaic-placeholder-${index}`}>N</span>
            );
          })}
        </div>
      ) : null}
      <div className="section-wrap testimonial-stage">
        {testimonials.length ? (
          <>
            <button
              className="testimonial-arrow testimonial-arrow-prev"
              type="button"
              onClick={() => move(-1)}
              aria-label="Previous testimonial"
            >
              ←
            </button>
            <div className="testimonial-carousel" aria-live="polite">
              <figure key={`${String(activeTestimonial.name)}-${active}`}>
                <div className="testimonial-proof">
                  {activeAvatar ? (
                    <img
                      className="testimonial-avatar"
                      src={activeAvatar}
                      alt={
                        typeof activeTestimonial.avatarAlt === 'string'
                          ? activeTestimonial.avatarAlt
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
                </div>
                <blockquote>
                  “
                  {typeof activeTestimonial.quote === 'string'
                    ? activeTestimonial.quote
                    : ''}
                  ”
                </blockquote>
                <figcaption>
                  <strong>
                    {typeof activeTestimonial.name === 'string'
                      ? activeTestimonial.name
                      : ''}
                  </strong>
                  <small>
                    {typeof activeTestimonial.role === 'string'
                      ? activeTestimonial.role
                      : ''}
                  </small>
                </figcaption>
                <div
                  className="testimonial-rating"
                  aria-label="Five star testimonial"
                >
                  <span aria-hidden="true">★</span>
                  <span aria-hidden="true">★</span>
                  <span aria-hidden="true">★</span>
                  <span aria-hidden="true">★</span>
                  <span aria-hidden="true">★</span>
                </div>
              </figure>
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
            <button
              className="testimonial-arrow testimonial-arrow-next"
              type="button"
              onClick={() => move(1)}
              aria-label="Next testimonial"
            >
              →
            </button>
          </>
        ) : (
          <div className="testimonial-empty">
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
  const runtime = useOptionalNexusRuntimeConfig();
  const staticEntries = useMemo(
    () => items<EditorialCard>(component.properties, 'items'),
    [component.properties],
  );
  const [liveEntries, setLiveEntries] = useState<readonly EditorialCard[]>([]);
  const [liveStatus, setLiveStatus] = useState<'idle' | 'ready' | 'failed'>(
    'idle',
  );
  const [active, setActive] = useState(0);
  const [autoPaused, setAutoPaused] = useState(false);
  const [publicationStepPx, setPublicationStepPx] = useState(0);
  const [publicationResetting, setPublicationResetting] = useState(false);
  const publicationGridRef = useRef<HTMLDivElement>(null);
  const limit = Number(text(component.properties, 'limit', '4')) || 4;
  const autoIntervalMs =
    Number(text(component.properties, 'autoIntervalMs', '9000')) || 9000;
  const contentTypeCode = variant === 'news' ? 'NEWS' : 'BLOG';
  const channel = runtime?.config.channel;
  const editorialBaseUrl = runtime?.config.endpoints.editorial;
  const enterpriseCode = runtime?.config.enterpriseCode;
  const localeCode = runtime?.config.defaultLocale;
  const requestTimeoutMs = runtime?.config.requestTimeoutMs;
  const siteCode = runtime?.mapping.siteCode;
  const hasLiveEditorial =
    Boolean(editorialBaseUrl) &&
    Boolean(channel) &&
    Boolean(enterpriseCode) &&
    Boolean(localeCode) &&
    Boolean(requestTimeoutMs) &&
    Boolean(siteCode);
  const entries = hasLiveEditorial
    ? liveStatus === 'ready'
      ? liveEntries
      : []
    : staticEntries;
  const safeActive = entries.length ? Math.min(active, entries.length - 1) : 0;
  const entry = entries[safeActive];
  const move = (direction: number) => {
    if (!entries.length) return;
    setActive((value) => (value + direction + entries.length) % entries.length);
  };

  useEffect(() => {
    if (
      !editorialBaseUrl ||
      !channel ||
      !enterpriseCode ||
      !localeCode ||
      !requestTimeoutMs ||
      !siteCode
    )
      return undefined;
    const controller = new AbortController();
    listEditorialArticles({
      baseUrl: editorialBaseUrl,
      channel,
      contentTypeCode,
      enterpriseCode,
      limit,
      localeCode,
      signal: controller.signal,
      siteCode,
      timeoutMs: requestTimeoutMs,
    })
      .then((articles) => {
        if (controller.signal.aborted) return;
        setLiveEntries(
          articles.map((article) => {
            const media = staticEditorialMedia(article, staticEntries);
            return {
              href: article.slug
                ? `/${variant === 'news' ? 'news' : 'blog'}/${article.slug}`
                : article.href,
              imageAlt: article.imageAlt || media.imageAlt,
              label: contentTypeCode === 'NEWS' ? 'News' : 'Blog',
              linkLabel: 'Read more',
              referenceImageCode:
                article.referenceImageCode || media.referenceImageCode,
              summary: article.summary,
              title: article.title,
            };
          }),
        );
        setLiveStatus('ready');
        setActive(0);
      })
      .catch(() => {
        if (!controller.signal.aborted) setLiveStatus('failed');
      });
    return () => controller.abort();
  }, [
    channel,
    editorialBaseUrl,
    contentTypeCode,
    enterpriseCode,
    limit,
    localeCode,
    requestTimeoutMs,
    siteCode,
    staticEntries,
    variant,
  ]);

  useEffect(() => {
    if (autoPaused || entries.length < 2) return undefined;
    const interval = globalThis.setInterval(() => {
      setActive((value) => value + 1);
    }, autoIntervalMs);
    return () => globalThis.clearInterval(interval);
  }, [autoIntervalMs, autoPaused, entries.length]);

  useEffect(() => {
    const grid = publicationGridRef.current;
    if (!grid) return undefined;
    const measure = () => {
      const cards = grid.querySelectorAll<HTMLElement>(
        '.blog-publication-card',
      );
      const first = cards.item(0);
      const second = cards.item(1);
      if (first && second) {
        setPublicationStepPx(second.offsetLeft - first.offsetLeft);
      } else if (first) {
        setPublicationStepPx(first.offsetWidth);
      }
    };
    measure();
    const resizeObserver =
      typeof ResizeObserver === 'function'
        ? new ResizeObserver(measure)
        : undefined;
    resizeObserver?.observe(grid);
    globalThis.addEventListener('resize', measure);
    return () => {
      resizeObserver?.disconnect();
      globalThis.removeEventListener('resize', measure);
    };
  }, [entries.length]);

  useEffect(() => {
    if (active < entries.length || entries.length < 2) return undefined;
    const reset = globalThis.setTimeout(() => {
      setPublicationResetting(true);
      setActive(0);
      globalThis.requestAnimationFrame(() => {
        globalThis.requestAnimationFrame(() => setPublicationResetting(false));
      });
    }, 2450);
    return () => globalThis.clearTimeout(reset);
  }, [active, entries.length]);

  const source =
    entry && typeof entry.referenceImageCode === 'string'
      ? mediaImageSource(entry.referenceImageCode, runtime?.config.endpoints.cms)
      : undefined;
  const href =
    entry && typeof entry.href === 'string' ? safeHref(entry.href) : undefined;

  if (variant === 'blogs' || variant === 'news') {
    const itemLabel = variant === 'news' ? 'news item' : 'blog';
    const fallbackLabel = variant === 'news' ? 'News' : 'Blog';
    const publicationEntries =
      entries.length > 1
        ? [...entries, ...entries.slice(0, Math.min(3, entries.length))]
        : entries;
    const publicationTrackStyle = {
      transform: `translate3d(-${active * publicationStepPx}px, 0, 0)`,
    } as CSSProperties;
    return (
      <section className={`editorial-carousel ${variant}-carousel`} id={variant}>
        <div
          className="section-wrap blog-publications-wrap"
          onMouseEnter={() => setAutoPaused(true)}
          onMouseLeave={() => setAutoPaused(false)}
          onFocus={() => setAutoPaused(true)}
          onBlur={() => setAutoPaused(false)}
        >
          <div className="blog-publications-heading">
            <Header component={component} />
          </div>
          {entries.length ? (
            <div className="blog-publications-stage" aria-live="polite">
              {entries.length > 1 ? (
                <button
                  className="blog-publication-arrow blog-publication-arrow-prev"
                  type="button"
                  onClick={() => move(-1)}
                  aria-label={`Previous ${itemLabel}`}
                >
                  ←
                </button>
              ) : null}
              <div
                className="blog-publications-viewport"
              >
                <div
                  className={`blog-publication-grid${publicationResetting ? ' is-resetting' : ''}`}
                  ref={publicationGridRef}
                  style={publicationTrackStyle}
                >
                  {publicationEntries.map((blog, index) => {
                    const isClone = index >= entries.length;
                  const blogHref =
                    typeof blog.href === 'string'
                      ? safeHref(blog.href)
                      : undefined;
                  const blogSource =
                    typeof blog.referenceImageCode === 'string'
                      ? mediaImageSource(
                          blog.referenceImageCode,
                          runtime?.config.endpoints.cms,
                        )
                      : undefined;
                  const title =
                    typeof blog.title === 'string' ? blog.title : '';
                  return (
                    <article
                      aria-hidden={isClone ? true : undefined}
                      className="blog-publication-card"
                      data-publication-index={index}
                      key={`${title}-${index}`}
                    >
                      <div className="blog-publication-image">
                        {blogHref ? (
                          <a
                            href={blogHref}
                            aria-label={`Open ${title || 'blog detail'}`}
                          >
                            {blogSource ? (
                              <img
                                src={blogSource}
                                alt={
                                  typeof blog.imageAlt === 'string'
                                    ? blog.imageAlt
                                    : ''
                                }
                                loading="lazy"
                              />
                            ) : null}
                          </a>
                        ) : blogSource ? (
                          <img
                            src={blogSource}
                            alt={
                              typeof blog.imageAlt === 'string'
                                ? blog.imageAlt
                                : ''
                            }
                            loading="lazy"
                          />
                        ) : null}
                      </div>
                      <div className="blog-publication-copy">
                        <small>
                          {typeof blog.label === 'string'
                            ? blog.label
                            : fallbackLabel}
                        </small>
                        <h3>
                          {blogHref ? <a href={blogHref}>{title}</a> : title}
                        </h3>
                        <p>
                          {typeof blog.summary === 'string' ? blog.summary : ''}
                        </p>
                        {blogHref ? (
                          <a href={blogHref} className="blog-publication-read">
                            {typeof blog.linkLabel === 'string'
                              ? blog.linkLabel
                              : 'Read more'}
                          </a>
                        ) : null}
                      </div>
                    </article>
                  );
                  })}
                </div>
              </div>
              {entries.length > 1 ? (
                <button
                  className="blog-publication-arrow blog-publication-arrow-next"
                  type="button"
                  onClick={() => move(1)}
                  aria-label={`Next ${itemLabel}`}
                >
                  →
                </button>
              ) : null}
            </div>
          ) : (
            <p className="empty-note">
              {text(component.properties, 'emptyMessage')}
            </p>
          )}
          {text(component.properties, 'href') ? (
            <Link
              href={text(component.properties, 'href')}
              label={text(component.properties, 'linkLabel', 'View all')}
            />
          ) : null}
        </div>
      </section>
    );
  }

  return (
    <section className={`editorial-carousel ${variant}-carousel`} id={variant}>
      <div className="section-wrap">
        <div className="carousel-heading-row">
          <Header component={component} />
          {entries.length > 1 ? (
            <CarouselControls
              active={safeActive}
              count={entries.length}
              label={variant === 'news' ? 'news item' : 'blog'}
              onMove={move}
            />
          ) : null}
        </div>
        {entry ? (
          <article
            className="editorial-slide"
            key={`${component.code}-${safeActive}`}
            aria-live="polite"
          >
            <div className="editorial-image-wrap">
              {href ? (
                <a
                  className="editorial-image-link"
                  href={href}
                  aria-label={`Open ${typeof entry.title === 'string' ? entry.title : variant === 'news' ? 'news detail' : 'blog detail'}`}
                >
                  {source ? (
                    <img
                      src={source}
                      alt={
                        typeof entry.imageAlt === 'string' ? entry.imageAlt : ''
                      }
                      loading="lazy"
                    />
                  ) : null}
                </a>
              ) : source ? (
                <img
                  src={source}
                  alt={typeof entry.imageAlt === 'string' ? entry.imageAlt : ''}
                  loading="lazy"
                />
              ) : null}
              <span>{typeof entry.label === 'string' ? entry.label : ''}</span>
            </div>
            <div className="editorial-copy">
              <small>{`${String(safeActive + 1).padStart(2, '0')} — ${String(entries.length).padStart(2, '0')}`}</small>
              <h3>
                {href ? (
                  <a className="editorial-title-link" href={href}>
                    {typeof entry.title === 'string' ? entry.title : ''}
                  </a>
                ) : typeof entry.title === 'string' ? (
                  entry.title
                ) : (
                  ''
                )}
              </h3>
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
        {text(component.properties, 'href') ? (
          <Link
            href={text(component.properties, 'href')}
            label={text(component.properties, 'linkLabel', 'View all')}
          />
        ) : null}
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
  const p =
    component.code === 'nexusContactContent'
      ? {
          ...component.properties,
          kicker: 'Start with clarity',
          heading: 'Tell us where your enterprise journey needs to move next.',
          body:
            'Whether you are evaluating Nodics, planning a customer implementation, or exploring a delivery partnership, start with the outcome you want to create. We will route the conversation to the right next step.',
          items: [
            {
              title: 'Evaluate the framework',
              text: 'Discuss architecture, module ownership, documentation, local setup, and whether Nodics fits your enterprise platform direction.',
            },
            {
              title: 'Plan a customer journey',
              text: 'Shape the first implementation path, project boundaries, integrations, support expectations, and the safest route from reference to production.',
            },
            {
              title: 'Explore partnership',
              text: 'Talk about implementation collaboration, ecosystem contribution, commercial alignment, and long-term capability ownership.',
            },
          ],
          referenceImageCode: 'nodicsContactArchitecture',
          imageAlt:
            'Modern enterprise innovation center with connected golden modular light nodes',
          formKicker: 'Contact Nodics',
          formHeading: 'Share the starting point.',
          formBody:
            'Tell us who you are, what you are trying to build, and whether the conversation is about evaluation, implementation, support, or partnership. Keep it simple; we can add detail together.',
          formFields: [
            { name: 'name', label: 'Name', type: 'text' },
            { name: 'email', label: 'Business email', type: 'email' },
            { name: 'company', label: 'Organization', type: 'text' },
            {
              name: 'conversationType',
              label: 'Conversation type',
              type: 'text',
            },
            {
              name: 'message',
              label: 'What should we explore?',
              multiline: true,
            },
          ],
          formSubmitLabel: 'Send enquiry',
          formStatus:
            'Your message will be reviewed and routed to the right Nodics conversation.',
          testimonialKicker: 'Tell us if you like Nodics',
          testimonialHeading: 'Share your Nodics moment with the community.',
          testimonialBody:
            'If Nodics made the framework, delivery model, documentation, or BackOffice experience clearer for you, we would love to hear it. Approved testimonials can later be reviewed in Axis before they appear publicly.',
          testimonialItems: [
            'What problem were you trying to solve?',
            'Which Nodics capability or idea helped most?',
            'What should other teams know before they start?',
          ],
          testimonialLinkLabel: 'Submit',
          testimonialStatus:
            'Your note becomes a governed testimonial candidate. Axis users can review, curate, approve, and publish it later.',
        }
      : component.properties;
  const effectiveComponent =
    component.code === 'nexusContactContent'
      ? { ...component, properties: p }
      : component;
  const runtime = useOptionalNexusRuntimeConfig();
  const fallbackId = useId();
  const href = text(p, 'emailHref') || text(p, 'href');
  const label = text(p, 'emailLabel') || text(p, 'linkLabel');
  const conversationItems = items<{
    title?: unknown;
    text?: unknown;
  }>(p, 'items');
  const testimonialItems = strings(p, 'testimonialItems');
  const staticFormFields = items<{
    name?: unknown;
    label?: unknown;
    type?: unknown;
    multiline?: unknown;
    required?: unknown;
  }>(p, 'formFields');
  const [liveFormFields, setLiveFormFields] = useState<
    readonly NexusContactFormField[]
  >([]);
  const [formStatus, setFormStatus] = useState<'idle' | 'ready' | 'failed'>(
    'idle',
  );
  const [submissionStatus, setSubmissionStatus] = useState<
    'idle' | 'submitting' | 'submitted' | 'failed'
  >('idle');
  const [submissionMessage, setSubmissionMessage] = useState('');
  const [testimonialStatus, setTestimonialStatus] = useState<
    'idle' | 'submitting' | 'submitted' | 'failed'
  >('idle');
  const [testimonialMessage, setTestimonialMessage] = useState('');
  const definitionCode = text(p, 'formDefinitionCode', 'nexus-contact');
  const engagementBaseUrl = runtime?.config.endpoints.engagement;
  const enterpriseCode = runtime?.config.enterpriseCode;
  const requestTimeoutMs = runtime?.config.requestTimeoutMs;
  const formFields =
    formStatus === 'ready' && liveFormFields.length
      ? liveFormFields
      : staticFormFields.map((field, index) => {
          const name =
            typeof field.name === 'string' ? field.name : `field-${index}`;
          const type = typeof field.type === 'string' ? field.type : 'text';
          return {
            label: typeof field.label === 'string' ? field.label : name,
            multiline: field.multiline === true || type === 'textarea',
            name,
            required:
              field.required === true ||
              ['contactEmail', 'email', 'message', 'subject'].includes(name),
            type: type === 'email' || type === 'tel' ? type : 'text',
          };
        });

  useEffect(() => {
    if (!engagementBaseUrl || !enterpriseCode || !requestTimeoutMs)
      return undefined;
    const controller = new AbortController();
    getContactForm({
      baseUrl: engagementBaseUrl,
      definitionCode,
      enterpriseCode,
      signal: controller.signal,
      timeoutMs: requestTimeoutMs,
    })
      .then((definition) => {
        if (controller.signal.aborted) return;
        setLiveFormFields(definition?.fields || []);
        setFormStatus('ready');
      })
      .catch(() => {
        if (!controller.signal.aborted) setFormStatus('failed');
      });
    return () => controller.abort();
  }, [definitionCode, engagementBaseUrl, enterpriseCode, requestTimeoutMs]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const engagementEndpoint = runtime?.config.endpoints.engagement;
    if (!runtime || !engagementEndpoint || submissionStatus === 'submitting') {
      setSubmissionStatus('failed');
      setSubmissionMessage(
        'Submission is not available right now. Please try again shortly.',
      );
      return;
    }
    const formElement = event.currentTarget;
    const formData = new FormData(formElement);
    const value = (...names: readonly string[]) => {
      for (const name of names) {
        const raw = formData.get(name);
        if (typeof raw === 'string' && raw.trim()) return raw.trim();
      }
      return '';
    };
    const payload = {
      contactEmail: value('contactEmail', 'email'),
      contactPhone: value('contactPhone', 'phone', 'telephone'),
      message: value('message', 'body', 'comments'),
      preferredChannel: value('preferredChannel') || 'EMAIL',
      subject:
        value('subject', 'topic') ||
        value('name', 'fullName') ||
        text(p, 'defaultSubject', 'Nexus contact enquiry'),
      type: value('type') || text(p, 'contactType', 'ENQUIRY'),
    };
    setSubmissionStatus('submitting');
    setSubmissionMessage('');
    submitContact({
      baseUrl: engagementEndpoint,
      enterpriseCode: runtime.config.enterpriseCode,
      idempotencyKey:
        typeof crypto !== 'undefined' && 'randomUUID' in crypto
          ? crypto.randomUUID()
          : `${component.code}-${fallbackId}`,
      payload,
      timeoutMs: runtime.config.requestTimeoutMs,
    })
      .then((submission) => {
        setSubmissionStatus('submitted');
        setSubmissionMessage(
          submission.referenceCode
            ? `Request received. Reference: ${submission.referenceCode}`
            : 'Request received.',
        );
        formElement.reset();
      })
      .catch(() => {
        setSubmissionStatus('failed');
        setSubmissionMessage(
          'Submission is not available right now. Please try again shortly.',
        );
      });
  };

  const handleTestimonialSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const engagementEndpoint = runtime?.config.endpoints.engagement;
    if (
      !runtime ||
      !engagementEndpoint ||
      testimonialStatus === 'submitting'
    ) {
      setTestimonialStatus('failed');
      setTestimonialMessage(
        'Testimonial submission is not available right now. Please try again shortly.',
      );
      return;
    }
    const formElement = event.currentTarget;
    const formData = new FormData(formElement);
    const value = (name: string) => {
      const raw = formData.get(name);
      return typeof raw === 'string' ? raw.trim() : '';
    };
    const payload = {
      company: value('company'),
      contactEmail: value('email'),
      name: value('name'),
      role: value('role'),
      sourcePage: '/contact',
      testimonial: value('testimonial'),
    };
    setTestimonialStatus('submitting');
    setTestimonialMessage('');
    submitTestimonialCandidate({
      baseUrl: engagementEndpoint,
      enterpriseCode: runtime.config.enterpriseCode,
      idempotencyKey:
        typeof crypto !== 'undefined' && 'randomUUID' in crypto
          ? crypto.randomUUID()
          : `${component.code}-testimonial-${Date.now()}`,
      payload,
      timeoutMs: runtime.config.requestTimeoutMs,
    })
      .then((submission) => {
        setTestimonialStatus('submitted');
        setTestimonialMessage(
          submission.referenceCode
            ? `Thank you. Testimonial received for review: ${submission.referenceCode}`
            : 'Thank you. Your testimonial has been received for review.',
        );
        formElement.reset();
      })
      .catch(() => {
        setTestimonialStatus('failed');
        setTestimonialMessage(
          'Testimonial submission is not available right now. Please try again shortly.',
        );
      });
  };

  return (
    <section className="contact-section" id={text(p, 'anchor') || undefined}>
      <div className="section-wrap">
        <div className="contact-heading-grid">
          <Header component={effectiveComponent} />
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
                component={effectiveComponent}
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
              <form className="contact-form" onSubmit={handleSubmit}>
                {formFields.map((field, index) => {
                  const name = field.name || `field-${index}`;
                  const fieldLabel = field.label || name;
                  return (
                    <label
                      className={field.multiline ? 'is-message' : undefined}
                      key={`${component.code}-field-${name}`}
                    >
                      <span>{fieldLabel}</span>
                      {field.multiline ? (
                        <textarea
                          name={name}
                          required={field.required}
                          rows={3}
                        />
                      ) : (
                        <input
                          name={name}
                          required={field.required}
                          type={field.type || 'text'}
                        />
                      )}
                    </label>
                  );
                })}
                <div className="contact-form-action">
                  <button
                    type="submit"
                    disabled={!runtime || submissionStatus === 'submitting'}
                  >
                    {text(p, 'formSubmitLabel', 'Send enquiry')}
                  </button>
                  <small aria-live="polite">
                    {submissionMessage ||
                      (runtime
                        ? text(
                            p,
                            'formStatus',
                            'Submissions are routed through Nodics Engagement.',
                          )
                        : text(
                            p,
                            'formStatus',
                            'Leave your details and the Nodics team will get back to you shortly.',
                          ))}
                  </small>
                </div>
              </form>
            </div>
          </div>
        ) : null}
        {text(p, 'testimonialHeading') ? (
          <div className="contact-testimonial-panel">
            <div>
              <p className="contact-form-kicker">
                {text(p, 'testimonialKicker', 'Tell us if you like Nodics')}
              </p>
              <h3>{text(p, 'testimonialHeading')}</h3>
              <div className="contact-testimonial-copy">
                <p>{text(p, 'testimonialBody')}</p>
                {testimonialItems.length ? (
                  <ul>
                    {testimonialItems.map((item, index) => (
                      <li key={`${component.code}-testimonial-${index}`}>
                        {item}
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
            </div>
            <div>
              {testimonialItems.length ? (
                <p className="contact-testimonial-form-note">
                  Share the short version first. Axis can refine the public
                  wording later.
                </p>
              ) : null}
              <form
                className="contact-testimonial-form"
                onSubmit={handleTestimonialSubmit}
              >
                <label>
                  <span>Name</span>
                  <input name="name" required type="text" />
                </label>
                <label>
                  <span>Business email</span>
                  <input name="email" required type="email" />
                </label>
                <label>
                  <span>Role</span>
                  <input name="role" type="text" />
                </label>
                <label>
                  <span>Organization</span>
                  <input name="company" type="text" />
                </label>
                <label className="is-message">
                  <span>Your Nodics moment</span>
                  <textarea name="testimonial" required rows={4} />
                </label>
                <div className="contact-form-action testimonial-action">
                  <button
                    type="submit"
                    disabled={
                      !runtime || testimonialStatus === 'submitting'
                    }
                  >
                    {text(p, 'testimonialLinkLabel', 'Share testimonial')}
                  </button>
                  <small aria-live="polite">
                    {testimonialMessage ||
                      (runtime
                        ? text(
                            p,
                            'testimonialStatus',
                            'Testimonials are reviewed before publication.',
                          )
                        : 'Testimonial submission will be available when Nexus is connected to Engagement.')}
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
