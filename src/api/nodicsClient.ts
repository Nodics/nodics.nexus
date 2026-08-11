export interface NodicsClientInput {
  readonly baseUrl: string;
  readonly enterpriseCode: string;
  readonly timeoutMs: number;
  readonly signal?: AbortSignal;
}

function correlationId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto)
    return `nexus-${crypto.randomUUID()}`;
  return `nexus-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function endpoint(baseUrl: string, path: string): URL {
  if (path.startsWith('/')) return new URL(path, baseUrl);
  return new URL(path, baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`);
}

export async function requestNodicsJson<T>(
  input: NodicsClientInput & {
    readonly path: string;
    readonly method?: 'GET' | 'POST';
    readonly body?: unknown;
    readonly headers?: Record<string, string>;
  },
  fetchImplementation: typeof fetch = fetch,
): Promise<T> {
  const controller = new AbortController();
  const timeout = globalThis.setTimeout(
    () => controller.abort(),
    input.timeoutMs,
  );
  const abort = () => controller.abort();
  input.signal?.addEventListener('abort', abort, { once: true });
  try {
    const response = await fetchImplementation(
      endpoint(input.baseUrl, input.path),
      {
        body: input.body === undefined ? undefined : JSON.stringify(input.body),
        cache: 'no-store',
        credentials: 'omit',
        headers: {
          Accept: 'application/json',
          'x-correlation-id':
            input.headers?.['x-correlation-id'] || correlationId(),
          'x-enterprise-code': input.enterpriseCode,
          ...(input.body === undefined
            ? {}
            : { 'content-type': 'application/json' }),
          ...(input.headers || {}),
        },
        method: input.method || 'GET',
        redirect: 'error',
        signal: controller.signal,
      },
    );
    const payload: unknown = await response.json().catch(() => undefined);
    if (!response.ok)
      throw new Error(`Nodics API returned HTTP ${response.status}`);
    if (!payload || typeof payload !== 'object' || Array.isArray(payload))
      throw new Error('Nodics API returned an invalid response envelope');
    const envelope = payload as {
      readonly data?: unknown;
      readonly result?: unknown;
    };
    return (envelope.data ?? envelope.result ?? payload) as T;
  } catch (error) {
    if (controller.signal.aborted) throw new Error('Nodics API timed out');
    throw error instanceof Error ? error : new Error('Nodics API failed');
  } finally {
    globalThis.clearTimeout(timeout);
    input.signal?.removeEventListener('abort', abort);
  }
}
