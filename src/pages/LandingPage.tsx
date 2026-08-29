import {
  ArrowRight,
  CheckCircle2,
  FileSearch,
  MailQuestion,
  Network,
  ShieldCheck,
} from 'lucide-react';
import {motion} from 'motion/react';
import {Link} from 'react-router-dom';
import {Brand} from '@/components/brand/Logo';
import {Button} from '@/components/ui/Button';
import {demoMetrics} from '@/data/demo';
import {useTrackProductEvent} from '@/app/useTrackProductEvent';

const flow = [
  ['Brief', 'Approved'],
  ['Sources', String(demoMetrics.sources)],
  ['Makers', String(demoMetrics.makers)],
  ['Questions', String(demoMetrics.questions)],
  ['RFQs', '1 controlled'],
  ['Replies', String(demoMetrics.replies)],
] as const;

const principles = [
  {
    number: '01',
    icon: Network,
    title: 'Start with demand',
    body: 'Describe the production need first. MakerMesh compiles the relevant market around one approved brief.',
  },
  {
    number: '02',
    icon: MailQuestion,
    title: 'Ask only what is missing',
    body: 'Confirmed facts stay out of the email. Unknown requirements become concise, editable supplier questions.',
  },
  {
    number: '03',
    icon: FileSearch,
    title: 'Preserve the evidence',
    body: 'Every material claim keeps its excerpt, source, timestamp, acquisition method, and evidence state.',
  },
];

