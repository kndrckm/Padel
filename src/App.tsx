import React from 'react';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { LoginView } from './components/auth/LoginView';
import { MainView } from './components/views/MainView';
import { useAppLogic } from './hooks/useAppLogic';

export default function App() {
  const {
    user,
    isAuthReady,
    tournaments,
    selectedTournament,
    setSelectedTournament,
    matches,
    view,
    setView,
    activeMatch,
    setActiveMatch,
    handleLogin,
    handleLogout
  } = useAppLogic();

  if (!isAuthReady) return (
    <div className="min-h-screen bg-[#FDFBF3] flex items-center justify-center">
      <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
    </div>
  );

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-[#FDFBF3] font-sans selection:bg-primary/10 selection:text-primary overflow-x-hidden">
        {!user && view === 'list' ? (
          <LoginView onLogin={handleLogin} />
        ) : (
          /* Full width layout as requested */
          <div className="w-full min-h-screen flex flex-col items-center">
            <MainView 
              view={view}
              setView={setView}
              user={user}
              tournaments={tournaments}
              selectedTournament={selectedTournament}
              setSelectedTournament={setSelectedTournament}
              matches={matches}
              setActiveMatch={setActiveMatch}
              activeMatch={activeMatch}
              handleLogout={handleLogout}
            />
          </div>
        )}
      </div>
    </ErrorBoundary>
  );
}
