import {Navigate, RouterProvider, createBrowserRouter} from 'react-router-dom';
import {lazy, Suspense, type ReactNode} from 'react';
import {DemoProvider} from '@/app/DemoContext';

const AppShell = lazy(() =>
  import('@/components/layout/AppShell').then((module) => ({default: module.AppShell})),
);
const LandingPage = lazy(() =>
  import('@/pages/LandingPage').then((module) => ({default: module.LandingPage})),
);
const ComposerPage = lazy(() =>
  import('@/pages/ComposerPage').then((module) => ({default: module.ComposerPage})),
);
const BuyerResearchPage = lazy(() =>
  import('@/pages/BuyerResearchPage').then((module) => ({default: module.BuyerResearchPage})),
);
const OperatorPage = lazy(() =>
  import('@/pages/OperatorPage').then((module) => ({default: module.OperatorPage})),
);
const ShareCardPage = lazy(() =>
  import('@/pages/ShareCardPage').then((module) => ({default: module.ShareCardPage})),
);

const BriefPage = lazy(() =>
  import('@/pages/project/BriefPage').then((module) => ({default: module.BriefPage})),
);
const ResearchPage = lazy(() =>
  import('@/pages/project/ResearchPage').then((module) => ({default: module.ResearchPage})),
);
const MakersPage = lazy(() =>
  import('@/pages/project/MakersPage').then((module) => ({default: module.MakersPage})),
);
const OutreachPage = lazy(() =>
  import('@/pages/project/OutreachPage').then((module) => ({default: module.OutreachPage})),
);
const ComparePage = lazy(() =>
  import('@/pages/project/ComparePage').then((module) => ({default: module.ComparePage})),
);
const PassportPage = lazy(() =>
  import('@/pages/project/PassportPage').then((module) => ({default: module.PassportPage})),
);

function loadRoute(children: ReactNode) {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-72 items-center justify-center text-sm text-[var(--muted)]">
          Loading workspace…
        </div>
      }
    >
      {children}
    </Suspense>
  );
}

const router = createBrowserRouter([
  {path: '/', element: loadRoute(<LandingPage />)},
  {path: '/compose', element: loadRoute(<ComposerPage />)},
  {path: '/research/:requestId', element: loadRoute(<BuyerResearchPage />)},
  {path: '/operator', element: loadRoute(<OperatorPage />)},
  {path: '/share-card', element: loadRoute(<ShareCardPage />)},
  {path: '/demo', element: <Navigate to="/projects/harbour-coffee-lab/brief" replace />},
  {
    path: '/projects/:projectSlug',
    element: loadRoute(<AppShell />),
    children: [
      {index: true, element: <Navigate to="brief" replace />},
      {path: 'brief', element: loadRoute(<BriefPage />)},
      {path: 'research', element: loadRoute(<ResearchPage />)},
      {path: 'makers', element: loadRoute(<MakersPage />)},
      {path: 'outreach', element: loadRoute(<OutreachPage />)},
      {path: 'compare', element: loadRoute(<ComparePage />)},
      {path: 'passport', element: loadRoute(<PassportPage />)},
    ],
  },
  {path: '*', element: <Navigate to="/" replace />},
]);

export default function App() {
  return (
    <DemoProvider>
      <RouterProvider router={router} />
    </DemoProvider>
  );
}
