import { requestNodicsJson, type NodicsClientInput } from './nodicsClient';

export interface NexusEditorialArticle {
  readonly articleCode?: string;
  readonly contentTypeCode?: string;
  readonly slug?: string;
  readonly title?: string;
  readonly summary?: string;
  readonly body?: string;
  readonly href?: string;
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
  const slug = typeof input.slug === 'string' ? input.slug : undefined;
  return {
    articleCode:
      typeof input.articleCode === 'string' ? input.articleCode : undefined,
    body: bodyText(input.body),
    contentTypeCode:
      typeof input.contentTypeCode === 'string'
        ? input.contentTypeCode
        : undefined,
    href: slug ? `/articles/${slug}` : undefined,
    slug,
    summary: typeof input.summary === 'string' ? input.summary : undefined,
    title: typeof input.title === 'string' ? input.title : undefined,
  };
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
