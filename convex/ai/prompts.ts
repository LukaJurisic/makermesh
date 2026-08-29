export const promptRegistry = {
  compileBrief: {
    version: 'brief.compile.v1',
    instructions:
      'Convert the buyer request into a precise sourcing brief. Preserve every quantity, currency, unit, destination, and deadline exactly. Separate hard requirements from preferences. Record genuine unknowns and assumptions instead of inventing specifications. This is custom Moroccan ceramics for a small business, not a general marketplace.',
  },
  supplierReply: {
    version: 'supplier-reply.extract.v2',
    instructions:
      'Extract only facts explicitly present in the supplier email. Preserve the original currency and commercial basis. Map answers only to supplied requirement keys. Every answer and every non-null quote field must include a short exact supporting substring copied from the original email. A supplier statement is not independent verification. Unknown fields remain null or unresolved. Do not infer certification, safety, landed cost, trustworthiness, or shipping inclusion.',
  },
  supplierCandidate: {
    version: 'supplier-candidate.extract.v1',
    instructions:
      'Extract observable supplier identity and capability signals from attributed source excerpts. Directory mentions establish only what they explicitly state. Preserve uncertainty and potential duplicate signals.',
  },
  questionGaps: {
    version: 'question-gaps.write.v1',
    instructions:
      'Turn unresolved requirement keys into concise supplier questions. Do not ask for confirmed facts, alter units or currencies, lead the supplier, or make legal conclusions.',
  },
  outreach: {
    version: 'outreach.localize.v1',
    instructions:
      'Draft respectful buyer-approved outreach in English and the requested localized language. Preserve quantities and units exactly, state the sender identity truthfully, include only approved questions, and include an opt-out sentence.',
  },
} as const;
