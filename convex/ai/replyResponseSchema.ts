import {z} from 'zod';
import {SupplierReplySchema} from './schemas';

function chunks(text: string) {
  const result: string[] = [];
  for (let start = 0; start < text.length;) {
    let end = Math.min(start + 900, text.length);
    const last = text.charCodeAt(end - 1);
    if (end < text.length && last >= 0xd800 && last <= 0xdbff) end--;
    result.push(text.slice(start, end));
    start = end;
  }
  return result;
}

// The model selects evidence; it does not author citations. Each enum value is
// an exact substring. Persistence still independently checks all excerpts.
export function supplierReplyResponseSchema(originalText: string) {
  if (!originalText.trim() || originalText.length > 12_000)
    throw new Error('Reply text is outside extraction limits.');
  let spans = originalText
    .split(/(?<=[.!?])\s+|\r?\n+/u)
    .filter(Boolean)
    .flatMap(chunks);
  if (spans.length > 200) spans = chunks(originalText);
  const unique = [...new Set(spans)];
  const evidence = z.enum(unique as [string, ...string[]]);
  const answer = SupplierReplySchema.shape.answers.element.safeExtend({
    supportingExcerpt: evidence,
  });
  const quote = SupplierReplySchema.shape.quote.unwrap();
  return SupplierReplySchema.extend({
    answers: z.array(answer).max(64),
    quote: quote
      .extend({
        fieldEvidence: z
          .array(quote.shape.fieldEvidence.element.extend({supportingExcerpt: evidence}))
          .max(16),
      })
      .nullable(),
  });
}
