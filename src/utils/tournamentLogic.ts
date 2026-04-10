import { GameMode, MatchStatus, Player, Match } from '../types';

export interface GeneratedMatch {
  team1: string[];
  team2: string[];
  stage?: number;
  court?: number;
  isSkeleton?: boolean;
  status?: MatchStatus;
  matchIndex?: number;
  logicId?: string;
  nextMatchId?: string;
  losersMatchId?: string;
  isLosersBracket?: boolean;
  winner?: 1 | 2;
  score1?: number;
  score2?: number;
  sets1?: number[];
  sets2?: number[];
  serverIndex?: number;
  isPlayoff?: boolean;
  scoringMode?: string; // Using string to avoid circular dependency or import ScoringMode if needed
}

export function generateAmericanoMatches(
  mode: GameMode,
  players: Player[],
  numberOfMatches: number
): GeneratedMatch[] {
  const playerNames = players.map(p => p.name);
  const n = playerNames.length;
  const targetInitialMatches = numberOfMatches || Math.max(1, Math.floor((n * (n - 1)) / 4));
  
  const matchPairs: GeneratedMatch[] = [];
  const allPossiblePairs: [string, string][] = [];
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      allPossiblePairs.push([playerNames[i], playerNames[j]]);
    }
  }

  const playedMatches = new Set<string>();
  const pairUsageCount = new Map<string, number>();
  allPossiblePairs.forEach(p => pairUsageCount.set([...p].sort().join(','), 0));

  while (matchPairs.length < targetInitialMatches) {
    const sortedPairs = [...allPossiblePairs].sort((a, b) => 
      pairUsageCount.get([...a].sort().join(','))! - pairUsageCount.get([...b].sort().join(','))! || Math.random() - 0.5
    );

    let foundMatch = false;
    const playersUsedInThisRound = new Set<string>();
    for (let i = 0; i < sortedPairs.length; i++) {
      const p1 = sortedPairs[i];
      if (playersUsedInThisRound.has(p1[0]) || playersUsedInThisRound.has(p1[1])) continue;

      for (let j = i + 1; j < sortedPairs.length; j++) {
        const p2 = sortedPairs[j];
        if (playersUsedInThisRound.has(p2[0]) || playersUsedInThisRound.has(p2[1])) continue;
        
        const playersInMatch = new Set([...p1, ...p2]);
        if (playersInMatch.size !== 4) continue;
        
        const matchKey = [...p1].sort().join(',') + ' vs ' + [...p2].sort().join(',');
        const reverseMatchKey = [...p2].sort().join(',') + ' vs ' + [...p1].sort().join(',');
        
        if (playedMatches.has(matchKey) || playedMatches.has(reverseMatchKey)) continue;
        
        matchPairs.push({ team1: p1, team2: p2 });
        playedMatches.add(matchKey);
        pairUsageCount.set([...p1].sort().join(','), pairUsageCount.get([...p1].sort().join(','))! + 1);
        pairUsageCount.set([...p2].sort().join(','), pairUsageCount.get([...p2].sort().join(','))! + 1);
        playersUsedInThisRound.add(p1[0]);
        playersUsedInThisRound.add(p1[1]);
        playersUsedInThisRound.add(p2[0]);
        playersUsedInThisRound.add(p2[1]);
        foundMatch = true;
        break;
      }
      if (foundMatch) break;
    }
    
    if (!foundMatch) break;
  }
  
  return matchPairs;
}

