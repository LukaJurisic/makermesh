import {useMemo, useState} from 'react';
import type {ControlledReply} from '../../../convex/model/controlledReply';
import {
  DEFAULT_PRODUCTION_DAYS,
  DEFAULT_QUANTITY,
  evaluateDecisionScenario,
  formatDecisionBrief,
  type DecisionScenarioReady,
} from '@/domain/decisionScenario';
import '@/styles/decision-scenario.css';

const ORIGINAL_QUANTITY = String(DEFAULT_QUANTITY);
const ORIGINAL_DAYS = String(DEFAULT_PRODUCTION_DAYS);
const SHORT_DAYS = '30';

type DecisionScenarioProps = {
  reply: ControlledReply | null | undefined;
  onInspect: () => void;
};

function statusLabel(status: DecisionScenarioReady['timingOutcome'], quantityChanged: boolean) {
  if (status === 'pass') return 'Fits your production window';
  if (status === 'fail') return 'Ask about a faster turnaround';
  return quantityChanged
    ? 'Confirm the timing for this quantity'
    : 'Production timing not confirmed';
}

function formatCost(ready: DecisionScenarioReady) {
  if (ready.productCost === null) return 'Unknown';
  return `${ready.productCost.toLocaleString('en-CA')} MAD`;
}

export function DecisionScenario({reply, onInspect}: DecisionScenarioProps) {
  const [quantity, setQuantity] = useState(ORIGINAL_QUANTITY);
  const [productionDays, setProductionDays] = useState(ORIGINAL_DAYS);
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'failed'>('idle');
  const [downloadState, setDownloadState] = useState<'idle' | 'downloaded' | 'failed'>('idle');

  const result = useMemo(() => {
    if (reply === undefined) return {status: 'loading' as const};
    if (reply === null) return {status: 'unavailable' as const};
    return evaluateDecisionScenario(reply, {quantity, productionDays});
  }, [productionDays, quantity, reply]);

  const ready = result.status === 'ready' ? result : null;
  const controlsDisabled = result.status === 'loading' || result.status === 'unavailable';
  const quantityError = result.status === 'invalid' ? result.errors.quantity : undefined;
  const daysError = result.status === 'invalid' ? result.errors.productionDays : undefined;
  const questions = ready?.questions || '';
  const briefText = useMemo(() => {
    if (!ready) return '';
    try {
      return formatDecisionBrief(ready);
    } catch {
      return '';
    }
  }, [ready]);

  const copyQuestions = async () => {
    if (!ready || !questions) return;
    try {
      await navigator.clipboard.writeText(questions);
      setCopyState('copied');
    } catch {
      setCopyState('failed');
    }
  };

  const downloadBrief = () => {
    if (!ready) return;
    try {
      if (!briefText) throw new Error('Decision brief is unavailable');
      const blob = new Blob([briefText], {type: 'text/markdown;charset=utf-8'});
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = 'makermesh-sourcing-decision-brief.md';
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      setDownloadState('downloaded');
    } catch {
      setDownloadState('failed');
    }
  };

  const updateQuantity = (value: string) => {
    setQuantity(value);
    setCopyState('idle');
    setDownloadState('idle');
  };

  const updateDays = (value: string) => {
    setProductionDays(value);
    setCopyState('idle');
    setDownloadState('idle');
  };

  return (
    <section
      className="decision-scenario"
      aria-label="Purchasing decision scenario"
      data-testid="decision-scenario"
    >
      <header className="decision-scenario__header">
        <p className="page-kicker">Example workshop · reply from our test inbox</p>
        <h2 id="decision-scenario-title">Will this order work for you?</h2>
        <p className="decision-scenario__context">
          {ORIGINAL_QUANTITY} cups · original brief limit: {ORIGINAL_DAYS} production days
        </p>
      </header>

      <div className="decision-scenario__workspace">
        <section className="decision-scenario__inputs" aria-label="Production requirement">
          <div className="decision-scenario__field">
            <label htmlFor="decision-production-days">
              Maximum production days after sample approval
            </label>
            <input
              id="decision-production-days"
              inputMode="numeric"
              pattern="[0-9]*"
              value={productionDays}
              onChange={(event) => updateDays(event.target.value)}
              disabled={controlsDisabled}
              aria-invalid={Boolean(daysError)}
              aria-describedby={daysError ? 'decision-production-days-error' : 'decision-days-help'}
            />
            <p className="decision-scenario__help" id="decision-days-help">
              Set the requested maximum after sample approval.
            </p>
            {daysError && (
              <p className="decision-scenario__error" id="decision-production-days-error">
                {daysError}
              </p>
            )}
          </div>
          <div className="decision-scenario__input-actions">
            <button
              type="button"
              className="decision-scenario__button decision-scenario__button--primary"
              onClick={() => updateDays(SHORT_DAYS)}
              disabled={controlsDisabled}
            >
              Try 30 days
            </button>
            <button
              type="button"
              className="decision-scenario__button decision-scenario__button--primary"
              onClick={() => updateQuantity('400')}
              disabled={controlsDisabled}
            >
              Try 400 cups
            </button>
            <button
              type="button"
              className="decision-scenario__button decision-scenario__button--quiet"
              onClick={() => {
                updateQuantity(ORIGINAL_QUANTITY);
                updateDays(ORIGINAL_DAYS);
              }}
              disabled={controlsDisabled}
            >
              Reset to original brief
            </button>
          </div>
        </section>

        {result.status === 'loading' && (
          <p className="decision-scenario__state">Loading the reply…</p>
        )}
        {result.status === 'unavailable' && (
          <p className="decision-scenario__state">Captured reply unavailable.</p>
        )}

        {ready && (
          <>
            <section
              className={`decision-scenario__consequence decision-scenario__consequence--${ready.timingOutcome}`}
              aria-live="polite"
            >
              <p className="decision-scenario__eyebrow">Order fit</p>
              <h3>{statusLabel(ready.timingOutcome, ready.quantityChanged)}</h3>
              <p>
                {ready.timingOutcome === 'pass'
                  ? `The quoted range fits your ${ready.productionDays}-day limit.`
                  : ready.timingOutcome === 'fail'
                    ? `The quoted range runs past your ${ready.productionDays}-day limit.`
                    : ready.quantityChanged
                      ? `The reply does not confirm timing for ${ready.quantity} cups.`
                      : 'Production timing not confirmed.'}
              </p>
            </section>

            <section className="decision-scenario__evidence" aria-labelledby="decision-quote-title">
              <div className="decision-scenario__section-heading">
                <div>
                  <p className="decision-scenario__eyebrow">Quoted terms</p>
                  <h3 id="decision-quote-title">What the supplier wrote</h3>
                </div>
                <button
                  type="button"
                  className="decision-scenario__text-button"
                  onClick={onInspect}
                >
                  Read original reply
                </button>
              </div>
              {ready.timingExcerpt ? (
                <blockquote lang="fr">“{ready.timingExcerpt}”</blockquote>
              ) : (
                <p className="decision-scenario__unconfirmed">
                  No exact timing excerpt is available in this reply.
                </p>
              )}
              <p lang="en">
                {ready.timingAfterSampleApproval
                  ? 'The production timing is counted after sample approval.'
                  : 'Timing start condition unconfirmed.'}
              </p>
              <p className="decision-scenario__fine-print">
                This limit covers production after sample approval. It does not set a sample
                preparation, shipping or customs deadline.
              </p>
              <dl className="decision-scenario__commercial">
                <div>
                  <dt>
                    {ready.quantityChanged
                      ? 'Illustrative product cost using the original unit rate'
                      : 'Product cost at the quoted unit rate'}
                  </dt>
                  <dd>{formatCost(ready)}</dd>
                </div>
                <div>
                  <dt>Minimum order condition</dt>
                  <dd>
                    {ready.moqOutcome === 'pass'
                      ? 'Meets stated minimum'
                      : ready.moqOutcome === 'fail'
                        ? 'Below quoted minimum'
                        : 'Unknown'}
                  </dd>
                </div>
                <div>
                  <dt>Original unit price · {ready.quote.quoteBasis}</dt>
                  <dd>
                    {ready.quote.unitPrice === undefined
                      ? 'Unknown'
                      : `${ready.quote.unitPrice} MAD / cup`}
                  </dd>
                </div>
                <div>
                  <dt>Sample · quoted separately</dt>
                  <dd>
                    {ready.quote.samplePrice === undefined
                      ? 'Unknown'
                      : `${ready.quote.samplePrice} MAD`}
                  </dd>
                </div>
                <div>
                  <dt>Original production range · 200 cups</dt>
                  <dd>
                    {ready.quote.productionMaxDays === undefined
                      ? 'Unknown'
                      : `${ready.quote.productionMinDays ?? '?'}–${ready.quote.productionMaxDays} days`}
                    {ready.timingAfterSampleApproval
                      ? ' after sample approval'
                      : ' · start unconfirmed'}
                  </dd>
                </div>
              </dl>
              <p className="decision-scenario__fine-print">
                Product cost only, not a delivered total. Shipping is{' '}
                {ready.quote.shippingIncluded === false
                  ? 'excluded'
                  : ready.quote.shippingIncluded === true
                    ? 'stated as included'
                    : 'unconfirmed'}
                . Customs, taxes and duties are not calculated here.
              </p>
            </section>

            {ready.quantityChanged && (
              <aside
                className="decision-scenario__reconfirm"
                aria-label="Quantity reconfirmation required"
              >
                <p className="decision-scenario__eyebrow">Quantity changed</p>
                <h3>A revised quote is needed.</h3>
                <p>
                  This reply priced {ORIGINAL_QUANTITY} cups. The requested quantity has changed;
                  unit price, capacity and production timing need supplier reconfirmation.
                </p>
              </aside>
            )}

            <section
              className="decision-scenario__questions"
              aria-labelledby="decision-questions-title"
            >
              <p className="decision-scenario__eyebrow">Next action</p>
              <h3 id="decision-questions-title">Questions for the workshop</h3>
              <p className="decision-scenario__question-copy">
                {questions || 'No clarification draft is available for this reply.'}
              </p>
              <div className="decision-scenario__actions">
                <button
                  type="button"
                  className="decision-scenario__button decision-scenario__button--primary"
                  onClick={copyQuestions}
                >
                  {copyState === 'copied' ? 'Questions copied' : 'Copy questions'}
                </button>
                <button
                  type="button"
                  className="decision-scenario__button decision-scenario__button--secondary"
                  onClick={downloadBrief}
                >
                  {downloadState === 'downloaded' ? 'Download requested' : 'Save order notes'}
                </button>
              </div>
              {(copyState === 'failed' || downloadState === 'failed') && (
                <p className="decision-scenario__fallback" role="status">
                  Your browser blocked this action. Select the text above to copy it manually.
                </p>
              )}
              {downloadState === 'failed' && briefText && (
                <textarea
                  className="decision-scenario__export-fallback"
                  readOnly
                  value={briefText}
                  aria-label="Order notes text"
                />
              )}
            </section>
          </>
        )}
        {reply && result.status !== 'loading' && result.status !== 'unavailable' && (
          <details className="decision-scenario__details">
            <summary>Explore a different quantity</summary>
            <div className="decision-scenario__details-content">
              <div className="decision-scenario__field">
                <label htmlFor="decision-quantity">Requested quantity</label>
                <input
                  id="decision-quantity"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={quantity}
                  onChange={(event) => updateQuantity(event.target.value)}
                  aria-invalid={Boolean(quantityError)}
                  aria-describedby={quantityError ? 'decision-quantity-error' : undefined}
                />
                {quantityError && (
                  <p className="decision-scenario__error" id="decision-quantity-error">
                    {quantityError}
                  </p>
                )}
              </div>
            </div>
          </details>
        )}
      </div>
    </section>
  );
}
