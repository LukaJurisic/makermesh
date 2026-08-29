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
  operator: 'lte' | 'gte' | 'equals' | 'includes' | 'stated';
  targetValue: string | number | boolean;
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
  sourceType: 'official_site' | 'directory' | 'supplier_email' | 'demo_fixture';
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
