import * as Tabs from '@radix-ui/react-tabs';
import {ExternalLink, FileSearch, Languages, MapPin, ShieldQuestion} from 'lucide-react';
import {useRef, useState} from 'react';
import {Drawer} from '@/components/ui/Drawer';
import {Button} from '@/components/ui/Button';
import {FixtureBadge, StatusBadge} from '@/components/ui/StatusBadge';
import {EvidenceDialog} from '@/components/evidence/EvidenceDialog';
import type {Maker, SourceEvidence} from '@/domain/types';

export function MakerDetailDrawer({
  maker,
  onOpenChange,
  open,
}: {
  maker: Maker | null;
  onOpenChange: (open: boolean) => void;
  open: boolean;
}) {
  const [selectedEvidence, setSelectedEvidence] = useState<SourceEvidence | null>(null);
  const evidenceTriggerRef = useRef<HTMLElement | null>(null);
  if (!maker) return null;

  return (
    <>
      <Drawer
        open={open}
        onOpenChange={onOpenChange}
        title={maker.name}
        description="Project-specific maker record with claim-level evidence."
        width="wide"
      >
        <div className="relative h-52 overflow-hidden bg-[var(--surface)]">
          <img
            src={maker.visual}
            alt="Illustrative MakerMesh ceramic study"
            className="h-full w-full object-cover"
          />
          <div className="absolute left-6 top-5">
            <FixtureBadge />
          </div>
        </div>
        <div className="px-6 py-6 sm:px-8">
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-[var(--muted)]">
            <span className="inline-flex items-center gap-1.5">
              <MapPin className="size-4" /> {maker.location}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Languages className="size-4" /> {maker.languages.join(', ') || 'Unknown'}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <ShieldQuestion className="size-4" /> {maker.openQuestionCount} open questions
            </span>
          </div>
          <p className="mt-4 max-w-[65ch] text-[15px] leading-7 text-[var(--ink-soft)]">
            {maker.summary}
          </p>

          <Tabs.Root defaultValue="fit" className="mt-7">
            <Tabs.List
              className="flex gap-5 overflow-x-auto border-b border-[var(--border)]"
              aria-label="Maker record sections"
            >
              {['fit', 'capabilities', 'sources', 'quote'].map((tab) => (
                <Tabs.Trigger key={tab} value={tab} className="record-tab capitalize">
                  {tab}
                </Tabs.Trigger>
              ))}
            </Tabs.List>

            <Tabs.Content value="fit" className="py-5 outline-none">
              <div className="divide-y divide-[var(--border)] border-y border-[var(--border)]">
                {maker.evaluations.map((evaluation) => (
                  <div
                    key={evaluation.requirementKey}
                    className="grid gap-3 py-4 sm:grid-cols-[1fr_auto] sm:items-center"
                  >
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-semibold text-[var(--ink)]">
                          {evaluation.requirementLabel}
                        </p>
                        {evaluation.type === 'hard' && (
                          <span className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--terracotta)]">
                            Hard
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-xs leading-5 text-[var(--muted)]">
                        {evaluation.displayValue}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusBadge status={evaluation.outcome} />
                      {evaluation.evidenceId && (
                        <Button
                          size="sm"
                          variant="quiet"
                          onClick={(event) => {
                            evidenceTriggerRef.current = event.currentTarget;
                            setSelectedEvidence(
                              maker.sources.find((item) => item.id === evaluation.evidenceId) ??
                                null,
                            );
                          }}
                        >
                          <FileSearch className="size-3.5" /> Evidence
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </Tabs.Content>

            <Tabs.Content value="capabilities" className="py-5 outline-none">
              <div className="grid gap-3 sm:grid-cols-2">
                {maker.capabilities.map((capability) => (
                  <div
                    key={capability}
                    className="border-b border-[var(--border)] py-3 text-sm font-medium text-[var(--ink)]"
                  >
                    {capability}
                  </div>
                ))}
              </div>
              <p className="mt-6 text-xs leading-5 text-[var(--muted)]">
                Capabilities describe the fixture evidence available for this project. They are not
                verification or endorsement.
              </p>
            </Tabs.Content>

            <Tabs.Content value="sources" className="py-5 outline-none">
              <div className="space-y-3">
                {maker.sources.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={(event) => {
                      evidenceTriggerRef.current = event.currentTarget;
                      setSelectedEvidence(item);
                    }}
                    className="source-row w-full text-left"
                  >
                    <div>
                      <p className="text-sm font-semibold text-[var(--ink)]">{item.title}</p>
                      <p className="mt-1 line-clamp-2 text-xs leading-5 text-[var(--muted)]">
                        {item.excerpt}
                      </p>
                    </div>
                    <ExternalLink className="size-4 text-[var(--muted)]" />
                  </button>
                ))}
              </div>
            </Tabs.Content>

            <Tabs.Content value="quote" className="py-5 outline-none">
              {maker.quote ? (
                <dl className="grid gap-5 sm:grid-cols-2">
                  <QuoteField
                    label="Unit price"
                    value={`${maker.quote.unitPrice} ${maker.quote.currency}`}
                  />
                  <QuoteField label="Quote basis" value={maker.quote.quoteBasis ?? 'Unknown'} />
                  <QuoteField label="MOQ" value={`${maker.quote.moq} units`} />
                  <QuoteField
                    label="Production"
                    value={`${maker.quote.productionMinDays}–${maker.quote.productionMaxDays} days`}
                  />
                  <QuoteField
                    label="Sample"
                    value={`${maker.quote.samplePrice} ${maker.quote.currency}`}
                  />
                  <QuoteField
                    label="Shipping"
                    value={maker.quote.shippingIncluded ? 'Included' : 'Not included'}
                  />
                  <QuoteField label="Payment terms" value={maker.quote.paymentTerms ?? 'Unknown'} />
                </dl>
              ) : (
                <div className="border-l-2 border-[var(--unknown)] py-2 pl-4">
                  <p className="font-semibold text-[var(--ink)]">No structured quote</p>
                  <p className="mt-1 text-sm text-[var(--muted)]">
                    Commercial terms remain unknown.
                  </p>
                </div>
              )}
            </Tabs.Content>
          </Tabs.Root>
        </div>
      </Drawer>
      <EvidenceDialog
        open={Boolean(selectedEvidence)}
        onOpenChange={(next) => !next && setSelectedEvidence(null)}
        returnFocusRef={evidenceTriggerRef}
        source={selectedEvidence}
      />
    </>
  );
}

function QuoteField({label, value}: {label: string; value: string}) {
  return (
    <div className="border-b border-[var(--border)] pb-4">
      <dt className="text-xs font-medium text-[var(--muted)]">{label}</dt>
      <dd className="mt-1 text-base font-semibold tabular-nums text-[var(--ink)]">{value}</dd>
    </div>
  );
}