export function LandingPage() {
  useTrackProductEvent('landing_viewed');
  return (
    <div className="min-h-screen bg-[var(--canvas)] text-[var(--ink)]">
      <section className="landing-hero">
        <img
          src="/images/maker-hands-hero.webp"
          alt="Illustrative hands shaping a ceramic espresso cup"
          className="landing-hero-image"
        />
        <div className="landing-hero-wash" />
        <header className="landing-nav">
          <Brand />
          <nav
            className="hidden items-center gap-7 text-sm font-medium text-[var(--ink-soft)] md:flex"
            aria-label="Main navigation"
          >
            <a href="#method" className="hover:text-[var(--ink)]">
              Method
            </a>
            <a href="#passport" className="hover:text-[var(--ink)]">
              Mesh Passport
            </a>
            <Link to="/projects/harbour-coffee-lab/brief" className="hover:text-[var(--ink)]">
              Live demo
            </Link>
          </nav>
        </header>

        <div className="landing-hero-content">
          <motion.div
            initial={{opacity: 0, y: 14}}
            animate={{opacity: 1, y: 0}}
            transition={{duration: 0.5, ease: 'easeOut'}}
          >
            <p className="mb-5 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--terracotta)]">
              Demand-triggered sourcing intelligence
            </p>
            <h1 className="max-w-[760px] font-serif text-[clamp(3.3rem,6.3vw,5.25rem)] leading-[0.94] tracking-[-0.045em] text-[var(--ink)]">
              A market appears
              <br />
              <em className="font-normal">when you ask.</em>
            </h1>
            <p className="mt-7 max-w-[590px] text-[17px] leading-7 text-[var(--ink-soft)]">
              Describe what you need made. MakerMesh discovers relevant makers, finds what the web
              cannot answer, and turns every response into comparable evidence.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg">
                <Link to="/compose">
                  Compile a maker market <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="secondary">
                <Link to="/projects/harbour-coffee-lab/brief">Open the espresso-cup demo</Link>
              </Button>
            </div>
            <p className="mt-5 flex items-center gap-2 text-xs text-[var(--muted)]">
              <ShieldCheck className="size-4 text-[var(--teal)]" /> Human approval before any
              communication
            </p>
          </motion.div>
        </div>

        <motion.div
          className="compilation-line"
          initial={{opacity: 0, y: 10}}
          animate={{opacity: 1, y: 0}}
          transition={{delay: 0.32, duration: 0.45}}
          aria-label="Demonstration compilation flow"
        >
          <div className="compilation-label">
            <span>Demo fixture</span>
            <strong>Market compilation</strong>
          </div>
          <ol>
            {flow.map(([label, value], index) => (
              <li key={label}>
                <span className="flow-dot" aria-hidden="true" />
                <div>
                  <strong>{value}</strong>
                  <span>{label}</span>
                </div>
                {index < flow.length - 1 && (
                  <ArrowRight className="flow-arrow" aria-hidden="true" />
                )}
              </li>
            ))}
          </ol>
        </motion.div>
      </section>

      <main>
        <section id="method" className="editorial-section">
          <div className="editorial-intro">
            <p className="section-kicker">The method</p>
            <h2>
              Not a directory.
              <br />A market built for the requirement.
            </h2>
            <p>
              Supplier discovery is only the start. MakerMesh separates observable facts from
              unanswered requirements, then preserves what every response changes.
            </p>
          </div>
          <div className="principle-list">
            {principles.map((principle) => {
              const Icon = principle.icon;
              return (
                <article key={principle.number}>
                  <span className="principle-number">{principle.number}</span>
                  <Icon className="size-5 text-[var(--terracotta)]" />
                  <h3>{principle.title}</h3>
                  <p>{principle.body}</p>
                </article>
              );
            })}
          </div>
        </section>

        <section className="evidence-band">
          <div>
            <p className="section-kicker text-[var(--ochre)]">Evidence before confidence</p>
            <h2>
              Unknown is a result,
              <br />
              not a blank to fill.
            </h2>
          </div>
          <div className="evidence-example">
            <div className="evidence-row">
              <span>Custom logo</span>
              <strong className="text-[var(--teal)]">
                <CheckCircle2 className="size-4" /> Maker confirmed
              </strong>
            </div>
            <div className="evidence-row">
              <span>Food-contact documents</span>
              <strong className="text-[var(--teal)]">
                <CheckCircle2 className="size-4" /> Can be shared
              </strong>
            </div>
            <div className="evidence-row">
              <span>Export packaging</span>
              <strong className="text-[var(--unknown)]">
                <MailQuestion className="size-4" /> Unknown — ask next
              </strong>
            </div>
            <p className="mt-5 text-xs leading-5 text-white/55">
              Demonstration values from the fictional Atlas Clay Studio reply.
            </p>
          </div>
        </section>

        <section id="passport" className="passport-section">
          <div className="passport-copy">
            <p className="section-kicker">Mesh Passport</p>
            <h2>Every answer leaves the market more legible.</h2>
            <p>
              A capability dossier preserves what the maker said, what supported it, and when it was
              last confirmed—without pretending a reply is independent verification.
            </p>
            <Button asChild variant="secondary">
              <Link to="/projects/harbour-coffee-lab/passport">
                Open the demonstration Passport <ArrowRight className="size-4" />
              </Link>
            </Button>
          </div>
          <div className="passport-preview-card">
            <img
              src="/images/espresso-cup-study.webp"
              alt="Illustrative collection of fictional demo espresso cups"
            />
            <div className="passport-preview-content">
              <span>Demonstration profile</span>
              <h3>Atlas Clay Studio</h3>
              <p>Safi, Morocco · Ceramic hospitality ware</p>
              <dl>
                <div>
                  <dt>Minimum</dt>
                  <dd>150 units</dd>
                </div>
                <div>
                  <dt>Production</dt>
                  <dd>30–35 days</dd>
                </div>
                <div>
                  <dt>Languages</dt>
                  <dd>FR · EN</dd>
                </div>
              </dl>
            </div>
          </div>
        </section>
      </main>

      <footer className="landing-footer">
        <Brand inverse />
        <p>From a sourcing brief to an evidence-backed maker network.</p>
        <span>Built for the Convex All Gas Hackathon · 2026</span>
      </footer>
    </div>
  );
}
