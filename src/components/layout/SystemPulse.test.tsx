import {render, screen} from '@testing-library/react';
import {describe, expect, it, vi} from 'vitest';
import {SystemPulse} from './SystemPulse';

vi.mock('@/app/useDemo', () => ({
  useDemo: () => ({
    baselineMode: 'captured_live',
    captureProofEvents: [
      {
        id: 'capture-openai',
        provider: 'OpenAI',
        operation: 'compile_brief',
        label: 'OpenAI structured the controlled sourcing brief',
        occurredAt: '10:34:10',
      },
      {
        id: 'capture-firecrawl',
        provider: 'Firecrawl',
        operation: 'search_and_durable_crawl',
        label: 'Firecrawl completed a durable crawl with 5 pages stored',
        occurredAt: '10:34:20',
        resultCount: 5,
      },
    ],
    activity: [
      {
        id: 'fixture-agentmail',
        provider: 'AgentMail',
        label: 'Controlled fixture RFQ marked delivered',
        status: 'completed',
        occurredAt: '10:35:02',
        fixture: true,
      },
    ],
  }),
}));

describe('SystemPulse', () => {
  it('separates captured live research proof from fictional fixture activity', () => {
    render(<SystemPulse />);

    expect(screen.getByText('Live research proof')).toBeInTheDocument();
    expect(screen.getByText('OpenAI structured the controlled sourcing brief')).toBeInTheDocument();
    expect(
      screen.getByText('Firecrawl completed a durable crawl with 5 pages stored'),
    ).toBeInTheDocument();
    expect(screen.getByText('Fictional fixture market data')).toBeInTheDocument();
    expect(screen.getByText('Controlled fixture RFQ marked delivered')).toBeInTheDocument();
    expect(screen.queryByText(/Nothing here is live yet/)).not.toBeInTheDocument();
  });
});
