import { 
  collection, 
  addDoc, 
  doc, 
  deleteDoc, 
  updateDoc,
  serverTimestamp
} from 'firebase/firestore';
import { db } from './firebase';
import { GameMode, Tournament, Player, OperationType, ScoringMode, MatchStatus } from '../types';
import { handleFirestoreError } from './firestore';
import { generateInitialMatches } from '../utils/tournamentLogic';

export async function createTournament(
  userId: string,
  name: string, 
  mode: GameMode, 
  players: Player[], 
  courtsCount: number, 
  pointsToPlay: number, 
  scoringMode: ScoringMode = ScoringMode.AMERICANO,
  numberOfMatches?: number, 
  swissPools?: number, 
  playoffTeams?: number, 
  playoffType?: 'single' | 'double',
  qualifierMode?: GameMode,
  playoffMode?: GameMode,
  advancingTeamsCount?: number,
  setsToPlay?: number,
  gamesPerSet?: number,
  useGoldenPoint?: boolean
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
      scoringMode,
      numberOfMatches,
      swissPools,
      playoffTeams,
      playoffType,
      qualifierMode,
      playoffMode,
      playoffStarted: false,
      advancingTeamsCount,
      setsToPlay,
      gamesPerSet,
      useGoldenPoint,
      qualifierSettings: {
        scoringMode: scoringMode,
        pointsToPlay: pointsToPlay,
        setsToPlay: setsToPlay || 1,
        gamesPerSet: gamesPerSet || 6,
        useGoldenPoint: useGoldenPoint ?? true
      },
      playoffSettings: {
        scoringMode: ScoringMode.TENNIS,
        pointsToPlay: pointsToPlay,
        setsToPlay: 3,
        gamesPerSet: 6,
        useGoldenPoint: true
      },
      currentStage: 1
    });

    const initialMatches = generateInitialMatches(
      mode === GameMode.MIXED ? qualifierMode! : mode, 
      processedPlayers, 
      courtsCount, 
      numberOfMatches, 
      swissPools
    );

    for (const match of initialMatches) {
      await addDoc(collection(db, `tournaments/${tournamentRef.id}/matches`), {
        ...match,
        tournamentId: tournamentRef.id,
        score1: 0,
        score2: 0,
        points1: scoringMode === ScoringMode.TENNIS ? '0' : 0,
        points2: scoringMode === ScoringMode.TENNIS ? '0' : 0,
        sets1: [],
        sets2: [],
        isTiebreak: false,
        scoringMode,
        setsToPlay: setsToPlay || (scoringMode === ScoringMode.TENNIS ? 3 : 1),
        gamesPerSet: gamesPerSet || 6,
        useGoldenPoint: useGoldenPoint ?? true,
        pointsToPlay: pointsToPlay,
        serverIndex: 0,
        isPlayoff: false,
        status: MatchStatus.PENDING,
        createdAt: serverTimestamp()
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
