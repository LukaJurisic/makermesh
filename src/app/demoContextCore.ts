import {createContext} from 'react';
import type {ActivityEvent, ProjectStage, RankingWeights} from '@/domain/types';
import type {demoMetrics} from '@/data/demo';

export interface DemoContextValue {
  briefApproved: boolean;
  researchStarted: boolean;
  outreachApproved: boolean;
  replyApplied: boolean;
  stage: ProjectStage;
  replayStep: number;
  weights: RankingWeights;
  metrics: typeof demoMetrics;
  activity: ActivityEvent[];
  baselineLabel: string;
  backendReady: boolean;
  backendError: string | null;
  approveBrief: () => Promise<void>;
  startResearch: () => Promise<void>;
  approveOutreach: () => Promise<void>;
  applyReply: () => Promise<void>;
  setStage: (stage: ProjectStage) => Promise<void>;
  setWeights: (weights: RankingWeights) => Promise<void>;
  resetDemo: () => Promise<void>;
  trackEvent: (eventType: ProductEventType) => Promise<void>;
}

export type ProductEventType =
  | 'landing_viewed'
  | 'demo_opened'
  | 'brief_approved'
  | 'research_started'
  | 'supplier_inspected'
  | 'evidence_opened'
  | 'outreach_reviewed'
  | 'comparison_viewed'
  | 'passport_shared';

export const DemoContext = createContext<DemoContextValue | null>(null);
