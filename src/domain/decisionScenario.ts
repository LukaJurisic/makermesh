import type {ControlledReply} from '../../convex/model/controlledReply';

export const DEFAULT_QUANTITY = 200;
export const DEFAULT_PRODUCTION_DAYS = 42;

export type DecisionScenarioInput = {
  quantity: string;
  productionDays: string;
};

type ScenarioErrors = {
  quantity?: string;
  productionDays?: string;
};

export type DecisionScenarioLoading = {status: 'loading'};
export type DecisionScenarioUnavailable = {status: 'unavailable'};
export type DecisionScenarioInvalid = {
  status: 'invalid';
  errors: ScenarioErrors;
};

export type DecisionScenarioReady = {
  status: 'ready';
  quantity: number;
  productionDays: number;
  quantityChanged: boolean;
  timingOutcome: 'pass' | 'fail' | 'unknown';
  moqOutcome: 'pass' | 'fail' | 'unknown';
  productCost: number | null;
  timingExcerpt: string;
  timingAfterSampleApproval: boolean;
  questions: string;
  quote: NonNullable<ControlledReply['quote']>;
  receivedAt: number;
};

export type DecisionScenarioResult =
  | DecisionScenarioLoading
  | DecisionScenarioUnavailable
  | DecisionScenarioInvalid
  | DecisionScenarioReady;

function parseWholeNumber(value: string, minimum: number, maximum: number) {
  if (!/^\d+$/.test(value)) return null;
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed >= minimum && parsed <= maximum ? parsed : null;
}

function sourceExcerpt(reply: ControlledReply, keys: string[]) {
  return (
    reply.evaluations.find(
      (item) =>
        keys.includes(item.requirementKey) &&
        Boolean(item.supportingExcerpt) &&
        reply.originalText.includes(item.supportingExcerpt),
    )?.supportingExcerpt ?? ''
  );
}

function hasTimingQualifier(excerpt: string) {
  return /after\s+sample\s+approval|après\s+(?:validation|approbation)\s+de\s+l['’]échantillon/i.test(
    excerpt,
  );
}

function questionDraft(
  quantity: number,
  productionDays: number,
  quantityChanged: boolean,
  timingOutcome: DecisionScenarioReady['timingOutcome'],
  moqOutcome: DecisionScenarioReady['moqOutcome'],
  moq: number | undefined,
  quote: NonNullable<ControlledReply['quote']>,
  shippingIncluded: boolean | undefined,
) {
  const quotedRange =
    typeof quote.productionMinDays === 'number' && typeof quote.productionMaxDays === 'number'
      ? `${quote.productionMinDays}–${quote.productionMaxDays}`
      : 'the quoted number of';
  const quotedUnitPrice =
    typeof quote.unitPrice === 'number' ? `${quote.unitPrice} ${quote.currency}` : 'the quoted';
  const timingQuestion =
    timingOutcome === 'fail'
      ? `Your reply states production takes ${quotedRange} days after sample approval for ${quantity} cups. Can you confirm production within ${productionDays} days after sample approval for ${quantity} cups, and whether that changes the ${quotedUnitPrice} unit price?`
      : timingOutcome === 'unknown'
        ? `${quantityChanged ? 'Please reconfirm production capacity, timing and price' : 'Can you confirm production'} within ${productionDays} days after sample approval for ${quantity} cups.`
        : `Please confirm that production remains within ${productionDays} days after sample approval for ${quantity} cups.`;
  const moqQuestion =
    moqOutcome === 'fail' && typeof moq === 'number'
      ? ` If ${quantity} cups is below the stated minimum of ${moq}, can you offer a smaller batch and confirm the revised price?`
      : '';
  const shippingQuestion =
    shippingIncluded === false
      ? ' Please also confirm packaging for international transport. Your quote excludes freight, customs, taxes and duties; which shipping details would you need for a separate estimate?'
      : ' Please also confirm packaging for international transport.';
  return `${timingQuestion}${moqQuestion}${shippingQuestion}`;
}

