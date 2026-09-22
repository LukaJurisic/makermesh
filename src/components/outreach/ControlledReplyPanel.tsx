import {useDemo} from '@/app/useDemo';

export function ControlledReplyPanel() {
  const {controlledReply: reply} = useDemo();
  if (!reply) return null;
  return (
    <section
      className="my-6 rounded-xl border border-[var(--border)] bg-[var(--surface-raised)] p-5"
      aria-label="Captured email result"
    >
      <p className="page-kicker">Example workshop · reply from our test inbox</p>
      <h3 className="mt-2 text-xl font-semibold text-[var(--ink)]">
        Atlas replied. Here is the original wording.
      </h3>
      <p className="mt-2 text-sm leading-6 text-[var(--ink-soft)]">
        Atlas is a fictional workshop. We sent and received this reply through our own test inboxes;
        it is not an offer from a real supplier.
      </p>
      <p role="status" className="mt-3 text-sm text-[var(--teal)]">
        Received and extracted ·{' '}
        {reply.evaluations.filter((item) => item.outcome === 'unknown').length}{' '}
        {reply.evaluations.filter((item) => item.outcome === 'unknown').length === 1
          ? 'requirement'
          : 'requirements'}{' '}
        still unknown
      </p>
      <p className="mt-2 text-xs text-[var(--muted)]">
        Captured{' '}
        {new Intl.DateTimeFormat('en-CA', {dateStyle: 'medium', timeStyle: 'short'}).format(
          new Date(reply.receivedAt),
        )}
        {' · '}Supplier statements only; no certification is inferred.
      </p>
      {reply.quote && (
        <dl className="mt-5 grid grid-cols-2 gap-x-5 gap-y-4 text-sm sm:grid-cols-3">
          <div>
            <dt className="text-[var(--muted)]">Unit price</dt>
            <dd className="mt-1 font-semibold">
              {reply.quote.unitPrice === undefined
                ? 'Unknown'
                : `${reply.quote.unitPrice} ${reply.quote.currency}`}
            </dd>
          </div>
          <div>
            <dt className="text-[var(--muted)]">Sample</dt>
            <dd className="mt-1 font-semibold">
              {reply.quote.samplePrice === undefined
                ? 'Unknown'
                : `${reply.quote.samplePrice} ${reply.quote.currency}`}
            </dd>
          </div>
          <div>
            <dt className="text-[var(--muted)]">Minimum order</dt>
            <dd className="mt-1 font-semibold">
              {reply.quote.moq === undefined ? 'Unknown' : `${reply.quote.moq} cups`}
            </dd>
          </div>
          <div>
            <dt className="text-[var(--muted)]">Production</dt>
            <dd className="mt-1 font-semibold">
              {reply.quote.productionMaxDays === undefined
                ? 'Unknown'
                : `${reply.quote.productionMinDays ?? '?'}–${reply.quote.productionMaxDays} days`}
            </dd>
          </div>
          <div>
            <dt className="text-[var(--muted)]">Quote basis</dt>
            <dd className="mt-1 font-semibold">{reply.quote.quoteBasis}</dd>
          </div>
          <div>
            <dt className="text-[var(--muted)]">Shipping included</dt>
            <dd className="mt-1 font-semibold">
              {reply.quote.shippingIncluded === undefined
                ? 'Unknown'
                : reply.quote.shippingIncluded
                  ? 'Yes'
                  : 'No'}
            </dd>
          </div>
        </dl>
      )}
      <details className="mt-4 border-t border-[var(--border)] pt-4">
        <summary className="cursor-pointer py-2 font-semibold text-[var(--ink)]">
          Read the original reply and quoted terms
        </summary>
        <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-[var(--ink-soft)]" lang="fr">
          {reply.originalText}
        </p>
        <dl className="mt-5 divide-y divide-[var(--border)]">
          {reply.evaluations.map((item) => (
            <div key={item.requirementKey} className="py-3">
              <dt className="font-semibold text-[var(--ink)]">
                {item.requirementLabel} · {item.outcome}
              </dt>
              <dd
                className="mt-1 text-sm leading-6 text-[var(--ink-soft)]"
                lang={item.supportingExcerpt ? 'fr' : 'en'}
              >
                {item.supportingExcerpt || 'No supported answer in this reply.'}
              </dd>
            </div>
          ))}
        </dl>
      </details>
    </section>
  );
}
