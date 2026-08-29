import type {
  ActivityEvent,
  Maker,
  Requirement,
  RequirementEvaluation,
  RequirementOutcome,
  SourceEvidence,
} from '@/domain/types';

export const demoRequirements: Requirement[] = [
  {
    key: 'moq_max',
    label: 'Maximum MOQ',
    description: 'The minimum order must not exceed 250 cups.',
    type: 'hard',
    operator: 'lte',
    targetValue: 250,
    unit: 'units',
    weight: 0,
  },
  {
    key: 'capacity',
    label: 'Eight-ounce capacity',
    description: 'Maker can produce an approximately eight-ounce cup.',
    type: 'hard',
    operator: 'equals',
    targetValue: 8,
    unit: 'oz',
    weight: 0,
  },
  {
    key: 'custom_logo',
    label: 'Custom café logo',
    description: 'Maker supports an approved custom-logo method.',
    type: 'hard',
    operator: 'equals',
    targetValue: true,
    weight: 0,
  },
  {
    key: 'lead_time',
    label: 'Production within 42 days',
    description: 'Production estimate must not exceed 42 calendar days.',
    type: 'hard',
    operator: 'lte',
    targetValue: 42,
    unit: 'days',
    weight: 0,
  },
  {
    key: 'food_contact_docs',
    label: 'Food-contact documentation stated',
    description: 'Maker states which glaze or food-contact documentation can be supplied.',
    type: 'hard',
    operator: 'stated',
    targetValue: true,
    weight: 0,
  },
  {
    key: 'sample',
    label: 'Sample before production',
    description: 'A paid or credited sample is available before the order.',
    type: 'hard',
    operator: 'equals',
    targetValue: true,
    weight: 0,
  },
  {
    key: 'language',
    label: 'English or French',
    description: 'Maker can communicate in English or French.',
    type: 'hard',
    operator: 'includes',
    targetValue: 'English or French',
    weight: 0,
  },
  {
    key: 'export_history',
    label: 'Export history stated',
    description: 'Maker explains whether it has exported previously.',
    type: 'hard',
    operator: 'stated',
    targetValue: true,
    weight: 0,
  },
  {
    key: 'handmade',
    label: 'Handmade or small batch',
    description: 'Production shows a handmade or small-batch process.',
    type: 'soft',
    operator: 'equals',
    targetValue: true,
    weight: 20,
  },
  {
    key: 'finish',
    label: 'Matte sand or off-white',
    description: 'Base finish fits the muted café palette.',
    type: 'soft',
    operator: 'includes',
    targetValue: 'matte sand or off-white',
    weight: 15,
  },
  {
    key: 'detail_colour',
    label: 'Green or ink-blue detailing',
    description: 'Maker can apply restrained dark green or ink-blue details.',
    type: 'soft',
    operator: 'includes',
    targetValue: 'dark green or ink-blue',
    weight: 10,
  },
  {
    key: 'variation',
    label: 'Visible artisanal variation',
    description: 'Finished pieces may retain controlled handmade variation.',
    type: 'soft',
    operator: 'equals',
    targetValue: true,
    weight: 15,
  },
  {
    key: 'export_packaging',
    label: 'International packaging',
    description: 'Packaging is suitable for international transport.',
    type: 'soft',
    operator: 'stated',
    targetValue: true,
    weight: 15,
  },
  {
    key: 'production_centre',
    label: 'Moroccan production centre',
    description: 'Workshop is in Fez, Safi, Marrakech, or another production centre.',
    type: 'soft',
    operator: 'equals',
    targetValue: true,
    weight: 10,
  },
  {
    key: 'preferred_moq',
    label: 'MOQ below 200',
    description: 'MOQ below the requested quantity is preferred.',
    type: 'soft',
    operator: 'lte',
    targetValue: 199,
    unit: 'units',
    weight: 10,
  },
  {
    key: 'preferred_timing',
    label: 'Production below 35 days',
    description: 'A maximum estimate below 35 days is preferred.',
    type: 'soft',
    operator: 'lte',
    targetValue: 34,
    unit: 'days',
    weight: 5,
  },
];

