export interface NexusHostMapping {
  readonly hosts: readonly string[];
  readonly siteCode: string;
  readonly experience: 'corporate' | 'demo';
}

export interface NexusRuntimeEndpoints {
  readonly cms: string;
  readonly engagement?: string | undefined;
  readonly editorial?: string | undefined;
  readonly localization?: string | undefined;
  readonly profile?: string | undefined;
}

export interface NexusRuntimeConfig {
  readonly axisBaseUrl: string;
  readonly platformBaseUrl: string;
  readonly endpoints: NexusRuntimeEndpoints;
  readonly enterpriseCode: string;
  readonly defaultLocale: string;
  readonly channel: string;
  readonly clientContractVersion: number;
  readonly requestTimeoutMs: number;
  readonly hostMappings: readonly NexusHostMapping[];
}

function record(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('Invalid Nexus runtime configuration');
  }
  return value as Record<string, unknown>;
}

function requiredString(value: unknown, field: string): string {
  if (typeof value !== 'string' || !value.trim())
    throw new Error(`Invalid Nexus runtime configuration: ${field}`);
  return value.trim();
}

function positiveInteger(value: unknown, field: string): number {
  if (!Number.isInteger(value) || Number(value) < 1)
    throw new Error(`Invalid Nexus runtime configuration: ${field}`);
  return Number(value);
}

export function parseNexusRuntimeConfig(value: unknown): NexusRuntimeConfig {
  const candidate = record(value);
  const parsedAxisUrl = new URL(
    requiredString(candidate.axisBaseUrl, 'axisBaseUrl'),
  );
  const parsedPlatformUrl = new URL(
    requiredString(candidate.platformBaseUrl, 'platformBaseUrl'),
  );
  if (!['http:', 'https:'].includes(parsedAxisUrl.protocol))
    throw new Error(
      'Invalid Nexus runtime configuration: axisBaseUrl protocol',
    );
  if (!['http:', 'https:'].includes(parsedPlatformUrl.protocol))
    throw new Error(
      'Invalid Nexus runtime configuration: platformBaseUrl protocol',
    );
  if (
    !Array.isArray(candidate.hostMappings) ||
    candidate.hostMappings.length < 1
  )
    throw new Error('Invalid Nexus runtime configuration: hostMappings');
  const hostMappings = candidate.hostMappings.map((item, index) => {
    const mapping = record(item);
    if (!Array.isArray(mapping.hosts) || mapping.hosts.length < 1)
      throw new Error(
        `Invalid Nexus runtime configuration: hostMappings.${index}.hosts`,
      );
    const experience = requiredString(
      mapping.experience,
      `hostMappings.${index}.experience`,
    );
    if (!['corporate', 'demo'].includes(experience))
      throw new Error(
        `Invalid Nexus runtime configuration: hostMappings.${index}.experience`,
      );
    return Object.freeze({
      hosts: Object.freeze(
        mapping.hosts.map((host, hostIndex) =>
          requiredString(
            host,
            `hostMappings.${index}.hosts.${hostIndex}`,
          ).toLowerCase(),
        ),
      ),
      siteCode: requiredString(
        mapping.siteCode,
        `hostMappings.${index}.siteCode`,
      ),
      experience: experience as 'corporate' | 'demo',
    });
  });
  return Object.freeze({
    axisBaseUrl: parsedAxisUrl.toString().replace(/\/$/u, ''),
    platformBaseUrl: parsedPlatformUrl.toString().replace(/\/$/u, ''),
    endpoints: Object.freeze({ cms: '' }),
    enterpriseCode: requiredString(candidate.enterpriseCode, 'enterpriseCode'),
    defaultLocale: requiredString(candidate.defaultLocale, 'defaultLocale'),
    channel: requiredString(candidate.channel, 'channel'),
    clientContractVersion: positiveInteger(
      candidate.clientContractVersion,
      'clientContractVersion',
    ),
    requestTimeoutMs: positiveInteger(
      candidate.requestTimeoutMs,
      'requestTimeoutMs',
    ),
    hostMappings: Object.freeze(hostMappings),
  });
}

