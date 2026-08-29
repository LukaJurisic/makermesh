// @vitest-environment edge-runtime

import {describe, expect, it} from 'vitest';
import {mergeProviderDeliveryStatus} from './outreachState';

describe('outreach delivery state', () => {
  it('never lets outbound delivery synchronization erase a reply', () => {
    expect(mergeProviderDeliveryStatus('replied', 'delivered')).toBe('replied');
    expect(mergeProviderDeliveryStatus('replied', 'sent')).toBe('replied');
  });

  it('keeps delivery progress monotonic', () => {
    expect(mergeProviderDeliveryStatus('delivered', 'sent')).toBe('delivered');
    expect(mergeProviderDeliveryStatus('sent', 'delivered')).toBe('delivered');
    expect(mergeProviderDeliveryStatus('delivered', 'bounced')).toBe('bounced');
  });
});
