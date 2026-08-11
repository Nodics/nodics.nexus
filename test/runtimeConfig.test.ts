import { describe, expect, it } from 'vitest';
import {
  loadNexusRuntimeConfig,
  parseNexusRuntimeConfig,
  resolveHostMapping,
} from '../src/runtime/runtimeConfig';

const input = {
  axisBaseUrl: 'http://localhost:3100',
  platformBaseUrl: 'http://localhost:4300',
  enterpriseCode: 'default',
  defaultLocale: 'en',
  channel: 'web',
  clientContractVersion: 1,
  requestTimeoutMs: 5000,
  hostMappings: [
    {
      hosts: ['localhost'],
      siteCode: 'nexusCorporateSite',
      experience: 'corporate',
    },
  ],
};
describe('Nexus runtime configuration', () => {
  it('resolves a trusted host to the corporate Site', () =>
    expect(
      resolveHostMapping(parseNexusRuntimeConfig(input), 'LOCALHOST').siteCode,
    ).toBe('nexusCorporateSite'));
  it('rejects an unknown host', () =>
    expect(() =>
      resolveHostMapping(parseNexusRuntimeConfig(input), 'attacker.example'),
    ).toThrow(/not configured/u));
  it('rejects unsafe Axis protocols', () =>
    expect(() =>
      parseNexusRuntimeConfig({ ...input, axisBaseUrl: 'javascript:alert(1)' }),
    ).toThrow(/axisBaseUrl protocol/u));
  it('rejects unsafe Platform protocols', () =>
    expect(() =>
      parseNexusRuntimeConfig({
        ...input,
        platformBaseUrl: 'file:///tmp/platform',
      }),
    ).toThrow(/platformBaseUrl protocol/u));
  it('loads public module endpoints from Platform bootstrap', async () => {
    const fetchMock = async (inputUrl: RequestInfo | URL) => {
      const url = String(inputUrl);
      if (url === '/nexus-config.json') {
        return new Response(JSON.stringify(input), { status: 200 });
      }
      expect(url).toBe(
        'http://localhost:4300/nodics/backoffice/v0/bootstrap/public',
      );
      return new Response(
        JSON.stringify({
          data: {
            contractVersion: 1,
            clientContractVersion: 1,
            endpoints: {
              cms: 'http://localhost:4310/nodics/cms',
              engagement: 'http://localhost:4340/nodics/engagement',
              editorial: 'http://localhost:4310/nodics/editorial',
              profile: 'http://localhost:4300/nodics/profile',
            },
            uiComposition: {},
          },
        }),
        { status: 200 },
      );
    };
    await expect(
      loadNexusRuntimeConfig(undefined, fetchMock as typeof fetch),
    ).resolves.toMatchObject({
      endpoints: {
        cms: 'http://localhost:4310/nodics/cms',
        engagement: 'http://localhost:4340/nodics/engagement',
        editorial: 'http://localhost:4310/nodics/editorial',
      },
    });
  });
});
