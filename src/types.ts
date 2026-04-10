export enum GameMode {
  SINGLE_ELIMINATION = 'Single Elimination',
  DOUBLE_ELIMINATION = 'Double Elimination',
  ROUND_ROBIN = 'Round Robin',
  SWISS_SYSTEM = 'Swiss System',
  NORMAL_AMERICANO = 'Normal Americano',
  MIX_AMERICANO = 'Mix Americano',
  MEXICANO = 'Mexicano',
  SUPER_MEXICANO = 'Super Mexicano',
  TEAM_AMERICANO = 'Team Americano',
  TEAM_MEXICANO = 'Team Mexicano',
  MIXED_MEXICANO = 'Mixed Mexicano',
  MIXED = 'Mixed',
  KATAPGAMA_FUN_PADEL = 'Katapgama Fun Padel',
}

export enum ScoringMode {
  AMERICANO = 'americano',
  TENNIS = 'tennis',
}

export enum MatchStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in-progress',
  COMPLETED = 'completed',
}

export interface Player {
  name: string;
  gender?: 'man' | 'woman';
  teamName?: string;
}

export interface TournamentSettings {
  scoringMode: ScoringMode;
  pointsToPlay: number;
  setsToPlay: number;
  gamesPerSet: number;
  useGoldenPoint: boolean;
}

export interface Tournament {
  id?: string;
  name: string;
  mode: GameMode;
  creatorId: string;
  status: 'active' | 'completed';
  createdAt: string;
  players: Player[];
  currentStage?: number;
  courtsCount: number;
  pointsToPlay: number;
  numberOfMatches?: number;
  matchesPerStage?: number;
  swissPools?: number;
  playoffTeams?: number;
  playoffType?: 'single' | 'double';
  scoringMode?: ScoringMode;
  qualifierMode?: GameMode;
  playoffMode?: GameMode;
  playoffStarted?: boolean;
  advancingTeams?: string[][]; // Array of teams (names) advancing to playoff
  advancingTeamsCount?: number;
  setsToPlay?: number; // 1, 3, 5
  gamesPerSet?: number; // 4, 6
  useGoldenPoint?: boolean;
  qualifierSettings?: TournamentSettings;
  playoffSettings?: TournamentSettings;
  isKatapgama?: boolean;
}

export interface Match {
  id?: string;
  tournamentId: string;
  team1: string[];
  team2: string[];
  score1: number; // current games in current set
  score2: number;
  points1?: string | number; // For tennis: 0, 15, 30, 40, Ad
  points2?: string | number;
  sets1: number[]; // completed sets
  sets2: number[];
  isTiebreak?: boolean;
  scoringMode?: ScoringMode;
  serverIndex: number; // 0-3
  status: MatchStatus;
  winner?: 1 | 2;
  stage?: number;
  court?: number;
  matchIndex?: number;
  logicId?: string;
  nextMatchId?: string;
  losersMatchId?: string;
  isLosersBracket?: boolean;
  isSkeleton?: boolean;
  isPlayoff?: boolean;
  deleted?: boolean;
  setsToPlay?: number;
  gamesPerSet?: number;
  useGoldenPoint?: boolean;
  pointsToPlay?: number;
}

export interface PlayerStats {
  name: string;
  wins: number;
  losses: number;
  ties: number;
  pointsFor: number;
  pointsAgainst: number;
  missedPoints: number;
  matchesPlayed: number;
}

export interface PredefinedPlayer {
  id?: string;
  name: string;
  gender?: 'man' | 'woman';
}

export interface PredefinedTeam {
  id?: string;
  name: string;
  player1: string;
  player2: string;
}

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}
