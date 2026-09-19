import {renderHook} from '@testing-library/react';
import {beforeEach, describe, expect, it} from 'vitest';
import type {SessionId} from 'convex-helpers/server/sessions';
import {useBrowserSession} from './useBrowserSession';
beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
});
describe('private browser capability', () => {
  it('migrates a legacy tab token and reuses it on the next browser load', () => {
    const old = 'legacy-private-session-000001' as SessionId;
    sessionStorage.setItem('session', old);
    const first = renderHook(() =>
      useBrowserSession('session', 'fresh-private-session-000001' as SessionId),
    );
    expect(first.result.current[0]).toBe(old);
    first.unmount();
    sessionStorage.clear();
    const next = renderHook(() =>
      useBrowserSession('session', 'another-private-session-00001' as SessionId),
    );
    expect(next.result.current[0]).toBe(old);
  });
  it('does not adopt malformed stored capabilities', () => {
    localStorage.setItem('session', JSON.stringify('short'));
    const initial = 'fresh-private-session-000001' as SessionId;
    const hook = renderHook(() => useBrowserSession('session', initial));
    expect(hook.result.current[0]).toBe(initial);
  });
});
