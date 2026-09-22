import {describe, expect, it} from 'vitest';
import {escapeHtml, formatResearchNotes, type ResearchNotesData} from './researchBrief';

const data: ResearchNotesData = {
  brief: {
    product: 'Handmade cups',
    summary: 'Small batch cups',
    searchQuery: 'Morocco handmade cups',
    requirements: [
      {key: 'capacity', label: 'Capacity', kind: 'must', question: 'What capacity can you make?'},
      {key: 'finish', label: 'Finish', kind: 'prefer', question: 'Which finishes are available?'},
    ],
  },
  input: {
    request: 'We need cups for a cafe opening.',
    quantity: '200',
    destination: 'Toronto',
    budget: '40 MAD each',
    timing: 'By October',
  },
  results: [
    {
      url: 'https://example.com/maker?token=secret#private',
      title: 'Maker <One>',
      observedAt: Date.parse('2026-09-01T00:00:00Z'),
      makerName: null,
      kind: 'maker',
      facts: [{requirementKey: 'capacity', excerpt: 'Each cup is [hand thrown] and 250ml.'}],
      locationExcerpt: 'Based in Safi.',
    },
  ],
};

describe('formatResearchNotes', () => {
  it('keeps the approved fields, exact quotes, and open questions', () => {
    const notes = formatResearchNotes(data);
    expect(notes).toContain('Product: Handmade cups');
    expect(notes).toContain('Quantity: 200');
    expect(notes).toContain('“Each cup is \\[hand thrown\\] and 250ml\\.”');
    expect(notes).toContain('Which finishes are available?');
    expect(notes).toContain('https://example.com/maker');
    expect(notes).not.toContain('token=secret');
    expect(notes).not.toContain('searchQuery');
    expect(notes).not.toContain('evidence');
  });

  it('keeps every requirement as a confirmation question beside related public wording', () => {
    const notes = formatResearchNotes({
      ...data,
      brief: {
        ...data.brief,
        requirements: [
          ...data.brief.requirements,
          {
            key: 'order',
            label: 'Order size',
            kind: 'must',
            question: 'Can you make exactly 200 cups?',
          },
        ],
      },
      results: [
        {...data.results[0]!, facts: [{requirementKey: 'order', excerpt: 'We make many cups.'}]},
      ],
    });
    expect(notes).toContain('Essential · Order size: Can you make exactly 200 cups?');
  });

  it('does not echo unsafe source URLs', () => {
    const notes = formatResearchNotes({
      ...data,
      results: [{...data.results[0]!, url: 'http://user:pass@internal.invalid/page?token=secret'}],
    });
    expect(notes).toContain('[source unavailable]');
    expect(notes).not.toContain('internal.invalid');
  });

  it('is truthful for zero results and invalid dates', () => {
    const notes = formatResearchNotes({...data, results: []});
    expect(notes).toContain('No usable public source pages were returned.');
    expect(notes).toContain('What capacity can you make?');
    expect(notes).not.toContain('Maker <One>');
    expect(
      formatResearchNotes({...data, results: [{...data.results[0]!, observedAt: NaN}]}),
    ).toContain('Date not available');
  });

  it('escapes HTML source text', () => {
    expect(escapeHtml('<script>alert("x")</script>')).toBe(
      '&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt;',
    );
  });
});
