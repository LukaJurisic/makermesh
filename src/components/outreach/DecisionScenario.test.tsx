import {cleanup, fireEvent, render, screen, waitFor} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import type {ControlledReply} from '../../../convex/model/controlledReply';
import {DecisionScenario} from './DecisionScenario';

const timingExcerpt = "La production prend 30 à 35 jours après validation de l'échantillon.";
const moqExcerpt = 'Notre MOQ est de 150 unités.';

function makeReply(overrides: Partial<ControlledReply> = {}): ControlledReply {
  return {
    sentAt: 1_000,
    receivedAt: 2_000,
    extractedAt: 3_000,
    originalText: `Réponse contrôlée. ${timingExcerpt} ${moqExcerpt}`,
    evaluations: [
      {
        requirementKey: 'production_time',
        requirementLabel: 'Production time',
        type: 'hard',
        weight: 1,
        outcome: 'pass',
        supportingExcerpt: timingExcerpt,
      },
      {
        requirementKey: 'moq_max',
        requirementLabel: 'Maximum MOQ',
        type: 'hard',
        weight: 1,
        outcome: 'pass',
        supportingExcerpt: moqExcerpt,
      },
    ],
    quote: {
      currency: 'MAD',
      unitPrice: 72,
      samplePrice: 650,
      moq: 150,
      productionMinDays: 30,
      productionMaxDays: 35,
      shippingIncluded: false,
      quoteBasis: 'EXW',
    },
    ...overrides,
  };
}

describe('DecisionScenario', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it('evaluates the 30-day shortcut against the captured reply', async () => {
    const user = userEvent.setup();
    render(<DecisionScenario reply={makeReply()} onInspect={vi.fn()} />);

    expect(screen.getByText('Timing meets this requirement')).toBeInTheDocument();
    await user.click(screen.getByRole('button', {name: 'Try a 30-day limit'}));

    expect(screen.getByText('Timing requirement not met')).toBeInTheDocument();
    expect(
      screen.getByText(
        'The quoted range extends beyond your 30-day limit and needs a revised supplier commitment.',
      ),
    ).toBeInTheDocument();
    expect(screen.getByText(timingExcerpt, {exact: false})).toBeInTheDocument();
  });

  it('makes timing unknown when quantity changes, including after a 30-day change', async () => {
    const user = userEvent.setup();
    render(<DecisionScenario reply={makeReply()} onInspect={vi.fn()} />);

    const quantity = document.querySelector('#decision-quantity') as HTMLInputElement;
    fireEvent.change(quantity, {target: {value: '250'}});
    await user.click(screen.getByRole('button', {name: 'Try a 30-day limit'}));

    expect(screen.getByText('Timing commitment is unknown')).toBeInTheDocument();
    expect(screen.getByText('A revised quote is needed.')).toBeInTheDocument();
    expect(screen.getByText(/requested quantity has changed/)).toBeInTheDocument();
    expect(
      screen.getByText(/production capacity, timing and price within 30 days.*250 cups/i),
    ).toBeInTheDocument();
  });

  it('suppresses the dependent result and download while input is invalid', async () => {
    const user = userEvent.setup();
    render(<DecisionScenario reply={makeReply()} onInspect={vi.fn()} />);

    await user.clear(screen.getByLabelText('Maximum production days after sample approval'));
    await user.type(screen.getByLabelText('Maximum production days after sample approval'), '366');

    expect(screen.getByText('Use a whole number from 1 to 365.')).toBeInTheDocument();
    expect(screen.queryByText('Decision consequence')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', {name: 'Download decision brief'})).not.toBeInTheDocument();
  });

  it('keeps the quantity input available while invalid and recovers when corrected', async () => {
    const user = userEvent.setup();
    render(<DecisionScenario reply={makeReply()} onInspect={vi.fn()} />);

    const quantity = document.querySelector('#decision-quantity') as HTMLInputElement;
    await user.clear(quantity);
    await user.type(quantity, '0');

    expect(screen.getByText('Use a whole number from 1 to 100000.')).toBeInTheDocument();
    expect(document.querySelector('#decision-quantity')).toBeInTheDocument();
    const recoveredQuantity = document.querySelector('#decision-quantity') as HTMLInputElement;
    await user.clear(recoveredQuantity);
    await user.type(recoveredQuantity, '200');

    expect(screen.getByText('Timing meets this requirement')).toBeInTheDocument();
    expect(screen.queryByText('Use a whole number from 1 to 100000.')).not.toBeInTheDocument();
  });

  it('restores both inputs and the original pass result', async () => {
    const user = userEvent.setup();
    render(<DecisionScenario reply={makeReply()} onInspect={vi.fn()} />);

    await user.click(screen.getByRole('button', {name: 'Try a 30-day limit'}));
    const quantity = document.querySelector('#decision-quantity') as HTMLInputElement;
    fireEvent.change(quantity, {target: {value: '250'}});
    await user.click(screen.getByRole('button', {name: 'Reset to original brief'}));

    expect(document.querySelector('#decision-quantity')).toHaveValue('200');
    expect(screen.getByLabelText('Maximum production days after sample approval')).toHaveValue(
      '42',
    );
    expect(screen.getByText('Timing meets this requirement')).toBeInTheDocument();
    expect(screen.queryByText('A revised quote is needed.')).not.toBeInTheDocument();
  });

  it('withdraws proof without retaining the old quote, draft, or export action', async () => {
    const onInspect = vi.fn();
    const {rerender} = render(<DecisionScenario reply={makeReply()} onInspect={onInspect} />);

    expect(screen.getByText('Confirm what remains unknown.')).toBeInTheDocument();
    expect(screen.getByRole('button', {name: 'Download decision brief'})).toBeInTheDocument();
    rerender(<DecisionScenario reply={null} onInspect={onInspect} />);

    expect(screen.getByText('Captured reply unavailable.')).toBeInTheDocument();
    expect(screen.queryByText('Confirm what remains unknown.')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', {name: 'Download decision brief'})).not.toBeInTheDocument();
    expect(screen.queryByText(timingExcerpt, {exact: false})).not.toBeInTheDocument();
  });

  it('shows a selectable fallback when clipboard access is denied and invokes inspect', async () => {
    const user = userEvent.setup();
    const onInspect = vi.fn();
    const writeText = vi.fn().mockRejectedValue(new Error('clipboard denied'));
    Object.defineProperty(navigator, 'clipboard', {configurable: true, value: {writeText}});
    render(<DecisionScenario reply={makeReply()} onInspect={onInspect} />);

    await user.click(screen.getByRole('button', {name: 'Copy questions'}));
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('browser blocked'));
    expect(writeText).toHaveBeenCalledOnce();

    await user.click(screen.getByRole('button', {name: 'Read full reply'}));
    expect(onInspect).toHaveBeenCalledOnce();
  });

  it('shows the full decision brief when browser download creation fails', async () => {
    const user = userEvent.setup();
    vi.spyOn(URL, 'createObjectURL').mockImplementation(() => {
      throw new Error('download blocked');
    });
    render(<DecisionScenario reply={makeReply()} onInspect={vi.fn()} />);

    await user.click(screen.getByRole('button', {name: 'Download decision brief'}));

    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('browser blocked'));
    const brief = screen.getByRole('textbox', {name: 'Decision brief text'}) as HTMLTextAreaElement;
    expect(brief.value).toContain('# MakerMesh sourcing decision brief');
    expect(brief.value).toContain(timingExcerpt);
    expect(brief.value).toContain('not a sent message');
  });
});
