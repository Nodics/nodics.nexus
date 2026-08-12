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
  readonly controller: string;
  readonly operation: string;
  readonly tags: readonly string[];
  readonly headers: readonly string[];
  readonly parameters: readonly string[];
  readonly requestBody: string;
  readonly responses: readonly {
    readonly status: string;
    readonly description: string;
    readonly sample: string;
  }[];
  readonly security: readonly string[];
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

function resolveReference(
  root: Readonly<Record<string, unknown>>,
  value: unknown,
): Readonly<Record<string, unknown>> | undefined {
  const source = record(value);
  const ref = text(source?.['$ref']);
  if (!ref.startsWith('#/')) return source;
  const resolved = ref
    .slice(2)
    .split('/')
    .reduce<unknown>((current, segment) => {
      const currentRecord = record(current);
      return currentRecord?.[segment];
    }, root);
  return record(resolved) ?? source;
}

function schemaLabel(schema: unknown): string {
  const item = record(schema);
  if (!item) return 'value';
  const ref = text(item['$ref']);
  if (ref) return ref.split('/').at(-1) ?? 'object';
  const type = text(item.type, 'object');
  const format = text(item.format);
  if (type === 'array') return `array<${schemaLabel(item.items)}>`;
  return format ? `${type}:${format}` : type;
}

function sampleFromSchema(schema: unknown): unknown {
  const item = record(schema);
  if (!item) return 'value';
  if (item.example !== undefined) return item.example;
  const type = text(item.type, item.properties ? 'object' : '');
  if (type === 'array') return [sampleFromSchema(item.items)];
  if (type === 'object' || item.properties) {
    const properties = record(item.properties) ?? {};
    const entries = Object.entries(properties).slice(0, 8);
    return Object.fromEntries(
      entries.map(([name, property]) => [name, sampleFromSchema(property)]),
    );
  }
  if (type === 'integer' || type === 'number') return 0;
  if (type === 'boolean') return true;
  return text(item.description, 'string').slice(0, 80) || 'string';
}

function jsonSample(value: unknown): string {
  return JSON.stringify(value, null, 2);
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
      const parametersByLocation = Array.isArray(operation.parameters)
        ? operation.parameters.reduce<Record<string, string[]>>(
            (grouped, value) => {
              const parameter = resolveReference(root, value);
              const name = text(parameter?.name);
              const location = text(parameter?.in, 'parameter');
              if (!name) return grouped;
              const required =
                parameter?.required === true ? 'required' : 'optional';
              const schema = schemaLabel(parameter?.schema);
              const description = text(parameter?.description);
              const detail = `${name}: ${schema} (${required})${description ? ` — ${description}` : ''}`;
              grouped[location] = [...(grouped[location] ?? []), detail];
              return grouped;
            },
            {},
          )
        : {};
      const requestContent = record(record(operation.requestBody)?.content);
      const jsonRequest = record(requestContent?.['application/json']);
      const requestSchema = jsonRequest?.schema;
      const requestBody = requestSchema
        ? jsonSample(sampleFromSchema(requestSchema))
        : '';
      const responses = Object.entries(record(operation.responses) ?? {}).map(
        ([status, value]) => {
          const response = resolveReference(root, value);
          const content = record(response?.content);
          const jsonResponse = record(content?.['application/json']);
          const schema = jsonResponse?.schema;
          return {
            status,
            description: text(response?.description, 'Response'),
            sample: schema ? jsonSample(sampleFromSchema(schema)) : '',
          };
        },
      );
      const security = Array.isArray(operation.security)
        ? operation.security.flatMap((value) =>
            Object.keys(record(value) ?? {}),
          )
        : [];
      operations.push({
        key: `${method}:${path}`,
        method: method.toUpperCase(),
        path,
        summary: text(operation.summary, 'API operation'),
        description: text(operation.description),
        moduleName: text(nodics?.moduleName, tags[0] ?? 'Other'),
        controller: text(nodics?.controller),
        operation: text(nodics?.operation),
        tags,
        headers: parametersByLocation.header ?? [],
        parameters: [
          ...(parametersByLocation.path ?? []),
          ...(parametersByLocation.query ?? []),
        ],
        requestBody,
        responses,
        security,
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
                        {operation.controller || operation.operation ? (
                          <p>
                            <b>Backend handler:</b>{' '}
                            {[operation.operation, operation.controller]
                              .filter(Boolean)
                              .join(' via ')}
                          </p>
                        ) : null}
                        {operation.security.length > 0 ? (
                          <p>
                            <b>Security:</b> {operation.security.join(', ')}
                          </p>
                        ) : null}
                        {operation.headers.length > 0 ? (
                          <div className="api-contract-block">
                            <b>Sample headers</b>
                            <ul>
                              {operation.headers.map((header) => (
                                <li key={header}>{header}</li>
                              ))}
                            </ul>
                          </div>
                        ) : null}
                        {operation.parameters.length > 0 ? (
                          <div className="api-contract-block">
                            <b>Path / query parameters</b>
                            <ul>
                              {operation.parameters.map((parameter) => (
                                <li key={parameter}>{parameter}</li>
                              ))}
                            </ul>
                          </div>
                        ) : null}
                        {operation.requestBody ? (
                          <div className="api-contract-block">
                            <b>Sample request body</b>
                            <pre>
                              <code>{operation.requestBody}</code>
                            </pre>
                          </div>
                        ) : null}
                        {operation.responses.length > 0 ? (
                          <div className="api-contract-block">
                            <b>Responses</b>
                            {operation.responses.map((response) => (
                              <div
                                className="api-response-sample"
                                key={response.status}
                              >
                                <p>
                                  <code>{response.status}</code> —{' '}
                                  {response.description}
                                </p>
                                {response.sample ? (
                                  <pre>
                                    <code>{response.sample}</code>
                                  </pre>
                                ) : null}
                              </div>
                            ))}
                          </div>
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
