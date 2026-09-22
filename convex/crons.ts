import {cronJobs} from 'convex/server';
import {internal} from './_generated/api';

const crons = cronJobs();
crons.interval(
  'expire private buyer research',
  {hours: 1},
  internal.buyerResearchStore.cleanupExpired,
  {},
);

crons.interval(
  'remove expired privacy-conscious product events',
  {hours: 24},
  internal.analytics.cleanupExpiredProductEvents,
  {},
);

crons.interval(
  'delete forwarded quotes after 48 hours',
  {hours: 1},
  internal.quoteInbox.cleanupExpired,
  {},
);

export default crons;
