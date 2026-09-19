import {fireEvent, render, screen, within} from '@testing-library/react';
import {MemoryRouter} from 'react-router-dom';
import {describe, expect, it, vi} from 'vitest';
import type {ControlledReply} from '../../../convex/model/controlledReply';
import {DEFAULT_RANKING_WEIGHTS} from '@/domain/comparison';
import {ComparePage} from './ComparePage';

const state = vi.hoisted(() => ({reply: null as ControlledReply | null}));
vi.mock('@/app/useDemo', () => ({
  useDemo: () => ({
    weights: DEFAULT_RANKING_WEIGHTS,
    setWeights: vi.fn(),
    controlledReply: state.reply,
  }),
}));
vi.mock('@/app/useTrackProductEvent', () => ({useTrackProductEvent: vi.fn()}));

describe('captured reply comparison', () => {
  it('replaces fixture rankings when a published reply arrives and removes them when withdrawn', () => {
    state.reply = null;
    const {rerender} = render(
      <MemoryRouter>
        <ComparePage />
      </MemoryRouter>,
    );
    expect(screen.getByText(/No captured email result is published/)).toBeInTheDocument();
    expect(
      screen.queryByRole('region', {name: 'Captured controlled email result'}),
    ).not.toBeInTheDocument();
    state.reply = {
      sentAt: 1,
      receivedAt: 2,
      extractedAt: 3,
      originalText: 'Réponse fictive contrôlée.',
      quote: null,
      evaluations: [
        {
          requirementKey: 'moq_max',
          requirementLabel: 'Maximum MOQ',
          type: 'hard',
          weight: 0,
          outcome: 'unknown',
          supportingExcerpt: '',
        },
        {
          requirementKey: 'handmade',
          requirementLabel: 'Handmade',
          type: 'soft',
          weight: 20,
          outcome: 'unknown',
          supportingExcerpt: '',
        },
      ],
    };
    rerender(
      <MemoryRouter>
        <ComparePage />
      </MemoryRouter>,
    );
    fireEvent.click(screen.getByText('Original brief comparison'));
    const table = within(screen.getByRole('table'));
    expect(table.getByText('Atlas Clay Studio — Demo Supplier')).toBeInTheDocument();
    expect(screen.getAllByRole('row')).toHaveLength(2);
    expect(table.getByText('More evidence needed')).toBeInTheDocument();
    expect(screen.getByText('0/1 answerable')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', {name: 'Read supplier reply'}));
    expect(
      screen.getByRole('region', {name: 'Captured controlled email result'}),
    ).toBeInTheDocument();
    expect(
      screen.getAllByText('2 requirements still unknown', {exact: false}).length,
    ).toBeGreaterThan(0);
    state.reply = null;
    rerender(
      <MemoryRouter>
        <ComparePage />
      </MemoryRouter>,
    );
    expect(
      screen.queryByRole('region', {name: 'Captured controlled email result'}),
    ).not.toBeInTheDocument();
    expect(screen.getByText(/No captured email result is published/)).toBeInTheDocument();
  });
});
