const referenceImages = Object.freeze({
  oxaviaHeroOne: '/assets/reference/oxavia/hero-1.jpg',
  oxaviaHeroTwo: '/assets/reference/oxavia/hero-2.jpg',
  oxaviaAboutOne: '/assets/reference/oxavia/about-1.jpg',
  oxaviaAboutTwo: '/assets/reference/oxavia/about-2.jpg',
  oxaviaWorkOne: '/assets/reference/oxavia/work-1.jpg',
  oxaviaWorkEight: '/assets/reference/oxavia/work-8.jpg',
  azotaHeroOne: '/assets/reference/azota/hero-1.jpg',
  azotaHeroTwo: '/assets/reference/azota/hero-2.jpg',
  azotaHeroThree: '/assets/reference/azota/hero-3.jpg',
  nodicsMicroservicesHero:
    '/assets/reference/azota/hero-microservices-axis-v2.png',
  nodicsModularHero: '/assets/reference/azota/hero-modular-axis-v2.png',
  nodicsSecureHero: '/assets/reference/azota/hero-secure-axis-v2.png',
  nodicsFeaturesArchitecture: '/assets/nodics/features-modular-ai-v1.png',
  nodicsAboutCollaboration: '/assets/nodics/about-ai-collaboration-v1.png',
  nodicsAboutArchitecture: '/assets/nodics/about-architecture-workshop-v2.png',
  nodicsAboutVerticalWorkshop:
    '/assets/nodics/about/about-vertical-framework-workshop-v1.png',
  nodicsAboutVerticalJourney:
    '/assets/nodics/about/about-vertical-adoption-journey-v1.png',
  nodicsAboutVerticalOperations:
    '/assets/nodics/about/about-vertical-operations-journey-v2.png',
  nodicsContactArchitecture:
    '/assets/nodics/contact/contact-architecture-v1.png',
  nodicsDeveloperExperience:
    '/assets/nodics/developers/developer-contract-workshop-v1.png',
  nodicsDeveloperContractWorkshop:
    '/assets/nodics/developers/developer-contract-workshop-v1.png',
  nodicsProductOperatingModel:
    '/assets/nodics/products/product-operating-model-v2.png',
  nexusNewsPublicExperience:
    '/assets/nodics/editorial/news-public-experience-v1.png',
  nexusNewsAxisRuntime: '/assets/nodics/editorial/news-axis-runtime-v1.png',
  nexusNewsEngagementApi:
    '/assets/nodics/editorial/news-engagement-api-v1.png',
  nexusNewsEditorialRelease:
    '/assets/nodics/editorial/news-editorial-release-v1.png',
  nexusBlogCustomerEngagement:
    '/assets/nodics/editorial/blog-customer-engagement-v1.png',
  nexusBlogEditorialPublication:
    '/assets/nodics/editorial/blog-editorial-publication-v1.png',
  nexusBlogRuntimeDiscovery:
    '/assets/nodics/editorial/blog-runtime-discovery-v1.png',
  nexusBlogAxisOperations:
    '/assets/nodics/editorial/blog-axis-operations-v1.png',
  nexusTestimonialAarohi:
    '/assets/nodics/testimonials/aarohi-mehta-illustrative.png',
  nexusTestimonialMarcus:
    '/assets/nodics/testimonials/marcus-reed-illustrative.png',
  nexusTestimonialDaniel:
    '/assets/nodics/testimonials/daniel-kim-illustrative.png',
  azotaAboutOne: '/assets/reference/azota/about-1.png',
  azotaSkillOne: '/assets/reference/azota/skill-1.png',
  azotaContactOne: '/assets/reference/azota/contact-1.png',
});

export type ReferenceImageCode = keyof typeof referenceImages;

export const referenceImageSource = (code: string): string | undefined =>
  Object.prototype.hasOwnProperty.call(referenceImages, code)
    ? referenceImages[code as ReferenceImageCode]
    : undefined;

export const mediaImageSource = (
  code: string,
  cmsBaseUrl?: string,
): string | undefined => {
  const value = code.trim();
  if (!value) return undefined;
  const mapped = referenceImageSource(value);
  if (mapped) return mapped;
  if (/^(https?:)?\/\//u.test(value) || value.startsWith('/')) return value;
  if (!cmsBaseUrl) return undefined;
  return new URL(
    `/nodics/media/v0/content/${encodeURIComponent(value)}`,
    cmsBaseUrl,
  ).toString();
};
