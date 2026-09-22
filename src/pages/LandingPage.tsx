import {ArrowRight, Check, Copy} from 'lucide-react';
import {useState} from 'react';
import {useQuery} from 'convex/react';
import {Link} from 'react-router-dom';
import {Brand} from '@/components/brand/Logo';
import {AboutDemoDrawer} from '@/components/layout/AboutDemoDrawer';
import {useTrackProductEvent} from '@/app/useTrackProductEvent';
import {QUOTE_INBOX_ADDRESS} from '@/pages/quoteInboxAddress';
import {api} from '../../convex/_generated/api';
import '@fontsource-variable/newsreader/opsz.css';
import '@fontsource-variable/newsreader/opsz-italic.css';
import '@/styles/site-refresh.css';

const CAFE_ORDER = '/projects/harbour-coffee-lab/compare';

// Sentences are copied verbatim from the captured Atlas reply (convex/model/controlledReply.ts).
const annotations = [
  {
    label: 'Price',
    note: '72 MAD a cup at the workshop door. Freight, customs and duties are yours.',
  },
  {label: 'Lead time', note: 'The 30 days start after you approve the sample, not when you order.'},
  {label: 'Not confirmed', note: 'Export packaging is still open. Ask before paying a deposit.'},
];

export function LandingPage() {
  useTrackProductEvent('landing_viewed');
  const [aboutOpen, setAboutOpen] = useState(false);
  const quoteInbox = useQuery(api.quoteInbox.status);
  const inboxOpen = Boolean(quoteInbox?.enabled);
  return (
    <div className="maker-home">
      <header className="maker-home-nav">
        <Brand />
        <nav aria-label="Main navigation">
          <a href="#ways-in">How it works</a>
          <Link to={CAFE_ORDER}>See the café order</Link>
        </nav>
        <Link to="/compose" className="home-nav-action">
          Start a request <ArrowRight size={16} />
        </Link>
      </header>
      <main>
        <section className="quote-hero" aria-labelledby="hero-title">
          <div className="quote-hero-copy">
            <p className="home-kicker">For cafés ordering custom ceramics</p>
            <h1 id="hero-title">
              The quote says <span className="hero-nowrap">30 days.</span>{' '}
              <span className="hero-line">Read the small print.</span>
            </h1>
            <p className="home-lede">
              MakerMesh reads a workshop’s reply sentence by sentence, shows you what it actually
              commits to, and drafts what to ask before you pay.
            </p>
            <div className="home-actions">
              <Link className="home-primary" to={CAFE_ORDER}>
                See the café order <ArrowRight size={18} />
              </Link>
            </div>
            {inboxOpen && <InboxAddress />}
          </div>

          <figure className="quote-letter" aria-label="A workshop reply, annotated">
            <div className="quote-letter-row">
              <p className="quote-letter-meta">
                From Atlas Clay Studio · Re: 200 tasses à espresso
              </p>
            </div>
            <div className="quote-letter-row">
              <p>
                Nous pouvons produire les 200 tasses artisanales en céramique pour Harbour Coffee
                Lab.{' '}
                <mark>
                  Le prix produit est de 72 MAD par tasse, base EXW; le fret, les douanes, les taxes
                  et les droits sont exclus.
                </mark>
              </p>
              <Annotation index={0} />
            </div>
            <div className="quote-letter-row">
              <p>
                Un échantillon de préproduction avec le logo est disponible pour 650 MAD.{' '}
                <mark>La production prend 30 à 35 jours après validation de l’échantillon.</mark>
              </p>
              <Annotation index={1} />
            </div>
            <div className="quote-letter-row">
              <p>
                L’expédition n’est pas incluse.{' '}
                <mark>L’emballage pour le transport international reste à confirmer.</mark>
              </p>
              <Annotation index={2} />
            </div>
            <div className="quote-letter-row">
              <p className="quote-letter-sign">Atlas Clay Studio</p>
            </div>
            <figcaption>
              Fictional café and workshop. The reply is a real email sent between our own test
              inboxes.
            </figcaption>
          </figure>
        </section>

        <section className="home-example" aria-labelledby="example-title">
          <div className="home-example-copy">
            <p className="home-kicker">A worked example</p>
            <h2 id="example-title">200 cups for Harbour Coffee Lab.</h2>
            <p className="home-body">
              The reply above quotes 72 MAD a cup and 30–35 days after sample approval. Change the
              order and MakerMesh checks it against the workshop’s own words.
            </p>
            <dl className="what-if">
              <div>
                <dt>Production finished in 30 days?</dt>
                <dd>
                  <strong className="what-if-fail">Runs past it</strong>
                  <span>The 30–35 days only start once you approve the sample.</span>
                </dd>
              </div>
              <div>
                <dt>400 cups instead of 200?</dt>
                <dd>
                  <strong className="what-if-open">Not confirmed</strong>
                  <span>The reply prices and times 200 cups. Ask before assuming the same terms.</span>
                </dd>
              </div>
            </dl>
            <Link className="home-primary" to={CAFE_ORDER}>
              Open the café order <ArrowRight size={18} />
            </Link>
          </div>
          <figure className="home-plate home-plate--cups">
            <img
              src="/images/espresso-cup-study.webp"
              alt="Illustrative ceramic cups for the example café order"
              loading="lazy"
            />
            <figcaption>
              <span>Fig. 1</span> Espresso cups of the kind in the example order. Illustration.
            </figcaption>
          </figure>
        </section>

        <section id="ways-in" className="ways-in" aria-labelledby="ways-in-title">
          <figure className="home-plate home-plate--potter">
            <img
              src="/images/maker-hands-hero.webp"
              alt="Illustration of a potter shaping a ceramic cup"
              loading="lazy"
            />
            <figcaption>
              <span>Fig. 2</span> Made by hand, in small batches. Illustration.
            </figcaption>
          </figure>
          <div className="ways-in-body">
            <p className="home-kicker">Three ways in</p>
            <h2 id="ways-in-title">Start from where your order is.</h2>
            <ol className="ways-in-list">
              {inboxOpen && (
                <li>
                  <span className="ways-in-number">01</span>
                  <h3>You already have a quote</h3>
                  <p>
                    Email it to <strong>{QUOTE_INBOX_ADDRESS}</strong>. In about a minute you get each
                    term in the supplier’s own words, what they left out, and the questions to send
                    back.
                  </p>
                  <a
                    className="ways-in-action"
                    href={`mailto:${QUOTE_INBOX_ADDRESS}?subject=${encodeURIComponent('Quote to check')}`}
                  >
                    Email a quote <ArrowRight size={16} />
                  </a>
                </li>
              )}
              <li>
                <span className="ways-in-number">{inboxOpen ? '02' : '01'}</span>
                <h3>You want to see how it works</h3>
                <p>
                  Follow Harbour Coffee Lab’s order from brief to reply, then try your own deadline
                  and quantity against what the workshop wrote.
                </p>
                <Link className="ways-in-action" to={CAFE_ORDER}>
                  See a café order <ArrowRight size={16} />
                </Link>
              </li>
              <li>
                <span className="ways-in-number">{inboxOpen ? '03' : '02'}</span>
                <h3>You’re still looking for a workshop</h3>
                <p>
                  Describe what you want made. We search Moroccan workshops’ own websites and list
                  what each says, with the questions still to ask.
                </p>
                <Link className="ways-in-action" to="/compose">
                  Start a request <ArrowRight size={16} />
                </Link>
              </li>
            </ol>
          </div>
        </section>
      </main>
      <footer className="home-footer">
        <Brand />
        <p>Sourcing help for cafés buying handmade ceramics.</p>
        <button onClick={() => setAboutOpen(true)}>About this project</button>
      </footer>
      <AboutDemoDrawer open={aboutOpen} onOpenChange={setAboutOpen} />
    </div>
  );
}

function Annotation({index}: {index: number}) {
  const a = annotations[index]!;
  return (
    <aside className="quote-note">
      <strong>{a.label}</strong>
      <span>{a.note}</span>
    </aside>
  );
}

function InboxAddress() {
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
    <div className="inbox-address">
      <p className="inbox-address-label" id="inbox-address-label">
        Have a quote of your own? Email it to
      </p>
      <div className="inbox-address-field">
        <a
          href={`mailto:${QUOTE_INBOX_ADDRESS}?subject=${encodeURIComponent('Quote to check')}`}
          aria-describedby="inbox-address-label"
        >
          {QUOTE_INBOX_ADDRESS}
        </a>
        <button type="button" onClick={() => void copy()} aria-live="polite">
          {copied ? <Check size={15} /> : <Copy size={15} />}
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <p className="home-small">Reply in about a minute. Text only; deleted after 48 hours.</p>
    </div>
  );
}
