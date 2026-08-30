import {v} from 'convex/values';
import type {Id} from './_generated/dataModel';
import {internalMutation} from './_generated/server';
import {
  activityFixtures,
  DEMO_BASELINE_SLUG,
  DEMO_BASELINE_VERSION,
  DEMO_PROJECT_SLUG,
  DEMO_TIMESTAMP,
  requirementFixtures,
  supplierFixtures,
} from './fixtures/demoData';

export const ensureDemoBaseline = internalMutation({
  args: {},
  returns: v.object({
    created: v.boolean(),
    projectId: v.id('projects'),
    baselineId: v.id('demoBaselines'),
    supplierCount: v.number(),
    sourceCount: v.number(),
    claimCount: v.number(),
  }),
  handler: async (ctx) => {
    const existing = await ctx.db
      .query('demoBaselines')
      .withIndex('by_slug_and_version', (query) =>
        query.eq('slug', DEMO_BASELINE_SLUG).eq('version', DEMO_BASELINE_VERSION),
      )
      .unique();
    if (existing) {
      const project = await ctx.db.get(existing.baselineProjectId);
      if (!project || project.dataMode !== 'demo_baseline' || !project.demoMode) {
        throw new Error('Existing demo baseline does not reference a sanitized demo project.');
      }
      const linkedBrief = project.currentApprovedBriefId
        ? await ctx.db.get(project.currentApprovedBriefId)
        : null;
      if (
        !linkedBrief ||
        linkedBrief.projectId !== project._id ||
        linkedBrief.approvedAt === undefined
      ) {
        throw new Error('Existing demo baseline has no valid approved sourcing brief link.');
      }
      const metrics = await ctx.db
        .query('projectMetrics')
        .withIndex('by_projectId', (query) => query.eq('projectId', project._id))
        .unique();
      if (!metrics) throw new Error('Existing demo baseline metrics are missing.');
      if (existing.status !== 'published') {
        const published = await ctx.db
          .query('demoBaselines')
          .withIndex('by_slug_and_status', (query) =>
            query.eq('slug', DEMO_BASELINE_SLUG).eq('status', 'published'),
          )
          .take(2);
        if (published.length > 1) {
          throw new Error('Multiple published demo baselines require manual reconciliation.');
        }
        const current = published[0];
        if (!current) {
          await ctx.db.patch(existing._id, {status: 'published'});
        } else if (current.version < existing.version) {
          await ctx.db.patch(current._id, {status: 'retired'});
          await ctx.db.patch(existing._id, {status: 'published'});
        } else if (current.version === existing.version) {
          throw new Error('Published demo baseline version conflicts with fixture seed history.');
        }
      }
      return {
        created: false,
        projectId: existing.baselineProjectId,
        baselineId: existing._id,
        supplierCount: metrics.makersDiscovered,
        sourceCount: metrics.sourcesAnalyzed,
        claimCount: metrics.claimsExtracted,
      };
    }

    const projectId = await ctx.db.insert('projects', {
      title: 'Espresso cups for Harbour Coffee Lab',
      slug: DEMO_PROJECT_SLUG,
      buyerName: 'Harbour Coffee Lab',
      destination: 'Toronto, Canada',
      defaultCurrency: 'CAD',
      status: 'comparing',
      dataMode: 'demo_baseline',
      demoMode: true,
      presentationMode: false,
      createdAt: DEMO_TIMESTAMP,
      updatedAt: DEMO_TIMESTAMP,
    });

    const briefId = await ctx.db.insert('briefs', {
      projectId,
      version: 1,
      rawRequest:
        'Produce 200 handcrafted eight-ounce ceramic espresso cups for a Toronto café, with a custom logo, a sample before production, and a matte sand finish.',
      productName: 'Handcrafted ceramic espresso cups',
      productCategory: 'custom Moroccan ceramics',
      quantity: 200,
      unit: 'cups',
      destination: 'Toronto, Canada',
      budget: 3_500,
      budgetCurrency: 'CAD',
      deadlineDays: 42,
      customization: 'Custom café logo by approved decal or hand-painted method',
      approvedAt: DEMO_TIMESTAMP,
      promptVersion: 'fixture.manual.v1',
      createdAt: DEMO_TIMESTAMP,
    });
    await ctx.db.patch(projectId, {currentApprovedBriefId: briefId});

    const requirementIds = new Map<string, Id<'requirements'>>();
    for (const [
      key,
      label,
      description,
      type,
      operator,
      targetValue,
      unit,
      weight,
    ] of requirementFixtures) {
      const requirementId = await ctx.db.insert('requirements', {
        projectId,
        briefId,
        key,
        label,
        description,
        type,
        operator,
        targetValue,
        ...(unit ? {unit} : {}),
        weight,
        displayOrder: requirementIds.size,
      });
      requirementIds.set(key, requirementId);
    }

    const supplierIds = new Map<string, Id<'supplierEntities'>>();
    for (const supplier of supplierFixtures) {
      const supplierId = await ctx.db.insert('supplierEntities', {
        canonicalName: supplier.name,
        slug: supplier.slug,
        country: 'Morocco',
        city: supplier.city,
        languages: [...supplier.languages],
        summary: supplier.summary,
        demoSupplier: true,
        consentStatus: 'preview_only',
        visualPath: supplier.visualPath,
        createdAt: DEMO_TIMESTAMP,
        updatedAt: DEMO_TIMESTAMP,
      });
      supplierIds.set(supplier.slug, supplierId);
      await ctx.db.insert('projectSuppliers', {
        projectId,
        supplierId,
        stage: supplier.stage,
        eligibility: supplier.eligibility,
        preferenceFit: supplier.preferenceFit,
        evidenceCoverage: supplier.evidenceCoverage,
        commercialCompleteness: supplier.commercialCompleteness,
        openQuestionCount: supplier.openQuestions,
        latestActivityAt: DEMO_TIMESTAMP,
      });
      await ctx.db.insert('supplierAliases', {
        supplierId,
        aliasType: 'name',
        aliasValue: supplier.name,
        normalizedValue: supplier.name.toLocaleLowerCase('en-US'),
      });
    }

    let sourceCount = 0;
    const sourceIdsBySupplier = new Map<string, Array<Id<'sources'>>>();
    for (const [supplierIndex, supplier] of supplierFixtures.entries()) {
      const supplierId = supplierIds.get(supplier.slug)!;
      const desiredCount = supplierIndex === 0 ? 3 : supplierIndex < 5 ? 3 : 2;
      const sourceIds: Array<Id<'sources'>> = [];
      for (let sourceIndex = 0; sourceIndex < desiredCount; sourceIndex += 1) {
        const sourceId = await ctx.db.insert('sources', {
          projectId,
          supplierId,
          sourceType: sourceIndex === 0 ? 'supplier_email' : 'demo_fixture',
          canonicalUrl: `https://demo.makermesh.invalid/${supplier.slug}/source-${sourceIndex + 1}`,
          title: `${supplier.name} fixture evidence ${sourceIndex + 1}`,
          domain: 'demo.makermesh.invalid',
          fetchedAt: DEMO_TIMESTAMP + sourceIndex,
          contentHash: `fixture-${supplier.slug}-${sourceIndex + 1}-v1`,
          excerpt:
            supplierIndex === 0
              ? 'Controlled fictional French reply supporting the Atlas Clay Studio demonstration record.'
              : 'Fictional source-style excerpt with partial observed capabilities and explicit unknown commercial terms.',
          truncated: false,
          status: 'active',
          publicSafe: true,
        });
        sourceIds.push(sourceId);
        sourceCount += 1;
      }
      sourceIdsBySupplier.set(supplier.slug, sourceIds);
    }

    let claimCount = 0;
    const atlasClaimIds = new Map<string, Id<'capabilityClaims'>>();
    const atlasValues = [
      ['moq_max', 150, '150 units', 'confirmed', 'supplier_claimed'],
      ['capacity', 8, '8 oz supported', 'confirmed', 'supplier_claimed'],
      ['custom_logo', true, 'Decal or hand-painted', 'confirmed', 'supplier_claimed'],
      ['lead_time', 35, '30–35 days', 'confirmed', 'supplier_claimed'],
      ['food_contact_docs', true, 'Documents can be shared', 'confirmed', 'supplier_claimed'],
      ['sample', true, 'Sample available for 650 MAD', 'confirmed', 'supplier_claimed'],
      [
        'language',
        'French and English',
        'French; English supported',
        'confirmed',
        'supplier_claimed',
      ],
      ['export_history', true, 'Previous European shipments', 'confirmed', 'supplier_claimed'],
      ['handmade', true, 'Small-batch hand finishing', 'confirmed', 'supplier_claimed'],
      ['finish', 'matte sand', 'Matte sand glaze available', 'confirmed', 'supplier_claimed'],
      [
        'detail_colour',
        'green or blue',
        'Green or blue detailing',
        'confirmed',
        'supplier_claimed',
      ],
      ['variation', true, 'Controlled handmade variation', 'confirmed', 'supplier_claimed'],
      ['production_centre', 'Safi', 'Safi, Morocco', 'confirmed', 'supplier_claimed'],
      ['preferred_moq', 150, '150 units', 'confirmed', 'supplier_claimed'],
      ['preferred_timing', 35, 'Maximum estimate is 35 days', 'contradicted', 'supplier_claimed'],
    ] as const;
    const atlasId = supplierIds.get('atlas-clay-studio')!;
    const atlasSourceId = sourceIdsBySupplier.get('atlas-clay-studio')![0]!;
    for (const [key, normalizedValue, displayValue, status, evidenceState] of atlasValues) {
      const claimId = await ctx.db.insert('capabilityClaims', {
        projectId,
        supplierId: atlasId,
        requirementId: requirementIds.get(key),
        key,
        normalizedValue,
        displayValue,
        status,
        evidenceState,
        sourceId: atlasSourceId,
        agentMailMessageId: 'demo-message-redacted',
        supportingExcerpt:
          'Controlled fictional French reply supporting the Atlas Clay Studio demonstration record.',
        observedAt: DEMO_TIMESTAMP,
        extractionModel: 'fixture-manual',
        promptVersion: 'supplier-reply.fixture.v1',
      });
      atlasClaimIds.set(key, claimId);
      claimCount += 1;
    }

    const remainingClaimCounts = [5, 5, 5, 5, 4];
    for (const [index, supplier] of supplierFixtures.slice(1).entries()) {
      const supplierId = supplierIds.get(supplier.slug)!;
      const sourceId = sourceIdsBySupplier.get(supplier.slug)![0]!;
      for (let claimIndex = 0; claimIndex < remainingClaimCounts[index]!; claimIndex += 1) {
        await ctx.db.insert('capabilityClaims', {
          projectId,
          supplierId,
          key: `observed_capability_${claimIndex + 1}`,
          normalizedValue: true,
          displayValue: 'Observed fixture capability',
          status: 'confirmed',
          evidenceState: 'public_source',
          sourceId,
          supportingExcerpt:
            'Fictional source-style excerpt with partial observed capabilities and explicit unknown commercial terms.',
          observedAt: DEMO_TIMESTAMP,
          extractionModel: 'fixture-manual',
          promptVersion: 'supplier-extract.fixture.v1',
        });
        claimCount += 1;
      }
    }

    for (const [key, requirementId] of requirementIds.entries()) {
      const claimId = atlasClaimIds.get(key);
      const unknown = key === 'export_packaging';
      await ctx.db.insert('requirementEvaluations', {
        projectId,
        supplierId: atlasId,
        requirementId,
        outcome: unknown ? 'unknown' : key === 'preferred_timing' ? 'fail' : 'pass',
        reasonCode: unknown ? 'missing_active_claim' : 'fixture_claim_evaluated',
        displayValue: unknown ? 'Packaging question remains open' : 'Deterministic fixture result',
        evidenceClaimIds: claimId ? [claimId] : [],
        evaluatorVersion: 'requirements.v1',
        evaluatedAt: DEMO_TIMESTAMP,
      });
    }

    await ctx.db.insert('quotes', {
      projectId,
      supplierId: atlasId,
      sourceMessageId: 'demo-message-redacted',
      parserVersion: 'supplier-reply.fixture.v1',
      originalCurrency: 'MAD',
      unitPrice: 72,
      samplePrice: 650,
      moq: 150,
      productionMinDays: 30,
      productionMaxDays: 35,
      shippingIncluded: false,
      quoteBasis: 'EXW',
      sampleTerms: 'Paid sample available before production',
      parsedAt: DEMO_TIMESTAMP,
      extractionModel: 'fixture-manual',
      promptVersion: 'supplier-reply.fixture.v1',
    });

    await ctx.db.insert('outreachDrafts', {
      projectId,
      briefId,
      supplierId: atlasId,
      recipient: 'controlled-demo-recipient@redacted.invalid',
      recipientSource: 'Allowlisted project-owner address',
      subject: 'Demande de devis — 200 tasses à espresso personnalisées',
      bodyEnglish: 'Controlled fictional English outreach fixture.',
      bodyLocalized: 'Brouillon fictif contrôlé en français.',
      language: 'fr',
      questionKeys: ['export_packaging', 'sample_terms', 'payment_terms'],
      status: 'delivered',
      idempotencyKey: 'fixture-atlas-outreach-v1',
      approvedAt: DEMO_TIMESTAMP,
      sentAt: DEMO_TIMESTAMP,
    });

    for (const [index, [provider, eventType, label, latencyMs]] of activityFixtures.entries()) {
      await ctx.db.insert('activityEvents', {
        projectId,
        ...(index >= 3 ? {supplierId: atlasId} : {}),
        provider,
        eventType,
        label,
        status: 'completed',
        safeMetadata: {fixture: true, ...(latencyMs ? {latencyMs} : {})},
        occurredAt: DEMO_TIMESTAMP + index * 1_000,
        publicSafe: true,
      });
    }

    await ctx.db.insert('projectMetrics', {
      projectId,
      sourcesAnalyzed: sourceCount,
      makersDiscovered: supplierIds.size,
      claimsExtracted: claimCount,
      openQuestions: 13,
      repliesReceived: 1,
      updatedAt: DEMO_TIMESTAMP,
    });

    await ctx.db.insert('comparisonSettings', {
      projectId,
      weights: {
        preferenceFit: 40,
        evidenceCoverage: 30,
        commercialCompleteness: 20,
        leadTime: 10,
        price: 0,
      },
      updatedAt: DEMO_TIMESTAMP,
    });

    await ctx.db.insert('passportPreviews', {
      supplierId: atlasId,
      generatedFromProjectId: projectId,
      publicSlug: 'atlas-clay-studio-demo',
      status: 'preview',
      approvedFields: [],
      generatedAt: DEMO_TIMESTAMP,
    });

    const previouslyPublished = await ctx.db
      .query('demoBaselines')
      .withIndex('by_slug_and_status', (query) =>
        query.eq('slug', DEMO_BASELINE_SLUG).eq('status', 'published'),
      )
      .take(20);
    for (const baseline of previouslyPublished) {
      await ctx.db.patch(baseline._id, {status: 'retired'});
    }
    const baselineId = await ctx.db.insert('demoBaselines', {
      slug: DEMO_BASELINE_SLUG,
      version: DEMO_BASELINE_VERSION,
      baselineProjectId: projectId,
      capturedAt: DEMO_TIMESTAMP,
      sourceMode: 'fixture',
      captureLabel: 'Demonstration fixture — no provider calls were made.',
      status: 'published',
    });

    return {
      created: true,
      projectId,
      baselineId,
      supplierCount: supplierIds.size,
      sourceCount,
      claimCount,
    };
  },
});
