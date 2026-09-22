import {AlertTriangle, Check, Languages, LockKeyhole, Mail, ShieldCheck} from 'lucide-react';
import {useState} from 'react';
import {Drawer} from '@/components/ui/Drawer';
import {Button} from '@/components/ui/Button';
import {FixtureBadge} from '@/components/ui/StatusBadge';
import {outreachDraft} from '@/data/demo';
import {useDemo} from '@/app/useDemo';

export function OutreachDrawer({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const {approveOutreach, outreachApproved} = useDemo();
  const [language, setLanguage] = useState<'english' | 'french'>('english');
  const [confirmed, setConfirmed] = useState(false);

  const approve = () => {
    if (!confirmed) return;
    approveOutreach();
  };

  return (
    <Drawer
      open={open}
      onOpenChange={onOpenChange}
      title="Review your message"
      description="Check the recipient and read the English and French versions. This example does not send email."
      width="wide"
    >
      <div className="px-6 py-6 sm:px-8">
        <div className="flex flex-wrap items-center gap-2">
          <FixtureBadge />
          <span className="rounded-full bg-[var(--teal-soft)] px-2.5 py-1 text-xs font-semibold text-[var(--teal)]">
            Test inbox only
          </span>
        </div>

        <section className="mt-6 border-y border-[var(--border)] py-5">
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--muted)]">
                Recipient
              </p>
              <p className="mt-1.5 text-sm font-semibold text-[var(--ink)]">
                {outreachDraft.recipient}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--muted)]">
                Recipient source
              </p>
              <p className="mt-1.5 text-sm font-semibold text-[var(--ink)]">
                {outreachDraft.recipientSource}
              </p>
            </div>
          </div>
          <div className="mt-5 flex items-start gap-3 rounded-xl bg-[var(--ochre-soft)] p-4 text-sm leading-6 text-[var(--warning)]">
            <AlertTriangle className="mt-0.5 size-5 shrink-0" />
            <p>Practice reviewing a message here. No email is sent from this example.</p>
          </div>
        </section>

        <section className="mt-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-semibold text-[var(--ink)]">Message</h3>
              <p className="mt-1 text-xs text-[var(--muted)]">
                Sender: MakerMesh on behalf of Harbour Coffee Lab
              </p>
            </div>
            <div className="inline-flex rounded-lg border border-[var(--border)] bg-[var(--surface)] p-1">
              {(['english', 'french'] as const).map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setLanguage(item)}
                  className={`rounded-md px-3 py-1.5 text-xs font-semibold capitalize transition-colors ${language === item ? 'bg-white text-[var(--ink)] shadow-sm' : 'text-[var(--muted)]'}`}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>
          <div className="mt-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5">
            <p className="border-b border-[var(--border)] pb-4 text-sm font-semibold text-[var(--ink)]">
              {outreachDraft.subject}
            </p>
            <p
              dir="auto"
              className="mt-4 whitespace-pre-line text-sm leading-6 text-[var(--ink-soft)]"
            >
              {language === 'english' ? outreachDraft.english : outreachDraft.french}
            </p>
          </div>
        </section>

        <section className="mt-7">
          <h3 className="flex items-center gap-2 text-base font-semibold text-[var(--ink)]">
            <Languages className="size-4 text-[var(--teal)]" /> Exact questions
          </h3>
          <ol className="mt-3 divide-y divide-[var(--border)] border-y border-[var(--border)]">
            {outreachDraft.questions.map((question, index) => (
              <li
                key={question}
                className="flex gap-3 py-3.5 text-sm leading-6 text-[var(--ink-soft)]"
              >
                <span className="font-semibold tabular-nums text-[var(--terracotta)]">
                  {index + 1}.
                </span>
                {question}
              </li>
            ))}
          </ol>
        </section>

        <label className="mt-7 flex cursor-pointer items-start gap-3 rounded-xl border border-[var(--border-strong)] p-4">
          <input
            type="checkbox"
            checked={confirmed}
            onChange={(event) => setConfirmed(event.target.checked)}
            className="mt-1 size-4 accent-[var(--teal)]"
          />
          <span>
            <span className="block text-sm font-semibold text-[var(--ink)]">
              I reviewed the recipient and both message versions.
            </span>
            <span className="mt-1 block text-xs leading-5 text-[var(--muted)]">
              Approval applies only to this controlled demonstration draft and does not authorize a
              real supplier contact.
            </span>
          </span>
        </label>

        <div className="mt-6 flex flex-col-reverse gap-3 border-t border-[var(--border)] pt-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 text-xs text-[var(--muted)]">
            <LockKeyhole className="size-4" /> Real outreach locked by default
          </div>
          <Button onClick={approve} disabled={!confirmed || outreachApproved}>
            {outreachApproved ? (
              <>
                <Check className="size-4" /> Approved in fixture
              </>
            ) : (
              <>
                <ShieldCheck className="size-4" /> Approve controlled draft
              </>
            )}
          </Button>
        </div>
      </div>
    </Drawer>
  );
}

export function DeliveryTimeline() {
  const {outreachApproved, replyApplied, applyReply} = useDemo();
  const items = [
    {label: 'Draft reviewed', complete: outreachApproved},
    {label: 'Queued', complete: outreachApproved},
    {label: 'Sent', complete: outreachApproved},
    {label: 'Delivered', complete: outreachApproved},
    {label: 'Replied', complete: replyApplied},
  ];
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-raised)] p-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="flex items-center gap-2 text-sm font-semibold text-[var(--ink)]">
            <Mail className="size-4 text-[var(--terracotta)]" /> Controlled demo thread
          </p>
          <p className="mt-1 text-xs text-[var(--muted)]">
            No provider call is made by this fixture control.
          </p>
        </div>
        {outreachApproved && !replyApplied && (
          <Button size="sm" variant="secondary" onClick={applyReply}>
            Apply fixture reply
          </Button>
        )}
      </div>
      <ol className="mt-5 grid grid-cols-5 gap-1">
        {items.map((item, index) => (
          <li key={item.label} className="relative">
            <div
              className={`h-1 rounded-full ${item.complete ? 'bg-[var(--teal)]' : 'bg-[var(--border)]'}`}
            />
            <p
              className={`mt-2 text-[10px] font-semibold ${item.complete ? 'text-[var(--teal)]' : 'text-[var(--muted)]'}`}
            >
              {item.label}
            </p>
            <span className="sr-only">
              Step {index + 1} of {items.length}
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}
