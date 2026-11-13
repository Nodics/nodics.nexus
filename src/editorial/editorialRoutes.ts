/** Public route presentation paired with the existing Editorial listing links. */
export function editorialDetailRoute(path: string) {
  const match = /^\/(blog|news)\/([^/]+)$/u.exec(path);
  if (!match) return undefined;
  let slug: string;
  try {
    slug = decodeURIComponent(match[2]!);
  } catch {
    return undefined;
  }
  if (
    !slug ||
    slug.length > 256 ||
    /[\s/\\?#%]/u.test(slug) ||
    [...slug].some(
      (character) =>
        character.charCodeAt(0) < 32 || character.charCodeAt(0) === 127,
    ) ||
    ['.', '..'].includes(slug)
  )
    return undefined;
  return {
    slug,
    contentTypeCode: match[1] === 'blog' ? 'BLOG' : 'NEWS',
    listingPath: match[1] === 'blog' ? '/blogs' : '/news',
  } as const;
}
