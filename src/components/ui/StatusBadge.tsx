import {Check, CircleHelp, Minus, Radio, X} from 'lucide-react';
import type {RequirementOutcome} from '@/domain/types';
import {cn} from '@/lib/cn';

const config = {
  pass: {label: 'Confirmed', icon: Check, className: 'bg-[var(--teal-soft)] text-[var(--teal)]'},
  fail: {label: 'Contradicted', icon: X, className: 'bg-[var(--danger-soft)] text-[var(--danger)]'},
  unknown: {label: 'Unknown', icon: CircleHelp, className: 'bg-[#ebe8e1] text-[var(--unknown)]'},
  not_applicable: {
    label: 'Not applicable',
    icon: Minus,
    className: 'bg-[#ebe8e1] text-[var(--muted)]',
  },
} satisfies Record<RequirementOutcome, {label: string; icon: typeof Check; className: string}>;

export function StatusBadge({
  status,
  compact = false,
}: {
  status: RequirementOutcome;
  compact?: boolean;
}) {
  const item = config[status];
  const Icon = item.icon;
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold',
        item.className,
      )}
    >
      <Icon className="size-3.5" aria-hidden="true" />
      {!compact && item.label}
      <span className="sr-only">{compact ? item.label : ''}</span>
    </span>
  );
}

export function FixtureBadge() {
  return (
    <span className="inline-flex items-center rounded-full border border-[var(--border-strong)] px-2.5 py-1 text-xs font-medium text-[var(--muted)]">
      Example record
    </span>
  );
}

export function CapturedResearchBadge() {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--teal-soft)] px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.08em] text-[var(--teal)]">
      <Radio className="size-3" aria-hidden="true" />
      Live research proof · fixture market
    </span>
  );
}