export const demoBrief = {
  buyer: 'Harbour Coffee Lab',
  destination: 'Toronto, Canada',
  product: 'Handcrafted ceramic espresso cups',
  quantity: 200,
  capacity: '8 oz',
  deadline: '42 calendar days',
  budget: 'CAD $3,500 product budget',
  rawRequest:
    'Produce 200 handcrafted eight-ounce ceramic espresso cups for a Toronto café, with a custom logo, a sample before production, and a matte sand finish.',
  assumptions: [
    'Freight, customs, taxes, and duties are outside the product budget.',
    'Supplier currencies remain original and are not silently converted.',
    'EXW, FOB, and delivered prices are not compared as equivalents.',
  ],
  unknowns: [
    'Exact rim diameter and cup height',
    'Final logo artwork and application tolerance',
    'Carton configuration and breakage allowance',
  ],
};

const source = (
  id: string,
  title: string,
  excerpt: string,
  evidenceState: SourceEvidence['evidenceState'] = 'public_source',
): SourceEvidence => ({
  id,
  title,
  url: `https://demo.makermesh.invalid/evidence/${id}`,
  domain: 'demo.makermesh.invalid',
  excerpt,
  observedAt: '2026-08-29T14:34:19.000Z',
  sourceType: evidenceState === 'supplier_claimed' ? 'supplier_email' : 'demo_fixture',
  evidenceState,
  fixture: true,
});

const evaluation = (
  key: string,
  outcome: RequirementOutcome,
  displayValue: string,
  evidenceId?: string,
): RequirementEvaluation => {
  const requirement = demoRequirements.find((item) => item.key === key);
  if (!requirement) throw new Error(`Missing demo requirement: ${key}`);
  return {
    requirementKey: key,
    requirementLabel: requirement.label,
    type: requirement.type,
    outcome,
    weight: requirement.weight,
    hasActiveEvidence: Boolean(evidenceId) && outcome !== 'unknown',
    displayValue,
    evidenceId,
    reason:
      outcome === 'unknown'
        ? 'No active evidence answers this requirement.'
        : 'Deterministic evaluation of the cited fixture claim.',
  };
};

const atlasSources = [
  source(
    'atlas-reply',
    'Controlled French reply — demonstration fixture',
    'Nous pouvons produire 200 tasses. Notre minimum est de 150 unités et le délai estimé est de 30 à 35 jours.',
    'supplier_claimed',
  ),
  source(
    'atlas-techniques',
    'Atlas technique notes — demonstration fixture',
    'Décor au choix par décalcomanie ou peinture à la main. Les documents de contact alimentaire peuvent être partagés.',
    'supplier_claimed',
  ),
  source(
    'atlas-export',
    'Atlas export statement — demonstration fixture',
    'Nous avons déjà expédié des commandes en Europe. Le transport n’est pas inclus.',
    'supplier_claimed',
  ),
];

const atlasEvaluations = [
  evaluation('moq_max', 'pass', '150 units', 'atlas-reply'),
  evaluation('capacity', 'pass', '8 oz supported', 'atlas-reply'),
  evaluation('custom_logo', 'pass', 'Decal or hand-painted', 'atlas-techniques'),
  evaluation('lead_time', 'pass', '30–35 days', 'atlas-reply'),
  evaluation('food_contact_docs', 'pass', 'Documents can be shared', 'atlas-techniques'),
  evaluation('sample', 'pass', 'Sample available for 650 MAD', 'atlas-reply'),
  evaluation('language', 'pass', 'French; English supported', 'atlas-reply'),
  evaluation('export_history', 'pass', 'Previous European shipments', 'atlas-export'),
  evaluation('handmade', 'pass', 'Small-batch hand finishing', 'atlas-techniques'),
  evaluation('finish', 'pass', 'Matte sand glaze available', 'atlas-techniques'),
  evaluation('detail_colour', 'pass', 'Green or blue detailing', 'atlas-techniques'),
  evaluation('variation', 'pass', 'Controlled handmade variation', 'atlas-techniques'),
  evaluation('export_packaging', 'unknown', 'Packaging question remains open'),
  evaluation('production_centre', 'pass', 'Safi, Morocco', 'atlas-techniques'),
  evaluation('preferred_moq', 'pass', '150 units', 'atlas-reply'),
  evaluation('preferred_timing', 'fail', 'Maximum estimate is 35 days', 'atlas-reply'),
];

