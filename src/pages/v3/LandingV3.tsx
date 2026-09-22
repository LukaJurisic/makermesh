import {ArrowRight, Check, Copy} from 'lucide-react';
import {useEffect, useRef, useState, type CSSProperties} from 'react';
import {useQuery} from 'convex/react';
import {Link} from 'react-router-dom';
import {Brand} from '@/components/brand/Logo';
import {QUOTE_INBOX_ADDRESS} from '@/pages/quoteInboxAddress';
import {api} from '../../../convex/_generated/api';
import {ClayWheel} from './ClayWheel';
import '@fontsource-variable/newsreader/opsz.css';
import '@fontsource-variable/newsreader/opsz-italic.css';
import '@/styles/landing-v3.css';

const CAFE_ORDER = '/projects/harbour-coffee-lab/compare';
const MAILTO = `mailto:${QUOTE_INBOX_ADDRESS}?subject=${encodeURIComponent('Quote to check')}`;

// Sentences are verbatim from the captured Atlas reply (convex/model/controlledReply.ts).
const chapters = [
  {
    index: 'Centring',
    numeral: '200',
    numeralNote: 'espresso cups, with a logo',
  },
  {
    index: 'Price',
    numeral: '72',
    numeralNote: 'MAD a cup, at the door',
    before: 'Nous pouvons produire les 200 tasses artisanales en céramique pour Harbour Coffee Lab. ',
    marked: 'Le prix produit est de 72 MAD par tasse, base EXW; le fret, les douanes, les taxes et les droits sont exclus.',
    label: 'Price',
    note: '72 MAD a cup at the workshop door. Freight, customs and duties are yours.',
  },
  {
    index: 'Lead time',
    numeral: '30–35',
    numeralNote: 'days, after the sample is approved',
    before: 'Un échantillon de préproduction avec le logo est disponible pour 650 MAD. ',
    marked: 'La production prend 30 à 35 jours après validation de l’échantillon.',
    label: 'Lead time',
    note: 'The 30 days start after you approve the sample, not when you order.',
  },
  {
    index: 'Still open',
    numeral: 'à confirmer',
    numeralNote: 'export packaging',
    before: 'L’expédition n’est pas incluse. ',
    marked: 'L’emballage pour le transport international reste à confirmer.',
    label: 'Not confirmed',
    note: 'Export packaging is still open. Ask before paying a deposit.',
  },
  {index: 'Fired', numeral: '', numeralNote: ''},
] as const;

