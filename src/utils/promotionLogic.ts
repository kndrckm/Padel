import { Player, GameMode, MatchStatus } from '../types';
import { GeneratedMatch } from './tournamentLogic';

export function getAdvancingTeams(
  leaderboard: any[],
  count: number,
  isIndividualMode: boolean,
  players?: Player[]
): string[][] {
  const topPlayers = leaderboard.slice(0, count);
  
  if (!isIndividualMode) {
    // If we have the full players list, we can resolve the names correctly for team modes
    if (players && players.length > 0) {
      return topPlayers.map(p => {
        // Find all players that belong to this team name
        const teammates = players.filter(pl => pl.teamName === p.name);
        if (teammates.length >= 2) {
          return [teammates[0].name, teammates[1].name];
        }
        // Fallback to splitting by ' & ' if it was stored that way
        return p.name.split(' & ');
      });
    }
    return topPlayers.map(p => p.name.split(' & '));
  }
  
  // Individual mode: pair them up
  const teams: string[][] = [];
  const playerNames = topPlayers.map(p => p.name);
  
  for (let i = 0; i < playerNames.length; i += 2) {
    if (i + 1 < playerNames.length) {
      teams.push([playerNames[i], playerNames[i+1]]);
    }
  }
  
  return teams;
}

export function generatePlayoffMatches(
  teams: string[][],
  type: 'single' | 'double',
  courtsCount: number
): GeneratedMatch[] {
  const powerOf2 = Math.pow(2, Math.ceil(Math.log2(teams.length)));
  const scheduleTeams = [...teams];
  const byes = powerOf2 - teams.length;
  for (let i = 0; i < byes; i++) {
    scheduleTeams.push(['BYE', 'BYE']);
  }

  // Recursive Seeding to properly distance top ranks (e.g. 1 & 2 meet only in Final)
  let seedingMap = [0];
  let currentGroup = 1;
  while (currentGroup * 2 <= powerOf2) {
    const nextSeeding: number[] = [];
    for (const rank of seedingMap) {
      nextSeeding.push(rank);
      nextSeeding.push((currentGroup * 2) - 1 - rank);
    }
    seedingMap = nextSeeding;
    currentGroup *= 2;
  }

  const seededTeams: string[][] = [];
  for (const rank of seedingMap) {
    seededTeams.push(scheduleTeams[rank]);
  }

  if (type === 'single') {
    return generateSingleElimination(seededTeams, courtsCount);
  } else {
    return generateDoubleElimination(seededTeams, courtsCount);
  }
}

function generateSingleElimination(teams: string[][], courtsCount: number): GeneratedMatch[] {
  const totalStages = Math.ceil(Math.log2(teams.length));
  const matches: GeneratedMatch[] = [];
  let stageMatchesCount = teams.length / 2;
  
  for (let s = 1; s <= totalStages; s++) {
    for (let m = 0; m < stageMatchesCount; m++) {
      const isStage1 = s === 1;
      matches.push({
        team1: isStage1 ? teams[m * 2] : [],
        team2: isStage1 ? teams[m * 2 + 1] : [],
        stage: s,
        matchIndex: m,
        status: MatchStatus.PENDING,
        isSkeleton: !isStage1,
        court: (m % courtsCount) + 1,
        score1: 0, score2: 0, sets1: [], sets2: [],
        logicId: `p_s${s}_m${m}_u`, // 'p_' prefix for playoff
        isPlayoff: true,
        nextMatchId: s < totalStages ? `p_s${s + 1}_m${Math.floor(m / 2)}_u` : undefined
      });
    }
    stageMatchesCount /= 2;
  }
  return matches;
}

function generateDoubleElimination(teams: string[][], courtsCount: number): GeneratedMatch[] {
  // Re-use logic but with playoff prefix to avoid collisions if we ever mix them
  // For now, I'll just adapt the existing logic from tournamentLogic.ts but ensure prefixes
  const powerOf2 = teams.length;
  const matches: GeneratedMatch[] = [];
  const upperStages = Math.ceil(Math.log2(powerOf2));
  
  // 1. Upper Bracket
  let stageMatchesCount = powerOf2 / 2;
  for (let s = 1; s <= upperStages; s++) {
    for (let m = 0; m < stageMatchesCount; m++) {
      const isStage1 = s === 1;
      const matchId = `p_s${s}_m${m}_u`;
      const nextMatchId = s < upperStages ? `p_s${s + 1}_m${Math.floor(m / 2)}_u` : `p_gf_m0_u`;
      
      let losersMatchId = undefined;
      if (s === 1) {
        losersMatchId = `p_s1_m${Math.floor(m / 2)}_l`;
      } else if (s < upperStages) {
        losersMatchId = `p_s${(s - 1) * 2}_m${m}_l`;
      } else {
        losersMatchId = `p_s${(upperStages - 1) * 2}_m0_l`;
      }

      matches.push({
        team1: isStage1 ? teams[m * 2] : [],
        team2: isStage1 ? teams[m * 2 + 1] : [],
        stage: s,
        matchIndex: m,
        status: MatchStatus.PENDING,
        isSkeleton: !isStage1,
        court: (m % courtsCount) + 1,
        score1: 0, score2: 0, sets1: [], sets2: [],
        logicId: matchId,
        nextMatchId,
        losersMatchId,
        isPlayoff: true,
        isLosersBracket: false
      });
    }
    stageMatchesCount /= 2;
  }

  // 2. Lower Bracket
  const lowerStages = (upperStages - 1) * 2;
  stageMatchesCount = powerOf2 / 4; 

  for (let s = 1; s <= lowerStages; s++) {
    for (let m = 0; m < stageMatchesCount; m++) {
      const matchId = `p_s${s}_m${m}_l`;
      const isEven = s % 2 === 0;
      let nextMatchId = undefined;
      
      if (s < lowerStages) {
        if (isEven) {
          nextMatchId = `p_s${s + 1}_m${Math.floor(m / 2)}_l`;
        } else {
          nextMatchId = `p_s${s + 1}_m${m}_l`;
        }
      } else {
        nextMatchId = `p_gf_m0_l`;
      }

      matches.push({
        team1: [], team2: [],
        stage: s,
        matchIndex: m,
        status: MatchStatus.PENDING,
        isSkeleton: true,
        court: (m % courtsCount) + 1,
        score1: 0, score2: 0, sets1: [], sets2: [],
        logicId: matchId,
        nextMatchId,
        isPlayoff: true,
        isLosersBracket: true
      });
    }
    if (s % 2 === 0) {
      stageMatchesCount /= 2;
    }
  }

  // 3. Grand Final
  matches.push({
    team1: [], team2: [],
    stage: upperStages + 1,
    matchIndex: 0,
    status: MatchStatus.PENDING,
    isSkeleton: true,
    court: 1,
    score1: 0, score2: 0, sets1: [], sets2: [],
    logicId: `p_gf_m0_u`,
    nextMatchId: `p_gf_reset`,
    isPlayoff: true,
    isLosersBracket: false
  });

  // 4. Reset Match
  matches.push({
    team1: [], team2: [],
    stage: upperStages + 2,
    matchIndex: 0,
    status: MatchStatus.PENDING,
    isSkeleton: true,
    court: 1,
    score1: 0, score2: 0, sets1: [], sets2: [],
    logicId: `p_gf_reset`,
    isPlayoff: true,
    isLosersBracket: false
  });

  return matches;
}
