import { describe, expect, it } from 'vitest';
import { resolveNexusEnv } from '../vite.config';

describe('Nexus Vite configuration', () => {
  it('lets deployment environment values override loaded env files', () => {
    expect(
      resolveNexusEnv(
        {
          NEXUS_BUILD_SOURCEMAP: 'true',
          NEXUS_CORPORATE_SITE: 'localSite',
        },
        {
          NEXUS_BUILD_SOURCEMAP: 'false',
          NEXUS_CORPORATE_HOSTS: 'nodics.in,www.nodics.in',
        },
      ),
    ).toMatchObject({
      NEXUS_BUILD_SOURCEMAP: 'false',
      NEXUS_CORPORATE_SITE: 'localSite',
      NEXUS_CORPORATE_HOSTS: 'nodics.in,www.nodics.in',
    });
  });
});