export function generateMixAmericanoMatches(
  players: Player[],
  numberOfMatches?: number
): GeneratedMatch[] {
  const men = players.filter(p => p.gender === 'man').map(p => p.name);
  const women = players.filter(p => p.gender === 'woman').map(p => p.name);
  const n = Math.min(men.length, women.length);
  
  const fixedTeams: string[][] = [];
  for (let i = 0; i < n; i++) {
    fixedTeams.push([men[i], women[i]]);
  }

  const numTeams = fixedTeams.length;
  const stages = numTeams % 2 === 0 ? numTeams - 1 : numTeams;
  const totalPossibleStages = numberOfMatches || stages;
  
  const matchPairs: GeneratedMatch[] = [];
  for (let s = 0; s < totalPossibleStages; s++) {
    const stageTeams = [...fixedTeams];
    if (numTeams % 2 !== 0) stageTeams.push(['BYE']);
    
    const rotatingTeams = stageTeams.slice(1);
    const rotation = s % rotatingTeams.length;
    const currentRotation = [
      stageTeams[0],
      ...rotatingTeams.slice(rotatingTeams.length - rotation),
      ...rotatingTeams.slice(0, rotatingTeams.length - rotation)
    ];

    for (let i = 0; i < currentRotation.length / 2; i++) {
      const t1 = currentRotation[i];
      const t2 = currentRotation[currentRotation.length - 1 - i];
      if (t1[0] !== 'BYE' && t2[0] !== 'BYE' && t1.length > 0 && t2.length > 0) {
        matchPairs.push({ 
          team1: t1, 
          team2: t2, 
          stage: s + 1,
          score1: 0,
          score2: 0,
          sets1: [],
          sets2: [],
          status: MatchStatus.PENDING,
          serverIndex: 0
        });
      }
    }
  }
  return matchPairs;
}

export function generateTeamMatches(
  processedPlayers: Player[],
  mode: GameMode
): GeneratedMatch[] {
  const teams: string[][] = [];
  for (let i = 0; i < processedPlayers.length; i += 2) {
    if (i + 1 < processedPlayers.length) {
      teams.push([processedPlayers[i].name, processedPlayers[i+1].name]);
    }
  }
  
  // Shuffle teams for randomization
  for (let i = teams.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [teams[i], teams[j]] = [teams[j], teams[i]];
  }

  const matchPairs: GeneratedMatch[] = [];
  
  if (mode === GameMode.TEAM_AMERICANO || mode === GameMode.ROUND_ROBIN || mode === GameMode.SWISS_SYSTEM) {
    const numTeams = teams.length;
    const isOdd = numTeams % 2 !== 0;
    const scheduleTeams = isOdd ? [...teams, ['BYE', 'BYE']] : [...teams];
    const n = scheduleTeams.length;
    
    for (let i = 0; i < n / 2; i++) {
      const t1 = scheduleTeams[i];
      const t2 = scheduleTeams[n - 1 - i];
      if (t1[0] !== 'BYE' && t2[0] !== 'BYE') {
        matchPairs.push({ team1: t1, team2: t2 });
      }
    }
  } else {
    // TEAM_MEXICANO, SWISS_SYSTEM default first stage
    for (let i = 0; i < teams.length; i += 2) {
      if (i + 1 < teams.length) {
        matchPairs.push({ team1: teams[i], team2: teams[i+1] });
      }
    }
  }
  return matchPairs;
}

export function generateMixedMexicanoStage1(players: Player[]): GeneratedMatch[] {
  const men = players.filter(p => p.gender === 'man').map(p => p.name);
  const women = players.filter(p => p.gender === 'woman').map(p => p.name);
  const n = Math.min(men.length, women.length);
  const matchesPerStage = Math.floor(n / 2);
  
  const shuffledMen = [...men].sort(() => Math.random() - 0.5);
  const shuffledWomen = [...women].sort(() => Math.random() - 0.5);
  
  const matchPairs: GeneratedMatch[] = [];
  for (let i = 0; i < matchesPerStage; i++) {
    const t1 = [shuffledMen[i * 2], shuffledWomen[i * 2]];
    const t2 = [shuffledMen[i * 2 + 1], shuffledWomen[i * 2 + 1]];
    matchPairs.push({ 
      team1: t1, 
      team2: t2, 
      stage: 1,
      score1: 0,
      score2: 0,
      sets1: [],
      sets2: [],
      status: MatchStatus.PENDING
    });
  }
  return matchPairs;
}

