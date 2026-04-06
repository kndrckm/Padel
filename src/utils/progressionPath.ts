import { Match, MatchStatus } from '../types';
import { doc, updateDoc, collection, addDoc, getDocs, query, where } from 'firebase/firestore';
import { db } from '../lib/firebase';

export async function handleMatchProgression(
  tournamentId: string,
  completedMatch: Match,
  allMatches: Match[]
) {
  if (completedMatch.status !== MatchStatus.COMPLETED) return;

  const winner = completedMatch.winner === 1 ? completedMatch.team1 : completedMatch.team2;
  const loser = completedMatch.winner === 1 ? completedMatch.team2 : completedMatch.team1;

  // 1. Progress Winner
  if (completedMatch.nextMatchId) {
    const targetMatch = allMatches.find(m => 
      m.logicId === completedMatch.nextMatchId || 
      m.id === completedMatch.nextMatchId
    );

    if (targetMatch && targetMatch.id) {
      let teamKey: 'team1' | 'team2';
      
      // Determine slot in target match
      if (completedMatch.nextMatchId.startsWith('gf_')) {
        // GF logic: WB Final winner is team1, LB Final winner is team2
        teamKey = completedMatch.isLosersBracket ? 'team2' : 'team1';
      } else if (completedMatch.isLosersBracket) {
        // Winner staying in LB
        // In DE: Winners from previous LB stage always take team1 in mixing rounds (even stages)
        const stageMatch = completedMatch.nextMatchId.match(/s(\d+)_/);
        const targetStage = stageMatch ? parseInt(stageMatch[1]) : 1;
        const isMixingRound = targetStage % 2 === 0;
        if (isMixingRound) {
          teamKey = 'team1';
        } else {
          teamKey = (completedMatch.matchIndex ?? 0) % 2 === 0 ? 'team1' : 'team2';
        }
      } else {
        // Winner staying in WB
        teamKey = (completedMatch.matchIndex ?? 0) % 2 === 0 ? 'team1' : 'team2';
      }

      const otherTeamKey = teamKey === 'team1' ? 'team2' : 'team1';
      const hasOtherTeam = targetMatch[otherTeamKey] && targetMatch[otherTeamKey].length > 0;

      await updateDoc(doc(db, `tournaments/${tournamentId}/matches`, targetMatch.id), {
        [teamKey]: winner,
        isSkeleton: !hasOtherTeam
      });
    }
  }

  // 2. Progress Loser (for Double Elimination)
  if (completedMatch.losersMatchId) {
    const targetMatch = allMatches.find(m => 
      m.logicId === completedMatch.losersMatchId || 
      m.id === completedMatch.losersMatchId
    );

    if (targetMatch && targetMatch.id) {
      // In DE: WB Losers entering LB at even stages always take team2
      const stageMatch = completedMatch.losersMatchId.match(/s(\d+)_/);
      const targetStage = stageMatch ? parseInt(stageMatch[1]) : 1;
      const isMixingRound = targetStage % 2 === 0;
      
      let teamKey: 'team1' | 'team2';
      if (isMixingRound) {
        teamKey = 'team2';
      } else {
        teamKey = (completedMatch.matchIndex ?? 0) % 2 === 0 ? 'team1' : 'team2';
      }

      const otherTeamKey = teamKey === 'team1' ? 'team2' : 'team1';
      const hasOtherTeam = targetMatch[otherTeamKey] && targetMatch[otherTeamKey].length > 0;

      await updateDoc(doc(db, `tournaments/${tournamentId}/matches`, targetMatch.id), {
        [teamKey]: loser,
        isSkeleton: !hasOtherTeam
      });
    }
  }

  // 3. Grand Final Reset Logic
  if (completedMatch.logicId === 'gf_m0_u' && completedMatch.winner === 2) {
    const resetMatch = allMatches.find(m => m.logicId === 'gf_reset');
    if (resetMatch && resetMatch.id) {
      await updateDoc(doc(db, `tournaments/${tournamentId}/matches`, resetMatch.id), {
        team1: completedMatch.team1,
        team2: completedMatch.team2,
        isSkeleton: false
      });
    }
  }
}
