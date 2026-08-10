export type Properties = Readonly<Record<string, unknown>>;
export const text = (properties: Properties, key: string, fallback = '') =>
  typeof properties[key] === 'string' ? String(properties[key]) : fallback;
export const items = <T extends Record<string, unknown>>(
  properties: Properties,
  key: string,
): readonly T[] =>
  Array.isArray(properties[key])
    ? (properties[key] as T[]).filter(
        (item) => item && typeof item === 'object' && !Array.isArray(item),
      )
    : [];
export const strings = (
  properties: Properties,
  key: string,
): readonly string[] =>
  Array.isArray(properties[key])
    ? (properties[key] as unknown[]).filter(
        (item): item is string => typeof item === 'string',
      )
    : [];
export const safeHref = (value: string): string | undefined => {
  if (
    value.startsWith('/') ||
    value.startsWith('#') ||
    value.startsWith('mailto:')
  )
    return value;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' ? url.toString() : undefined;
  } catch {
    return undefined;
  }
};
