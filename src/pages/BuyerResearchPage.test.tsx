import {render, screen, waitFor} from '@testing-library/react';
import {MemoryRouter, Route, Routes} from 'react-router-dom';
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import {BuyerResearchPage} from './BuyerResearchPage';

const request = {
  status: 'complete' as const,
  briefHash: 'brief-hash',
  sourceCount: 1,
  input: {
    request: 'We need 200 handmade cups for a cafe.',
    quantity: '200',
    destination: 'Toronto',
    budget: '40 MAD each',
    timing: 'By October',
  },
  brief: {
    product: 'Handmade cups',
    summary: 'Small batch cups',
    searchQuery: 'Morocco handmade cups',
    requirements: [
      {
        key: 'capacity',
        label: 'Capacity',
        kind: 'must' as const,
        question: 'What capacity can you make?',
      },
    ],
  },
  results: [],
};

vi.mock('convex-helpers/react/sessions', () => ({
  useSessionQuery: () => request,
  useSessionMutation: () => vi.fn(),
}));
vi.mock('../../convex/_generated/api', () => ({api: {buyerResearch: {get: {}, approve: {}}}}));

describe('BuyerResearchPage notes download', () => {
  beforeEach(() => {
    vi.spyOn(URL, 'createObjectURL').mockImplementation(() => {
      throw new Error('blocked');
    });
  });
  afterEach(() => vi.restoreAllMocks());

  it('shows selectable full notes when the browser blocks the download', async () => {
    render(
      <MemoryRouter initialEntries={['/research/abc12345678901234567']}>
        <Routes>
          <Route path="/research/:requestId" element={<BuyerResearchPage />} />
        </Routes>
      </MemoryRouter>,
    );
    screen.getByRole('button', {name: 'Save research notes'}).click();
    await waitFor(() =>
      expect(
        (screen.getByRole('textbox', {name: 'Research notes'}) as HTMLTextAreaElement).value,
      ).toContain('No usable public source pages were returned.'),
    );
  });
});
