import {
  ArrowRight,
  CheckCircle2,
  FileSearch,
  MailQuestion,
  Network,
  ShieldCheck,
} from 'lucide-react';
import {motion} from 'motion/react';
import {useState} from 'react';
import {Link} from 'react-router-dom';
import {Brand} from '@/components/brand/Logo';
import {Button} from '@/components/ui/Button';
import {AboutDemoDrawer} from '@/components/layout/AboutDemoDrawer';
import {useTrackProductEvent} from '@/app/useTrackProductEvent';

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
    title: 'Know what to ask next',
    body: 'Public statements and supplier replies stay beside your requirements. Unanswered questions remain visible before you decide.',
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
  const [aboutOpen, setAboutOpen] = useState(false);
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
              Explore demo
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
              Custom production, made clearer
            </p>
            <h1 className="max-w-[760px] font-serif text-[clamp(3.3rem,6.3vw,5.25rem)] leading-[0.94] tracking-[-0.045em] text-[var(--ink)]">
              Know what the workshop
              <br />
              <em className="font-normal">can commit to.</em>
            </h1>
            <p className="mt-7 max-w-[590px] text-[17px] leading-7 text-[var(--ink-soft)]">
              Research Moroccan ceramics sources, then try a captured quote example to see how
              requirements, exact wording, and unanswered questions shape a sourcing decision.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg">
                <Link to="/projects/harbour-coffee-lab/compare">
                  Try the quote example <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="secondary">
                <Link to="/compose">Research your own request</Link>
              </Button>
            </div>
            <p className="mt-5 flex items-center gap-2 text-xs text-[var(--muted)]">
              <ShieldCheck className="size-4 text-[var(--teal)]" /> Fictional supplier example ·
              captured email exchange
            </p>
          </motion.div>
        </div>

        <div className="landing-demo-note">
          <span>Explore a fictional café’s search for 200 custom espresso cups.</span>
          <button onClick={() => setAboutOpen(true)}>
            About this demo <ArrowRight size={14} />
          </button>
        </div>
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
              <strong className="text-[var(--teal-on-dark)]">
                <CheckCircle2 className="size-4" /> Maker confirmed
              </strong>
            </div>
            <div className="evidence-row">
              <span>Food-contact documents</span>
              <strong className="text-[var(--teal-on-dark)]">
                <CheckCircle2 className="size-4" /> Can be shared
              </strong>
            </div>
            <div className="evidence-row">
              <span>Export packaging</span>
              <strong className="text-[var(--unknown-on-dark)]">
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
      <AboutDemoDrawer open={aboutOpen} onOpenChange={setAboutOpen} />
    </div>
  );
}
