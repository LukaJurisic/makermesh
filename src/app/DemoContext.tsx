import {useSessionId, useSessionMutation, useSessionQuery} from 'convex-helpers/react/sessions';
import {useQuery} from 'convex/react';
import {type PropsWithChildren, useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {api} from '../../convex/_generated/api';
import {DEFAULT_RANKING_WEIGHTS} from '@/domain/comparison';
import type {ActivityEvent, ProjectStage, RankingWeights} from '@/domain/types';
import {demoActivity, demoMetrics, demoResearch} from '@/data/demo';
import {DemoContext, type DemoContextValue} from './demoContextCore';

const providerNames = {
  convex: 'Convex',
  openai: 'OpenAI',
  firecrawl: 'Firecrawl',
  agentmail: 'AgentMail',
} as const;

function formatEventTime(timestamp: number) {
  return new Intl.DateTimeFormat('en-CA', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).format(new Date(timestamp));
}

type LocalDemoState = {
  briefApproved: boolean;
  researchStarted: boolean;
  outreachApproved: boolean;
  replyApplied: boolean;
  currentStage: ProjectStage;
  replayStep: number;
  weights: RankingWeights;
};

const initialState: LocalDemoState = {
  briefApproved: false,
  researchStarted: false,
  outreachApproved: false,
  replyApplied: false,
  currentStage: 'brief' as const,
  replayStep: 0,
  weights: DEFAULT_RANKING_WEIGHTS,
};

function commandId(prefix: string) {
  return `${prefix}-${crypto.randomUUID()}`;
}

export function DemoProvider({children}: PropsWithChildren) {
  const [sessionId] = useSessionId();
  const [backendError, setBackendError] = useState<string | null>(null);
  const [fallbackMode, setFallbackMode] = useState(false);
  const [fallbackState, setFallbackState] = useState<LocalDemoState>(initialState);
  const creatingSession = useRef(false);

  const session = useSessionQuery(api.demo.getSession, {});
  const controlledReply = useQuery(api.controlledReply.getPublished, {});
  const createSession = useSessionMutation(api.demo.createSession);
  const approveBriefMutation = useSessionMutation(api.demo.approveBrief);
  const startResearchMutation = useSessionMutation(api.demo.startResearchReplay);
  const approveOutreachMutation = useSessionMutation(api.demo.approveFixtureOutreach);
  const applyReplyMutation = useSessionMutation(api.demo.applyFixtureReply);
  const setStageMutation = useSessionMutation(api.demo.setStage);
  const setWeightsMutation = useSessionMutation(api.demo.setPreferenceWeights);
  const resetMutation = useSessionMutation(api.demo.resetOwnDemo);
  const trackEventMutation = useSessionMutation(api.demo.trackProductEvent);

  useEffect(() => {
    if (!sessionId || session !== null || fallbackMode || creatingSession.current) return;
    creatingSession.current = true;
    void createSession()
      .then(() => {
        setFallbackMode(false);
        setBackendError(null);
      })
      .catch(() => {
        setFallbackMode(true);
        setBackendError(null);
      })
      .finally(() => {
        creatingSession.current = false;
      });
  }, [createSession, fallbackMode, session, sessionId]);

  const execute = useCallback(async (operation: () => Promise<unknown>) => {
    try {
      await operation();
      setBackendError(null);
    } catch (error) {
      setBackendError(error instanceof Error ? error.message : 'The demo command failed.');
    }
  }, []);

  const state = session?.state ?? (fallbackMode ? fallbackState : initialState);
  const metrics = useMemo(
    () =>
      session
        ? {
            sources: session.metrics.sourcesAnalyzed,
            makers: session.metrics.makersDiscovered,
            claims: session.metrics.claimsExtracted,
            questions: session.metrics.openQuestions,
            replies: session.metrics.repliesReceived,
          }
        : demoMetrics,
    [session],
  );
  const activity: ActivityEvent[] = useMemo(
    () =>
      session
        ? session.activity.map((event) => ({
            id: event.id,
            provider: providerNames[event.provider],
            label: event.label,
            status:
              event.status === 'failed'
                ? 'error'
                : event.status === 'queued' || event.status === 'cancelled'
                  ? 'waiting'
                  : event.status,
            occurredAt: formatEventTime(event.occurredAt),
            ...(event.latencyMs !== undefined ? {latency: `${event.latencyMs}ms`} : {}),
            fixture: event.fixture,
          }))
        : demoActivity,
    [session],
  );
  const captureProofEvents = useMemo(
    () =>
      session?.baseline.captureEvents.map((event, index) => ({
        id: `capture-proof-${index + 1}`,
        provider: providerNames[event.provider],
        operation: event.operation,
        label: event.label,
        occurredAt: formatEventTime(event.occurredAt),
        ...('resultCount' in event ? {resultCount: event.resultCount} : {}),
      })) ?? [],
    [session],
  );
  const research = useMemo(() => {
    if (!session) return demoResearch;
    const makerNames = new Map(session.research.makers.map((maker) => [maker.slug, maker.name]));
    return {
      ...session.research,
      requirements: session.research.requirements.map((requirement) => ({
        ...requirement,
        ...(requirement.unit === null ? {unit: undefined} : {unit: requirement.unit}),
      })),
      sources: session.research.sources.map((source) => ({
        id: source.sourceKey,
        makerSlug: source.makerSlug,
        maker: makerNames.get(source.makerSlug) ?? 'Maker record',
        title: source.title,
        url: source.url,
        domain: source.domain,
        excerpt: source.excerpt,
        excerptTruncated: source.excerptTruncated,
        observedAt: source.observedAt,
        sourceType: source.sourceType,
        evidenceState:
          source.sourceType === 'supplier_email'
            ? ('supplier_claimed' as const)
            : ('public_source' as const),
        fixture: source.fixture,
        state: source.state,
        truncated: source.truncated,
      })),
    };
  }, [session]);

  const value = useMemo<DemoContextValue>(
    () => ({
      controlledReply,
      briefApproved: state.briefApproved,
      researchStarted: state.researchStarted,
      outreachApproved: state.outreachApproved,
      replyApplied: state.replyApplied,
      stage: state.currentStage,
      replayStep: state.replayStep,
      weights: state.weights,
      metrics,
      activity,
      captureProofEvents,
      research,
      baselineMode: session?.baseline.sourceMode ?? (fallbackMode ? 'fallback' : 'fixture'),
      baselineLabel: controlledReply
        ? 'Research market and headline metrics are fictional fixtures. The separately labelled Atlas reply, quote, and comparison come from the captured project-owned email exchange; the supplier is fictional.'
        : (session?.baseline.captureLabel ??
          (fallbackMode
            ? 'Captured fixture fallback — local visitor state; no provider calls.'
            : 'Connecting to the Convex demo baseline…')),
      backendReady: Boolean(session) || fallbackMode,
      backendError,
      approveBrief: async () => {
        if (fallbackMode) {
          setFallbackState((current) => ({
            ...current,
            briefApproved: true,
            currentStage: 'research',
            replayStep: Math.max(current.replayStep, 1),
          }));
          return;
        }
        await execute(() => approveBriefMutation({commandId: commandId('approve-brief')}));
      },
      startResearch: async () => {
        if (fallbackMode) {
          setFallbackState((current) => ({
            ...current,
            researchStarted: true,
            replayStep: Math.max(current.replayStep, 2),
          }));
          return;
        }
        await execute(() => startResearchMutation({commandId: commandId('start-research')}));
      },
      approveOutreach: async () => {
        if (fallbackMode) {
          setFallbackState((current) => ({
            ...current,
            outreachApproved: true,
            replayStep: Math.max(current.replayStep, 3),
          }));
          return;
        }
        await execute(() => approveOutreachMutation({commandId: commandId('approve-outreach')}));
      },
      applyReply: async () => {
        if (fallbackMode) {
          setFallbackState((current) => ({
            ...current,
            replyApplied: true,
            currentStage: 'compare',
            replayStep: Math.max(current.replayStep, 4),
          }));
          return;
        }
        await execute(() => applyReplyMutation({commandId: commandId('apply-reply')}));
      },
      setStage: async (stage) => {
        if (fallbackMode) {
          setFallbackState((current) => ({...current, currentStage: stage}));
          return;
        }
        await execute(() => setStageMutation({stage, commandId: commandId('set-stage')}));
      },
      setWeights: async (weights) => {
        if (fallbackMode) {
          setFallbackState((current) => ({...current, weights}));
          return;
        }
        await execute(() => setWeightsMutation({weights, commandId: commandId('set-weights')}));
      },
      resetDemo: async () => {
        if (fallbackMode) {
          setFallbackState(initialState);
          return;
        }
        await execute(() => resetMutation({commandId: commandId('reset-demo')}));
      },
      trackEvent: async (eventType) => {
        if (fallbackMode) return;
        await execute(() => trackEventMutation({eventType}));
      },
    }),
    [
      applyReplyMutation,
      approveBriefMutation,
      approveOutreachMutation,
      activity,
      backendError,
      captureProofEvents,
      execute,
      controlledReply,
      fallbackMode,
      metrics,
      research,
      resetMutation,
      session,
      setStageMutation,
      setWeightsMutation,
      startResearchMutation,
      state,
      trackEventMutation,
    ],
  );

  return <DemoContext.Provider value={value}>{children}</DemoContext.Provider>;
}
