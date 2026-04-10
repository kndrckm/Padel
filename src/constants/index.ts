import { GameMode } from '../types';

export const MODE_DESCRIPTIONS: Record<GameMode, string> = {
  [GameMode.SINGLE_ELIMINATION]: "Knockout format where the winner advances and the loser is eliminated.",
  [GameMode.DOUBLE_ELIMINATION]: "A knockout format where you must lose two matches to be eliminated.",
  [GameMode.ROUND_ROBIN]: "A mix of Swiss stage followed by a playoff bracket (Single or Double Elimination).",
  [GameMode.SWISS_SYSTEM]: "Non-eliminating format where you play opponents with a similar win/loss record.",
  [GameMode.NORMAL_AMERICANO]: "All players play with everyone else exactly one time.",
  [GameMode.MIX_AMERICANO]: "Teams are drawn with one woman and one man. Requires equal gender distribution (max 24 players).",
  [GameMode.MEXICANO]: "Starts with an Americano qualifier stage, then switches to dynamic Mexicano matchmaking.",
  [GameMode.SUPER_MEXICANO]: "Like Mexicano but with extra points awarded for playing on (or closer to) the winning court.",
  [GameMode.TEAM_AMERICANO]: "Fixed teams play against all other teams exactly one time.",
  [GameMode.TEAM_MEXICANO]: "Mexicano format played with fixed teams.",
  [GameMode.MIXED_MEXICANO]: "Dynamic mixed matchmaking based on leaderboard rankings.",
  [GameMode.MIXED]: "A qualifier stage (any mode) followed by a playoff bracket stage.",
  [GameMode.KATAPGAMA_FUN_PADEL]: "Qualifier stage (16 pts) followed by Playoff (Tennis scoring). Fixed 16 teams."
};

export const MATCH_DURATION = 20; // minutes
export const DEFAULT_POINTS = 24;

export const KATAPGAMA_TEAMS = [
  { name: 'Ario Budi', partner: 'Prilnali Eka Putra', teamName: 'TEAM 1' },
  { name: 'Nurcholis', partner: 'Nizar Amar', teamName: 'TEAM 2' },
  { name: 'Faiza', partner: 'Brigita Stella', teamName: 'TEAM 3' },
  { name: 'Bagus Samsu', partner: 'Basuki Firmanto', teamName: 'TEAM 4' },
  { name: 'Ardiansyah Reza', partner: 'Eridani Sindoro', teamName: 'TEAM 5' },
  { name: 'Muhammad Ilmy', partner: 'Rafiza Citra', teamName: 'TEAM 6' },
  { name: 'Aina N', partner: 'Lintang', teamName: 'TEAM 7' },
  { name: 'Kunto Harjoko', partner: 'Iwan Baroto', teamName: 'TEAM 8' },
  { name: 'Ari Abdya', partner: 'Om Piet (Budiarto)', teamName: 'TEAM 9' },
  { name: 'Andri Pancoro', partner: 'Kuswan Faktrie', teamName: 'TEAM 10' },
  { name: 'Hakim', partner: 'Farhan Hariri', teamName: 'TEAM 11' },
  { name: 'Barry', partner: 'Maya', teamName: 'TEAM 12' },
  { name: 'Reza', partner: 'Azriel Kevin', teamName: 'TEAM 13' },
  { name: 'Cecep', partner: 'Ratna Agtasari', teamName: 'TEAM 14' },
  { name: 'Gayuh', partner: 'Tia', teamName: 'TEAM 15' },
  { name: 'Dwi Rendra Jaya', partner: 'Putri', teamName: 'TEAM 16' }
];
