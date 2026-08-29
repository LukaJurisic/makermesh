import {defineApp} from 'convex/server';
import {v} from 'convex/values';
import rateLimiter from '@convex-dev/rate-limiter/convex.config';
import workflow from '@convex-dev/workflow/convex.config';
import firecrawl from '@firecrawl/firecrawl-convex/convex.config';
import agentmail from '@agentmail/convex/convex.config';
import staticHosting from '@convex-dev/static-hosting/convex.config';

const app = defineApp({
  env: {
    OPERATOR_ACCESS_HASH: v.optional(v.string()),
    OPENAI_API_KEY: v.optional(v.string()),
    OPENAI_MODEL_BRIEF: v.optional(v.string()),
    OPENAI_MODEL_EXTRACTION: v.optional(v.string()),
    FIRECRAWL_API_KEY: v.string(),
    FIRECRAWL_API_URL: v.optional(v.string()),
    FIRECRAWL_WEBHOOK_SECRET: v.optional(v.string()),
    AGENTMAIL_API_KEY: v.optional(v.string()),
    AGENTMAIL_INBOX_ID: v.optional(v.string()),
    AGENTMAIL_WEBHOOK_SECRET: v.optional(v.string()),
    AGENTMAIL_BASE_URL: v.optional(v.string()),
    CONTROLLED_OUTREACH_ALLOWLIST_HASHES: v.optional(v.string()),
    CONTROLLED_REPLY_ALIAS_ALLOWLIST_HASHES: v.optional(v.string()),
    DEMO_MODE: v.optional(v.string()),
    ALLOW_REAL_OUTREACH: v.optional(v.string()),
    PUBLIC_LIVE_RESEARCH: v.optional(v.string()),
    PUBLIC_LIVE_BRIEF_COMPILATION: v.optional(v.string()),
  },
});

app.use(rateLimiter);
app.use(workflow);
app.use(firecrawl, {
  httpPrefix: '/firecrawl/',
  env: {
    FIRECRAWL_API_KEY: app.env.FIRECRAWL_API_KEY,
    FIRECRAWL_API_URL: app.env.FIRECRAWL_API_URL,
    FIRECRAWL_WEBHOOK_SECRET: app.env.FIRECRAWL_WEBHOOK_SECRET,
  },
});
app.use(agentmail);
app.use(staticHosting);

export default app;
