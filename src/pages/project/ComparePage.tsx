import {CircleAlert, Info, Scale, SlidersHorizontal} from 'lucide-react';
import {useMemo} from 'react';
import {useDemo} from '@/app/useDemo';
import {comparisonSummary, rankMakers} from '@/domain/comparison';
import {demoMakers} from '@/data/demo';
import type {RankingWeights} from '@/domain/types';
import {useTrackProductEvent} from '@/app/useTrackProductEvent';

const tierLabel = {
  eligible: 'Eligible',
  provisionally_unqualified: 'More evidence needed',
  hard_failure: 'Hard failure — fixture only',
};

export function ComparePage() {
  useTrackProductEvent('comparison_viewed');
  const {weights, setWeights} = useDemo();
  const comparisons = useMemo(() => rankMakers(demoMakers, weights), [weights]);
  const summary = comparisonSummary(comparisons);

  const updatePreferenceWeight = (preferenceFit: number) => {
    const remaining = 100 - preferenceFit;
    const evidenceCoverage = Math.round(remaining * 0.5);
    const commercialCompleteness = Math.round(remaining / 3);
    const leadTime = remaining - evidenceCoverage - commercialCompleteness;
    const next: RankingWeights = {
      preferenceFit,
      evidenceCoverage,
      commercialCompleteness,
      leadTime,
      price: 0,
    };
    setWeights(next);
  };

  return (
    <div className="workspace-page">
      <header className="page-heading-row">
        <div>
          <p className="page-kicker">Tier first, transparent weights second</p>
          <h2>Deterministic comparison</h2>
          <p>Eligibility, preferences, evidence, and commercial completeness remain separate.</p>
        </div>
        <div className="flex items-center gap-2 rounded-full bg-[var(--terracotta-soft)] px-3 py-2 text-xs font-semibold text-[var(--terracotta)]">
          <Scale className="size-4" /> Fictional records only
        </div>
      </header>

      <div className="mt-7 grid gap-6 xl:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="rounded-xl border border-[var(--border)] bg-[var(--surface-raised)] p-5">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-[var(--ink)]">
            <SlidersHorizontal className="size-4 text-[var(--terracotta)]" /> Ranking weights
          </h3>
          <p className="mt-2 text-xs leading-5 text-[var(--muted)]">
            Adjust preference emphasis. The remaining weights rebalance while totaling 100.
          </p>
          <label className="mt-6 block">
            <span className="flex items-center justify-between text-xs font-semibold text-[var(--ink-soft)]">
              <span>Preference fit</span>
              <strong className="tabular-nums text-[var(--ink)]">{weights.preferenceFit}%</strong>
            </span>
            <input
              type="range"
              min="20"
              max="60"
              step="5"
              value={weights.preferenceFit}
              onChange={(event) => updatePreferenceWeight(Number(event.target.value))}
              className="mt-3 w-full accent-[var(--terracotta)]"
            />
          </label>
          <dl className="mt-6 space-y-3 border-t border-[var(--border)] pt-5 text-xs">
            <WeightRow label="Evidence coverage" value={weights.evidenceCoverage} />
            <WeightRow label="Commercial completeness" value={weights.commercialCompleteness} />
            <WeightRow label="Lead time" value={weights.leadTime} />
            <WeightRow label="Price" value={weights.price} muted />
          </dl>
          <div className="mt-5 flex items-start gap-2 rounded-lg bg-[var(--surface)] p-3 text-[11px] leading-5 text-[var(--muted)]">
            <Info className="mt-0.5 size-3.5 shrink-0" /> Price is excluded because currencies and
            quote bases are not comparable.
          </div>
        </aside>

        <section className="min-w-0">
          <div
            className={`mb-5 border-l-2 px-4 py-2 ${summary.startsWith('No qualified') ? 'border-[var(--warning)]' : 'border-[var(--teal)]'}`}
          >
            <p className="font-semibold text-[var(--ink)]">{summary}</p>
            <p className="mt-1 text-xs text-[var(--muted)]">
              Unknown lead time earns zero points. Unknown preferences remain in the total
              denominator.
            </p>
          </div>
          <div className="comparison-table-wrap">
            <table className="comparison-table">
              <thead>
                <tr>
                  <th scope="col">Demonstration maker</th>
                  <th scope="col">Eligibility tier</th>
                  <th scope="col">Preference fit</th>
                  <th scope="col">Evidence</th>
                  <th scope="col">Commercial</th>
                  <th scope="col">Lead time</th>
                  <th scope="col">Within-tier score</th>
                </tr>
              </thead>
              <tbody>
                {comparisons.map((comparison) => {
                  const maker = demoMakers.find((item) => item.id === comparison.makerId);
                  return (
                    <tr key={comparison.makerId}>
                      <th scope="row">
                        <div className="flex items-center gap-3">
                          <img
                            src={maker?.visual}
                            alt=""
                            className="size-10 rounded-lg object-cover"
                          />
                          <div>
                            <span>{comparison.makerName}</span>
                            <small>{maker?.location}</small>
                          </div>
                        </div>
                      </th>
                      <td>
                        <span className={`tier-badge ${comparison.tier}`}>
                          {tierLabel[comparison.tier]}
                        </span>
                      </td>
                      <td>
                        <Metric
                          value={comparison.preferenceFit}
                          detail={`${comparison.knownPreferences}/${comparison.totalPreferences} answerable`}
                        />
                      </td>
                      <td>
                        <Metric
                          value={comparison.evidenceCoverage}
                          detail={`${comparison.evidencedRequirements}/${comparison.applicableRequirements} evidenced`}
                        />
                      </td>
                      <td>
                        <Metric
                          value={comparison.commercialCompleteness}
                          detail={`${comparison.commercialFieldsPresent}/8 fields`}
                        />
                      </td>
                      <td>
                        <Metric
                          value={comparison.leadTimeScore}
                          detail={
                            maker?.quote?.productionMaxDays
                              ? `${maker.quote.productionMaxDays} days max`
                              : 'Unknown · 0 points'
                          }
                        />
                      </td>
                      <td>
                        <strong className="text-lg tabular-nums text-[var(--ink)]">
                          {comparison.weightedScore}
                        </strong>
                        <small className="block text-[10px] text-[var(--muted)]">
                          within tier only
                        </small>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="mt-5 flex items-start gap-2 text-xs leading-5 text-[var(--muted)]">
            <CircleAlert className="mt-0.5 size-4 shrink-0 text-[var(--warning)]" /> Public
            identifiable real suppliers will not receive these grades or tiers. This decision
            surface uses fictional demonstration records only.
          </div>
        </section>
      </div>
    </div>
  );
}

function WeightRow({label, value, muted = false}: {label: string; value: number; muted?: boolean}) {
  return (
    <div
      className={`flex items-center justify-between ${muted ? 'text-[var(--muted)]' : 'text-[var(--ink-soft)]'}`}
    >
      <dt>{label}</dt>
      <dd className="font-semibold tabular-nums">{value}%</dd>
    </div>
  );
}

function Metric({value, detail}: {value: number; detail: string}) {
  return (
    <div>
      <strong className="tabular-nums text-[var(--ink)]">{value}%</strong>
      <div className="mt-1 h-1.5 w-20 overflow-hidden rounded-full bg-[var(--border)]">
        <span className="block h-full rounded-full bg-[var(--teal)]" style={{width: `${value}%`}} />
      </div>
      <small className="mt-1 block whitespace-nowrap text-[10px] text-[var(--muted)]">
        {detail}
      </small>
    </div>
  );
}
