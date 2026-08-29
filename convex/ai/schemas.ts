import {z} from 'zod';

const ScalarSchema = z.union([z.string(), z.number(), z.boolean(), z.null()]);

const RequirementSchema = z.object({
  key: z.string().min(1).max(80),
  label: z.string().min(1).max(140),
  description: z.string().min(1).max(500),
  operator: z.enum(['lte', 'gte', 'equals', 'includes', 'one_of', 'stated']),
  targetValue: ScalarSchema,
  unit: z.string().max(40).nullable(),
});

export const SourcingBriefSchema = z.object({
  product: z.object({name: z.string().min(1), description: z.string().min(1)}),
  category: z.string().min(1),
  quantity: z.object({value: z.number().positive(), unit: z.string().min(1)}),
  dimensions: z.array(
    z.object({label: z.string(), value: z.number().nullable(), unit: z.string().nullable()}),
  ),
  materials: z.array(z.string()),
  finish: z.array(z.string()),
  customization: z.array(z.string()),
  destination: z.string().min(1),
  deadlineDays: z.number().int().positive(),
  budget: z.object({amount: z.number().positive(), currency: z.string().min(3), basis: z.string()}),
  hardRequirements: z.array(RequirementSchema),
  softPreferences: z.array(RequirementSchema.extend({weight: z.number().int().min(0).max(100)})),
  openClarifyingQuestions: z.array(z.string()),
  assumptions: z.array(z.string()),
});

export const SupplierCandidateSchema = z.object({
  candidateName: z.string().min(1),
  location: z.object({country: z.string(), city: z.string().nullable()}),
  website: z.string().url().nullable(),
  contactRoutes: z.array(z.object({type: z.string(), value: z.string(), public: z.boolean()})),
  visibleCapabilities: z.array(z.string()),
  languages: z.array(z.string()),
  productCategories: z.array(z.string()),
  relevantExcerpts: z.array(z.object({sourceReference: z.string(), excerpt: z.string()})),
  uncertainty: z.array(z.string()),
  potentialDuplicateSignals: z.array(z.string()),
});

export const CapabilityExtractionSchema = z.object({
  claims: z.array(
    z.object({
      claimKey: z.string(),
      normalizedValue: ScalarSchema,
      displayValue: z.string(),
      status: z.enum(['confirmed', 'contradicted', 'unknown', 'not_applicable']),
      evidenceExcerpt: z.string(),
      sourceReference: z.string(),
      observationTime: z.string(),
      extractionConfidence: z.number().min(0).max(1),
    }),
  ),
});

export const QuestionGapSchema = z.object({
  questions: z.array(
    z.object({
      requirementKey: z.string(),
      whyNeeded: z.string(),
      exactQuestion: z.string(),
      urgency: z.enum(['required', 'important', 'optional']),
      couldDisqualify: z.boolean(),
      alreadyAsked: z.boolean(),
    }),
  ),
});

export const OutreachDraftSchema = z.object({
  subject: z.string(),
  englishMessage: z.string(),
  localizedMessage: z.string(),
  language: z.enum(['en', 'fr', 'ar']),
  numberedQuestions: z.array(z.string()),
  factualRequestSummary: z.string(),
  quantitiesAndUnits: z.array(z.string()),
  senderDisclosure: z.string(),
  optOutSentence: z.string(),
});

const ReplyAnswerSchema = z
  .object({
    requirementKey: z.string().min(1),
    normalizedValue: ScalarSchema,
    displayValue: z.string(),
    status: z.enum(['confirmed', 'contradicted', 'unknown', 'not_applicable']),
    supportingExcerpt: z.string().min(1).max(1_000),
  })
  .superRefine((answer, context) => {
    if (answer.status === 'unknown' && answer.normalizedValue !== null) {
      context.addIssue({
        code: 'custom',
        path: ['normalizedValue'],
        message: 'Unknown answers must use a null normalized value.',
      });
    }
  });

const QuoteEvidenceFieldSchema = z.enum([
  'originalCurrency',
  'unitPrice',
  'samplePrice',
  'moq',
  'productionMinDays',
  'productionMaxDays',
  'shippingIncluded',
  'quoteBasis',
  'paymentTerms',
  'sampleTerms',
  'validUntil',
]);

export const SupplierReplySchema = z.object({
  supplierIdentitySignals: z.array(z.string()),
  answers: z.array(ReplyAnswerSchema).max(64),
  quote: z
    .object({
      originalCurrency: z.string().nullable(),
      unitPrice: z.number().nullable(),
      samplePrice: z.number().nullable(),
      moq: z.number().int().nullable(),
      productionMinDays: z.number().int().nullable(),
      productionMaxDays: z.number().int().nullable(),
      shippingIncluded: z.boolean().nullable(),
      quoteBasis: z.enum(['EXW', 'FOB', 'delivered', 'unknown']),
      paymentTerms: z.string().nullable(),
      sampleTerms: z.string().nullable(),
      validUntil: z.string().nullable(),
      fieldEvidence: z
        .array(
          z.object({
            field: QuoteEvidenceFieldSchema,
            supportingExcerpt: z.string().min(1).max(1_000),
          }),
        )
        .max(16),
    })
    .nullable(),
  customizationMethod: z.string().nullable(),
  documentationStatements: z.array(z.string()),
  exportStatement: z.string().nullable(),
  unresolvedQuestions: z.array(z.string()),
  contradictions: z.array(z.string()),
  attachmentReferences: z.array(z.string()),
});

export type SourcingBrief = z.infer<typeof SourcingBriefSchema>;
export type SupplierReply = z.infer<typeof SupplierReplySchema>;
