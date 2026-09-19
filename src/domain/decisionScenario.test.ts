import {describe, expect, it} from 'vitest';
import type {ControlledReply} from '../../convex/model/controlledReply';
import {evaluateDecisionScenario, formatDecisionBrief} from './decisionScenario';

const timingExcerpt = "La production prend 30 à 35 jours après validation de l'échantillon.";
const moqExcerpt = 'Notre MOQ est de 150 unités.';

function makeReply(overrides: Partial<ControlledReply> = {}): ControlledReply {
  return {
    sentAt: 1_000,
    receivedAt: 2_000,
    extractedAt: 3_000,
    originalText: `Reply source. ${timingExcerpt} ${moqExcerpt}`,
    evaluations: [
      {
        requirementKey: 'production_time',
        requirementLabel: 'Production time',
        type: 'hard',
        weight: 1,
        outcome: 'pass',
        supportingExcerpt: timingExcerpt,
      },
      {
        requirementKey: 'moq_max',
        requirementLabel: 'Maximum MOQ',
        type: 'hard',
        weight: 1,
        outcome: 'pass',
        supportingExcerpt: moqExcerpt,
      },
    ],
    quote: {
      currency: 'MAD',
      unitPrice: 72,
      samplePrice: 650,
      moq: 150,
      productionMinDays: 30,
      productionMaxDays: 35,
      shippingIncluded: false,
      quoteBasis: 'EXW',
    },
    ...overrides,
  };
}

describe('evaluateDecisionScenario', () => {
  it('distinguishes loading and unavailable proof', () => {
    expect(evaluateDecisionScenario(undefined, {quantity: '200', productionDays: '42'})).toEqual({
      status: 'loading',
    });
    expect(evaluateDecisionScenario(null, {quantity: '200', productionDays: '42'})).toEqual({
      status: 'unavailable',
    });
    expect(
      evaluateDecisionScenario(makeReply({quote: null}), {quantity: '200', productionDays: '42'}),
    ).toEqual({
      status: 'unavailable',
    });
  });

  it('validates whole number boundaries and reports each field', () => {
    expect(evaluateDecisionScenario(makeReply(), {quantity: '0', productionDays: '366'})).toEqual({
      status: 'invalid',
      errors: {
        quantity: 'Use a whole number from 1 to 100000.',
        productionDays: 'Use a whole number from 1 to 365.',
      },
    });
    expect(
      evaluateDecisionScenario(makeReply(), {quantity: '1.5', productionDays: 'Infinity'}),
    ).toMatchObject({
      status: 'invalid',
      errors: {quantity: expect.any(String), productionDays: expect.any(String)},
    });
    expect(
      evaluateDecisionScenario(makeReply(), {quantity: '1e2', productionDays: ''}),
    ).toMatchObject({
      status: 'invalid',
      errors: {quantity: expect.any(String), productionDays: expect.any(String)},
    });
  });

  it('evaluates timing and MOQ at the default boundaries and computes product cost', () => {
    const atLimit = evaluateDecisionScenario(makeReply(), {quantity: '200', productionDays: '35'});
    expect(atLimit).toMatchObject({
      status: 'ready',
      quantity: 200,
      productionDays: 35,
      quantityChanged: false,
      timingOutcome: 'pass',
      moqOutcome: 'pass',
      productCost: 14_400,
      timingExcerpt,
      receivedAt: 2_000,
    });

    const belowMoq = evaluateDecisionScenario(makeReply(), {quantity: '149', productionDays: '42'});
    expect(belowMoq).toMatchObject({status: 'ready', moqOutcome: 'fail', timingOutcome: 'unknown'});
    const meetsMoq = evaluateDecisionScenario(makeReply(), {quantity: '150', productionDays: '42'});
    expect(meetsMoq).toMatchObject({status: 'ready', moqOutcome: 'pass', timingOutcome: 'unknown'});
  });

  it('keeps changed quantity timing unknown while showing illustrative cost and MOQ', () => {
    const result = evaluateDecisionScenario(makeReply(), {quantity: '250', productionDays: '20'});
    expect(result).toMatchObject({
      status: 'ready',
      quantityChanged: true,
      timingOutcome: 'unknown',
      moqOutcome: 'pass',
      productCost: 18_000,
    });
    expect(result.status === 'ready' && result.questions).toContain('reconfirm');
  });

  it('keeps missing commercial fields unknown', () => {
    const result = evaluateDecisionScenario(
      makeReply({
        quote: {
          currency: 'MAD',
          quoteBasis: 'unknown',
        },
      }),
      {quantity: '200', productionDays: '42'},
    );
    expect(result).toMatchObject({
      status: 'ready',
      timingOutcome: 'unknown',
      moqOutcome: 'unknown',
      productCost: null,
      timingExcerpt,
    });
  });

  it('requires exact source evidence and never invents a timing excerpt', () => {
    const reply = makeReply({
      evaluations: [
        {
          requirementKey: 'production_time',
          requirementLabel: 'Production time',
          type: 'hard',
          weight: 1,
          outcome: 'pass',
          supportingExcerpt: 'A paraphrase that is not in the source',
        },
        {
          requirementKey: 'moq_max',
          requirementLabel: 'Maximum MOQ',
          type: 'hard',
          weight: 1,
          outcome: 'pass',
          supportingExcerpt: moqExcerpt,
        },
      ],
    });
    const result = evaluateDecisionScenario(reply, {quantity: '200', productionDays: '42'});
    expect(result).toMatchObject({status: 'ready', timingOutcome: 'unknown', timingExcerpt: ''});
  });
});

describe('formatDecisionBrief', () => {
  it('does not invent a production start condition or shipping exclusion when missing', () => {
    const reply = makeReply({
      originalText: 'Production takes 35 days.',
      evaluations: [],
      quote: {
        currency: 'MAD',
        quoteBasis: 'unknown',
        productionMaxDays: 35,
      },
    });
    const result = evaluateDecisionScenario(reply, {quantity: '200', productionDays: '42'});
    expect(result).toMatchObject({
      status: 'ready',
      timingOutcome: 'unknown',
      timingAfterSampleApproval: false,
    });
    if (result.status !== 'ready') return;
    const brief = formatDecisionBrief(result);
    expect(brief).toContain('start condition unconfirmed');
    expect(brief).toContain('Shipping: unknown');
    expect(brief).toContain('Sample: unknown');
    expect(brief).not.toContain('customs, taxes and duties are also excluded');
  });

  it('exports only the allowlisted scenario fields and escapes source markdown', () => {
    const reply = makeReply({
      originalText: `Reply source. ${timingExcerpt} [source] ${moqExcerpt}`,
      evaluations: [
        {
          requirementKey: 'production_time',
          requirementLabel: 'Production time',
          type: 'hard',
          weight: 1,
          outcome: 'pass',
          supportingExcerpt: `${timingExcerpt} [source]`,
        },
        {
          requirementKey: 'moq_max',
          requirementLabel: 'Maximum MOQ',
          type: 'hard',
          weight: 1,
          outcome: 'pass',
          supportingExcerpt: moqExcerpt,
        },
      ],
    });
    const result = evaluateDecisionScenario(reply, {quantity: '200', productionDays: '42'});
    expect(result.status).toBe('ready');
    if (result.status !== 'ready') return;
    const brief = formatDecisionBrief(result);
    expect(brief).toContain('Fictional supplier example');
    expect(brief).toContain('Exact timing evidence:');
    expect(brief).toContain('\\[source\\]');
    expect(brief).not.toContain('Reply source.');
    expect(brief).toContain('draft');
    expect(brief).toContain('not a sent message');
  });
});
