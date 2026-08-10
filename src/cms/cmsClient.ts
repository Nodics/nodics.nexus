import {
  parseCmsResolvedPage,
  type CmsResolvedPageContract,
} from './cmsContract';

export interface ResolveCmsPageInput {
  readonly cmsBaseUrl: string;
  readonly enterpriseCode: string;
  readonly site: string;
  readonly path: string;
  readonly locale: string;
  readonly channel: string;
  readonly timeoutMs: number;
  readonly signal?: AbortSignal;
}

export async function resolveCmsPage(
  input: ResolveCmsPageInput,
  fetchImplementation: typeof fetch = fetch,
): Promise<CmsResolvedPageContract> {
  const url = new URL(
    '/nodics/cms/v0/delivery/pages/resolve',
    input.cmsBaseUrl,
  );
  url.searchParams.set('site', input.site);
  url.searchParams.set('path', input.path);
  url.searchParams.set('locale', input.locale);
  url.searchParams.set('channel', input.channel);
  url.searchParams.set('contractVersion', '1');
  const controller = new AbortController();
  const timeout = globalThis.setTimeout(
    () => controller.abort(),
    input.timeoutMs,
  );
  const abort = () => controller.abort();
  input.signal?.addEventListener('abort', abort, { once: true });
  try {
    const response = await fetchImplementation(url, {
      headers: {
        Accept: 'application/json',
        'x-enterprise-code': input.enterpriseCode,
      },
      cache: 'no-store',
      credentials: 'omit',
      redirect: 'error',
      signal: controller.signal,
    });
    if (!response.ok)
      throw new Error(
        response.status === 404
          ? 'This Nexus page is not available.'
          : `CMS delivery returned HTTP ${response.status}`,
      );
    const document: unknown = await response.json();
    if (
      !document ||
      typeof document !== 'object' ||
      Array.isArray(document) ||
      !('result' in document)
    )
      throw new Error('CMS returned an invalid response envelope');
    return parseCmsResolvedPage((document as { result: unknown }).result);
  } catch (error) {
    if (controller.signal.aborted)
      throw new Error('CMS page delivery timed out');
    throw error instanceof Error
      ? error
      : new Error('CMS page delivery failed');
  } finally {
    globalThis.clearTimeout(timeout);
    input.signal?.removeEventListener('abort', abort);
  }
}
