import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth, useTournamentData } from '../hooks/useAppContext';
import { MatchStatus } from '../types';
import MatchScorer from '../components/match/Scorer';

export function MatchScorerPage() {
  const { tournamentId, matchId } = useParams<{ tournamentId: string; matchId: string }>();
  const { user } = useAuth();
  const { tournament, matches, loading } = useTournamentData(tournamentId);
  const navigate = useNavigate();

  const activeMatch = matches.find(m => m.id === matchId) || null;

  if (loading) return (
    <div className="min-h-screen bg-surface flex items-center justify-center">
      <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
    </div>
  );

  if (!tournament || !activeMatch) return (
    <div className="min-h-screen bg-surface flex items-center justify-center">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-on-surface mb-4">Match Not Found</h2>
        <button 
          onClick={() => navigate(tournamentId ? `/tournament/${tournamentId}` : '/')} 
          className="bg-primary-container text-on-primary-container px-8 py-4 rounded-xl font-bold"
        >
          Back to Tournament
        </button>
      </div>
    </div>
  );

  return (
    <MatchScorer 
      match={activeMatch}
      tournament={tournament}
      onBack={() => navigate(`/tournament/${tournamentId}`)}
      onUpdate={async (updates) => {
        const matchRef = doc(db, `tournaments/${tournamentId}/matches`, activeMatch.id!);
        await updateDoc(matchRef, updates);
        
        // Check for progression if completed
        if (updates.status === MatchStatus.COMPLETED) {
          const { handleMatchProgression } = await import('../utils/progressionPath');
          await handleMatchProgression(tournamentId!, { ...activeMatch, ...updates }, matches);
        }
      }}
      pointsToPlay={tournament.pointsToPlay}
      user={user}
    />
  );
}