export function LandingV3() {
  const storyRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const wheelRef = useRef<ClayWheel | null>(null);
  const [chapter, setChapter] = useState(0);
  const [progress, setProgress] = useState(0);
  const quoteInbox = useQuery(api.quoteInbox.status);
  const inboxOpen = Boolean(quoteInbox?.enabled);

  useEffect(() => {
    const host = stageRef.current;
    if (!host) return;
    let wheel: ClayWheel | null = null;
    try {
      wheel = new ClayWheel(host);
      wheelRef.current = wheel;
    } catch {
      host.dataset.noWebgl = 'true';
    }
    return () => {
      wheel?.dispose();
      wheelRef.current = null;
    };
  }, []);

  useEffect(() => {
    let frame = 0;
    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const el = storyRef.current;
        if (!el) return;
        const rect = el.getBoundingClientRect();
        const travel = rect.height - window.innerHeight;
        const p = Math.min(1, Math.max(0, -rect.top / Math.max(travel, 1)));
        setProgress(p);
        // five chapters; the clay keeps moving between them
        const c = Math.min(4, Math.floor(p * 5));
        setChapter(c);
        wheelRef.current?.setStage(Math.min(4, Math.max(0, p * 5 - 0.35)));
      });
    };
    onScroll();
    window.addEventListener('scroll', onScroll, {passive: true});
    window.addEventListener('resize', onScroll);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, []);

  return (
    <div className="v3">
      <header className="v3-nav">
        <Brand />
        <nav aria-label="Main navigation">
          <a href="#ways-in">How to start</a>
          <Link to={CAFE_ORDER}>See the café order</Link>
        </nav>
        <Link to="/compose" className="v3-nav-action">
          Start a request <ArrowRight size={16} />
        </Link>
      </header>

      <main>
        <div className="v3-story" ref={storyRef} data-chapter={chapter}>
          <div className="v3-sticky">
            <div className="v3-numerals" aria-hidden="true">
              {chapters.map((c, i) =>
                c.numeral ? (
                  <div key={c.index} className={`v3-numeral ${i === chapter ? 'is-on' : ''}`}>
                    <span className={c.numeral.length > 5 ? 'is-words' : ''}>{c.numeral}</span>
                    <small>{c.numeralNote}</small>
                  </div>
                ) : null,
              )}
            </div>

            <div className="v3-stage" ref={stageRef}>
              <p className="v3-touch" aria-hidden="true">
                Press the clay
              </p>
            </div>

            <div className="v3-copy">
              <section className={`v3-chapter v3-intro ${chapter === 0 ? 'is-on' : ''}`}>
                <p className="v3-kicker">For cafés ordering custom ceramics</p>
                <h1>
                  Read the quote <span>before the clay is thrown.</span>
                </h1>
                <p className="v3-lede">
                  A Moroccan workshop has replied, in French, to a café’s order for 200 cups.
                  MakerMesh reads it sentence by sentence: what it commits to, what it leaves out,
                  and what to ask before you pay.
                </p>
                <div className="v3-actions v3-intro-actions">
                  <Link className="v3-primary" to={CAFE_ORDER}>
                    See the café order <ArrowRight size={18} />
                  </Link>
                  {inboxOpen && (
                    <a className="v3-text-link" href={MAILTO}>
                      or email us a quote
                    </a>
                  )}
                </div>
                <p className="v3-scroll-hint">Or scroll to read the reply</p>
              </section>

              {chapters.slice(1, 4).map((c, i) =>
                'marked' in c ? (
                  <section
                    key={c.index}
                    className={`v3-chapter ${chapter === i + 1 ? 'is-on' : ''}`}
                    aria-label={c.label}
                  >
                    <p className="v3-from">From Atlas Clay Studio · sentence {i + 1} of 3</p>
                    <p className="v3-french" lang="fr">
                      {c.before}
                      <mark>{c.marked}</mark>
                    </p>
                    <aside className="v3-note">
                      <strong>{c.label}</strong>
                      <span>{c.note}</span>
                    </aside>
                  </section>
                ) : null,
              )}

              <section className={`v3-chapter v3-final ${chapter === 4 ? 'is-on' : ''}`}>
                <p className="v3-kicker">Fired</p>
                <h2>Now you know what you’re paying for.</h2>
                <p className="v3-lede">
                  One price, one lead time that starts later than it sounds, and one open question
                  to settle before the deposit.
                </p>
                <div className="v3-actions">
                  <Link className="v3-primary" to={CAFE_ORDER}>
                    See the café order <ArrowRight size={18} />
                  </Link>
                  {inboxOpen && (
                    <a className="v3-text-link" href={MAILTO}>
                      Email us your own quote
                    </a>
                  )}
                </div>
              </section>
            </div>

            <div className="v3-progress" aria-hidden="true">
              <span style={{transform: `scaleX(${progress})`}} />
            </div>
          </div>
        </div>

        <ReplyInFull />

        <section id="ways-in" className="v3-ways" aria-labelledby="v3-ways-title">
          <header className="v3-ways-head">
            <p className="v3-kicker">Three ways in</p>
            <h2 id="v3-ways-title">Start from where your order is.</h2>
          </header>

          {inboxOpen && (
            <article className="v3-way v3-way--mail">
              <div className="v3-way-copy">
                <p className="v3-way-n">01 · You already have a quote</p>
                <h3>Forward it. Get the small print back in a minute.</h3>
                <p>
                  Send the supplier’s email as it is. MakerMesh replies with each term in their own
                  words, what they left out, and the questions to send back before you order.
                </p>
                <div className="v3-mail">
                  <a className="v3-mail-address" href={MAILTO}>
                    {QUOTE_INBOX_ADDRESS}
                  </a>
                  <div className="v3-mail-actions">
                    <a className="v3-primary" href={MAILTO}>
                      Email a quote <ArrowRight size={18} />
                    </a>
                    <CopyAddress />
                  </div>
                  <p className="v3-mail-small">
                    Text of the email only, not attachments. Deleted after 48 hours.
                  </p>
                </div>
              </div>
              <figure className="v3-reply" aria-label="An example reply from MakerMesh">
                <div className="v3-reply-head">
                  <span>From MakerMesh</span>
                  <span>Re: Quote to check</span>
                </div>
                <p className="v3-reply-intro">
                  Here’s what this quote from Atlas Clay Studio actually commits to:
                </p>
                <dl>
                  <div>
                    <dt>Price</dt>
                    <dd>
                      <span className="v3-reply-term">72 MAD a cup, ex works</span>
                      <q lang="fr">Le prix produit est de 72 MAD par tasse, base EXW</q>
                    </dd>
                  </div>
                  <div>
                    <dt>Lead time</dt>
                    <dd>
                      <span className="v3-reply-term">30–35 days, after sample approval</span>
                      <q lang="fr">La production prend 30 à 35 jours après validation</q>
                    </dd>
                  </div>
                  <div className="is-open">
                    <dt>Not confirmed</dt>
                    <dd>Export packaging</dd>
                  </div>
                </dl>
                <p className="v3-reply-ask">
                  <strong>Ask before you order</strong>
                  Can you confirm export packaging for 200 cups, and what it adds per cup?
                </p>
                <figcaption>Example reply, shortened. Yours links to a full breakdown.</figcaption>
              </figure>
            </article>
          )}

          <article className="v3-way">
            <figure className="v3-way-plate">
              <img
                src="/images/espresso-cup-study.webp"
                alt="Illustrative ceramic cups for the example café order"
                loading="lazy"
              />
            </figure>
            <div className="v3-way-copy">
              <p className="v3-way-n">
                {inboxOpen ? '02' : '01'} · You want to see how it works
              </p>
              <h3>Follow one café’s order from brief to reply.</h3>
              <p>
                Harbour Coffee Lab wants 200 espresso cups with its logo. Walk through the brief,
                the workshops, the French reply, then try your own deadline and quantity against
                what the workshop wrote.
              </p>
              <Link className="v3-way-action" to={CAFE_ORDER}>
                See a café order <ArrowRight size={16} />
              </Link>
            </div>
          </article>

          <article className="v3-way v3-way--flip">
            <figure className="v3-way-plate">
              <img
                src="/images/maker-hands-hero.webp"
                alt="Illustration of a potter shaping a ceramic cup"
                loading="lazy"
              />
            </figure>
            <div className="v3-way-copy">
              <p className="v3-way-n">
                {inboxOpen ? '03' : '02'} · You’re still looking for a workshop
              </p>
              <h3>Describe what you want made.</h3>
              <p>
                We search Moroccan workshops’ own websites and list what each one says it makes,
                with the questions still to ask before you write to them.
              </p>
              <Link className="v3-way-action" to="/compose">
                Start a request <ArrowRight size={16} />
              </Link>
            </div>
          </article>
        </section>
        <EmailRoute inboxOpen={inboxOpen} />
      </main>

      <footer className="v3-footer">
        <Brand />
        <p>
          Fictional café and workshop; the reply is a real email between our own test inboxes.
        </p>
        <p>Built on Convex, OpenAI, Firecrawl and AgentMail.</p>
      </footer>
    </div>
  );
}

