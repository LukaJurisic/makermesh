import {
  ArrowUpRight,
  Filter,
  LayoutGrid,
  List,
  MapPin,
  Search,
  SlidersHorizontal,
} from 'lucide-react';
import {useMemo, useState} from 'react';
import {Button} from '@/components/ui/Button';
import {MakerDetailDrawer} from '@/components/makers/MakerDetailDrawer';
import {StatusBadge} from '@/components/ui/StatusBadge';
import {demoMakers} from '@/data/demo';
import type {Maker} from '@/domain/types';
import {useDemo} from '@/app/useDemo';

export function MakersPage() {
  const {trackEvent} = useDemo();
  const [query, setQuery] = useState('');
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [selectedMaker, setSelectedMaker] = useState<Maker | null>(null);
  const filtered = useMemo(
    () =>
      demoMakers.filter((maker) =>
        `${maker.name} ${maker.location} ${maker.capabilities.join(' ')}`
          .toLowerCase()
          .includes(query.toLowerCase()),
      ),
    [query],
  );

  return (
    <div className="workspace-page">
      <header className="page-heading-row">
        <div>
          <p className="page-kicker">Discovery records, not endorsements</p>
          <h2>Maker candidates</h2>
          <p>Visible capabilities are attributed; unknown requirements stay open.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary">
            <Filter className="size-4" /> Filters
          </Button>
          <div className="flex rounded-lg border border-[var(--border)] bg-[var(--surface)] p-1">
            <button
              type="button"
              onClick={() => setView('grid')}
              aria-label="Grid view"
              className={`rounded-md p-2 ${view === 'grid' ? 'bg-white shadow-sm' : 'text-[var(--muted)]'}`}
            >
              <LayoutGrid className="size-4" />
            </button>
            <button
              type="button"
              onClick={() => setView('list')}
              aria-label="List view"
              className={`rounded-md p-2 ${view === 'list' ? 'bg-white shadow-sm' : 'text-[var(--muted)]'}`}
            >
              <List className="size-4" />
            </button>
          </div>
        </div>
      </header>

      <div className="mt-6 flex flex-col gap-3 border-y border-[var(--border)] py-4 sm:flex-row sm:items-center">
        <label className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[var(--muted)]" />
          <span className="sr-only">Search makers</span>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search makers, regions, capabilities"
            className="h-10 w-full rounded-lg border border-[var(--border)] bg-[var(--surface-raised)] pl-10 pr-3 text-sm outline-none focus:border-[var(--teal)]"
          />
        </label>
        <div className="flex gap-2 overflow-x-auto">
          {['All regions', 'Ceramic tableware', 'Evidence ≥ 25%', 'Unknowns visible'].map(
            (item) => (
              <button
                key={item}
                type="button"
                className="whitespace-nowrap rounded-full border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-xs font-medium text-[var(--ink-soft)] hover:border-[var(--border-strong)]"
              >
                {item}
              </button>
            ),
          )}
        </div>
        <Button variant="quiet" size="sm">
          <SlidersHorizontal className="size-4" /> Sort: evidence
        </Button>
      </div>

      <div className={view === 'grid' ? 'maker-grid' : 'mt-6 space-y-3'}>
        {filtered.map((maker) => {
          const hard = maker.evaluations.filter((item) => item.type === 'hard');
          const representative =
            hard.find((item) => item.outcome === 'fail') ??
            hard.find((item) => item.outcome === 'unknown') ??
            hard[0];
          const evidence = maker.evaluations.filter((item) => item.hasActiveEvidence).length;
          const coverage = Math.round((evidence / maker.evaluations.length) * 100);
          return (
            <article
              key={maker.id}
              className={view === 'grid' ? 'maker-card' : 'maker-card list-view'}
            >
              <div className="maker-visual">
                <img src={maker.visual} alt="MakerMesh-owned illustrative ceramics" />
                <span>Demonstration record</span>
              </div>
              <div className="maker-body">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3>{maker.name}</h3>
                    <p className="mt-1 flex items-center gap-1.5 text-xs text-[var(--muted)]">
                      <MapPin className="size-3.5" /> {maker.location}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedMaker(maker);
                      void trackEvent('supplier_inspected');
                    }}
                    className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-[var(--border)] text-[var(--ink)] hover:border-[var(--ink-soft)]"
                    aria-label={`Open ${maker.name}`}
                  >
                    <ArrowUpRight className="size-4" />
                  </button>
                </div>
                <p className="mt-4 line-clamp-2 text-sm leading-6 text-[var(--ink-soft)]">
                  {maker.summary}
                </p>
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {maker.capabilities.slice(0, 3).map((item) => (
                    <span
                      key={item}
                      className="rounded-full bg-[var(--surface)] px-2.5 py-1 text-[11px] font-medium text-[var(--ink-soft)]"
                    >
                      {item}
                    </span>
                  ))}
                </div>
                <div className="mt-5 grid grid-cols-3 gap-3 border-t border-[var(--border)] pt-4">
                  <div>
                    <p className="text-lg font-semibold tabular-nums text-[var(--ink)]">
                      {coverage}%
                    </p>
                    <p className="text-[10px] text-[var(--muted)]">Evidence</p>
                  </div>
                  <div>
                    <p className="text-lg font-semibold tabular-nums text-[var(--ink)]">
                      {maker.openQuestionCount}
                    </p>
                    <p className="text-[10px] text-[var(--muted)]">Open questions</p>
                  </div>
                  <div className="flex items-center justify-end">
                    {representative && <StatusBadge status={representative.outcome} compact />}
                  </div>
                </div>
              </div>
            </article>
          );
        })}
      </div>
      {filtered.length === 0 && (
        <div className="py-20 text-center">
          <p className="font-semibold text-[var(--ink)]">No fixture candidates match</p>
          <p className="mt-2 text-sm text-[var(--muted)]">
            Clear the search to restore the demo records.
          </p>
        </div>
      )}

      <MakerDetailDrawer
        maker={selectedMaker}
        open={Boolean(selectedMaker)}
        onOpenChange={(next) => !next && setSelectedMaker(null)}
      />
    </div>
  );
}