const partialEvaluations = (
  prefix: string,
  options: {moq?: RequirementOutcome; lead?: RequirementOutcome; language?: RequirementOutcome},
) => [
  evaluation(
    'moq_max',
    options.moq ?? 'unknown',
    options.moq === 'fail' ? '300 units' : 'Unknown',
    `${prefix}-profile`,
  ),
  evaluation('capacity', 'unknown', 'Unknown'),
  evaluation('custom_logo', 'unknown', 'Unknown'),
  evaluation(
    'lead_time',
    options.lead ?? 'unknown',
    options.lead === 'pass' ? '38–40 days' : 'Unknown',
    options.lead === 'pass' ? `${prefix}-profile` : undefined,
  ),
  evaluation('food_contact_docs', 'unknown', 'Unknown'),
  evaluation('sample', 'unknown', 'Unknown'),
  evaluation(
    'language',
    options.language ?? 'unknown',
    options.language === 'pass' ? 'French' : 'Unknown',
    options.language === 'pass' ? `${prefix}-profile` : undefined,
  ),
  evaluation('export_history', 'unknown', 'Unknown'),
  evaluation('handmade', 'pass', 'Observed small-batch process', `${prefix}-profile`),
  evaluation('finish', 'pass', 'Neutral matte glazes shown', `${prefix}-profile`),
  evaluation('detail_colour', 'unknown', 'Unknown'),
  evaluation('variation', 'pass', 'Visible handmade variation', `${prefix}-profile`),
  evaluation('export_packaging', 'unknown', 'Unknown'),
  evaluation('production_centre', 'pass', 'Moroccan workshop', `${prefix}-profile`),
  evaluation('preferred_moq', 'unknown', 'Unknown'),
  evaluation('preferred_timing', 'unknown', 'Unknown'),
];

export const demoMakers: Maker[] = [
  {
    id: 'atlas',
    slug: 'atlas-clay-studio',
    name: 'Atlas Clay Studio',
    location: 'Safi, Morocco',
    summary: 'Fictional small-batch workshop with a controlled French quote and reply.',
    languages: ['French', 'English'],
    visual: '/images/espresso-cup-study.webp',
    demoSupplier: true,
    fixture: true,
    capabilities: ['Hand finishing', 'Custom decal', 'Hand-painted detail', 'Hospitality ware'],
    evaluations: atlasEvaluations,
    sources: atlasSources,
    quote: {
      currency: 'MAD',
      unitPrice: 72,
      samplePrice: 650,
      moq: 150,
      productionMinDays: 30,
      productionMaxDays: 35,
      shippingIncluded: false,
      quoteBasis: 'EXW',
      pricingUnit: 'per finished cup',
      sampleTerms: 'Paid sample available before production',
    },
    openQuestionCount: 1,
    latestActivity: 'Reply structured 2 min ago',
  },
  ...[
    ['fez-form', 'Fez Form House', 'Fez, Morocco', {language: 'pass' as const}],
    ['safi-tableware', 'Safi Tableware Lab', 'Safi, Morocco', {moq: 'fail' as const}],
    ['marrakech-kiln', 'Marrakech Kiln Studio', 'Marrakech, Morocco', {lead: 'pass' as const}],
    ['coastal-clay', 'Coastal Clay Cooperative', 'Essaouira, Morocco', {}],
    ['riad-form', 'Riad Form Workshop', 'Meknes, Morocco', {language: 'pass' as const}],
  ].map(([id, name, location, options], index): Maker => {
    const sourceId = `${id as string}-profile`;
    return {
      id: id as string,
      slug: id as string,
      name: name as string,
      location: location as string,
      summary: 'Demonstration discovery record with partial public-source-style evidence.',
      languages: index % 2 === 0 ? ['French'] : [],
      visual: index % 2 === 0 ? '/images/maker-hands-hero.webp' : '/images/espresso-cup-study.webp',
      demoSupplier: true,
      fixture: true,
      capabilities: ['Ceramic tableware', 'Small-batch production'],
      evaluations: partialEvaluations(
        id as string,
        options as Parameters<typeof partialEvaluations>[1],
      ),
      sources: [
        source(
          sourceId,
          `${name as string} profile — demonstration fixture`,
          'A fictional source excerpt showing handmade ceramic tableware and workshop location. Commercial terms are not stated.',
        ),
        source(
          `${id as string}-catalog`,
          `${name as string} product notes — demonstration fixture`,
          'A fictional supporting excerpt showing neutral glazes and small-batch tableware forms. MOQ and delivery timing are not stated.',
        ),
        ...(index < 4
          ? [
              source(
                `${id as string}-directory`,
                `${name as string} directory mention — demonstration fixture`,
                'A fictional directory-style mention establishing only the workshop name and Moroccan production location.',
              ),
            ]
          : []),
      ],
      openQuestionCount: [2, 3, 2, 3, 2][index] ?? 2,
      latestActivity: `${4 + index} min ago`,
    };
  }),
];

