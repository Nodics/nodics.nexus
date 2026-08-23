export const referenceImageSource = (code: string): string | undefined => {
  const value = code.trim();
  if (!value) return undefined;
  if (/^(https?:)?\/\//u.test(value)) return value;
  return undefined;
};

export const mediaImageSource = (
  code: string,
  cmsBaseUrl?: string,
): string | undefined => {
  const value = code.trim();
  if (!value) return undefined;
  if (/^(https?:)?\/\//u.test(value)) return value;
  if (value.startsWith('/nodics/media/')) {
    return cmsBaseUrl ? new URL(value, cmsBaseUrl).toString() : value;
  }
  if (value.startsWith('/')) return undefined;
  if (!cmsBaseUrl) return undefined;
  return new URL(
    `/nodics/media/v0/content/${encodeURIComponent(value)}`,
    cmsBaseUrl,
  ).toString();
};
