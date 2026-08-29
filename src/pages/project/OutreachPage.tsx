import {ArrowRight, CheckCircle2, CircleHelp, Languages, Mail, ShieldAlert} from 'lucide-react';
import {useState} from 'react';
import {Button} from '@/components/ui/Button';
import {OutreachDrawer, DeliveryTimeline} from '@/components/outreach/OutreachDrawer';
import {demoMakers, outreachDraft} from '@/data/demo';
import {useDemo} from '@/app/useDemo';

export function OutreachPage() {
  const {trackEvent} = useDemo();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const atlas = demoMakers[0];
  if (!atlas) return null;
  const unknowns = atlas.evaluations.filter((item) => item.outcome === 'unknown');
  return (
    <div className="workspace-page">
      <header className="page-heading-row">
        <div>
          <p className="page-kicker">Human approval before communication</p>
          <h2>Question gaps and outreach</h2>
          <p>Ask only what remains unresolved, in language the maker can answer by normal email.</p>
        </div>
        <Button
          onClick={() => {
            setDrawerOpen(true);
            void trackEvent('outreach_reviewed');
          }}
        >
          <Mail className="size-4" /> Review controlled draft <ArrowRight className="size-4" />
        </Button>
      </header>

      <div className="mt-7 grid gap-7 xl:grid-cols-[minmax(0,0.85fr)_minmax(360px,1.15fr)]">
        <section>
          <div className="overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface-raised)]">
            <img
              src={atlas.visual}
              alt="Illustrative cups for fictional Atlas Clay Studio"
              className="h-40 w-full object-cover"
            />
            <div className="p-5">
              <span className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--terracotta)]">
                Selected fictional supplier
              </span>
              <h3 className="mt-2 text-xl font-semibold text-[var(--ink)]">{atlas.name}</h3>
              <p className="mt-1 text-sm text-[var(--muted)]">
                {atlas.location} · Controlled demo only
              </p>
              <div className="mt-4 flex items-start gap-2 rounded-lg bg-[var(--terracotta-soft)] p-3 text-xs leading-5 text-[var(--terracotta)]">
                <ShieldAlert className="mt-0.5 size-4 shrink-0" /> This identity is fictional. The
                eventual live send routes only to a project-owner allowlist.
              </div>
            </div>
          </div>
          <div className="mt-6">
            <DeliveryTimeline />
          </div>
        </section>

        <section>
          <div className="flex items-end justify-between border-b border-[var(--border-strong)] pb-4">
            <div>
              <h3 className="text-lg font-semibold text-[var(--ink)]">Focused questions</h3>
              <p className="mt-1 text-xs text-[var(--muted)]">
                Generated from unresolved keys, then edited by the buyer.
              </p>
            </div>
            <span className="text-sm font-semibold tabular-nums text-[var(--unknown)]">
              {outreachDraft.questions.length} to ask
            </span>
          </div>
          <ol className="divide-y divide-[var(--border)]">
            {outreachDraft.questions.map((question, index) => (
              <li key={question} className="grid grid-cols-[32px_1fr_auto] gap-3 py-4">
                <span className="flex size-8 items-center justify-center rounded-full bg-[#ebe8e1] text-xs font-semibold tabular-nums text-[var(--unknown)]">
                  {index + 1}
                </span>
                <div>
                  <p dir="auto" className="text-sm font-medium leading-6 text-[var(--ink)]">
                    {question}
                  </p>
                  <p className="mt-1 text-xs text-[var(--muted)]">
                    Could affect commercial completeness
                  </p>
                </div>
                <button type="button" className="text-xs font-semibold text-[var(--terracotta)]">
                  Edit
                </button>
              </li>
            ))}
          </ol>

          <div className="mt-7 border-t border-[var(--border-strong)] pt-5">
            <h3 className="flex items-center gap-2 text-base font-semibold text-[var(--ink)]">
              <CircleHelp className="size-4 text-[var(--unknown)]" /> Remaining matrix unknowns
            </h3>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {unknowns.map((item) => (
                <div
                  key={item.requirementKey}
                  className="flex items-center gap-2 rounded-lg bg-[var(--surface)] p-3 text-xs font-medium text-[var(--ink-soft)]"
                >
                  <span className="size-1.5 rounded-full bg-[var(--unknown)]" />{' '}
                  {item.requirementLabel}
                </div>
              ))}
            </div>
          </div>

          <div className="mt-7 flex items-center justify-between border-t border-[var(--border)] pt-5">
            <div className="flex items-center gap-2 text-xs text-[var(--muted)]">
              <Languages className="size-4" /> English and French retained
            </div>
            <div className="flex items-center gap-2 text-xs font-semibold text-[var(--teal)]">
              <CheckCircle2 className="size-4" /> Units preserved exactly
            </div>
          </div>
        </section>
      </div>
      <OutreachDrawer open={drawerOpen} onOpenChange={setDrawerOpen} />
    </div>
  );
}
