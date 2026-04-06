import { 
  collection, 
  addDoc, 
  doc, 
  deleteDoc, 
  updateDoc 
} from 'firebase/firestore';
import { db } from './firebase';
import { GameMode, Tournament, Player, OperationType } from '../types';
import { handleFirestoreError } from './firestore';
import { generateInitialMatches } from '../utils/tournamentLogic';

export async function createTournament(
  userId: string,
  name: string, 
  mode: GameMode, 
  players: Player[], 
  courtsCount: number, 
  pointsToPlay: number, 
  numberOfMatches?: number, 
  swissPools?: number, 
  playoffTeams?: number, 
  playoffType?: 'single' | 'double'
): Promise<string> {
  const processedPlayers = players.map((p, i) => ({
    ...p,
    name: p.name.trim() || `Player ${i + 1}`
  }));

  try {
    const tournamentRef = await addDoc(collection(db, 'tournaments'), {
      name,
      mode,
      creatorId: userId,
      status: 'active',
      createdAt: new Date().toISOString(),
      players: processedPlayers,
      courtsCount,
      pointsToPlay,
      numberOfMatches,
      swissPools,
      playoffTeams,
      playoffType,
      currentStage: 1
    });

    const initialMatches = generateInitialMatches(mode, processedPlayers, courtsCount, numberOfMatches, swissPools);

    for (const match of initialMatches) {
      await addDoc(collection(db, `tournaments/${tournamentRef.id}/matches`), {
        ...match,
        tournamentId: tournamentRef.id,
        score1: 0,
        score2: 0,
        sets1: [],
        sets2: [],
        serverIndex: 0
      });
    }

    return tournamentRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, 'tournaments');
    throw error;
  }
}

export async function deleteTournament(id: string) {
  try {
    await deleteDoc(doc(db, 'tournaments', id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `tournaments/${id}`);
  }
}

export async function updateTournament(id: string, updates: Partial<Tournament>) {
  try {
    await updateDoc(doc(db, 'tournaments', id), updates);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `tournaments/${id}`);
  }
}
