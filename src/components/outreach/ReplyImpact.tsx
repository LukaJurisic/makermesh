import {ArrowRight} from 'lucide-react';
import type {ControlledReply} from '../../../convex/model/controlledReply';

export function ReplyImpact({reply, onInspect}: {reply: ControlledReply; onInspect: () => void}) {
  const evidenced = reply.evaluations.filter((e) => !!e.supportingExcerpt);
  const remaining = reply.evaluations.filter((e) => e.outcome === 'unknown');
  const changedPreferences = reply.evaluations.filter(
    (e) => e.type === 'soft' && e.outcome === 'fail',
  );
  return (
    <section className="reply-impact" aria-label="What the reply changed">
      <div>
        <p className="page-kicker">What changed with the reply</p>
        <h3>From unanswered questions to usable evidence.</h3>
        <p>
          Captured exchange with fictional Atlas. This compares the reply’s contribution, not a
          newly arriving email.
        </p>
      </div>
      <dl>
        <div>
          <dt>Requirements with reply evidence</dt>
          <dd>
            <span>0</span>
            <ArrowRight size={17} />
            <strong>{evidenced.length}</strong>
          </dd>
        </div>
        <div>
          <dt>Requirements still unknown</dt>
          <dd>
            <span>{reply.evaluations.length}</span>
            <ArrowRight size={17} />
            <strong>{remaining.length}</strong>
          </dd>
        </div>
        <div>
          <dt>Commercial detail</dt>
          <dd>
            <span>No reply quote</span>
            <ArrowRight size={17} />
            <strong>
              {reply.quote?.unitPrice !== undefined
                ? `${reply.quote.unitPrice} ${reply.quote.currency} / cup`
                : 'No priced quote'}
            </strong>
          </dd>
        </div>
      </dl>
      <p className="reply-impact-note">
        Before values represent this reply’s evidence being absent. Other research is not
        reconstructed.{' '}
        {changedPreferences.length > 0
          ? 'The reply also exposes an unmet preference; more evidence does not automatically mean a better fit.'
          : ''}
      </p>
      <button onClick={onInspect}>
        Inspect what changed
        <ArrowRight size={15} />
      </button>
    </section>
  );
}
