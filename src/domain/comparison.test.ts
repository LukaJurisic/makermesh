import {describe, expect, it} from 'vitest';
import {
  DEFAULT_RANKING_WEIGHTS,
  commercialCompleteness,
  comparisonSummary,
  eligibilityTier,
  evidenceCoverage,
  preferenceFit,
  quotesAreComparable,
  rankMakers,
  validateRankingWeights,
} from './comparison';
import type {Maker, RequirementEvaluation} from './types';

const evaluation = (
  type: RequirementEvaluation['type'],
  outcome: RequirementEvaluation['outcome'],
  weight = 1,
  hasActiveEvidence = outcome !== 'unknown',
): RequirementEvaluation => ({
  requirementKey: `${type}-${outcome}-${weight}`,
  requirementLabel: 'Fixture requirement',
  type,
  outcome,
  weight,
  hasActiveEvidence,
  displayValue: outcome,
  reason: 'Test fixture',
});

const maker = (id: string, evaluations: RequirementEvaluation[]): Maker => ({
  id,
  slug: id,
  name: id,
  location: 'Demo',
  summary: 'Fixture',
  languages: ['English'],
  visual: '/images/espresso-cup-study.webp',
  demoSupplier: true,
  fixture: true,
  capabilities: [],
  evaluations,
  sources: [],
  openQuestionCount: 0,
  latestActivity: 'Now',
});

describe('deterministic comparison', () => {
  it('orders eligibility before weighted score', () => {
    const eligible = maker('eligible', [evaluation('hard', 'pass'), evaluation('soft', 'fail')]);
    const unknown = maker('unknown', [
      evaluation('hard', 'unknown'),
      evaluation('soft', 'pass', 100),
    ]);

    expect(rankMakers([unknown, eligible], DEFAULT_RANKING_WEIGHTS)[0]?.makerId).toBe('eligible');
  });

  it('treats hard failures and unknown hard requirements separately', () => {
    expect(eligibilityTier([evaluation('hard', 'fail')])).toBe('hard_failure');
    expect(eligibilityTier([evaluation('hard', 'unknown')])).toBe('provisionally_unqualified');
    expect(eligibilityTier([evaluation('hard', 'pass')])).toBe('eligible');
  });

  it('never lets unknown preferences improve fit', () => {
    const result = preferenceFit([
      evaluation('soft', 'pass', 30),
      evaluation('soft', 'unknown', 70, false),
    ]);
    expect(result).toEqual({score: 30, knownPreferences: 1, totalPreferences: 2});
  });

  it('shows evidence coverage with its denominator', () => {
    expect(
      evidenceCoverage([
        evaluation('hard', 'pass', 1, true),
        evaluation('hard', 'unknown', 1, false),
      ]),
    ).toEqual({score: 50, evidencedRequirements: 1, applicableRequirements: 2});
  });

  it('does not infer missing commercial terms', () => {
    const result = commercialCompleteness({currency: 'MAD', unitPrice: 72});
    expect(result.score).toBe(25);
    expect(result.fieldsPresent).toBe(2);
  });

  it('compares quotes only when basis and scope match', () => {
    const base = {
      currency: 'MAD',
      quoteBasis: 'EXW' as const,
      pricingUnit: 'per cup',
      shippingIncluded: false,
    };
    expect(quotesAreComparable(base, {...base, unitPrice: 72})).toBe(true);
    expect(quotesAreComparable(base, {...base, quoteBasis: 'FOB'})).toBe(false);
  });

  it('requires complete non-negative integer weights totaling 100', () => {
    expect(validateRankingWeights(DEFAULT_RANKING_WEIGHTS)).toBe(true);
    expect(validateRankingWeights({...DEFAULT_RANKING_WEIGHTS, price: 1})).toBe(false);
  });

  it('refuses to manufacture a winner when none is eligible', () => {
    const comparisons = rankMakers(
      [maker('unknown', [evaluation('hard', 'unknown')])],
      DEFAULT_RANKING_WEIGHTS,
    );
    expect(comparisonSummary(comparisons)).toBe(
      'No qualified maker yet. More evidence is required.',
    );
  });
});
