import { createContext, useContext } from 'react';
import type { NexusHostMapping, NexusRuntimeConfig } from './runtimeConfig';

export interface NexusRuntimeContextValue {
  readonly config: NexusRuntimeConfig;
  readonly mapping: NexusHostMapping;
}

export const NexusRuntimeConfigContext =
  createContext<NexusRuntimeContextValue | null>(null);

export function useOptionalNexusRuntimeConfig(): NexusRuntimeContextValue | null {
  return useContext(NexusRuntimeConfigContext);
}

export function useNexusRuntimeConfig(): NexusRuntimeContextValue {
  const value = useContext(NexusRuntimeConfigContext);
  if (!value) throw new Error('Nexus runtime configuration is unavailable');
  return value;
}
