import { describe, expect, it } from 'vitest';
import {
  parseNexusRuntimeConfig,
  resolveHostMapping,
} from '../src/runtime/runtimeConfig';

const input = {
  cmsBaseUrl: 'http://localhost:4310',
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
  it('rejects unsafe CMS protocols', () =>
    expect(() =>
      parseNexusRuntimeConfig({ ...input, cmsBaseUrl: 'file:///tmp/cms' }),
    ).toThrow(/protocol/u));
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
});