const letterNotes = [
  {label: 'Price', note: '72 MAD a cup at the workshop door. Freight, customs and duties are yours.'},
  {label: 'Lead time', note: 'The 30 days start after you approve the sample, not when you order.'},
  {label: 'Not confirmed', note: 'Export packaging is still open. Ask before paying a deposit.'},
];

function LetterNote({index}: {index: number}) {
  const n = letterNotes[index]!;
  return (
    <aside className="quote-note">
      <strong>{n.label}</strong>
      <span>{n.note}</span>
    </aside>
  );
}

// The full reply as one document. Its highlight and note animations wait until it is on screen.
function ReplyInFull() {
  const ref = useRef<HTMLElement>(null);
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setSeen(true);
          io.disconnect();
        }
      },
      {threshold: 0.35},
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <section
      ref={ref}
      className={`v3-letter ${seen ? 'is-in' : ''}`}
      aria-labelledby="v3-letter-title"
    >
      <div className="v3-letter-intro">
        <p className="v3-kicker">The reply, read in full</p>
        <h2 id="v3-letter-title">Their words on the page. Ours in the margin.</h2>
        <p>
          MakerMesh never rewrites what a workshop said. It marks the sentences that bind them,
          keeps them in the original language, and writes its reading beside each one.
        </p>
        <Link className="v3-way-action" to={CAFE_ORDER}>
          Open this order <ArrowRight size={16} />
        </Link>
      </div>
      <figure className="quote-letter" aria-label="A workshop reply, annotated">
        <div className="quote-letter-row">
          <p className="quote-letter-meta">From Atlas Clay Studio · Re: 200 tasses à espresso</p>
        </div>
        <div className="quote-letter-row">
          <p lang="fr">
            Nous pouvons produire les 200 tasses artisanales en céramique pour Harbour Coffee Lab.{' '}
            <mark>
              Le prix produit est de 72 MAD par tasse, base EXW; le fret, les douanes, les taxes et
              les droits sont exclus.
            </mark>
          </p>
          <LetterNote index={0} />
        </div>
        <div className="quote-letter-row">
          <p lang="fr">
            Un échantillon de préproduction avec le logo est disponible pour 650 MAD.{' '}
            <mark>La production prend 30 à 35 jours après validation de l’échantillon.</mark>
          </p>
          <LetterNote index={1} />
        </div>
        <div className="quote-letter-row">
          <p lang="fr">
            L’expédition n’est pas incluse.{' '}
            <mark>L’emballage pour le transport international reste à confirmer.</mark>
          </p>
          <LetterNote index={2} />
        </div>
        <div className="quote-letter-row">
          <p className="quote-letter-sign">Atlas Clay Studio</p>
        </div>
        <figcaption>
          Fictional café and workshop. The reply is a real email sent between our own test inboxes.
        </figcaption>
      </figure>
    </section>
  );
}

