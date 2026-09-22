import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Check,
  FileText,
  Info,
  Mail,
  RotateCcw,
  Scale,
  Search,
  Share2,
  Users,
} from 'lucide-react';
import {useState} from 'react';
import {Link, NavLink, Outlet, useLocation, useNavigate, useSearchParams} from 'react-router-dom';
import {Brand} from '@/components/brand/Logo';
import {Button} from '@/components/ui/Button';
import {useDemo} from '@/app/useDemo';
import type {ProjectStage} from '@/domain/types';
import {useTrackProductEvent} from '@/app/useTrackProductEvent';
import {AboutDemoDrawer} from './AboutDemoDrawer';

const stages: Array<{id: ProjectStage; label: string; icon: typeof FileText}> = [
  {id: 'brief', label: 'Order', icon: FileText},
  {id: 'research', label: 'Sources', icon: Search},
  {id: 'makers', label: 'Workshops', icon: Users},
  {id: 'outreach', label: 'Messages', icon: Mail},
  {id: 'compare', label: 'Quote', icon: Scale},
  {id: 'passport', label: 'Profile', icon: BookOpen},
];

export function AppShell() {
  useTrackProductEvent('demo_opened');
  const {backendError, briefApproved, researchStarted, controlledReply, resetDemo, setStage} =
    useDemo();
  const location = useLocation();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const presentation = params.get('present') === '1';
  const [aboutOpen, setAboutOpen] = useState(false);
  const [notice, setNotice] = useState('');
  const active = stages.find((stage) => location.pathname.endsWith(`/${stage.id}`))?.id ?? 'brief';
  const href = (stage: ProjectStage) =>
    `/projects/harbour-coffee-lab/${stage}${presentation ? '?present=1' : ''}`;
  const next: {stage: ProjectStage; title: string; action: string} = !briefApproved
    ? {
        stage: 'brief',
        title: 'Review your requirements before exploring makers.',
        action: 'Review brief',
      }
    : !researchStarted
      ? {
          stage: 'research',
          title: 'Explore the example research and its sources.',
          action: 'View research',
        }
      : controlledReply
        ? {
            stage: 'compare',
            title: 'A reply is available from the fictional Atlas studio.',
            action: 'Compare reply',
          }
        : {
            stage: 'makers',
            title: 'Review capabilities and questions for each maker.',
            action: 'Explore makers',
          };
  const navigation = (mobile = false) => (
    <nav
      className={mobile ? 'stage-tabs buyer-mobile-nav' : 'buyer-stage-nav'}
      aria-label="Project stages"
    >
      {stages.map((stage) => {
        const Icon = stage.icon;
        const complete =
          (stage.id === 'brief' && briefApproved) || (stage.id === 'research' && researchStarted);
        return (
          <NavLink
            key={stage.id}
            to={href(stage.id)}
            onClick={() => void setStage(stage.id)}
            className={({isActive}) => `buyer-stage ${isActive ? 'active' : ''}`}
          >
            <Icon size={17} />
            <span>{stage.label}</span>
            <span className="stage-position">{complete ? <Check size={14} /> : null}</span>
          </NavLink>
        );
      })}
    </nav>
  );
  const reset = async () => {
    await resetDemo();
    navigate(href('brief'));
    setNotice('Example reset. The original reply is still available.');
  };
  const share = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setNotice('Project link copied.');
    } catch {
      setNotice('Copy the project URL from your address bar.');
    }
  };
  return (
    <div className={`app-frame buyer-shell ${presentation ? 'presentation-mode' : ''}`}>
      {!presentation && (
        <aside className="app-rail buyer-rail">
          <div className="buyer-brand">
            <Brand inverse />
          </div>
          <Link to="/" className="buyer-back">
            <ArrowLeft size={15} /> Home
          </Link>
          <div className="buyer-project">
            <span className="buyer-overline">Your example order</span>
            <img
              src="/images/espresso-cup-study.webp"
              alt="Illustrative cups for the fictional café"
            />
            <h2>
              Espresso cups
              <br />
              for Harbour
            </h2>
            <p>200 cups · Toronto, Canada</p>
          </div>
          {navigation()}
          <div className="buyer-rail-footer">
            <button onClick={() => setAboutOpen(true)}>
              <Info size={16} /> About this demo
            </button>
            <button onClick={() => void reset()}>
              <RotateCcw size={16} /> Reset this demo
            </button>
            <span>Example café order</span>
          </div>
        </aside>
      )}
      <main className="app-main">
        <header className="project-header buyer-header">
          <div className="buyer-breadcrumb">
            <span>Harbour Coffee Lab</span>
            <span aria-hidden="true">/</span>
            <h1>{stages.find((s) => s.id === active)?.label}</h1>
          </div>
          <div className="buyer-header-actions">
            <span className="buyer-demo-label">Example order</span>
            <Button
              variant="quiet"
              size="icon"
              onClick={() => void share()}
              aria-label="Copy project link"
            >
              <Share2 size={17} />
            </Button>
            <Button variant="secondary" size="sm" onClick={() => setAboutOpen(true)}>
              About this demo
            </Button>
          </div>
        </header>
        {navigation(true)}
        <div className="buyer-disclosure" hidden={active === 'compare'}>
          <span className="buyer-status-dot" />
          <span>
            Example order · fictional workshops ·{' '}
            {controlledReply ? 'Atlas has replied' : 'Example data'}
          </span>
          <button onClick={() => setAboutOpen(true)}>
            About this example <ArrowRight size={13} />
          </button>
        </div>
        {backendError && (
          <div className="buyer-notice" role="alert">
            {backendError}
          </div>
        )}
        {notice && (
          <p className="buyer-notice" role="status">
            {notice}
          </p>
        )}
        {active !== 'compare' && active !== next.stage && (
          <div className="buyer-next">
            <span>
              <small>Next step</small>
              {next.title}
            </span>
            <Link to={href(next.stage)}>
              {next.action}
              <ArrowRight size={15} />
            </Link>
          </div>
        )}
        <div className="workspace-scroll">
          <Outlet />
        </div>
        <footer className="buyer-mobile-footer">
          <button onClick={() => void reset()}>
            <RotateCcw size={15} />
            Reset this demo
          </button>
        </footer>
      </main>
      <AboutDemoDrawer open={aboutOpen} onOpenChange={setAboutOpen} />
    </div>
  );
}
