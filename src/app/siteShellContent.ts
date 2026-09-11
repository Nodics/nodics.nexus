import type { CmsResolvedPageContract } from '../cms/cmsContract';
import type {
  SiteShellContent,
  SiteShellFooterGroup,
  SiteShellLink,
} from './SiteShell';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function string(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value : undefined;
}

function records(value: unknown): readonly Record<string, unknown>[] {
  return Array.isArray(value) ? value.filter(isRecord) : Object.freeze([]);
}

function shellLink(value: unknown): SiteShellLink | undefined {
  if (!isRecord(value)) return undefined;
  const label = string(value.label);
  const href = string(value.href);
  if (!label || !href) return undefined;
  return Object.freeze({
    label,
    href,
    ...(string(value.id) ? { id: string(value.id) } : {}),
  });
}

function shellFooterGroup(value: unknown): SiteShellFooterGroup | undefined {
  if (!isRecord(value)) return undefined;
  const title = string(value.title);
  const links = Object.freeze(
    records(value.links)
      .map(shellLink)
      .filter((item): item is SiteShellLink => Boolean(item)),
  );
  if (!title || !links.length) return undefined;
  return Object.freeze({ title, links });
}

export function siteShellFromPage(
  page: CmsResolvedPageContract,
): SiteShellContent | undefined {
  const header = page.page.components.find(
    (component) =>
      component.active && component.renderer === 'nexus.component.site-header',
  );
  const footer = page.page.components.find(
    (component) =>
      component.active && component.renderer === 'nexus.component.site-footer',
  );
  if (!header && !footer) return undefined;
  return Object.freeze({
    ...(string(header?.properties.brandLabel)
      ? { brandLabel: string(header?.properties.brandLabel) }
      : {}),
    ...(string(header?.properties.brandSubtitle)
      ? { brandSubtitle: string(header?.properties.brandSubtitle) }
      : {}),
    ...(string(footer?.properties.brandSummary)
      ? { brandSummary: string(footer?.properties.brandSummary) }
      : {}),
    ...(string(footer?.properties.contactHeading)
      ? { contactHeading: string(footer?.properties.contactHeading) }
      : {}),
    ...(string(footer?.properties.contactEmail)
      ? { contactEmail: string(footer?.properties.contactEmail) }
      : {}),
    navigation: Object.freeze(
      records(header?.properties.navigation)
        .map(shellLink)
        .filter((item): item is SiteShellLink => Boolean(item)),
    ),
    footerGroups: Object.freeze(
      records(footer?.properties.groups)
        .map(shellFooterGroup)
        .filter((item): item is SiteShellFooterGroup => Boolean(item)),
    ),
    ...(string(footer?.properties.legalText)
      ? { legalText: string(footer?.properties.legalText) }
      : {}),
    legalLinks: Object.freeze(
      records(footer?.properties.legalLinks)
        .map(shellLink)
        .filter((item): item is SiteShellLink => Boolean(item)),
    ),
    socialLinks: Object.freeze(
      records(footer?.properties.socialLinks)
        .map((item) => {
          const name = string(item.name);
          const href = string(item.href);
          return name && href ? Object.freeze({ name, href }) : undefined;
        })
        .filter(
          (item): item is { readonly name: string; readonly href: string } =>
            Boolean(item),
        ),
    ),
  });
}