export const demoActivity: ActivityEvent[] = [
  {
    id: '1',
    provider: 'Firecrawl',
    label: '17 fixture pages analyzed',
    status: 'completed',
    occurredAt: '10:34:12',
    latency: '4.2s',
    fixture: true,
  },
  {
    id: '2',
    provider: 'OpenAI',
    label: 'Capability claims structured',
    status: 'completed',
    occurredAt: '10:34:19',
    latency: '2.1s',
    fixture: true,
  },
  {
    id: '3',
    provider: 'Convex',
    label: 'Research state synchronized',
    status: 'completed',
    occurredAt: '10:34:19',
    latency: '38ms',
    fixture: true,
  },
  {
    id: '4',
    provider: 'AgentMail',
    label: 'Controlled RFQ delivered',
    status: 'completed',
    occurredAt: '10:35:02',
    latency: '1.4s',
    fixture: true,
  },
  {
    id: '5',
    provider: 'AgentMail',
    label: 'Demo supplier reply received',
    status: 'completed',
    occurredAt: '10:36:41',
    fixture: true,
  },
  {
    id: '6',
    provider: 'OpenAI',
    label: 'French quote normalized',
    status: 'completed',
    occurredAt: '10:36:47',
    latency: '1.8s',
    fixture: true,
  },
];

export const outreachDraft = {
  recipient: 'controlled-demo-recipient@redacted.invalid',
  recipientSource: 'Allowlisted project-owner address',
  subject: 'Demande de devis — 200 tasses à espresso personnalisées',
  english: `Hello,\n\nMakerMesh is writing on behalf of Harbour Coffee Lab, a fictional demonstration buyer in Toronto. We are seeking 200 handcrafted eight-ounce ceramic espresso cups.\n\nCould you confirm the questions listed beside this draft? This controlled demonstration message will not be sent to a real supplier.\n\nThank you,\nMakerMesh on behalf of Harbour Coffee Lab\n\nIf you prefer not to receive another message, please tell us and we will suppress the address.`,
  french: `Bonjour,\n\nMakerMesh vous contacte au nom de Harbour Coffee Lab, un acheteur fictif de démonstration à Toronto. Nous recherchons 200 tasses à espresso artisanales de 8 onces.\n\nPourriez-vous confirmer les questions indiquées à côté de ce brouillon ? Ce message de démonstration contrôlé ne sera pas envoyé à un véritable fournisseur.\n\nMerci,\nMakerMesh pour Harbour Coffee Lab\n\nSi vous ne souhaitez pas recevoir d’autre message, dites-le-nous et nous supprimerons l’adresse.`,
  questions: [
    'Quel emballage utilisez-vous pour limiter la casse pendant un transport international ?',
    'Les 650 MAD pour l’échantillon incluent-ils l’application du logo ?',
    'Quelles modalités de paiement proposez-vous pour la commande de production ?',
  ],
};

export const demoMetrics = {
  sources: demoMakers.reduce((sum, maker) => sum + maker.sources.length, 0),
  makers: demoMakers.length,
  claims: demoMakers.reduce(
    (sum, maker) => sum + maker.evaluations.filter((item) => item.hasActiveEvidence).length,
    0,
  ),
  questions: demoMakers.reduce((sum, maker) => sum + maker.openQuestionCount, 0),
  replies: 1,
};
