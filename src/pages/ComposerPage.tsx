import {ArrowLeft, ArrowRight, ImagePlus, Sparkles} from 'lucide-react';
import {useState} from 'react';
import {Link, useNavigate} from 'react-router-dom';
import {Brand} from '@/components/brand/Logo';
import {Button} from '@/components/ui/Button';
import {demoBrief} from '@/data/demo';

const steps = ['Describe', 'Structure', 'Set constraints', 'Approve'];

export function ComposerPage() {
  const navigate = useNavigate();
  const [request, setRequest] = useState('');
  const loadDemo = () => setRequest(demoBrief.rawRequest);
  return (
    <div className="min-h-screen bg-[var(--canvas)]">
      <header className="flex h-16 items-center justify-between border-b border-[var(--border)] bg-[var(--surface)] px-5 sm:px-8">
        <Brand />
        <Button asChild variant="quiet" size="sm">
          <Link to="/">
            <ArrowLeft className="size-4" /> Back to home
          </Link>
        </Button>
      </header>
      <main className="mx-auto max-w-[1120px] px-5 py-10 sm:px-8 lg:py-16">
        <ol className="flex max-w-[680px] items-center gap-2" aria-label="Brief creation progress">
          {steps.map((step, index) => (
            <li key={step} className="flex flex-1 items-center gap-2">
              <span
                className={`flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${index === 0 ? 'bg-[var(--terracotta)] text-white' : 'border border-[var(--border-strong)] text-[var(--muted)]'}`}
              >
                {index + 1}
              </span>
              <span
                className={`hidden text-xs font-medium sm:inline ${index === 0 ? 'text-[var(--ink)]' : 'text-[var(--muted)]'}`}
              >
                {step}
              </span>
            </li>
          ))}
        </ol>

        <div className="mt-12 grid gap-10 lg:grid-cols-[minmax(0,1fr)_320px]">
          <section>
            <p className="section-kicker">New sourcing brief</p>
            <h1 className="mt-3 max-w-[720px] font-serif text-[clamp(2.8rem,5vw,4.7rem)] leading-[0.98] tracking-[-0.045em] text-[var(--ink)]">
              What do you need made?
            </h1>
            <p className="mt-5 max-w-[620px] text-base leading-7 text-[var(--ink-soft)]">
              Describe the product, quantity, destination, timing, and what cannot change. MakerMesh
              will propose a structure for your approval.
            </p>
            <label className="mt-8 block">
              <span className="text-sm font-semibold text-[var(--ink)]">Production request</span>
              <textarea
                value={request}
                onChange={(event) => setRequest(event.target.value)}
                placeholder="For example: Produce 200 handcrafted ceramic espresso cups..."
                className="mt-2 min-h-48 w-full resize-y rounded-xl border border-[var(--border-strong)] bg-[var(--surface-raised)] p-5 text-[15px] leading-7 text-[var(--ink)] outline-none transition-shadow placeholder:text-[var(--muted)] focus:border-[var(--teal)] focus:ring-2 focus:ring-[var(--teal-soft)]"
              />
            </label>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <Button
                type="button"
                onClick={() => request && navigate('/projects/harbour-coffee-lab/brief')}
                disabled={!request}
              >
                <Sparkles className="size-4" /> Structure this brief{' '}
                <ArrowRight className="size-4" />
              </Button>
              <Button type="button" variant="secondary" onClick={loadDemo}>
                Load demo brief
              </Button>
            </div>
            <p className="mt-4 text-xs leading-5 text-[var(--muted)]">
              Fixture mode: no OpenAI call occurs here yet. Live compilation will be capped and
              clearly labelled.
            </p>
          </section>

          <aside className="border-l border-[var(--border)] pl-6 lg:mt-20">
            <div className="flex size-11 items-center justify-center rounded-xl bg-[var(--terracotta-soft)] text-[var(--terracotta)]">
              <ImagePlus className="size-5" />
            </div>
            <h2 className="mt-5 text-base font-semibold text-[var(--ink)]">
              Optional reference image
            </h2>
            <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
              Operator mode will accept one image. Visual attributes remain suggestions until the
              buyer approves them.
            </p>
            <div className="mt-5 overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface)]">
              <img
                src="/images/espresso-cup-study.webp"
                alt="Included fictional demo cup reference"
                className="aspect-[4/3] w-full object-cover"
              />
              <p className="p-3 text-xs font-medium text-[var(--ink-soft)]">
                Included demo reference · MakerMesh-owned artwork
              </p>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
