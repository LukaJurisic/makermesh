import {useEffect, useRef} from 'react';
import type {ProductEventType} from './demoContextCore';
import {useDemo} from './useDemo';

export function useTrackProductEvent(eventType: ProductEventType) {
  const {backendReady, trackEvent} = useDemo();
  const tracked = useRef(false);

  useEffect(() => {
    if (!backendReady || tracked.current) return;
    tracked.current = true;
    void trackEvent(eventType);
  }, [backendReady, eventType, trackEvent]);
}
