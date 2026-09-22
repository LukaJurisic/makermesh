import {ArrowLeft, ArrowRight, Check, Copy, ExternalLink, LoaderCircle} from 'lucide-react';
import {useState} from 'react';
import {Link, useParams} from 'react-router-dom';
import {useSessionMutation, useSessionQuery} from 'convex-helpers/react/sessions';
import type {Id} from '../../convex/_generated/dataModel';
import {api} from '../../convex/_generated/api';
import {Brand} from '@/components/brand/Logo';
import {Button} from '@/components/ui/Button';
import {formatResearchNotes} from '@/domain/researchBrief';

export function BuyerResearchPage() {
  const {requestId} = useParams();
  if (!requestId || !/^[a-zA-Z0-9]{20,64}$/.test(requestId)) return <MissingRequest />;
  return <ResearchRequest requestId={requestId as Id<'buyerResearchRequests'>} />;
}
function MissingRequest() {
  return (
    <main className="mx-auto max-w-xl px-6 py-20">
      <h1 className="font-serif text-4xl">Request unavailable</h1>
      <p className="mt-4 text-sm leading-7 text-[var(--muted)]">
        Open this request in the browser where it was created. Research is private to that browser
        and expires after 48 hours.
      </p>
      <Link className="mt-6 inline-block text-sm text-[var(--terracotta-contrast)]" to="/compose">
        Start a new request
      </Link>
    </main>
  );
}

