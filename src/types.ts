export enum GameMode {
  SINGLE_ELIMINATION = 'Single Elimination',
  NORMAL_AMERICANO = 'Normal Americano',
  MIX_AMERICANO = 'Mix Americano',
  MEXICANO = 'Mexicano',
  MIXICANO = 'Mixicano',
  SUPER_MEXICANO = 'Super Mexicano',
  TEAM_AMERICANO = 'Team Americano',
  TEAM_MEXICANO = 'Team Mexicano',
}

export enum MatchStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in-progress',
  COMPLETED = 'completed',
}

export interface Player {
  name: string;
  gender?: 'man' | 'woman';
}

export interface Tournament {
  id?: string;
  name: string;
  mode: GameMode;
  creatorId: string;
  status: 'active' | 'completed';
  createdAt: string;
  players: Player[];
  currentRound?: number;
  courtsCount: number;
  pointsToPlay: number;
}

export interface Match {
  id?: string;
  tournamentId: string;
  team1: string[];
  team2: string[];
  score1: number; // current games in current set
  score2: number;
  sets1: number[]; // completed sets
  sets2: number[];
  serverIndex: number; // 0-3
  status: MatchStatus;
  winner?: 1 | 2;
  round?: number;
  court?: number;
}

export interface PlayerStats {
  name: string;
  wins: number;
  losses: number;
  pointsFor: number;
  pointsAgainst: number;
}

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}
