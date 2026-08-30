import {
  BookOpen,
  CheckCircle2,
  FileText,
  Mail,
  Menu,
  MoreHorizontal,
  PanelRightClose,
  PanelRightOpen,
  Presentation,
  RotateCcw,
  Scale,
  Search,
  Share2,
  Users,
} from 'lucide-react';
import {useMemo, useState} from 'react';
import {Link, NavLink, Outlet, useLocation, useNavigate, useSearchParams} from 'react-router-dom';
import {Brand} from '@/components/brand/Logo';
import {Button} from '@/components/ui/Button';
import {CapturedResearchBadge, FixtureBadge} from '@/components/ui/StatusBadge';
import type {ProjectStage} from '@/domain/types';
import {useDemo} from '@/app/useDemo';
import {cn} from '@/lib/cn';
import {SystemPulse} from './SystemPulse';
import {useTrackProductEvent} from '@/app/useTrackProductEvent';

const stages: Array<{id: ProjectStage; label: string; icon: typeof FileText}> = [
  {id: 'brief', label: 'Brief', icon: FileText},
  {id: 'research', label: 'Research', icon: Search},
  {id: 'makers', label: 'Makers', icon: Users},
  {id: 'outreach', label: 'Outreach', icon: Mail},
  {id: 'compare', label: 'Compare', icon: Scale},
  {id: 'passport', label: 'Passport', icon: BookOpen},
];

