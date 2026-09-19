import {useDemo} from '@/app/useDemo';
import {Drawer} from '@/components/ui/Drawer';
import {SystemPulse} from './SystemPulse';

export function AboutDemoDrawer({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const {baselineLabel, controlledReply, metrics} = useDemo();
  return (
    <Drawer
      open={open}
      onOpenChange={onOpenChange}
      title="About this demo"
      description="A fictional sourcing project, with transparent evidence of what actually ran."
    >
      <div className="demo-about">
        <section className="p-6 sm:p-8">
          <p className="page-kicker">Harbour Coffee Lab · Toronto</p>
          <h3 className="mt-3 font-serif text-3xl">200 cups. One sourcing journey.</h3>
          <p className="mt-4 text-sm leading-7 text-[var(--ink-soft)]">
            The café, makers, and product imagery are fictional. You can review the brief, explore
            example makers, rehearse an approval, and inspect the evidence. Demo buttons do not send
            email.
          </p>
          <p className="mt-3 text-sm leading-7 text-[var(--ink-soft)]">
            {controlledReply
              ? 'Atlas’s separately labelled reply was sent between project-owned inboxes through AgentMail, extracted by OpenAI, and evaluated by deterministic rules. It is a real email exchange about a fictional supplier, not a supplier endorsement.'
              : 'The email and comparison journey currently uses demonstration fixtures. No published captured reply is available.'}
          </p>
          <details className="mt-5 border-y border-[var(--border)] py-4">
            <summary className="cursor-pointer text-sm font-semibold">
              Data and research provenance
            </summary>
            <p className="mt-3 text-sm leading-6 text-[var(--muted)]">{baselineLabel}</p>
            <p className="mt-3 text-sm text-[var(--muted)]">
              Fixture market: {metrics.makers} makers · {metrics.sources} sources · {metrics.claims}{' '}
              claims. These totals are not live search results.
            </p>
          </details>
          <p className="mt-5 text-sm leading-6 text-[var(--muted)]">
            Convex runs the database, functions, and realtime state. OpenAI structures information,
            Firecrawl researches public sources, and AgentMail carries approved email.
          </p>
        </section>
        <SystemPulse />
      </div>
    </Drawer>
  );
}
