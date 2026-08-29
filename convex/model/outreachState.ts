import type {Doc} from '../_generated/dataModel';

type OutreachStatus = Doc<'outreachDrafts'>['status'];

const deliveryRank: Partial<Record<OutreachStatus, number>> = {
  draft: 0,
  approved: 0,
  queued: 1,
  sent: 2,
  delivered: 3,
  replied: 4,
};

export function mergeProviderDeliveryStatus(
  current: OutreachStatus,
  providerStatus: OutreachStatus,
): OutreachStatus {
  if (current === 'replied') return current;
  if (['bounced', 'failed', 'cancelled'].includes(current)) return current;
  const currentRank = deliveryRank[current] ?? 0;
  const nextRank = deliveryRank[providerStatus];
  if (nextRank !== undefined && nextRank < currentRank) return current;
  return providerStatus;
}
