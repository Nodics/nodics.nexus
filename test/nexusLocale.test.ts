import { describe, expect, it } from 'vitest';
import { safeHref } from '../src/cms/renderers/propertyReaders';
import { nexusLocale, localeDirection } from '../src/runtime/nexusLocale';
describe('Nexus locale presentation', () => {
  it('accepts a canonical language without reading caller tenant or Site values', () => {
    expect(
      nexusLocale('en', '?lang=AR&site=other&enterpriseCode=foreign'),
    ).toBe('ar');
    expect(localeDirection('ar')).toBe('rtl');
    expect(localeDirection('en')).toBe('ltr');
  });
  it('refuses executable and ambiguous published navigation while retaining local locale links', () => {
    for (const href of [
      'javascript:alert(1)',
      '//foreign.test',
      '/\\foreign.test',
      'data:text/html,bad',
      ' https://foreign.test',
    ])
      expect(safeHref(href)).toBeUndefined();
    expect(safeHref('/?lang=ar#aboutus')).toBe('/?lang=ar#aboutus');
  });
  it('keeps the deployment default for invalid and oversized language inputs', () => {
    for (const value of ['javascript:bad', '../../other', 'a'.repeat(65)])
      expect(nexusLocale('en', '?lang=' + encodeURIComponent(value))).toBe(
        'en',
      );
    expect(nexusLocale('en', '?tab=api')).toBe('en');
  });
});