export function generateNextStageMatches(
  tournament: any,
  matches: Match[],
  leaderboard: any[]
): GeneratedMatch[] {
  const currentStage = tournament.currentStage || 1;
  const nextStage = currentStage + 1;
  const matchPairs: GeneratedMatch[] = [];
  const courtsCount = tournament.courtsCount || 1;
  
  const sortedPlayers = [...leaderboard]
    .sort((a, b) => a.matchesPlayed - b.matchesPlayed || (b.pointsFor + b.missedPoints) - (a.pointsFor + a.missedPoints))
    .map(s => s.name);

  if (tournament.mode === GameMode.SUPER_MEXICANO || 
      (tournament.mode === GameMode.MEXICANO && currentStage >= 1) || 
      (tournament.mode === GameMode.TEAM_MEXICANO && currentStage >= 1) ||
      (tournament.mode === GameMode.KATAPGAMA_FUN_PADEL && currentStage === 1)) {
    const playedPairs = new Set<string>();
    matches.forEach(m => {
      playedPairs.add([...m.team1].sort().join(','));
      playedPairs.add([...m.team2].sort().join(','));
    });

    const isTeamMode = tournament.isKatapgama || tournament.mode.includes('Team');
    const divisor = isTeamMode ? 2 : 4;
    const targetMatches = Math.floor(sortedPlayers.length / divisor);
    const tempStats = new Map<string, number>();
    
    sortedPlayers.forEach(p => {
      const s = leaderboard.find(ls => ls.name === p);
      tempStats.set(p, s?.matchesPlayed || 0);
    });

    const getTeamMembers = (teamName: string): string[] => {
      const members = tournament.players
        .filter((p: any) => p.teamName === teamName || p.name === teamName)
        .map((p: any) => p.name);
      return members.length > 0 ? members : [teamName];
    };

    for (let m = 0; m < targetMatches; m++) {
      const availableItems = sortedPlayers
        .filter(p => !matchPairs.some(mp => {
          if (isTeamMode) {
            return mp.logicId === p || mp.team1.includes(p) || mp.team2.includes(p); // logicId is team name for team modes
          }
          return mp.team1.includes(p) || mp.team2.includes(p);
        }))
        .sort((a, b) => tempStats.get(a)! - tempStats.get(b)! || (leaderboard.find(ls => ls.name === b)?.pointsFor || 0) - (leaderboard.find(ls => ls.name === a)?.pointsFor || 0));

      if (isTeamMode) {
        if (availableItems.length < 2) break;
        const t1Name = availableItems[0];
        const t2Name = availableItems[1];
        
        matchPairs.push({ 
          team1: getTeamMembers(t1Name), 
          team2: getTeamMembers(t2Name), 
          stage: nextStage, 
          court: (m % courtsCount) + 1,
          logicId: t1Name // storing team name as logicId for tracking
        });
        
        tempStats.set(t1Name, tempStats.get(t1Name)! + 1);
        tempStats.set(t2Name, tempStats.get(t2Name)! + 1);
      } else {
        if (availableItems.length < 4) break;

        const p1 = availableItems[0];
        const p2 = availableItems[1];
        const p3 = availableItems[2];
        const p4 = availableItems[3];

        const options = [
          { t1: [p1, p4], t2: [p2, p3] },
          { t1: [p1, p3], t2: [p2, p4] },
          { t1: [p1, p2], t2: [p3, p4] }
        ];

        let selected = options[0];
        // Try to find a pairing that hasn't played together recently
        for (const opt of options) {
          if (!playedPairs.has([...opt.t1].sort().join(',')) && !playedPairs.has([...opt.t2].sort().join(','))) {
            selected = opt;
            break;
          }
        }

        matchPairs.push({ team1: selected.t1, team2: selected.t2, stage: nextStage, court: (m % courtsCount) + 1 });
        selected.t1.forEach(p => tempStats.set(p, tempStats.get(p)! + 1));
        selected.t2.forEach(p => tempStats.set(p, tempStats.get(p)! + 1));
      }
    }
  } else if (tournament.mode === GameMode.MIXED_MEXICANO) {
    const men = tournament.players.filter((p: any) => p.gender === 'man');
    const women = tournament.players.filter((p: any) => p.gender === 'woman');
    
    const sortPlayers = (players: Player[]) => [...players].sort((a, b) => {
      const statsA = leaderboard.find(s => s.name === a.name);
      const statsB = leaderboard.find(s => s.name === b.name);
      return (statsA?.matchesPlayed || 0) - (statsB?.matchesPlayed || 0) || 
             ((statsB?.pointsFor || 0) + (statsB?.missedPoints || 0)) - ((statsA?.pointsFor || 0) + (statsA?.missedPoints || 0));
    });

    const sortedMen = sortPlayers(men);
    const sortedWomen = sortPlayers(women);

    const targetMatches = Math.min(Math.floor(sortedMen.length / 2), Math.floor(sortedWomen.length / 2));
    for (let i = 0; i < targetMatches; i++) {
      matchPairs.push({ 
        team1: [sortedMen[i * 2].name, sortedWomen[i * 2].name], 
        team2: [sortedMen[i * 2 + 1].name, sortedWomen[i * 2 + 1].name],
        stage: nextStage,
        court: (i % courtsCount) + 1
      });
    }
  } else if (tournament.mode === GameMode.SWISS_SYSTEM) {
    const teams: string[][] = [];
    for (let i = 0; i < tournament.players.length; i += 2) {
      if (i + 1 < tournament.players.length) {
        teams.push([tournament.players[i].name, tournament.players[i + 1].name]);
      }
    }
    const teamStats = teams.map(t => {
      const teamKey = t.sort().join(' & ');
      const stat = leaderboard.find(s => s.name === teamKey) || { wins: 0, pointsFor: 0, pointsAgainst: 0, matchesPlayed: 0, missedPoints: 0 };
      return { name: t, stats: stat };
    });
    const sortedTeams = teamStats.sort((a, b) => 
      (b.stats.wins) - (a.stats.wins) || 
      ((b.stats.pointsFor + b.stats.missedPoints) - b.stats.pointsAgainst) - ((a.stats.pointsFor + a.stats.missedPoints) - a.stats.pointsAgainst)
    );
    const targetMatches = Math.floor(sortedTeams.length / 2);
    for (let i = 0; i < targetMatches; i++) {
      matchPairs.push({ team1: sortedTeams[i * 2].name, team2: sortedTeams[i * 2 + 1].name, stage: nextStage, court: (i % courtsCount) + 1 });
    }
  } else if (tournament.mode === GameMode.NORMAL_AMERICANO) {
    // Generate Stage 1 as a baseline for rotations if matches is empty, but here matches shouldn't be empty
    const playerNames = tournament.players.map((p: any) => p.name);
    const n = playerNames.length;
    
    const playedMatches = new Set<string>();
    const pairUsageCount = new Map<string, number>();
    playerNames.forEach((p: string) => {
      for(let j=0; j<playerNames.length; j++) {
        if (p !== playerNames[j]) pairUsageCount.set([p, playerNames[j]].sort().join(','), 0);
      }
    });

    matches.forEach(m => {
      pairUsageCount.set([...m.team1].sort().join(','), (pairUsageCount.get([...m.team1].sort().join(',')) || 0) + 1);
      pairUsageCount.set([...m.team2].sort().join(','), (pairUsageCount.get([...m.team2].sort().join(',')) || 0) + 1);
    });

    const targetMatches = Math.floor(n / 4);
    const playersUsed = new Set<string>();

    for (let m = 0; m < targetMatches; m++) {
      const available = playerNames.filter((p: string) => !playersUsed.has(p));
      if (available.length < 4) break;

      // Simple rotation: sort by matches played
      available.sort((a: string, b: string) => 
        (leaderboard.find(s => s.name === a)?.matchesPlayed || 0) - (leaderboard.find(s => s.name === b)?.matchesPlayed || 0) || Math.random() - 0.5
      );

      const p1 = available[0];
      const others = available.slice(1);
      
      // Find partner for p1 (least played together)
      others.sort((a: string, b: string) => 
        (pairUsageCount.get([p1, a].sort().join(',')) || 0) - (pairUsageCount.get([p1, b].sort().join(',')) || 0) || Math.random() - 0.5
      );
      const p2 = others[0];
      
      const rest = others.slice(1);
      const p3 = rest[0];
      // Find partner for p3
      const rest2 = rest.slice(1);
      rest2.sort((a: string, b: string) => 
        (pairUsageCount.get([p3, a].sort().join(',')) || 0) - (pairUsageCount.get([p3, b].sort().join(',')) || 0) || Math.random() - 0.5
      );
      const p4 = rest2[0];

      matchPairs.push({ team1: [p1, p2], team2: [p3, p4], stage: nextStage, court: (m % courtsCount) + 1 });
      playersUsed.add(p1); playersUsed.add(p2); playersUsed.add(p3); playersUsed.add(p4);
    }
  } else if (tournament.mode === GameMode.TEAM_AMERICANO || tournament.mode === GameMode.ROUND_ROBIN) {
    const teams = [];
    for (let i = 0; i < tournament.players.length; i += 2) {
      if (i + 1 < tournament.players.length) teams.push([tournament.players[i].name, tournament.players[i+1].name]);
    }
    const numTeams = teams.length;
    const isOdd = numTeams % 2 !== 0;
    const scheduleTeams = isOdd ? [...teams, ['BYE', 'BYE']] : [...teams];
    const n = scheduleTeams.length;
    
    // Rotate for nextStage
    for (let r = 0; r < nextStage - 1; r++) {
      const last = scheduleTeams.pop()!;
      scheduleTeams.splice(1, 0, last);
    }
    
    const targetMatches = Math.floor(n / 2);
    for (let i = 0; i < targetMatches; i++) {
      const t1 = scheduleTeams[i]; 
      const t2 = scheduleTeams[n - 1 - i];
      if (t1[0] !== 'BYE' && t2[0] !== 'BYE') {
        matchPairs.push({ team1: t1, team2: t2, stage: nextStage, court: (i % courtsCount) + 1 });
      }
    }
  } else if (tournament.mode === GameMode.MIX_AMERICANO) {
    const allMatches = generateMixAmericanoMatches(tournament.players, nextStage);
    // Filter only matches for the target nextStage
    const nextStageMatches = allMatches.filter(m => m.stage === nextStage);
    
    // Assign courts
    matchPairs.push(...nextStageMatches.map((m, i) => ({
      ...m,
      court: (i % courtsCount) + 1,
      score1: 0,
      score2: 0,
      sets1: [],
      sets2: [],
      status: MatchStatus.PENDING,
      serverIndex: 0
    })));
  }
  
  return matchPairs;
}

