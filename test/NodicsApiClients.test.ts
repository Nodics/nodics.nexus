import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  getContactForm,
  listTestimonials,
  submitContact,
} from '../src/api/engagementApi';
import { listEditorialArticles } from '../src/api/editorialApi';

const ok = (data: unknown) =>
  Promise.resolve(
    new Response(JSON.stringify({ data }), {
      headers: { 'content-type': 'application/json' },
      status: 200,
    }),
  );

const baseInput = {
  baseUrl: 'http://localhost:4340/nodics/engagement',
  enterpriseCode: 'default',
  timeoutMs: 5000,
};

describe('Nodics Nexus API clients', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('reads public testimonials through the Engagement API contract', async () => {
    const fetchMock = vi.fn(() =>
      ok([
        {
          attribution: {
            avatarAlt: 'Illustrative portrait of Ada',
            avatarReferenceImageCode: 'nexusTestimonialAarohi',
            name: 'Ada',
            organization: 'Nodics Labs',
            role: 'Architect',
          },
          publicText: 'Backend governed testimonial.',
        },
      ]),
    );
    vi.stubGlobal('fetch', fetchMock);

    await expect(
      listTestimonials({
        ...baseInput,
        channel: 'web',
        locale: 'en',
        region: 'global',
      }),
    ).resolves.toEqual([
      {
        avatarAlt: 'Illustrative portrait of Ada',
        avatarReferenceImageCode: 'nexusTestimonialAarohi',
        name: 'Ada',
        quote: 'Backend governed testimonial.',
        role: 'Architect',
      },
    ]);
    const [url, request] = fetchMock.mock.calls[0] as unknown as [
      URL,
      RequestInit,
    ];
    expect(String(url)).toBe(
      'http://localhost:4340/nodics/engagement/v0/public/testimonials?locale=en&channel=web&region=global&limit=8',
    );
    expect(
      (request.headers as Record<string, string>)['x-enterprise-code'],
    ).toBe('default');
    expect(
      (request.headers as Record<string, string>)['x-correlation-id'],
    ).toMatch(/^nexus-/u);
  });

  it('reads contact form fields and submits enquiries to Engagement', async () => {
    const fetchMock = vi
      .fn()
      .mockImplementationOnce(() =>
        ok({
          code: 'nexus-contact',
          structure: {
            sections: [
              {
                fields: [
                  {
                    inputType: 'email',
                    label: 'Email',
                    name: 'contactEmail',
                    required: true,
                  },
                  {
                    inputType: 'textarea',
                    label: 'Message',
                    name: 'message',
                    required: true,
                  },
                ],
              },
            ],
          },
          version: 3,
        }),
      )
      .mockImplementationOnce(() =>
        ok({ referenceCode: 'CS-1001', verificationRequired: false }),
      );
    vi.stubGlobal('fetch', fetchMock);

    await expect(
      getContactForm({ ...baseInput, definitionCode: 'nexus-contact' }),
    ).resolves.toEqual({
      code: 'nexus-contact',
      fields: [
        {
          label: 'Email',
          multiline: false,
          name: 'contactEmail',
          required: true,
          type: 'email',
        },
        {
          label: 'Message',
          multiline: true,
          name: 'message',
          required: true,
          type: 'text',
        },
      ],
      version: 3,
    });

    await expect(
      submitContact({
        ...baseInput,
        idempotencyKey: 'contact-key-1',
        payload: {
          contactEmail: 'ada@example.com',
          message: 'Let us talk.',
          preferredChannel: 'EMAIL',
          subject: 'Nexus enquiry',
          type: 'ENQUIRY',
        },
      }),
    ).resolves.toEqual({
      referenceCode: 'CS-1001',
      verificationRequired: false,
    });
    const [, request] = fetchMock.mock.calls[1] as unknown as [
      URL,
      RequestInit,
    ];
    expect(request.method).toBe('POST');
    expect((request.headers as Record<string, string>)['idempotency-key']).toBe(
      'contact-key-1',
    );
    expect(JSON.parse(String(request.body))).toMatchObject({
      contactEmail: 'ada@example.com',
      message: 'Let us talk.',
      subject: 'Nexus enquiry',
    });
  });

  it('reads editorial delivery articles from WCMS by content type', async () => {
    const fetchMock = vi.fn(() =>
      ok({
        items: [
          {
            body: { blocks: [{ text: 'Full news text.' }] },
            contentTypeCode: 'NEWS',
            slug: 'platform-news',
            summary: 'News summary',
            title: 'Platform news',
          },
        ],
      }),
    );
    vi.stubGlobal('fetch', fetchMock);

    await expect(
      listEditorialArticles({
        baseUrl: 'http://localhost:4310/nodics/editorial',
        channel: 'web',
        contentTypeCode: 'NEWS',
        enterpriseCode: 'default',
        limit: 6,
        localeCode: 'en',
        siteCode: 'nexusCorporateSite',
        timeoutMs: 5000,
      }),
    ).resolves.toEqual([
      {
        body: 'Full news text.',
        contentTypeCode: 'NEWS',
        href: '/articles/platform-news',
        slug: 'platform-news',
        summary: 'News summary',
        title: 'Platform news',
      },
    ]);
    const [url] = fetchMock.mock.calls[0] as unknown as [URL, RequestInit];
    expect(String(url)).toBe(
      'http://localhost:4310/nodics/editorial/v0/delivery/types/NEWS/articles?siteCode=nexusCorporateSite&localeCode=en&channel=web&limit=6',
    );
  });
});
