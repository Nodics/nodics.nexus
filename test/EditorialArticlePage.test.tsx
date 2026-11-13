import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { CmsPage } from '../src/app/CmsPage';
import { EditorialArticlePage } from '../src/editorial/EditorialArticlePage';
import { editorialDetailRoute } from '../src/editorial/editorialRoutes';
import type {
  NexusRuntimeConfig,
  NexusHostMapping,
} from '../src/runtime/runtimeConfig';

const config: NexusRuntimeConfig = {
  axisBaseUrl: 'http://localhost:3100',
  platformBaseUrl: 'http://localhost:4300',
  endpoints: {
    cms: 'http://localhost:4314/nodics/cms',
    editorial: 'http://localhost:4314/nodics/editorial',
  },
  enterpriseCode: 'default',
  defaultLocale: 'en',
  channel: 'web',
  clientContractVersion: 1,
  requestTimeoutMs: 5000,
  hostMappings: [],
};
const mapping: NexusHostMapping = {
  hosts: ['localhost'],
  siteCode: 'hostSite',
  experience: 'corporate',
};
const route = editorialDetailRoute('/blog/new-story')!;
const article = {
  articleCode: 'new-article',
  siteCode: 'hostSite',
  localeCode: 'en',
  slug: 'new-story',
  contentTypeCode: 'BLOG',
  title: 'The published story',
  summary: 'Saved summary',
  body: { blocks: [{ type: 'paragraph', text: 'The exact saved body.' }] },
  takeaways: ['Keep the current content.'],
};
const response = (value: unknown, status = 200) =>
  new Response(JSON.stringify({ data: value }), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
afterEach(() => vi.restoreAllMocks());

describe('Public Editorial route handoff', () => {
  it('opens a new published article after CMS route absence, with the host Site and no credentials', async () => {
    const fetcher = vi
      .spyOn(globalThis, 'fetch')
      .mockImplementation((input) =>
        Promise.resolve(
          String(input).includes('/nodics/editorial/')
            ? response(article)
            : response({}, 404),
        ),
      );
    render(
      <CmsPage config={config} mapping={mapping} path="/blog/new-story" />,
    );
    expect(
      await screen.findByRole('heading', { name: article.title }),
    ).toBeVisible();
    expect(screen.getByText('The exact saved body.')).toBeVisible();
    expect(
      screen
        .getByRole('heading', { name: article.title })
        .compareDocumentPosition(screen.getByRole('complementary')) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Back to blogs' })).toHaveAttribute(
      'href',
      '/blogs',
    );
    const calls = fetcher.mock.calls.filter(([input]) =>
      String(input).includes('/nodics/editorial/'),
    );
    expect(calls).toHaveLength(1);
    const url = new URL(String(calls[0]![0]));
    expect(url.pathname).toBe(
      '/nodics/editorial/v0/delivery/articles/new-story',
    );
    expect(url.searchParams.get('siteCode')).toBe('hostSite');
    expect(url.searchParams.get('localeCode')).toBe('en');
    expect(calls[0]![1]?.credentials).toBe('omit');
    expect(calls[0]![1]?.method).toBe('GET');
    expect(calls[0]![1]?.headers).not.toHaveProperty('Authorization');
  });

  it('keeps the localized article and listing link usable after a featured image fails', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      response({
        ...article,
        localeCode: 'ar',
        title: 'مقال منشور',
        referenceImageCode: 'fixture-image',
        imageAlt: 'وصف الصورة',
      }),
    );
    render(
      <EditorialArticlePage
        config={{ ...config, defaultLocale: 'ar' }}
        mapping={mapping}
        route={route}
      />,
    );
    const heading = await screen.findByRole('heading', { name: 'مقال منشور' });
    expect(heading.closest('article')).toHaveAttribute('dir', 'rtl');
    fireEvent.error(screen.getByRole('img', { name: 'وصف الصورة' }));
    expect(screen.getByRole('status')).toHaveTextContent(
      'الصورة المميزة غير متاحة.',
    );
    expect(screen.getByText('وصف الصورة')).toBeVisible();
    expect(heading).toBeVisible();
    expect(
      screen.getByRole('link', { name: 'العودة إلى المدونة' }),
    ).toHaveAttribute('href', '/blogs?lang=ar');
  });

  it('announces a withdrawn article in the selected language', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(response({}, 404));
    render(
      <EditorialArticlePage
        config={{ ...config, defaultLocale: 'ar' }}
        mapping={mapping}
        route={route}
      />,
    );
    const alert = await screen.findByRole('alert');
    expect(alert).toHaveAttribute('lang', 'ar');
    expect(alert).toHaveAttribute('dir', 'rtl');
    expect(
      screen.getByRole('heading', { name: 'هذا المقال غير متاح.' }),
    ).toBeVisible();
    expect(
      screen.getByRole('link', { name: 'العودة إلى المدونة' }),
    ).toHaveAttribute('href', '/blogs?lang=ar');
  });

  it('loads the scoped public News listing when the CMS has no localized listing', async () => {
    const fetcher = vi.spyOn(globalThis, 'fetch').mockImplementation((input) =>
      Promise.resolve(
        String(input).includes('/nodics/editorial/')
          ? response({
              items: [
                {
                  ...article,
                  contentTypeCode: 'NEWS',
                  localeCode: 'ar',
                  title: 'الأخبار المنشورة',
                },
                {
                  ...article,
                  contentTypeCode: 'NEWS',
                  localeCode: 'ar',
                  siteCode: 'foreign',
                  title: 'Foreign listing',
                },
                {
                  ...article,
                  contentTypeCode: 'NEWS',
                  title: 'Wrong language',
                },
              ],
            })
          : response({}, 404),
      ),
    );
    render(
      <CmsPage
        config={{ ...config, defaultLocale: 'ar' }}
        mapping={mapping}
        path="/news"
      />,
    );
    expect(
      await screen.findByRole('link', { name: 'الأخبار المنشورة' }),
    ).toHaveAttribute('href', '/news/new-story?lang=ar');
    expect(screen.queryByText('Foreign listing')).toBeNull();
    expect(screen.queryByText('Wrong language')).toBeNull();
    const listing = fetcher.mock.calls.find(([input]) =>
      String(input).includes('/delivery/types/NEWS/articles'),
    );
    expect(listing?.[1]?.credentials).toBe('omit');
  });

  it('does not reuse an earlier CMS absence while a changed route is still being checked', async () => {
    let finish!: (value: Response) => void;
    const fetcher = vi
      .spyOn(globalThis, 'fetch')
      .mockImplementation((input) => {
        const url = new URL(String(input));
        if (url.pathname.includes('/nodics/editorial/'))
          return Promise.resolve(response(article));
        if (url.searchParams.get('path') === '/blog/second-story')
          return new Promise((resolve) => {
            finish = resolve;
          });
        return Promise.resolve(response({}, 404));
      });
    const { rerender } = render(
      <CmsPage config={config} mapping={mapping} path="/blog/new-story" />,
    );
    await screen.findByRole('heading', { name: article.title });
    rerender(
      <CmsPage config={config} mapping={mapping} path="/blog/second-story" />,
    );
    expect(screen.queryByText(article.title)).toBeNull();
    expect(
      screen.getByRole('heading', { name: 'Opening Nexus.' }),
    ).toBeVisible();
    await waitFor(() => expect(finish).toBeDefined());
    await act(async () => finish(response({}, 403)));
    await screen.findByRole('alert');
    const articleCalls = fetcher.mock.calls.filter(([input]) =>
      String(input).includes('/nodics/editorial/'),
    );
    expect(articleCalls).toHaveLength(1);
    expect(String(articleCalls[0]![0])).toContain('/new-story?');
  });

  it.each([403, 503])(
    'does not hand off a CMS HTTP %s to another owner',
    async (status) => {
      const fetcher = vi
        .spyOn(globalThis, 'fetch')
        .mockResolvedValue(response({}, status));
      render(
        <CmsPage config={config} mapping={mapping} path="/blog/new-story" />,
      );
      await screen.findByRole('alert');
      expect(fetcher).toHaveBeenCalledTimes(1);
      expect(screen.queryByText(article.title)).toBeNull();
    },
  );

  it.each(['siteCode', 'localeCode', 'slug', 'contentTypeCode'])(
    'rejects a mismatched published %s without showing its content',
    async (field) => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValue(
        response({ ...article, [field]: 'other' }),
      );
      render(
        <EditorialArticlePage
          config={config}
          mapping={mapping}
          route={route}
        />,
      );
      expect(
        await screen.findByRole('heading', {
          name: 'This article cannot be opened.',
        }),
      ).toBeVisible();
      expect(screen.queryByText(article.title)).toBeNull();
    },
  );

  it('distinguishes a withdrawn article from an unavailable service and retries only explicitly', async () => {
    const fetcher = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(response({}, 503))
      .mockResolvedValueOnce(response({}, 404));
    render(
      <EditorialArticlePage config={config} mapping={mapping} route={route} />,
    );
    expect(
      await screen.findByRole('heading', {
        name: 'Articles are temporarily unavailable.',
      }),
    ).toBeVisible();
    expect(fetcher).toHaveBeenCalledTimes(1);
    await userEvent.click(screen.getByRole('button', { name: 'Try again' }));
    expect(
      await screen.findByRole('heading', {
        name: 'This article is not available.',
      }),
    ).toBeVisible();
    expect(fetcher).toHaveBeenCalledTimes(2);
    expect(screen.queryByRole('button', { name: 'Try again' })).toBeNull();
  });

  it('retires a previous host read while the new scope is loading', async () => {
    let finish!: (value: Response) => void;
    const fetcher = vi
      .spyOn(globalThis, 'fetch')
      .mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            finish = resolve;
          }),
      )
      .mockResolvedValueOnce(response({}, 404));
    const { rerender } = render(
      <EditorialArticlePage config={config} mapping={mapping} route={route} />,
    );
    await waitFor(() => expect(fetcher).toHaveBeenCalledTimes(1));
    rerender(
      <EditorialArticlePage
        config={config}
        mapping={{ ...mapping, siteCode: 'secondSite' }}
        route={route}
      />,
    );
    await screen.findByRole('heading', {
      name: 'This article is not available.',
    });
    await act(async () => finish(response(article)));
    expect(screen.queryByText(article.title)).toBeNull();
    expect(fetcher.mock.calls[0]![1]?.signal?.aborted).toBe(true);
  });

  it('accepts only the existing single-segment Blog and News detail paths', () => {
    expect(editorialDetailRoute('/news/new-story')?.contentTypeCode).toBe(
      'NEWS',
    );
    for (const path of [
      '/other/new-story',
      '/blog/a/b',
      '/blog/%2fprivate',
      '/blog/%252fprivate',
      '/blog/..',
      '/blog/%00',
      '/blog/%ZZ',
    ])
      expect(editorialDetailRoute(path)).toBeUndefined();
  });
});
