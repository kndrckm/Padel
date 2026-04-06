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
  [GameMode.MIXED_MEXICANO]: "Dynamic mixed matchmaking based on leaderboard rankings."
};

export const MATCH_DURATION = 20; // minutes
export const DEFAULT_POINTS = 24;
