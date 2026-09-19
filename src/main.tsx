import '@fontsource-variable/geist';
import '@fontsource/instrument-serif/400.css';
import '@fontsource/instrument-serif/400-italic.css';
import {ConvexAuthProvider} from '@convex-dev/auth/react';
import {SessionProvider} from 'convex-helpers/react/sessions';
import {ConvexReactClient} from 'convex/react';
import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App';
import {useBrowserSession} from './app/useBrowserSession';
import {WorkspaceErrorBoundary} from './app/WorkspaceErrorBoundary';
import './styles/global.css';

const convexUrl = import.meta.env.VITE_CONVEX_URL;
if (!convexUrl) throw new Error('VITE_CONVEX_URL is required.');
const convex = new ConvexReactClient(convexUrl);

const root = document.getElementById('root');
if (!root) throw new Error('MakerMesh root element is missing.');

createRoot(root).render(
  <StrictMode>
    <ConvexAuthProvider client={convex}>
      <SessionProvider storageKey="makermesh-demo-session-v1" useStorage={useBrowserSession}>
        <WorkspaceErrorBoundary>
          <App />
        </WorkspaceErrorBoundary>
      </SessionProvider>
    </ConvexAuthProvider>
  </StrictMode>,
);
