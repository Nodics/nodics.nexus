export interface NexusHostMapping {
  readonly hosts: readonly string[];
  readonly siteCode: string;
  readonly experience: 'corporate' | 'demo';
}

export interface NexusRuntimeConfig {
  readonly cmsBaseUrl: string;
  readonly axisBaseUrl: string;
  readonly platformBaseUrl: string;
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
  const parsedUrl = new URL(requiredString(candidate.cmsBaseUrl, 'cmsBaseUrl'));
  const parsedAxisUrl = new URL(
    requiredString(candidate.axisBaseUrl, 'axisBaseUrl'),
  );
  const parsedPlatformUrl = new URL(
    requiredString(candidate.platformBaseUrl, 'platformBaseUrl'),
  );
  if (!['http:', 'https:'].includes(parsedUrl.protocol))
    throw new Error('Invalid Nexus runtime configuration: cmsBaseUrl protocol');
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
    cmsBaseUrl: parsedUrl.toString().replace(/\/$/u, ''),
    axisBaseUrl: parsedAxisUrl.toString().replace(/\/$/u, ''),
    platformBaseUrl: parsedPlatformUrl.toString().replace(/\/$/u, ''),
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
): Promise<NexusRuntimeConfig> {
  const response = await fetch('/nexus-config.json', {
    cache: 'no-store',
    signal,
  });
  if (!response.ok)
    throw new Error('Nexus runtime configuration is unavailable');
  return parseNexusRuntimeConfig(await response.json());
}
