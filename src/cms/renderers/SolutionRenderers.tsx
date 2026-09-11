import { useId } from 'react';
import type { CmsComponentContract } from '../cmsContract';
import { items, strings, text, type Properties } from './propertyReaders';
import '../../styles/solutions.css';

const localHref = (value: string) =>
  /^\/(?!\/)[^\\\s]*$/u.test(value) ? value : undefined;
const anchorId = (value: string) =>
  /^[a-z][a-z0-9-]*$/u.test(value) ? value : undefined;

function SolutionFlow({ solution }: { readonly solution: Properties }) {
  return (
    <div
      className={`solution-flow solution-flow--${text(solution, 'visual') === 'data' ? 'data' : 'operations'}`}
      aria-hidden="true"
    >
      <div className="solution-orbit solution-orbit--outer" />
      <div className="solution-orbit solution-orbit--inner" />
      <svg
        className="solution-connections"
        viewBox="0 0 600 280"
        preserveAspectRatio="none"
      >
        <path d="M100 65 H240 L300 140 L365 215 H500 M100 215 H240 L300 140 L365 65 H500" />
      </svg>
      <div className="solution-flow-core">
        <span>{text(solution, 'visual') === 'data' ? '◈' : '✳'}</span>
        <strong>{text(solution, 'centerLabel')}</strong>
      </div>
      {strings(solution, 'flow')
        .slice(0, 4)
        .map((step, index) => (
          <div
            className={`solution-flow-node solution-flow-node--${index}`}
            key={step}
          >
            <span>0{index + 1}</span>
            {step}
          </div>
        ))}
    </div>
  );
}

export function SolutionsRenderer({
  component,
}: {
  readonly component: CmsComponentContract;
}) {
  const p = component.properties;
  const uid = useId();
  const entries = items<Properties>(p, 'items');
  const detailed = text(p, 'mode') === 'detail';
  const href = localHref(text(p, 'href'));
  return (
    <section
      id={anchorId(text(p, 'anchor'))}
      className={`solutions-section ${detailed ? 'solutions-section--detail' : 'solutions-section--overview'}`}
      aria-labelledby={`${uid}-heading`}
    >
      <div className="section-wrap">
        <header className="solutions-intro">
          <div>
            <p className="eyebrow">{text(p, 'kicker')}</p>
            <h2 id={`${uid}-heading`}>{text(p, 'heading')}</h2>
          </div>
          <div>
            <p>{text(p, 'body')}</p>
            {!detailed && href && (
              <a className="solution-text-link" href={href}>
                {text(p, 'linkLabel')} <span aria-hidden="true">↗</span>
              </a>
            )}
          </div>
        </header>
        {detailed && (
          <nav className="solutions-jump-nav" aria-label="Solution directions">
            {entries.map((s, index) => {
              const target = anchorId(text(s, 'code'));
              return target ? (
                <a key={target} href={`#${target}`}>
                  <span>0{index + 1}</span>
                  {text(s, 'title')}
                  <span aria-hidden="true">↓</span>
                </a>
              ) : null;
            })}
          </nav>
        )}
        <div
          className={detailed ? 'solution-stories' : 'solution-overview-grid'}
        >
          {entries.map((s, index) => {
            const target = localHref(text(s, 'href'));
            return (
              <article
                key={text(s, 'code') || index}
                id={detailed ? anchorId(text(s, 'code')) : undefined}
                className={`solution-entry ${text(s, 'visual') === 'data' ? 'solution-entry--data' : ''}`}
              >
                <div className="solution-entry-main">
                  <div className="solution-entry-copy">
                    <div className="solution-category">
                      <span>0{index + 1}</span>
                      {text(s, 'category')}
                    </div>
                    <p className="solution-name">{text(s, 'title')}</p>
                    <h3>{text(s, 'headline')}</h3>
                    <p className="solution-summary">{text(s, 'summary')}</p>
                    {!detailed && (
                      <>
                        <ul className="solution-tags">
                          {strings(s, 'tags').map((tag) => (
                            <li key={tag}>{tag}</li>
                          ))}
                        </ul>
                        {target && (
                          <a className="solution-text-link" href={target}>
                            {text(s, 'linkLabel')}{' '}
                            <span aria-hidden="true">↗</span>
                          </a>
                        )}
                      </>
                    )}
                  </div>
                  <div className="solution-visual">
                    <SolutionFlow solution={s} />
                    {detailed && (
                      <p className="solution-flow-caption">
                        {text(p, 'workflowLabel')}
                        <span>{strings(s, 'flow').join(' → ')}</span>
                      </p>
                    )}
                  </div>
                </div>
                {detailed && (
                  <div className="solution-entry-details">
                    <p className="solution-challenge">{text(s, 'challenge')}</p>
                    <h4>{text(p, 'useCasesLabel')}</h4>
                    <div className="solution-use-cases">
                      {items<Properties>(s, 'useCases').map((item) => (
                        <div key={text(item, 'title')}>
                          <h5>{text(item, 'title')}</h5>
                          <p>{text(item, 'text')}</p>
                        </div>
                      ))}
                    </div>
                    <div className="solution-scope">
                      <div>
                        <h4>{text(s, 'scopeLabel')}</h4>
                        <ul>
                          {strings(s, 'scope').map((item) => (
                            <li key={item}>{item}</li>
                          ))}
                        </ul>
                      </div>
                      <aside>
                        <p className="eyebrow">{text(s, 'outcomeLabel')}</p>
                        <p>{text(s, 'outcome')}</p>
                      </aside>
                    </div>
                  </div>
                )}
              </article>
            );
          })}
        </div>
        {detailed && (
          <>
            <section
              className="solution-journey"
              aria-labelledby={`${uid}-journey`}
            >
              <p className="eyebrow">{text(p, 'journeyKicker')}</p>
              <h2 id={`${uid}-journey`}>{text(p, 'journeyHeading')}</h2>
              <p>{text(p, 'journeyBody')}</p>
              <ol>
                {items<Properties>(p, 'steps').map((step, index) => (
                  <li key={text(step, 'title')}>
                    <span>0{index + 1}</span>
                    <h3>{text(step, 'title')}</h3>
                    <p>{text(step, 'text')}</p>
                  </li>
                ))}
              </ol>
            </section>
            <section className="solution-cta">
              <div>
                <p className="eyebrow">{text(p, 'ctaKicker')}</p>
                <h2>{text(p, 'ctaHeading')}</h2>
                <p>{text(p, 'ctaBody')}</p>
              </div>
              {href && (
                <a className="button button-primary" href={href}>
                  {text(p, 'linkLabel')} <span aria-hidden="true">↗</span>
                </a>
              )}
            </section>
          </>
        )}
        <p className="solutions-footnote">{text(p, 'footnote')}</p>
      </div>
    </section>
  );
}
