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
    const isKatapgama = mode === GameMode.KATAPGAMA_FUN_PADEL;
    const effectiveMode = isKatapgama ? GameMode.TEAM_MEXICANO : (mode === GameMode.MIXED ? qualifierMode! : mode);
    
    // For Katapgama, force 16 points, 2 matches, 2 courts, and Team Americano qualifier
    const finalPointsToPlay = isKatapgama ? 16 : pointsToPlay;
    const finalNumberOfMatches = isKatapgama ? 2 : numberOfMatches;
    const finalScoringMode = isKatapgama ? ScoringMode.AMERICANO : scoringMode;
    const finalCourtsCount = isKatapgama ? 2 : courtsCount;

    const tournamentData = {
      name,
      mode: isKatapgama ? GameMode.MIXED : mode,
      isKatapgama,
      creatorId: userId,
      status: 'active',
      createdAt: new Date().toISOString(),
      players: processedPlayers,
      courtsCount: finalCourtsCount,
      pointsToPlay: finalPointsToPlay,
      scoringMode: finalScoringMode,
      numberOfMatches: finalNumberOfMatches,
      swissPools: swissPools || null,
      playoffTeams: isKatapgama ? 8 : (playoffTeams || null),
      playoffType: isKatapgama ? 'single' : (playoffType || null),
      qualifierMode: isKatapgama ? GameMode.TEAM_MEXICANO : (qualifierMode || null),
      playoffMode: isKatapgama ? GameMode.SINGLE_ELIMINATION : (playoffMode || null),
      playoffStarted: false,
      advancingTeamsCount: isKatapgama ? 8 : (advancingTeamsCount || null),
      setsToPlay: isKatapgama ? 1 : (setsToPlay || null),
      gamesPerSet: gamesPerSet || null,
      useGoldenPoint: useGoldenPoint ?? true,
      qualifierSettings: {
        scoringMode: finalScoringMode,
        pointsToPlay: finalPointsToPlay,
        setsToPlay: isKatapgama ? 1 : (setsToPlay || 1),
        gamesPerSet: gamesPerSet || 6,
        useGoldenPoint: useGoldenPoint ?? true
      },
      playoffSettings: {
        scoringMode: ScoringMode.TENNIS,
        pointsToPlay: 21,
        setsToPlay: 3, // Default for QF
        gamesPerSet: 6,
        useGoldenPoint: true
      },
      currentStage: 1
    };

    const tournamentRef = await addDoc(collection(db, 'tournaments'), tournamentData);

    const initialMatches = generateInitialMatches(
      mode, 
      processedPlayers, 
      finalCourtsCount, 
      finalNumberOfMatches, 
      swissPools
    );

    for (const match of initialMatches) {
      await addDoc(collection(db, `tournaments/${tournamentRef.id}/matches`), {
        ...match,
        tournamentId: tournamentRef.id,
        score1: 0,
        score2: 0,
        points1: finalScoringMode === ScoringMode.TENNIS ? '0' : 0,
        points2: finalScoringMode === ScoringMode.TENNIS ? '0' : 0,
        sets1: [],
        sets2: [],
        isTiebreak: false,
        scoringMode: finalScoringMode,
        setsToPlay: isKatapgama ? 1 : (setsToPlay || (finalScoringMode === ScoringMode.TENNIS ? 3 : 1)),
        gamesPerSet: gamesPerSet || 6,
        useGoldenPoint: useGoldenPoint ?? true,
        pointsToPlay: finalPointsToPlay,
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
