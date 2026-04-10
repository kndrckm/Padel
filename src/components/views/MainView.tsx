import React from 'react';
import { AnimatePresence } from 'framer-motion';
import { db } from '../../lib/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { Tournament, Match, MatchStatus, OperationType } from '../../types';
import { 
  createTournament as createTournamentService, 
  deleteTournament as deleteTournamentService, 
  updateTournament as updateTournamentService 
} from '../../lib/tournamentService';

// Components
import TournamentList from '../tournament/List';
import TournamentCreator from '../tournament/Creator';
import TournamentDetail from '../tournament/Detail';
import MatchScorer from '../match/Scorer';
import KatapgamaManager from '../user/KatapgamaManager';
import { ViewState } from '../../hooks/useAppLogic';

interface MainViewProps {
  view: ViewState;
  setView: (v: ViewState) => void;
  user: any;
  tournaments: Tournament[];
  selectedTournament: Tournament | null;
  setSelectedTournament: (t: Tournament | null) => void;
  matches: Match[];
  setActiveMatch: (m: Match | null) => void;
  activeMatch: Match | null;
  handleLogout: () => void;
}

export const MainView = ({
  view,
  setView,
  user,
  tournaments,
  selectedTournament,
  setSelectedTournament,
  matches,
  setActiveMatch,
  activeMatch,
  handleLogout
}: MainViewProps) => {
  return (
    <AnimatePresence mode="wait">
      {view === 'list' && (
        <TournamentList 
          tournaments={tournaments}
          onSelect={(t) => { setSelectedTournament(t); setView('detail'); }}
          onCreateNew={() => setView('create')}
          onManage={() => setView('manage')}
          onLogout={handleLogout}
          user={user}
        />
      )}

      {view === 'create' && user && (
        <TournamentCreator 
          onCancel={() => setView('list')}
          user={user}
          onCreate={async (name, mode, players, courts, pts, scoringMode, matchesCount, pools, pTeams, pType, qMode, pMode, advancingTeamsCount, setsToPlay, gamesPerSet, useGoldenPoint) => {
            const id = await createTournamentService(user!.uid, name, mode, players, courts, pts, scoringMode, matchesCount, pools, pTeams, pType, qMode, pMode, advancingTeamsCount, setsToPlay, gamesPerSet, useGoldenPoint);
            const tDoc = await getDoc(doc(db, 'tournaments', id));
            setSelectedTournament({ id, ...tDoc.data() } as Tournament);
            setView('detail');
          }}
        />
      )}

      {view === 'detail' && selectedTournament && (
        <TournamentDetail 
          tournament={selectedTournament}
          matches={matches}
          onBack={() => { setView('list'); setSelectedTournament(null); }}
          onSelectMatch={(m) => { setActiveMatch(m); setView('match'); }}
          onDelete={async () => {
            await deleteTournamentService(selectedTournament.id!);
            setView('list');
            setSelectedTournament(null);
          }}
          onUpdate={(updates) => updateTournamentService(selectedTournament.id!, updates)}
          isCreator={user?.uid === selectedTournament.creatorId}
        />
      )}

      {view === 'match' && activeMatch && selectedTournament && (
        <MatchScorer 
          match={activeMatch}
          tournament={selectedTournament}
          onBack={() => setView('detail')}
          onUpdate={async (updates) => {
            const matchRef = doc(db, `tournaments/${selectedTournament.id}/matches`, activeMatch.id!);
            await updateDoc(matchRef, updates);
            
            // Check for progression if completed
            if (updates.status === MatchStatus.COMPLETED) {
              const { handleMatchProgression } = await import('../../utils/progressionPath');
              await handleMatchProgression(selectedTournament.id!, { ...activeMatch, ...updates }, matches);
            }
          }}
          pointsToPlay={selectedTournament.pointsToPlay}
          user={user}
        />
      )}

      {view === 'manage' && user && (
        <KatapgamaManager 
          user={user}
          onBack={() => setView('list')}
        />
      )}
    </AnimatePresence>
  );
};
