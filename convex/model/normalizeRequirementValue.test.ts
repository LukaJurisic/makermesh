import {describe, expect, it} from 'vitest';
import {normalizeRequirementValue} from './normalizeRequirementValue';
import {evaluateClaimAgainstRequirement} from './evaluateRequirement';

describe('explicit bilingual normalization', () => {
  it.each([
    ['capacity', '8 oz', 8],
    ['communication_language', 'Français et anglais', 'French, English'],
    ['production_style', 'Artisanale en petite série', 'handmade, small-batch'],
    ['base_finish', 'Base mate sable ou blanc cassé', 'matte sand, off-white'],
    ['accent_color', 'Vert foncé ou bleu encre', 'dark green, ink-blue'],
    ['moroccan_production_centre', 'Safi, Maroc', 'safi, Morocco'],
    ['production_time', "30 à 35 jours après validation de l'échantillon", 35],
  ])('canonicalizes %s without losing its stated meaning', (key, value, expected) => {
    expect(normalizeRequirementValue(key as string, value)).toBe(expected);
  });
  it('does not infer values, discard negation, convert units, or shorten maximum lead time', () => {
    expect(normalizeRequirementValue('capacity', null)).toBeNull();
    expect(normalizeRequirementValue('capacity', '250 ml')).toBe('250 ml');
    expect(normalizeRequirementValue('production_time', '45 à 50 jours')).toBe(50);
    expect(normalizeRequirementValue('production_time', '35 à 30 jours')).toBe('35 à 30 jours');
    expect(normalizeRequirementValue('communication_language', 'Pas français')).toBeNull();
    expect(normalizeRequirementValue('international_packaging', null)).toBeNull();
  });
  it.each(['Pas français ou anglais', 'not French or English', 'neither French nor English'])(
    'does not turn coordinated negation into a language pass: %s',
    (normalizedValue) => {
      expect(
        evaluateClaimAgainstRequirement(
          {key: 'communication_language', operator: 'one_of', targetValue: 'English or French'},
          {normalizedValue},
        ).outcome,
      ).toBe('unknown');
    },
  );
  it('uses the upper production bound against both independent thresholds', () => {
    const claim = {normalizedValue: "30 à 35 jours après validation de l'échantillon"};
    expect(
      evaluateClaimAgainstRequirement(
        {key: 'production_time', operator: 'lte', targetValue: 42},
        claim,
      ).outcome,
    ).toBe('pass');
    expect(
      evaluateClaimAgainstRequirement(
        {key: 'production_time_preferred', operator: 'lte', targetValue: 34},
        claim,
      ).outcome,
    ).toBe('fail');
  });
});
