export interface CmsComponentContract {
  readonly code: string;
  readonly typeCode: string;
  readonly active: boolean;
  readonly renderer: string;
  readonly rendererContractVersion: number;
  readonly rendererChannels: readonly string[];
  readonly rendererDeprecated: boolean;
  readonly properties: Readonly<Record<string, unknown>>;
  readonly slot: string;
  readonly index: number;
  readonly components: readonly CmsComponentContract[];
}

export interface CmsResolvedPageContract {
  readonly contractVersion: number;
  readonly site: string;
  readonly path: string;
  readonly locale: string;
  readonly channel: string;
  readonly page: {
    readonly code: string;
    readonly name?: string;
    readonly renderer: string;
    readonly rendererContractVersion: number;
    readonly rendererChannels: readonly string[];
    readonly rendererDeprecated: boolean;
    readonly templateContract: {
      readonly code: string;
      readonly renderer: string;
      readonly contractVersion: number;
    };
    readonly components: readonly CmsComponentContract[];
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
function string(value: unknown, field: string): string {
  if (typeof value !== 'string' || !value.trim())
    throw new Error(`CMS response field ${field} must be a string`);
  return value;
}
function integer(value: unknown, field: string, positive = true): number {
  if (!Number.isInteger(value) || Number(value) < (positive ? 1 : 0))
    throw new Error(`CMS response field ${field} must be an integer`);
  return Number(value);
}
function boolean(value: unknown, field: string): boolean {
  if (typeof value !== 'boolean')
    throw new Error(`CMS response field ${field} must be a boolean`);
  return value;
}
function strings(value: unknown, field: string): readonly string[] {
  if (!Array.isArray(value) || value.length < 1)
    throw new Error(`CMS response field ${field} must be a non-empty array`);
  return Object.freeze(
    value.map((item, index) => string(item, `${field}.${index}`)),
  );
}
function components(
  value: unknown,
  depth = 0,
  budget = { count: 0 },
): readonly CmsComponentContract[] {
  if (!Array.isArray(value))
    throw new Error('CMS response components must be an array');
  if (depth > 10)
    throw new Error('CMS component graph exceeds the Nexus depth limit');
  return Object.freeze(
    value.map((item, index) => {
      budget.count += 1;
      if (budget.count > 200)
        throw new Error('CMS component graph exceeds the Nexus size limit');
      if (!isRecord(item) || !isRecord(item.properties))
        throw new Error(`CMS component ${index} is invalid`);
      return Object.freeze({
        code: string(item.code, `components.${index}.code`),
        typeCode: string(item.typeCode, `components.${index}.typeCode`),
        active: typeof item.active === 'boolean' ? item.active : true,
        renderer: string(item.renderer, `components.${index}.renderer`),
        rendererContractVersion: integer(
          item.rendererContractVersion,
          `components.${index}.rendererContractVersion`,
        ),
        rendererChannels: strings(
          item.rendererChannels,
          `components.${index}.rendererChannels`,
        ),
        rendererDeprecated: boolean(
          item.rendererDeprecated,
          `components.${index}.rendererDeprecated`,
        ),
        properties: Object.freeze({ ...item.properties }),
        slot: string(item.slot, `components.${index}.slot`),
        index: integer(item.index, `components.${index}.index`, false),
        components: components(item.components, depth + 1, budget),
      });
    }),
  );
}

export function parseCmsResolvedPage(value: unknown): CmsResolvedPageContract {
  if (!isRecord(value) || value.contractVersion !== 1 || !isRecord(value.page))
    throw new Error('CMS returned an incompatible page contract');
  const page = value.page;
  if (!isRecord(page.templateContract))
    throw new Error('CMS response template contract is invalid');
  return Object.freeze({
    contractVersion: 1,
    site: string(value.site, 'site'),
    path: string(value.path, 'path'),
    locale: string(value.locale, 'locale'),
    channel: string(value.channel, 'channel'),
    page: Object.freeze({
      code: string(page.code, 'page.code'),
      ...(typeof page.name === 'string' ? { name: page.name } : {}),
      renderer: string(page.renderer, 'page.renderer'),
      rendererContractVersion: integer(
        page.rendererContractVersion,
        'page.rendererContractVersion',
      ),
      rendererChannels: strings(page.rendererChannels, 'page.rendererChannels'),
      rendererDeprecated: boolean(
        page.rendererDeprecated,
        'page.rendererDeprecated',
      ),
      templateContract: Object.freeze({
        code: string(page.templateContract.code, 'template.code'),
        renderer: string(page.templateContract.renderer, 'template.renderer'),
        contractVersion: integer(
          page.templateContract.contractVersion,
          'template.contractVersion',
        ),
      }),
      components: components(page.components),
    }),
  });
}
