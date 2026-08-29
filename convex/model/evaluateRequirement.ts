import type {Doc} from '../_generated/dataModel';

type EvaluationResult = {
  outcome: 'pass' | 'fail' | 'unknown' | 'not_applicable';
  reasonCode: string;
};

export function evaluateClaimAgainstRequirement(
  requirement: Doc<'requirements'>,
  claim: {
    normalizedValue: string | number | boolean | null;
  },
): EvaluationResult {
  const target = requirement.targetValue;
  const value = claim.normalizedValue;
  if (value === null) return {outcome: 'unknown', reasonCode: 'value_missing'};
  switch (requirement.operator) {
    case 'lte':
      return typeof value === 'number' && typeof target === 'number'
        ? {
            outcome: value <= target ? 'pass' : 'fail',
            reasonCode: value <= target ? 'numeric_lte_pass' : 'numeric_lte_fail',
          }
        : {outcome: 'unknown', reasonCode: 'numeric_value_missing'};
    case 'gte':
      return typeof value === 'number' && typeof target === 'number'
        ? {
            outcome: value >= target ? 'pass' : 'fail',
            reasonCode: value >= target ? 'numeric_gte_pass' : 'numeric_gte_fail',
          }
        : {outcome: 'unknown', reasonCode: 'numeric_value_missing'};
    case 'equals': {
      const matches =
        typeof value === 'string' && typeof target === 'string'
          ? value.trim().toLocaleLowerCase('en-US') === target.trim().toLocaleLowerCase('en-US')
          : value === target;
      return {
        outcome: matches ? 'pass' : 'fail',
        reasonCode: matches ? 'equals_pass' : 'equals_fail',
      };
    }
    case 'includes': {
      if (typeof value !== 'string' || typeof target !== 'string') {
        return {outcome: 'unknown', reasonCode: 'text_value_missing'};
      }
      const values = value
        .split(/[,|/]|\s+and\s+/iu)
        .map((item) => item.trim().toLocaleLowerCase('en-US'))
        .filter(Boolean);
      const alternatives = target
        .split(/\s+(?:or|and\/or)\s+|[,|/]/iu)
        .map((item) => item.trim().toLocaleLowerCase('en-US'))
        .filter(Boolean);
      const matches = values.some((item) => alternatives.includes(item));
      return {
        outcome: matches ? 'pass' : 'fail',
        reasonCode: matches ? 'includes_pass' : 'includes_fail',
      };
    }
    case 'one_of': {
      if (typeof value !== 'string' || typeof target !== 'string') {
        return {outcome: 'unknown', reasonCode: 'set_value_missing'};
      }
      const values = value
        .split(/[,|/]|\s+and\s+/iu)
        .map((item) => item.trim().toLocaleLowerCase('en-US'))
        .filter(Boolean);
      const targets = target
        .split(/\s+(?:or|and\/or)\s+|[,|/]/iu)
        .map((item) => item.trim().toLocaleLowerCase('en-US'))
        .filter(Boolean);
      const matches = values.some((item) => targets.includes(item));
      return {
        outcome: matches ? 'pass' : 'fail',
        reasonCode: matches ? 'one_of_pass' : 'one_of_fail',
      };
    }
    case 'stated': {
      const stated =
        typeof value === 'boolean' ||
        (typeof value === 'string' && value.trim().length > 0) ||
        typeof value === 'number';
      return {
        outcome: stated ? 'pass' : 'unknown',
        reasonCode: stated ? 'statement_present' : 'statement_missing',
      };
    }
  }
}
