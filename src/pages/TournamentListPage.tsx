import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAppContext';
import { duplicateTournament as duplicateTournamentService } from '../lib/tournamentService';
import TournamentList from '../components/tournament/List';

export function TournamentListPage() {
  const { user, tournaments, handleLogout } = useAuth();
  const navigate = useNavigate();

  return (
    <TournamentList 
      tournaments={tournaments}
      onSelect={(t) => navigate(`/tournament/${t.id}`)}
      onDuplicate={async (t) => {
        if (user) {
          await duplicateTournamentService(t.id!, t, user.uid);
        }
      }}
      onCreateNew={() => navigate('/create')}
      onManage={() => navigate('/manage')}
      onLogout={handleLogout}
      user={user}
    />
  );
}
