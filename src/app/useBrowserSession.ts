import {useCallback, useState} from 'react';
import type {SessionId} from 'convex-helpers/server/sessions';

// Persist the unguessable capability in this browser profile, never in a URL.
// Existing tab sessions migrate on first load so open projects keep their owner.
export function useBrowserSession(key: string, initial: SessionId | undefined) {
  const [value, setValue] = useState<SessionId | undefined>(() => {
    try {
      const raw = localStorage.getItem(key) ?? sessionStorage.getItem(key);
      const parsed: unknown = raw
        ? /^[a-zA-Z0-9_-]{24,100}$/.test(raw)
          ? raw
          : JSON.parse(raw)
        : initial;
      const next =
        typeof parsed === 'string' && /^[a-zA-Z0-9_-]{24,100}$/.test(parsed)
          ? (parsed as SessionId)
          : initial;
      if (next) localStorage.setItem(key, JSON.stringify(next));
      return next;
    } catch {
      return initial;
    }
  });
  const update = useCallback(
    (next: SessionId | undefined) => {
      setValue(next);
      try {
        if (next) localStorage.setItem(key, JSON.stringify(next));
        else localStorage.removeItem(key);
      } catch {
        /* The current tab can still hold its capability in memory. */
      }
    },
    [key],
  );
  return [value, update] as const;
}
