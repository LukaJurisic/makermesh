import {Check, Copy, LoaderCircle} from 'lucide-react';
import {useState, type CSSProperties} from 'react';
import {Link, useParams} from 'react-router-dom';
import {useQuery} from 'convex/react';
import {api} from '../../convex/_generated/api';
import {Brand} from '@/components/brand/Logo';
import {Button} from '@/components/ui/Button';
import {QUOTE_INBOX_ADDRESS} from '@/pages/quoteInboxAddress';

export function QuoteResultPage() {
  const {token} = useParams();
  if (!token || !/^[A-Za-z0-9_-]{24,64}$/.test(token)) return <QuoteUnavailable />;
  return <QuoteResult token={token} />;
}

function QuoteUnavailable() {
  return (
    <main className="mx-auto max-w-xl px-6 py-20">
      <h1 className="font-serif text-4xl">Quote unavailable</h1>
      <p className="mt-4 text-sm leading-7 text-[var(--muted)]">
        This link has expired or is incorrect. Forwarded quotes are deleted after 48 hours. Send
        another to <strong>{QUOTE_INBOX_ADDRESS}</strong> to get a new link.
      </p>
      <Link className="mt-6 inline-block text-sm text-[var(--terracotta-contrast)]" to="/">
        Back to MakerMesh
      </Link>
    </main>
  );
}

function QuoteResult({token}: {token: string}) {
  const quote = useQuery(api.quoteInbox.get, {token});
  const [copied, setCopied] = useState(false);
  if (quote === null) return <QuoteUnavailable />;
  if (!quote)
    return (
      <main className="p-12" role="status">
        Loading your quote…
      </main>
    );
  const result = quote.result;
  const reading = quote.status === 'received' || quote.status === 'reading';
  const copyQuestions = async () => {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(
        result.questions.map((q, i) => `${i + 1}. ${q}`).join('\n'),
      );
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };
  return (
    <div className="min-h-screen bg-[var(--canvas)]">
      <header className="research-buyer-header">
        <Brand />
        <div>
          <Link to="/projects/harbour-coffee-lab/compare">See the café example</Link>
        </div>
      </header>
      <main className="research-buyer-main">
        <div className="page-heading-row">
          <div>
            <p className="page-kicker">Forwarded quote · private link</p>
            <h1 className="research-buyer-title">
              {result?.supplierName
                ? `What ${result.supplierName} committed to`
                : 'What this quote commits to'}
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-[var(--muted)]">
              Every term below is quoted word for word from your email. Anything not quoted is not a
              commitment.
            </p>
          </div>
          <span className="research-live-status" role="status">
            {reading ? <LoaderCircle size={15} className="animate-spin" /> : <Check size={15} />}{' '}
            {reading ? 'Reading your quote' : quote.status === 'failed' ? 'Could not read' : 'Done'}
          </span>
        </div>

        {reading && (
          <section className="research-progress" aria-label="Reading progress">
            <LoaderCircle size={26} className="animate-spin" />
            <div>
              <h2>Reading your quote</h2>
              <p>This page updates by itself when the result is ready, usually within a minute.</p>
            </div>
          </section>
        )}

        {(quote.status === 'failed' || (result && !result.isQuote)) && (
          <section className="research-empty">
            <h2>No quote terms found in the email text.</h2>
            <p>
              MakerMesh reads the body of the email only. If the quote is in a PDF, paste its text
              into a new email to {QUOTE_INBOX_ADDRESS}.
            </p>
          </section>
        )}

        {result?.isQuote && (
          <>
            <figure className="quote-letter quote-result-letter" aria-label="Your quote, annotated">
              <div className="quote-letter-row">
                <p className="quote-letter-meta">What the supplier wrote, word for word</p>
              </div>
              {result.terms.map((term, index) => (
                <div
                  key={`${term.kind}-${index}`}
                  className="quote-letter-row"
                  style={{'--row-i': index} as CSSProperties}
                >
                  <p>
                    <mark>{term.excerpt}</mark>
                  </p>
                  <aside className="quote-note">
                    <strong>{term.label}</strong>
                    <span>
                      {term.value}
                      {term.condition ? ` · ${term.condition}` : ''}
                    </span>
                  </aside>
                </div>
              ))}
              <div className="quote-letter-row">
                <p className="quote-letter-sign">{result.supplierName ?? 'The supplier'}</p>
              </div>
            </figure>

            {result.notStated.length > 0 && (
              <section className="research-empty" aria-labelledby="not-stated">
                <h2 id="not-stated">Not stated anywhere in the quote</h2>
                <p>{result.notStated.join(' · ')}</p>
              </section>
            )}

            {result.questions.length > 0 && (
              <section className="research-brief-review" aria-labelledby="questions">
                <div>
                  <p className="page-kicker">Before you order</p>
                  <h2 id="questions">Questions to send back</h2>
                  <ol>
                    {result.questions.map((question, index) => (
                      <li key={question}>
                        <span>{index + 1}</span>
                        <div>
                          <p>{question}</p>
                        </div>
                      </li>
                    ))}
                  </ol>
                </div>
                <aside>
                  <Button type="button" onClick={() => void copyQuestions()}>
                    {copied ? 'Questions copied' : 'Copy questions'}
                    <Copy size={15} />
                  </Button>
                </aside>
              </section>
            )}
          </>
        )}

        <p className="research-private-note">
          Private to whoever has this link. The sender address is stored only as a hash, and
          everything is deleted on{' '}
          {new Intl.DateTimeFormat('en-CA', {dateStyle: 'long'}).format(new Date(quote.expiresAt))}
        </p>
      </main>
    </div>
  );
}
