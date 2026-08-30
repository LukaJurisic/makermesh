export type RequirementType = 'hard' | 'soft';
export type RequirementOutcome = 'pass' | 'fail' | 'unknown' | 'not_applicable';
export type EvidenceState =
  | 'public_source'
  | 'supplier_claimed'
  | 'document_supported'
  | 'independently_verified'
  | 'buyer_confirmed'
  | 'expired'
  | 'unknown';

export type ProjectStage = 'brief' | 'research' | 'makers' | 'outreach' | 'compare' | 'passport';

export interface Requirement {
  key: string;
  label: string;
  description: string;
  type: RequirementType;
  operator: 'lte' | 'gte' | 'equals' | 'includes' | 'one_of' | 'stated';
  targetValue: string | number | boolean | null;
  unit?: string;
  weight: number;
}

export interface RequirementEvaluation {
  requirementKey: string;
  requirementLabel: string;
  type: RequirementType;
  outcome: RequirementOutcome;
  weight: number;
  hasActiveEvidence: boolean;
  displayValue: string;
  evidenceId?: string;
  reason: string;
}

export interface SourceEvidence {
  id: string;
  title: string;
  url: string;
  domain: string;
  excerpt: string;
  observedAt: string;
  sourceType: 'official_site' | 'directory' | 'marketplace' | 'supplier_email' | 'demo_fixture';
  evidenceState: EvidenceState;
  fixture: boolean;
}

export interface Quote {
  currency?: string;
  unitPrice?: number;
  samplePrice?: number;
  moq?: number;
  productionMinDays?: number;
  productionMaxDays?: number;
  shippingIncluded?: boolean;
  quoteBasis?: 'EXW' | 'FOB' | 'delivered' | 'unknown';
  pricingUnit?: string;
  paymentTerms?: string;
  sampleTerms?: string;
}

export interface Maker {
  id: string;
  slug: string;
  name: string;
  location: string;
  summary: string;
  languages: string[];
  visual: string;
  demoSupplier: boolean;
  fixture: boolean;
  capabilities: string[];
  evaluations: RequirementEvaluation[];
  sources: SourceEvidence[];
  quote?: Quote;
  openQuestionCount: number;
  latestActivity: string;
}

export interface RankingWeights {
  preferenceFit: number;
  evidenceCoverage: number;
  commercialCompleteness: number;
  leadTime: number;
  price: number;
}

export interface MakerComparison {
  makerId: string;
  makerName: string;
  tier: 'eligible' | 'provisionally_unqualified' | 'hard_failure';
  preferenceFit: number;
  knownPreferences: number;
  totalPreferences: number;
  evidenceCoverage: number;
  evidencedRequirements: number;
  applicableRequirements: number;
  commercialCompleteness: number;
  commercialFieldsPresent: number;
  leadTimeScore: number;
  weightedScore: number;
}

export interface ActivityEvent {
  id: string;
  provider: 'Firecrawl' | 'OpenAI' | 'Convex' | 'AgentMail';
  label: string;
  status: 'completed' | 'running' | 'waiting' | 'error';
  occurredAt: string;
  latency?: string;
  fixture: boolean;
}

export interface PublicResearchMaker {
  slug: string;
  name: string;
  location: string;
  summary: string;
  languages?: string[];
  visual: string;
  demoSupplier: boolean;
  stage?: 'discovered' | 'reviewed' | 'outreach_selected' | 'contacted' | 'replied';
  openQuestionCount?: number;
  publicSourceCount: number;
  publicClaimCount: number;
}

export interface PublicResearchSource extends SourceEvidence {
  makerSlug: string;
  maker: string;
  excerptTruncated?: boolean;
  state?: 'active' | 'stale';
  truncated?: boolean;
}

export interface PublicResearchClaim {
  claimKey: string;
  makerSlug: string;
  requirementKey: string;
  normalizedValue: string | number | boolean | null;
  displayValue: string;
  observationState: 'observed' | 'conflict' | 'unknown' | 'not_applicable';
  evidenceState: EvidenceState;
  sourceKey: string;
  supportingExcerpt: string;
  excerptTruncated: boolean;
  observedAt: string;
  extractionModel: string | null;
  promptVersion: string | null;
}

export interface PublicResearchSnapshot {
  theme: string;
  brief: {
    version: number;
    rawRequest: string;
    productName: string;
    productCategory: string;
    quantity: number;
    unit: string;
    destination: string;
    budget: number;
    budgetCurrency: string;
    budgetBasis: string | null;
    deadlineDays: number;
    customization: string;
    dimensions: Array<{label: string; value: number | null; unit: string | null}>;
    materials: string[];
    finish: string[];
    assumptions: string[];
    promptVersion: string;
    extractionModel: string | null;
    approvedAt: number;
  };
  requirements: Array<Requirement & {displayOrder: number}>;
  makers: PublicResearchMaker[];
  sources: PublicResearchSource[];
  claims: PublicResearchClaim[];
}
