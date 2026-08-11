import type { ComponentType } from 'react';
import { componentIsVisible } from './componentVisibility';
import type { CmsComponentContract } from './cmsContract';
import {
  CardsRenderer,
  BannerCarouselRenderer,
  BannerSlideRenderer,
  ContactRenderer,
  ContentRenderer,
  GithubRenderer,
  BlogCarouselRenderer,
  NewsCarouselRenderer,
  PageHeroRenderer,
  TechnologyRenderer,
  TestimonialsRenderer,
} from './renderers/CorporateRenderers';
import {
  EditorialAuthorRenderer,
  EditorialCardRenderer,
  EditorialDetailRenderer,
  EditorialFeaturedRenderer,
  EditorialLatestRenderer,
  EditorialListingRenderer,
  EditorialRelatedRenderer,
  EditorialSeriesRenderer,
  EditorialTaxonomyRenderer,
} from './renderers/EditorialRenderers';

type Renderer = ComponentType<{ readonly component: CmsComponentContract }>;
const registry: Readonly<Record<string, Renderer>> = Object.freeze({
  'nexus.component.banner-carousel': BannerCarouselRenderer,
  'nexus.component.banner-slide': BannerSlideRenderer,
  'nexus.component.page-hero': PageHeroRenderer,
  'nexus.component.content': ContentRenderer,
  'nexus.component.cards': CardsRenderer,
  'nexus.component.technology': TechnologyRenderer,
  'nexus.component.github': GithubRenderer,
  'nexus.component.testimonials': TestimonialsRenderer,
  'nexus.component.news-carousel': NewsCarouselRenderer,
  'nexus.component.blog-carousel': BlogCarouselRenderer,
  'nexus.component.contact': ContactRenderer,
  'nexus.editorial.listing': EditorialListingRenderer,
  'nexus.editorial.card': EditorialCardRenderer,
  'nexus.editorial.detail': EditorialDetailRenderer,
  'nexus.editorial.featured': EditorialFeaturedRenderer,
  'nexus.editorial.latest': EditorialLatestRenderer,
  'nexus.editorial.taxonomy': EditorialTaxonomyRenderer,
  'nexus.editorial.author': EditorialAuthorRenderer,
  'nexus.editorial.related': EditorialRelatedRenderer,
  'nexus.editorial.series': EditorialSeriesRenderer,
});

export function CmsComponentRenderer({
  component,
  channel,
}: {
  readonly component: CmsComponentContract;
  readonly channel: string;
}) {
  if (!componentIsVisible(component)) return null;
  if (
    component.rendererContractVersion !== 1 ||
    component.rendererDeprecated ||
    !component.rendererChannels.includes(channel)
  )
    return (
      <section className="contract-error" role="alert">
        This content is not compatible with this Nexus release.
      </section>
    );
  const Renderer = registry[component.renderer];
  if (!Renderer)
    return (
      <section className="contract-error" role="alert">
        Unsupported content renderer: {component.renderer}
      </section>
    );
  return <Renderer component={component} />;
}
