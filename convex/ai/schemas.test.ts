// @vitest-environment edge-runtime

import {describe, expect, it} from 'vitest';
import {zodTextFormat} from 'openai/helpers/zod';
import {SourcingBriefSchema, SupplierReplySchema} from './schemas';

describe('OpenAI structured schemas', () => {
  it('converts the reply schema into a strict Responses API text format', () => {
    expect(() => zodTextFormat(SupplierReplySchema, 'supplier_reply')).not.toThrow();
  });

  it('accepts a numeric-preserving sourcing brief fixture', () => {
    const parsed = SourcingBriefSchema.parse({
      product: {name: 'Espresso cups', description: 'Handcrafted eight-ounce cups'},
      category: 'custom Moroccan ceramics',
      quantity: {value: 200, unit: 'cups'},
      dimensions: [{label: 'capacity', value: 8, unit: 'oz'}],
      materials: ['ceramic'],
      finish: ['matte sand'],
      customization: ['café logo'],
      destination: 'Toronto, Canada',
      deadlineDays: 42,
      budget: {amount: 3_500, currency: 'CAD', basis: 'product only'},
      hardRequirements: [],
      softPreferences: [],
      openClarifyingQuestions: ['Exact rim diameter?'],
      assumptions: ['Freight excluded'],
    });
    expect(parsed).toMatchObject({
      quantity: {value: 200, unit: 'cups'},
      deadlineDays: 42,
      budget: {amount: 3_500, currency: 'CAD'},
    });
  });

  it('requires exact evidence excerpts for reply answers', () => {
    const reply = {
      supplierIdentitySignals: ['Atlas Clay Studio'],
      answers: [
        {
          requirementKey: 'moq_max',
          normalizedValue: 150,
          displayValue: '150 units',
          status: 'confirmed',
          supportingExcerpt: 'Notre minimum est de 150 unités.',
        },
      ],
      quote: null,
      customizationMethod: null,
      documentationStatements: [],
      exportStatement: null,
      unresolvedQuestions: [],
      contradictions: [],
      attachmentReferences: [],
    };
    expect(SupplierReplySchema.parse(reply).answers[0]?.normalizedValue).toBe(150);
    expect(() =>
      SupplierReplySchema.parse({
        ...reply,
        answers: [{...reply.answers[0], supportingExcerpt: ''}],
      }),
    ).toThrow();
    expect(() =>
      SupplierReplySchema.parse({
        ...reply,
        answers: [
          {
            ...reply.answers[0],
            status: 'unknown',
            normalizedValue: 'invented value',
          },
        ],
      }),
    ).toThrow('Unknown answers');
  });
});
