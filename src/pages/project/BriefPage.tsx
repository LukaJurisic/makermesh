import {
  ArrowRight,
  CircleHelp,
  ImageIcon,
  Lock,
  MapPin,
  PencilLine,
  WalletCards,
} from 'lucide-react';
import {useNavigate} from 'react-router-dom';
import {useDemo} from '@/app/useDemo';
import {Button} from '@/components/ui/Button';
import {demoBrief, demoRequirements} from '@/data/demo';

export function BriefPage() {
  const navigate = useNavigate();
  const {approveBrief, backendReady, briefApproved, trackEvent} = useDemo();
  const hard = demoRequirements.filter((item) => item.type === 'hard');
  const soft = demoRequirements.filter((item) => item.type === 'soft');

  const approve = async () => {
    await approveBrief();
    await trackEvent('brief_approved');
    navigate('/projects/harbour-coffee-lab/research');
  };

  return (
    <div className="workspace-page">
      <header className="page-heading-row">
        <div>
          <p className="page-kicker">Approved input controls all downstream work</p>
          <h2>Structured sourcing brief</h2>
          <p>Review exactly what is required, preferred, assumed, and still unknown.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary">
            <PencilLine className="size-4" /> Edit brief
          </Button>
          <Button onClick={approve} disabled={!backendReady || briefApproved}>
            {briefApproved ? 'Brief approved' : 'Approve brief'} <ArrowRight className="size-4" />
          </Button>
        </div>
      </header>

      <div className="mt-7 grid gap-6 xl:grid-cols-[minmax(0,1.3fr)_minmax(300px,0.7fr)]">
        <section className="brief-summary">
          <div className="grid gap-5 sm:grid-cols-[180px_1fr]">
            <img
              src="/images/espresso-cup-study.webp"
              alt="Fictional reference cups for the demo brief"
              className="aspect-square w-full rounded-xl object-cover"
            />
            <div>
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.1em] text-[var(--terracotta)]">
                <ImageIcon className="size-3.5" /> Buyer-approved reference
              </span>
              <h3 className="mt-3 font-serif text-[34px] leading-9 tracking-[-0.035em] text-[var(--ink)]">
                {demoBrief.product}
              </h3>
              <p className="mt-3 text-sm leading-6 text-[var(--ink-soft)]">
                {demoBrief.rawRequest}
              </p>
              <dl className="mt-5 grid grid-cols-2 gap-x-5 gap-y-4 text-sm">
                <div>
                  <dt className="text-xs text-[var(--muted)]">Quantity</dt>
                  <dd className="mt-1 font-semibold tabular-nums text-[var(--ink)]">
                    {demoBrief.quantity} units
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-[var(--muted)]">Capacity</dt>
                  <dd className="mt-1 font-semibold tabular-nums text-[var(--ink)]">
                    {demoBrief.capacity}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-[var(--muted)]">Destination</dt>
                  <dd className="mt-1 font-semibold text-[var(--ink)]">{demoBrief.destination}</dd>
                </div>
                <div>
                  <dt className="text-xs text-[var(--muted)]">Deadline</dt>
                  <dd className="mt-1 font-semibold text-[var(--ink)]">{demoBrief.deadline}</dd>
                </div>
              </dl>
            </div>
          </div>
        </section>

        <aside className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5">
          <div className="flex items-center gap-2 text-sm font-semibold text-[var(--ink)]">
            <WalletCards className="size-4 text-[var(--ochre)]" /> Commercial boundary
          </div>
          <p className="mt-3 font-serif text-[28px] text-[var(--ink)]">{demoBrief.budget}</p>
          <p className="mt-2 text-xs leading-5 text-[var(--muted)]">
            Before freight, customs, taxes, and duties. Original currencies remain unchanged.
          </p>
          <div className="mt-5 flex items-start gap-2 border-t border-[var(--border)] pt-4 text-xs leading-5 text-[var(--muted)]">
            <Lock className="mt-0.5 size-3.5 shrink-0" /> EXW, FOB, and delivered quotes will not be
            compared as equivalent.
          </div>
        </aside>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-2">
        <RequirementGroup
          title="Hard requirements"
          description="A contradiction creates a hard failure. Missing evidence remains unknown."
          requirements={hard}
          tone="hard"
        />
        <RequirementGroup
          title="Soft preferences"
          description="Unknown preferences earn no points and remain visible in the denominator."
          requirements={soft}
          tone="soft"
        />
      </div>

      <div className="mt-8 grid gap-6 md:grid-cols-2">
        <section className="border-t border-[var(--border-strong)] pt-5">
          <h3 className="flex items-center gap-2 text-base font-semibold text-[var(--ink)]">
            <CircleHelp className="size-4 text-[var(--unknown)]" /> Unknown specifications
          </h3>
          <ul className="mt-3 space-y-2 text-sm leading-6 text-[var(--ink-soft)]">
            {demoBrief.unknowns.map((item) => (
              <li key={item} className="flex gap-2">
                <span className="text-[var(--unknown)]">—</span>
                {item}
              </li>
            ))}
          </ul>
        </section>
        <section className="border-t border-[var(--border-strong)] pt-5">
          <h3 className="flex items-center gap-2 text-base font-semibold text-[var(--ink)]">
            <MapPin className="size-4 text-[var(--ochre)]" /> Commercial assumptions
          </h3>
          <ul className="mt-3 space-y-2 text-sm leading-6 text-[var(--ink-soft)]">
            {demoBrief.assumptions.map((item) => (
              <li key={item} className="flex gap-2">
                <span className="text-[var(--ochre)]">—</span>
                {item}
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}

function RequirementGroup({
  title,
  description,
  requirements,
  tone,
}: {
  title: string;
  description: string;
  requirements: typeof demoRequirements;
  tone: 'hard' | 'soft';
}) {
  return (
    <section>
      <div className="border-b border-[var(--border-strong)] pb-4">
        <h3 className="text-lg font-semibold text-[var(--ink)]">{title}</h3>
        <p className="mt-1 text-xs leading-5 text-[var(--muted)]">{description}</p>
      </div>
      <ol className="divide-y divide-[var(--border)]">
        {requirements.map((requirement, index) => (
          <li key={requirement.key} className="grid grid-cols-[28px_1fr_auto] gap-3 py-4">
            <span
              className={`flex size-7 items-center justify-center rounded-full text-[11px] font-semibold ${tone === 'hard' ? 'bg-[var(--terracotta-soft)] text-[var(--terracotta)]' : 'bg-[var(--teal-soft)] text-[var(--teal)]'}`}
            >
              {index + 1}
            </span>
            <div>
              <p className="text-sm font-semibold text-[var(--ink)]">{requirement.label}</p>
              <p className="mt-1 text-xs leading-5 text-[var(--muted)]">
                {requirement.description}
              </p>
            </div>
            {tone === 'soft' && (
              <span className="text-xs font-semibold tabular-nums text-[var(--muted)]">
                {requirement.weight}%
              </span>
            )}
          </li>
        ))}
      </ol>
    </section>
  );
}
