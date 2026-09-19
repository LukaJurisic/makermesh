import {describe, expect, it} from 'vitest';
import {zodTextFormat} from 'openai/helpers/zod';
import {supplierReplyResponseSchema} from './replyResponseSchema';

describe('source-constrained reply evidence', () => {
  it('accepts exact source spans and rejects paraphrases in answers and quotes', () => {
    const schema = supplierReplyResponseSchema(
      'Notre MOQ est de 150 unités. Le prix est de 72 MAD.',
    );
    const evidence = schema.shape.answers.element.shape.supportingExcerpt;
    expect(evidence.parse('Notre MOQ est de 150 unités.')).toBe('Notre MOQ est de 150 unités.');
    expect(() => evidence.parse('MOQ de 150 unités')).toThrow();
    const quoteEvidence =
      schema.shape.quote.unwrap().shape.fieldEvidence.element.shape.supportingExcerpt;
    expect(() => quoteEvidence.parse('72 MAD par tasse')).toThrow();
    const format = zodTextFormat(schema, 'supplier_reply');
    expect(JSON.stringify(format.schema)).toContain('Notre MOQ est de 150 unités.');
    expect(format.strict).toBe(true);
  });

  it('bounds enums while retaining only exact Unicode-safe substrings', () => {
    for (const source of ['x'.repeat(899) + '😀' + 'y'.repeat(1500), 'a. '.repeat(1000)]) {
      const evidence =
        supplierReplyResponseSchema(source).shape.answers.element.shape.supportingExcerpt;
      expect(evidence.options.length).toBeLessThanOrEqual(200);
      for (const span of evidence.options) {
        expect(source).toContain(span);
        expect(span.length).toBeLessThanOrEqual(900);
        expect(decodeURIComponent(encodeURIComponent(span))).toBe(span);
      }
    }
  });

  it('rejects empty or oversized source text before an API call', () => {
    expect(() => supplierReplyResponseSchema(' ')).toThrow();
    expect(() => supplierReplyResponseSchema('x'.repeat(12001))).toThrow();
  });
});
