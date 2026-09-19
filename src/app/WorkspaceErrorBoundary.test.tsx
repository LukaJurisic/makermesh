import {render, screen} from '@testing-library/react';
import {expect, it, vi} from 'vitest';
import {WorkspaceErrorBoundary} from './WorkspaceErrorBoundary';

it('replaces a failed evidence view with recovery without exposing the query error', () => {
  const log = vi.spyOn(console, 'error').mockImplementation(() => {});
  function FailedQuery(): never {
    throw new Error('Private provider diagnostic');
  }
  try {
    render(
      <WorkspaceErrorBoundary>
        <FailedQuery />
      </WorkspaceErrorBoundary>,
    );
    expect(screen.getByRole('alert')).toHaveTextContent('current evidence is unavailable');
    expect(screen.getByRole('button', {name: 'Reload workspace'})).toBeVisible();
    expect(screen.queryByText('Private provider diagnostic')).not.toBeInTheDocument();
  } finally {
    log.mockRestore();
  }
});
