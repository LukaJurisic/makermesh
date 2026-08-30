import {render, screen, waitFor} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {useRef, useState} from 'react';
import {describe, expect, it, vi} from 'vitest';
import type {SourceEvidence} from '@/domain/types';
import {EvidenceDialog} from './EvidenceDialog';

vi.mock('@/app/useDemo', () => ({
  useDemo: () => ({trackEvent: vi.fn(async () => undefined)}),
}));

const source: SourceEvidence = {
  id: 'source-focus-test',
  title: 'Focus test evidence',
  url: 'https://demo.makermesh.invalid/focus-test',
  domain: 'demo.makermesh.invalid',
  excerpt: 'Exact fictional evidence excerpt.',
  observedAt: '2026-08-29T14:34:19.000Z',
  sourceType: 'demo_fixture',
  evidenceState: 'public_source',
  fixture: true,
};

function Harness() {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  return (
    <>
      <button ref={triggerRef} type="button" onClick={() => setOpen(true)}>
        View evidence
      </button>
      <EvidenceDialog
        open={open}
        onOpenChange={setOpen}
        returnFocusRef={triggerRef}
        source={source}
      />
    </>
  );
}

describe('EvidenceDialog', () => {
  it('returns keyboard focus to the evidence control that opened it', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    const trigger = screen.getByRole('button', {name: 'View evidence'});
    await user.click(trigger);
    expect(screen.getByRole('button', {name: 'Close evidence'})).toHaveFocus();

    await user.keyboard('{Escape}');
    await waitFor(() => expect(trigger).toHaveFocus());
  });
});
