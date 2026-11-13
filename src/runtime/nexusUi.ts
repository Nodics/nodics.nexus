import { useOptionalNexusRuntimeConfig } from './NexusRuntimeConfigContext';
import { nexusLocale } from './nexusLocale';
/** Interface labels only. Published business copy remains CMS-owned. */
export function nexusUi(locale: string) {
  const ar = locale.split('-')[0] === 'ar';
  return {
    rtl: ar,
    pauseRotation: ar ? 'إيقاف التدوير التلقائي' : 'Pause automatic rotation',
    resumeRotation: ar
      ? 'استئناف التدوير التلقائي'
      : 'Resume automatic rotation',
    loadingArticles: ar ? 'جارٍ تحميل المقالات…' : 'Loading articles…',
    articlesUnavailable: ar
      ? 'المقالات غير متاحة مؤقتًا.'
      : 'Articles are temporarily unavailable.',
    retry: ar ? 'حاول مرة أخرى' : 'Try again',
    primaryNavigation: ar ? 'التنقل الرئيسي' : 'Primary navigation',
    toggleNavigation: ar
      ? 'فتح أو إغلاق التنقل الرئيسي'
      : 'Toggle primary navigation',
    skipContent: ar ? 'انتقل إلى المحتوى' : 'Skip to content',
    principles: ar ? 'مبادئ Nodics' : 'Nodics principles',
    exploreProducts: ar ? 'استكشف منتجات Nodics' : 'Explore Nodics products',
    previousTestimonial: ar ? 'الشهادة السابقة' : 'Previous testimonial',
    nextTestimonial: ar ? 'الشهادة التالية' : 'Next testimonial',
    chooseTestimonial: ar ? 'اختر شهادة' : 'Choose testimonial',
    showTestimonial: ar ? 'عرض الشهادة' : 'Show testimonial',
    fiveStars: ar ? 'تقييم بخمس نجوم' : 'Five star testimonial',
    previous: ar ? 'السابق' : 'Previous',
    next: ar ? 'التالي' : 'Next',
    open: ar ? 'افتح' : 'Open',
    news: ar ? 'أخبار' : 'News',
    blog: ar ? 'مقال' : 'Blog',
    readMore: ar ? 'اقرأ المزيد' : 'Read more',
    socialChannels: ar ? 'قنوات Nodics الاجتماعية' : 'Nodics social channels',
    socialOn: ar ? 'Nodics على' : 'Nodics on',
    submissionUnavailable: ar
      ? 'إرسال الطلب غير متاح حاليًا. يرجى المحاولة مرة أخرى بعد قليل.'
      : 'Submission is not available right now. Please try again shortly.',
    requestReceived: ar ? 'تم استلام الطلب.' : 'Request received.',
    reference: ar ? 'المرجع:' : 'Reference:',
  };
}
export function useNexusUi() {
  const runtime = useOptionalNexusRuntimeConfig();
  return nexusUi(
    runtime?.config.defaultLocale ||
      nexusLocale(
        'en',
        typeof window === 'undefined' ? '' : window.location.search,
      ),
  );
}
/** Preserve the selected delivery locale on owner-provided internal article links. */
export function nexusLocaleHref(href: string, locale: string): string {
  if (!href.startsWith('/') || href.startsWith('//') || locale === 'en')
    return href;
  const url = new URL(href, 'https://nexus.invalid');
  url.searchParams.set('lang', locale);
  return url.pathname + url.search + url.hash;
}