export function generateInitialMatches(
  mode: GameMode,
  players: Player[],
  courtsCount: number,
  numberOfMatches?: number,
  swissPools?: number
): GeneratedMatch[] {
  if (mode === GameMode.SINGLE_ELIMINATION || mode === GameMode.DOUBLE_ELIMINATION) {
    const teams: string[][] = [];
    for (let i = 0; i < players.length; i += 2) {
      if (i + 1 < players.length) {
        teams.push([players[i].name, players[i+1].name]);
      }
    }
    
    if (mode === GameMode.SINGLE_ELIMINATION) {
      return generateSingleEliminationMatches(teams, courtsCount);
    } else {
      return generateDoubleEliminationMatches(teams, courtsCount);
    }
  }

  // FIXED SCHEDULE MODES: Generate ALL matches (Option A)
  let initialMatches: GeneratedMatch[] = [];

  if (mode === GameMode.NORMAL_AMERICANO) {
    // Generate full round-robin by partners
    initialMatches = generateAmericanoMatches(mode, players, numberOfMatches || (players.length * (players.length - 1)) / 4);
  } else if (mode === GameMode.MIX_AMERICANO) {
    // Already generates all stages by default if numberOfMatches is not passed
    initialMatches = generateMixAmericanoMatches(players, numberOfMatches);
  } else if (mode === GameMode.TEAM_AMERICANO || mode === GameMode.ROUND_ROBIN) {
    // Generate full round-robin by teams
    initialMatches = generateTeamMatches(players, mode);
  } else if (mode === GameMode.MIXED_MEXICANO) {
    initialMatches = generateMixedMexicanoStage1(players);
  } else if (mode === GameMode.MEXICANO || mode === GameMode.SUPER_MEXICANO || mode === GameMode.TEAM_MEXICANO) {
    const teams: string[][] = [];
    for (let i = 0; i < players.length; i += 2) {
      if (i + 1 < players.length) teams.push([players[i].name, players[i+1].name]);
    }
    const shuffled = [...teams].sort(() => Math.random() - 0.5);
    for (let i = 0; i < shuffled.length - 1; i += 2) {
      initialMatches.push({ team1: shuffled[i], team2: shuffled[i+1], stage: 1 });
    }
  } else if (mode === GameMode.SWISS_SYSTEM) {
    const allMatches = generateTeamMatches(players, mode);
    const matchesPerStage = Math.floor(players.length / 4);
    initialMatches = allMatches.slice(0, Math.max(1, matchesPerStage));
  } else if (mode === GameMode.KATAPGAMA_FUN_PADEL) {
    return generateKatapgamaQualifier(players, courtsCount).map((m, i) => ({
      ...m,
      id: `q_k_${i}`,
      tournamentId: '',
      isPlayoff: false,
      score1: 0, score2: 0, points1: 0, points2: 0,
      sets1: [], sets2: [], serverIndex: 0
    }));
  }

  // Assign courts and Stage 1 for any matches that don't have them
  return (mode === GameMode.SWISS_SYSTEM || mode === GameMode.NORMAL_AMERICANO || mode === GameMode.MIX_AMERICANO || mode === GameMode.TEAM_AMERICANO || mode === GameMode.ROUND_ROBIN || mode === GameMode.MIXED_MEXICANO || mode === GameMode.MEXICANO || mode === GameMode.SUPER_MEXICANO || mode === GameMode.TEAM_MEXICANO) ? 
    initialMatches.map((m, i) => ({ 
      ...m, 
      id: `q_s${m.stage}_m${i}`, 
      tournamentId: '',
      isPlayoff: false,
      score1: m.score1 ?? 0,
      score2: m.score2 ?? 0,
      points1: 0,
      points2: 0,
      sets1: m.sets1 ?? [],
      sets2: m.sets2 ?? [],
      serverIndex: 0
    })) : 
    initialMatches.map((m, i) => ({ 
      ...m, 
      id: `m_${i}`, 
      tournamentId: '',
      isPlayoff: false,
      score1: 0,
      score2: 0,
      points1: 0,
      points2: 0,
      sets1: [],
      sets2: [],
      serverIndex: 0
    }));
}

