// @vitest-environment edge-runtime

import {describe, expect, it} from 'vitest';
import type {Doc} from '../_generated/dataModel';
import {evaluateClaimAgainstRequirement} from './evaluateRequirement';

const requirement = (
  operator: Doc<'requirements'>['operator'],
  targetValue: string | number | boolean | null,
) => ({operator, targetValue}) as Doc<'requirements'>;

describe('requirement evaluator', () => {
  it('evaluates numeric constraints without AI judgment', () => {
    expect(
      evaluateClaimAgainstRequirement(requirement('lte', 250), {
        normalizedValue: 150,
      }).outcome,
    ).toBe('pass');
    expect(
      evaluateClaimAgainstRequirement(requirement('lte', 250), {
        normalizedValue: 300,
      }).outcome,
    ).toBe('fail');
  });

  it('keeps missing numeric values unknown', () => {
    expect(
      evaluateClaimAgainstRequirement(requirement('lte', 42), {
        normalizedValue: null,
      }).outcome,
    ).toBe('unknown');
  });

  it('matches language alternatives deterministically', () => {
    expect(
      evaluateClaimAgainstRequirement(requirement('one_of', 'English or French'), {
        normalizedValue: 'French',
      }).outcome,
    ).toBe('pass');
    expect(
      evaluateClaimAgainstRequirement(requirement('includes', 'English or French'), {
        normalizedValue: 'French and Arabic',
      }).outcome,
    ).toBe('pass');
  });

  it('counts an explicit negative statement as answered', () => {
    expect(
      evaluateClaimAgainstRequirement(requirement('stated', true), {
        normalizedValue: false,
      }),
    ).toEqual({outcome: 'pass', reasonCode: 'statement_present'});
  });

  it('evaluates explicit boolean values without an AI status input', () => {
    expect(
      evaluateClaimAgainstRequirement(requirement('equals', true), {
        normalizedValue: false,
      }),
    ).toEqual({outcome: 'fail', reasonCode: 'equals_fail'});
  });
});