const routeStops = [
  {who: 'AgentMail', what: 'Your email lands in makermesh@agentmail.to. A signed webhook hands it on.'},
  {who: 'Convex', what: 'Stores the text, checks rate limits and schedules the read. Deleted after 48 hours.'},
  {who: 'OpenAI', what: 'Numbers every sentence. Each term must cite one word for word, or it is thrown out.'},
  {who: 'Convex', what: 'Saves the terms, gaps and questions. The breakdown page updates live.'},
  {who: 'AgentMail', what: 'Replies on the same thread, with a link to the full breakdown.'},
];

// One quote's trip through the stack, drawn once as the section comes into view.
function EmailRoute({inboxOpen}: {inboxOpen: boolean}) {
  const ref = useRef<HTMLElement>(null);
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setSeen(true);
          io.disconnect();
        }
      },
      {threshold: 0.4},
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <section ref={ref} className={`v3-route ${seen ? 'is-in' : ''}`} aria-labelledby="v3-route-title">
      <div className="v3-route-head">
        <p className="v3-kicker">Under the hood</p>
        <h2 id="v3-route-title">What happens to your email in the next minute.</h2>
      </div>
      <ol className="v3-route-line">
        {routeStops.map((stop, i) => (
          <li key={i} style={{'--i': i} as CSSProperties}>
            <span className="v3-route-stop" aria-hidden="true" />
            <strong>{stop.who}</strong>
            <p>{stop.what}</p>
          </li>
        ))}
      </ol>
      <div className="v3-route-foot">
        <p>
          Still looking for a workshop? <strong>Firecrawl</strong> reads real workshop websites in
          English and French inside a durable Convex workflow, and every claim links to its page.
        </p>
        {inboxOpen && (
          <a className="v3-primary" href={MAILTO}>
            Try it with your quote <ArrowRight size={18} />
          </a>
        )}
      </div>
    </section>
  );
}

function CopyAddress() {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(QUOTE_INBOX_ADDRESS);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };
  return (
    <button type="button" className="v3-copy-btn" onClick={() => void copy()} aria-live="polite">
      {copied ? <Check size={16} /> : <Copy size={16} />}
      {copied ? 'Copied' : 'Copy address'}
    </button>
  );
}
