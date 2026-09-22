import type {ResearchBrief, ResearchInput, ResearchSource} from '../../convex/model/buyerResearch';

export type ResearchNotesData = {
  brief: ResearchBrief;
  input: ResearchInput;
  results: ResearchSource[];
};

const REDACTED = '[removed]';

/** Keep downloaded notes readable while making source text safe for Markdown and HTML contexts. */
export function escapeMarkdown(value: string): string {
  return redactPrivateText(value)
    .replace(/\\/g, '\\\\')
    .replace(/[`*_{}[\]()#+\-.!|<>]/g, '\\$&')
    .replace(/\r?\n/g, ' ')
    .trim();
}

export function escapeHtml(value: string): string {
  return redactPrivateText(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/\r?\n/g, ' ')
    .trim();
}

function redactPrivateText(value: string): string {
  return value
    .replace(/[\w.+-]+@[\w.-]+\.[a-z]{2,}/gi, REDACTED)
    .replace(/(?:\+?\d[\s().-]*){9,}/g, REDACTED)
    .replace(/\b(?:bearer|token|secret|password|api[-_ ]?key|cookie)\s*[:=]\s*[^\s,;]+/gi, REDACTED)
    .replace(
      /https?:\/\/[^\s)]+[?&](?:token|key|secret|password|sig|signature)=[^\s&#)]+/gi,
      REDACTED,
    );
}

function cleanLabel(value: string): string {
  return escapeMarkdown(value || 'Not specified');
}

function cleanUrl(value: string): string {
  try {
    const url = new URL(value);
    if (url.protocol !== 'https:' || !url.hostname.includes('.') || url.username || url.password)
      return '[source unavailable]';
    url.username = '';
    url.password = '';
    url.search = '';
    url.hash = '';
    // Query strings and fragments are removed before the URL is placed in a plain Markdown line.
    return redactPrivateText(url.href);
  } catch {
    return escapeMarkdown(value);
  }
}

function observedDate(value: number): string {
  const date = new Date(value);
  return Number.isNaN(date.valueOf())
    ? 'Date not available'
    : new Intl.DateTimeFormat('en-CA', {dateStyle: 'medium'}).format(date);
}

export function formatResearchNotes({brief, input, results}: ResearchNotesData): string {
  const questions = [...brief.requirements]
    .sort((a, b) => Number(a.kind !== 'must') - Number(b.kind !== 'must'))
    .map(
      (requirement) =>
        `${requirement.kind === 'must' ? 'Essential' : 'Preference'} · ${requirement.label}: ${requirement.question}`,
    );
  const lines = [
    '# MakerMesh research notes',
    '',
    '## Your request',
    `- Product: ${cleanLabel(brief.product)}`,
    `- Summary: ${cleanLabel(brief.summary)}`,
    `- Search scope: ${cleanLabel(brief.searchQuery)}`,
    `- Request: ${cleanLabel(input.request)}`,
    `- Quantity: ${cleanLabel(input.quantity)}`,
    `- Destination: ${cleanLabel(input.destination)}`,
    `- Budget: ${cleanLabel(input.budget)}`,
    `- Timing: ${cleanLabel(input.timing)}`,
    '',
    '## What we found',
    `- ${results.length ? `${results.length} public source${results.length === 1 ? '' : 's'} returned.` : 'No usable public source pages were returned.'}`,
  ];

  for (const source of results) {
    lines.push('', `### ${cleanLabel(source.makerName || source.title || 'Public source')}`);
    lines.push(`- Source: ${cleanUrl(source.url)}`);
    lines.push(`- Page title: ${cleanLabel(source.title)}`);
    lines.push(`- Date seen: ${observedDate(source.observedAt)}`);
    if (source.locationExcerpt) {
      lines.push(`- Public location statement: “${escapeMarkdown(source.locationExcerpt)}”`);
    }
    for (const fact of source.facts) {
      const requirement = brief.requirements.find((item) => item.key === fact.requirementKey);
      lines.push(
        `- ${cleanLabel(requirement?.label || 'Request topic')}: “${escapeMarkdown(fact.excerpt)}”`,
      );
    }
    if (!source.locationExcerpt && !source.facts.length) {
      lines.push('- No request-specific statement was found on this page.');
    }
  }

  lines.push('', '## What to ask');
  if (questions.length) {
    questions.forEach((question, index) => lines.push(`${index + 1}. ${escapeMarkdown(question)}`));
  } else {
    lines.push('1. Confirm the exact requirements directly with each maker.');
  }
  lines.push(
    '',
    'These are statements from public pages. Confirm the details with each workshop before ordering.',
    'This page is available for 48 hours. Downloaded notes stay with you.',
  );
  return lines.join('\n');
}
