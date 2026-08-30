import {type Infer, v} from 'convex/values';
import type {Doc, Id} from '../_generated/dataModel';
import type {QueryCtx} from '../_generated/server';
import {evidenceStateValidator, scalarValueValidator} from './validators';

const MAX_PUBLIC_REQUIREMENTS = 40;
const MAX_PUBLIC_MAKERS = 10;
const MAX_PUBLIC_SOURCES = 50;
const MAX_PUBLIC_CLAIMS = 200;
const DEFAULT_MAKER_VISUAL = '/images/maker-hands-hero.webp';

const sourceTypeValidator = v.union(
  v.literal('official_site'),
  v.literal('directory'),
  v.literal('marketplace'),
  v.literal('supplier_email'),
  v.literal('demo_fixture'),
);

const projectSupplierStageValidator = v.union(
  v.literal('discovered'),
  v.literal('reviewed'),
  v.literal('outreach_selected'),
  v.literal('contacted'),
  v.literal('replied'),
);

export const publicDemoResearchValidator = v.object({
  theme: v.string(),
  brief: v.object({
    version: v.number(),
    rawRequest: v.string(),
    productName: v.string(),
    productCategory: v.string(),
    quantity: v.number(),
    unit: v.string(),
    destination: v.string(),
    budget: v.number(),
    budgetCurrency: v.string(),
    budgetBasis: v.union(v.null(), v.string()),
    deadlineDays: v.number(),
    customization: v.string(),
    dimensions: v.array(
      v.object({
        label: v.string(),
        value: v.union(v.null(), v.number()),
        unit: v.union(v.null(), v.string()),
      }),
    ),
    materials: v.array(v.string()),
    finish: v.array(v.string()),
    assumptions: v.array(v.string()),
    promptVersion: v.string(),
    extractionModel: v.union(v.null(), v.string()),
    approvedAt: v.number(),
  }),
  requirements: v.array(
    v.object({
      key: v.string(),
      label: v.string(),
      description: v.string(),
      type: v.union(v.literal('hard'), v.literal('soft')),
      operator: v.union(
        v.literal('lte'),
        v.literal('gte'),
        v.literal('equals'),
        v.literal('includes'),
        v.literal('one_of'),
        v.literal('stated'),
      ),
      targetValue: scalarValueValidator,
      unit: v.union(v.null(), v.string()),
      weight: v.number(),
      displayOrder: v.number(),
    }),
  ),
  makers: v.array(
    v.object({
      slug: v.string(),
      name: v.string(),
      location: v.string(),
      summary: v.string(),
      languages: v.optional(v.array(v.string())),
      visual: v.string(),
      demoSupplier: v.boolean(),
      stage: v.optional(projectSupplierStageValidator),
      openQuestionCount: v.optional(v.number()),
      publicSourceCount: v.number(),
      publicClaimCount: v.number(),
    }),
  ),
  sources: v.array(
    v.object({
      sourceKey: v.string(),
      makerSlug: v.string(),
      title: v.string(),
      url: v.string(),
      domain: v.string(),
      excerpt: v.string(),
      excerptTruncated: v.boolean(),
      observedAt: v.string(),
      sourceType: sourceTypeValidator,
      state: v.union(v.literal('active'), v.literal('stale')),
      truncated: v.boolean(),
      fixture: v.boolean(),
    }),
  ),
  claims: v.array(
    v.object({
      claimKey: v.string(),
      makerSlug: v.string(),
      requirementKey: v.string(),
      normalizedValue: scalarValueValidator,
      displayValue: v.string(),
      observationState: v.union(
        v.literal('observed'),
        v.literal('conflict'),
        v.literal('unknown'),
        v.literal('not_applicable'),
      ),
      evidenceState: evidenceStateValidator,
      sourceKey: v.string(),
      supportingExcerpt: v.string(),
      excerptTruncated: v.boolean(),
      observedAt: v.string(),
      extractionModel: v.union(v.null(), v.string()),
      promptVersion: v.union(v.null(), v.string()),
    }),
  ),
});

type PublicDemoResearch = Infer<typeof publicDemoResearchValidator>;

function clip(value: string, maxLength: number) {
  return {value: value.slice(0, maxLength), truncated: value.length > maxLength};
}

function boundedStrings(values: string[] | undefined, maxItems: number, maxLength: number) {
  return (values ?? []).slice(0, maxItems).map((value) => value.slice(0, maxLength));
}

function sourceIsPublicForMaker(source: Doc<'sources'>, supplier: Doc<'supplierEntities'>) {
  if (!source.publicSafe || source.status === 'failed' || source.supplierId !== supplier._id) {
    return false;
  }
  if (!supplier.demoSupplier && ['supplier_email', 'demo_fixture'].includes(source.sourceType)) {
    return false;
  }
  return source.canonicalUrl.startsWith('https://');
}