function ResearchRequest({requestId}: {requestId: Id<'buyerResearchRequests'>}) {
  const request = useSessionQuery(api.buyerResearch.get, {requestId});
  const approve = useSessionMutation(api.buyerResearch.approve);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState('');
  const [downloadState, setDownloadState] = useState<'idle' | 'downloaded' | 'failed'>('idle');
  const [downloadText, setDownloadText] = useState('');
  if (request === null) return <MissingRequest />;
  if (!request)
    return (
      <main className="p-12" role="status">
        Loading your research request…
      </main>
    );
  const {brief, status, input} = request;
  const results = request.results ?? [];
  const running = ['compiling', 'searching', 'reading', 'extracting'].includes(status);
  const labels = {
    compiling: 'Preparing your brief',
    review: 'Ready for your review',
    searching: 'Searching public sources',
    reading: 'Reading discovered pages',
    extracting: 'Collecting useful details',
    complete: 'Research complete',
    failed: 'Research paused',
    out_of_scope: 'Outside this demo’s scope',
  };
  const start = async () => {
    setBusy(true);
    setError('');
    try {
      await approve({requestId, expectedBriefHash: request.briefHash!});
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Research could not start.');
    } finally {
      setBusy(false);
    }
  };
  const copyQuestions = async (name: string, questions: string[]) => {
    try {
      await navigator.clipboard.writeText(questions.map((q, i) => `${i + 1}. ${q}`).join('\n'));
      setCopied(`Questions for ${name} copied.`);
    } catch {
      setCopied('Select the visible questions to copy them.');
    }
  };
  const saveResearchNotes = () => {
    if (status !== 'complete' || !brief) return;
    const notes = formatResearchNotes({brief, input, results});
    setDownloadText(notes);
    try {
      const blob = new Blob([notes], {type: 'text/markdown;charset=utf-8'});
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = 'makermesh-research-notes.md';
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      setDownloadState('downloaded');
    } catch {
      setDownloadState('failed');
    }
  };
  return (
    <div className="min-h-screen bg-[var(--canvas)]">
      <header className="research-buyer-header">
        <Brand />
        <div>
          <Link to="/compose">New request</Link>
          <Link to="/demo">Explore example</Link>
        </div>
      </header>
      <main className="research-buyer-main">
        <Link className="research-back" to="/compose" state={{researchDraft: input}}>
          <ArrowLeft size={14} />
          Your request draft
        </Link>
        <div className="page-heading-row mt-6">
          <div>
            <p className="page-kicker">Your sourcing research · Morocco</p>
            <h1 className="research-buyer-title">
              {brief?.product ?? 'A shortlist starts with your brief.'}
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-[var(--muted)]">
              {brief?.summary ?? input.request}
            </p>
          </div>
          <span className="research-live-status" role="status">
            {running ? <LoaderCircle size={15} className="animate-spin" /> : <Check size={15} />}{' '}
            {labels[status]}
          </span>
        </div>
        <dl className="research-input-facts">
          {[
            ['Quantity', input.quantity || 'Not specified'],
            ['Destination', input.destination],
            ['Product budget', input.budget || 'Not specified'],
            ['Timing', input.timing || 'Not specified'],
          ].map(([label, value]) => (
            <div key={label}>
              <dt>{label}</dt>
              <dd>{value}</dd>
            </div>
          ))}
        </dl>
        {error && (
          <p role="alert" className="my-4 text-sm text-[var(--danger)]">
            {error}
          </p>
        )}
        {status === 'out_of_scope' && (
          <section className="research-empty">
            <h2>This demo focuses on Moroccan ceramics.</h2>
            <p>
              Try a request for custom cups, plates, bowls, or other ceramic products made in
              Morocco. No research or outreach was started.
            </p>
            <Link to="/compose" state={{researchDraft: input}}>
              Revise your request
              <ArrowRight size={15} />
            </Link>
          </section>
        )}
        {status === 'failed' && (
          <section className="research-empty">
            <h2>We couldn’t finish this research.</h2>
            <p>
              {request.error} Your original request is preserved above.{' '}
              {request.sourceCount > 0
                ? `${request.sourceCount} source pages were retrieved before the interruption.`
                : ''}
            </p>
            <Link to="/compose" state={{researchDraft: input}}>
              Return to your draft
              <ArrowRight size={15} />
            </Link>
          </section>
        )}
        {brief && status === 'review' && (
          <section className="research-brief-review">
            <div>
              <p className="page-kicker">Confirm before research</p>
              <h2>Does this capture what matters?</h2>
              <p>Review these questions and the search scope. No maker will be contacted.</p>
              <ol>
                {brief.requirements.map((r) => (
                  <li key={r.key}>
                    <span>{r.kind === 'must' ? 'Essential' : 'Preference'}</span>
                    <div>
                      <strong>{r.label}</strong>
                      <p>{r.question}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
            <aside>
              <h3>Research scope</h3>
              <p>{brief.searchQuery}</p>
              <p>
                Two focused searches, up to three public pages, and source-linked facts. Unanswered
                requirements stay open.
              </p>
              <Button onClick={() => void start()} disabled={busy}>
                {busy ? 'Starting…' : 'Approve brief & research'}
                <ArrowRight size={16} />
              </Button>
              <Link to="/compose" state={{researchDraft: input}}>
                Revise the original draft
              </Link>
            </aside>
          </section>
        )}
        {running && (
          <section className="research-progress" aria-label="Research progress">
            <LoaderCircle size={26} className="animate-spin" />
            <div>
              <h2>{labels[status]}</h2>
              <p>
                {status === 'compiling'
                  ? 'Turning your request into a brief for you to approve.'
                  : `${request.sourceCount} source pages stored. This page updates as the workflow progresses.`}
              </p>
            </div>
          </section>
        )}
        {status === 'complete' && brief && (
          <>
            <div className="research-results-heading">
              <div>
                <p className="page-kicker">Sources for your request</p>
                <h2>
                  {results.length} sourcing {results.length === 1 ? 'lead' : 'leads'} to explore
                </h2>
                <p>
                  {request.sourceCount} pages checked. Ask each workshop to confirm the details
                  before ordering.
                </p>
              </div>
              <div>
                <span>No email sent</span>
                <Button type="button" onClick={saveResearchNotes}>
                  {downloadState === 'downloaded' ? 'Download started' : 'Save research notes'}
                </Button>
              </div>
            </div>
            {downloadState === 'failed' && downloadText && (
              <section className="research-empty" aria-label="Research notes download fallback">
                <h3>Your notes are ready to save.</h3>
                <p>
                  Your browser blocked the download. Select the full notes below and save them as a
                  Markdown file.
                </p>
                <textarea readOnly value={downloadText} aria-label="Research notes" />
              </section>
            )}
            {!results.length && (
              <section className="research-empty">
                <h3>No usable source pages were returned.</h3>
                <p>
                  Try more specific product terms or a broader production requirement. We haven’t
                  filled the shortlist with example suppliers.
                </p>
              </section>
            )}
            <div className="research-source-list">
              {results.map((source, index) => {
                const answered = new Set(source.facts.map((f) => f.requirementKey));
                const gaps = [...brief.requirements].sort(
                  (a, b) =>
                    Number(a.kind !== 'must') - Number(b.kind !== 'must') ||
                    Number(answered.has(a.key)) - Number(answered.has(b.key)),
                );
                const name = source.makerName ?? source.title;
                return (
                  <article key={source.url} className="research-source-record">
                    <div className="research-source-heading">
                      <span className="research-source-number">
                        {String(index + 1).padStart(2, '0')}
                      </span>
                      <div>
                        <p className="page-kicker">
                          {source.locationExcerpt
                            ? 'Website · location mentioned'
                            : 'Website · ask about the location'}
                        </p>
                        <h3>{name}</h3>
                        <a href={source.url} target="_blank" rel="noreferrer">
                          {new URL(source.url).hostname}
                          <ExternalLink size={13} />
                        </a>
                      </div>
                      <span className="research-source-date">
                        Observed{' '}
                        {new Intl.DateTimeFormat('en-CA', {dateStyle: 'medium'}).format(
                          new Date(source.observedAt),
                        )}
                      </span>
                    </div>
                    <div className="research-source-body">
                      <section>
                        <h4>What the source says</h4>
                        {source.locationExcerpt && (
                          <div className="research-excerpt">
                            <strong>Location statement</strong>
                            <blockquote>“{source.locationExcerpt}”</blockquote>
                            <span>From this website. Ask the workshop to confirm.</span>
                          </div>
                        )}
                        {source.facts.length ? (
                          source.facts.map((f) => (
                            <div key={f.requirementKey} className="research-excerpt">
                              <strong>
                                {brief.requirements.find((r) => r.key === f.requirementKey)?.label}
                              </strong>
                              <blockquote>“{f.excerpt}”</blockquote>
                              <span>Public statement · not independently verified</span>
                            </div>
                          ))
                        ) : (
                          <p className="text-sm text-[var(--muted)]">
                            No request-specific facts could be attributed from this page.
                          </p>
                        )}
                      </section>
                      <aside>
                        <h4>Still to confirm</h4>
                        <p>
                          Confirm exact requirements directly. Related source wording is not an
                          answer; essentials without excerpts come first.
                        </p>
                        {gaps.length ? (
                          <ol>
                            {gaps.slice(0, 5).map((r) => (
                              <li key={r.key}>
                                <span>{r.kind === 'must' ? 'Essential' : 'Preference'}</span>
                                {r.question}
                              </li>
                            ))}
                          </ol>
                        ) : (
                          <p>
                            Every requested topic has an excerpt. Check that each statement actually
                            satisfies your requirement before deciding.
                          </p>
                        )}
                        {gaps.length > 0 && (
                          <button
                            onClick={() =>
                              void copyQuestions(
                                name,
                                gaps.map((r) => r.question),
                              )
                            }
                          >
                            <Copy size={14} />
                            Copy questions
                          </button>
                        )}
                        {gaps.length > 5 && (
                          <small>{gaps.length - 5} more included when copied</small>
                        )}
                      </aside>
                    </div>
                  </article>
                );
              })}
            </div>
          </>
        )}
        {copied && (
          <p className="research-copy-notice" role="status">
            {copied}
          </p>
        )}
        <section className="research-private-note" aria-label="Explore a supplier reply">
          <p>
            What happens after a supplier replies? Explore a separate fictional quote example. These
            research leads are not part of that comparison.
          </p>
          <Link to="/projects/harbour-coffee-lab/compare" className="research-back mt-3">
            Try the quote example
          </Link>
        </section>
        <footer className="research-private-note">
          Private to this browser for 48 hours. Download your notes to keep them. Check details with
          each workshop before ordering; no messages are sent.
        </footer>
      </main>
    </div>
  );
}
