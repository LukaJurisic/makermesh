import {AlertCircle, CheckCircle2, ChevronRight, LoaderCircle, Radio} from 'lucide-react';
import {useDemo} from '@/app/useDemo';

const providerTone = {
  Firecrawl: 'var(--terracotta)',
  OpenAI: 'var(--ink)',
  Convex: 'var(--teal)',
  AgentMail: 'var(--ochre)',
};

export function SystemPulse({collapsed = false}: {collapsed?: boolean}) {
  const {activity, baselineMode, captureProofEvents} = useDemo();
  if (collapsed) return null;
  return (
    <aside className="system-pulse" aria-label="System Pulse">
      <header className="border-b border-[var(--border)] px-5 py-[18px]">
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-[var(--ink)]">
            <Radio className="size-4 text-[var(--teal)]" /> System Pulse
          </h2>
          <span className="rounded-full bg-[var(--ochre-soft)] px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--warning)]">
            {baselineMode === 'captured_live' ? 'Live research proof' : 'Fixture replay'}
          </span>
        </div>
        <p className="mt-2 text-xs leading-5 text-[var(--muted)]">
          {baselineMode === 'captured_live'
            ? 'Controlled OpenAI and Firecrawl execution is captured below. The displayed market remains fictional fixture data.'
            : 'Provider-shaped events stored for the visual prototype. Nothing here is live yet.'}
        </p>
      </header>
      {baselineMode === 'captured_live' && (
        <section className="border-b border-[var(--border)] bg-[var(--teal-soft)]/35 px-5 py-4">
          <h3 className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--teal)]">
            Captured provider events
          </h3>
          <ol className="mt-3 space-y-3">
            {captureProofEvents.map((event) => (
              <li key={event.id} className="flex gap-3 text-xs">
                <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-[var(--teal)]" />
                <div>
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <strong className="text-[var(--ink)]">{event.provider}</strong>
                    <time className="tabular-nums text-[var(--muted)]">{event.occurredAt}</time>
                  </div>
                  <p className="mt-1 leading-5 text-[var(--ink-soft)]">{event.label}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>
      )}
      {baselineMode === 'captured_live' && (
        <p className="border-b border-[var(--border)] px-5 py-3 text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--muted)]">
          Fictional fixture market data
        </p>
      )}
      <ol className="divide-y divide-[var(--border)]">
        {activity.map((event) => (
          <li key={event.id} className="group px-5 py-4">
            <div className="flex items-start gap-3">
              <span
                className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-[var(--surface)]"
                style={{color: providerTone[event.provider]}}
              >
                {event.status === 'completed' && <CheckCircle2 className="size-4" />}
                {event.status === 'running' && <LoaderCircle className="size-4 animate-spin" />}
                {event.status === 'error' && <AlertCircle className="size-4" />}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-[var(--ink)]">{event.provider}</span>
                  <time className="text-[11px] tabular-nums text-[var(--muted)]">
                    {event.occurredAt}
                  </time>
                </div>
                <p className="mt-1 text-xs leading-5 text-[var(--ink-soft)]">{event.label}</p>
                {event.latency && (
                  <span className="mt-1.5 inline-block text-[10px] uppercase tracking-[0.08em] text-[var(--muted)]">
                    Safe latency {event.latency}
                  </span>
                )}
              </div>
              <ChevronRight className="mt-1 size-3.5 text-[var(--border-strong)] transition-colors group-hover:text-[var(--muted)]" />
            </div>
          </li>
        ))}
      </ol>
    </aside>
  );
}
