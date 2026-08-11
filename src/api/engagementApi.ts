import { requestNodicsJson, type NodicsClientInput } from './nodicsClient';

export interface NexusTestimonial {
  readonly quote: string;
  readonly name: string;
  readonly role: string;
}

export interface NexusContactFormField {
  readonly name: string;
  readonly label: string;
  readonly type: string;
  readonly multiline?: boolean;
  readonly required?: boolean;
}

export interface NexusContactFormDefinition {
  readonly code?: string;
  readonly version?: number;
  readonly fields: readonly NexusContactFormField[];
}

export interface NexusContactSubmission {
  readonly referenceCode: string;
  readonly duplicate?: boolean;
  readonly verificationRequired?: boolean;
}

function text(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback;
}

function testimonial(value: unknown): NexusTestimonial | undefined {
  if (!value || typeof value !== 'object' || Array.isArray(value))
    return undefined;
  const input = value as Record<string, unknown>;
  const attribution =
    input.attribution && typeof input.attribution === 'object'
      ? (input.attribution as Record<string, unknown>)
      : {};
  const quote = text(input.publicText);
  if (!quote) return undefined;
  return {
    name: text(attribution.name, 'Nodics customer'),
    quote,
    role: text(
      attribution.role,
      text(attribution.organization, 'Verified voice'),
    ),
  };
}

function fieldsFromStructure(
  structure: unknown,
): readonly NexusContactFormField[] {
  if (!structure || typeof structure !== 'object' || Array.isArray(structure))
    return [];
  const record = structure as Record<string, unknown>;
  const direct = Array.isArray(record.fields) ? record.fields : undefined;
  const sectionFields = Array.isArray(record.sections)
    ? record.sections.flatMap((section) => {
        if (!section || typeof section !== 'object' || Array.isArray(section))
          return [];
        const rawFields = (section as Record<string, unknown>).fields;
        return Array.isArray(rawFields) ? rawFields : [];
      })
    : undefined;
  return (direct || sectionFields || [])
    .filter(
      (field) => field && typeof field === 'object' && !Array.isArray(field),
    )
    .map((field, index) => {
      const item = field as Record<string, unknown>;
      const name = text(item.name || item.code, `field-${index}`);
      const type = text(item.type || item.inputType, 'text').toLowerCase();
      return {
        label: text(item.label, name),
        multiline: type === 'textarea' || type === 'message',
        name,
        required: item.required === true,
        type: type === 'email' || type === 'tel' ? type : 'text',
      };
    });
}

export async function listTestimonials(
  input: NodicsClientInput & {
    readonly locale: string;
    readonly channel: string;
    readonly region?: string;
    readonly limit?: number;
  },
): Promise<readonly NexusTestimonial[]> {
  const path = new URL('v0/public/testimonials', `${input.baseUrl}/`);
  path.searchParams.set('locale', input.locale);
  path.searchParams.set('channel', input.channel);
  path.searchParams.set('region', input.region || 'global');
  path.searchParams.set('limit', String(input.limit || 8));
  const response = await requestNodicsJson<readonly unknown[]>({
    ...input,
    path: path.pathname + path.search,
  });
  return response
    .map(testimonial)
    .filter((item): item is NexusTestimonial => Boolean(item));
}

export async function getContactForm(
  input: NodicsClientInput & { readonly definitionCode: string },
): Promise<NexusContactFormDefinition | undefined> {
  const response = await requestNodicsJson<Record<string, unknown> | undefined>(
    {
      ...input,
      path: `v0/public/forms/${encodeURIComponent(input.definitionCode)}`,
    },
  );
  if (!response) return undefined;
  return {
    code: text(response.definitionCode || response.code),
    fields: fieldsFromStructure(response.structure),
    version:
      typeof response.version === 'number' ? response.version : undefined,
  };
}

export async function submitContact(
  input: NodicsClientInput & {
    readonly idempotencyKey: string;
    readonly payload: Record<string, string>;
  },
): Promise<NexusContactSubmission> {
  return requestNodicsJson<NexusContactSubmission>({
    ...input,
    body: input.payload,
    headers: { 'idempotency-key': input.idempotencyKey },
    method: 'POST',
    path: 'v0/public/contact-submissions',
  });
}