export function evaluateDecisionScenario(
  reply: ControlledReply | null | undefined,
  input: DecisionScenarioInput,
): DecisionScenarioResult {
  if (reply === undefined) return {status: 'loading'};
  if (reply === null || !reply.quote) return {status: 'unavailable'};

  const errors: ScenarioErrors = {};
  const quantity = parseWholeNumber(input.quantity, 1, 100_000);
  const productionDays = parseWholeNumber(input.productionDays, 1, 365);
  if (quantity === null) errors.quantity = 'Use a whole number from 1 to 100000.';
  if (productionDays === null) errors.productionDays = 'Use a whole number from 1 to 365.';
  if (Object.keys(errors).length > 0) return {status: 'invalid', errors};

  const safeQuantity = quantity!;
  const safeProductionDays = productionDays!;
  const quantityChanged = safeQuantity !== DEFAULT_QUANTITY;
  const timingExcerpt = sourceExcerpt(reply, ['production_time', 'production_time_preferred']);
  const moqExcerpt = sourceExcerpt(reply, ['moq_max', 'moq_preferred']);
  const maxDays = reply.quote.productionMaxDays;
  const moq = reply.quote.moq;
  const timingOutcome: DecisionScenarioReady['timingOutcome'] =
    quantityChanged ||
    typeof maxDays !== 'number' ||
    !Number.isFinite(maxDays) ||
    maxDays <= 0 ||
    !hasTimingQualifier(timingExcerpt)
      ? 'unknown'
      : maxDays <= safeProductionDays
        ? 'pass'
        : 'fail';
  const moqOutcome: DecisionScenarioReady['moqOutcome'] =
    typeof moq !== 'number' || !Number.isFinite(moq) || moq <= 0 || !moqExcerpt
      ? 'unknown'
      : safeQuantity >= moq
        ? 'pass'
        : 'fail';
  const unitPrice = reply.quote.unitPrice;
  const productCost =
    typeof unitPrice === 'number' &&
    Number.isFinite(unitPrice) &&
    unitPrice >= 0 &&
    Number.isFinite(unitPrice * safeQuantity)
      ? unitPrice * safeQuantity
      : null;

  return {
    status: 'ready',
    quantity: safeQuantity,
    productionDays: safeProductionDays,
    quantityChanged,
    timingOutcome,
    moqOutcome,
    productCost,
    timingExcerpt,
    timingAfterSampleApproval: hasTimingQualifier(timingExcerpt),
    questions: questionDraft(
      safeQuantity,
      safeProductionDays,
      quantityChanged,
      timingOutcome,
      moqOutcome,
      moq,
      reply.quote,
      reply.quote.shippingIncluded,
    ),
    quote: reply.quote,
    receivedAt: reply.receivedAt,
  };
}

function escapeMarkdown(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/[\\`*_{}[\]()#+!|>~]/g, '\\$&');
}

export function formatDecisionBrief(result: DecisionScenarioReady) {
  if (result.status !== 'ready') throw new Error('A ready scenario is required.');
  const quote = result.quote;
  const currency = quote.currency || 'original currency';
  const timing =
    result.timingOutcome === 'pass'
      ? 'meets'
      : result.timingOutcome === 'fail'
        ? 'does not meet'
        : 'is unconfirmed for';
  const moq =
    result.moqOutcome === 'pass'
      ? 'meets'
      : result.moqOutcome === 'fail'
        ? 'does not meet'
        : 'is unconfirmed for';
  const source = result.timingExcerpt
    ? `\n\nExact timing evidence: “${escapeMarkdown(result.timingExcerpt)}”`
    : '';
  const cost = result.productCost === null ? 'Unknown' : `${result.productCost} ${currency}`;
  const quotedRange =
    typeof quote.productionMinDays === 'number' && typeof quote.productionMaxDays === 'number'
      ? `${quote.productionMinDays}–${quote.productionMaxDays} days`
      : 'Unknown';
  const shipping =
    quote.shippingIncluded === true
      ? 'Shipping: included in the captured quote'
      : quote.shippingIncluded === false
        ? 'Shipping: excluded from the captured quote; customs, taxes and duties are also excluded'
        : 'Shipping: unknown';
  const sample =
    typeof quote.samplePrice === 'number'
      ? `Sample: ${quote.samplePrice} ${currency}, quoted separately`
      : 'Sample: unknown';
  return [
    '# MakerMesh sourcing decision brief',
    '',
    'Fictional supplier example · captured exchange',
    '',
    `- Quantity: ${result.quantity} cups${result.quantityChanged ? ' (changed from the original 200-cup quote)' : ''}`,
    `- Production limit: ${result.productionDays} days after sample approval`,
    `- Original quoted unit rate: ${quote.unitPrice === undefined ? 'Unknown' : `${quote.unitPrice} ${currency}`}`,
    `- Original quoted production range: ${quotedRange}${result.timingAfterSampleApproval ? ' after sample approval' : '; start condition unconfirmed'}`,
    `- Original stated MOQ: ${quote.moq === undefined ? 'Unknown' : `${quote.moq} cups`}`,
    `- Quote basis: ${quote.quoteBasis}`,
    `- Timing: ${timing} the requested limit`,
    `- Minimum order quantity: ${moq} the requested quantity`,
    `- Product cost: ${cost}${result.quantityChanged ? ' (illustrative using the original unit price; supplier reconfirmation required)' : ''}`,
    `- ${shipping}`,
    `- ${sample}`,
    '- Product cost is not a delivered total. Sample preparation, approval and shipping time are not included in the production limit.',
    ...(result.quantityChanged
      ? ['- Changed quantity: capacity, price and production time need supplier reconfirmation.']
      : []),
    `- Received: ${new Date(result.receivedAt).toISOString()}`,
    source,
    '',
    '## Questions to ask next',
    '',
    escapeMarkdown(result.questions),
    '',
    'This is a draft for clarification. It is not a sent message, delivery promise, or purchasing authorization.',
  ].join('\n');
}