function generateSingleEliminationMatches(teams: string[][], courtsCount: number): GeneratedMatch[] {
  const powerOf2 = Math.pow(2, Math.ceil(Math.log2(teams.length)));
  const scheduleTeams = [...teams];
  const byes = powerOf2 - teams.length;
  for (let i = 0; i < byes; i++) {
    scheduleTeams.push(['BYE', 'BYE']);
  }

  const totalStages = Math.ceil(Math.log2(powerOf2));
  const matches: GeneratedMatch[] = [];
  let stageMatchesCount = powerOf2 / 2;
  
  for (let s = 1; s <= totalStages; s++) {
    for (let m = 0; m < stageMatchesCount; m++) {
      const isStage1 = s === 1;
      matches.push({
        team1: isStage1 ? scheduleTeams[m * 2] : [],
        team2: isStage1 ? scheduleTeams[m * 2 + 1] : [],
        stage: s,
        matchIndex: m,
        status: MatchStatus.PENDING,
        isSkeleton: !isStage1,
        court: (m % courtsCount) + 1,
        score1: 0, score2: 0, sets1: [], sets2: [],
        serverIndex: 0,
        logicId: `s${s}_m${m}_u`,
        nextMatchId: s < totalStages ? `s${s + 1}_m${Math.floor(m / 2)}_u` : undefined
      });
    }
    stageMatchesCount /= 2;
  }
  return matches;
}

