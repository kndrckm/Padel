import React from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../hooks/useAppContext';
import { createTournament as createTournamentService } from '../lib/tournamentService';
import { Tournament } from '../types';
import TournamentCreator from '../components/tournament/Creator';

export function TournamentCreatePage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  if (!user) return null;

  return (
    <TournamentCreator 
      onCancel={() => navigate('/')}
      user={user}
      onCreate={async (name, mode, players, courts, pts, scoringMode, matchesCount, pools, pTeams, pType, qMode, pMode, advancingTeamsCount, setsToPlay, gamesPerSet, useGoldenPoint) => {
        const id = await createTournamentService(user.uid, name, mode, players, courts, pts, scoringMode, matchesCount, pools, pTeams, pType, qMode, pMode, advancingTeamsCount, setsToPlay, gamesPerSet, useGoldenPoint);
        navigate(`/tournament/${id}`);
      }}
    />
  );
}
