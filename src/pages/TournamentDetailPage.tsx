import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth, useTournamentData } from '../hooks/useAppContext';
import { 
  deleteTournament as deleteTournamentService,
  updateTournament as updateTournamentService
} from '../lib/tournamentService';
import TournamentDetail from '../components/tournament/Detail';

export function TournamentDetailPage() {
  const { tournamentId } = useParams<{ tournamentId: string }>();
  const { user } = useAuth();
  const { tournament, matches, loading } = useTournamentData(tournamentId);
  const navigate = useNavigate();

  if (loading) return (
    <div className="min-h-screen bg-surface flex items-center justify-center">
      <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
    </div>
  );

  if (!tournament) return (
    <div className="min-h-screen bg-surface flex items-center justify-center">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-on-surface mb-4">Tournament Not Found</h2>
        <button onClick={() => navigate('/')} className="bg-primary-container text-on-primary-container px-8 py-4 rounded-xl font-bold">
          Back to Tournaments
        </button>
      </div>
    </div>
  );

  return (
    <TournamentDetail 
      tournament={tournament}
      matches={matches}
      onBack={() => navigate('/')}
      onSelectMatch={(m) => navigate(`/tournament/${tournamentId}/match/${m.id}`)}
      onDelete={async () => {
        await deleteTournamentService(tournament.id!);
        navigate('/');
      }}
      onUpdate={(updates) => updateTournamentService(tournament.id!, updates)}
      isCreator={user?.uid === tournament.creatorId}
      user={user}
    />
  );
}
