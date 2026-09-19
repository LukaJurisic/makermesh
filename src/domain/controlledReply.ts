import type {ControlledReply} from '../../convex/model/controlledReply';
import type {Maker} from './types';

export function controlledReplyMaker(reply: ControlledReply): Maker {
  return {
    id: 'atlas-controlled-reply',
    slug: 'atlas-clay-studio-controlled-demo',
    name: 'Atlas Clay Studio — Demo Supplier',
    location: 'Safi, Morocco',
    summary: 'Fictional supplier assertions received through the controlled AgentMail exchange.',
    languages: ['French', 'English'],
    visual: '/images/espresso-cup-study.webp',
    demoSupplier: true,
    fixture: false,
    capabilities: reply.evaluations
      .filter(
        (item) =>
          item.outcome === 'pass' &&
          ['custom_logo', 'production_style', 'preproduction_sample'].includes(item.requirementKey),
      )
      .map((item) => item.requirementLabel),
    evaluations: reply.evaluations.map((item) => ({
      ...item,
      hasActiveEvidence: Boolean(item.supportingExcerpt),
      displayValue: item.outcome === 'unknown' ? 'Unknown' : 'See original reply',
      reason: item.supportingExcerpt || 'No supported answer in the received reply.',
      ...(item.supportingExcerpt ? {evidenceId: `reply-${item.requirementKey}`} : {}),
    })),
    sources: reply.evaluations
      .filter((item) => Boolean(item.supportingExcerpt))
      .map((item) => ({
        id: `reply-${item.requirementKey}`,
        title: `${item.requirementLabel} — original reply`,
        url: '',
        domain: 'Project-owned demo inbox',
        excerpt: item.supportingExcerpt,
        observedAt: new Date(reply.receivedAt).toISOString(),
        sourceType: 'supplier_email' as const,
        evidenceState: 'supplier_claimed' as const,
        fixture: false,
      })),
    quote: reply.quote ?? undefined,
    openQuestionCount: reply.evaluations.filter((item) => item.outcome === 'unknown').length,
    latestActivity: 'Controlled reply extracted',
  };
}
