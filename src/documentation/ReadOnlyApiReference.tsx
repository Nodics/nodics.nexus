import { useEffect, useMemo, useState } from 'react';

import type { NexusRuntimeConfig } from '../runtime/runtimeConfig';

const methods = ['get', 'post', 'put', 'patch', 'delete'] as const;

interface ApiOperation {
  readonly key: string;
  readonly method: string;
  readonly path: string;
  readonly summary: string;
  readonly description: string;
  readonly moduleName: string;
  readonly tags: readonly string[];
  readonly parameters: readonly string[];
  readonly responses: readonly string[];
}

type ApiState =
  | { readonly status: 'loading' }
  | {
      readonly status: 'ready';
      readonly title: string;
      readonly version: string;
      readonly operations: readonly ApiOperation[];
    }
  | { readonly status: 'failed'; readonly message: string };

function record(value: unknown): Readonly<Record<string, unknown>> | undefined {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? (value as Readonly<Record<string, unknown>>)
    : undefined;
}

function text(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value.trim().slice(0, 2_000) : fallback;
}

function parseOperations(document: unknown): {
  readonly title: string;
  readonly version: string;
  readonly operations: readonly ApiOperation[];
} {
  const root = record(document);
  const info = record(root?.info);
  const paths = record(root?.paths);
  if (!root || !paths || !text(root.openapi))
    throw new Error('The Platform returned an incompatible OpenAPI contract.');
  const operations: ApiOperation[] = [];
  for (const [path, pathValue] of Object.entries(paths)) {
    const pathItem = record(pathValue);
    if (!pathItem) continue;
    for (const method of methods) {
      const operation = record(pathItem[method]);
      if (!operation) continue;
      const nodics = record(operation['x-nodics']);
      const tags = Array.isArray(operation.tags)
        ? operation.tags
            .map((value) => text(value))
            .filter(Boolean)
            .slice(0, 20)
        : [];
      const parameters = Array.isArray(operation.parameters)
        ? operation.parameters.flatMap((value) => {
            const parameter = record(value);
            const name = text(parameter?.name);
            const location = text(parameter?.in);
            return name && location ? [`${name} (${location})`] : [];
          })
        : [];
      const responses = Object.entries(record(operation.responses) ?? {}).map(
        ([status, value]) =>
          `${status} — ${text(record(value)?.description, 'Response')}`,
      );
      operations.push({
        key: `${method}:${path}`,
        method: method.toUpperCase(),
        path,
        summary: text(operation.summary, 'API operation'),
        description: text(operation.description),
        moduleName: text(nodics?.moduleName, tags[0] ?? 'Other'),
        tags,
        parameters,
        responses,
      });
    }
  }
  return {
    title: text(info?.title, 'Nodics API Reference'),
    version: text(info?.version, 'Current'),
    operations,
  };
}

export function ReadOnlyApiReference({
  config,
}: {
  readonly config: NexusRuntimeConfig;
}) {
  const [state, setState] = useState<ApiState>({ status: 'loading' });
  const [query, setQuery] = useState('');
  const openApiUrl = new URL(
    '/nodics/system/v0/contract/openapi',
    config.platformBaseUrl,
  ).toString();

  useEffect(() => {
    const controller = new AbortController();
    void fetch(openApiUrl, {
      cache: 'no-store',
      credentials: 'omit',
      headers: {
        Accept: 'application/json',
        'x-enterprise-code': config.enterpriseCode,
      },
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok)
          throw new Error(
            `OpenAPI service returned HTTP ${String(response.status)}.`,
          );
        const reference = parseOperations(await response.json());
        setState({ status: 'ready', ...reference });
      })
      .catch((error: unknown) => {
        if (!controller.signal.aborted)
          setState({
            status: 'failed',
            message:
              error instanceof Error
                ? error.message
                : 'The API reference is unavailable.',
          });
      });
    return () => controller.abort();
  }, [config.enterpriseCode, openApiUrl]);

  const filteredOperations = useMemo(() => {
    if (state.status !== 'ready') return [];
    const normalized = query.trim().toLocaleLowerCase();
    if (!normalized) return state.operations;
    return state.operations.filter((operation) =>
      [
        operation.method,
        operation.path,
        operation.summary,
        operation.description,
        ...operation.tags,
      ]
        .join(' ')
        .toLocaleLowerCase()
        .includes(normalized),
    );
  }, [query, state]);
  const operationGroups = useMemo(() => {
    const grouped = new Map<string, ApiOperation[]>();
    for (const operation of filteredOperations) {
      const entries = grouped.get(operation.moduleName) ?? [];
      entries.push(operation);
      grouped.set(operation.moduleName, entries);
    }
    return [...grouped.entries()].sort(([left], [right]) =>
      left.localeCompare(right),
    );
  }, [filteredOperations]);

  return (
    <section className="api-reference" aria-label="Read-only API reference">
      <div className="api-reference-heading">
        <div>
          <p className="eyebrow">Live backend contract</p>
          <h2>
            {state.status === 'ready' ? state.title : 'Nodics API Reference'}
          </h2>
        </div>
        <span>View only</span>
      </div>
      <p className="api-reference-note">
        Explore the public OpenAPI contract, operations, parameters, and
        responses. Authorization and request execution are unavailable to public
        visitors.
      </p>
      {state.status === 'loading' ? (
        <div className="api-reference-state">
          Loading the live API contract…
        </div>
      ) : null}
      {state.status === 'failed' ? (
        <div className="api-reference-state" role="alert">
          <strong>API reference unavailable</strong>
          <p>{state.message}</p>
        </div>
      ) : null}
      {state.status === 'ready' ? (
        <>
          <div className="api-reference-tools">
            <label>
              <span>Search API reference</span>
              <input
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search operation, path, method, or module"
                type="search"
                value={query}
              />
            </label>
            <div>
              <strong>{filteredOperations.length}</strong> operations
              <span>OpenAPI {state.version}</span>
            </div>
          </div>
          <div className="api-operation-list">
            {operationGroups.map(([moduleName, operations]) => (
              <details className="api-module-group" key={moduleName}>
                <summary>
                  <strong>{moduleName}</strong>
                  <span>{operations.length} APIs</span>
                </summary>
                <div className="api-module-operations">
                  {operations.map((operation) => (
                    <details className="api-operation" key={operation.key}>
                      <summary>
                        <span
                          className={`api-method api-method-${operation.method.toLowerCase()}`}
                        >
                          {operation.method}
                        </span>
                        <code>{operation.path}</code>
                        <strong>{operation.summary}</strong>
                      </summary>
                      <div className="api-operation-detail">
                        {operation.description ? (
                          <p>{operation.description}</p>
                        ) : null}
                        {operation.tags.length > 0 ? (
                          <p>
                            <b>Tags:</b> {operation.tags.join(', ')}
                          </p>
                        ) : null}
                        {operation.parameters.length > 0 ? (
                          <p>
                            <b>Parameters:</b> {operation.parameters.join(', ')}
                          </p>
                        ) : null}
                        {operation.responses.length > 0 ? (
                          <ul>
                            {operation.responses.map((response) => (
                              <li key={response}>{response}</li>
                            ))}
                          </ul>
                        ) : null}
                      </div>
                    </details>
                  ))}
                </div>
              </details>
            ))}
          </div>
        </>
      ) : null}
    </section>
  );
}
