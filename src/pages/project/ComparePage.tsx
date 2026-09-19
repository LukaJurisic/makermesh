import {ArrowRight, FileSearch, SlidersHorizontal} from 'lucide-react';
import {useMemo, useState} from 'react';
import {Link} from 'react-router-dom';
import {useDemo} from '@/app/useDemo';
import {rankMakers} from '@/domain/comparison';
import {demoMakers} from '@/data/demo';
import {controlledReplyMaker} from '@/domain/controlledReply';
import {ControlledReplyPanel} from '@/components/outreach/ControlledReplyPanel';
import {ReplyImpact} from '@/components/outreach/ReplyImpact';
import {MakerDetailDrawer} from '@/components/makers/MakerDetailDrawer';
import {Drawer} from '@/components/ui/Drawer';
import {Button} from '@/components/ui/Button';
import {useTrackProductEvent} from '@/app/useTrackProductEvent';

const tierLabel = {
  eligible: 'Requirements met',
  provisionally_unqualified: 'More evidence needed',
  hard_failure: 'Requirement not met',
};
export function ComparePage() {
  useTrackProductEvent('comparison_viewed');
  const {weights, setWeights, controlledReply} = useDemo();
  const [replyOpen, setReplyOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const makers = useMemo(
    () => (controlledReply ? [controlledReplyMaker(controlledReply)] : demoMakers),
    [controlledReply],
  );
  const comparisons = useMemo(() => rankMakers(makers, weights), [makers, weights]);
  const unknowns = controlledReply?.evaluations.filter((item) => item.outcome === 'unknown') ?? [];
  const updateWeight = (preferenceFit: number) => {
    const remaining = 100 - preferenceFit;
    const evidenceCoverage = Math.round(remaining * 0.5);
    const commercialCompleteness = Math.round(remaining / 3);
    void setWeights({
      preferenceFit,
      evidenceCoverage,
      commercialCompleteness,
      leadTime: remaining - evidenceCoverage - commercialCompleteness,
      price: 0,
    });
  };
  const details = (id: string) => {
    if (controlledReply) setReplyOpen(true);
    else setSelectedId(id);
  };
  return (
    <div className="workspace-page">
      <header className="page-heading-row">
        <div>
          <p className="page-kicker">Your sourcing decision</p>
          <h2>Compare makers</h2>
          <p>Production details first. Evidence behind every decision.</p>
        </div>
        {controlledReply ? (
          <Button variant="secondary" onClick={() => setReplyOpen(true)}>
            <FileSearch size={16} />
            Read supplier reply
          </Button>
        ) : (
          <Button asChild variant="secondary">
            <Link to="/projects/harbour-coffee-lab/outreach">
              Review outreach
              <ArrowRight size={16} />
            </Link>
          </Button>
        )}
      </header>
      {controlledReply && (
        <ReplyImpact reply={controlledReply} onInspect={() => setReplyOpen(true)} />
      )}
      <div className="buyer-quote-intro">
        <div>
          <p className="font-semibold text-[var(--ink)]">
            {controlledReply ? 'One reply to review' : `${makers.length} example makers`}
          </p>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--muted)]">
            {controlledReply
              ? 'Captured email exchange · Atlas is fictional. Only this reply is included in the comparison.'
              : 'Fictional demonstration quotes. No captured email result is published.'}
          </p>
        </div>
        <span className="buyer-demo-label">Demo comparison</span>
      </div>
      {controlledReply && (
        <div className="comparison-open-question" role="status">
          <span className="buyer-status-dot" />
          <div>
            <strong>
              {unknowns.length
                ? `${unknowns.length} ${unknowns.length === 1 ? 'requirement' : 'requirements'} still unknown`
                : 'All requirements have evidence'}
            </strong>
            <p>
              {unknowns.map((item) => item.requirementLabel).join(' · ') ||
                'Review the supporting evidence before deciding.'}
            </p>
          </div>
          <button onClick={() => setReplyOpen(true)}>
            Inspect evidence
            <ArrowRight size={14} />
          </button>
        </div>
      )}
      <div className="comparison-controls">
        <SlidersHorizontal size={16} />
        <label>
          <span>
            Preference fit <strong>{weights.preferenceFit}%</strong>
          </span>
          <input
            aria-label="Preference fit"
            type="range"
            min="20"
            max="60"
            step="5"
            value={weights.preferenceFit}
            onChange={(e) => updateWeight(Number(e.target.value))}
          />
        </label>
        <details>
          <summary>How comparison works</summary>
          <p className="mt-3 leading-6">
            Requirements are evaluated first. Preference fit {weights.preferenceFit}%, evidence{' '}
            {weights.evidenceCoverage}%, commercial completeness {weights.commercialCompleteness}%,
            lead time {weights.leadTime}%. Unknowns earn no points. Price is excluded from ranking;
            currencies and quote bases are not assumed equivalent.
          </p>
        </details>
      </div>
      <div className="comparison-table-wrap buyer-comparison-table hidden md:block">
        <table className="comparison-table">
          <thead>
            <tr>
              <th scope="col">Maker</th>
              <th scope="col">Quote</th>
              <th scope="col">Production</th>
              <th scope="col">Requirements</th>
              <th scope="col">Preference fit</th>
              <th scope="col">Evidence</th>
              <th scope="col">
                <span className="sr-only">Details</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {comparisons.map((comparison) => {
              const maker = makers.find((m) => m.id === comparison.makerId)!;
              return (
                <tr key={maker.id}>
                  <th scope="row">
                    <div className="flex items-center gap-3">
                      <img src={maker.visual} alt="" className="size-12 rounded-lg object-cover" />
                      <div>
                        {maker.name}
                        <small>{maker.location}</small>
                      </div>
                    </div>
                  </th>
                  <td>
                    <strong>
                      {maker.quote?.unitPrice !== undefined
                        ? `${maker.quote.unitPrice} ${maker.quote.currency ?? ''}`
                        : 'Awaiting quote'}
                    </strong>
                    <small>
                      {maker.quote?.moq !== undefined
                        ? `MOQ ${maker.quote.moq} cups`
                        : 'MOQ unknown'}
                    </small>
                  </td>
                  <td>
                    {maker.quote?.productionMaxDays !== undefined
                      ? `${maker.quote.productionMaxDays} days max`
                      : 'Unknown'}
                    <small>{maker.quote?.quoteBasis ?? 'Basis unknown'}</small>
                  </td>
                  <td>
                    <span className={`tier-badge ${comparison.tier}`}>
                      {tierLabel[comparison.tier]}
                    </span>
                  </td>
                  <td>
                    <strong>{comparison.preferenceFit}%</strong>
                    <small>
                      {comparison.knownPreferences}/{comparison.totalPreferences} answerable
                    </small>
                  </td>
                  <td>
                    <strong>{comparison.evidenceCoverage}%</strong>
                    <small>
                      {comparison.evidencedRequirements}/{comparison.applicableRequirements}{' '}
                      evidenced
                    </small>
                  </td>
                  <td>
                    <button
                      className="comparison-detail-button"
                      onClick={() => details(maker.id)}
                      aria-label={`Inspect ${maker.name}`}
                    >
                      <ArrowRight size={18} />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="space-y-4 py-6 md:hidden">
        {comparisons.map((comparison) => {
          const maker = makers.find((m) => m.id === comparison.makerId)!;
          return (
            <article key={maker.id} className="comparison-mobile-record">
              <h3>{maker.name}</h3>
              <p>{tierLabel[comparison.tier]}</p>
              <dl>
                <div>
                  <dt>Unit price</dt>
                  <dd>
                    {maker.quote?.unitPrice !== undefined
                      ? `${maker.quote.unitPrice} ${maker.quote.currency ?? ''}`
                      : 'Unknown'}
                  </dd>
                </div>
                <div>
                  <dt>Minimum order</dt>
                  <dd>{maker.quote?.moq ?? 'Unknown'}</dd>
                </div>
                <div>
                  <dt>Production</dt>
                  <dd>
                    {maker.quote?.productionMaxDays !== undefined
                      ? `${maker.quote.productionMaxDays} days max`
                      : 'Unknown'}
                  </dd>
                </div>
                <div>
                  <dt>Evidence</dt>
                  <dd>{comparison.evidenceCoverage}%</dd>
                </div>
              </dl>
              <button onClick={() => details(maker.id)}>
                Read quote & evidence
                <ArrowRight size={15} />
              </button>
            </article>
          );
        })}
      </div>
      <p className="mt-5 text-xs leading-6 text-[var(--muted)]">
        All makers here are fictional. A supplier statement is not independent verification. Missing
        terms remain unknown; no landed cost is implied.
      </p>
      <Drawer
        open={replyOpen}
        onOpenChange={setReplyOpen}
        title="Supplier reply & evidence"
        description="Captured project-owned exchange with fictional Atlas Clay Studio."
        width="wide"
      >
        <div className="px-5">
          <ControlledReplyPanel />
        </div>
      </Drawer>
      <MakerDetailDrawer
        maker={makers.find((m) => m.id === selectedId) ?? null}
        open={!!selectedId}
        onOpenChange={(open) => {
          if (!open) setSelectedId(null);
        }}
      />
    </div>
  );
}
