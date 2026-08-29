import * as Dialog from '@radix-ui/react-dialog';
import {CalendarClock, ExternalLink, FileSearch, X} from 'lucide-react';
import {useEffect} from 'react';
import {Button} from '@/components/ui/Button';
import type {SourceEvidence} from '@/domain/types';
import {useDemo} from '@/app/useDemo';

export function EvidenceDialog({
  onOpenChange,
  open,
  source,
}: {
  onOpenChange: (open: boolean) => void;
  open: boolean;
  source: SourceEvidence | null;
}) {
  const {trackEvent} = useDemo();
  useEffect(() => {
    if (open && source) void trackEvent('evidence_opened');
  }, [open, source, trackEvent]);
  if (!source) return null;
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[60] bg-[#15130f]/45 backdrop-blur-[2px]" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-[70] max-h-[85vh] w-[calc(100%-2rem)] max-w-[680px] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl border border-[var(--border)] bg-[var(--surface-raised)] p-6 shadow-[0_30px_90px_rgba(29,29,26,0.24)] outline-none sm:p-8">
          <div className="flex items-start justify-between gap-6">
            <div>
              <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.1em] text-[var(--teal)]">
                <FileSearch className="size-4" />
                Evidence record
              </div>
              <Dialog.Title className="text-2xl font-semibold tracking-[-0.03em] text-[var(--ink)]">
                {source.title}
              </Dialog.Title>
              <Dialog.Description className="mt-2 text-sm text-[var(--muted)]">
                Exact supporting language retained with its source and observation time.
              </Dialog.Description>
            </div>
            <Dialog.Close asChild>
              <Button size="icon" variant="quiet" aria-label="Close evidence">
                <X className="size-5" />
              </Button>
            </Dialog.Close>
          </div>

          <blockquote className="mt-7 border-l-2 border-[var(--terracotta)] bg-[var(--terracotta-soft)]/45 px-5 py-4 font-serif text-[21px] leading-8 text-[var(--ink)]">
            “{source.excerpt}”
          </blockquote>

          <dl className="mt-7 grid gap-4 border-y border-[var(--border)] py-5 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--muted)]">
                Evidence state
              </dt>
              <dd className="mt-1 font-medium text-[var(--ink)]">
                {source.evidenceState === 'supplier_claimed'
                  ? 'Maker confirmed'
                  : 'Observed online'}
              </dd>
            </div>
            <div>
              <dt className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.08em] text-[var(--muted)]">
                <CalendarClock className="size-3.5" /> Observed
              </dt>
              <dd className="mt-1 font-medium text-[var(--ink)]">
                {new Intl.DateTimeFormat('en-CA', {dateStyle: 'medium'}).format(
                  new Date(source.observedAt),
                )}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--muted)]">
                Source type
              </dt>
              <dd className="mt-1 font-medium text-[var(--ink)]">
                {source.fixture ? 'Demonstration fixture' : source.sourceType.replace('_', ' ')}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--muted)]">
                Domain
              </dt>
              <dd className="mt-1 font-medium text-[var(--ink)]">{source.domain}</dd>
            </div>
          </dl>

          <div className="mt-6 flex items-center justify-between gap-4">
            <p className="text-xs leading-5 text-[var(--muted)]">
              An AI extraction is not itself evidence. This excerpt is the supporting record.
            </p>
            {source.fixture ? (
              <Button variant="secondary" disabled>
                Fixture source
              </Button>
            ) : (
              <Button asChild variant="secondary">
                <a href={source.url} target="_blank" rel="noreferrer">
                  Open source <ExternalLink className="size-4" />
                </a>
              </Button>
            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
