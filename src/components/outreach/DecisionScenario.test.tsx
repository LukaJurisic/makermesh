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

    expect(screen.getByText('Fits your production window')).toBeInTheDocument();
    await user.click(screen.getByRole('button', {name: 'Try 30 days'}));

    expect(screen.getByText('Ask about a faster turnaround')).toBeInTheDocument();
    expect(screen.getByText('The quoted range runs past your 30-day limit.')).toBeInTheDocument();
    expect(screen.getByText(timingExcerpt, {exact: false})).toBeInTheDocument();
  });

  it('makes timing unknown when quantity changes, including after a 30-day change', async () => {
    const user = userEvent.setup();
    render(<DecisionScenario reply={makeReply()} onInspect={vi.fn()} />);

    const quantity = document.querySelector('#decision-quantity') as HTMLInputElement;
    fireEvent.change(quantity, {target: {value: '250'}});
    await user.click(screen.getByRole('button', {name: 'Try 30 days'}));

    expect(screen.getByText('Confirm the timing for this quantity')).toBeInTheDocument();
    expect(screen.getByText('A revised quote is needed.')).toBeInTheDocument();
    expect(screen.getByText(/requested quantity has changed/)).toBeInTheDocument();
    expect(
      screen.getByText(/production timing and price for 250 cups within 30 days/i),
    ).toBeInTheDocument();
  });

  it('tries 400 cups without changing the current production window', async () => {
    const user = userEvent.setup();
    render(<DecisionScenario reply={makeReply()} onInspect={vi.fn()} />);

    await user.click(screen.getByRole('button', {name: 'Try 30 days'}));
    await user.click(screen.getByRole('button', {name: 'Try 400 cups'}));

    expect(screen.getByLabelText('Maximum production days after sample approval')).toHaveValue(
      '30',
    );
    expect(screen.getByLabelText('Requested quantity')).toHaveValue('400');
    expect(screen.getByText('Confirm the timing for this quantity')).toBeInTheDocument();
  });

  it('suppresses the dependent result and download while input is invalid', async () => {
    const user = userEvent.setup();
    render(<DecisionScenario reply={makeReply()} onInspect={vi.fn()} />);

    await user.clear(screen.getByLabelText('Maximum production days after sample approval'));
    await user.type(screen.getByLabelText('Maximum production days after sample approval'), '366');

    expect(screen.getByText('Use a whole number from 1 to 365.')).toBeInTheDocument();
    expect(screen.queryByText('Decision consequence')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', {name: 'Save order notes'})).not.toBeInTheDocument();
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

    expect(screen.getByText('Fits your production window')).toBeInTheDocument();
    expect(screen.queryByText('Use a whole number from 1 to 100000.')).not.toBeInTheDocument();
  });

  it('restores both inputs and the original pass result', async () => {
    const user = userEvent.setup();
    render(<DecisionScenario reply={makeReply()} onInspect={vi.fn()} />);

    await user.click(screen.getByRole('button', {name: 'Try 30 days'}));
    const quantity = document.querySelector('#decision-quantity') as HTMLInputElement;
    fireEvent.change(quantity, {target: {value: '250'}});
    await user.click(screen.getByRole('button', {name: 'Reset to original brief'}));

    expect(document.querySelector('#decision-quantity')).toHaveValue('200');
    expect(screen.getByLabelText('Maximum production days after sample approval')).toHaveValue(
      '42',
    );
    expect(screen.getByText('Fits your production window')).toBeInTheDocument();
    expect(screen.queryByText('A revised quote is needed.')).not.toBeInTheDocument();
  });

  it('withdraws proof without retaining the old quote, draft, or export action', async () => {
    const onInspect = vi.fn();
    const {rerender} = render(<DecisionScenario reply={makeReply()} onInspect={onInspect} />);

    expect(screen.getByText('Questions for the workshop')).toBeInTheDocument();
    expect(screen.getByRole('button', {name: 'Save order notes'})).toBeInTheDocument();
    rerender(<DecisionScenario reply={null} onInspect={onInspect} />);

    expect(screen.getByText('Captured reply unavailable.')).toBeInTheDocument();
    expect(screen.queryByText('Questions for the workshop')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', {name: 'Save order notes'})).not.toBeInTheDocument();
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

    await user.click(screen.getByRole('button', {name: 'Read original reply'}));
    expect(onInspect).toHaveBeenCalledOnce();
  });

  it('shows the full decision brief when browser download creation fails', async () => {
    const user = userEvent.setup();
    vi.spyOn(URL, 'createObjectURL').mockImplementation(() => {
      throw new Error('download blocked');
    });
    render(<DecisionScenario reply={makeReply()} onInspect={vi.fn()} />);

    await user.click(screen.getByRole('button', {name: 'Save order notes'}));

    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('browser blocked'));
    const brief = screen.getByRole('textbox', {name: 'Order notes text'}) as HTMLTextAreaElement;
    expect(brief.value).toContain('# MakerMesh order notes');
    expect(brief.value).toContain(timingExcerpt);
    expect(brief.value).toContain('not a sent message');
  });
});
