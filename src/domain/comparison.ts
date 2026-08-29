import type {Maker, MakerComparison, Quote, RankingWeights, RequirementEvaluation} from './types';

const COMMERCIAL_FIELDS: Array<keyof Quote> = [
  'unitPrice',
  'currency',
  'quoteBasis',
  'moq',
  'productionMaxDays',
  'sampleTerms',
  'shippingIncluded',
  'paymentTerms',
];

export const DEFAULT_RANKING_WEIGHTS: RankingWeights = {
  preferenceFit: 40,
  evidenceCoverage: 30,
  commercialCompleteness: 20,
  leadTime: 10,
  price: 0,
};

export function eligibilityTier(evaluations: RequirementEvaluation[]): MakerComparison['tier'] {
  const hard = evaluations.filter((evaluation) => evaluation.type === 'hard');

  if (hard.some((evaluation) => evaluation.outcome === 'fail')) {
    return 'hard_failure';
  }

  if (hard.some((evaluation) => evaluation.outcome === 'unknown')) {
    return 'provisionally_unqualified';
  }

  return 'eligible';
}

export function preferenceFit(evaluations: RequirementEvaluation[]) {
  const preferences = evaluations.filter(
    (evaluation) => evaluation.type === 'soft' && evaluation.outcome !== 'not_applicable',
  );
  const totalWeight = preferences.reduce((sum, evaluation) => sum + evaluation.weight, 0);
  const earnedWeight = preferences.reduce(
    (sum, evaluation) => sum + (evaluation.outcome === 'pass' ? evaluation.weight : 0),
    0,
  );
  const knownPreferences = preferences.filter(
    (evaluation) => evaluation.outcome !== 'unknown',
  ).length;

  return {
    score: totalWeight === 0 ? 0 : Math.round((earnedWeight / totalWeight) * 100),
    knownPreferences,
    totalPreferences: preferences.length,
  };
}

export function evidenceCoverage(evaluations: RequirementEvaluation[]) {
  const applicable = evaluations.filter((evaluation) => evaluation.outcome !== 'not_applicable');
  const evidenced = applicable.filter((evaluation) => evaluation.hasActiveEvidence);

  return {
    score: applicable.length === 0 ? 0 : Math.round((evidenced.length / applicable.length) * 100),
    evidencedRequirements: evidenced.length,
    applicableRequirements: applicable.length,
  };
}

export function commercialCompleteness(quote?: Quote) {
  if (!quote) {
    return {score: 0, fieldsPresent: 0, totalFields: COMMERCIAL_FIELDS.length};
  }

  const fieldsPresent = COMMERCIAL_FIELDS.filter((field) => {
    const value = quote[field];
    return value !== undefined && value !== '' && value !== 'unknown';
  }).length;

  return {
    score: Math.round((fieldsPresent / COMMERCIAL_FIELDS.length) * 100),
    fieldsPresent,
    totalFields: COMMERCIAL_FIELDS.length,
  };
}

export function leadTimeScore(quote?: Quote) {
  const days = quote?.productionMaxDays;
  if (days === undefined) return 0;
  if (days <= 35) return 100;
  if (days <= 42) return 70;
  return 0;
}

export function quotesAreComparable(left?: Quote, right?: Quote) {
  if (!left || !right) return false;
  return Boolean(
    left.currency &&
    left.currency === right.currency &&
    left.quoteBasis &&
    left.quoteBasis !== 'unknown' &&
    left.quoteBasis === right.quoteBasis &&
    left.pricingUnit &&
    left.pricingUnit === right.pricingUnit &&
    left.shippingIncluded === right.shippingIncluded,
  );
}

export function validateRankingWeights(weights: RankingWeights) {
  const values = Object.values(weights);
  return (
    values.every((value) => Number.isFinite(value) && Number.isInteger(value) && value >= 0) &&
    values.reduce((sum, value) => sum + value, 0) === 100
  );
}

export function compareMaker(maker: Maker, weights: RankingWeights): MakerComparison {
  if (!validateRankingWeights(weights)) {
    throw new Error('Ranking weights must be non-negative integers totaling 100.');
  }

  const preference = preferenceFit(maker.evaluations);
  const evidence = evidenceCoverage(maker.evaluations);
  const commercial = commercialCompleteness(maker.quote);
  const lead = leadTimeScore(maker.quote);
  const weightedScore = Math.round(
    (preference.score * weights.preferenceFit +
      evidence.score * weights.evidenceCoverage +
      commercial.score * weights.commercialCompleteness +
      lead * weights.leadTime) /
      100,
  );

  return {
    makerId: maker.id,
    makerName: maker.name,
    tier: eligibilityTier(maker.evaluations),
    preferenceFit: preference.score,
    knownPreferences: preference.knownPreferences,
    totalPreferences: preference.totalPreferences,
    evidenceCoverage: evidence.score,
    evidencedRequirements: evidence.evidencedRequirements,
    applicableRequirements: evidence.applicableRequirements,
    commercialCompleteness: commercial.score,
    commercialFieldsPresent: commercial.fieldsPresent,
    leadTimeScore: lead,
    weightedScore,
  };
}

const TIER_ORDER: Record<MakerComparison['tier'], number> = {
  eligible: 0,
  provisionally_unqualified: 1,
  hard_failure: 2,
};

export function rankMakers(makers: Maker[], weights: RankingWeights) {
  return makers
    .map((maker) => compareMaker(maker, weights))
    .sort((left, right) => {
      const tierDifference = TIER_ORDER[left.tier] - TIER_ORDER[right.tier];
      if (tierDifference !== 0) return tierDifference;
      return right.weightedScore - left.weightedScore;
    });
}

export function comparisonSummary(comparisons: MakerComparison[]) {
  if (!comparisons.some((comparison) => comparison.tier === 'eligible')) {
    return 'No qualified maker yet. More evidence is required.';
  }
  return 'Eligible makers are ordered within their tier using the visible weights.';
}
