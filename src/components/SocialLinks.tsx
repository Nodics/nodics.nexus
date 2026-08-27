export interface SocialChannel {
  readonly name: string;
  readonly href: string;
}

const glyphs: Readonly<Record<string, string>> = Object.freeze({
  GitHub:
    'M12 .7a12 12 0 0 0-3.79 23.39c.6.11.82-.26.82-.58v-2.23c-3.34.73-4.04-1.42-4.04-1.42-.55-1.4-1.35-1.77-1.35-1.77-1.1-.75.08-.73.08-.73 1.22.09 1.86 1.26 1.86 1.26 1.08 1.85 2.84 1.32 3.54 1 .11-.78.42-1.32.76-1.62-2.67-.3-5.47-1.33-5.47-5.93 0-1.31.47-2.38 1.24-3.22-.12-.3-.54-1.52.12-3.18 0 0 1.01-.32 3.3 1.23A11.5 11.5 0 0 1 12 6.84c1.02 0 2.04.14 3 .4 2.3-1.55 3.31-1.23 3.31-1.23.66 1.66.24 2.88.12 3.18.77.84 1.23 1.91 1.23 3.22 0 4.61-2.8 5.62-5.48 5.92.43.37.82 1.1.82 2.22v2.96c0 .32.21.7.83.58A12 12 0 0 0 12 .7Z',
  LinkedIn:
    'M5.3 7.9H1.1V21h4.2V7.9ZM3.2 1.4A2.4 2.4 0 1 0 3.2 6a2.4 2.4 0 0 0 0-4.7ZM22.9 13.5c0-4-2.1-5.9-5-5.9-2.3 0-3.4 1.3-4 2.2V7.9H9.7V21h4.2v-6.5c0-1.7.3-3.4 2.5-3.4 2.2 0 2.2 2 2.2 3.5V21h4.2v-7.5Z',
  YouTube:
    'M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.6 12 3.6 12 3.6s-7.5 0-9.4.5A3 3 0 0 0 .5 6.2 31 31 0 0 0 0 12a31 31 0 0 0 .5 5.8 3 3 0 0 0 2.1 2.1c1.9.5 9.4.5 9.4.5s7.5 0 9.4-.5a3 3 0 0 0 2.1-2.1A31 31 0 0 0 24 12a31 31 0 0 0-.5-5.8ZM9.6 15.6V8.4L15.8 12l-6.2 3.6Z',
});

const defaultChannels = [
  {
    name: 'GitHub',
    href: 'https://github.com/Nodics',
  },
  {
    name: 'LinkedIn',
    href: 'https://www.linkedin.com/company/nodics',
  },
  {
    name: 'YouTube',
    href: '',
  },
] satisfies readonly SocialChannel[];

export function SocialLinks({
  channels = defaultChannels,
}: {
  readonly channels?: readonly SocialChannel[];
}) {
  return (
    <div className="social-links" aria-label="Nodics social channels">
      {channels
        .filter((channel) => channel.href)
        .map((channel) => (
          <a
            key={channel.name}
            href={channel.href}
            target="_blank"
            rel="noreferrer"
            aria-label={`Nodics on ${channel.name}`}
            title={channel.name}
          >
            <svg aria-hidden="true" viewBox="0 0 24 24">
              <path d={glyphs[channel.name] ?? glyphs.GitHub} />
            </svg>
          </a>
        ))}
    </div>
  );
}
