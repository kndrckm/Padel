import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { useAuth } from './hooks/useAppContext';

// Pages
import { TournamentListPage } from './pages/TournamentListPage';
import { TournamentCreatePage } from './pages/TournamentCreatePage';
import { TournamentDetailPage } from './pages/TournamentDetailPage';
import { MatchScorerPage } from './pages/MatchScorerPage';
import { KatapgamaManagerPage } from './pages/KatapgamaManagerPage';
import { LoginView } from './components/auth/LoginView';
import { OfflineBanner } from './components/common/OfflineBanner';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isAuthReady, handleLogin } = useAuth();
  
  if (!isAuthReady) return (
    <div className="min-h-screen bg-surface flex items-center justify-center">
      <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
    </div>
  );

  if (!user) return <LoginView onLogin={handleLogin} />;

  return <>{children}</>;
}

/**
 * PublicRoute — allows both authenticated and unauthenticated users.
 * Used for tournament deep-links that are publicly viewable.
 */
function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isAuthReady } = useAuth();
  
  if (!isAuthReady) return (
    <div className="min-h-screen bg-surface flex items-center justify-center">
      <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
    </div>
  );

  return <>{children}</>;
}

export function AppRouter() {
  const { connectionStatus } = useAuth();

  return (
    <HashRouter>
      <div className="min-h-screen bg-surface font-sans selection:bg-primary/10 selection:text-primary overflow-x-hidden">
        <OfflineBanner status={connectionStatus} />
        <div className="w-full min-h-screen flex flex-col items-center">
          <AnimatePresence mode="wait">
            <Routes>
              <Route path="/" element={
                <ProtectedRoute>
                  <TournamentListPage />
                </ProtectedRoute>
              } />
              <Route path="/create" element={
                <ProtectedRoute>
                  <TournamentCreatePage />
                </ProtectedRoute>
              } />
              <Route path="/tournament/:tournamentId" element={
                <PublicRoute>
                  <TournamentDetailPage />
                </PublicRoute>
              } />
              <Route path="/tournament/:tournamentId/match/:matchId" element={
                <PublicRoute>
                  <MatchScorerPage />
                </PublicRoute>
              } />
              <Route path="/manage" element={
                <ProtectedRoute>
                  <KatapgamaManagerPage />
                </ProtectedRoute>
              } />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </AnimatePresence>
        </div>
        {import.meta.env.DEV && <DevToolsLazy />}
      </div>
    </HashRouter>
  );
}

/** Lazy-load DevTools only in dev mode */
function DevToolsLazy() {
  const { user, tournaments } = useAuth();
  const DevTools = React.lazy(() => import('./components/common/DevTools'));
  return (
    <React.Suspense fallback={null}>
      <DevTools user={user} currentTournament={undefined} matches={[]} />
    </React.Suspense>
  );
}