function safeEndpoint(value: unknown, field: string): string | undefined {
  if (value === undefined) return undefined;
  const parsed = new URL(requiredString(value, field));
  if (!['http:', 'https:'].includes(parsed.protocol))
    throw new Error(`Invalid Nexus public bootstrap: ${field} protocol`);
  return parsed.toString().replace(/\/$/u, '');
}

function parsePublicBootstrapEndpoints(
  value: unknown,
  expectedVersion: number,
): NexusRuntimeEndpoints {
  const envelope = record(value);
  const data = record(envelope.data);
  if (
    data.contractVersion !== expectedVersion ||
    data.clientContractVersion !== expectedVersion
  )
    throw new Error('Nexus public bootstrap contract is incompatible');
  const endpoints = record(data.endpoints);
  const endpointRoles = record(data.endpointRoles);
  if (endpointRoles.cms !== 'ONLINE') {
    throw new Error('Nexus public bootstrap CMS endpoint is not Online');
  }
  return Object.freeze({
    cms:
      safeEndpoint(endpoints.cms, 'cms') ||
      (() => {
        throw new Error('Nexus public bootstrap did not provide CMS endpoint');
      })(),
    engagement: safeEndpoint(endpoints.engagement, 'engagement'),
    editorial: safeEndpoint(endpoints.editorial, 'editorial'),
    localization: safeEndpoint(endpoints.localization, 'localization'),
    profile: safeEndpoint(endpoints.profile, 'profile'),
  });
}

export async function loadNexusPublicBootstrap(
  config: NexusRuntimeConfig,
  signal?: AbortSignal,
  fetchImplementation: typeof fetch = fetch,
): Promise<NexusRuntimeEndpoints> {
  const controller = new AbortController();
  const timeout = globalThis.setTimeout(
    () => controller.abort(),
    config.requestTimeoutMs,
  );
  const abort = () => controller.abort();
  signal?.addEventListener('abort', abort, { once: true });
  try {
    const url = new URL(
      '/nodics/backoffice/v0/bootstrap/public',
      config.platformBaseUrl,
    );
    const response = await fetchImplementation(url, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        'x-nodics-client-contract-version': String(
          config.clientContractVersion,
        ),
      },
      cache: 'no-store',
      credentials: 'omit',
      redirect: 'error',
      signal: controller.signal,
    });
    if (!response.ok)
      throw new Error(
        `Nexus public bootstrap returned HTTP ${String(response.status)}`,
      );
    return parsePublicBootstrapEndpoints(
      await response.json(),
      config.clientContractVersion,
    );
  } catch (error: unknown) {
    if (controller.signal.aborted)
      throw new Error('Nexus public bootstrap timed out');
    throw error instanceof Error
      ? error
      : new Error('Nexus public bootstrap failed');
  } finally {
    globalThis.clearTimeout(timeout);
    signal?.removeEventListener('abort', abort);
  }
}

export function resolveHostMapping(
  config: NexusRuntimeConfig,
  hostname: string,
): NexusHostMapping {
  const normalized = hostname.trim().toLowerCase();
  const mapping = config.hostMappings.find((entry) =>
    entry.hosts.includes(normalized),
  );
  if (!mapping) throw new Error('This host is not configured for Nodics Nexus');
  return mapping;
}

export async function loadNexusRuntimeConfig(
  signal?: AbortSignal,
  fetchImplementation: typeof fetch = fetch,
): Promise<NexusRuntimeConfig> {
  const response = await fetchImplementation('/nexus-config.json', {
    cache: 'no-store',
    signal,
  });
  if (!response.ok)
    throw new Error('Nexus runtime configuration is unavailable');
  const config = parseNexusRuntimeConfig(await response.json());
  const endpoints = await loadNexusPublicBootstrap(
    config,
    signal,
    fetchImplementation,
  );
  return Object.freeze({ ...config, endpoints });
}
