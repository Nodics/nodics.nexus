/** Locale is a presentation preference; it never selects a Site, tenant or catalog. */
export function nexusLocale(defaultLocale: string, search: string): string {
  const candidate = new URLSearchParams(search).get('lang');
  if (!candidate || candidate.length > 64) return defaultLocale;
  try {
    return Intl.getCanonicalLocales(candidate)[0] || defaultLocale;
  } catch {
    return defaultLocale;
  }
}
export function localeDirection(locale: string): 'rtl' | 'ltr' {
  try {
    return ['Arab', 'Hebr', 'Thaa', 'Nkoo', 'Adlm', 'Rohg', 'Syrc'].includes(
      new Intl.Locale(locale).maximize().script || '',
    )
      ? 'rtl'
      : 'ltr';
  } catch {
    return 'ltr';
  }
}
