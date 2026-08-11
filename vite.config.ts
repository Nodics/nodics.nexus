/// <reference types="vitest/config" />

import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv, type Plugin } from 'vite';
import {
  parseNexusRuntimeConfig,
  type NexusRuntimeConfig,
} from './src/runtime/runtimeConfig';

const path = '/nexus-config.json';
const required = (env: Record<string, string>, name: string) => {
  const value = env[name]?.trim();
  if (!value) throw new Error(`${name} must be configured`);
  return value;
};
const positive = (env: Record<string, string>, name: string) => {
  const value = Number(required(env, name));
  if (!Number.isInteger(value) || value < 1)
    throw new Error(`${name} must be a positive integer`);
  return value;
};
const bool = (env: Record<string, string>, name: string) => {
  const value = required(env, name).toLowerCase();
  if (!['true', 'false'].includes(value))
    throw new Error(`${name} must be true or false`);
  return value === 'true';
};
export function buildRuntimeConfig(
  env: Record<string, string>,
): NexusRuntimeConfig {
  return parseNexusRuntimeConfig({
    axisBaseUrl: required(env, 'NEXUS_AXIS_BASE_URL'),
    platformBaseUrl: required(env, 'NEXUS_PLATFORM_BASE_URL'),
    enterpriseCode: required(env, 'NEXUS_ENTERPRISE_CODE'),
    defaultLocale: required(env, 'NEXUS_DEFAULT_LOCALE'),
    channel: required(env, 'NEXUS_CHANNEL'),
    clientContractVersion: positive(env, 'NEXUS_CLIENT_CONTRACT_VERSION'),
    requestTimeoutMs: positive(env, 'NEXUS_REQUEST_TIMEOUT_MS'),
    hostMappings: [
      {
        hosts: required(env, 'NEXUS_CORPORATE_HOSTS')
          .split(',')
          .map((host) => host.trim()),
        siteCode: required(env, 'NEXUS_CORPORATE_SITE'),
        experience: 'corporate',
      },
    ],
  });
}
function runtimePlugin(config: NexusRuntimeConfig): Plugin {
  const { endpoints, ...publicConfig } = config;
  void endpoints;
  const source = `${JSON.stringify(publicConfig, null, 2)}\n`;
  return {
    name: 'nexus-runtime-config',
    configureServer(server) {
      server.middlewares.use(path, (_request, response) => {
        response.statusCode = 200;
        response.setHeader('Cache-Control', 'no-store');
        response.setHeader('Content-Type', 'application/json; charset=utf-8');
        response.end(source);
      });
    },
    generateBundle() {
      this.emitFile({ type: 'asset', fileName: path.slice(1), source });
    },
  };
}
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const config = buildRuntimeConfig(env);
  const host = required(env, 'NEXUS_DEV_HOST');
  const port = positive(env, 'NEXUS_DEV_PORT');
  const strictPort = bool(env, 'NEXUS_STRICT_PORT');
  return {
    plugins: [react(), runtimePlugin(config)],
    server: { host, port, strictPort },
    preview: { host, port, strictPort },
    build: { sourcemap: bool(env, 'NEXUS_BUILD_SOURCEMAP') },
    test: {
      environment: 'jsdom',
      fileParallelism: false,
      setupFiles: ['./test/setup.ts'],
      restoreMocks: true,
    },
  };
});