export async function loadPublicDemoResearch(
  ctx: QueryCtx,
  project: Doc<'projects'>,
): Promise<PublicDemoResearch | null> {
  if (!project.currentApprovedBriefId) return null;
  const brief = await ctx.db.get(project.currentApprovedBriefId);
  if (!brief || brief.projectId !== project._id || brief.approvedAt === undefined) return null;

  const [requirementRows, projectSupplierRows, sourceRows, claimRows] = await Promise.all([
    ctx.db
      .query('requirements')
      .withIndex('by_briefId_and_displayOrder', (index) => index.eq('briefId', brief._id))
      .take(MAX_PUBLIC_REQUIREMENTS + 1),
    ctx.db
      .query('projectSuppliers')
      .withIndex('by_projectId_and_stage', (index) => index.eq('projectId', project._id))
      .take(MAX_PUBLIC_MAKERS + 1),
    ctx.db
      .query('sources')
      .withIndex('by_projectId', (index) => index.eq('projectId', project._id))
      .take(MAX_PUBLIC_SOURCES + 1),
    ctx.db
      .query('capabilityClaims')
      .withIndex('by_projectId_and_supplierId', (index) => index.eq('projectId', project._id))
      .take(MAX_PUBLIC_CLAIMS + 1),
  ]);
  if (
    requirementRows.length > MAX_PUBLIC_REQUIREMENTS ||
    projectSupplierRows.length > MAX_PUBLIC_MAKERS ||
    sourceRows.length > MAX_PUBLIC_SOURCES ||
    claimRows.length > MAX_PUBLIC_CLAIMS
  ) {
    return null;
  }

  const loadedSuppliers = await Promise.all(
    projectSupplierRows.map(async (appearance) => ({
      appearance,
      supplier: await ctx.db.get(appearance.supplierId),
    })),
  );
  const makers = loadedSuppliers
    .filter(
      (item): item is {appearance: Doc<'projectSuppliers'>; supplier: Doc<'supplierEntities'>} =>
        item.supplier !== null && item.supplier.consentStatus !== 'suppressed',
    )
    .sort((left, right) =>
      left.supplier.canonicalName.localeCompare(right.supplier.canonicalName, 'en'),
    );
  if (new Set(makers.map((item) => item.supplier.slug)).size !== makers.length) return null;

  const makerById = new Map<
    Id<'supplierEntities'>,
    {appearance: Doc<'projectSuppliers'>; supplier: Doc<'supplierEntities'>}
  >(makers.map((item) => [item.supplier._id, item]));
  const publicSourceRows = sourceRows
    .filter((source) => {
      if (!source.supplierId) return false;
      const maker = makerById.get(source.supplierId);
      return maker ? sourceIsPublicForMaker(source, maker.supplier) : false;
    })
    .sort(
      (left, right) =>
        left.fetchedAt - right.fetchedAt ||
        left.canonicalUrl.localeCompare(right.canonicalUrl, 'en') ||
        left.title.localeCompare(right.title, 'en'),
    );

  const sourceKeyById = new Map<Id<'sources'>, string>();
  const publicSourceById = new Map<Id<'sources'>, Doc<'sources'>>();
  const publicSources = publicSourceRows.map((source, index) => {
    const sourceKey = `source-${String(index + 1).padStart(2, '0')}`;
    sourceKeyById.set(source._id, sourceKey);
    publicSourceById.set(source._id, source);
    const supplier = makerById.get(source.supplierId!)!.supplier;
    const title = clip(source.title, 200);
    const excerpt = clip(source.excerpt, 600);
    return {
      sourceKey,
      makerSlug: supplier.slug,
      title: title.value,
      url: source.canonicalUrl.slice(0, 2_048),
      domain: source.domain.slice(0, 160),
      excerpt: excerpt.value,
      excerptTruncated: excerpt.truncated,
      observedAt: new Date(source.fetchedAt).toISOString(),
      sourceType: source.sourceType,
      state: source.status === 'stale' ? ('stale' as const) : ('active' as const),
      truncated: source.truncated,
      fixture: supplier.demoSupplier,
    };
  });

  const publicClaims = claimRows
    .filter((claim) => {
      const maker = makerById.get(claim.supplierId);
      if (!maker || !claim.sourceId) return false;
      const source = publicSourceById.get(claim.sourceId);
      if (!source || source.supplierId !== claim.supplierId) return false;
      if (!claim.supportingExcerpt || !source.excerpt.includes(claim.supportingExcerpt))
        return false;
      return (
        maker.supplier.demoSupplier ||
        (claim.evidenceState === 'public_source' && claim.status === 'confirmed')
      );
    })
    .sort(
      (left, right) =>
        left.observedAt - right.observedAt ||
        left.key.localeCompare(right.key, 'en') ||
        String(left._id).localeCompare(String(right._id), 'en'),
    )
    .map((claim, index) => {
      const excerpt = clip(claim.supportingExcerpt, 500);
      return {
        claimKey: `claim-${String(index + 1).padStart(3, '0')}`,
        makerSlug: makerById.get(claim.supplierId)!.supplier.slug,
        requirementKey: claim.key.slice(0, 80),
        normalizedValue: claim.normalizedValue,
        displayValue: claim.displayValue.slice(0, 300),
        observationState:
          claim.status === 'unknown'
            ? ('unknown' as const)
            : claim.status === 'not_applicable'
              ? ('not_applicable' as const)
              : claim.status === 'contradicted'
                ? ('conflict' as const)
                : ('observed' as const),
        evidenceState: claim.evidenceState,
        sourceKey: sourceKeyById.get(claim.sourceId!)!,
        supportingExcerpt: excerpt.value,
        excerptTruncated: excerpt.truncated,
        observedAt: new Date(claim.observedAt).toISOString(),
        extractionModel: claim.extractionModel?.slice(0, 120) ?? null,
        promptVersion: claim.promptVersion?.slice(0, 120) ?? null,
      };
    });

  const sourceCountByMaker = new Map<string, number>();
  for (const source of publicSources) {
    sourceCountByMaker.set(source.makerSlug, (sourceCountByMaker.get(source.makerSlug) ?? 0) + 1);
  }
  const claimCountByMaker = new Map<string, number>();
  for (const claim of publicClaims) {
    claimCountByMaker.set(claim.makerSlug, (claimCountByMaker.get(claim.makerSlug) ?? 0) + 1);
  }

  return {
    theme: `${brief.productCategory} · ${brief.productName}`.slice(0, 240),
    brief: {
      version: brief.version,
      rawRequest: brief.rawRequest.slice(0, 12_000),
      productName: brief.productName.slice(0, 200),
      productCategory: brief.productCategory.slice(0, 200),
      quantity: brief.quantity,
      unit: brief.unit.slice(0, 40),
      destination: brief.destination.slice(0, 160),
      budget: brief.budget,
      budgetCurrency: brief.budgetCurrency.slice(0, 12),
      budgetBasis: brief.budgetBasis?.slice(0, 200) ?? null,
      deadlineDays: brief.deadlineDays,
      customization: brief.customization.slice(0, 500),
      dimensions: (brief.dimensions ?? []).slice(0, 20).map((dimension) => ({
        label: dimension.label.slice(0, 120),
        value: dimension.value,
        unit: dimension.unit?.slice(0, 40) ?? null,
      })),
      materials: boundedStrings(brief.materials, 20, 120),
      finish: boundedStrings(brief.finish, 20, 120),
      assumptions: boundedStrings(brief.assumptions, 20, 500),
      promptVersion: brief.promptVersion.slice(0, 120),
      extractionModel: brief.extractionModel?.slice(0, 120) ?? null,
      approvedAt: brief.approvedAt,
    },
    requirements: requirementRows.map((requirement) => ({
      key: requirement.key.slice(0, 80),
      label: requirement.label.slice(0, 140),
      description: requirement.description.slice(0, 500),
      type: requirement.type,
      operator: requirement.operator,
      targetValue: requirement.targetValue,
      unit: requirement.unit?.slice(0, 40) ?? null,
      weight: requirement.weight,
      displayOrder: requirement.displayOrder,
    })),
    makers: makers.map(({appearance, supplier}) => ({
      slug: supplier.slug.slice(0, 120),
      name: supplier.canonicalName.slice(0, 200),
      location: `${supplier.city}, ${supplier.country}`.slice(0, 240),
      summary: supplier.demoSupplier
        ? supplier.summary.slice(0, 500)
        : 'Observed public supplier footprint. Open the attributed sources for details.',
      visual:
        supplier.demoSupplier && supplier.visualPath?.startsWith('/images/')
          ? supplier.visualPath.slice(0, 240)
          : DEFAULT_MAKER_VISUAL,
      demoSupplier: supplier.demoSupplier,
      ...(supplier.demoSupplier
        ? {
            languages: boundedStrings(supplier.languages, 20, 80),
            stage: appearance.stage,
            openQuestionCount: appearance.openQuestionCount,
          }
        : {}),
      publicSourceCount: sourceCountByMaker.get(supplier.slug) ?? 0,
      publicClaimCount: claimCountByMaker.get(supplier.slug) ?? 0,
    })),
    sources: publicSources,
    claims: publicClaims,
  };
}
