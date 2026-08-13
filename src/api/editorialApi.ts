import { requestNodicsJson, type NodicsClientInput } from './nodicsClient';

export interface NexusEditorialArticle {
  readonly articleCode?: string;
  readonly contentTypeCode?: string;
  readonly slug?: string;
  readonly title?: string;
  readonly summary?: string;
  readonly body?: string;
  readonly href?: string;
  readonly imageAlt?: string;
  readonly referenceImageCode?: string;
  readonly special?: boolean;
  readonly specialFrom?: string;
  readonly specialLabel?: string;
  readonly specialRank?: number;
  readonly specialUntil?: string;
  readonly specialVariant?: string;
  readonly takeaways?: readonly string[];
}

function stringValue(
  input: Record<string, unknown>,
  ...keys: readonly string[]
): string | undefined {
  for (const key of keys) {
    const value = input[key];
    if (typeof value === 'string' && value) return value;
  }
  return undefined;
}

function bodyText(value: unknown): string | undefined {
  if (typeof value === 'string') return value;
  if (!value || typeof value !== 'object' || Array.isArray(value))
    return undefined;
  const record = value as Record<string, unknown>;
  const blocks = Array.isArray(record.blocks) ? record.blocks : [];
  const text = blocks
    .map((block) =>
      block && typeof block === 'object' && !Array.isArray(block)
        ? (block as Record<string, unknown>).text
        : undefined,
    )
    .filter((item): item is string => typeof item === 'string' && Boolean(item))
    .join('\n\n');
  return text || undefined;
}

function article(value: unknown): NexusEditorialArticle | undefined {
  if (!value || typeof value !== 'object' || Array.isArray(value))
    return undefined;
  const input = value as Record<string, unknown>;
  const slug = stringValue(input, 'slug');
  const optional = <K extends keyof NexusEditorialArticle>(
    key: K,
    candidate: NexusEditorialArticle[K] | undefined,
  ): Partial<NexusEditorialArticle> =>
    candidate === undefined ? {} : { [key]: candidate };
  return {
    ...optional('articleCode', stringValue(input, 'articleCode')),
    ...optional('body', bodyText(input.body)),
    ...optional('contentTypeCode', stringValue(input, 'contentTypeCode')),
    ...optional('href', slug ? `/articles/${slug}` : undefined),
    ...optional('imageAlt', stringValue(input, 'imageAlt')),
    ...optional(
      'referenceImageCode',
      stringValue(input, 'referenceImageCode', 'featuredMediaCode'),
    ),
    ...optional(
      'special',
      typeof input.special === 'boolean' ? input.special : undefined,
    ),
    ...optional('specialFrom', stringValue(input, 'specialFrom')),
    ...optional('specialLabel', stringValue(input, 'specialLabel')),
    ...optional(
      'specialRank',
      typeof input.specialRank === 'number' &&
        Number.isFinite(input.specialRank)
        ? input.specialRank
        : undefined,
    ),
    ...optional('specialUntil', stringValue(input, 'specialUntil')),
    ...optional('specialVariant', stringValue(input, 'specialVariant')),
    ...optional('slug', slug),
    ...optional('summary', stringValue(input, 'summary')),
    ...optional(
      'takeaways',
      Array.isArray(input.takeaways)
        ? input.takeaways.filter(
            (item): item is string => typeof item === 'string' && Boolean(item),
          )
        : undefined,
    ),
    ...optional('title', stringValue(input, 'title')),
  };
}

export async function getEditorialArticle(
  input: NodicsClientInput & {
    readonly siteCode: string;
    readonly localeCode: string;
    readonly channel: string;
    readonly slug: string;
  },
): Promise<NexusEditorialArticle | undefined> {
  const path = new URL(
    `v0/delivery/articles/${encodeURIComponent(input.slug)}`,
    `${input.baseUrl}/`,
  );
  path.searchParams.set('siteCode', input.siteCode);
  path.searchParams.set('localeCode', input.localeCode);
  path.searchParams.set('channel', input.channel);
  const response = await requestNodicsJson<unknown>({
    ...input,
    path: path.pathname + path.search,
  });
  return article(response);
}

export async function listEditorialArticles(
  input: NodicsClientInput & {
    readonly siteCode: string;
    readonly localeCode: string;
    readonly channel: string;
    readonly contentTypeCode?: string;
    readonly limit?: number;
  },
): Promise<readonly NexusEditorialArticle[]> {
  const articlePath = input.contentTypeCode
    ? `v0/delivery/types/${encodeURIComponent(input.contentTypeCode)}/articles`
    : 'v0/delivery/articles';
  const path = new URL(articlePath, `${input.baseUrl}/`);
  path.searchParams.set('siteCode', input.siteCode);
  path.searchParams.set('localeCode', input.localeCode);
  path.searchParams.set('channel', input.channel);
  path.searchParams.set('limit', String(input.limit || 8));
  const response = await requestNodicsJson<{
    readonly items?: readonly unknown[];
  }>({ ...input, path: path.pathname + path.search });
  return (response.items || [])
    .map(article)
    .filter((item): item is NexusEditorialArticle => Boolean(item))
    .slice(0, input.limit || 8);
}
