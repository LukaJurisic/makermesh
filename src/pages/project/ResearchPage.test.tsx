import {render, screen} from '@testing-library/react';
import {MemoryRouter} from 'react-router-dom';
import {beforeEach, describe, expect, it, vi} from 'vitest';
import {ResearchPage} from './ResearchPage';

const {demoState} = vi.hoisted(() => ({
  demoState: {
    backendReady: true,
    briefApproved: true,
    researchStarted: false,
    startResearch: vi.fn(async () => undefined),
    trackEvent: vi.fn(async () => undefined),
    baselineMode: 'captured_live',
    metrics: {sources: 1, makers: 1, claims: 1, questions: 2, replies: 0},
    research: {
      theme: 'Convex-backed research theme',
      brief: {
        productName: 'Convex-backed cups',
      },
      requirements: [],
      makers: [
        {
          slug: 'convex-backed-maker',
          name: 'Convex-backed Maker',
          location: 'Safi, Morocco',
          summary: 'A sanitized public research record.',
          languages: ['French'],
          visual: '/images/maker-hands-hero.webp',
          demoSupplier: true,
          stage: 'discovered',
          openQuestionCount: 2,
          publicSourceCount: 1,
          publicClaimCount: 1,
        },
      ],
      sources: [
        {
          id: 'source-01',
          makerSlug: 'convex-backed-maker',
          maker: 'Convex-backed Maker',
          title: 'Convex-backed source',
          url: 'https://demo.makermesh.invalid/convex-source',
          domain: 'demo.makermesh.invalid',
          excerpt: 'A sanitized source excerpt.',
          observedAt: '2026-08-29T14:34:19.000Z',
          sourceType: 'demo_fixture',
          evidenceState: 'public_source',
          fixture: true,
        },
      ],
      claims: [],
    },
  },
}));

vi.mock('@/app/useDemo', () => ({useDemo: () => demoState}));

describe('ResearchPage', () => {
  beforeEach(() => {
    demoState.briefApproved = true;
  });

  it('renders the Convex session research payload instead of bundled fixture records', () => {
    render(
      <MemoryRouter>
        <ResearchPage />
      </MemoryRouter>,
    );

    expect(screen.getByText('Convex-backed research theme')).toBeInTheDocument();
    expect(screen.getByText('Convex-backed source')).toBeInTheDocument();
    expect(screen.getByText('Convex-backed Maker')).toBeInTheDocument();
    expect(screen.getByRole('button', {name: /replay example research/i})).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('Ready to replay');
    expect(screen.getByRole('progressbar', {name: 'Research replay progress'})).toHaveAttribute(
      'aria-valuenow',
      '18',
    );
    expect(screen.queryByText('Atlas Clay Studio')).not.toBeInTheDocument();
  });

  it('keeps replay locked until the brief is approved', () => {
    demoState.briefApproved = false;
    render(
      <MemoryRouter>
        <ResearchPage />
      </MemoryRouter>,
    );

    expect(screen.getByRole('button', {name: /approve brief first/i})).toBeDisabled();
  });
});
