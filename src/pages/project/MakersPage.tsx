import {ArrowUpRight, Search} from 'lucide-react';
import {useMemo, useState} from 'react';
import {MakerDetailDrawer} from '@/components/makers/MakerDetailDrawer';
import {demoMakers} from '@/data/demo';
import {controlledReplyMaker} from '@/domain/controlledReply';
import {useDemo} from '@/app/useDemo';

export function MakersPage() {
  const {trackEvent, controlledReply} = useDemo();
  const [query, setQuery] = useState('');
  const [region, setRegion] = useState('all');
  const [status, setStatus] = useState('all');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const makers = useMemo(
    () =>
      controlledReply
        ? demoMakers.map((maker, index) =>
            index === 0 ? controlledReplyMaker(controlledReply) : maker,
          )
        : demoMakers,
    [controlledReply],
  );
  const locations = [...new Set(makers.map((m) => m.location))];
  const filtered = makers.filter(
    (maker) =>
      `${maker.name} ${maker.location} ${maker.capabilities.join(' ')}`
        .toLowerCase()
        .includes(query.toLowerCase()) &&
      (region === 'all' || maker.location === region) &&
      (status === 'all' || (status === 'quoted' ? !!maker.quote : !maker.quote)),
  );
  const selected = makers.find((m) => m.id === selectedId) ?? null;
  return (
    <div className="workspace-page">
      <header className="page-heading-row">
        <div>
          <p className="page-kicker">Your maker shortlist</p>
          <h2>Find the right fit.</h2>
          <p>
            Explore capabilities, compare production details, and see what still needs an answer.
          </p>
        </div>
        <span className="buyer-demo-label">Fictional demonstration makers</span>
      </header>
      <div className="maker-toolbar">
        <label className="maker-search">
          <Search size={17} />
          <span className="sr-only">Search makers</span>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search name, location, or capability"
          />
        </label>
        <label>
          <span className="sr-only">Maker location</span>
          <select value={region} onChange={(e) => setRegion(e.target.value)}>
            <option value="all">All locations</option>
            {locations.map((location) => (
              <option key={location}>{location}</option>
            ))}
          </select>
        </label>
        <label>
          <span className="sr-only">Quote availability</span>
          <select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="all">All makers</option>
            <option value="quoted">Quote available</option>
            <option value="awaiting">Awaiting quote</option>
          </select>
        </label>
      </div>
      <p className="maker-count" role="status">
        {filtered.length} {filtered.length === 1 ? 'maker' : 'makers'}
        {query || region !== 'all' || status !== 'all'
          ? ' matching your filters'
          : ' in this example project'}{' '}
        · Select a maker to inspect its evidence
      </p>
      <div className="maker-directory">
        <div className="directory-head" aria-hidden="true">
          <span>Maker / location</span>
          <span>Minimum order</span>
          <span>Production time</span>
          <span className="directory-evidence">Evidence</span>
          <span />
        </div>
        {filtered.map((maker) => (
          <button
            key={maker.id}
            className="directory-row"
            aria-label={`Open ${maker.name}`}
            onClick={() => {
              setSelectedId(maker.id);
              void trackEvent('supplier_inspected');
            }}
          >
            <span className="directory-identity">
              <img src={maker.visual} alt="" />
              <span>
                <strong>{maker.name}</strong>
                <small>{maker.location}</small>
                <small>
                  {maker.fixture ? 'Example maker record' : 'Captured reply · fictional supplier'}
                </small>
              </span>
            </span>
            <span className="directory-fact">
              <span className="mobile-label">Minimum order</span>
              {maker.quote?.moq !== undefined ? `${maker.quote.moq} cups` : 'Not yet known'}
              <small>
                {maker.quote?.unitPrice !== undefined
                  ? `${maker.quote.unitPrice} ${maker.quote.currency ?? ''} / cup`
                  : 'Quote needed'}
              </small>
            </span>
            <span className="directory-fact">
              <span className="mobile-label">Production time</span>
              {maker.quote?.productionMaxDays !== undefined
                ? `${maker.quote.productionMinDays ?? 'Up to'}${maker.quote.productionMinDays !== undefined ? '–' : ' '}${maker.quote.productionMaxDays} days`
                : 'Not yet known'}
              <small>
                {maker.openQuestionCount} open{' '}
                {maker.openQuestionCount === 1 ? 'question' : 'questions'}
              </small>
            </span>
            <span className="directory-proof directory-evidence">
              {maker.sources.length} evidence records
            </span>
            <ArrowUpRight size={18} className="directory-arrow" />
          </button>
        ))}
      </div>
      {filtered.length === 0 && (
        <div className="py-16 text-center">
          <h3 className="font-serif text-3xl">No makers match yet.</h3>
          <p className="mt-3 text-sm text-[var(--muted)]">
            Try another name or broaden your filters.
          </p>
          <button
            className="mt-5 text-sm font-semibold text-[var(--terracotta-contrast)]"
            onClick={() => {
              setQuery('');
              setRegion('all');
              setStatus('all');
            }}
          >
            Clear filters
          </button>
        </div>
      )}
      <MakerDetailDrawer
        maker={selected}
        open={!!selected}
        onOpenChange={(open) => {
          if (!open) setSelectedId(null);
        }}
      />
    </div>
  );
}