export function AppShell() {
  useTrackProductEvent('demo_opened');
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [pulseOpen, setPulseOpen] = useState(true);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const {
    backendError,
    backendReady,
    baselineLabel,
    baselineMode,
    briefApproved,
    metrics,
    resetDemo,
    researchStarted,
    setStage,
  } = useDemo();
  const metricItems = [
    ['Sources analyzed', metrics.sources],
    ['Makers discovered', metrics.makers],
    ['Claims extracted', metrics.claims],
    ['Open questions', metrics.questions],
    ['Replies received', metrics.replies],
  ] as const;
  const presentation = searchParams.get('present') === '1';
  const activeStage = useMemo(
    () => stages.find((item) => location.pathname.endsWith(`/${item.id}`))?.id ?? 'brief',
    [location.pathname],
  );

  const stageHref = (stage: ProjectStage) =>
    `/projects/harbour-coffee-lab/${stage}${presentation ? '?present=1' : ''}`;

  const togglePresentation = () => {
    const next = new URLSearchParams(searchParams);
    if (presentation) next.delete('present');
    else next.set('present', '1');
    setSearchParams(next);
  };

  const share = async () => {
    await navigator.clipboard?.writeText(window.location.href);
  };

  return (
    <div
      className={cn(
        'app-frame',
        presentation && 'presentation-mode',
        activeStage === 'passport' && 'passport-active',
      )}
    >
      {!presentation && (
        <aside className={cn('app-rail', mobileNavOpen && 'mobile-open')}>
          <div className="flex h-16 items-center justify-between border-b border-white/10 px-5">
            <Brand inverse />
            <Button
              variant="quiet"
              size="icon"
              className="text-white lg:hidden"
              onClick={() => setMobileNavOpen(false)}
              aria-label="Close navigation"
            >
              <Menu className="size-5" />
            </Button>
          </div>
          <div className="px-4 py-5">
            <p className="px-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-white/45">
              Active project
            </p>
            <div className="mt-3 border-l border-white/15 pl-3">
              <p className="text-sm font-semibold text-white">Espresso cups for Harbour</p>
              <p className="mt-1 text-xs text-white/55">Toronto · 200 units</p>
            </div>
          </div>
          <nav className="px-3" aria-label="Project stages">
            {stages.map((stage, index) => {
              const Icon = stage.icon;
              const complete =
                (stage.id === 'brief' && briefApproved) ||
                (stage.id === 'research' && researchStarted) ||
                stages.findIndex((item) => item.id === activeStage) > index;
              return (
                <NavLink
                  key={stage.id}
                  to={stageHref(stage.id)}
                  onClick={() => {
                    setStage(stage.id);
                    setMobileNavOpen(false);
                  }}
                  className={({isActive}) =>
                    cn(
                      'mb-1 flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm font-medium text-white/62 transition-colors hover:bg-white/7 hover:text-white',
                      isActive && 'bg-white/10 text-white',
                    )
                  }
                >
                  {complete ? (
                    <CheckCircle2 className="size-[17px] text-[#a7cfbf]" />
                  ) : (
                    <Icon className="size-[17px]" />
                  )}
                  {stage.label}
                </NavLink>
              );
            })}
          </nav>
          <div className="mt-auto border-t border-white/10 p-4">
            <Button
              variant="quiet"
              className="w-full justify-start text-white/60 hover:bg-white/7 hover:text-white"
              onClick={() => {
                resetDemo();
                navigate('/projects/harbour-coffee-lab/brief');
              }}
            >
              <RotateCcw className="size-4" /> Reset this demo
            </Button>
            <p className="mt-3 px-3 text-[10px] leading-4 text-white/35">
              Resets only this visitor overlay. Fixture baseline remains unchanged.
            </p>
          </div>
        </aside>
      )}

      <main className="app-main">
        <header className="project-header">
          <div className="flex min-w-0 items-center gap-3">
            {!presentation && (
              <Button
                variant="quiet"
                size="icon"
                className="lg:hidden"
                onClick={() => setMobileNavOpen(true)}
                aria-label="Open navigation"
              >
                <Menu className="size-5" />
              </Button>
            )}
            {presentation && <Brand compact />}
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="truncate text-[15px] font-semibold text-[var(--ink)]">
                  Espresso cups for Harbour Coffee Lab
                </h1>
                <span className="hidden rounded-full bg-[var(--teal-soft)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--teal)] sm:inline-flex">
                  Replay
                </span>
              </div>
              <p className="mt-0.5 text-xs text-[var(--muted)]">
                {briefApproved ? 'Brief approved' : 'Brief awaiting approval'} · Fixture activity 2
                min ago
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <Button
              variant="quiet"
              size="icon"
              className="header-action header-share"
              onClick={share}
              aria-label="Copy project link"
            >
              <Share2 className="size-[18px]" />
            </Button>
            <Button
              variant="quiet"
              size="icon"
              className="header-action header-presentation"
              onClick={togglePresentation}
              aria-label={presentation ? 'Exit presentation mode' : 'Enter presentation mode'}
            >
              <Presentation className="size-[18px]" />
            </Button>
            <Button
              variant="quiet"
              size="icon"
              className="header-action header-pulse"
              onClick={() => setPulseOpen((current) => !current)}
              aria-label={pulseOpen ? 'Hide System Pulse' : 'Show System Pulse'}
            >
              {pulseOpen ? (
                <PanelRightClose className="size-[18px]" />
              ) : (
                <PanelRightOpen className="size-[18px]" />
              )}
            </Button>
            <Button
              variant="quiet"
              size="icon"
              className="header-action header-more"
              aria-label="More project actions"
            >
              <MoreHorizontal className="size-[18px]" />
            </Button>
          </div>
        </header>

        <div className="stage-tabs" role="navigation" aria-label="Project stage tabs">
          {stages.map((stage) => (
            <Link
              key={stage.id}
              to={stageHref(stage.id)}
              onClick={() => setStage(stage.id)}
              className={cn('stage-tab', activeStage === stage.id && 'active')}
            >
              {stage.label}
            </Link>
          ))}
        </div>

        <div className="border-b border-[var(--border)] bg-[var(--surface)] px-5 py-2.5 sm:px-7">
          {baselineMode === 'captured_live' ? <CapturedResearchBadge /> : <FixtureBadge />}
          <span className="ml-3 text-xs text-[var(--muted)]">
            {backendReady ? baselineLabel : 'Connecting to the Convex demo baseline…'}
          </span>
        </div>

        {backendError && (
          <div
            className="border-b border-[var(--danger)] bg-[var(--danger-soft)] px-5 py-2.5 text-xs font-medium text-[var(--danger)] sm:px-7"
            role="alert"
          >
            {backendError}
          </div>
        )}

        <section className="metric-strip" aria-label="Project metrics">
          {metricItems.map(([label, value]) => (
            <div key={label} className="metric-cell">
              <span className="text-[22px] font-semibold tabular-nums tracking-[-0.035em] text-[var(--ink)]">
                {value}
              </span>
              <span className="text-[11px] font-medium text-[var(--muted)]">{label}</span>
            </div>
          ))}
        </section>

        <div className="workspace-scroll">
          <Outlet />
        </div>
      </main>

      {!presentation && <SystemPulse collapsed={!pulseOpen} />}
    </div>
  );
}
