import {v} from 'convex/values';

export const projectStatusValidator = v.union(
  v.literal('draft'),
  v.literal('brief_ready'),
  v.literal('researching'),
  v.literal('reviewing_candidates'),
  v.literal('outreach_ready'),
  v.literal('awaiting_replies'),
  v.literal('comparing'),
  v.literal('selected'),
  v.literal('archived'),
  v.literal('error'),
);

export const dataModeValidator = v.union(v.literal('live'), v.literal('demo_baseline'));

export const projectStageValidator = v.union(
  v.literal('brief'),
  v.literal('research'),
  v.literal('makers'),
  v.literal('outreach'),
  v.literal('compare'),
  v.literal('passport'),
);

export const outcomeValidator = v.union(
  v.literal('pass'),
  v.literal('fail'),
  v.literal('unknown'),
  v.literal('not_applicable'),
);

export const claimStatusValidator = v.union(
  v.literal('confirmed'),
  v.literal('contradicted'),
  v.literal('unknown'),
  v.literal('not_applicable'),
);

export const evidenceStateValidator = v.union(
  v.literal('public_source'),
  v.literal('supplier_claimed'),
  v.literal('document_supported'),
  v.literal('independently_verified'),
  v.literal('buyer_confirmed'),
  v.literal('expired'),
  v.literal('unknown'),
);

export const discoveryStatusValidator = v.union(
  v.literal('queued'),
  v.literal('searching'),
  v.literal('crawling'),
  v.literal('extracting'),
  v.literal('deduplicating'),
  v.literal('completed'),
  v.literal('partially_completed'),
  v.literal('failed'),
  v.literal('cancelled'),
);

export const outreachStatusValidator = v.union(
  v.literal('draft'),
  v.literal('approved'),
  v.literal('queued'),
  v.literal('sent'),
  v.literal('delivered'),
  v.literal('bounced'),
  v.literal('replied'),
  v.literal('failed'),
  v.literal('cancelled'),
);

export const operationStatusValidator = v.union(
  v.literal('queued'),
  v.literal('running'),
  v.literal('completed'),
  v.literal('failed'),
  v.literal('cancelled'),
);

export const rankingWeightsValidator = v.object({
  preferenceFit: v.number(),
  evidenceCoverage: v.number(),
  commercialCompleteness: v.number(),
  leadTime: v.number(),
  price: v.number(),
});

export const quoteBasisValidator = v.union(
  v.literal('EXW'),
  v.literal('FOB'),
  v.literal('delivered'),
  v.literal('unknown'),
);

export const quoteEvidenceFieldValidator = v.union(
  v.literal('originalCurrency'),
  v.literal('unitPrice'),
  v.literal('samplePrice'),
  v.literal('moq'),
  v.literal('productionMinDays'),
  v.literal('productionMaxDays'),
  v.literal('shippingIncluded'),
  v.literal('quoteBasis'),
  v.literal('paymentTerms'),
  v.literal('sampleTerms'),
  v.literal('validUntil'),
);

export const scalarValueValidator = v.union(v.string(), v.number(), v.boolean(), v.null());

export const safeMetadataValidator = v.record(v.string(), scalarValueValidator);

export const captureEventValidator = v.union(
  v.object({
    provider: v.literal('openai'),
    operation: v.literal('compile_brief'),
    label: v.string(),
    occurredAt: v.number(),
  }),
  v.object({
    provider: v.literal('firecrawl'),
    operation: v.literal('search_and_durable_crawl'),
    label: v.string(),
    occurredAt: v.number(),
    resultCount: v.number(),
  }),
);

export const productEventTypeValidator = v.union(
  v.literal('landing_viewed'),
  v.literal('demo_opened'),
  v.literal('brief_approved'),
  v.literal('research_started'),
  v.literal('supplier_inspected'),
  v.literal('evidence_opened'),
  v.literal('outreach_reviewed'),
  v.literal('comparison_viewed'),
  v.literal('passport_shared'),
);