function generateDoubleEliminationMatches(teams: string[][], courtsCount: number): GeneratedMatch[] {
  // Use powers of 2 for the bracket
  const powerOf2 = Math.pow(2, Math.ceil(Math.log2(teams.length)));
  const scheduleTeams = [...teams];
  const byes = powerOf2 - teams.length;
  for (let i = 0; i < byes; i++) {
    scheduleTeams.push(['BYE', 'BYE']);
  }

  const matches: GeneratedMatch[] = [];
  const upperStages = Math.ceil(Math.log2(powerOf2));
  
  // 1. Upper Bracket
  let stageMatchesCount = powerOf2 / 2;
  for (let s = 1; s <= upperStages; s++) {
    for (let m = 0; m < stageMatchesCount; m++) {
      const isStage1 = s === 1;
      const matchId = `s${s}_m${m}_u`;
      const nextMatchId = s < upperStages ? `s${s + 1}_m${Math.floor(m / 2)}_u` : `gf_m0_u`;
      
      // Map losers from Upper Bracket to Lower Bracket
      // Standard mapping:
      // U_S1 losers -> L_S1
      // U_S2 losers -> L_S2
      // etc.
      let losersMatchId = undefined;
      if (s === 1) {
        losersMatchId = `s1_m${Math.floor(m / 2)}_l`;
      } else if (s < upperStages) {
        losersMatchId = `s${(s - 1) * 2}_m${m}_l`;
      } else {
        // Upper Final loser goes to Lower Final
        losersMatchId = `s${(upperStages - 1) * 2}_m0_l`;
      }

      matches.push({
        team1: isStage1 ? scheduleTeams[m * 2] : [],
        team2: isStage1 ? scheduleTeams[m * 2 + 1] : [],
        stage: s,
        matchIndex: m,
        status: MatchStatus.PENDING,
        isSkeleton: !isStage1,
        court: (m % courtsCount) + 1,
        score1: 0, score2: 0, sets1: [], sets2: [],
        serverIndex: 0,
        logicId: matchId,
        nextMatchId,
        losersMatchId,
        isLosersBracket: false
      });
    }
    stageMatchesCount /= 2;
  }

  // 2. Lower Bracket
  // Lower bracket has roughly 2x stages of upper bracket minus 1 or 2
  const lowerStages = (upperStages - 1) * 2;
  stageMatchesCount = powerOf2 / 4; // Start with half of Upper Stage 1 matches

  for (let s = 1; s <= lowerStages; s++) {
    for (let m = 0; m < stageMatchesCount; m++) {
      const matchId = `s${s}_m${m}_l`;
      const isEven = s % 2 === 0;
      let nextMatchId = undefined;
      
      if (s < lowerStages) {
        if (isEven) {
          nextMatchId = `s${s + 1}_m${Math.floor(m / 2)}_l`;
        } else {
          nextMatchId = `s${s + 1}_m${m}_l`;
        }
      } else {
        nextMatchId = `gf_m0_l`;
      }

      matches.push({
        team1: [], team2: [],
        stage: s,
        matchIndex: m,
        status: MatchStatus.PENDING,
        isSkeleton: true,
        court: (m % courtsCount) + 1,
        score1: 0, score2: 0, sets1: [], sets2: [],
        serverIndex: 0,
        logicId: matchId,
        nextMatchId,
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
    serverIndex: 0,
    logicId: `gf_m0_u`,
    nextMatchId: `gf_reset`,
    isLosersBracket: false
  });

  // 4. Reset Match (if needed)
  matches.push({
    team1: [], team2: [],
    stage: upperStages + 2,
    matchIndex: 0,
    status: MatchStatus.PENDING,
    isSkeleton: true,
    court: 1,
    score1: 0, score2: 0, sets1: [], sets2: [],
    serverIndex: 0,
    logicId: `gf_reset`,
    isLosersBracket: false
  });

  return matches;
}

export function generateKatapgamaQualifier(players: Player[], courtsCount: number): GeneratedMatch[] {
  const teams: string[][] = [];
  for (let i = 0; i < players.length; i += 2) {
    if (i + 1 < players.length) {
      teams.push([players[i].name, players[i+1].name]);
    }
  }

  // Shuffle teams for initial randomization
  const shuffledTeams = [...teams].sort(() => Math.random() - 0.5);
  const matches: GeneratedMatch[] = [];

  // Round 1 (8 matches) - Everyone plays once
  for (let i = 0; i < 8; i++) {
    matches.push({
      team1: shuffledTeams[i * 2],
      team2: shuffledTeams[i * 2 + 1],
      stage: 1,
      court: (i % courtsCount) + 1,
      status: MatchStatus.PENDING,
      score1: 0, score2: 0, sets1: [], sets2: []
    });
  }

  return matches;
}
