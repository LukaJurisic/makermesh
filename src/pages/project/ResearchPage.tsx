import {sourceDomain, sourceTitle} from '@/lib/sourceDisplay';
import {ArrowRight, CheckCircle2, FileSearch, LoaderCircle, Search} from 'lucide-react';
import {useRef, useState} from 'react';
import {useNavigate} from 'react-router-dom';
import {useDemo} from '@/app/useDemo';
import {Button} from '@/components/ui/Button';
import {EvidenceDialog} from '@/components/evidence/EvidenceDialog';
import type {SourceEvidence} from '@/domain/types';

export function ResearchPage() {
  const navigate = useNavigate();
  const {
    backendReady,
    baselineMode,
    briefApproved,
    metrics,
    research,
    researchStarted,
    startResearch,
    trackEvent,
  } = useDemo();
  const [selectedEvidence, setSelectedEvidence] = useState<SourceEvidence | null>(null);
  const evidenceTriggerRef = useRef<HTMLButtonElement | null>(null);
  const statusLabel =
    baselineMode === 'captured_live' ? 'Captured-live research' : 'Captured fixture';
  const startReplay = async () => {
    if (!briefApproved) return;
    await startResearch();
    await trackEvent('research_started');
  };

  return (
    <div className="workspace-page">
      <header className="page-heading-row">
        <div>
          <p className="page-kicker">Explore the sources</p>
          <h2>Research & sources</h2>
          <p>Read what each source says about a capability. This market uses example records.</p>
        </div>
        <Button onClick={startReplay} disabled={!backendReady || !briefApproved || researchStarted}>
          {!briefApproved ? (
            <>
              <Search className="size-4" /> Approve brief first
            </>
          ) : researchStarted ? (
            <>
              <CheckCircle2 className="size-4" /> {statusLabel} replay loaded
            </>
          ) : (
            <>
              <Search className="size-4" /> Replay example research
            </>
          )}
        </Button>
      </header>

      <section className="mt-7 overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface-raised)]">
        <div className="grid gap-5 border-b border-[var(--border)] p-5 md:grid-cols-[1fr_auto] md:items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[var(--muted)]">
              Research theme
            </p>
            <p className="mt-2 font-medium text-[var(--ink)]">{research.theme}</p>
          </div>
          <span
            className="inline-flex items-center gap-2 rounded-full bg-[var(--ochre-soft)] px-3 py-1.5 text-xs font-semibold text-[var(--warning)]"
            role="status"
            aria-live="polite"
          >
            <LoaderCircle className={`size-4 ${researchStarted ? '' : 'animate-spin'}`} />{' '}
            {researchStarted ? `${statusLabel} complete` : 'Ready to replay'}
          </span>
        </div>
        <div className="grid grid-cols-2 divide-[var(--border)] sm:grid-cols-4 sm:divide-x">
          {[
            ['Sources available', metrics.sources],
            ['Sources analyzed', metrics.sources],
            ['Candidates', metrics.makers],
            ['Statements kept', metrics.claims],
          ].map(([label, value]) => (
            <div key={label} className="p-5">
              <p className="text-[28px] font-semibold tabular-nums tracking-[-0.04em] text-[var(--ink)]">
                {value}
              </p>
              <p className="mt-1 text-xs text-[var(--muted)]">{label}</p>
            </div>
          ))}
        </div>
        <div
          className="h-1 bg-[var(--border)]"
          role="progressbar"
          aria-label="Research replay progress"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={researchStarted ? 100 : 18}
        >
          <div
            className={`h-full bg-[var(--teal)] transition-[width] duration-700 ${researchStarted ? 'w-full' : 'w-[18%]'}`}
          />
        </div>
      </section>

      <div className="mt-8 grid grid-cols-1 gap-8 xl:grid-cols-[minmax(0,1.25fr)_minmax(300px,0.75fr)] [&>*]:min-w-0">
        <section>
          <div className="flex items-end justify-between border-b border-[var(--border-strong)] pb-4">
            <div>
              <h3 className="text-lg font-semibold text-[var(--ink)]">Sources</h3>
              <p className="mt-1 text-xs text-[var(--muted)]">
                Every excerpt opens its source record.
              </p>
            </div>
            <span className="text-xs text-[var(--muted)]">Example source collection</span>
          </div>
          <div className="divide-y divide-[var(--border)]">
            {research.sources.map((source) => (
              <button
                key={source.id}
                type="button"
                onClick={(event) => {
                  evidenceTriggerRef.current = event.currentTarget;
                  setSelectedEvidence(source);
                }}
                className="source-row w-full text-left"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate text-sm font-semibold text-[var(--ink)]">
                      {sourceTitle(source)}
                    </p>
                    {!source.fixture && (
                      <span className="text-xs font-medium text-[var(--teal)]">Captured live</span>
                    )}
                  </div>
                  <p className="mt-1 truncate text-xs text-[var(--muted)]">
                    {source.maker} · {sourceDomain(source)}
                  </p>
                </div>
                <FileSearch className="size-4 text-[var(--muted)]" />
              </button>
            ))}
          </div>
        </section>

        <section>
          <div className="border-b border-[var(--border-strong)] pb-4">
            <h3 className="text-lg font-semibold text-[var(--ink)]">Makers found</h3>
            <p className="mt-1 text-xs text-[var(--muted)]">
              Names are grouped before we compare them.
            </p>
          </div>
          <ol className="divide-y divide-[var(--border)]">
            {research.makers.map((maker, index) => (
              <li key={maker.slug} className="flex items-center gap-3 py-3.5">
                <span className="w-6 shrink-0 text-xs tabular-nums text-[var(--muted)]">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-[var(--ink)]">{maker.name}</p>
                  <p className="mt-0.5 text-xs text-[var(--muted)]">
                    {maker.location} · {maker.publicSourceCount} source
                    {maker.publicSourceCount === 1 ? '' : 's'}
                  </p>
                </div>
                <CheckCircle2 className="size-4 text-[var(--teal)]" />
              </li>
            ))}
          </ol>
          <Button
            variant="secondary"
            className="mt-5 w-full"
            onClick={() => navigate('/projects/harbour-coffee-lab/makers')}
          >
            Review discovered makers <ArrowRight className="size-4" />
          </Button>
        </section>
      </div>
      <EvidenceDialog
        open={Boolean(selectedEvidence)}
        onOpenChange={(next) => !next && setSelectedEvidence(null)}
        returnFocusRef={evidenceTriggerRef}
        source={selectedEvidence}
      />
    </div>
  );
}
