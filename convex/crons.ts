import {cronJobs} from 'convex/server';
import {internal} from './_generated/api';

const crons = cronJobs();

crons.interval(
  'remove expired privacy-conscious product events',
  {hours: 24},
  internal.analytics.cleanupExpiredProductEvents,
  {},
);

export default crons;
