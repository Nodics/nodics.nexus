/** Supported reader route bindings, shared by page delivery and source navigation.
 * These are not publication records: titles and availability come from Online CMS.
 */
export const documentationRoutes = [
  {
    path: '/docs/framework',
    site: 'nodicsDocumentationSite',
    title: 'Nodics Framework',
  },
  {
    path: '/docs/nodics-axis',
    site: 'axisDocumentationSite',
    title: 'Nodics Axis',
  },
  {
    path: '/docs/nodics-kickoff',
    site: 'kickoffDocumentationSite',
    title: 'Nodics Kickoff',
  },
] as const;

export function documentationSourceForPath(path: string) {
  if (path === '/docs') return documentationRoutes[0];
  return documentationRoutes.find(
    (source) => path === source.path || path.startsWith(`${source.path}/`),
  );
}

export function isApiDocumentationPath(path: string) {
  return path === '/docs/api' || path === '/docs/swaggers';
}
