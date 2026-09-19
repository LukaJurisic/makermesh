import {Component, type PropsWithChildren} from 'react';

export class WorkspaceErrorBoundary extends Component<PropsWithChildren, {failed: boolean}> {
  state = {failed: false};

  static getDerivedStateFromError() {
    return {failed: true};
  }

  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <main className="mx-auto max-w-xl px-6 py-20" role="alert">
        <h1 className="font-serif text-4xl">We couldn’t load this workspace.</h1>
        <p className="my-6 leading-7">
          The current evidence is unavailable. Reload to try again; local what-if changes will
          reset.
        </p>
        <button
          className="min-h-11 rounded border border-[var(--border-strong)] px-5 py-3"
          onClick={() => window.location.reload()}
        >
          Reload workspace
        </button>
      </main>
    );
  }
}
